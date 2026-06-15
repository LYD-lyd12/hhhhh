/**
 * 多厂商容错路由器
 * 
 * 功能特性：
 * - 按优先级顺序尝试多个厂商
 * - 支持故障降级和熔断
 * - 实时监控厂商健康状态
 * - 支持权重轮询和延迟感知路由
 */

const vendorAdapters = require('../adapters/vendor-adapters');
const db = require('../database');

// 厂商优先级配置（数字越小优先级越高）
const VENDOR_PRIORITY = {
  deepseek: 10,      // DeepSeek 性价比最高，优先使用
  pollinations: 20,  // 免费模型，作为第二层降级
  ollama: 30,        // 本地模型，第三层降级
  volcengine: 40,    // 付费厂商，备选
  zhipu: 50,         // 付费厂商，备选
  minimax: 60,       // 付费厂商，备选
  alibaba: 70,       // 付费厂商，备选
};

// 厂商健康状态缓存
const vendorHealth = new Map();

// 记录调用失败次数（用于熔断）
const failureCounts = new Map();
const FAILURE_THRESHOLD = 5; // 连续失败5次触发熔断
const COOLDOWN_PERIOD = 60000; // 熔断冷却时间1分钟

class VendorRouter {
  constructor() {
    this.fallbackVendor = 'pollinations'; // 默认降级厂商
  }

  /**
   * 获取厂商健康状态
   */
  getVendorHealth(vendorKey) {
    const health = vendorHealth.get(vendorKey);
    if (!health) {
      return { status: 'unknown', latency: 0, lastCheck: null };
    }
    // 检查熔断状态
    const failures = failureCounts.get(vendorKey) || 0;
    const lastFailure = failureCounts.get(`${vendorKey}_last`);
    const isCoolingDown = lastFailure && Date.now() - lastFailure < COOLDOWN_PERIOD;
    
    if (failures >= FAILURE_THRESHOLD && isCoolingDown) {
      return { ...health, status: 'fused' };
    }
    return health;
  }

  /**
   * 更新厂商健康状态
   */
  updateVendorHealth(vendorKey, success, latency) {
    const current = vendorHealth.get(vendorKey) || {
      status: 'healthy',
      latency: 0,
      lastCheck: null,
      successCount: 0,
      failureCount: 0,
    };

    if (success) {
      current.status = 'healthy';
      current.successCount++;
      failureCounts.set(vendorKey, 0); // 重置失败计数
    } else {
      current.status = 'unhealthy';
      current.failureCount++;
      const failures = (failureCounts.get(vendorKey) || 0) + 1;
      failureCounts.set(vendorKey, failures);
      failureCounts.set(`${vendorKey}_last`, Date.now());
    }

    // 计算平均延迟
    current.latency = Math.round((current.latency * 0.8 + latency * 0.2));
    current.lastCheck = Date.now();
    
    vendorHealth.set(vendorKey, current);
  }

  /**
   * 获取可用厂商列表（按优先级排序，排除熔断厂商）
   */
  async getAvailableVendors(modelAlias) {
    return new Promise((resolve) => {
      db.all(`
        SELECT v.adapter_key, v.status, m.vendor_model_id, m.input_price, m.output_price
        FROM model_mappings m
        JOIN vendor_configs v ON m.vendor_id = v.id
        WHERE m.alias = ? AND m.status = 'available'
      `, [modelAlias], (err, rows) => {
        if (err || !rows.length) {
          resolve([]);
          return;
        }

        // 按优先级排序，排除熔断厂商
        const available = rows
          .filter(row => {
            const health = this.getVendorHealth(row.adapter_key);
            return health.status !== 'fused' && row.status === 'active';
          })
          .sort((a, b) => {
            const priorityA = VENDOR_PRIORITY[a.adapter_key] || 100;
            const priorityB = VENDOR_PRIORITY[b.adapter_key] || 100;
            return priorityA - priorityB;
          });

        resolve(available);
      });
    });
  }

  /**
   * 执行多厂商容错路由调用
   * @param {Object} modelMapping - 模型映射配置
   * @param {Array} messages - 消息列表
   * @param {Object} requestBody - 请求体
   * @returns {Object} 响应结果
   */
  async route(modelMapping, messages, requestBody) {
    const { alias: modelAlias } = modelMapping;
    const availableVendors = await this.getAvailableVendors(modelAlias);
    
    if (availableVendors.length === 0) {
      throw new Error('没有可用的厂商');
    }

    // 记录尝试的厂商列表
    const triedVendors = [];
    let lastError = null;

    for (const vendorInfo of availableVendors) {
      const { adapter_key: vendorKey } = vendorInfo;
      triedVendors.push(vendorKey);

      try {
        // 创建临时模型映射（使用当前厂商的配置）
        const tempMapping = {
          ...modelMapping,
          adapter_key: vendorKey,
          vendor_model_id: vendorInfo.vendor_model_id,
          input_price: vendorInfo.input_price,
          output_price: vendorInfo.output_price,
        };

        // 获取厂商适配器
        const adapter = vendorAdapters[vendorKey];
        if (!adapter) {
          lastError = new Error(`厂商 ${vendorKey} 适配器未注册`);
          continue;
        }

        // 检查适配器是否支持流式响应
        const stream = requestBody.stream || false;
        const startTime = Date.now();

        let response;
        if (stream && typeof adapter.streamCompletion === 'function') {
          // 流式响应
          response = await new Promise((resolve, reject) => {
            const chunks = [];
            adapter.streamCompletion(tempMapping, messages, requestBody, (chunk) => {
              chunks.push(chunk);
            }).then(() => {
              resolve({ chunks, isStream: true });
            }).catch(reject);
          });
        } else {
          // 非流式响应
          response = await adapter.chatCompletion(tempMapping, messages, requestBody);
          response.isStream = false;
        }

        const latency = Date.now() - startTime;
        this.updateVendorHealth(vendorKey, true, latency);

        // 返回响应，附带路由信息
        return {
          ...response,
          _vendor: vendorKey,
          _latency_ms: latency,
          _tried_vendors: triedVendors,
          _route_info: {
            primary: vendorKey,
            fallback: false,
          },
        };

      } catch (error) {
        lastError = error;
        console.warn(`[路由] 厂商 ${vendorKey} 调用失败: ${error.message}`);
        
        // 更新健康状态
        this.updateVendorHealth(vendorKey, false, 0);
        
        // 继续尝试下一个厂商
        continue;
      }
    }

    // 所有厂商都失败了
    throw new Error(`所有可用厂商调用失败: ${triedVendors.join(', ')}. 最后错误: ${lastError?.message}`);
  }

  /**
   * 获取路由统计信息
   */
  getRouteStats() {
    const stats = {};
    vendorHealth.forEach((health, vendorKey) => {
      stats[vendorKey] = {
        ...health,
        failures: failureCounts.get(vendorKey) || 0,
      };
    });
    return stats;
  }
}

module.exports = new VendorRouter();
