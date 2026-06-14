const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// ── 中间件 ────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 系统级限流（所有请求共用，放到最外层）
const { systemLimiter } = require('./middleware/rate-limiter');
app.use(systemLimiter);

// 路由挂载
app.use('/api/v1', require('./routes/api'));
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1', require('./routes/tools'));
app.use('/api/v1', require('./routes/nodes'));
app.use('/api/v1', require('./routes/settings'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 全局错误处理（必须放在所有路由之后）
const { globalErrorHandler } = require('./middleware/error-handler');
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`TeleToken Router Backend running on port ${PORT}`);
});
