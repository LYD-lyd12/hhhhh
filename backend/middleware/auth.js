const db = require('../database');
const { v4: uuidv4 } = require('uuid');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No API key provided' });
  }

  const apiKey = authHeader.substring(7);

  db.get('SELECT * FROM api_keys WHERE key = ?', [apiKey], (err, apiKeyRecord) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!apiKeyRecord) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
    }

    if (apiKeyRecord.used_requests >= apiKeyRecord.max_requests) {
      return res.status(429).json({ error: 'Too Many Requests: API key quota exceeded' });
    }

    db.get('SELECT * FROM users WHERE id = ?', [apiKeyRecord.user_id], (err, user) => {
      if (err || !user) {
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (user.balance <= 0) {
        return res.status(402).json({ error: 'Payment Required: Insufficient balance' });
      }

      req.user = user;
      req.apiKey = apiKeyRecord;
      next();
    });
  });
};

module.exports = { authenticate };
