/**
 * error-handler.js - 全局错误处理中间件
 *
 * 统一捕获并格式化所有未处理的错误
 * 确保 API 错误响应格式一致
 */

'use strict';

/**
 * 全局错误处理中间件
 * 必须放在所有路由之后
 */
function globalErrorHandler(err, req, res, _next) {
  // 记录错误日志（脱敏）
  const logInfo = {
    method: req.method,
    path: req.originalUrl,
    userId: req.user?.id ? `${req.user.id.substring(0, 8)}...` : 'anonymous',
    error: err.message,
    stack: err.stack?.split('\n').slice(0, 3).join(' | '),
  };
  console.error(`[ErrorHandler] ${JSON.stringify(logInfo)}`);

  // 已发送响应头的错误不再处理
  if (res.headersSent) {
    return;
  }

  // Axios 错误（第三方 API 调用失败）
  if (err.response) {
    const status = err.response.status || 502;
    const upstreamError = err.response.data?.error?.message
      || err.response.data?.message
      || '上游服务返回错误';
    return res.status(status).json({
      error: upstreamError,
      code: 'UPSTREAM_ERROR',
      upstream_status: err.response.status,
    });
  }

  // 网络错误（超时、DNS 解析失败等）
  if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
    return res.status(504).json({
      error: '上游服务请求超时，请稍后重试',
      code: 'UPSTREAM_TIMEOUT',
    });
  }
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(502).json({
      error: '上游服务连接失败',
      code: 'UPSTREAM_UNREACHABLE',
    });
  }

  // JSON 解析错误
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: '请求体格式错误，请检查 JSON 格式',
      code: 'INVALID_JSON',
    });
  }

  // 默认 500
  res.status(500).json({
    error: '服务器内部错误，请稍后重试',
    code: 'INTERNAL_ERROR',
  });
}

module.exports = { globalErrorHandler };
