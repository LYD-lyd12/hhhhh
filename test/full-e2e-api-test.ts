/**
 * 全页面端到端 API 测试脚本
 * 模拟每个页面每个按钮的后台 API 调用
 * 运行: npx tsx test/full-e2e-api-test.ts
 */
const BASE = 'http://localhost:3000/api/v1';
const KB_URL = 'http://localhost:8002/api/v1';
const SKILL_URL = 'http://localhost:8001/api';
const MCP_URL = 'http://localhost:8003';

let TOKEN = '';
let USER_ID = '';
let testResults: { name: string; ok: boolean; detail: string }[] = [];

function log(name: string, ok: boolean, detail: string) {
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} ${name}: ${detail}`);
  testResults.push({ name, ok, detail });
}

async function req(method: string, path: string, body?: any, headers?: Record<string, string>) {
  const url = BASE + path;
  const opts: any = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
      ...headers,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  const text = await r.text();
  try { return { status: r.status, data: JSON.parse(text) }; }
  catch { return { status: r.status, data: text }; }
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  全功能端到端 API 测试');
  console.log('═══════════════════════════════════════════\n');

  // ═══ 1. 登录 ═══
  console.log('── 1. 登录系统 ──');
  const loginRes = await req('POST', '/auth/login', { email: 'admin@teletoken.io', password: 'admin123' }, {});
  if (loginRes.data.id) {
    TOKEN = loginRes.data.api_key || 'admin-api-key-123';
    USER_ID = loginRes.data.id;
    log('管理员登录', true, `role=${loginRes.data.role} balance=${loginRes.data.balance?.toFixed(2)}`);
  } else {
    log('管理员登录', false, JSON.stringify(loginRes.data).slice(0, 100));
    console.log('❌ 登录失败，终止测试');
    return;
  }

  // ═══ 2. 仪表盘 ═══
  console.log('\n── 2. 仪表盘（Dashboard）──');
  const stats = await req('GET', '/admin/stats');
  log('admin/stats', stats.data.user_count !== undefined, `users=${stats.data.user_count} calls=${stats.data.call_count} cost=${stats.data.total_cost}`);

  const logs = await req('GET', '/admin/call-logs?limit=5');
  log('admin/call-logs', Array.isArray(logs.data), `返回 ${logs.data?.length || 0} 条日志`);

  const nodes = await req('GET', '/nodes/health');
  log('nodes/health', nodes.data !== undefined, `节点数据: ${Array.isArray(nodes.data) ? nodes.data.length + '个' : JSON.stringify(nodes.data).slice(0, 50)}`);

  // ═══ 3. 用户管理 ═══
  console.log('\n── 3. 用户管理（Users）──');
  const users = await req('GET', '/admin/users');
  log('获取用户列表', users.data !== undefined, Array.isArray(users.data) ? `${users.data.length} 个用户` : '格式异常');

  // 创建用户
  const testEmail = `test-${Date.now()}@test.com`;
  const createRes = await req('POST', '/admin/users', { email: testEmail, password: 'test123', name: '测试用户' });
  const newUserId = createRes.data.id;
  log('创建用户', !!newUserId, `id=${newUserId?.slice(0, 8)}... email=${testEmail}`);

  // 编辑用户
  if (newUserId) {
    const updateRes = await req('PUT', `/admin/users/${newUserId}`, { name: '测试用户(已编辑)', balance: 100 });
    log('编辑用户', updateRes.status === 200, `新名字=${updateRes.data.name} 新余额=${updateRes.data.balance}`);

    // 删除用户
    const delRes = await req('DELETE', `/admin/users/${newUserId}`);
    log('删除用户', delRes.status === 200, delRes.data.message || '已删除');
  }

  // ═══ 4. 模型市场 ═══
  console.log('\n── 4. 模型市场（Models）──');
  const mappings = await req('GET', '/admin/model-mappings');
  const modelCount = Array.isArray(mappings.data) ? mappings.data.length : 0;
  log('获取模型映射', modelCount > 0, `${modelCount} 个模型`);

  const vendors = await req('GET', '/admin/vendor-configs');
  log('获取厂商配置', Array.isArray(vendors.data), `${vendors.data?.length || 0} 个厂商`);

  // 模型列表(公开)
  const models = await req('GET', '/models');
  log('获取模型列表(公开)', models.data !== undefined, Array.isArray(models.data) ? `${models.data.length} 个模型` : '');

  // 创建模型映射
  const newMapping = await req('POST', '/admin/model-mappings', {
    alias: `test-model-${Date.now()}`,
    vendor_id: 'vendor-deepseek',
    vendor_model_id: 'deepseek-chat',
    input_price: 0.001,
    output_price: 0.002,
  });
  const mappingId = newMapping.data.id;
  log('创建模型映射', !!mappingId, `alias=${newMapping.data.alias} id=${mappingId?.slice(0, 8)}...`);

  // 编辑模型价格
  if (mappingId) {
    const updateMapping = await req('PUT', `/admin/model-mappings/${mappingId}`, { input_price: 0.005, status: 'available' });
    log('编辑模型定价', updateMapping.status === 200, `新价格=${updateMapping.data.input_price}`);

    // 删除模型映射
    const delMapping = await req('DELETE', `/admin/model-mappings/${mappingId}`);
    log('删除模型映射', delMapping.status === 200, delMapping.data.message || '已删除');
  }

  // ═══ 5. 节点监控 ═══
  console.log('\n── 5. 节点监控（Nodes）──');
  const nodeHealth = await req('GET', '/nodes/health');
  log('节点健康状态', nodeHealth.status === 200, '健康检查通过');

  // ═══ 6. 系统设置 ═══
  console.log('\n── 6. 系统设置（Settings）──');
  // 编辑厂商
  const vendorUpdate = await req('PUT', '/admin/vendor-configs/vendor-deepseek', { status: 'active' });
  log('编辑厂商配置', vendorUpdate.status === 200, `vendor=${vendorUpdate.data?.vendor_name || 'DeepSeek'} status=${vendorUpdate.data?.status}`);

  // ═══ 7. 用量看板 ═══
  console.log('\n── 7. 用量看板（Billing）──');
  const balance = await req('GET', '/balance');
  log('账户余额', balance.data !== undefined, `余额=¥${balance.data?.balance?.toFixed(2) || balance.data}`);

  const usage = await req('GET', '/usage');
  log('用量统计', usage.status === 200, usage.data?.total_cost !== undefined ? `总消费=¥${usage.data.total_cost}` : 'OK');

  // API Keys
  const apiKeys = await req('GET', '/api-keys');
  log('API Key 列表', apiKeys.data !== undefined, `${Array.isArray(apiKeys.data) ? apiKeys.data.length + '个Key' : ''}`);

  // 创建 API Key
  const newKey = await req('POST', '/api-keys', { name: '测试Key', max_requests: 100 });
  log('创建 API Key', !!newKey.data?.id, `key=${newKey.data?.key?.slice(0, 12)}...`);
  if (newKey.data?.id) {
    const delKey = await req('DELETE', `/api-keys/${newKey.data.id}`);
    log('删除 API Key', delKey.status === 200, '已删除');
  }

  // 充值
  const topup = await req('POST', '/balance/topup', { amount: 0.01 });
  log('充值', topup.status === 200, topup.data.error ? `失败:${topup.data.error}` : `新余额=¥${topup.data?.balance?.toFixed(2)}`);

  // ═══ 8. Chat 调用 ═══
  console.log('\n── 8. Chat 调用 ──');
  const chatRes = await req('POST', '/chat/completions', {
    model: 'pollinations-gpt',
    messages: [{ role: 'user', content: '你好，请用一句话介绍自己' }],
  });
  const chatOk = !!chatRes.data.choices?.[0]?.message?.content;
  log('Chat 调用(pollinations)', chatOk, chatOk ? `${chatRes.data._vendor || ''} ${chatRes.data._latency_ms || ''}ms`.trim() : `失败:${JSON.stringify(chatRes.data).slice(0, 80)}`);

  const chatDeepseek = await req('POST', '/chat/completions', {
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: '1+1=?' }],
  });
  const dsOk = !!chatDeepseek.data.choices?.[0]?.message?.content;
  log('Chat 调用(DeepSeek)', dsOk, dsOk ? `${chatDeepseek.data._vendor || ''} ${chatDeepseek.data._latency_ms || ''}ms`.trim() : `失败:${JSON.stringify(chatDeepseek.data).slice(0, 80)}`);

  // ═══ 9. 技能资产库 ═══
  console.log('\n── 9. 技能资产库（Skills）──');
  try {
    const skillRes = await fetch(`${SKILL_URL}/skills?page=1&page_size=5`, { headers: { 'X-API-Key': 'skill-admin-key-123' } });
    const skillData = await skillRes.json();
    const skillOk = skillRes.status === 200;
    log('技能列表', skillOk, skillOk ? `${skillData.items?.length || skillData.data?.length || 0} 个技能` : `HTTP ${skillRes.status}: ${JSON.stringify(skillData).slice(0, 60)}`);
  } catch (e: any) {
    log('技能列表', false, `服务未启动: ${e.message.slice(0, 60)}`);
  }

  // ═══ 10. 知识库 ═══
  console.log('\n── 10. 知识库（KB）──');
  try {
    const kbRes = await fetch(`${KB_URL}/kbs?page=1&page_size=5`, { headers: { 'X-API-Key': 'kb-api-key-123' } });
    const kbData = await kbRes.json();
    const kbOk = kbRes.status === 200;
    log('知识库列表', kbOk, kbOk ? `${kbData.items?.length || kbData.data?.length || 0} 个知识库` : `HTTP ${kbRes.status}`);
  } catch (e: any) {
    log('知识库列表', false, `服务未启动: ${e.message.slice(0, 60)}`);
  }

  // ═══ 11. MCP管理 ═══
  console.log('\n── 11. MCP管理 ──');
  try {
    const mcpRes = await fetch(`${MCP_URL}/mcp/servers?page=1&page_size=5`, { headers: { 'X-API-Key': 'mcp-api-key-123' } });
    const mcpData = await mcpRes.json();
    const mcpOk = mcpRes.status === 200;
    log('MCP 列表', mcpOk, mcpOk ? `${mcpData.items?.length || mcpData.data?.length || 0} 个Server` : `HTTP ${mcpRes.status}`);
  } catch (e: any) {
    log('MCP 列表', false, `服务未启动: ${e.message.slice(0, 60)}`);
  }

  // ═══ 汇总 ═══
  console.log('\n═══════════════════════════════════════════');
  const total = testResults.length;
  const passed = testResults.filter(r => r.ok).length;
  const failed = testResults.filter(r => !r.ok).length;
  console.log(`\n📊 测试汇总: ${total} 项, ✅ ${passed} 通过, ❌ ${failed} 失败`);
  if (failed > 0) {
    console.log('\n❌ 失败项:');
    testResults.filter(r => !r.ok).forEach(r => console.log(`   - ${r.name}: ${r.detail}`));
  }
  console.log('');
}

main().catch(e => {
  console.error('测试脚本异常:', e.message);
  process.exit(1);
});
