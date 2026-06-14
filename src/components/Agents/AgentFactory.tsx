'use client'

import { useState } from 'react'
import { Wand2, Save, RefreshCw, ChevronRight, Sparkles, Tag, Eye, Trash2, Globe, Users, Code, FileText, Briefcase, Shield, Building2, Settings } from 'lucide-react'

// ─── Agent 配置类型 ──────────────────────────────
export interface CustomAgent {
  id: string
  name: string
  icon: string
  color: string
  description: string
  defaultModel: string
  advancedModel: string
  fastModel: string
  systemPrompt: string
  category: string
  author: string
  createdAt: string
  published: boolean
  downloads: number
}

const CATEGORIES = [
  { id: 'telecom', label: '电信场景', icon: Building2 },
  { id: 'dev', label: '开发编程', icon: Code },
  { id: 'writing', label: '文案写作', icon: FileText },
  { id: 'business', label: '商业分析', icon: Briefcase },
  { id: 'security', label: '安全合规', icon: Shield },
  { id: 'general', label: '通用助手', icon: Globe },
  { id: 'customer', label: '客户服务', icon: Users },
]

// ─── Agent 模板（快捷创建）───────────────────────
const TEMPLATES = [
  // ─── 电信场景模板 ──────────────────────
  { label: '🔍 基层网格员', prompt: '你是数字网格员，服务于基层巡查场景。核心能力：1.巡查任务清单生成 2.问题归集与安全等级分类（红/黄/蓝） 3.工单派发与责任部门分配 4.排查报告与整改提醒。回答用清单格式，标注优先级。', category: 'telecom' },
  { label: '🍽️ 食安监控员', prompt: '你是食品安全监控员，负责园区食堂、学校餐厅的食安监管。核心能力：1.巡检计划与频次排定 2.违规项识别（对照GB 31654） 3.证照台账有效期提醒 4.风险研判与监管报告。建议需注明法规依据，风险三色标注。', category: 'telecom' },
  { label: '💻 政企开发团队', prompt: '你是政企软件开发团队，专注智改数转项目交付。核心能力：1.需求WBS拆解 2.接口文档分析与联调代码生成 3.Java/Spring Boot或Python/FastAPI生产级代码 4.集成测试用例 5.交付文档与部署说明。代码遵循阿里Java手册或PEP8。', category: 'telecom' },
  { label: '📝 材料撰写专家', prompt: '你是材料撰写专家，服务基层文档编制需求。核心能力：1.零散信息结构化整理 2.规范提纲生成（汇报/分析/调研/纪要） 3.三段式正文撰写（背景→内容→成效） 4.数据趋势归纳与同比/环比描述 5.公文格式检查与语言润色。输出风格专业规范、数据驱动。', category: 'telecom' },
  // ─── 通用模板 ──────────────────────────
  { label: '代码审查专家', prompt: '你是一位资深代码审查专家，擅长发现代码中的安全漏洞、性能问题和架构缺陷。审查时标注严重程度（致命/严重/一般/建议）并给出修改方案。', category: 'dev' },
  { label: '产品经理助手', prompt: '你是一位经验丰富的产品经理，擅长需求分析、竞品调研和 PRD 撰写。用结构化方式输出，包含用户故事、功能优先级和验收标准。', category: 'business' },
  { label: '安全巡检员', prompt: '你是一位安全合规巡检员，熟悉等保、GDPR 和行业安全规范。检查系统配置、日志和代码，输出合规检查报告和改进建议。', category: 'security' },
  { label: '数据分析师', prompt: '你是一位数据分析师，擅长从数据中提取洞察。用图表思维表述结论，给出可落地的业务建议。', category: 'business' },
  { label: '营销文案师', prompt: '你是一位资深营销文案，擅长品牌故事、广告语和社媒内容创作。文案风格可根据品牌调性调整：年轻化/专业/温情/科技感。', category: 'writing' },
]

const COLORS = [
  { value: 'from-sky-600 to-blue-800', label: '天际蓝', preview: 'bg-gradient-to-r from-sky-600 to-blue-800' },
  { value: 'from-emerald-500 to-teal-600', label: '翡翠绿', preview: 'bg-gradient-to-r from-emerald-500 to-teal-600' },
  { value: 'from-purple-500 to-pink-600', label: '紫粉', preview: 'bg-gradient-to-r from-purple-500 to-pink-600' },
  { value: 'from-amber-500 to-orange-600', label: '琥珀橙', preview: 'bg-gradient-to-r from-amber-500 to-orange-600' },
  { value: 'from-blue-600 to-indigo-700', label: '靛蓝', preview: 'bg-gradient-to-r from-blue-600 to-indigo-700' },
  { value: 'from-violet-500 to-purple-700', label: '紫罗兰', preview: 'bg-gradient-to-r from-violet-500 to-purple-700' },
  { value: 'from-rose-500 to-red-600', label: '玫瑰红', preview: 'bg-gradient-to-r from-rose-500 to-red-600' },
  { value: 'from-lime-500 to-green-600', label: '青柠绿', preview: 'bg-gradient-to-r from-lime-500 to-green-600' },
]

const MODEL_OPTIONS = [
  { value: 'deepseek-chat', label: 'DeepSeek Chat (均衡)' },
  { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner (深度)' },
  { value: 'pollinations-gpt', label: 'Pollinations GPT (免费)' },
  { value: 'pollinations-mistral', label: 'Pollinations Mistral (免费)' },
]

interface Props {
  onSave: (agent: CustomAgent) => void
  onCancel: () => void
}

const genId = () => `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export default function AgentFactory({ onSave, onCancel }: Props) {
  const [step, setStep] = useState<'describe' | 'preview' | 'config'>('describe')
  const [description, setDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generated, setGenerated] = useState<Partial<CustomAgent>>({})
  const [category, setCategory] = useState('general')

  // 快捷模板
  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    setDescription(template.prompt)
    setCategory(template.category)
  }

  // AI 生成 Agent 配置
  const handleGenerate = async () => {
    if (!description.trim()) return
    setIsGenerating(true)
    try {
      // 用 AI 根据描述生成 Agent 配置
      const genPrompt = `根据以下描述，生成一个 AI Agent 的配置信息。输出 JSON 格式：
{
  "name": "Agent 名称（2-6字，中文）",
  "icon": "单个 emoji",
  "description": "一句话简介（15字以内）",
  "systemPrompt": "完整的 system prompt（150-300字），要体现专业性",
  "color": "tailwind gradient class，从以下选：from-sky-600 to-blue-800 / from-emerald-500 to-teal-600 / from-purple-500 to-pink-600 / from-amber-500 to-orange-600 / from-blue-600 to-indigo-700 / from-gray-700 to-slate-800 / from-cyan-500 to-teal-600 / from-violet-500 to-purple-700 / from-rose-500 to-red-600 / from-lime-500 to-green-600"
}

用户描述：${description}`

      // 本地生成，避免额外 API 调用
      const name = description.slice(0, 6).replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '') || '智能助手'
      const icons = ['🤖', '🔧', '📊', '🛡️', '✍️', '💼', '🎯', '🔍', '⚡', '🧩']
      const colors = [
        'from-sky-600 to-blue-800', 'from-emerald-500 to-teal-600',
        'from-purple-500 to-pink-600', 'from-amber-500 to-orange-600',
        'from-blue-600 to-indigo-700', 'from-violet-500 to-purple-700',
        'from-rose-500 to-red-600', 'from-lime-500 to-green-600',
      ]

      setGenerated({
        name,
        icon: icons[Math.floor(Math.random() * icons.length)],
        description: description.slice(0, 15),
        systemPrompt: `你是${name}，一位专业的 AI 助手。\n\n${description}\n\n请用专业、清晰的方式回答用户问题，善用结构化表达。`,
        color: colors[Math.floor(Math.random() * colors.length)],
        defaultModel: 'pollinations-gpt',
        advancedModel: 'deepseek-reasoner',
        fastModel: 'pollinations-gpt',
        category,
      })

      setStep('preview')
    } finally {
      setIsGenerating(false)
    }
  }

  // 保存
  const handleSave = () => {
    onSave({
      id: genId(),
      name: generated.name || '未命名',
      icon: generated.icon || '🤖',
      color: generated.color || 'from-sky-600 to-blue-800',
      description: generated.description || '',
      defaultModel: generated.defaultModel || 'pollinations-gpt',
      advancedModel: generated.advancedModel || 'deepseek-reasoner',
      fastModel: generated.fastModel || 'pollinations-gpt',
      systemPrompt: generated.systemPrompt || '',
      category: category,
      author: '我',
      createdAt: new Date().toISOString(),
      published: false,
      downloads: 0,
    })
  }

  return (
    <div className="max-w-2xl mx-auto" data-testid="agent-factory">
      {/* 步骤指示器 */}
      <div className="flex items-center gap-2 mb-6">
        {['describe', 'preview', 'config'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === s ? 'bg-sky-600 text-white' :
              ['describe', 'preview', 'config'].indexOf(step) > i ? 'bg-green-100 text-green-600' :
              'bg-slate-100 text-slate-400'
            }`}>
              {i + 1}
            </div>
            <span className={`text-sm ${step === s ? 'text-sky-600 font-medium' : 'text-slate-400'}`}>
              {s === 'describe' ? '描述需求' : s === 'preview' ? '预览确认' : '精细配置'}
            </span>
            {i < 2 && <ChevronRight className="w-4 h-4 text-slate-300" />}
          </div>
        ))}
      </div>

      {/* Step 1: 描述需求 */}
      {step === 'describe' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-sky-600" />
              用自然语言描述你想要的 Agent
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              告诉系统你希望这个 Agent 做什么、擅长什么领域、有什么人设要求
            </p>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="例如：我需要一个精通数据分析的 Agent，能帮我解读销售报表、做趋势预测，回答风格要简洁直接..."
              rows={5}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              data-testid="factory-description"
            />

            {/* 分类选择 */}
            <div className="mt-3">
              <p className="text-xs text-slate-400 mb-2">选择分类</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => {
                  const Icon = c.icon
                  return (
                    <button
                      key={c.id}
                      onClick={() => setCategory(c.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        category === c.id
                          ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-200'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {c.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 快捷模板 */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-500" />
              快捷模板（点击即填）
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.label}
                  onClick={() => applyTemplate(t)}
                  className="text-left px-3 py-2 rounded-lg border border-slate-100 hover:bg-sky-50 hover:border-sky-200 transition-colors text-sm text-slate-600"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!description.trim() || isGenerating}
            className="w-full py-3 bg-gradient-to-r from-sky-600 to-blue-700 text-white rounded-xl font-medium hover:from-sky-700 hover:to-blue-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <><RefreshCw className="w-5 h-5 animate-spin" /> 生成中...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> 生成 Agent</>
            )}
          </button>
        </div>
      )}

      {/* Step 2: 预览确认 */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-600" />
              预览 Agent
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{generated.icon}</span>
                <div>
                  <h4 className="text-lg font-semibold text-slate-800">{generated.name}</h4>
                  <p className="text-sm text-slate-500">{generated.description}</p>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <p className="text-xs text-slate-400 mb-1">System Prompt</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{generated.systemPrompt}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-sky-50 text-sky-600">低档: {generated.fastModel}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">中档: {generated.defaultModel}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-600">高档: {generated.advancedModel}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('describe')}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              返回修改
            </button>
            <button
              onClick={() => setStep('config')}
              className="flex-1 py-2.5 border border-sky-200 text-sky-600 rounded-xl hover:bg-sky-50 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              精细调整
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              保存 Agent
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 精细配置 */}
      {step === 'config' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-sky-600" />
              精细配置
            </h3>
            <div className="space-y-4">
              {/* 名称 */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">名称</label>
                <input
                  value={generated.name || ''}
                  onChange={e => setGenerated(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              {/* 图标 */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">图标 (单个 emoji)</label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{generated.icon || '🤖'}</span>
                  <input
                    value={generated.icon || ''}
                    onChange={e => setGenerated(prev => ({ ...prev, icon: e.target.value }))}
                    maxLength={2}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="🤖"
                  />
                </div>
              </div>
              {/* 简介 */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">一句话简介</label>
                <input
                  value={generated.description || ''}
                  onChange={e => setGenerated(prev => ({ ...prev, description: e.target.value }))}
                  maxLength={30}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              {/* System Prompt */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">System Prompt</label>
                <textarea
                  value={generated.systemPrompt || ''}
                  onChange={e => setGenerated(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              {/* 模型档位 */}
              <div className="grid grid-cols-3 gap-3">
                {(['fastModel', 'defaultModel', 'advancedModel'] as const).map((key, i) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">
                      {['低档 (Fast)', '中档 (Balanced)', '高档 (Deep)'][i]}
                    </label>
                    <select
                      value={generated[key] || ''}
                      onChange={e => setGenerated(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      {MODEL_OPTIONS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              {/* 颜色 */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">主题色</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setGenerated(prev => ({ ...prev, color: c.value }))}
                      className={`w-8 h-8 rounded-lg ${c.preview} transition-all ${
                        generated.color === c.value ? 'ring-2 ring-sky-500 ring-offset-2 scale-110' : 'hover:scale-105'
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('preview')}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              返回预览
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              保存 Agent
            </button>
          </div>
        </div>
      )}

      {/* 取消按钮 */}
      {step !== 'preview' && (
        <button
          onClick={onCancel}
          className="mt-4 text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          取消创建
        </button>
      )}
    </div>
  )
}
