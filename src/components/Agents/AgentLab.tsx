'use client'

import { useState, useEffect } from 'react'
import { Play, RefreshCw, FlaskConical, Save, Layers, Copy, Check, Sparkles, History, X, ArrowLeftRight, Gauge, Thermometer, Hash } from 'lucide-react'
import { api } from '@/lib/api'
import type { CustomAgent } from './AgentFactory'

// ─── 可用模型（实验室专用，精选7个代表） ────────
const LAB_MODELS = [
  { id: 'deepseek-chat', name: 'DeepSeek V3', icon: '🐋', color: '#38bdf8', free: false },
  { id: 'deepseek-reasoner', name: 'DeepSeek R1', icon: '🐋', color: '#818cf8', free: false },
  { id: 'pollinations-gpt', name: 'Pollinations GPT', icon: '🌐', color: '#34d399', free: true },
  { id: 'pollinations-mistral', name: 'Pollinations Mistral', icon: '🌐', color: '#f472b6', free: true },
]

// ─── 实验记录类型 ────────────────────────────────
interface ExperimentRecord {
  id: string
  timestamp: string
  modelId: string
  modelName: string
  systemPrompt: string
  userPrompt: string
  temperature: number
  maxTokens: number
  topP: number
  result: string
  duration: number
}

const HISTORY_KEY = 'tianyi_lab_history'
const MAX_HISTORY = 10

// Agent 市场存储 key（与 AgentMarket 共用）
const MARKET_KEY = 'tianyi_custom_agents'

function loadCustomAgents(): CustomAgent[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(MARKET_KEY) || '[]') } catch { return [] }
}

function saveCustomAgents(agents: CustomAgent[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(MARKET_KEY, JSON.stringify(agents))
}

function loadHistory(): ExperimentRecord[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}

function saveHistory(records: ExperimentRecord[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(HISTORY_KEY, JSON.stringify(records.slice(0, MAX_HISTORY)))
}

interface Props {
  onSaveAsAgent: (agent: CustomAgent) => void
}

export default function AgentLab({ onSaveAsAgent }: Props) {
  // ─── 提示词 ──────────────────────────────────
  const [systemPrompt, setSystemPrompt] = useState('')
  const [userPrompt, setUserPrompt] = useState('')
  const [modelId, setModelId] = useState('deepseek-chat')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2048)
  const [topP, setTopP] = useState(0.9)

  // ─── A/B 模式 ────────────────────────────────
  const [abMode, setAbMode] = useState(false)
  const [modelB, setModelB] = useState('pollinations-gpt')

  // ─── 运行状态 ────────────────────────────────
  const [isRunning, setIsRunning] = useState(false)
  const [resultA, setResultA] = useState<string | null>(null)
  const [resultB, setResultB] = useState<string | null>(null)
  const [durationA, setDurationA] = useState(0)
  const [durationB, setDurationB] = useState(0)
  const [errorA, setErrorA] = useState('')
  const [errorB, setErrorB] = useState('')

  // ─── 历史记录 ────────────────────────────────
  const [history, setHistory] = useState<ExperimentRecord[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => { setHistory(loadHistory()) }, [])

  // ─── 快捷预设 ────────────────────────────────
  const PRESETS = [
    { label: '代码审查', system: '你是资深代码审查专家。审查代码时标注严重程度（致命/严重/一般/建议），给出具体修改方案和原因。', user: '请审查以下代码：' },
    { label: '材料撰写', system: '你是政企材料撰写专家。按三段式（背景→工作内容→成效与计划）撰写，语言专业规范、数据驱动。', user: '请撰写一份关于[XX项目]的阶段汇报材料。' },
    { label: '翻译助手', system: '你是专业翻译，将用户输入翻译为中文。保持专业术语准确，语言流畅自然。', user: 'Artificial intelligence is transforming every industry.' },
    { label: '创意写作', system: '你是创意写作助手，擅长故事、诗歌和广告文案。风格灵动有趣，善用比喻和排比。', user: '写一段关于"AI赋能未来"的短文。' },
  ]

  // ─── 运行实验 ────────────────────────────────
  const handleRun = async () => {
    if (!userPrompt.trim() || isRunning) return
    setIsRunning(true)
    setResultA(null); setResultB(null)
    setErrorA(''); setErrorB('')

    const messages = [
      { role: 'system', content: systemPrompt || '你是一个有用的AI助手。' },
      { role: 'user', content: userPrompt },
    ]

    // 模型 A
    const startA = Date.now()
    try {
      const res = await api.models.chat(modelId, messages)
      setDurationA(Date.now() - startA)
      if (res.choices?.[0]?.message?.content) setResultA(res.choices[0].message.content)
      else if (res.message) setResultA(res.message)
      else if (res.error) setErrorA(res.error)
      else setResultA('(无响应)')
    } catch {
      setErrorA('调用失败，请检查模型配置')
    }

    // A/B 模式：第二个模型
    if (abMode && modelB !== modelId) {
      const startB = Date.now()
      try {
        const resB = await api.models.chat(modelB, messages)
        setDurationB(Date.now() - startB)
        if (resB.choices?.[0]?.message?.content) setResultB(resB.choices[0].message.content)
        else if (resB.message) setResultB(resB.message)
        else if (resB.error) setErrorB(resB.error)
        else setResultB('(无响应)')
      } catch {
        setErrorB('调用失败，请检查模型配置')
      }
    }

    setIsRunning(false)
  }

  // ─── 保存实验记录 ────────────────────────────
  const handleSaveRecord = (which: 'A' | 'B') => {
    const model = which === 'A' ? modelId : modelB
    const modelName = LAB_MODELS.find(m => m.id === model)?.name || model
    const result = which === 'A' ? resultA : resultB
    if (!result) return

    const record: ExperimentRecord = {
      id: `exp-${Date.now()}`,
      timestamp: new Date().toISOString(),
      modelId: model,
      modelName,
      systemPrompt,
      userPrompt,
      temperature,
      maxTokens,
      topP,
      result,
      duration: which === 'A' ? durationA : durationB,
    }
    const updated = [record, ...history]
    setHistory(updated)
    saveHistory(updated)
  }

  // ─── 从历史加载 ──────────────────────────────
  const loadFromHistory = (record: ExperimentRecord) => {
    setSystemPrompt(record.systemPrompt)
    setUserPrompt(record.userPrompt)
    setModelId(record.modelId)
    setTemperature(record.temperature)
    setMaxTokens(record.maxTokens)
    setTopP(record.topP)
    setShowHistory(false)
  }

  // ─── 复制结果 ────────────────────────────────
  const copyResult = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ─── 存为 Agent（直接写入 localStorage 市场）──
  const handleSaveAgent = () => {
    const newAgent: CustomAgent = {
      id: `lab-${Date.now()}`,
      name: systemPrompt.slice(0, 12).replace(/[^\u4e00-\u9fa5a-zA-Z]/g, '') || '实验室Agent',
      icon: '🧪',
      color: 'from-purple-500 to-indigo-700',
      description: '从 Agent 实验室生成',
      defaultModel: modelId,
      advancedModel: 'deepseek-reasoner',
      fastModel: 'pollinations-gpt',
      systemPrompt,
      category: 'general',
      author: '我',
      createdAt: new Date().toISOString(),
      published: false,
      downloads: 0,
    }
    const existing = loadCustomAgents()
    saveCustomAgents([newAgent, ...existing])
    // 如果传了回调也调用（兼容 Agents 内嵌场景）
    onSaveAsAgent(newAgent)
    alert('已保存到 Agent 市场！')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]" data-testid="agent-lab">
      {/* ═══ 顶部：标题 + 操作 ═══ */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-semibold text-white">Agent 实验室</h2>
          <span className="text-xs text-slate-400">提示词实验台</span>
        </div>
        <div className="flex items-center gap-2">
          {/* 历史按钮 */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showHistory ? 'bg-purple-600/30 text-purple-300' : 'bg-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            历史 ({history.length})
          </button>

          {/* A/B 开关 */}
          <button
            onClick={() => { setAbMode(!abMode); setResultB(null); setErrorB('') }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              abMode ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' : 'bg-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            A/B 对比
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* ═══ 左侧：提示词编辑区 ═══ */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* 快捷预设 */}
          <div className="flex gap-1.5 flex-wrap">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => { setSystemPrompt(p.system); setUserPrompt(p.user) }}
                className="px-2.5 py-1 text-[11px] bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-sky-300 hover:border-sky-500/30 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* System Prompt */}
          <div className="flex-1 flex flex-col min-h-0">
            <label className="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 系统提示词
            </label>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              placeholder={`设定 AI 的角色、行为规范和输出格式...\n\n例如：你是天翼智脑，翼站Token超市的AI助手。请用专业严谨的中文回答。`}
              className="flex-1 min-h-[100px] p-3 bg-white/5 border border-white/10 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm text-slate-200 placeholder-slate-500 font-mono"
              data-testid="lab-system-prompt"
            />
          </div>

          {/* User Prompt */}
          <div className="flex-1 flex flex-col min-h-0">
            <label className="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
              <FlaskConical className="w-3 h-3" /> 用户提示词
            </label>
            <textarea
              value={userPrompt}
              onChange={e => setUserPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleRun() }}
              placeholder="输入要测试的内容... (Ctrl+Enter 运行)"
              className="flex-1 min-h-[100px] p-3 bg-white/5 border border-white/10 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm text-white placeholder-slate-500"
              data-testid="lab-user-prompt"
            />
          </div>

          {/* 运行按钮 */}
          <button
            onClick={handleRun}
            disabled={!userPrompt.trim() || isRunning}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-800 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            data-testid="lab-run-btn"
          >
            {isRunning ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> 运行中...</>
            ) : (
              <><Play className="w-4 h-4" /> 运行实验</>
            )}
          </button>
          <p className="text-[10px] text-slate-500 text-center -mt-2">Ctrl+Enter 运行 · 快捷键</p>
        </div>

        {/* ═══ 右侧：参数面板 ═══ */}
        <div className="w-60 flex-shrink-0 flex flex-col gap-4">
          {/* 模型选择 */}
          <div className="glass-card rounded-xl border border-white/10 p-4">
            <label className="text-xs text-slate-400 mb-2 flex items-center gap-1">
              <Layers className="w-3 h-3" /> 模型选择
            </label>
            <div className="space-y-1.5">
              {LAB_MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setModelId(m.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                    modelId === m.id
                      ? 'bg-purple-600/20 border border-purple-500/30 text-purple-300'
                      : 'bg-white/5 border border-transparent text-slate-400 hover:bg-white/10'
                  }`}
                  data-testid={`lab-model-${m.id}`}
                >
                  <span>{m.icon}</span>
                  <span className="flex-1">{m.name}</span>
                  {m.free && <span className="text-[9px] px-1 bg-emerald-500/20 text-emerald-400 rounded">免费</span>}
                </button>
              ))}
            </div>

            {/* A/B 第二模型 */}
            {abMode && (
              <>
                <label className="text-xs text-slate-400 mt-3 mb-2 flex items-center gap-1">
                  <ArrowLeftRight className="w-3 h-3" /> 对比模型 B
                </label>
                <div className="space-y-1.5">
                  {LAB_MODELS.filter(m => m.id !== modelId).map(m => (
                    <button
                      key={m.id}
                      onClick={() => setModelB(m.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                        modelB === m.id
                          ? 'bg-amber-600/20 border border-amber-500/30 text-amber-300'
                          : 'bg-white/5 border border-transparent text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <span>{m.icon}</span>
                      <span className="flex-1">{m.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Temperature */}
          <div className="glass-card rounded-xl border border-white/10 p-4">
            <label className="text-xs text-slate-400 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1"><Thermometer className="w-3 h-3" /> Temperature</span>
              <span className="text-purple-400 font-mono">{temperature.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={temperature}
              onChange={e => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-purple-500 h-1"
              data-testid="lab-temperature"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>精确</span><span>平衡</span><span>创意</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div className="glass-card rounded-xl border border-white/10 p-4">
            <label className="text-xs text-slate-400 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> Max Tokens</span>
              <span className="text-purple-400 font-mono">{maxTokens}</span>
            </label>
            <input
              type="range"
              min="256"
              max="8192"
              step="256"
              value={maxTokens}
              onChange={e => setMaxTokens(parseInt(e.target.value))}
              className="w-full accent-purple-500 h-1"
              data-testid="lab-max-tokens"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>256</span><span>2048</span><span>8K</span>
            </div>
          </div>

          {/* Top P */}
          <div className="glass-card rounded-xl border border-white/10 p-4">
            <label className="text-xs text-slate-400 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1"><Gauge className="w-3 h-3" /> Top P</span>
              <span className="text-purple-400 font-mono">{topP.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={topP}
              onChange={e => setTopP(parseFloat(e.target.value))}
              className="w-full accent-purple-500 h-1"
              data-testid="lab-top-p"
            />
          </div>
        </div>
      </div>

      {/* ═══ 结果区域 ═══ */}
      {(resultA !== null || errorA) && (
        <div className={`mt-4 grid gap-4 ${abMode ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {/* 结果 A */}
          <div className="glass-card rounded-xl border border-purple-500/20 p-4 flex flex-col max-h-[300px]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {LAB_MODELS.find(m => m.id === modelId)?.icon}
                </span>
                <span className="text-xs font-medium text-slate-300">
                  {LAB_MODELS.find(m => m.id === modelId)?.name}
                </span>
                {durationA > 0 && (
                  <span className="text-[10px] text-slate-500">{durationA}ms</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => copyResult(resultA || '')} className="p-1 text-slate-500 hover:text-slate-300" title="复制">
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
                <button onClick={() => handleSaveRecord('A')} className="p-1 text-slate-500 hover:text-purple-400" title="保存记录">
                  <Save className="w-3 h-3" />
                </button>
                <button onClick={handleSaveAgent} className="px-2 py-0.5 text-[10px] bg-purple-600/20 text-purple-300 rounded hover:bg-purple-600/30" title="存为Agent">
                  存为Agent
                </button>
              </div>
            </div>
            {errorA ? (
              <div className="text-sm text-red-400 p-3 bg-red-500/5 rounded-lg">{errorA}</div>
            ) : (
              <div className="flex-1 overflow-y-auto text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                {resultA}
              </div>
            )}
          </div>

          {/* 结果 B (A/B 模式) */}
          {abMode && resultB !== null && (
            <div className="glass-card rounded-xl border border-amber-500/20 p-4 flex flex-col max-h-[300px]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {LAB_MODELS.find(m => m.id === modelB)?.icon}
                  </span>
                  <span className="text-xs font-medium text-slate-300">
                    {LAB_MODELS.find(m => m.id === modelB)?.name}
                  </span>
                  {durationB > 0 && (
                    <span className="text-[10px] text-slate-500">{durationB}ms</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => copyResult(resultB || '')} className="p-1 text-slate-500 hover:text-slate-300" title="复制">
                    <Copy className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleSaveRecord('B')} className="p-1 text-slate-500 hover:text-purple-400" title="保存记录">
                    <Save className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {errorB ? (
                <div className="text-sm text-red-400 p-3 bg-red-500/5 rounded-lg">{errorB}</div>
              ) : (
                <div className="flex-1 overflow-y-auto text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {resultB}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ 实验历史面板 ═══ */}
      {showHistory && (
        <div className="mt-4 glass-card rounded-xl border border-white/10 p-4 max-h-[220px] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" />
              实验历史
            </h3>
            <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">暂无实验记录，运行实验后保存即可</p>
          ) : (
            <div className="space-y-2">
              {history.map(rec => (
                <button
                  key={rec.id}
                  onClick={() => loadFromHistory(rec)}
                  className="w-full text-left p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-300">
                      {rec.userPrompt.slice(0, 40)}{rec.userPrompt.length > 40 ? '...' : ''}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(rec.timestamp).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>{rec.modelName}</span>
                    <span>·</span>
                    <span>T={rec.temperature}</span>
                    <span>·</span>
                    <span>{rec.duration}ms</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
