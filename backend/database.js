/**
 * database.js - 使用 sql.js (WebAssembly SQLite) 实现持久化存储
 *
 * 设计说明:
 * - sql.js 是纯 WebAssembly 实现的 SQLite，无需 C++ 编译工具
 * - 数据库文件保存在 backend/data.db，写操作后自动持久化
 * - 对外暴露 db.get / db.all / db.run 与原回调式接口完全兼容
 * - db.run 的回调中通过 .call({ changes }) 支持 this.changes
 * - 初始化采用 Atomics.wait 同步等待 Promise 完成，避免异步问题
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'data.db');

// ────────────────────────────────────────────────
// 工具函数
// ────────────────────────────────────────────────
const hashPassword = (password) =>
  crypto.createHash('sha256').update(password).digest('hex');

// ────────────────────────────────────────────────
// sql.js 同步初始化
// 使用 Atomics.wait 在 Worker 外等待 Promise 完成
// ────────────────────────────────────────────────
let _db = null;

function persistDB() {
  try {
    const data = _db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (e) {
    console.error('[DB] 持久化失败:', e.message);
  }
}

function createTables() {
  _db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      balance REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      key TEXT UNIQUE NOT NULL,
      name TEXT,
      permissions TEXT DEFAULT 'all',
      max_requests INTEGER DEFAULT 1000,
      used_requests INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS vendor_configs (
      id TEXT PRIMARY KEY,
      vendor_name TEXT NOT NULL,
      adapter_key TEXT NOT NULL,
      api_base_url TEXT,
      api_key TEXT,
      api_secret TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS model_mappings (
      id TEXT PRIMARY KEY,
      alias TEXT UNIQUE NOT NULL,
      vendor_id TEXT NOT NULL,
      vendor_model_id TEXT NOT NULL,
      input_price REAL DEFAULT 0,
      output_price REAL DEFAULT 0,
      status TEXT DEFAULT 'available',
      FOREIGN KEY (vendor_id) REFERENCES vendor_configs(id)
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS call_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      api_key_id TEXT,
      model_alias TEXT,
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      cost REAL DEFAULT 0,
      duration INTEGER DEFAULT 0,
      vendor_key TEXT,
      status TEXT DEFAULT 'success',
      error_message TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS refunds (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      call_log_id TEXT,
      amount REAL DEFAULT 0,
      reason TEXT,
      admin_note TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (call_log_id) REFERENCES call_logs(id)
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      display_name TEXT,
      description TEXT,
      params_schema TEXT,
      status TEXT DEFAULT 'offline',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
}

function seedData() {
  // 读取某表行数的辅助函数
  function count(table) {
    const res = _db.exec(`SELECT COUNT(*) FROM ${table}`);
    return res[0]?.values[0][0] || 0;
  }

  // 用户
  if (count('users') === 0) {
    const now = new Date().toISOString();
    _db.run(
      `INSERT INTO users (id,email,password,name,role,balance,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`,
      ['admin-user-id', 'admin@teletoken.io', hashPassword('admin123'), '管理员', 'admin', 1000, now, now]
    );
    _db.run(
      `INSERT INTO users (id,email,password,name,role,balance,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`,
      ['test-user-id', 'test@teletoken.io', hashPassword('test123'), '测试用户', 'user', 100, now, now]
    );
    console.log('[DB] 初始用户数据已插入');
  }

  // 厂商配置
  if (count('vendor_configs') === 0) {
    const now = new Date().toISOString();
    const vendors = [
      // 付费厂商（需配置 API Key 才能真实调用）
      ['vendor-volcengine', '火山引擎', 'volcengine', 'https://api.volcengine.com'],
      ['vendor-zhipu',      '智谱AI',   'zhipu',      'https://api.zhipuai.cn'],
      ['vendor-minimax',    'MiniMax',  'minimax',    'https://api.minimax.chat'],
      ['vendor-alibaba',    '阿里云',   'alibaba',    'https://dashscope.aliyuncs.com'],
      ['vendor-deepseek',   'DeepSeek', 'deepseek',   'https://api.deepseek.com'],
      // 免费厂商（无需 API Key，开箱即用）
      ['vendor-pollinations', 'Pollinations.ai (免费)', 'pollinations', 'https://text.pollinations.ai'],
      ['vendor-ollama',       'Ollama (本地免费)',      'ollama',       'http://localhost:11434'],
    ];
    for (const [id, vendor_name, adapter_key, api_base_url] of vendors) {
      _db.run(
        `INSERT INTO vendor_configs (id,vendor_name,adapter_key,api_base_url,api_key,api_secret,status,created_at,updated_at)
         VALUES (?,?,?,?,'','','active',?,?)`,
        [id, vendor_name, adapter_key, api_base_url, now, now]
      );
    }
    console.log('[DB] 初始厂商配置已插入');
  }

  // 模型映射
  if (count('model_mappings') === 0) {
    const models = [
      // 付费厂商模型
      ['model-1',  'gpt-3.5-turbo', 'vendor-volcengine', 'doubao-3.5-turbo', 0.0015, 0.002,  'available'],
      ['model-2',  'gpt-4',         'vendor-volcengine', 'doubao-4',          0.006,  0.018,  'available'],
      ['model-3',  'chatglm-6b',    'vendor-zhipu',      'chatglm-6b',        0.001,  0.001,  'available'],
      ['model-4',  'chatglm2-6b',   'vendor-zhipu',      'chatglm2-6b',       0.0012, 0.0012, 'available'],
      ['model-5',  'abab-5-chat',   'vendor-minimax',    'abab-5-chat',       0.0018, 0.0025, 'available'],
      ['model-6',  'qwen-7b-chat',  'vendor-alibaba',    'qwen-7b-chat',      0.0012, 0.0012, 'available'],
      ['model-7',  'qwen-14b-chat', 'vendor-alibaba',    'qwen-14b-chat',     0.002,  0.002,  'available'],
      ['model-8',  'whisper-1',     'vendor-volcengine', 'speech-to-text',    0.006,  0,      'available'],
      ['model-9',  'dall-e-3',      'vendor-volcengine', 'text-to-image',     0,      0.02,   'available'],
      ['model-10', 'codegeex-2',    'vendor-zhipu',      'codegeex-2',        0.0015, 0.0015, 'available'],
      ['model-11', 'speech-large',  'vendor-minimax',    'speech-large',      0.008,  0,      'limited'],
      ['model-12', 'video-gen',     'vendor-minimax',    'video-gen',         0,      0.1,    'unavailable'],
      ['model-13', 'wanxiang',      'vendor-alibaba',    'wanxiang',          0,      0.015,  'available'],
      ['model-14', 'tingwu',        'vendor-alibaba',    'tingwu',            0.005,  0,      'available'],
      // DeepSeek 模型（性价比极高，OpenAI 兼容）
      ['model-15', 'deepseek-chat',     'vendor-deepseek', 'deepseek-chat',     0.001,  0.002,  'available'],
      ['model-16', 'deepseek-reasoner', 'vendor-deepseek', 'deepseek-reasoner', 0.004,  0.016,  'available'],
      // 免费模型（Pollinations.ai，无需 API Key，¥0 价格）
      ['model-17', 'pollinations-gpt',     'vendor-pollinations', 'openai',        0, 0, 'available'],
      ['model-18', 'pollinations-mistral', 'vendor-pollinations', 'mistral',       0, 0, 'available'],
      // 本地模型（Ollama，需先安装 Ollama 并拉取模型）
      ['model-19', 'ollama-qwen',      'vendor-ollama', 'qwen2.5:0.5b',  0, 0, 'available'],
      ['model-20', 'ollama-llama',     'vendor-ollama', 'llama3.2:1b',   0, 0, 'available'],
      ['model-21', 'ollama-deepseek',  'vendor-ollama', 'deepseek-r1:1.5b', 0, 0, 'available'],
    ];
    for (const [id, alias, vendor_id, vendor_model_id, input_price, output_price, status] of models) {
      _db.run(
        `INSERT INTO model_mappings (id,alias,vendor_id,vendor_model_id,input_price,output_price,status)
         VALUES (?,?,?,?,?,?,?)`,
        [id, alias, vendor_id, vendor_model_id, input_price, output_price, status]
      );
    }
    console.log('[DB] 初始模型映射已插入');
  }

  // API Keys
  if (count('api_keys') === 0) {
    const now = new Date().toISOString();
    _db.run(
      `INSERT INTO api_keys (id,user_id,key,name,permissions,max_requests,used_requests,created_at)
       VALUES (?,?,?,?,?,?,?,?)`,
      ['key-1', 'admin-user-id', 'admin-api-key-123', '管理员默认Key', 'all', 10000, 0, now]
    );
    _db.run(
      `INSERT INTO api_keys (id,user_id,key,name,permissions,max_requests,used_requests,created_at)
       VALUES (?,?,?,?,?,?,?,?)`,
      ['key-2', 'test-user-id', 'test-api-key-456', '测试用户Key', 'all', 1000, 0, now]
    );
    console.log('[DB] 初始 API Keys 已插入');
  }

  // 系统设置
  if (count('system_settings') === 0) {
    const now = new Date().toISOString();
    _db.run(`INSERT INTO system_settings (key,value,updated_at) VALUES (?,?,?)`,
      ['site_name', 'TeleToken Router', now]);
    _db.run(`INSERT INTO system_settings (key,value,updated_at) VALUES (?,?,?)`,
      ['default_balance', '100', now]);
    console.log('[DB] 默认系统设置已插入');
  }
}

// ────────────────────────────────────────────────
// 同步等待 sql.js 初始化完成
// Node.js 主线程不允许 Atomics.wait，故使用子进程同步方式：
// 直接调用 initSqlJs 并在 .then 里设置标志位，
// 利用 Node.js v12+ 的 worker_threads Atomics.waitAsync 或
// 简单轮询（实际 WASM 加载极快，通常 < 50ms）
// ────────────────────────────────────────────────

// 同步初始化：利用子进程 + 标志位实现"同步感"
// 方案：先尝试加载，标记完成，路由调用时 WASM 必已加载（服务器启动到第一个请求至少数十ms）
let _initialized = false;
let _initError = null;

(function init() {
  const initSqlJs = require('sql.js');
  const wasmPath = path.join(__dirname, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');

  initSqlJs({ locateFile: () => wasmPath })
    .then(SQL => {
      if (fs.existsSync(DB_PATH)) {
        const buf = fs.readFileSync(DB_PATH);
        _db = new SQL.Database(buf);
        console.log('[DB] 已从磁盘加载数据库:', DB_PATH);
      } else {
        _db = new SQL.Database();
        console.log('[DB] 新建数据库:', DB_PATH);
      }
      _db.run('PRAGMA foreign_keys = ON;');
      createTables();
      // 迁移：为已存在的 users 表添加 role 列（若尚无）
      try {
        _db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
        console.log('[DB] 已为 users 表添加 role 列（迁移）');
        // ALTER TABLE ADD COLUMN 会把已有行的 role 设为 'user'，
        // 需要恢复管理员的 admin 角色
        _db.run("UPDATE users SET role = 'admin' WHERE email = 'admin@teletoken.io'");
      } catch (e) {
        // 列已存在则忽略
      }
      seedData();
      persistDB();
      _initialized = true;
      console.log('[DB] 数据库初始化完成 ✓');
    })
    .catch(err => {
      _initError = err;
      _initialized = true; // 标记完成（即使失败）
      console.error('[DB] 初始化失败:', err.message);
    });
})();

// ────────────────────────────────────────────────
// 内部辅助：等待初始化完成后再执行操作
// 使用 setImmediate 轮询，避免阻塞事件循环
// ────────────────────────────────────────────────
function whenReady(fn) {
  if (_initialized) {
    fn();
  } else {
    // 轮询等待，最多等待 10s（每次检查间隔 10ms）
    let retries = 0;
    const MAX_RETRIES = 1000;
    function check() {
      if (_initialized) {
        fn();
      } else if (retries++ < MAX_RETRIES) {
        setTimeout(check, 10);
      } else {
        fn(new Error('数据库初始化超时'));
      }
    }
    setTimeout(check, 10);
  }
}

// ────────────────────────────────────────────────
// 写操作判断
// ────────────────────────────────────────────────
const WRITE_RE = /^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i;
function isWriteQuery(sql) {
  return WRITE_RE.test(sql);
}

// ────────────────────────────────────────────────
// 对外暴露的 db 对象，保持原有回调接口签名
// ────────────────────────────────────────────────
const db = {
  /**
   * 查询单行
   * callback(err, row | undefined)
   */
  get(query, params, callback) {
    whenReady((initErr) => {
      if (initErr || _initError) {
        return callback(initErr || _initError, null);
      }
      try {
        const stmt = _db.prepare(query);
        stmt.bind(params || []);
        let row;
        if (stmt.step()) {
          row = stmt.getAsObject();
        }
        stmt.free();
        callback(null, row);
      } catch (err) {
        console.error('[DB] get 错误 |', query.substring(0, 80), '|', err.message);
        callback(err, null);
      }
    });
  },

  /**
   * 查询多行
   * callback(err, rows[])
   */
  all(query, params, callback) {
    whenReady((initErr) => {
      if (initErr || _initError) {
        return callback(initErr || _initError, []);
      }
      try {
        const stmt = _db.prepare(query);
        stmt.bind(params || []);
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        callback(null, rows);
      } catch (err) {
        console.error('[DB] all 错误 |', query.substring(0, 80), '|', err.message);
        callback(err, []);
      }
    });
  },

  /**
   * 执行写操作（INSERT / UPDATE / DELETE 等）
   * callback 通过 .call({ changes }) 注入，支持 this.changes
   */
  run(query, params, callback) {
    whenReady((initErr) => {
      if (initErr || _initError) {
        if (callback) callback.call({ changes: 0 }, initErr || _initError);
        return;
      }
      try {
        _db.run(query, params || []);
        const changes = _db.getRowsModified();

        if (isWriteQuery(query)) {
          persistDB();
        }

        if (callback) {
          callback.call({ changes }, null);
        }
      } catch (err) {
        console.error('[DB] run 错误 |', query.substring(0, 80), '|', err.message);
        if (callback) {
          callback.call({ changes: 0 }, err);
        }
      }
    });
  }
};

module.exports = db;
