const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { hashPassword, comparePassword } = require('../utils/crypto');

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const result = comparePassword(password, user.password);

    if (!result) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    db.all('SELECT * FROM api_keys WHERE user_id = ?', [user.id], (err, apiKeys) => {
      const defaultApiKey = apiKeys && apiKeys.length > 0 ? apiKeys[0].key : null;
      
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'user',
        balance: user.balance,
        created_at: user.created_at,
        api_key: defaultApiKey
      });
    });
  });
});

router.post('/register', (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, existingUser) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = hashPassword(password);
    const userId = uuidv4();
    
    db.run(`INSERT INTO users (id, email, password, name, balance, role) VALUES (?, ?, ?, ?, ?, 'user')`,
      [userId, email, hash, name, 100],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Internal server error' });
        }

        // 自动为新用户创建 API Key
        const apiKeyValue = `ttr-${userId.substring(0, 8)}-${uuidv4().substring(0, 12)}`;
        db.run(`INSERT INTO api_keys (id, user_id, key, name, max_requests) VALUES (?, ?, ?, ?, ?)`,
          [uuidv4(), userId, apiKeyValue, '默认 Key', 1000],
          (err2) => {
            if (err2) {
              console.error('[Auth] 注册时创建 API Key 失败:', err2.message);
            }
          });

        res.status(201).json({
          id: userId,
          email,
          name,
          role: 'user',
          balance: 100,
          api_key: apiKeyValue,
          created_at: new Date().toISOString()
        });
      });
  });
});

module.exports = router;
