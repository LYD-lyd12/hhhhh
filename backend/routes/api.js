const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticate } = require('../middleware/auth');
const { userLimiter, apiKeyLimiter } = require('../middleware/rate-limiter');
const { countMessageTokens, countTextTokens } = require('../utils/token-counter');
const vendorRouter = require('./vendor-router');
const billingService = require('../services/billing-service');
const streamingProxy = require('../services/streaming-proxy');

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

    try {
      // 使用多厂商容错路由
      const response = await vendorRouter.route(modelMapping, messages, req.body);
      
      const assistantContent = response.choices?.[0]?.message?.content || response.content || '';
      const inputTokens = response.usage?.prompt_tokens || countMessageTokens(messages);
      const outputTokens = response.usage?.completion_tokens || countTextTokens(assistantContent);
      const cost = billingService.calculateCost(inputTokens, outputTokens, response);
      const vendorKey = response._vendor || modelMapping.adapter_key;

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
        req.user.id,
        req.apiKey.id,
        model,
        inputTokens,
        outputTokens,
        cost,
        duration,
        vendorKey
      );

      const responseData = {
        id: uuidv4(),
        object: 'chat.completion',
        created: Date.now(),
        model,
        choices: response.choices || [{
          message: { role: 'assistant', content: assistantContent },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: inputTokens,
          completion_tokens: outputTokens,
          total_tokens: inputTokens + outputTokens
        },
        _real: true,
        _vendor: vendorKey,
        _latency_ms: duration,
        _route_info: response._route_info || { primary: vendorKey, fallback: false },
        _tried_vendors: response._tried_vendors || [vendorKey],
      };

      if (stream) {
        const vendorAdapters = require('../adapters/vendor-adapters');
        const vendorAdapter = vendorAdapters[vendorKey];
        
        if (vendorAdapter) {
          const tempMapping = { ...modelMapping, adapter_key: vendorKey };
          await streamingProxy.stream(req, res, vendorAdapter, tempMapping, messages, req.body, inputTokens);
        } else {
          await pseudoStream(res, model, assistantContent);
        }
      } else {
        res.json(responseData);
      }

    } catch (error) {
      console.error(`[API] 路由调用失败:`, error.message);
      
      // 降级到 mock 响应
      return handleMockResponse(req, res, model, startTime, {
        vendor: 'fallback',
        error: error.message,
      });
    }
  });
});

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

  billingService.recordUsage(req.user.id, req.apiKey.id, model, inputTokens, outputTokens, cost, Date.now() - startTime, 'mock');

  const mockData = {
    id: uuidv4(),
    object: 'chat.completion',
    created: Date.now(),
    model,
    choices: [{
      message: { role: 'assistant', content },
      finish_reason: 'stop'
    }],
    usage: {
      prompt_tokens: inputTokens,
      completion_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens
    },
    _mock: true,
  };
  
  if (meta) {
    mockData._fallback = true;
    mockData._vendor = meta.vendor || null;
    mockData._error = meta.error || null;
  }
  
  res.json(mockData);
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

router.get('/bill', authenticate, async (req, res) => {
  const { start_date, end_date } = req.query;
  try {
    const bill = await billingService.getUserBill(req.user.id, start_date, end_date);
    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/statement', authenticate, async (req, res) => {
  const { period = 'month' } = req.query;
  try {
    const statement = await billingService.generateStatement(req.user.id, period);
    res.json(statement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/refund', authenticate, async (req, res) => {
  const { call_log_id, amount, reason, admin_note } = req.body;
  
  if (!call_log_id || !amount || !reason) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    const result = await billingService.processRefund(req.user.id, call_log_id, amount, reason, admin_note);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/refunds', authenticate, async (req, res) => {
  try {
    const refunds = await billingService.getUserRefunds(req.user.id);
    res.json({ data: refunds });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/route/stats', authenticate, (req, res) => {
  const stats = vendorRouter.getRouteStats();
  res.json(stats);
});

module.exports = router;
