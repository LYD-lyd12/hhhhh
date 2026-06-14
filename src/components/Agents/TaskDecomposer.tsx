'use client'

import { useState } from 'react'
import { CheckSquare, RefreshCw, Play, CheckCheck, ChevronRight, ArrowRight, Zap, Brain, Flame, Sparkles, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'

// ─── 任务步骤 ────────────────────────────────────
interface TaskStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: string
  model?: string
  error?: string
}

// ─── 可用模型 ────────────────────────────────────
const AVAILABLE_MODELS = [
  { id: 'pollinations-gpt', name: 'GPT (免费)', icon: '🌐' },
  { id: 'pollinations-mistral', name: 'Mistral (免费)', icon: '🌐' },
  { id: 'deepseek-chat', name: 'DeepSeek Chat', icon: '🐋' },
  { id: 'deepseek-reasoner', name: 'DeepSeek R1', icon: '🐋' },
]

const genId = () => `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

export default function TaskDecomposer() {
  const [goal, setGoal] = useState('')
  const [steps, setSteps] = useState<TaskStep[]>([])
  const [isDecomposing, setIsDecomposing] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [progress, setProgress] = useState(0)

  // ─── 拆解任务 ──────────────────────────────────
  const handleDecompose = async () => {
    if (!goal.trim() || isDecomposing) return
    setIsDecomposing(true)

    try {
      // 用 AI 拆解任务为步骤
      const projectPrompt = `你是一个任务规划专家。请将以下目标拆解为 3-5 个执行步骤，每步用一句话描述。

目标：${goal}

要求：
1. 每步应该是具体可执行的
2. 步骤之间要有逻辑顺序
3. 为每步指定最合适的模型：简单步骤用 pollinations-gpt，推理步骤用 deepseek-reasoner，综合步骤用 deepseek-chat
4. 用 JSON 数组格式输出，每个元素有 title（步骤标题）和 description（详细描述）和 model（推荐模型）

只输出 JSON 数组，不要任何其他文字。`

      const response = await api.models.chat('deepseek-chat', [
        { role: 'user', content: projectPrompt }
      ])

      let content = ''
      if (response.choices?.[0]?.message?.content) content = response.choices[0].message.content
      else if (response.message) content = response.message
      else if (typeof response === 'string') content = response

      // 解析 JSON
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (Array.isArray(parsed) && parsed.length > 0) {
          const newSteps: TaskStep[] = parsed.map((s: any) => ({
            id: genId(),
            title: s.title || '未知步骤',
            description: s.description || '',
            status: 'pending' as const,
            model: s.model || 'pollinations-gpt',
          }))
          setSteps(newSteps)
          setProgress(0)
          return
        }
      }

      // 回退：手动拆分
      setSteps(goal.split(/[，,、\n]/)
        .filter(s => s.trim())
        .map(s => ({
          id: genId(),
          title: s.trim().slice(0, 20) + (s.trim().length > 20 ? '...' : ''),
          description: s.trim(),
          status: 'pending' as const,
          model: 'pollinations-gpt',
        }))
      )
      setProgress(0)
    } catch {
      // 网络错误回退
      const fallback = goal.split(/[，,、\n]/).filter(s => s.trim()).map(s => ({
        id: genId(),
        title: s.trim().slice(0, 20) + (s.trim().length > 20 ? '...' : ''),
        description: s.trim(),
        status: 'pending' as const,
        model: 'pollinations-gpt',
      }))
      setSteps(fallback)
    } finally {
      setIsDecomposing(false)
    }
  }

  // ─── 执行全部步骤 ──────────────────────────────
  const handleExecuteAll = async () => {
    if (isExecuting || steps.length === 0) return
    setIsExecuting(true)
    setProgress(0)

    for (let i = 0; i < steps.length; i++) {
      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'running' as const } : s))

      try {
        const model = steps[i].model || 'pollinations-gpt'
        const execPrompt = `你是一个任务执行助手。请执行以下任务步骤，输出执行结果。

步骤标题：${steps[i].title}
步骤描述：${steps[i].description}
整体目标：${goal}

请用清晰、专业的方式输出结果。`

        const response = await api.models.chat(model, [
          { role: 'user', content: execPrompt }
        ])

        let result = ''
        if (response.choices?.[0]?.message?.content) result = response.choices[0].message.content
        else if (response.message) result = response.message
        else result = '步骤完成，未能获取详细结果。'

        setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'completed' as const, result } : s))
      } catch (err: any) {
        setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'failed' as const, error: err.message } : s))
      } finally {
        setProgress(Math.round(((i + 1) / steps.length) * 100))
      }
    }

    setIsExecuting(false)
  }

  // ─── 执行单步 ──────────────────────────────────
  const handleExecuteStep = async (index: number) => {
    if (isExecuting) return

    setSteps(prev => prev.map((s, idx) => idx === index ? { ...s, status: 'running' as const } : s))

    try {
      const step = steps[index]
      const model = step.model || 'pollinations-gpt'
      const response = await api.models.chat(model, [
        { role: 'user', content: `执行此任务步骤：${step.description}` }
      ])

      let result = ''
      if (response.choices?.[0]?.message?.content) result = response.choices[0].message.content
      else if (response.message) result = response.message
      else result = '步骤完成。'

      setSteps(prev => prev.map((s, idx) => idx === index ? { ...s, status: 'completed' as const, result } : s))
    } catch (err: any) {
      setSteps(prev => prev.map((s, idx) => idx === index ? { ...s, status: 'failed' as const, error: err.message } : s))
    }
  }

  const completedCount = steps.filter(s => s.status === 'completed').length
  const allDone = steps.length > 0 && completedCount === steps.length

  return (
    <div className="max-w-3xl mx-auto space-y-4" data-testid="task-decomposer">
      {/* 标题 */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center justify-center gap-2">
          <CheckSquare className="w-5 h-5 text-sky-600" />
          智能任务编排
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          输入目标 → AI 自动拆解为步骤 → 逐步执行 → 汇总结果
        </p>
      </div>

      {/* 输入目标 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <textarea
          value={goal}
          onChange={e => setGoal(e.target.value)}
          placeholder="输入你想完成的目标，例如：分析近三个月销售数据并生成趋势报告..."
          rows={3}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
          disabled={isDecomposing || isExecuting}
          data-testid="task-goal-input"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-slate-400">
            拆解后每步会自动选择最优模型
          </span>
          <button
            onClick={handleDecompose}
            disabled={!goal.trim() || isDecomposing || isExecuting}
            className="flex items-center gap-2 px-5 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 disabled:bg-slate-300 transition-colors text-sm font-medium"
            data-testid="task-decompose-btn"
          >
            {isDecomposing ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> 拆解中...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> 拆解任务</>
            )}
          </button>
        </div>
      </div>

      {/* 步骤列表 */}
      {steps.length > 0 && (
        <div className="space-y-3">
          {/* 进度条 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                执行进度：{completedCount}/{steps.length}
              </span>
              <span className="text-sm text-sky-600 font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-sky-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 步骤卡片 */}
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`bg-white rounded-xl border transition-all ${
                step.status === 'completed' ? 'border-green-200 bg-green-50/30' :
                step.status === 'failed' ? 'border-red-200 bg-red-50/30' :
                step.status === 'running' ? 'border-sky-200 ring-1 ring-sky-300' :
                'border-slate-200'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* 状态图标 */}
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.status === 'completed' ? 'bg-green-100 text-green-600' :
                    step.status === 'failed' ? 'bg-red-100 text-red-600' :
                    step.status === 'running' ? 'bg-sky-100 text-sky-600' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {step.status === 'completed' ? <CheckCheck className="w-4 h-4" /> :
                     step.status === 'failed' ? <AlertCircle className="w-4 h-4" /> :
                     step.status === 'running' ? <RefreshCw className="w-4 h-4 animate-spin" /> :
                     <span className="text-xs font-bold">{idx + 1}</span>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-slate-800">{step.title}</h4>
                      {step.model && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-600 font-medium">
                          {AVAILABLE_MODELS.find(m => m.id === step.model)?.icon} {AVAILABLE_MODELS.find(m => m.id === step.model)?.name || step.model}
                        </span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        step.status === 'completed' ? 'bg-green-100 text-green-600' :
                        step.status === 'failed' ? 'bg-red-100 text-red-600' :
                        step.status === 'running' ? 'bg-sky-100 text-sky-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {step.status === 'completed' ? '已完成' :
                         step.status === 'failed' ? '失败' :
                         step.status === 'running' ? '执行中' : '待执行'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{step.description}</p>

                    {/* 结果展示 */}
                    {step.result && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-green-100">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{step.result}</p>
                      </div>
                    )}
                    {step.error && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-sm text-red-600">{step.error}</p>
                      </div>
                    )}

                    {/* 单步执行按钮 */}
                    {step.status === 'pending' && !isExecuting && (
                      <button
                        onClick={() => handleExecuteStep(idx)}
                        className="mt-2 flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700"
                      >
                        <Play className="w-3 h-3" />
                        执行此步
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* 全部执行按钮 */}
          {!allDone && (
            <button
              onClick={handleExecuteAll}
              disabled={isExecuting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-sky-600 to-blue-700 text-white rounded-xl font-medium hover:from-sky-700 hover:to-blue-800 disabled:opacity-50 transition-all"
              data-testid="task-execute-all"
            >
              {isExecuting ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> 执行中 ({progress}%)...</>
              ) : (
                <><Play className="w-5 h-5" /> 执行全部步骤</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
