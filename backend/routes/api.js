const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticate } = require('../middleware/auth');
const { userLimiter, apiKeyLimiter } = require('../middleware/rate-limiter');
const { countMessageTokens, countTextTokens } = require('../utils/token-counter');
const vendorRouter = require('./vendor-router');
const billingService = require('../services/billing-service');

// 对核心 API 路由应用限流
router.use('/chat/completions', userLimiter);
router.use('/chat/completions', apiKeyLimiter);

// ─── 模型列表 ─────────────────────────────────────────
router.get('/models', authenticate, (req, res) => {
  db.all(`SELECT 
    m.alias, 
    m.vendor_model_id, 
    m.input_price, 
    m.output_price, 
    m.status,
    v.vendor_name
  FROM model_mappings m 
  JOIN vendor_configs v ON m.vendor_id = v.id`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json({ data: rows });
  });
});

// ─── 核心对话接口 ────────────────────────────────────────
router.post('/chat/completions', authenticate, async (req, res) => {
  const startTime = Date.now();
  const { model, messages, stream = false } = req.body;

  if (!model || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request: model and messages are required' });
  }

  db.get(`SELECT 
    m.*, 
    v.api_base_url, 
    v.api_key, 
    v.api_secret,
    v.vendor_name,
    v.adapter_key
  FROM model_mappings m 
  JOIN vendor_configs v ON m.vendor_id = v.id 
  WHERE m.alias = ?`, [model], async (err, modelMapping) => {
    if (err || !modelMapping) {
      return res.status(404).json({ error: `Model ${model} not found` });
    }

    if (modelMapping.status !== 'available') {
      return res.status(400).json({ error: `Model ${model} is not available` });
    }

    // ═══ 流式路径：vendor-router.streamRoute() ═══
    // 先等厂商连接成功再写 SSE 头，连接失败可无损切换下一个厂商
    if (stream) {
      // 预估余额检查（防止无谓消耗厂商资源）
      const estInput  = countMessageTokens(messages);
      const estOutput = req.body.max_tokens || 500;
      const estCost   = (estInput * modelMapping.input_price + estOutput * modelMapping.output_price) / 1000;
      if (req.user.balance < estCost) {
        return res.status(402).json({
          error: '余额不足，请充值后重试',
          code: 'INSUFFICIENT_BALANCE',
          required: Math.ceil(estCost * 10000) / 10000,
          balance: req.user.balance,
        });
      }

      try {
        const streamResult = await vendorRouter.streamRoute(modelMapping, messages, req.body, res);
        // streamRoute 内部已完成 SSE 推送和 res.end()
        const duration = Date.now() - startTime;
        await billingService.recordUsage(
          req.user.id, req.apiKey.id, model,
          streamResult.inputTokens, streamResult.outputTokens,
          (streamResult.inputTokens * modelMapping.input_price + streamResult.outputTokens * modelMapping.output_price) / 1000,
          duration,
          streamResult.vendorKey
        );
        return;
      } catch (streamErr) {
        console.error('[API] 流式路由失败:', streamErr.message);

        if (res.headersSent) {
          return; // 已发送 SSE 头，streamRoute 内部已处理结束
        }

        // 未发送头 → 尝试非流式厂商路由，成功后伪流式推送
        try {
          const fallbackResp = await vendorRouter.route(modelMapping, messages, req.body);
          const content = fallbackResp.choices?.[0]?.message?.content || '';
          const inTok   = fallbackResp.usage?.prompt_tokens     || countMessageTokens(messages);
          const outTok  = fallbackResp.usage?.completion_tokens || countTextTokens(content);
          const cost    = (inTok * modelMapping.input_price + outTok * modelMapping.output_price) / 1000;
          await billingService.recordUsage(
            req.user.id, req.apiKey.id, model, inTok, outTok, cost,
            Date.now() - startTime, fallbackResp._vendor || 'unknown'
          );
          await pseudoStream(res, model, content);
          return;
        } catch (fallbackErr) {
          // 所有厂商都失败 → Mock SSE 流式降级
          console.warn('[API] 所有厂商失败，返回 Mock SSE 流');
          const mockContent = '当前服务暂时不可用，请稍后重试。';
          await billingService.recordUsage(
            req.user.id, req.apiKey.id, model,
            10, countTextTokens(mockContent), 0.001,
            Date.now() - startTime, 'mock'
          ).catch(() => {});
          await pseudoStream(res, model, mockContent);
          return;
        }
      }
    }

    // ═══ 非流式路径：vendor-router.route() ═══
    try {
      const response = await vendorRouter.route(modelMapping, messages, req.body);
      const vendorKey = response._vendor || modelMapping.adapter_key;

      const assistantContent = response.choices?.[0]?.message?.content || '';
      const inputTokens  = response.usage?.prompt_tokens     || countMessageTokens(messages);
      const outputTokens = response.usage?.completion_tokens || countTextTokens(assistantContent);
      const cost = (inputTokens * modelMapping.input_price + outputTokens * modelMapping.output_price) / 1000;

      // 余额检查
      if (req.user.balance < cost) {
        return res.status(402).json({
          error: '余额不足，请充值后重试',
          code: 'INSUFFICIENT_BALANCE',
          required: Math.ceil(cost * 10000) / 10000,
          balance: req.user.balance,
        });
      }

      const duration = Date.now() - startTime;
      await billingService.recordUsage(
        req.user.id, req.apiKey.id, model,
        inputTokens, outputTokens, cost, duration, vendorKey
      );

      response._real = true;
      response._vendor = vendorKey;
      response._latency_ms = duration;

      // 流式请求但走了非流式路径 → 伪流式回退
      if (stream && !res.headersSent) {
        await pseudoStream(res, model, assistantContent);
      } else if (!res.headersSent) {
        res.json(response);
      }

    } catch (error) {
      console.error('[API] 路由失败:', error.message);

      // 所有厂商失败 → 降级 Mock
      return handleMockResponse(req, res, model, startTime, {
        vendor: 'fallback',
        error: error.message,
      });
    }
  });
});

// ─── 伪流式响应（厂商不支持 SSE 时的回退方案）────────────
async function pseudoStream(res, model, content) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const segments = content.match(/[\s\S]{1,20}/g) || content.split('');

  for (const segment of segments) {
    res.write(`data: ${JSON.stringify({
      id: uuidv4(),
      object: 'chat.completion.chunk',
      created: Date.now(),
      model,
      choices: [{ delta: { content: segment }, finish_reason: null }],
    })}\n\n`);
    await new Promise(r => setTimeout(r, 30));
  }

  res.write(`data: ${JSON.stringify({
    id: uuidv4(),
    object: 'chat.completion.chunk',
    created: Date.now(),
    model,
    choices: [{ delta: {}, finish_reason: 'stop' }],
  })}\n\n`);
  res.write('data: [DONE]\n\n');
  res.end();
}

// ─── Mock 降级响应 ────────────────────────────────────────
function handleMockResponse(req, res, model, startTime, meta = null) {
  const mockResponses = [
    '这是一个很好的问题！让我为您详细解答。根据您的需求，我建议以下方案...',
    '感谢您的提问！关于您提到的功能，我可以为您提供以下信息...',
    '好的，我来帮您处理这个问题。首先，我需要了解您的具体需求...',
    '我理解您的需求了。为了更好地帮助您，请提供以下信息...'
  ];

  const content = mockResponses[Math.floor(Math.random() * mockResponses.length)];
  const inputTokens = 100;
  const outputTokens = countTextTokens(content);
  const cost = 0.002;

  billingService.recordUsage(
    req.user.id, req.apiKey.id, model,
    inputTokens, outputTokens, cost, Date.now() - startTime, 'mock'
  ).catch(err => console.error('[Mock计费] 失败:', err.message));

  const mockData = {
    id: uuidv4(),
    object: 'chat.completion',
    created: Date.now(),
    model,
    choices: [{
      message: { role: 'assistant', content },
      finish_reason: 'stop'
    }],
    usage: { prompt_tokens: inputTokens, completion_tokens: outputTokens, total_tokens: inputTokens + outputTokens },
    _mock: true,
  };

  if (meta) {
    mockData._fallback = true;
    mockData._vendor = meta.vendor || null;
    mockData._error  = meta.error  || null;
  }

  res.json(mockData);
}

// ─── API Key 管理 ─────────────────────────────────────────
router.get('/api-keys', authenticate, (req, res) => {
  db.all('SELECT * FROM api_keys WHERE user_id = ?', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Internal server error' });
    res.json({ data: rows });
  });
});

router.post('/api-keys', authenticate, (req, res) => {
  const { name, permissions = 'all', max_requests = 1000 } = req.body;
  const apiKey = uuidv4().replace(/-/g, '');
  db.run(
    `INSERT INTO api_keys (id, user_id, key, name, permissions, max_requests) VALUES (?, ?, ?, ?, ?, ?)`,
    [uuidv4(), req.user.id, apiKey, name, permissions, max_requests],
    (err) => {
      if (err) return res.status(500).json({ error: 'Internal server error' });
      res.status(201).json({ key: apiKey, name, permissions, max_requests });
    }
  );
});

router.delete('/api-keys/:keyId', authenticate, (req, res) => {
  db.run(`DELETE FROM api_keys WHERE id = ? AND user_id = ?`, [req.params.keyId, req.user.id], function(err) {
    if (err) return res.status(500).json({ error: 'Internal server error' });
    if (this.changes === 0) return res.status(404).json({ error: 'API key not found' });
    res.json({ message: 'API key deleted successfully' });
  });
});

// ─── 用量 / 余额 ──────────────────────────────────────────
router.get('/usage', authenticate, (req, res) => {
  const { start_date, end_date } = req.query;
  let query = `SELECT * FROM call_logs WHERE user_id = ?`;
  const params = [req.user.id];
  if (start_date) { query += ` AND created_at >= ?`; params.push(start_date); }
  if (end_date)   { query += ` AND created_at <= ?`; params.push(end_date); }
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Internal server error' });
    res.json({ data: rows });
  });
});

router.get('/balance', authenticate, (req, res) => {
  res.json({ balance: req.user.balance });
});

router.post('/balance/topup', authenticate, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  db.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [amount, req.user.id], (err) => {
    if (err) return res.status(500).json({ error: 'Internal server error' });
    res.json({ message: 'Balance updated successfully', new_balance: req.user.balance + amount });
  });
});

module.exports = router;
