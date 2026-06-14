/**
 * rate-limiter.js - 内存限流中间件
 *
 * 实现滑动窗口算法，支持：
 * - 用户级限流（按 user_id）
 * - API Key 级限流（按 api_key）
 * - 系统全局限流
 *
 * 设计思路：
 * - 用内存 Map 存储每个 key 的请求时间戳
 * - 每次请求清理过期时间戳，计算窗口内请求数
 * - 超过阈值返回 429
 */

'use strict';

// 默认限流配置
const DEFAULT_CONFIG = {
  // 用户级：每用户每分钟最多 60 次请求
  user: { windowMs: 60 * 1000, maxRequests: 60 },
  // API Key 级：每个 Key 每分钟最多 30 次请求
  apiKey: { windowMs: 60 * 1000, maxRequests: 30 },
  // 系统级：全系统每分钟最多 600 次请求
  system: { windowMs: 60 * 1000, maxRequests: 600 },
};

// 存储格式：Map<key, number[]>
const store = {
  user: new Map(),
  apiKey: new Map(),
  system: [], // 系统级不区分 key
};

/**
 * 清理过期记录并检查限流
 */
function checkRateLimit(storeArr, windowMs, maxRequests) {
  const now = Date.now();
  const windowStart = now - windowMs;

  // 移除窗口外的旧记录
  while (storeArr.length > 0 && storeArr[0] < windowStart) {
    storeArr.shift();
  }

  if (storeArr.length >= maxRequests) {
    return { allowed: false, remaining: 0, resetMs: storeArr[0] + windowMs - now };
  }

  storeArr.push(now);
  return {
    allowed: true,
    remaining: maxRequests - storeArr.length,
    resetMs: windowMs,
  };
}

/**
 * 限流中间件工厂函数
 * @param {'user' | 'apiKey' | 'system'} type
 */
function createLimiter(type) {
  const config = DEFAULT_CONFIG[type];

  return (req, res, next) => {
    let key;
    let storeMap;

    if (type === 'system') {
      key = '__global__';
      storeMap = store.system;
    } else if (type === 'user') {
      key = req.user?.id || req.ip;
      if (!store.user.has(key)) store.user.set(key, []);
      storeMap = store.user.get(key);
    } else if (type === 'apiKey') {
      key = req.apiKey?.key || req.ip;
      if (!store.apiKey.has(key)) store.apiKey.set(key, []);
      storeMap = store.apiKey.get(key);
    }

    if (!key) return next();

    const result = checkRateLimit(storeMap, config.windowMs, config.maxRequests);

    if (!result.allowed) {
      res.set('X-RateLimit-Limit', String(config.maxRequests));
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', String(Math.ceil(result.resetMs / 1000)));
      res.set('Retry-After', String(Math.ceil(result.resetMs / 1000)));
      return res.status(429).json({
        error: 'Too Many Requests: 请求频率超限，请稍后重试',
        code: 'RATE_LIMIT_EXCEEDED',
        retry_after_seconds: Math.ceil(result.resetMs / 1000),
      });
    }

    res.set('X-RateLimit-Limit', String(config.maxRequests));
    res.set('X-RateLimit-Remaining', String(result.remaining));
    next();
  };
}

// 导出限流中间件
const systemLimiter = createLimiter('system');
const userLimiter = createLimiter('user');
const apiKeyLimiter = createLimiter('apiKey');

module.exports = { systemLimiter, userLimiter, apiKeyLimiter };
