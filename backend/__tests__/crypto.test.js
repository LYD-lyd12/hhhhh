// 密码哈希工具单元测试
const { hashPassword, comparePassword } = require('../utils/crypto');

describe('hashPassword', () => {
  test('相同密码产生相同哈希', () => {
    const hash1 = hashPassword('admin123');
    const hash2 = hashPassword('admin123');
    expect(hash1).toBe(hash2);
  });

  test('不同密码产生不同哈希', () => {
    const hash1 = hashPassword('admin123');
    const hash2 = hashPassword('different');
    expect(hash1).not.toBe(hash2);
  });

  test('输出是 64 位十六进制字符串 (SHA256)', () => {
    const hash = hashPassword('test');
    expect(hash).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
  });

  test('空字符串也能正常工作', () => {
    const hash = hashPassword('');
    expect(hash).toHaveLength(64);
  });
});

describe('comparePassword', () => {
  test('正确密码返回 true', () => {
    const hash = hashPassword('mypassword');
    expect(comparePassword('mypassword', hash)).toBe(true);
  });

  test('错误密码返回 false', () => {
    const hash = hashPassword('mypassword');
    expect(comparePassword('wrongpassword', hash)).toBe(false);
  });

  test('大小写敏感', () => {
    const hash = hashPassword('Password');
    expect(comparePassword('password', hash)).toBe(false);
  });
});