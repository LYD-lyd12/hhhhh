// 管理员权限中间件
// requireAdmin: 先走 API Key 认证，再检查用户 role 是否为 admin
// requireAuth: 仅 API Key 认证（普通用户可用）
// optionalAuth: API Key 认证可选（已登录则注入 req.user，未登录也放行）

const { authenticate } = require('./auth');

const requireAdmin = (req, res, next) => {
  authenticate(req, res, (err) => {
    if (err) return next(err);
    // authenticate 成功后 req.user 已注入
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden: Admin access required',
      });
    }
    next();
  });
};

const requireAuth = authenticate;

const optionalAuth = (req, res, next) => {
  authenticate(req, res, () => {
    // 忽略认证失败，继续处理
    next();
  });
};

module.exports = { requireAdmin, requireAuth, optionalAuth };