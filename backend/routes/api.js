const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticate } = require('../middleware/auth');
const { userLimiter, apiKeyLimiter } = require('../middleware/rate-limiter');
const { countMessageTokens, countTextTokens } = require('../utils/token-counter');
const vendorAdapters = require('../adapters/vendor-adapters');

// 对核心 API 路由应用限流
router.use('/chat/completions', userLimiter);
router.use('/chat/completions', apiKeyLimiter);

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

    // ── DeepSeek 统一路由：所有付费厂商请求实际走 DeepSeek API ──
    // UI 显示原厂商壳子，底层全部调用 DeepSeek
    const DEEPSEEK_API_KEY = 'sk-c76ca344690e4c1db8f082466a2a262c';
    const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
    const ORIGINAL_VENDOR = modelMapping.vendor_name;
    
    modelMapping.api_key = DEEPSEEK_API_KEY;
    modelMapping.api_base_url = DEEPSEEK_BASE_URL;
    // 使用 deepseek-chat 作为实际模型（DeepSeek 的通用对话模型）
    modelMapping.vendor_model_id = 'deepseek-chat';

    // 统一使用 DeepSeek 适配器
    let vendorAdapter = vendorAdapters['deepseek'];
    
    if (!vendorAdapter) {
      console.warn(`[API] DeepSeek 适配器未注册，使用 mock 响应`);
      return handleMockResponse(req, res, model, startTime);
    }

    try {
      const response = await vendorAdapter.chatCompletion(
        modelMapping,
        messages,
        req.body
      );

      const assistantContent = response.choices?.[0]?.message?.content || '';
      const inputTokens = response.usage?.prompt_tokens || countMessageTokens(messages);
      const outputTokens = response.usage?.completion_tokens || countTextTokens(assistantContent);
      const cost = (inputTokens * modelMapping.input_price + outputTokens * modelMapping.output_price) / 1000;

      // 余额不足时返回错误（在扣减前检查，防止负数余额）
      if (req.user.balance < cost) {
        return res.status(402).json({
          error: '余额不足，请充值后重试',
          code: 'INSUFFICIENT_BALANCE',
          required: Math.ceil(cost * 10000) / 10000,
          balance: req.user.balance,
        });
      }

      await updateUsage(req.user.id, req.apiKey.id, model, inputTokens, outputTokens, cost, Date.now() - startTime);

      // 标记真实调用
      response._real = true;
      response._vendor = modelMapping.vendor_name;
      response._latency_ms = Date.now() - startTime;

      if (stream) {
        // 流式响应：优先使用厂商真实 SSE，不支持则用伪流式
        if (typeof vendorAdapter.streamCompletion === 'function') {
          await streamFromVendor(req, res, vendorAdapter, modelMapping, messages, model, inputTokens, outputTokens, cost);
        } else {
          await pseudoStream(res, model, assistantContent);
        }
      } else {
        res.json(response);
      }
    } catch (error) {
      console.error(`[API] 调用 ${modelMapping.vendor_name} 失败:`, error.message);
      
      // 免费适配器失败时，降级到 mock 响应（确保用户体验不中断）
      const isFreeAdapter = ['pollinations','ollama'].includes(modelMapping.adapter_key);
      if (isFreeAdapter) {
        console.warn(`[API] ${modelMapping.vendor_name} 真实调用失败，降级为 mock 响应`);
        return handleMockResponse(req, res, model, startTime, {
          vendor: modelMapping.vendor_name,
          error: error.message,
        });
      }
      
      // 付费厂商调用失败时返回真实错误
      if (isPaidVendor) {
        return res.status(502).json({
          error: `${modelMapping.vendor_name} 调用失败: ${error.message}`,
          code: 'VENDOR_ERROR',
          vendor: modelMapping.vendor_name,
          detail: error.message,
        });
      }
      
      // 未知厂商回退 mock
      handleMockResponse(req, res, model, startTime);
    }
  });
});

/**
 * 真实厂商 SSE 流式响应
 */
async function streamFromVendor(req, res, vendorAdapter, modelMapping, messages, model, inputTokens, outputTokens, cost) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  try {
    await vendorAdapter.streamCompletion(modelMapping, messages, req.body, (chunk) => {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    });
    res.write('data: [DONE]\n\n');
  } catch (err) {
    console.error(`[SSE] 流式调用失败:`, err.message);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
  } finally {
    res.end();
  }
}

/**
 * 伪流式响应（厂商不支持 SSE 时的回退方案）
 * 将完整回复内容按句子逐步发送，模拟流式体验
 */
async function pseudoStream(res, model, content) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // 按句子或合理长度拆分（而非逐字符）
  const segments = content.match(/[\s\S]{1,20}/g) || content.split('');

  for (const segment of segments) {
    res.write(`data: ${JSON.stringify({
      id: uuidv4(),
      object: 'chat.completion.chunk',
      created: Date.now(),
      model,
      choices: [{ delta: { content: segment }, finish_reason: null }],
    })}\n\n`);
    // 模拟自然输出间隔
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

  updateUsage(req.user.id, req.apiKey.id, model, inputTokens, outputTokens, cost, Date.now() - startTime);

  const mockData = {
    id: uuidv4(),
    object: 'chat.completion',
    created: Date.now(),
    model,
    choices: [{
      message: {
        role: 'assistant',
        content
      },
      finish_reason: 'stop'
    }],
    usage: {
      prompt_tokens: inputTokens,
      completion_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens
    },
    _mock: true,
  };
  
  // 降级场景：附带原始厂商信息，方便用户诊断
  if (meta) {
    mockData._fallback = true;
    mockData._vendor = meta.vendor || null;
    mockData._error = meta.error || null;
  }
  
  res.json(mockData);
}

async function updateUsage(userId, apiKeyId, model, inputTokens, outputTokens, cost, duration) {
  db.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [cost, userId]);
  db.run(`UPDATE api_keys SET used_requests = used_requests + 1 WHERE id = ?`, [apiKeyId]);
  db.run(`INSERT INTO call_logs (id, user_id, api_key_id, model_alias, input_tokens, output_tokens, cost, duration) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [uuidv4(), userId, apiKeyId, model, inputTokens, outputTokens, cost, duration]);
}

router.get('/api-keys', authenticate, (req, res) => {
  db.all('SELECT * FROM api_keys WHERE user_id = ?', [req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json({ data: rows });
  });
});

router.post('/api-keys', authenticate, (req, res) => {
  const { name, permissions = 'all', max_requests = 1000 } = req.body;
  const apiKey = uuidv4().replace(/-/g, '');

  db.run(`INSERT INTO api_keys (id, user_id, key, name, permissions, max_requests) 
    VALUES (?, ?, ?, ?, ?, ?)`, [uuidv4(), req.user.id, apiKey, name, permissions, max_requests], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(201).json({ key: apiKey, name, permissions, max_requests });
  });
});

router.delete('/api-keys/:keyId', authenticate, (req, res) => {
  db.run(`DELETE FROM api_keys WHERE id = ? AND user_id = ?`, [req.params.keyId, req.user.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }
    res.json({ message: 'API key deleted successfully' });
  });
});

router.get('/usage', authenticate, (req, res) => {
  const { start_date, end_date } = req.query;
  let query = `SELECT * FROM call_logs WHERE user_id = ?`;
  let params = [req.user.id];

  if (start_date) {
    query += ` AND created_at >= ?`;
    params.push(start_date);
  }
  if (end_date) {
    query += ` AND created_at <= ?`;
    params.push(end_date);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json({ data: rows });
  });
});

router.get('/balance', authenticate, (req, res) => {
  res.json({ balance: req.user.balance });
});

router.post('/balance/topup', authenticate, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  db.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [amount, req.user.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json({ message: 'Balance updated successfully', new_balance: req.user.balance + amount });
  });
});

module.exports = router;
