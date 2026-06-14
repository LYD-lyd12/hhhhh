const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/v1/settings — 获取系统设置
router.get('/settings', (req, res) => {
  db.all('SELECT key, value FROM system_settings', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    const settings = {};
    rows.forEach(row => { settings[row.key] = row.value; });
    res.json({ data: settings });
  });
});

// PUT /api/v1/settings — 保存系统设置
router.put('/settings', (req, res) => {
  const updates = req.body;
  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No settings provided' });
  }

  let completed = 0;
  const total = Object.keys(updates).length;
  let hasError = false;

  Object.entries(updates).forEach(([key, value]) => {
    db.run(
      `INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
      [key, String(value)],
      (err) => {
        if (err) {
          hasError = true;
          console.error('[Settings] 保存失败:', key, err.message);
        }
        completed++;
        if (completed === total) {
          if (hasError) {
            res.status(500).json({ error: '部分设置保存失败' });
          } else {
            res.json({ message: '设置已保存', saved: total });
          }
        }
      }
    );
  });
});

module.exports = router;