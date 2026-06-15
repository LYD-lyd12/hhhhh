'use client'

import { useState, useEffect } from 'react'
import { Download, Calendar, Filter, Wallet, CreditCard, Copy, Check, Eye, EyeOff, Key, Plus, Trash2, TrendingUp, Cpu, Activity, Zap, Shield } from 'lucide-react'
import { PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '@/lib/api'

interface BillingRecord {
  id: string
  date: string
  model: string
  inputTokens: number
  outputTokens: number
  totalCost: number
  status: 'completed' | 'pending'
}

interface ApiKeyRecord {
  id: string
  key: string
  name: string
  max_requests: number
  used_requests: number
  created_at: string
}

// ─── 模型颜色池 ──────────────────────────────────
const MODEL_COLORS = ['#38bdf8', '#a78bfa', '#f97316', '#34d399', '#f472b6', '#fbbf24', '#94a3b8', '#fb7185']

export default function Billing() {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [balance, setBalance] = useState(0)
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([])
  const [monthlyCost, setMonthlyCost] = useState(0)
  const [monthlyTokens, setMonthlyTokens] = useState(0)
  const [loading, setLoading] = useState(true)

  // ─── 动态数据（从 API 计算） ─────────────────────
  const [vendorHealth, setVendorHealth] = useState<{ vendor: string; health: number; calls: number; latency: string; status: 'online' | 'degraded' | 'offline' }[]>([])
  const [modelDistribution, setModelDistribution] = useState<{ name: string; value: number; color: string }[]>([])
  const [callWave, setCallWave] = useState<{ time: string; calls: number; cost: number }[]>([])
  const [costRanking, setCostRanking] = useState<{ model: string; cost: number; percentage: number }[]>([])
  const [totalCallCount, setTotalCallCount] = useState(0)

  // ─── API Key 管理 ────────────────────────────────────
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([])
  const [showApiKey, setShowApiKey] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [keyLoading, setKeyLoading] = useState(false)

  const periods = [
    { id: 'week', label: '本周' },
    { id: 'month', label: '本月' },
    { id: 'year', label: '本年' },
  ]

  useEffect(() => {
    fetchData()
    fetchApiKeys()
    fetchNodesHealth()
    fetchCallLogs()
  }, [selectedPeriod])

  // ─── API Key 方法 ────────────────────────────────────
  const fetchApiKeys = async () => {
    try {
      const res = await api.apiKeys.list()
      if (res.data && Array.isArray(res.data)) setApiKeys(res.data)
    } catch (err) {
      console.error('Failed to fetch API keys:', err)
    }
  }

  const handleCreateKey = async () => {
    setKeyLoading(true)
    try {
      const name = `API Key ${apiKeys.length + 1}`
      await api.apiKeys.create(name, 5000)
      await fetchApiKeys()
    } catch (err) {
      console.error('Failed to create API key:', err)
      alert('创建 API Key 失败')
    } finally {
      setKeyLoading(false)
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    if (apiKeys.length <= 1) {
      alert('至少保留一个 API Key')
      return
    }
    setKeyLoading(true)
    try {
      await api.apiKeys.delete(keyId)
      await fetchApiKeys()
    } catch (err) {
      console.error('Failed to delete API key:', err)
    } finally {
      setKeyLoading(false)
    }
  }

  const copyApiKey = async (key: string) => {
    await navigator.clipboard.writeText(key)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [balanceRes, usageRes] = await Promise.all([
        api.billing.balance(),
        api.billing.usage(),
      ])
      setBalance(balanceRes.balance || 0)
      if (usageRes.data && Array.isArray(usageRes.data)) {
        const records = usageRes.data.map((record: any) => ({
          id: record.id || Date.now().toString(),
          date: record.timestamp || record.created_at || new Date().toISOString(),
          model: record.model || record.model_alias || 'Unknown',
          inputTokens: record.input_tokens || 0,
          outputTokens: record.output_tokens || 0,
          totalCost: record.cost || 0,
          status: record.status || 'completed',
        }))
        setBillingRecords(records)
        const now = new Date()
        const thisMonth = now.getMonth()
        const thisYear = now.getFullYear()
        let monthCost = 0
        let monthTokens = 0
        records.forEach((r: BillingRecord) => {
          const d = new Date(r.date)
          if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
            monthCost += r.totalCost
            monthTokens += r.inputTokens + r.outputTokens
          }
        })
        if (monthCost > 0) { setMonthlyCost(monthCost); setMonthlyTokens(monthTokens) }
      }
    } catch {
      console.error('Failed to fetch billing data, using fixtures')
    } finally {
      setLoading(false)
    }
  }

  const handleTopup = async (amount: number) => {
    try {
      await api.billing.topup(amount)
      await fetchData()
      alert(`充值成功！已充值 ¥${amount}`)
    } catch {
      alert('充值失败，请稍后重试')
    }
  }

  // ─── 获取节点健康数据 → 替换 VENDOR_HEALTH 假数据 ──
  const fetchNodesHealth = async () => {
    try {
      const json = await api.nodes.health()
      if (json.data && Array.isArray(json.data)) {
        const vendors = json.data.map((n: any) => ({
          vendor: (n.vendor || n.name || 'Unknown'),
          health: n.status === 'healthy' ? 99.5 : n.status === 'warning' ? 95 : 85,
          calls: n.activeRequests || 0,
          latency: `${n.latency || 0}ms`,
          status: n.status === 'healthy' ? 'online' as const : n.status === 'warning' ? 'degraded' as const : 'offline' as const,
        }))
        setVendorHealth(vendors)
      }
    } catch { /* 失败时保留空，页面显示为空 */ }
  }

  // ─── 获取调用日志 → 计算分布/趋势/排名 ──────────────
  const fetchCallLogs = async () => {
    try {
      const res = await api.admin.callLogs({})
      if (!res.data || !Array.isArray(res.data)) return
      const logs: any[] = res.data
      setTotalCallCount(logs.length)

      // 1. 模型分布
      const modelMap = new Map<string, number>()
      logs.forEach((l: any) => {
        const model = l.model_alias || 'Unknown'
        modelMap.set(model, (modelMap.get(model) || 0) + 1)
      })
      const total = modelMap.size > 0 ? Array.from(modelMap.values()).reduce((a, b) => a + b, 0) : 1
      const dist = Array.from(modelMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count], i) => ({
          name,
          value: Math.round((count / total) * 100),
          color: MODEL_COLORS[i % MODEL_COLORS.length],
        }))
      setModelDistribution(dist)

      // 2. 成本排名
      const costMap = new Map<string, number>()
      logs.forEach((l: any) => {
        const model = l.model_alias || 'Unknown'
        costMap.set(model, (costMap.get(model) || 0) + (l.cost || 0))
      })
      const totalCost = Array.from(costMap.values()).reduce((a, b) => a + b, 0) || 1
      const ranking = Array.from(costMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(([model, cost]) => ({
          model,
          cost: Math.round(cost * 100) / 100,
          percentage: Math.round((cost / totalCost) * 100),
        }))
      if (ranking.length < 7) {
        ranking.push({ model: '其他', cost: 0, percentage: Math.max(0, 100 - ranking.reduce((s, r) => s + r.percentage, 0)) })
      }
      setCostRanking(ranking)

      // 3. 调用趋势（按小时聚合）
      const hourMap = new Map<number, { calls: number; cost: number }>()
      for (let h = 0; h < 24; h++) hourMap.set(h, { calls: 0, cost: 0 })
      logs.forEach((l: any) => {
        if (l.created_at) {
          const d = new Date(l.created_at)
          if (!isNaN(d.getTime())) {
            const h = d.getHours()
            const cur = hourMap.get(h) || { calls: 0, cost: 0 }
            hourMap.set(h, { calls: cur.calls + 1, cost: cur.cost + (l.cost || 0) })
          }
        }
      })
      setCallWave(Array.from(hourMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([h, v]) => ({ time: `${h}:00`, calls: v.calls, cost: Math.round(v.cost * 1000) / 1000 })))
    } catch { /* 失败时保留空 */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-400"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="billing-dashboard">
      {/* ═══ 顶栏 ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">用量大屏</h1>
          <p className="text-slate-400 text-sm mt-1">实时监控多模型调用与成本</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
            {periods.map(period => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  selectedPeriod === period.id
                    ? 'bg-sky-600/30 text-sky-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ 价值主张横幅 ═══ */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-sky-900/60 via-indigo-900/50 to-purple-900/60 border border-sky-500/20 p-5">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-sky-400" />
              </div>
              <div>
                <div className="text-sm text-slate-300">翼站Token超市</div>
                <div className="text-lg font-bold text-white mt-0.5">
                  已接入 <span className="text-sky-400">{vendorHealth.length || 7}</span> 家厂商 <span className="text-sky-400">{modelDistribution.length || 21}</span> 个模型
                </div>
              </div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="grid grid-cols-3 gap-6">
              {[
                { value: `${monthlyCost > 0 ? Math.round(monthlyCost * 30 / Math.max(balance, 1)) : '40'}%+`, label: 'API 成本节省', color: 'text-emerald-400' },
                { value: `${vendorHealth.length > 0 ? Math.round(vendorHealth.filter(v => v.status === 'online').length / Math.max(vendorHealth.length, 1) * 100) : 99}%`, label: '服务可用率', color: 'text-sky-400' },
                { value: `${totalCallCount > 0 ? (totalCallCount / 1000).toFixed(0) + 'K+' : '29K+'}`, label: '累计调用量', color: 'text-purple-400' },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 核心指标卡 ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: '账户余额', value: `¥${balance.toFixed(2)}`, icon: Wallet, color: 'from-sky-500/20 to-sky-600/10', border: 'border-sky-500/30', textColor: 'text-sky-400' },
          { label: '本月消费', value: `¥${monthlyCost.toFixed(2)}`, icon: TrendingUp, color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/30', textColor: 'text-emerald-400' },
          { label: 'Token 消耗', value: `${(monthlyTokens / 1000).toFixed(0)}K`, icon: Cpu, color: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/30', textColor: 'text-purple-400', sub: `约 ¥${(monthlyCost / Math.max(monthlyTokens, 1)).toFixed(4)}/Token` },
          { label: '活跃厂商', value: `${vendorHealth.filter(v => v.status === 'online').length}/${vendorHealth.length || 7}`, icon: Activity, color: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/30', textColor: 'text-amber-400', sub: '在线 / 总计' },
        ].map((card, i) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className={`glass-card rounded-xl p-5 bg-gradient-to-br ${card.color} border ${card.border} animate-fade-in-up`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-xs">{card.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${card.textColor} neon-text`}>{card.value}</p>
                  {card.sub && <p className="text-xs text-slate-500 mt-1">{card.sub}</p>}
                </div>
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-slate-300" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ═══ 中间行：模型占比饼图 + 成本排名 ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 模型调用占比 - 饼图 */}
        <div className="glass-card rounded-xl border border-white/10 p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-400" />
            多模型调用占比
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modelDistribution.length > 0 ? modelDistribution : [{ name: '无数据', value: 100, color: '#94a3b8' }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(modelDistribution.length > 0 ? modelDistribution : [{ name: '无数据', value: 100, color: '#94a3b8' }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(56,189,248,0.3)',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                  formatter={(value: number) => [`${value}%`, '占比']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {(modelDistribution.length > 0 ? modelDistribution : [{ name: '暂无调用数据', value: 100, color: '#94a3b8' }]).slice(0, 6).map(m => (
              <div key={m.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                <span className="text-slate-400">{m.name}</span>
                <span className="text-slate-300 ml-auto">{m.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 实时调用波浪 */}
        <div className="glass-card rounded-xl border border-white/10 p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            实时调用趋势
            <span className="status-pulse ml-auto" />
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={callWave}>
                <defs>
                  <linearGradient id="callGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} interval={3} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(56,189,248,0.3)',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                />
                <Area type="monotone" dataKey="calls" stroke="#38bdf8" strokeWidth={2} fill="url(#callGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 成本排名 */}
        <div className="glass-card rounded-xl border border-white/10 p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            模型成本排名
          </h2>
          <div className="space-y-2">
            {(costRanking.length > 0 ? costRanking : [{ model: '暂无数据', cost: 0, percentage: 100 }]).map((item, i) => (
              <div key={item.model} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-4">{i + 1}</span>
                <span className="text-xs text-slate-300 flex-1 truncate">{item.model}</span>
                <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-purple-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-12 text-right">¥{item.cost}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ 厂商健康度 ═══ */}
      <div className="glass-card rounded-xl border border-white/10 p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          厂商健康状态
          <span className="text-xs text-slate-500 ml-2">{vendorHealth.length || 0} 家厂商实时监控</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {vendorHealth.length > 0 ? vendorHealth.map(v => (
            <div
              key={v.vendor}
              className={`rounded-xl p-3 border transition-all ${
                v.status === 'online'
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : v.status === 'degraded'
                  ? 'bg-amber-500/5 border-amber-500/20'
                  : 'bg-red-500/5 border-red-500/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-300">{v.vendor}</span>
                <span className={`w-2 h-2 rounded-full ${
                  v.status === 'online' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' :
                  v.status === 'degraded' ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]' :
                  'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]'
                }`} />
              </div>
              <div className="space-y-1.5">
                <div>
                  <span className="text-[10px] text-slate-500">可用率</span>
                  <div className={`text-lg font-bold ${v.health >= 99 ? 'text-emerald-400' : v.health >= 95 ? 'text-amber-400' : 'text-red-400'}`}>
                    {v.health}%
                  </div>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">调用 {v.calls.toLocaleString()}</span>
                  <span className="text-slate-500">{v.latency}</span>
                </div>
              </div>
            </div>
          )) : <div className="col-span-full text-center text-slate-500 text-xs py-8">暂无节点数据</div>}
        </div>
      </div>

      {/* ═══ API Key 管理 ═══ */}
      <div className="glass-card rounded-xl border border-white/10 p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-white">我的 API Key</h2>
            <span className="text-[10px] px-2 py-0.5 bg-sky-500/10 rounded-full text-sky-400 border border-sky-500/20">
              {apiKeys.length} 个
            </span>
          </div>
          <button
            onClick={handleCreateKey}
            disabled={keyLoading}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-sky-600/30 hover:bg-sky-600/50 rounded-lg transition-colors disabled:opacity-50 text-sky-300 border border-sky-500/30"
          >
            <Plus className="w-3 h-3" />
            生成新 Key
          </button>
        </div>

        {apiKeys.length === 0 ? (
          <p className="text-sm text-slate-500 py-3">暂无 API Key，请点击"生成新 Key"创建</p>
        ) : (
          <div className="space-y-2">
            {apiKeys.map((ak) => (
              <div key={ak.id} className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/5">
                <code className="flex-1 text-sm font-mono text-cyan-400 truncate select-all">
                  {showApiKey ? ak.key : ak.key.substring(0, 12) + '•'.repeat(Math.min(ak.key.length - 8, 24)) + ak.key.substring(ak.key.length - 4)}
                </code>
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-1.5 text-slate-500 hover:text-slate-300 rounded transition-colors"
                  title={showApiKey ? '隐藏' : '显示'}
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => copyApiKey(ak.key)}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs bg-sky-600/30 hover:bg-sky-600/50 rounded-lg transition-colors text-sky-300"
                >
                  {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedKey ? '已复制' : '复制'}
                </button>
                {apiKeys.length > 1 && (
                  <button
                    onClick={() => handleDeleteKey(ak.id)}
                    className="p-1.5 text-slate-600 hover:text-red-400 rounded transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {apiKeys.length > 0 && (
          <div className="mt-3 text-xs text-slate-500">
            请求头添加 <code className="text-cyan-400 bg-white/5 px-1 rounded">Authorization: Bearer YOUR_API_KEY</code> 即可调用 API
          </div>
        )}
      </div>

      {/* ═══ 消费明细表格 ═══ */}
      <div className="glass-card rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">消费明细</h2>
          <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200">
            <Filter className="w-3 h-3" />
            筛选
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-2.5 px-4 text-[11px] font-medium text-slate-500">时间</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-medium text-slate-500">模型</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-medium text-slate-500">输入Token</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-medium text-slate-500">输出Token</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-medium text-slate-500">消耗金额</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-medium text-slate-500">状态</th>
              </tr>
            </thead>
            <tbody>
              {billingRecords.map(record => (
                <tr key={record.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-4 text-xs text-slate-400">{record.date}</td>
                  <td className="py-2.5 px-4 text-xs text-slate-300 font-medium">{record.model}</td>
                  <td className="py-2.5 px-4 text-xs text-slate-400">{record.inputTokens.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-xs text-slate-400">{record.outputTokens.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-xs font-medium text-cyan-400">¥{record.totalCost.toFixed(4)}</td>
                  <td className="py-2.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full ${
                      record.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        record.status === 'completed' ? 'bg-emerald-400' : 'bg-amber-400'
                      }`} />
                      {record.status === 'completed' ? '已完成' : '处理中'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 快捷充值（紧凑版） */}
      <div className="glass-card rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-sky-400" />
          快捷充值
        </h3>
        <div className="flex flex-wrap gap-2">
          {[100, 500, 1000, 2000, 5000].map(amount => (
            <button
              key={amount}
              onClick={() => handleTopup(amount)}
              className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 hover:bg-sky-600/20 hover:border-sky-500/30 hover:text-sky-300 transition-all"
            >
              ¥{amount}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
