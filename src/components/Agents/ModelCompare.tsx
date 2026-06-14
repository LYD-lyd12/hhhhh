'use client'

import { useState } from 'react'
import { Send, RefreshCw, BarChart3, Clock, Gauge, ChevronDown, ChevronUp, Store, Palette, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import AgentMarket from './AgentMarket'
import AgentFactory from './AgentFactory'

// ─── 可用模型 ─────────────────────────────────────
const COMPARE_MODELS = [
  { id: 'pollinations-gpt', name: 'Pollinations GPT', icon: '🌐', color: 'from-emerald-500 to-teal-600', free: true },
  { id: 'pollinations-mistral', name: 'Pollinations Mistral', icon: '🌐', color: 'from-blue-500 to-cyan-600', free: true },
  { id: 'deepseek-chat', name: 'DeepSeek Chat', icon: '🐋', color: 'from-blue-600 to-indigo-700', free: false },
  { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', icon: '🐋', color: 'from-violet-500 to-purple-700', free: false },
]

interface ModelResult {
  modelId: string
  modelName: string
  icon: string
  color: string
  content: string
  duration: number
  tokenCount: number
  cost: number
  loading: boolean
  error?: string
}

type ViewMode = 'market' | 'compare' | 'factory'

export default function ModelCompare() {
  const [viewMode, setViewMode] = useState<ViewMode>('market')
  const [inputValue, setInputValue] = useState('')
  const [selectedModels, setSelectedModels] = useState<string[]>(['pollinations-gpt', 'deepseek-chat'])
  const [results, setResults] = useState<ModelResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [showDetail, setShowDetail] = useState<string | null>(null)

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(m => m !== modelId)
        : [...prev, modelId]
    )
  }

  const handleCompare = async () => {
    if (!inputValue.trim() || selectedModels.length === 0 || isRunning) return
    setIsRunning(true)

    const initialResults: ModelResult[] = selectedModels.map(modelId => {
      const model = COMPARE_MODELS.find(m => m.id === modelId)!
      return {
        modelId: model.id, modelName: model.name, icon: model.icon, color: model.color,
        content: '', duration: 0, tokenCount: 0, cost: 0, loading: true,
      }
    })
    setResults(initialResults)

    const promises = selectedModels.map(async modelId => {
      const reqStart = Date.now()
      try {
        const response = await api.models.chat(modelId, [{ role: 'user', content: inputValue.trim() }])
        const duration = Date.now() - reqStart
        let content = ''
        if (response.choices?.[0]?.message?.content) content = response.choices[0].message.content
        else if (response.message) content = response.message
        else if (response.error) content = `错误: ${response.error}`
        else content = '无响应'
        return {
          modelId, content, duration,
          tokenCount: response.usage?.total_tokens || Math.ceil(content.length / 4),
          cost: 0, loading: false,
        }
      } catch (err: any) {
        return {
          modelId, content: `调用失败: ${err.message || '网络错误'}`,
          duration: Date.now() - reqStart, tokenCount: 0, cost: 0,
          loading: false, error: err.message,
        }
      }
    })

    const allResults = await Promise.all(promises)
    setResults(prev =>
      prev.map(r => {
        const updated = allResults.find(a => a.modelId === r.modelId)
        return updated ? { ...r, ...updated } : r
      })
    )
    setIsRunning(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCompare() }
  }

  // ─── Tab 栏（市场在最前）──────────────────
  const TABS = [
    { key: 'market', icon: Store, label: '市场' },
    { key: 'compare', icon: BarChart3, label: '对比' },
    { key: 'factory', icon: Palette, label: '创建' },
  ]

  const renderTabs = () => (
    <div className="flex items-center gap-1 mb-3">
      {TABS.map(tab => {
        const Icon = tab.icon
        const active = viewMode === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => setViewMode(tab.key as ViewMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              active
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        )
      })}
    </div>
  )

  // ─── 市场视图 ────────────────────────────
  if (viewMode === 'market') {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col" data-testid="model-compare">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-bold text-sky-400 flex items-center gap-2">
              <Store className="w-5 h-5 text-sky-400" />
              Agent 市场
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">浏览和管理 AI Agent · 一键安装到天翼智脑</p>
          </div>
          <button
            onClick={() => setViewMode('factory')}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-500 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            创建 Agent
          </button>
        </div>
        {renderTabs()}
        <div className="flex-1 min-h-0">
          <AgentMarket
            onInstall={(agent) => {
              // 保存安装的 Agent 到 localStorage（社区和自定义都保存，后续可卸载）
              const CUSTOM_KEY = 'tianyi_custom_agents'
              try {
                const raw = localStorage.getItem(CUSTOM_KEY)
                const existing = raw ? JSON.parse(raw) : []
                if (!existing.find((a: any) => a.id === agent.id)) {
                  existing.push(agent)
                  localStorage.setItem(CUSTOM_KEY, JSON.stringify(existing))
                }
              } catch {}
              // 触发 storage 事件 + 自定义事件让智脑页面感知
              window.dispatchEvent(new StorageEvent('storage', { key: CUSTOM_KEY }))
              window.dispatchEvent(new Event('agent-market-changed'))
            }}
            onCreateNew={() => setViewMode('factory')}
          />
        </div>
      </div>
    )
  }

  // ─── 工厂视图 ────────────────────────────
  if (viewMode === 'factory') {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col" data-testid="model-compare">
        <div className="mb-2">
          <h2 className="text-lg font-bold text-sky-400 flex items-center gap-2">
            <Palette className="w-5 h-5 text-sky-400" />
            Agent 市场
          </h2>
        </div>
        {renderTabs()}
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setViewMode('market')} className="text-sm text-slate-400 hover:text-sky-400 flex items-center gap-1 transition-colors">
            <Store className="w-4 h-4" /> Agent 市场
          </button>
          <span className="text-slate-600">/</span>
          <span className="text-sm text-sky-400 font-medium">创建 Agent</span>
        </div>
        <div className="flex-1 min-h-0">
          <AgentFactory onSave={(agent) => {
            // 保存新创建的 Agent 到 localStorage
            const CUSTOM_KEY = 'tianyi_custom_agents'
            try {
              const raw = localStorage.getItem(CUSTOM_KEY)
              const existing = raw ? JSON.parse(raw) : []
              if (!existing.find((a: any) => a.id === agent.id)) {
                existing.push(agent)
                localStorage.setItem(CUSTOM_KEY, JSON.stringify(existing))
              }
            } catch {}
            setViewMode('market')
          }} onCancel={() => setViewMode('market')} />
        </div>
      </div>
    )
  }

  // ─── 对比视图 ────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]" data-testid="model-compare">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-sky-400 flex items-center gap-2">
          <Store className="w-5 h-5 text-sky-400" />
          Agent 市场
        </h2>
        <p className="text-slate-500 text-xs mt-0.5">同一问题同时发给多个模型，对比质量、速度和成本</p>
      </div>

      {renderTabs()}

      {/* 模型选择 */}
      <div className="rounded-xl border border-white/10 p-4 mb-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <h3 className="text-sm font-semibold text-slate-200 mb-3">选择对比模型</h3>
        <div className="flex flex-wrap gap-2">
          {COMPARE_MODELS.map(m => {
            const selected = selectedModels.includes(m.id)
            return (
              <button
                key={m.id}
                onClick={() => toggleModel(m.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selected
                    ? `bg-gradient-to-r ${m.color} text-white shadow-lg scale-105`
                    : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 border border-white/10'
                }`}
              >
                <span>{m.icon}</span>
                {m.name}
                {m.free && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    selected ? 'bg-white/20 text-white' : 'bg-emerald-500/15 text-emerald-400'
                  }`}>
                    免费
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 输入区 */}
      <div className="rounded-xl border border-white/10 p-4 mb-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex gap-3">
          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入要对比的问题..."
            rows={2}
            className="flex-1 px-4 py-3 border border-white/10 bg-white/5 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/50 text-sm text-slate-200 placeholder-slate-500"
            disabled={isRunning}
            data-testid="compare-input"
          />
          <button
            onClick={handleCompare}
            disabled={!inputValue.trim() || selectedModels.length === 0 || isRunning}
            className="px-5 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors flex items-center gap-2 flex-shrink-0 font-medium text-sm"
            data-testid="compare-run"
          >
            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isRunning ? '对比中...' : '开始对比'}
          </button>
        </div>
      </div>

      {/* 结果对比区 */}
      <div className="flex-1 overflow-y-auto">
        {results.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
            选择模型并输入问题，开始对比
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(results.length, 3)}, 1fr)` }}>
            {results.map(r => (
              <div key={r.modelId} className="rounded-xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
                {/* 模型头部 */}
                <div className={`px-4 py-3 bg-gradient-to-r ${r.color} text-white`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{r.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold truncate">{r.modelName}</h4>
                    </div>
                    {r.loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  </div>
                </div>

                {/* 性能指标 */}
                {!r.loading && r.content && (
                  <div className="px-4 py-2 border-b border-white/5 flex items-center gap-4 text-[11px]"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3 text-sky-400" />
                      {(r.duration / 1000).toFixed(1)}s
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Gauge className="w-3 h-3 text-sky-400" />
                      ~{r.tokenCount} tokens
                    </span>
                  </div>
                )}

                {/* 内容 */}
                <div className="p-4">
                  {r.loading ? (
                    <div className="flex items-center gap-2 py-8 justify-center text-slate-500">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="text-sm">等待响应...</span>
                    </div>
                  ) : r.error ? (
                    <p className="text-sm text-red-400">{r.content}</p>
                  ) : (
                    <div>
                      <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{r.content}</p>
                      {r.content.length > 200 && (
                        <button
                          onClick={() => setShowDetail(showDetail === r.modelId ? null : r.modelId)}
                          className="mt-2 text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
                        >
                          {showDetail === r.modelId ? (
                            <><ChevronUp className="w-3 h-3" /> 收起</>
                          ) : (
                            <><ChevronDown className="w-3 h-3" /> 展开全部</>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
