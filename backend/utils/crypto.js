// 密码哈希工具（可独立测试）
const crypto = require('crypto');

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

const comparePassword = (password, hash) => {
  return hashPassword(password) === hash;
};

module.exports = { hashPassword, comparePassword };