import { useState, useEffect } from 'react'
import { Layers, MessageSquare, TrendingUp, Clock, Activity, Cpu, BarChart3 } from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'

interface DashboardStats {
  user_count: number
  api_key_count: number
  call_count: number
  total_cost: number
}

interface CallLog {
  id: string
  created_at: string
  model_alias: string
  input_tokens: number
  output_tokens: number
  cost: number
  duration: number
  status: string
}

interface MonthlyUsage {
  month: string
  usage: number
}

const FIXTURE_MONTHLY: MonthlyUsage[] = [
  { month: '1月', usage: 120 },
  { month: '2月', usage: 210 },
  { month: '3月', usage: 180 },
  { month: '4月', usage: 310 },
  { month: '5月', usage: 280 },
  { month: '6月', usage: 420 },
]

const USER_STAT_CARDS = [
  { key: 'calls', title: '今日调用', icon: MessageSquare, color: 'sky', format: (v: number) => v.toLocaleString() },
  { key: 'tokens', title: 'Token 消耗', icon: TrendingUp, color: 'violet', format: (v: number) => v.toLocaleString() },
]

const ADMIN_STAT_CARDS = [
  { key: 'users', title: '活跃用户', icon: Layers, color: 'emerald', format: (v: number) => v.toString() },
  { key: 'keys', title: 'API Key', icon: Clock, color: 'amber', format: (v: number) => v.toString() },
]

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  sky:    { bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.2)',  text: '#38bdf8', glow: 'rgba(56,189,248,0.15)' },
  violet: { bg: 'rgba(139,92,246,0.08)',   border: 'rgba(139,92,246,0.2)',   text: '#8b5cf6', glow: 'rgba(139,92,246,0.15)' },
  emerald:{ bg: 'rgba(52,211,153,0.08)',   border: 'rgba(52,211,153,0.2)',   text: '#34d399', glow: 'rgba(52,211,153,0.15)' },
  amber:  { bg: 'rgba(251,191,36,0.08)',   border: 'rgba(251,191,36,0.2)',   text: '#fbbf24', glow: 'rgba(251,191,36,0.15)' },
}

export default function Dashboard() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const STAT_CARDS = isAdmin ? [...USER_STAT_CARDS, ...ADMIN_STAT_CARDS] : USER_STAT_CARDS
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentLogs, setRecentLogs] = useState<CallLog[]>([])
  const [monthlyUsage, setMonthlyUsage] = useState<MonthlyUsage[]>(FIXTURE_MONTHLY)

  useEffect(() => { fetchDashboardData() }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [statsRes, logsRes] = await Promise.all([
        api.admin.stats(),
        // 获取所有日志用于月度图表，最近 5 条用于列表展示
        api.admin.callLogs({}),
      ])
      setStats(statsRes)
      if (logsRes.data && Array.isArray(logsRes.data)) {
        // 最近 5 条用于列表
        setRecentLogs(logsRes.data.slice(0, 5))
        // 全部日志用于月度图表
        generateMonthlyFromLogs(logsRes.data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateMonthlyFromLogs = (logs: any[]) => {
    const monthlyMap = new Map<string, number>()
    logs.forEach((log: any) => {
      if (log.created_at) {
        const date = new Date(log.created_at)
        const key = `${date.getMonth() + 1}月`
        const tokens = (log.input_tokens || 0) + (log.output_tokens || 0)
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + tokens)
      }
    })
    if (monthlyMap.size > 0) {
      setMonthlyUsage(Array.from(monthlyMap.entries()).map(([month, usage]) => ({ month, usage })))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 rounded-full border-2 border-sky-500/20 border-t-sky-400 animate-spin" />
      </div>
    )
  }

  const todayCalls = stats?.call_count || 0
  // Token 消耗从 call_logs 汇总
  const totalTokens = recentLogs.reduce((sum, log) => sum + (log.input_tokens || 0) + (log.output_tokens || 0), 0)
  const statValues = {
    calls: stats?.call_count || todayCalls,
    tokens: totalTokens,
    users: stats?.user_count || 0,
    keys: stats?.api_key_count || 0,
  }

  return (
    <div className="space-y-6" style={{ zIndex: 1, position: 'relative' }}>
      {/* 顶部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Activity className="w-6 h-6 text-sky-400" />
            仪表盘
            <span className="text-xs font-normal text-slate-600 mono">v2.0</span>
          </h1>
          <p className="text-slate-500 mt-1 mono text-xs">实时监控 · 多模型路由 · Token 精确计费</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
          style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 status-pulse" />
          <span className="text-emerald-400 font-medium mono text-xs">系统运行正常</span>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon
          const c = COLOR_MAP[card.color]
          const value = statValues[card.key as keyof typeof statValues]
          return (
            <div
              key={card.key}
              className="rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up group"
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                boxShadow: `0 4px 20px ${c.glow}`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{card.title}</span>
                <Icon className="w-5 h-5" style={{ color: c.text }} />
              </div>
              <div className="mono text-2xl font-bold" style={{ color: c.text }}>
                {card.format(value as number)}
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-slate-500">实时更新</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 图表 + 排行 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Token 趋势 */}
        <div
          className="lg:col-span-2 rounded-xl p-6"
          style={{
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid rgba(56,189,248,0.12)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-400" />
              Token 消耗趋势
            </h2>
            <span className="text-[10px] text-slate-600 mono">近 6 个月</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyUsage}>
                <defs>
                  <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,0.06)" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15,23,42,0.95)',
                    border: '1px solid rgba(56,189,248,0.2)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(12px)',
                    color: '#e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="usage"
                  name="Token 用量"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fill="url(#tokenGrad)"
                  dot={{ fill: '#38bdf8', r: 4, strokeWidth: 0 }}
                  activeDot={{ fill: '#38bdf8', r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 模型排行 */}
        <div
          className="rounded-xl p-6"
          style={{
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid rgba(56,189,248,0.12)',
          }}
        >
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-400" />
            模型调用排行
          </h2>
          {recentLogs.length === 0 ? (
            <p className="text-xs text-slate-600 mono py-8 text-center">暂无调用记录</p>
          ) : (
            <div className="space-y-2.5">
              {recentLogs.slice(0, 5).map((log, index) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 hover:bg-white/5"
                >
                  <span className="mono text-xs font-bold w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{
                      background: index === 0 ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.03)',
                      color: index === 0 ? '#38bdf8' : '#94a3b8',
                    }}
                  >
                    {index + 1}
                  </span>
                  <span className="text-sm text-slate-300 flex-1 font-medium">{log.model_alias}</span>
                  <span className="mono text-xs text-slate-500">¥{log.cost?.toFixed(4) || '0'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 调用记录表 */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(56,189,248,0.12)',
        }}
      >
        <div className="px-6 py-4 border-b border-sky-500/8 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            最近调用记录
          </h2>
          <span className="mono text-[10px] text-slate-600">最近 {recentLogs.length} 条</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sky-500/5">
                <th className="text-left py-3 px-6 text-[11px] font-medium text-slate-600 uppercase tracking-wider">时间</th>
                <th className="text-left py-3 px-6 text-[11px] font-medium text-slate-600 uppercase tracking-wider">模型</th>
                <th className="text-left py-3 px-6 text-[11px] font-medium text-slate-600 uppercase tracking-wider">输入 Token</th>
                <th className="text-left py-3 px-6 text-[11px] font-medium text-slate-600 uppercase tracking-wider">输出 Token</th>
                <th className="text-left py-3 px-6 text-[11px] font-medium text-slate-600 uppercase tracking-wider">耗时</th>
                <th className="text-left py-3 px-6 text-[11px] font-medium text-slate-600 uppercase tracking-wider">状态</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Activity className="w-8 h-8 text-slate-700" />
                      <p className="text-sm text-slate-600 mono">暂无调用记录</p>
                      <p className="text-xs text-slate-700">请通过模型市场或天翼智脑测试调用</p>
                    </div>
                  </td>
                </tr>
              ) : (
                recentLogs.map((log) => (
                  <tr key={log.id} className="border-b border-sky-500/3 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-6 text-xs text-slate-500 mono">{log.created_at}</td>
                    <td className="py-3 px-6">
                      <span className="text-sm text-slate-200 font-medium">{log.model_alias}</span>
                    </td>
                    <td className="py-3 px-6 text-xs text-slate-500 mono">{log.input_tokens?.toLocaleString() || 0}</td>
                    <td className="py-3 px-6 text-xs text-slate-500 mono">{log.output_tokens?.toLocaleString() || 0}</td>
                    <td className="py-3 px-6 text-xs text-slate-500 mono">{log.duration}ms</td>
                    <td className="py-3 px-6">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium"
                        style={{
                          background: log.status === 'success' ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
                          color: log.status === 'success' ? '#34d399' : '#ef4444',
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: log.status === 'success' ? '#34d399' : '#ef4444' }}
                        />
                        {log.status === 'success' ? '成功' : '失败'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
