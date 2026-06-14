const express = require('express');
const router = express.Router();

// 节点数据（模拟分布式节点）
const nodes = [
  { id: 'node-1', name: '豆包-北京', vendor: '火山引擎', region: '北京', status: 'healthy', latency: 28, load: 65, activeRequests: 128, maxRequests: 200 },
  { id: 'node-2', name: '豆包-上海', vendor: '火山引擎', region: '上海', status: 'healthy', latency: 35, load: 45, activeRequests: 89, maxRequests: 200 },
  { id: 'node-3', name: 'ChatGLM-北京', vendor: '智谱AI', region: '北京', status: 'healthy', latency: 42, load: 72, activeRequests: 144, maxRequests: 200 },
  { id: 'node-4', name: 'ChatGLM-深圳', vendor: '智谱AI', region: '深圳', status: 'warning', latency: 68, load: 88, activeRequests: 176, maxRequests: 200 },
  { id: 'node-5', name: '海螺AI-杭州', vendor: 'MiniMax', region: '杭州', status: 'healthy', latency: 38, load: 55, activeRequests: 110, maxRequests: 200 },
  { id: 'node-6', name: '通义千问-杭州', vendor: '阿里云', region: '杭州', status: 'critical', latency: 120, load: 95, activeRequests: 190, maxRequests: 200 },
];

// GET /api/v1/nodes/health — 节点健康检查（模拟真实轮询）
router.get('/nodes/health', (req, res) => {
  // 每次请求时随机微调延迟和负载，模拟真实监控数据
  const result = nodes.map(node => ({
    ...node,
    latency: node.latency + Math.floor(Math.random() * 10) - 5,
    load: Math.min(100, Math.max(0, node.load + Math.floor(Math.random() * 6) - 3)),
    activeRequests: Math.min(node.maxRequests, node.activeRequests + Math.floor(Math.random() * 10) - 5),
  }));

  // 更新节点状态
  result.forEach(n => {
    if (n.load > 90) n.status = 'critical';
    else if (n.load > 75) n.status = 'warning';
    else n.status = 'healthy';
  });

  res.json({ data: result, timestamp: new Date().toISOString() });
});

module.exports = router;