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
  const { vendor_name, api_base_url, api_key, api_secret, status = 'active' } = req.body;

  if (!vendor_name) {
    return res.status(400).json({ error: 'Vendor name is required' });
  }

  db.run(`INSERT INTO vendor_configs (id, vendor_name, api_base_url, api_key, api_secret, status) 
    VALUES (?, ?, ?, ?, ?, ?)`, [uuidv4(), vendor_name, api_base_url, api_key, api_secret, status], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(201).json({ message: 'Vendor config created successfully' });
  });
});

router.put('/vendor-configs/:vendorId', (req, res) => {
  const { api_base_url, api_key, api_secret, status } = req.body;
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

module.exports = router;
