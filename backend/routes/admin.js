const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { requireAdmin } = require('../middleware/adminAuth');

// All admin routes require admin role
router.use(requireAdmin);

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

router.get('/users', (req, res) => {
  db.all('SELECT id, email, name, role, balance, created_at FROM users', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json({ data: rows });
  });
});

router.get('/users/:userId', (req, res) => {
  db.get('SELECT id, email, name, role, balance, created_at FROM users WHERE id = ?', [req.params.userId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(row);
  });
});

router.post('/users', (req, res) => {
  const { email, password, name, balance = 0, role = 'user' } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  const hash = hashPassword(password);

  db.run(`INSERT INTO users (id, email, password, name, balance, role) VALUES (?, ?, ?, ?, ?, ?)`,
    [uuidv4(), email, hash, name, balance, role], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.status(201).json({ message: 'User created successfully' });
    });
});

router.put('/users/:userId', (req, res) => {
  const { email, name, balance } = req.body;
  let query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
  let params = [];

  if (email) {
    query += ', email = ?';
    params.push(email);
  }
  if (name) {
    query += ', name = ?';
    params.push(name);
  }
  if (balance !== undefined) {
    query += ', balance = ?';
    params.push(balance);
  }

  query += ' WHERE id = ?';
  params.push(req.params.userId);

  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User updated successfully' });
  });
});

router.delete('/users/:userId', (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.params.userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  });
});

router.get('/vendor-configs', (req, res) => {
  db.all('SELECT * FROM vendor_configs', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json({ data: rows });
  });
});

router.post('/vendor-configs', (req, res) => {
  const { vendor_name, api_base_url, api_key, api_secret, status = 'active', priority = 100 } = req.body;

  if (!vendor_name) {
    return res.status(400).json({ error: 'Vendor name is required' });
  }

  db.run(`INSERT INTO vendor_configs (id, vendor_name, api_base_url, api_key, api_secret, status, priority) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`, [uuidv4(), vendor_name, api_base_url, api_key, api_secret, status, priority], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(201).json({ message: 'Vendor config created successfully' });
  });
});

router.put('/vendor-configs/:vendorId', (req, res) => {
  const { api_base_url, api_key, api_secret, status, priority } = req.body;
  let query = 'UPDATE vendor_configs SET updated_at = CURRENT_TIMESTAMP';
  let params = [];

  if (api_base_url) {
    query += ', api_base_url = ?';
    params.push(api_base_url);
  }
  if (api_key) {
    query += ', api_key = ?';
    params.push(api_key);
  }
  if (api_secret) {
    query += ', api_secret = ?';
    params.push(api_secret);
  }
  if (status) {
    query += ', status = ?';
    params.push(status);
  }
  if (priority !== undefined) {
    query += ', priority = ?';
    params.push(priority);
  }

  query += ' WHERE id = ?';
  params.push(req.params.vendorId);

  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Vendor config not found' });
    }
    res.json({ message: 'Vendor config updated successfully' });
  });
});

router.delete('/vendor-configs/:vendorId', (req, res) => {
  db.run('DELETE FROM vendor_configs WHERE id = ?', [req.params.vendorId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Vendor config not found' });
    }
    res.json({ message: 'Vendor config deleted successfully' });
  });
});

router.get('/model-mappings', (req, res) => {
  db.all(`SELECT 
    m.*, 
    v.vendor_name 
  FROM model_mappings m 
  JOIN vendor_configs v ON m.vendor_id = v.id`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json({ data: rows });
  });
});

router.post('/model-mappings', (req, res) => {
  const { alias, vendor_id, vendor_model_id, input_price = 0, output_price = 0, status = 'available' } = req.body;

  if (!alias || !vendor_id || !vendor_model_id) {
    return res.status(400).json({ error: 'Alias, vendor_id, and vendor_model_id are required' });
  }

  db.run(`INSERT INTO model_mappings (id, alias, vendor_id, vendor_model_id, input_price, output_price, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`, [uuidv4(), alias, vendor_id, vendor_model_id, input_price, output_price, status], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(201).json({ message: 'Model mapping created successfully' });
  });
});

// 更新模型定价或状态
router.put('/model-mappings/:id', (req, res) => {
  const { input_price, output_price, status } = req.body;
  const updates = [];
  const params = [];
  
  if (input_price !== undefined) { updates.push('input_price = ?'); params.push(input_price); }
  if (output_price !== undefined) { updates.push('output_price = ?'); params.push(output_price); }
  if (status) { updates.push('status = ?'); params.push(status); }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  // 更新模型定价或状态（model_mappings 表无 updated_at 列）
  params.push(req.params.id);
  
  db.run(`UPDATE model_mappings SET ${updates.join(', ')} WHERE id = ?`, params, (err) => {
    if (err) return res.status(500).json({ error: 'Internal server error' });
    res.json({ message: 'Model mapping updated' });
  });
});

// 删除模型映射
router.delete('/model-mappings/:id', (req, res) => {
  db.run('DELETE FROM model_mappings WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Internal server error' });
    res.json({ message: 'Model mapping deleted' });
  });
});

router.get('/call-logs', (req, res) => {
  const { user_id, model_alias, start_date, end_date, limit } = req.query;
  let query = 'SELECT * FROM call_logs';
  let params = [];
  let conditions = [];

  if (user_id) {
    conditions.push('user_id = ?');
    params.push(user_id);
  }
  if (model_alias) {
    conditions.push('model_alias = ?');
    params.push(model_alias);
  }
  if (start_date) {
    conditions.push('created_at >= ?');
    params.push(start_date);
  }
  if (end_date) {
    conditions.push('created_at <= ?');
    params.push(end_date);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  // 按创建时间倒序
  query += ' ORDER BY created_at DESC';

  // 支持 limit 参数
  const limitNum = parseInt(limit);
  if (limitNum > 0) {
    query += ` LIMIT ${limitNum}`;
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json({ data: rows });
  });
});

router.get('/stats', (req, res) => {
  db.get('SELECT COUNT(*) as user_count FROM users', [], (err, userResult) => {
    db.get('SELECT COUNT(*) as api_key_count FROM api_keys', [], (err, keyResult) => {
      db.get('SELECT COUNT(*) as call_count, SUM(cost) as total_cost FROM call_logs', [], (err, callResult) => {
        db.get('SELECT SUM(balance) as total_balance FROM users', [], (err, balanceResult) => {
          res.json({
            user_count: userResult?.user_count || 0,
            api_key_count: keyResult?.api_key_count || 0,
            call_count: callResult?.call_count || 0,
            total_cost: callResult?.total_cost || 0,
            total_balance: balanceResult?.total_balance || 0
          });
        });
      });
    });
  });
});

// ═══════════════════════════════════════════════════════
// 退款 API
// ═══════════════════════════════════════════════════════

/**
 * POST /api/v1/admin/call-logs/:id/refund
 * 对指定调用记录执行退款，恢复用户余额
 */
router.post('/call-logs/:id/refund', (req, res) => {
  const { amount, reason = '' } = req.body;
  const refundAmount = parseFloat(amount);

  if (!refundAmount || refundAmount <= 0) {
    return res.status(400).json({ error: '退款金额必须大于 0' });
  }

  // 查找调用记录
  db.get('SELECT * FROM call_logs WHERE id = ?', [req.params.id], (err, log) => {
    if (err || !log) {
      return res.status(404).json({ error: '调用记录不存在' });
    }

    // 已退款金额 + 本次退款不能超过原始费用
    const alreadyRefunded = log.refund_amount || 0;
    if (alreadyRefunded + refundAmount > log.cost) {
      return res.status(400).json({
        error: '退款金额超出可退范围',
        cost: log.cost,
        already_refunded: alreadyRefunded,
        max_refundable: Math.max(0, log.cost - alreadyRefunded),
      });
    }

    // 更新调用记录 + 恢复用户余额
    const newRefundAmount = alreadyRefunded + refundAmount;
    db.run(
      `UPDATE call_logs SET refund_amount = ?, refund_reason = ? WHERE id = ?`,
      [newRefundAmount, reason, req.params.id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: '更新退款记录失败' });
        }
        // 恢复余额
        db.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [refundAmount, log.user_id], (err2) => {
          if (err2) {
            return res.status(500).json({ error: '恢复余额失败，但退款记录已更新' });
          }
          console.log(`[Admin] 退款: call_log ${req.params.id}, 金额 ¥${refundAmount}, 原因: ${reason}`);
          res.json({
            message: '退款成功',
            refund_amount: refundAmount,
            total_refunded: newRefundAmount,
            original_cost: log.cost,
            reason,
          });
        });
      }
    );
  });
});

// ═══════════════════════════════════════════════════════
// 对账 API
// ═══════════════════════════════════════════════════════

/**
 * GET /api/v1/admin/reconciliation?start_date=&end_date=
 * 按日期范围查询对账摘要：
 *   - 系统计费的 Token/金额 vs 厂商返回的 Token 数
 *   - 差异率（用于发现计费偏差）
 *   - 退款汇总
 */
router.get('/reconciliation', (req, res) => {
  const { start_date, end_date } = req.query;

  let where = "WHERE status = 'success'";
  const params = [];

  if (start_date) {
    where += ' AND created_at >= ?';
    params.push(start_date);
  }
  if (end_date) {
    where += ' AND created_at <= ?';
    params.push(end_date);
  }

  // 汇总查询
  db.get(
    `SELECT
      COUNT(*)                        AS total_calls,
      SUM(cost)                       AS total_charged,
      SUM(refund_amount)              AS total_refunded,
      SUM(input_tokens)               AS sys_input_tokens,
      SUM(output_tokens)              AS sys_output_tokens,
      SUM(vendor_input_tokens)        AS vendor_input_tokens,
      SUM(vendor_output_tokens)       AS vendor_output_tokens,
      SUM(input_tokens + output_tokens) AS sys_total_tokens,
      SUM(vendor_input_tokens + vendor_output_tokens) AS vendor_total_tokens
    FROM call_logs ${where}`,
    params,
    (err, summary) => {
      if (err) {
        return res.status(500).json({ error: '对账查询失败' });
      }

      const sysTokens   = summary?.sys_total_tokens   || 0;
      const vendorTokens = summary?.vendor_total_tokens || 0;

      // Token 差异率 = (系统计数 - 厂商计数) / 厂商计数
      const tokenDiff = sysTokens - vendorTokens;
      const tokenDiffRate = vendorTokens > 0
        ? ((tokenDiff / vendorTokens) * 100).toFixed(2)
        : null;

      // 查询有较大差异的单条记录（差异 > 10%）
      db.all(
        `SELECT id, model_alias, input_tokens, output_tokens,
                vendor_input_tokens, vendor_output_tokens, cost, refund_amount,
                created_at
         FROM call_logs ${where}
           AND vendor_input_tokens + vendor_output_tokens > 0
           AND ABS(
             (input_tokens + output_tokens) -
             (vendor_input_tokens + vendor_output_tokens)
           ) * 1.0 / (vendor_input_tokens + vendor_output_tokens) > 0.1
         ORDER BY created_at DESC
         LIMIT 50`,
        params,
        (err2, anomalies) => {
          res.json({
            period: { start_date: start_date || '全部', end_date: end_date || '全部' },
            summary: {
              total_calls:           summary?.total_calls      || 0,
              total_charged:         summary?.total_charged    || 0,
              total_refunded:         summary?.total_refunded   || 0,
              net_revenue:           (summary?.total_charged || 0) - (summary?.total_refunded || 0),
              sys_input_tokens:      summary?.sys_input_tokens      || 0,
              sys_output_tokens:     summary?.sys_output_tokens     || 0,
              vendor_input_tokens:   summary?.vendor_input_tokens   || 0,
              vendor_output_tokens:  summary?.vendor_output_tokens  || 0,
              token_diff:            tokenDiff,
              token_diff_rate:       tokenDiffRate ? `${tokenDiffRate}%` : '无厂商数据',
            },
            anomalies: anomalies || [],
          });
        }
      );
    }
  );
});

module.exports = router;
