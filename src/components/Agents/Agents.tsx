'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, User, RefreshCw, Zap, Brain, Flame, Sparkles, Plus, MessageSquare, Trash2, ChevronDown, Search, CheckSquare, Download, FileText, Paperclip, Image, File, X, Bot, Cpu } from 'lucide-react'
import { api } from '@/lib/api'
import TaskDecomposer from './TaskDecomposer'

// ─── Agent 定义 ──────────────────────────────────
interface AgentConfig {
  id: string
  name: string
  icon: string
  color: string
  description: string
  defaultModel: string
  advancedModel: string
  fastModel: string
  systemPrompt: string
}

// ─── 三档模式 ────────────────────────────────────
type Tier = 'fast' | 'balanced' | 'deep'

interface TierConfig {
  key: Tier
  label: string
  icon: typeof Zap
  desc: string
  temperature: number
  maxTokens: number
  color: string
  bg: string
}

const TIERS: TierConfig[] = [
  { key: 'fast', label: '快速', icon: Zap, desc: '低延迟、简洁回答', temperature: 0.3, maxTokens: 512, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  { key: 'balanced', label: '均衡', icon: Brain, desc: '质量与速度兼顾', temperature: 0.7, maxTokens: 2048, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { key: 'deep', label: '深度', icon: Flame, desc: '深度推理、长篇输出', temperature: 0.9, maxTokens: 8192, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
]

const AGENTS: AgentConfig[] = [
  { id: 'tianyi', name: '天翼智脑', icon: '☁️', color: 'from-sky-600 to-blue-800', description: '天翼智脑默认助手，一站式AI对话', defaultModel: 'deepseek-chat', advancedModel: 'deepseek-reasoner', fastModel: 'pollinations-gpt', systemPrompt: '你是天翼智脑，翼站Token超市的智能导购。依托中国电信骨干网络，让Token像流量一样人人可用。提供多模型选购与智能问答服务。回答风格专业严谨、条理清晰。' },
  { id: 'doubao', name: '豆包', icon: '🫘', color: 'from-emerald-500 to-teal-600', description: '字节跳动出品，日常对话、文案创作', defaultModel: 'pollinations-gpt', advancedModel: 'pollinations-mistral', fastModel: 'pollinations-gpt', systemPrompt: '你是豆包，字节跳动开发的 AI 助手。用亲切自然的中文回答，风格活泼但专业。' },
  { id: 'deepseek', name: 'DeepSeek', icon: '🐋', color: 'from-blue-600 to-indigo-700', description: '高性价比推理，逻辑分析、编程', defaultModel: 'deepseek-chat', advancedModel: 'deepseek-reasoner', fastModel: 'deepseek-chat', systemPrompt: '你是 DeepSeek，深度求索开发的 AI 助手。擅长逻辑推理和编程，回答严谨准确。' },
  { id: 'qianwen', name: '通义千问', icon: '✨', color: 'from-purple-500 to-pink-600', description: '阿里云出品，知识广博、长文生成', defaultModel: 'pollinations-gpt', advancedModel: 'pollinations-mistral', fastModel: 'pollinations-gpt', systemPrompt: '你是通义千问，阿里云开发的大语言模型。知识面广，擅长长文本理解和生成，回答全面深入。' },
  { id: 'wenxin', name: '文心一言', icon: '💎', color: 'from-cyan-500 to-teal-600', description: '百度出品，中文理解、知识问答', defaultModel: 'pollinations-gpt', advancedModel: 'pollinations-mistral', fastModel: 'pollinations-gpt', systemPrompt: '你是文心一言，百度开发的 AI 助手。中文理解能力强，知识面广，擅长文学创作和知识问答。' },
  { id: 'kimi', name: 'Kimi', icon: '🌙', color: 'from-violet-500 to-purple-700', description: '月之暗面出品，超长上下文、文档分析', defaultModel: 'pollinations-gpt', advancedModel: 'pollinations-mistral', fastModel: 'pollinations-gpt', systemPrompt: '你是 Kimi，月之暗面开发的 AI 助手。支持超长上下文对话，擅长处理长文档和复杂信息梳理。回答细致有条理。' },
  { id: 'gemini', name: 'Gemini', icon: '🔮', color: 'from-blue-400 to-sky-600', description: 'Google 出品，多模态、全球化视野', defaultModel: 'pollinations-gpt', advancedModel: 'pollinations-mistral', fastModel: 'pollinations-gpt', systemPrompt: '你是 Gemini，Google 开发的多模态 AI 助手。拥有全球化视野，回答专业且国际化。' },
  { id: 'claude', name: 'Claude', icon: '🧠', color: 'from-amber-500 to-orange-600', description: 'Anthropic 出品，长文写作、深度分析', defaultModel: 'pollinations-gpt', advancedModel: 'pollinations-mistral', fastModel: 'pollinations-gpt', systemPrompt: '你是 Claude，Anthropic 开发的 AI 助手。注重安全、诚实和有益，用清晰的结构化方式回答问题。' },
  { id: 'codex', name: 'Codex', icon: '💻', color: 'from-gray-700 to-slate-800', description: '编程专家，代码生成、Debug、架构设计', defaultModel: 'deepseek-chat', advancedModel: 'deepseek-reasoner', fastModel: 'deepseek-chat', systemPrompt: '你是 Codex，一个专业的编程 AI 助手。用简洁的代码回答，标注语言和关键逻辑。' },
]

// ─── 加载用户自定义 Agent ─────────────────────────
const CUSTOM_AGENTS_KEY = 'tianyi_custom_agents'

function loadCustomAgents(): AgentConfig[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CUSTOM_AGENTS_KEY)
    if (!raw) return []
    return JSON.parse(raw).map((a: any) => ({
      id: a.id, name: a.name, icon: a.icon, color: a.color,
      description: a.description, defaultModel: a.defaultModel,
      advancedModel: a.advancedModel, fastModel: a.fastModel,
      systemPrompt: a.systemPrompt,
    }))
  } catch { return [] }
}

// ─── 消息类型 ─────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  loading?: boolean
  tier?: Tier
  attachments?: AttachedFile[]   // 多模态附件
}

// ─── 附件类型 ─────────────────────────────────────
interface AttachedFile {
  id: string
  name: string
  type: 'image' | 'pdf' | 'text' | 'code' | 'other'
  size: number
  dataUrl: string             // base64 data URL（图片）或文本内容
  previewUrl?: string         // 缩略图
}

// ─── 对话类型 ─────────────────────────────────────
interface Conversation {
  id: string
  title: string            // 自动从第一条用户消息截取
  agentId: string
  tier: Tier
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

// ─── 生成对话 ID ──────────────────────────────────
const genId = () => `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

// ─── localStorage 持久化 ──────────────────────────
const STORAGE_KEY = 'tianyi_conversations'

function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    // 恢复 Date 对象
    return data.map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      messages: c.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })),
    }))
  } catch { return [] }
}

function saveConversations(convs: Conversation[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(convs)) } catch { /* quota exceeded */ }
}

export default function Agents() {
  // ─── 对话管理 ──────────────────────────────────
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [convSearch, setConvSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [viewMode, setViewMode] = useState<'chat' | 'task'>('chat')
  // ─── 内置模型列表（9 大流行模型，不含用户自定义 Agent） ───
  const [modelAgents] = useState<AgentConfig[]>(AGENTS)
  // 用户自定义 Agent（从 Agent 市场安装/创建的）
  const [customAgents, setCustomAgents] = useState<AgentConfig[]>(() => {
    if (typeof window === 'undefined') return []
    return loadCustomAgents()
  })
  // 刷新自定义 Agent 列表（安装/卸载后调用）
  const refreshCustomAgents = () => {
    if (typeof window === 'undefined') return
    const customs = loadCustomAgents()
    const builtinIds = new Set(AGENTS.map(a => a.id))
    setCustomAgents(customs.filter(a => !builtinIds.has(a.id)))
  }
  // 合并所有（用于查找 current agent）
  const allAgents = [...modelAgents, ...customAgents]

  // 初始化：加载持久化数据，没有则创建默认对话
  useEffect(() => {
    const saved = loadConversations()
    if (saved.length > 0) {
      setConversations(saved)
      setActiveConvId(saved[0].id)
    } else {
      const defaultConv = createConversation('tianyi', 'balanced')
      setConversations([defaultConv])
      setActiveConvId(defaultConv.id)
    }
  }, [])

  // 持久化
  useEffect(() => {
    if (conversations.length > 0) saveConversations(conversations)
  }, [conversations])

  // ─── 当前活跃对话 ──────────────────────────────
  const activeConv = conversations.find(c => c.id === activeConvId) || null
  const activeAgent = allAgents.find(a => a.id === activeConv?.agentId) || allAgents[0]
  const currentTier = TIERS.find(t => t.key === (activeConv?.tier || 'balanced'))!
  const messages = activeConv?.messages || []

  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [showAgentPicker, setShowAgentPicker] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const modelPickerRef = useRef<HTMLDivElement>(null)
  const agentPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // 点击外部关闭模型选择器
  useEffect(() => {
    if (!showModelPicker) return
    const h = (e: MouseEvent) => { if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) setShowModelPicker(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showModelPicker])

  // 点击外部关闭 Agent 选择器
  useEffect(() => {
    if (!showAgentPicker) return
    const h = (e: MouseEvent) => { if (agentPickerRef.current && !agentPickerRef.current.contains(e.target as Node)) setShowAgentPicker(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showAgentPicker])

  // 监听 storage 变化 + 自定义事件（Agent 市场安装/卸载后自动刷新）
  useEffect(() => {
    const h = (e: StorageEvent) => {
      if (e.key === CUSTOM_AGENTS_KEY) refreshCustomAgents()
    }
    const onCustom = () => refreshCustomAgents()
    window.addEventListener('storage', h)
    window.addEventListener('agent-market-changed', onCustom)
    // 页面 focus 回来也刷新（同标签页切换）
    const onFocus = () => refreshCustomAgents()
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('storage', h)
      window.removeEventListener('agent-market-changed', onCustom)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  // ─── 创建对话 ──────────────────────────────────
  const createConversation = (agentId: string, tier: Tier): Conversation => {
    const agent = allAgents.find(a => a.id === agentId) || allAgents[0]
    return {
      id: genId(),
      title: '新对话',
      agentId,
      tier,
      messages: [{
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `你好！我是 **${agent.name}**，${agent.description}。请问有什么可以帮你？`,
        timestamp: new Date(),
        tier,
      }],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  const handleNewChat = () => {
    const newConv = createConversation('tianyi', 'balanced')
    setConversations(prev => [newConv, ...prev])
    setActiveConvId(newConv.id)
  }

  // ─── 切换对话 ──────────────────────────────────
  const handleSelectConv = (convId: string) => {
    setActiveConvId(convId)
  }

  // ─── 删除对话 ──────────────────────────────────
  const handleDeleteConv = (e: React.MouseEvent, convId: string) => {
    e.stopPropagation()
    let newList = conversations.filter(c => c.id !== convId)
    if (newList.length === 0) {
      const defaultConv = createConversation('tianyi', 'balanced')
      newList = [defaultConv]
    }
    setConversations(newList)
    if (activeConvId === convId) setActiveConvId(newList[0].id)
  }

  // ─── 更新当前对话 ──────────────────────────────
  const updateConv = (updater: (conv: Conversation) => Conversation) => {
    setConversations(prev => prev.map(c => c.id === activeConvId ? updater(c) : c))
  }

  // ─── 切换 Agent ────────────────────────────────
  const switchAgent = (agentId: string) => {
    if (!activeConv) return
    const agent = allAgents.find(a => a.id === agentId) || allAgents[0]
    setShowModelPicker(false)
    setShowAgentPicker(false)
    updateConv(c => ({
      ...c,
      agentId,
      messages: [
        ...c.messages,
        { id: `switch-${Date.now()}`, role: 'system', content: `已切换至 ${agent.name}`, timestamp: new Date() },
        { id: `welcome-${Date.now()}`, role: 'assistant', content: `你好！我是 ${agent.name}，${agent.description}。请问有什么可以帮你？`, timestamp: new Date(), tier: c.tier },
      ],
      updatedAt: new Date(),
    }))
  }

  // ─── 导出对话 ──────────────────────────────────
  const handleExport = (format: 'md' | 'txt') => {
    if (!activeConv) return
    let text = `# ${activeConv.title}\n\n`
    text += `Agent: ${activeAgent.name} | 档位: ${TIERS.find(t => t.key === activeConv.tier)?.label}\n`
    text += `时间: ${new Date(activeConv.createdAt).toLocaleString('zh-CN')}\n\n---\n\n`
    for (const msg of activeConv.messages) {
      if (msg.loading || msg.role === 'system') continue
      const role = msg.role === 'user' ? '🧑 我' : `🤖 ${activeAgent.name}`
      text += `**${role}** (${formatDate(msg.timestamp)})\n\n${msg.content}\n\n---\n\n`
    }
    const blob = new Blob([text], { type: format === 'md' ? 'text/markdown' : 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeConv.title.replace(/[\/\\:*?"<>|]/g, '-')}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── 切换档位 ──────────────────────────────────
  const switchTier = (tier: Tier) => {
    if (!activeConv) return
    updateConv(c => ({ ...c, tier, updatedAt: new Date() }))
  }

  // ─── 获取当前模型 ──────────────────────────────
  const getModel = () => {
    if (!activeConv) return activeAgent.defaultModel
    if (activeConv.tier === 'fast') return activeAgent.fastModel
    if (activeConv.tier === 'deep') return activeAgent.advancedModel
    return activeAgent.defaultModel
  }

  // ─── 文件处理 ──────────────────────────────────
  // 读取文件为 base64 data URL（图片）或文本
  const readFileAsData = (f: File): Promise<AttachedFile> => {
    return new Promise((resolve, reject) => {
      const ext = f.name.split('.').pop()?.toLowerCase() || ''
      const isImage = ['png','jpg','jpeg','gif','webp','bmp','svg'].includes(ext)
      const isText = ['txt','md','csv','json','xml','yaml','yml','log'].includes(ext)
      const isCode = ['js','ts','jsx','tsx','py','java','go','rs','cpp','c','h','rb','php','swift','kt','sh','bat','sql','html','css','scss','vue','svelte'].includes(ext)
      const isPdf = ext === 'pdf'

      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const att: AttachedFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: f.name,
          type: isImage ? 'image' : isPdf ? 'pdf' : isCode ? 'code' : isText ? 'text' : 'other',
          size: f.size,
          dataUrl: result,
          previewUrl: isImage ? result : undefined,
        }
        resolve(att)
      }
      reader.onerror = reject
      if (isImage || isPdf) reader.readAsDataURL(f)
      else reader.readAsText(f)
    })
  }

  // 添加文件
  const handleFilesAdd = async (files: FileList | File[]) => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const validFiles = Array.from(files).filter(f => {
      if (f.size > maxSize) { alert(`${f.name} 超过 10MB 限制`); return false }
      return true
    })
    if (validFiles.length === 0) return
    const results = await Promise.all(validFiles.map(readFileAsData))
    setAttachedFiles(prev => [...prev, ...results])
  }

  // 移除单个附件
  const removeFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id))
  }

  // 粘贴处理（支持图片粘贴）
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    const imageFiles: File[] = []
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) imageFiles.push(file)
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault()
      await handleFilesAdd(imageFiles)
    }
  }

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false) }
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) await handleFilesAdd(e.dataTransfer.files)
  }

  // ─── 发送消息 ──────────────────────────────────
  const handleSend = async () => {
    const hasText = inputValue.trim().length > 0
    const hasFiles = attachedFiles.length > 0
    if ((!hasText && !hasFiles) || isLoading || !activeConv) return

    // 构建带附件的用户消息内容
    let msgContent = inputValue.trim()
    // 文本/代码文件：注入内容到 prompt
    const textFiles = attachedFiles.filter(f => f.type === 'text' || f.type === 'code')
    if (textFiles.length > 0) {
      const fileContexts = textFiles.map(f => {
        const content = f.dataUrl.slice(0, 3000) // 每个文件最多3000字符
        return `\n\n--- 文件: ${f.name} ---\n${content}${f.dataUrl.length > 3000 ? '\n...(内容已截断)' : ''}`
      }).join('')
      msgContent = msgContent || '请分析以下文件内容' + fileContexts
    }

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: msgContent,
      timestamp: new Date(),
      tier: activeConv.tier,
      attachments: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
    }
    const isFirstUserMsg = activeConv.messages.every(m => m.role !== 'user')
    const newTitle = isFirstUserMsg ? (inputValue.trim().slice(0, 30) || '文件对话') + ((inputValue.trim().length > 30 || !inputValue.trim()) ? '...' : '') : activeConv.title

    updateConv(c => ({
      ...c,
      title: newTitle,
      messages: [...c.messages, userMsg],
      updatedAt: new Date(),
    }))
    setInputValue('')
    setAttachedFiles([])
    setIsLoading(true)

    // 加载骨架
    const loadingMsg: Message = {
      id: `l-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true,
      tier: activeConv.tier,
    }
    updateConv(c => ({ ...c, messages: [...c.messages, loadingMsg] }))

    try {
      const model = getModel()
      const convMessages = activeConv.messages.filter(m => !m.loading && m.role !== 'system')

      // 构建 API 消息，图片附件使用 OpenAI 多模态格式
      const images = userMsg.attachments?.filter(a => a.type === 'image') || []
      const userApiContent: any = images.length > 0
        ? [
            { type: 'text', text: userMsg.content || '请分析这张图片' },
            ...images.map(img => ({
              type: 'image_url',
              image_url: { url: img.dataUrl, detail: 'auto' }
            }))
          ]
        : userMsg.content

      const apiMessages = [
        { role: 'system' as const, content: activeAgent.systemPrompt },
        ...convMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: userApiContent },
      ]

      const response = await api.models.chat(model, apiMessages)

      let content = ''
      if (response.choices?.[0]?.message?.content) content = response.choices[0].message.content
      else if (response.message) content = response.message
      else if (response.error) content = `调用失败：${response.error}`
      else content = '抱歉，收到了无法识别的响应。'

      const reply: Message = {
        id: `r-${Date.now()}`,
        role: 'assistant',
        content,
        timestamp: new Date(),
        tier: activeConv.tier,
      }

      updateConv(c => ({
        ...c,
        messages: c.messages.map(m => (m.loading ? reply : m)),
        updatedAt: new Date(),
      }))
    } catch {
      updateConv(c => ({
        ...c,
        messages: c.messages.map(m =>
          m.loading ? { ...m, loading: false, content: '抱歉，调用失败，请检查后端服务或网络连接。' } : m
        ),
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const formatDate = (d: Date) => {
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  // ─── 过滤对话列表 ──────────────────────────────
  const filteredConvs = convSearch
    ? conversations.filter(c => c.title.toLowerCase().includes(convSearch.toLowerCase()))
    : conversations

  // ─── 任务视图 ────────────────────────────
  if (viewMode === 'task') {
    return (
      <div className="h-[calc(100vh-8rem)]" data-testid="agents-panel">
        <div className="flex items-center gap-1 mb-3">
          <button onClick={() => setViewMode('chat')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] flex items-center gap-1.5 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" /> 对话
          </button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/15 text-sky-400 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5" /> 任务
          </button>
        </div>
        <TaskDecomposer />
      </div>
    )
  }

  // ─── 对话视图 ─────────────────────────────
    return (
    <div className="flex flex-col h-[calc(100vh-8rem)]" data-testid="agents-panel">
      {/* 模式切换 Tab */}
      <div className="flex items-center gap-1 mb-3">
        <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/15 text-sky-400 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" /> 对话
        </button>
        <button onClick={() => setViewMode('task')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] flex items-center gap-1.5 transition-colors">
          <CheckSquare className="w-3.5 h-3.5" /> 任务
        </button>
      </div>

      {/* 价值主张横幅 */}
      <div className="mb-3 px-4 py-3 rounded-xl bg-gradient-to-r from-sky-900/60 via-indigo-900/40 to-purple-900/60 border border-sky-500/20 flex items-center gap-6 text-xs">
        <span className="text-slate-300">翼站Token超市</span>
        <span className="w-px h-4 bg-white/10" />
        <span className="text-sky-400 font-semibold">7 厂商</span>
        <span className="text-slate-500">|</span>
        <span className="text-sky-400 font-semibold">21 模型</span>
        <span className="text-slate-500">|</span>
        <span className="text-emerald-400 font-semibold">节省 40%+ API 成本</span>
        <span className="text-slate-500">|</span>
        <span className="text-purple-400 font-semibold">99.5% 可用率</span>
        <span className="text-slate-500">|</span>
        <span className="text-amber-400 font-semibold">4 电信场景 Agent</span>
      </div>

      <div className="flex-1 flex gap-0 rounded-xl overflow-hidden border border-white/[0.06] bg-[#0f172a]" data-testid="agents-chat">
      {/* ═══════════════════════════════════════════
          左侧：对话历史侧栏（豆包风格）
          ═══════════════════════════════════════════ */}
      {sidebarOpen && (
        <div className="w-64 flex-shrink-0 bg-white/[0.02] border-r border-white/[0.06] flex flex-col">
          {/* 新建对话 */}
          <div className="p-3">
            <button
              onClick={handleNewChat}
              data-testid="agents-new-chat"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              新对话
            </button>
          </div>

          {/* 搜索框 */}
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                value={convSearch}
                onChange={e => setConvSearch(e.target.value)}
                placeholder="搜索对话..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-white/[0.08] rounded-lg bg-white/[0.03] text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-400"
              />
            </div>
          </div>

          {/* 对话列表 */}
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
            {filteredConvs.map(conv => {
              const agent = allAgents.find(a => a.id === conv.agentId)
              const lastMsg = conv.messages.filter(m => m.role !== 'system').slice(-1)[0]
              const preview = lastMsg
                ? (lastMsg.role === 'user' ? '我: ' : '') + lastMsg.content.slice(0, 30) + (lastMsg.content.length > 30 ? '...' : '')
                : '新对话'

              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConv(conv.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter') handleSelectConv(conv.id) }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group cursor-pointer ${
                    activeConvId === conv.id
                      ? 'bg-white/[0.05] ring-1 ring-white/[0.08]'
                      : 'hover:bg-white/[0.04]'
                  }`}
                  data-testid={`conv-${conv.id}`}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-medium text-slate-200 truncate">
                          {conv.title}
                        </span>
                        <span className="text-[10px] text-slate-500 flex-shrink-0">
                          {formatDate(conv.updatedAt)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">{preview}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-slate-400">
                          {agent?.icon} {agent?.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-slate-400">
                          {TIERS.find(t => t.key === conv.tier)?.label}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={e => handleDeleteConv(e, conv.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded transition-all flex-shrink-0"
                      title="删除对话"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          右侧：对话主区域
          ═══════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏：切换侧栏 + Agent 选择器 + 档位 */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-[#0f172a]">
          <div className="flex items-center gap-3">
            {/* 侧栏开关 */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-white/[0.04] rounded-lg text-slate-400 transition-colors"
              title={sidebarOpen ? '收起侧栏' : '展开侧栏'}
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* 模型选择器 */}
            <div className="relative" ref={modelPickerRef}>
              <button
                onClick={() => { setShowModelPicker(!showModelPicker); setShowAgentPicker(false) }}
                data-testid="agents-model-picker"
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.04] rounded-lg transition-colors"
              >
                <Cpu className="w-4 h-4 text-sky-400" />
                <span className="text-sm font-medium text-slate-200">{activeAgent.name}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showModelPicker ? 'rotate-180' : ''}`} />
              </button>

              {showModelPicker && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-[#1e293b] rounded-xl shadow-xl border border-white/[0.08] z-50 py-1 max-h-72 overflow-y-auto">
                  {modelAgents.map(a => (
                    <button
                      key={a.id}
                      onClick={() => switchAgent(a.id)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors ${
                        a.id === activeAgent.id ? 'bg-sky-500/15 text-sky-400' : 'hover:bg-white/[0.04] text-slate-300'
                      }`}
                    >
                      <span className="text-lg">{a.icon}</span>
                      <div>
                        <div className="font-medium">{a.name}</div>
                        <div className="text-xs text-slate-500">{a.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Agent 选择器（仅当有自定义 Agent 时显示） */}
            {customAgents.length > 0 && (
              <div className="relative" ref={agentPickerRef}>
                <button
                  onClick={() => { setShowAgentPicker(!showAgentPicker); setShowModelPicker(false) }}
                  data-testid="agents-agent-picker"
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.04] rounded-lg transition-colors border-l border-white/[0.06]"
                >
                  <Bot className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-300">我的 Agent</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">{customAgents.length}</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showAgentPicker ? 'rotate-180' : ''}`} />
                </button>

                {showAgentPicker && (
                  <div className="absolute left-0 top-full mt-1 w-56 bg-[#1e293b] rounded-xl shadow-xl border border-white/[0.08] z-50 py-1 max-h-72 overflow-y-auto">
                    {customAgents.map(a => (
                      <div
                        key={a.id}
                        className={`flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                          a.id === activeAgent.id ? 'bg-emerald-500/15' : 'hover:bg-white/[0.04]'
                        }`}
                      >
                        <button
                          onClick={() => switchAgent(a.id)}
                          className="flex-1 text-left flex items-center gap-2.5 min-w-0"
                        >
                          <span className="text-lg shrink-0">{a.icon}</span>
                          <div className="min-w-0">
                            <div className={`font-medium truncate ${a.id === activeAgent.id ? 'text-emerald-400' : 'text-slate-300'}`}>{a.name}</div>
                            <div className="text-xs text-slate-500 truncate">{a.description}</div>
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm(`确定要卸载「${a.name}」吗？`)) {
                              try {
                                const raw = localStorage.getItem(CUSTOM_AGENTS_KEY)
                                if (raw) {
                                  const existing = JSON.parse(raw)
                                  const updated = existing.filter((x: any) => x.id !== a.id)
                                  if (updated.length > 0) {
                                    localStorage.setItem(CUSTOM_AGENTS_KEY, JSON.stringify(updated))
                                  } else {
                                    localStorage.removeItem(CUSTOM_AGENTS_KEY)
                                  }
                                }
                              } catch {}
                              refreshCustomAgents()
                              window.dispatchEvent(new StorageEvent('storage', { key: CUSTOM_AGENTS_KEY }))
                              window.dispatchEvent(new Event('agent-market-changed'))
                            }
                          }}
                          className="shrink-0 p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors ml-1"
                          title="卸载"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 档位切换 */}
          <div className="flex items-center gap-2">
            {/* 导出按钮 */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleExport('md')}
                className="p-1.5 hover:bg-white/[0.04] rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                title="导出 Markdown"
                data-testid="agents-export-md"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleExport('txt')}
                className="p-1.5 hover:bg-white/[0.04] rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                title="导出文本"
                data-testid="agents-export-txt"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
            <div className="w-px h-5 bg-white/[0.08]" />
            {TIERS.map(t => {
              const Icon = t.icon
              const active = activeConv?.tier === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => switchTier(t.key)}
                  data-testid={`tier-${t.key}`}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active ? `${t.bg}` : 'hover:bg-white/[0.04] text-slate-400'
                  }`}
                >
                  <Icon className={`w-3 h-3 ${t.color}`} />
                  <span className={`${active ? t.color : ''}`}>{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 消息区域（支持拖拽） */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-3 relative"
          data-testid="agents-messages"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* 拖拽覆盖层 */}
          {isDragOver && (
            <div className="absolute inset-0 bg-sky-500/10 border-2 border-dashed border-sky-400 rounded-xl flex items-center justify-center z-50 backdrop-blur-sm">
              <div className="text-center">
                <Image className="w-10 h-10 text-sky-400 mx-auto mb-2" />
                <p className="text-sky-600 font-semibold">释放以添加文件</p>
                <p className="text-xs text-sky-400 mt-1">支持图片、PDF、代码、文本文件</p>
              </div>
            </div>
          )}
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <span className="text-4xl block mb-3">{activeAgent.icon}</span>
                <h3 className="text-lg font-semibold text-slate-200 mb-1">{activeAgent.name}</h3>
                <p className="text-sm text-slate-400 max-w-xs">{activeAgent.description}</p>
                <p className="text-xs text-slate-500 mt-2">输入消息、上传图片或拖拽文件开始对话</p>
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'system' ? (
                <div className="w-full text-center my-2">
                  <span className="inline-block px-3 py-1 bg-white/[0.04] rounded-full text-xs text-slate-400">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    {msg.content}
                  </span>
                </div>
              ) : (
                <>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    msg.role === 'user' ? 'bg-sky-600 text-white' : 'bg-white/[0.06]'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <span className="text-sm">{activeAgent.icon}</span>
                    )}
                  </div>
                  <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {/* 附件预览（图片） */}
                    {msg.attachments?.filter(a => a.type === 'image').map(att => (
                      <div key={att.id} className="mb-2">
                        <img
                          src={att.dataUrl}
                          alt={att.name}
                          className="max-w-[260px] max-h-[260px] rounded-xl object-cover border border-white/[0.08] shadow-sm"
                        />
                      </div>
                    ))}
                    {/* 附件预览（文件 chips） */}
                    {msg.attachments?.filter(a => a.type !== 'image').map(att => (
                      <div key={att.id} className="mb-1.5 flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] rounded-lg text-xs text-slate-400">
                        <File className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{att.name}</span>
                        <span className="text-slate-500">{formatSize(att.size)}</span>
                      </div>
                    ))}
                    <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-sky-600 text-white rounded-tr-sm'
                        : 'bg-white/[0.04] text-slate-200 rounded-tl-sm border border-white/[0.06]'
                    }`}>
                      {msg.loading ? (
                        <div className="flex items-center gap-2 py-1">
                          <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                          <span className="text-slate-400">{activeAgent.name} 正在思考...</span>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    {!msg.loading && (
                      <p className="text-xs text-slate-400 mt-1 px-1">
                        {formatDate(msg.timestamp)}
                        {msg.tier && <span className="ml-2 text-slate-300">{TIERS.find(t => t.key === msg.tier)?.label}</span>}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区（多模态） */}
        <div className="p-4 border-t border-white/[0.06]">
          {/* 附件 chips */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 max-w-4xl mx-auto">
              {attachedFiles.map(att => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-lg text-xs group"
                >
                  {att.type === 'image' ? (
                    <img src={att.dataUrl} alt={att.name} className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <File className="w-4 h-4 text-sky-400" />
                  )}
                  <span className="text-sky-300 max-w-[100px] truncate">{att.name}</span>
                  <span className="text-slate-500">{formatSize(att.size)}</span>
                  <button
                    onClick={() => removeFile(att.id)}
                    className="ml-1 p-0.5 hover:bg-red-500/10 rounded transition-colors"
                    title="移除"
                  >
                    <X className="w-3 h-3 text-slate-400 hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 items-end max-w-4xl mx-auto">
            {/* 上传按钮 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 border border-white/[0.08] rounded-xl hover:bg-white/[0.04] hover:border-sky-500/30 transition-colors flex-shrink-0 group"
              title="添加文件"
              data-testid="agents-upload-btn"
            >
              <Paperclip className="w-5 h-5 text-slate-500 group-hover:text-sky-400 transition-colors" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.md,.csv,.json,.js,.ts,.jsx,.tsx,.py,.java,.go,.rs,.cpp,.c,.rb,.php,.swift,.html,.css,.scss,.vue,.sql,.yaml,.yml,.xml,.log,.sh,.bat"
              onChange={e => { if (e.target.files) handleFilesAdd(e.target.files); e.target.value = '' }}
              className="hidden"
              data-testid="agents-file-input"
            />

            <textarea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={`向 ${activeAgent.name} 提问... 可粘贴图片、拖拽文件`}
              rows={2}
              data-testid="agents-input"
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-white/[0.08] bg-white/[0.03] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent text-sm text-slate-200 placeholder-slate-500"
            />
            <button
              onClick={handleSend}
              disabled={(!inputValue.trim() && attachedFiles.length === 0) || isLoading}
              data-testid="agents-send"
              className="px-5 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors flex items-center gap-2 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Enter 发送 · 模型: {getModel()} · temp={currentTier.temperature}
            {attachedFiles.length > 0 && <span className="ml-2 text-sky-500">· {attachedFiles.length} 个附件</span>}
          </p>
        </div>
      </div>
    </div>
    </div>
  )
}
