/**
 * 计费对账服务
 * 
 * 功能特性：
 * - 实时费用计算
 * - 对账与结算
 * - 退款处理
 * - 账单生成
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../database');

class BillingService {
  constructor() {
    this.REFUND_REASONS = [
      'service_error',      // 服务错误
      'content_quality',    // 内容质量问题
      'overcharge',         // 超额计费
      'user_request',       // 用户申请
      'promotion',          // 促销活动
      'system_compensation', // 系统补偿
    ];
  }

  /**
   * 计算费用
   */
  calculateCost(inputTokens, outputTokens, modelMapping) {
    const inputPrice = modelMapping.input_price || 0;
    const outputPrice = modelMapping.output_price || 0;
    return (inputTokens * inputPrice + outputTokens * outputPrice) / 1000;
  }

  /**
   * 记录调用日志并扣减余额
   */
  async recordUsage(userId, apiKeyId, modelAlias, inputTokens, outputTokens, cost, duration, vendorKey, status = 'success', errorMessage = null) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET balance = balance - ? WHERE id = ?`,
        [cost, userId],
        (err) => {
          if (err) {
            console.error('[计费] 余额扣减失败:', err.message);
            return reject(err);
          }

          db.run(
            `UPDATE api_keys SET used_requests = used_requests + 1 WHERE id = ?`,
            [apiKeyId],
            (err) => {
              if (err) {
                console.error('[计费] API Key 使用次数更新失败:', err.message);
              }
            }
          );

          db.run(
            `INSERT INTO call_logs (id, user_id, api_key_id, model_alias, input_tokens, output_tokens, cost, duration, vendor_key, status, error_message, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              uuidv4(),
              userId,
              apiKeyId,
              modelAlias,
              inputTokens,
              outputTokens,
              cost,
              duration,
              vendorKey,
              status,
              errorMessage,
              new Date().toISOString(),
            ],
            (err) => {
              if (err) {
                console.error('[计费] 调用日志记录失败:', err.message);
                return reject(err);
              }
              resolve();
            }
          );
        }
      );
    });
  }

  /**
   * 退款处理
   */
  async processRefund(userId, callLogId, amount, reason, adminNote = '') {
    return new Promise((resolve, reject) => {
      // 验证退款原因
      if (!this.REFUND_REASONS.includes(reason)) {
        return reject(new Error('无效的退款原因'));
      }

      // 查询原始调用记录
      db.get(
        `SELECT * FROM call_logs WHERE id = ? AND user_id = ?`,
        [callLogId, userId],
        (err, callLog) => {
          if (err || !callLog) {
            return reject(new Error('调用记录不存在'));
          }

          // 检查是否已退款
          db.get(
            `SELECT * FROM refunds WHERE call_log_id = ?`,
            [callLogId],
            (err, existingRefund) => {
              if (existingRefund) {
                return reject(new Error('该记录已申请退款'));
              }

              // 验证退款金额不超过原始费用
              if (amount > callLog.cost) {
                return reject(new Error('退款金额不能超过原始费用'));
              }

              // 执行退款
              db.run(
                `UPDATE users SET balance = balance + ? WHERE id = ?`,
                [amount, userId],
                (err) => {
                  if (err) {
                    return reject(err);
                  }

                  // 记录退款日志
                  db.run(
                    `INSERT INTO refunds (id, user_id, call_log_id, amount, reason, admin_note, status, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      uuidv4(),
                      userId,
                      callLogId,
                      amount,
                      reason,
                      adminNote,
                      'completed',
                      new Date().toISOString(),
                    ],
                    (err) => {
                      if (err) {
                        return reject(err);
                      }

                      // 更新调用记录状态
                      db.run(
                        `UPDATE call_logs SET status = 'refunded' WHERE id = ?`,
                        [callLogId],
                        () => {
                          resolve({
                            success: true,
                            message: '退款成功',
                            refundId: uuidv4(),
                            amount,
                            reason,
                          });
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  }

  /**
   * 获取用户账单
   */
  async getUserBill(userId, startDate, endDate) {
    return new Promise((resolve) => {
      let query = `
        SELECT 
          c.id, c.model_alias, c.input_tokens, c.output_tokens, c.cost, 
          c.duration, c.status, c.created_at, c.vendor_key
        FROM call_logs c
        WHERE c.user_id = ?
      `;
      const params = [userId];

      if (startDate) {
        query += ` AND c.created_at >= ?`;
        params.push(startDate);
      }
      if (endDate) {
        query += ` AND c.created_at <= ?`;
        params.push(endDate);
      }

      query += ` ORDER BY c.created_at DESC`;

      db.all(query, params, (err, rows) => {
        if (err) {
          console.error('[账单] 查询失败:', err.message);
          resolve({ calls: [], summary: null });
          return;
        }

        const summary = rows.reduce(
          (acc, row) => {
            acc.totalCalls++;
            acc.totalInputTokens += row.input_tokens || 0;
            acc.totalOutputTokens += row.output_tokens || 0;
            acc.totalCost += row.cost || 0;
            acc.totalDuration += row.duration || 0;
            
            // 按状态统计
            acc.statusCounts[row.status] = (acc.statusCounts[row.status] || 0) + 1;
            
            // 按厂商统计
            const vendor = row.vendor_key || 'unknown';
            acc.vendorStats[vendor] = acc.vendorStats[vendor] || { calls: 0, cost: 0 };
            acc.vendorStats[vendor].calls++;
            acc.vendorStats[vendor].cost += row.cost || 0;
            
            return acc;
          },
          {
            totalCalls: 0,
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalCost: 0,
            totalDuration: 0,
            statusCounts: {},
            vendorStats: {},
          }
        );

        resolve({ calls: rows, summary });
      });
    });
  }

  /**
   * 获取退款记录
   */
  async getUserRefunds(userId) {
    return new Promise((resolve) => {
      db.all(
        `SELECT * FROM refunds WHERE user_id = ? ORDER BY created_at DESC`,
        [userId],
        (err, rows) => {
          if (err) {
            console.error('[退款] 查询失败:', err.message);
            resolve([]);
            return;
          }
          resolve(rows);
        }
      );
    });
  }

  /**
   * 生成对账单
   */
  async generateStatement(userId, period) {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        endDate = now.toISOString();
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000).toISOString();
        endDate = now.toISOString();
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        endDate = now.toISOString();
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        endDate = now.toISOString();
    }

    const { calls, summary } = await this.getUserBill(userId, startDate, endDate);
    const refunds = await this.getUserRefunds(userId);
    
    const periodRefunds = refunds.filter(
      r => r.created_at >= startDate && r.created_at <= endDate
    );
    const totalRefunds = periodRefunds.reduce((sum, r) => sum + r.amount, 0);

    return {
      userId,
      period,
      startDate,
      endDate,
      generatedAt: now.toISOString(),
      summary: {
        ...summary,
        totalRefunds,
        netCost: summary.totalCost - totalRefunds,
      },
      calls,
      refunds: periodRefunds,
    };
  }

  /**
   * 获取平台总统计
   */
  async getPlatformStats() {
    return new Promise((resolve) => {
      db.all(
        `SELECT 
          SUM(input_tokens) as total_input_tokens,
          SUM(output_tokens) as total_output_tokens,
          SUM(cost) as total_cost,
          COUNT(*) as total_calls,
          status
        FROM call_logs
        GROUP BY status`,
        [],
        (err, rows) => {
          if (err) {
            console.error('[统计] 查询失败:', err.message);
            resolve({});
            return;
          }

          const stats = {
            totalCalls: 0,
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalCost: 0,
            statusCounts: {},
          };

          rows.forEach((row) => {
            stats.totalCalls += row.total_calls || 0;
            stats.totalInputTokens += row.total_input_tokens || 0;
            stats.totalOutputTokens += row.total_output_tokens || 0;
            stats.totalCost += row.total_cost || 0;
            stats.statusCounts[row.status] = row.total_calls || 0;
          });

          resolve(stats);
        }
      );
    });
  }
}

module.exports = new BillingService();
