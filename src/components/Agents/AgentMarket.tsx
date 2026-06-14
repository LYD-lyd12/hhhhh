'use client'

import { useState } from 'react'
import { Search, Download, Star, ExternalLink, Code, FileText, Briefcase, Shield, Globe, Users, Store, Sparkles, Building2, Utensils, ShieldAlert, ClipboardCheck, Check, Trash2 } from 'lucide-react'
import type { CustomAgent } from './AgentFactory'

// ─── localStorage 持久化 ──────────────────────────
const MARKET_KEY = 'tianyi_custom_agents'

function loadCustomAgents(): CustomAgent[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(MARKET_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveCustomAgents(agents: CustomAgent[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(MARKET_KEY, JSON.stringify(agents)) } catch {}
}

// ─── 预置社区 Agent ──────────────────────────────
const COMMUNITY_AGENTS: CustomAgent[] = [
  // ═══ 电信场景 Agent（对标竞品核心能力） ═══
  {
    id: 'community-telco-1', name: '数字网格员', icon: '🏘️', color: 'from-sky-600 to-blue-800',
    description: '基层巡查、隐患归集、工单派发', defaultModel: 'deepseek-chat', advancedModel: 'deepseek-reasoner',
    fastModel: 'pollinations-gpt',
    systemPrompt: `你是数字网格员，服务于江苏电信基层巡查场景。你的核心能力：
1. 巡查任务生成：根据巡查区域（园区/社区/企业）自动生成检查清单和任务路线
2. 问题归集与分类：将现场问题按安全等级（红/黄/蓝）分类，生成结构化记录
3. 工单派发：为每个隐患生成工单，明确责任部门、整改时限和验收标准
4. 排查报告：汇总巡查结果，输出标准化排查报告（含统计图表建议）
5. 整改提醒：跟踪未闭环工单，生成催办提醒文案

回答时使用清单格式，标注优先级（🔴紧急 🟡重要 🔵常规）。`,
    category: 'telecom', author: '翼站Token超市', createdAt: '2026-06-10', published: true, downloads: 256,
  },
  {
    id: 'community-telco-2', name: '食品安全监控团队', icon: '🍽️', color: 'from-emerald-500 to-green-700',
    description: '食安巡检、证照台账、风险研判', defaultModel: 'deepseek-chat', advancedModel: 'deepseek-reasoner',
    fastModel: 'pollinations-gpt',
    systemPrompt: `你是食品安全监控团队，负责园区食堂、学校食堂、企业餐厅及餐饮单位的食安监管。你的核心能力：
1. 巡检计划生成：根据经营类型和风险等级自动排定巡检频次和重点检查项
2. 现场问题记录与识别：对照食安法规（GB 31654等）识别违规项，生成整改清单
3. 证照台账提醒：跟踪食品经营许可证、健康证等证照有效期，提前生成续期提醒
4. 风险研判：结合历史检查数据和季节特征，输出食品安全风险评估报告
5. 监管报告输出：按市监局格式生成季度/年度食品安全监管工作报告

所有建议需注明法规依据，风险用🔴🟡🟢三级标注。`,
    category: 'telecom', author: '翼站Token超市', createdAt: '2026-06-10', published: true, downloads: 189,
  },
  {
    id: 'community-telco-3', name: '软件开发团队', icon: '💻', color: 'from-violet-500 to-purple-800',
    description: '政企项目交付、接口开发、代码生成', defaultModel: 'deepseek-chat', advancedModel: 'deepseek-reasoner',
    fastModel: 'pollinations-gpt',
    systemPrompt: `你是软件开发团队，专注于政企软件交付和智改数转项目实施。你的核心能力：
1. 需求拆解：将业务需求文档拆解为可执行的技术任务，输出 WBS 结构
2. 接口文档分析：解析 RESTful/SOAP API 文档，生成接口调用代码和联调说明
3. 代码生成：按 Java/Spring Boot 或 Python/FastAPI 规范生成生产级代码（含异常处理、日志、单元测试）
4. 测试用例编写：基于用户故事和接口定义生成集成测试用例（JUnit/pytest）
5. 交付文档输出：自动生成接口联调文档、部署说明和验收 checklist

代码输出需标注语言、关键逻辑注释，遵循阿里巴巴Java开发手册或PEP8规范。`,
    category: 'telecom', author: '翼站Token超市', createdAt: '2026-06-10', published: true, downloads: 312,
  },
  {
    id: 'community-telco-4', name: '材料撰写团队', icon: '📝', color: 'from-amber-500 to-orange-700',
    description: '经营分析、项目汇报、过程文档编制', defaultModel: 'pollinations-mistral', advancedModel: 'deepseek-reasoner',
    fastModel: 'pollinations-gpt',
    systemPrompt: `你是材料撰写团队，服务基层综合与内勤人员的文档编制需求。你的核心能力：
1. 资料整理：从零散信息中提取关键数据，形成结构化提纲
2. 提纲生成：根据材料类型（工作汇报/经营分析/调研报告/会议纪要）自动生成规范提纲
3. 正文撰写：按三段式（背景→工作内容→成效与计划）展开，语言符合政企公文风格
4. 数据归纳：将业务数据转化为趋势描述，自动生成"同比/环比"等统计措辞
5. 格式规范与润色：检查公文格式（标题层级、页码、落款），优化语言表达

输出风格：专业规范、数据驱动、结构清晰。涉及敏感信息时标注"【】"占位符。`,
    category: 'telecom', author: '翼站Token超市', createdAt: '2026-06-10', published: true, downloads: 278,
  },
  // ═══ 通用社区 Agent ═══
  {
    id: 'community-1', name: 'SQL 优化大师', icon: '🗄️', color: 'from-cyan-500 to-teal-600',
    description: '数据库性能调优专家', defaultModel: 'deepseek-chat', advancedModel: 'deepseek-reasoner',
    fastModel: 'pollinations-gpt', systemPrompt: '你是 SQL 优化大师，擅长分析慢查询、优化索引和表结构。给出具体SQL改写建议。',
    category: 'dev', author: '社区', createdAt: '2026-06-01', published: true, downloads: 128,
  },
  {
    id: 'community-2', name: 'PPT 架构师', icon: '📊', color: 'from-rose-500 to-red-600',
    description: '汇报材料与PPT大纲', defaultModel: 'pollinations-gpt', advancedModel: 'pollinations-mistral',
    fastModel: 'pollinations-gpt', systemPrompt: '你是 PPT 架构师，根据主题生成汇报大纲、每页要点和视觉建议。结构清晰，适合领导查看。',
    category: 'writing', author: '社区', createdAt: '2026-06-02', published: true, downloads: 89,
  },
  {
    id: 'community-3', name: '法律文书助手', icon: '⚖️', color: 'from-slate-600 to-slate-800',
    description: '合同审查与法律文书', defaultModel: 'pollinations-gpt', advancedModel: 'deepseek-reasoner',
    fastModel: 'pollinations-gpt', systemPrompt: '你是法律文书助手，协助审查合同条款、起草法律文件。注意标注风险点。最终意见仅供参考，不构成法律建议。',
    category: 'business', author: '社区', createdAt: '2026-06-03', published: true, downloads: 56,
  },
  {
    id: 'community-4', name: '运维排障师', icon: '🔧', color: 'from-lime-500 to-green-600',
    description: '服务器故障诊断与排查', defaultModel: 'deepseek-chat', advancedModel: 'deepseek-reasoner',
    fastModel: 'pollinations-gpt', systemPrompt: '你是运维排障师，根据错误日志和现象诊断服务器故障。用排查清单方式输出，从最常见原因到最罕见。',
    category: 'dev', author: '社区', createdAt: '2026-06-04', published: true, downloads: 72,
  },
  {
    id: 'community-5', name: 'UX 评审顾问', icon: '🎨', color: 'from-pink-500 to-rose-600',
    description: '交互体验评审与建议', defaultModel: 'pollinations-gpt', advancedModel: 'pollinations-mistral',
    fastModel: 'pollinations-gpt', systemPrompt: '你是 UX 评审顾问，评审产品交互体验。从可用性、信息架构、视觉层次角度给出改进建议。',
    category: 'general', author: '社区', createdAt: '2026-06-05', published: true, downloads: 43,
  },
]

const CATEGORIES = [
  { id: 'all', label: '全部', icon: Globe },
  { id: 'telecom', label: '电信场景', icon: Building2 },
  { id: 'dev', label: '开发编程', icon: Code },
  { id: 'writing', label: '文案写作', icon: FileText },
  { id: 'business', label: '商业分析', icon: Briefcase },
  { id: 'security', label: '安全合规', icon: Shield },
  { id: 'customer', label: '客户服务', icon: Users },
  { id: 'general', label: '通用助手', icon: Globe },
]

const CATEGORY_MAP: Record<string, string> = {
  '全部': 'all', '电信场景': 'telecom', '开发编程': 'dev', '文案写作': 'writing', '商业分析': 'business',
  '安全合规': 'security', '客户服务': 'customer', '通用助手': 'general',
  all: '全部', telecom: '电信场景', dev: '开发编程', writing: '文案写作', business: '商业分析',
  security: '安全合规', customer: '客户服务', general: '通用助手',
}

interface Props {
  onInstall: (agent: CustomAgent) => void
  onCreateNew: () => void
}

export default function AgentMarket({ onInstall, onCreateNew }: Props) {
  const [customAgents, setCustomAgents] = useState<CustomAgent[]>(loadCustomAgents())
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  // 跟踪已安装的 Agent ID，用于按钮状态反馈
  const [installedIds, setInstalledIds] = useState<Set<string>>(() => {
    const ids = new Set<string>()
    // 初次加载：localStorage 中持久化的才算"已安装"
    try {
      const raw = localStorage.getItem(MARKET_KEY)
      if (raw) JSON.parse(raw).forEach((a: any) => ids.add(a.id))
    } catch {}
    return ids
  })
  // 跟踪下载数（支持实时更新）
  const [downloadsMap, setDownloadsMap] = useState<Record<string, number>>({})

  // 合并社区 + 自定义（去重：自定义中与社区重复的过滤掉）
  const communityIds = new Set(COMMUNITY_AGENTS.map(a => a.id))
  const allAgents = [...COMMUNITY_AGENTS, ...customAgents.filter(a => !communityIds.has(a.id))]

  // 卸载：从 localStorage 中移除
  const handleUninstall = (agent: CustomAgent) => {
    // 从已安装集合中移除
    setInstalledIds(prev => {
      const next = new Set(prev)
      next.delete(agent.id)
      return next
    })
    // 从 localStorage 中移除
    try {
      const raw = localStorage.getItem(MARKET_KEY)
      if (raw) {
        const existing = JSON.parse(raw)
        const updated = existing.filter((a: any) => a.id !== agent.id)
        if (updated.length > 0) {
          localStorage.setItem(MARKET_KEY, JSON.stringify(updated))
        } else {
          localStorage.removeItem(MARKET_KEY)
        }
        // 同步更新 customAgents state
        setCustomAgents(updated)
      }
    } catch {}
    // 触发 storage 事件 + 自定义事件让其他页面感知
    window.dispatchEvent(new StorageEvent('storage', { key: MARKET_KEY }))
    window.dispatchEvent(new Event('agent-market-changed'))
  }

  // 过滤
  const filtered = allAgents.filter(a => {
    const matchSearch = !search || a.name.includes(search) || a.description.includes(search)
    const matchCategory = activeCategory === 'all' || a.category === activeCategory
    return matchSearch && matchCategory
  })

  // 安装：通知父组件 + 更新本地反馈
  const handleInstall = (agent: CustomAgent) => {
    onInstall(agent)
    // 标记为已安装
    setInstalledIds(prev => new Set(prev).add(agent.id))
    // 更新下载计数（所有 Agent 类型均计数）
    setDownloadsMap(prev => ({ ...prev, [agent.id]: (prev[agent.id] || agent.downloads) + 1 }))
    // 如果是自定义 Agent，同步更新持久化列表
    if (!agent.id.startsWith('community-')) {
      const updated = customAgents.map(a =>
        a.id === agent.id ? { ...a, downloads: a.downloads + 1 } : a
      )
      setCustomAgents(updated)
      saveCustomAgents(updated)
    }
    // 通知智脑页面刷新 Agent 列表
    window.dispatchEvent(new Event('agent-market-changed'))
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]" data-testid="agent-market">
      {/* 搜索 + 分类 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索 Agent..."
            className="w-full pl-9 pr-3 py-2 border border-[#334155] bg-[#1e293b] rounded-xl text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            data-testid="market-search"
          />
        </div>
        <div className="flex gap-1.5">
          {CATEGORIES.map(c => {
            const Icon = c.icon
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeCategory === c.id
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                    : 'bg-[#1e293b] text-slate-400 hover:text-slate-200 hover:bg-[#334155] border border-[#334155]'
                }`}
              >
                <Icon className="w-3 h-3" />
                {c.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Agent 卡片列表 */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-slate-400">
            <div className="text-center">
              <Store className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-sm">没有找到匹配的 Agent</p>
              <button
                onClick={onCreateNew}
                className="mt-3 text-sky-400 hover:text-sky-300 text-sm font-medium"
              >
                创建一个 →
              </button>
            </div>
          </div>
        ) : (
          <div className={`grid gap-3 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filtered.map(agent => (
              <div
                key={agent.id}
                className="bg-[#1e293b] rounded-xl border border-[#334155] hover:border-sky-500/60 hover:shadow-[0_0_18px_rgba(56,189,248,0.2)] transition-all group"
                data-testid={`market-agent-${agent.id}`}
              >
                <div className="p-4">
                  {/* 头部 */}
                  <div className={`inline-flex rounded-xl p-3 bg-gradient-to-br ${agent.color} mb-3`}>
                    <span className="text-2xl">{agent.icon}</span>
                  </div>

                  <h3 className="font-semibold text-white mb-1">{agent.name}</h3>
                  <p className="text-sm text-slate-300 mb-3">{agent.description}</p>

                  {/* 标签 */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0f172a] text-slate-300 font-medium">
                      {CATEGORY_MAP[agent.category] || agent.category}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 font-medium">
                      {agent.defaultModel}
                    </span>
                    {((downloadsMap[agent.id] || agent.downloads) > 0) && (
                      <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                        <Download className="w-3 h-3" />
                        {downloadsMap[agent.id] || agent.downloads}
                      </span>
                    )}
                  </div>

                  {/* 底部操作 */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#334155]">
                    <span className="text-xs text-slate-400">{agent.author}</span>
                    {installedIds.has(agent.id) ? (
                      <div className="flex items-center gap-1.5">
                        <span className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/15 text-emerald-400 rounded-lg text-xs font-medium border border-emerald-500/20">
                          <Check className="w-3 h-3" />
                          已安装
                        </span>
                        <button
                          onClick={() => handleUninstall(agent)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white rounded-lg text-xs font-medium border border-red-500/20 hover:border-red-500 transition-colors"
                          data-testid={`market-uninstall-${agent.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                          卸载
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleInstall(agent)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors text-xs font-medium"
                        data-testid={`market-install-${agent.id}`}
                      >
                        <Download className="w-3 h-3" />
                        安装
                      </button>
                    )}
                  </div>
                </div>

                {/* 悬停显示 system prompt 摘要 */}
                <div className="hidden group-hover:block px-4 pb-4">
                  <div className="bg-[#252b3d] rounded-lg p-2.5">
                    <p className="text-xs text-slate-300 line-clamp-2">{agent.systemPrompt}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部统计 */}
      <div className="mt-4 pt-3 border-t border-[#334155] flex items-center justify-between text-xs text-slate-400">
        <span>共 {allAgents.length} 个 Agent · {customAgents.length} 个自定义</span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Agent 市场 - UGC 生态
        </span>
      </div>
    </div>
  )
}
