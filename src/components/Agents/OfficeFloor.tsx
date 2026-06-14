'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Users, Plus, Trash2, X, Brain, Play,
  Bot, Send, Loader2, Clock, FileText, Zap,
  PanelLeftOpen, PanelRightOpen,
  Sparkles, CheckCircle2, Clock4, AlertCircle, TrendingUp,
  BarChart3, History, ArrowRight, Search, Settings, UserPlus,
  Code2, Shield, Bug, Palette, GanttChart, Workflow, TestTube, Cpu
} from 'lucide-react'
import { api } from '@/lib/api'
import IsometricOffice3D from './IsometricOffice3D'

// ═══════════════════════ 类型定义 ═══════════════════════

const EMPLOYEES_KEY = 'office_employees'
const TEAMS_KEY = 'office_teams'
const MISSIONS_KEY = 'office_missions'

interface Employee {
  id: string
  name: string
  emoji: string
  tags: string[]
  prompt: string
  color: string
  fromAgent: boolean
}

interface Expert {
  id: string
  name: string
  emoji: string
  color: string
  prompt: string
  tags: string[]
}

interface Team {
  id: string
  name: string
  brainModel: string
  members: Expert[]
  createdAt: number
}

interface SubTask {
  id: string
  title: string
  assigneeId: string
  assigneeName: string
  status: 'pending' | 'running' | 'done' | 'error'
  progress: number
  result: string
  error: string
  prompt: string
}

interface Mission {
  id: string
  title: string
  teamId: string
  teamName: string
  status: 'draft' | 'planning' | 'executing' | 'done' | 'error'
  subtasks: SubTask[]
  report: string
  error: string
  createdAt: number
  updatedAt: number
}

const EMPLOYEE_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#F97316', '#6366F1', '#14B8A6']

function randomColor() { return EMPLOYEE_COLORS[Math.floor(Math.random() * EMPLOYEE_COLORS.length)] }

// 按领域获取图标
function getDomainIcon(color: string, tags: string[]) {
  const tagLower = tags.join(',').toLowerCase()
  if (tagLower.includes('安全') || tagLower.includes('security')) return { Icon: Shield, bg: '#fee2e2', fg: '#ef4444' }
  if (tagLower.includes('代码') || tagLower.includes('编程') || tagLower.includes('python')) return { Icon: Code2, bg: '#dbeafe', fg: '#3b82f6' }
  if (tagLower.includes('审查') || tagLower.includes('review')) return { Icon: Bug, bg: '#fce7f3', fg: '#ec4899' }
  if (tagLower.includes('设计') || tagLower.includes('前端')) return { Icon: Palette, bg: '#ede9fe', fg: '#8b5cf6' }
  if (tagLower.includes('测试') || tagLower.includes('qa')) return { Icon: TestTube, bg: '#fef3c7', fg: '#f59e0b' }
  return { Icon: Cpu, bg: '#ccfbf1', fg: '#14b8a6' }
}

// ═══════════════════════ 主组件 ═══════════════════════

export default function OfficeFloor() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [missions, setMissions] = useState<Mission[]>([])
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null)
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null)
  const [taskInput, setTaskInput] = useState('')
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [tabMode, setTabMode] = useState<'overview' | 'agents' | 'teams'>('overview')
  const [showCreateEmployee, setShowCreateEmployee] = useState(false)
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [newEmp, setNewEmp] = useState({ name: '', emoji: '🤖', tags: '', prompt: '', color: randomColor() })

  const activeTeam = activeTeamId ? teams.find(t => t.id === activeTeamId) || null : null
  const activeMission = activeMissionId ? missions.find(m => m.id === activeMissionId) || null : null
  const isRunning = activeMission?.status === 'executing' || activeMission?.status === 'planning'

  // 加载/初始化数据
  useEffect(() => {
    try {
      let loadedEmployees = JSON.parse(localStorage.getItem(EMPLOYEES_KEY) || '[]')
      let loadedTeams = JSON.parse(localStorage.getItem(TEAMS_KEY) || '[]')
      let loadedMissions = JSON.parse(localStorage.getItem(MISSIONS_KEY) || '[]')

      if (loadedTeams.length === 0 && loadedEmployees.length === 0) {
        const demoEmployees: Employee[] = [
          { id: 'demo_python', name: 'Python审查师', emoji: '🔍', tags: ['Python', '安全', '代码审查'], prompt: 'Python代码安全审查专家', color: '#3B82F6', fromAgent: false },
          { id: 'demo_security', name: '安全工程师', emoji: '🛡️', tags: ['安全', '渗透测试', '审计'], prompt: '网络安全与漏洞分析专家', color: '#EF4444', fromAgent: false },
          { id: 'demo_arch', name: '架构设计师', emoji: '🏛️', tags: ['架构', '系统设计', '微服务'], prompt: '系统架构与设计模式专家', color: '#8B5CF6', fromAgent: false },
          { id: 'demo_ui', name: '前端设计师', emoji: '🎨', tags: ['设计', 'UI', 'UX', '前端'], prompt: 'UI设计与前端实现专家', color: '#F59E0B', fromAgent: false },
        ]
        const demoTeam: Team = {
          id: 'team_demo', name: '代码安全审查团',
          brainModel: 'deepseek-chat',
          members: demoEmployees.map(e => ({ id: e.id, name: e.name, emoji: e.emoji, color: e.color, prompt: e.prompt, tags: e.tags })),
          createdAt: Date.now()
        }
        const demoMission: Mission = {
          id: 'msn_demo', title: '审查用户登录模块安全性', teamId: 'team_demo', teamName: '代码安全审查团',
          status: 'done', subtasks: [
            { id: 'st_1', title: 'SQL注入检测', assigneeId: 'demo_python', assigneeName: 'Python审查师', status: 'done', progress: 100, result: '检测通过，使用参数化查询', error: '', prompt: '检查SQL注入风险' },
            { id: 'st_2', title: 'XSS漏洞扫描', assigneeId: 'demo_security', assigneeName: '安全工程师', status: 'done', progress: 100, result: '发现1处反射型XSS，已建议修复', error: '', prompt: '扫描XSS漏洞' },
            { id: 'st_3', title: '权限校验审查', assigneeId: 'demo_arch', assigneeName: '架构设计师', status: 'done', progress: 100, result: '权限模型设计合理', error: '', prompt: '审查权限校验逻辑' },
          ], report: '### 审查用户登录模块安全性\n\n### 🔍 Python审查师 — SQL注入检测\n\n检测通过，使用参数化查询\n\n---\n\n### 🛡️ 安全工程师 — XSS漏洞扫描\n\n发现1处反射型XSS，已建议修复\n\n---\n\n### 🏛️ 架构设计师 — 权限校验审查\n\n权限模型设计合理', error: '', createdAt: Date.now() - 3600000, updatedAt: Date.now() - 3600000
        }
        loadedEmployees = demoEmployees
        loadedTeams = [demoTeam]
        loadedMissions = [demoMission]
        localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(demoEmployees))
        localStorage.setItem(TEAMS_KEY, JSON.stringify([demoTeam]))
        localStorage.setItem(MISSIONS_KEY, JSON.stringify([demoMission]))
      }
      setEmployees(loadedEmployees)
      setTeams(loadedTeams)
      setMissions(loadedMissions)
      if (loadedTeams.length > 0 && !activeTeamId) setActiveTeamId(loadedTeams[0].id)
    } catch (_) { }
  }, [])

  // 持久化
  useEffect(() => { if (employees.length > 0) localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees)) }, [employees])
  useEffect(() => { if (teams.length > 0) localStorage.setItem(TEAMS_KEY, JSON.stringify(teams)) }, [teams])
  useEffect(() => { if (missions.length > 0) localStorage.setItem(MISSIONS_KEY, JSON.stringify(missions)) }, [missions])

  // 智能体操作
  const addEmployee = () => {
    if (!newEmp.name.trim()) return
    const emp: Employee = { id: 'emp_' + Date.now(), name: newEmp.name.trim(), emoji: newEmp.emoji || '🤖', tags: newEmp.tags.split(',').map(t => t.trim()).filter(Boolean), prompt: newEmp.prompt.trim(), color: newEmp.color, fromAgent: false }
    setEmployees(prev => [...prev, emp])
    setNewEmp({ name: '', emoji: '🤖', tags: '', prompt: '', color: randomColor() })
    setShowCreateEmployee(false)
  }
  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id))
    setTeams(prev => prev.map(t => ({ ...t, members: t.members.filter(m => m.id !== id) })))
  }

  // 团队操作
  const addTeam = (name: string) => {
    if (!name?.trim()) return
    const team: Team = { id: 'team_' + Date.now(), name: name.trim(), brainModel: 'deepseek-chat', members: [], createdAt: Date.now() }
    setTeams(prev => [team, ...prev])
    setActiveTeamId(team.id)
    setShowCreateTeam(false)
    setTabMode('teams')
  }
  const deleteTeam = (id: string) => {
    setTeams(prev => prev.filter(t => t.id !== id))
    if (activeTeamId === id) setActiveTeamId(null)
    if (activeMission?.teamId === id) setActiveMissionId(null)
  }
  const addMemberToTeam = (teamId: string, emp: Employee) => {
    setTeams(prev => prev.map(t => {
      if (t.id !== teamId || t.members.length >= 5) return t
      if (t.members.find(m => m.id === emp.id)) return t
      return { ...t, members: [...t.members, { id: emp.id, name: emp.name, emoji: emp.emoji, color: emp.color, prompt: emp.prompt, tags: emp.tags }] }
    }))
  }
  const removeMemberFromTeam = (teamId: string, memberId: string) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, members: t.members.filter(m => m.id !== memberId) } : t))
  }

  // 大脑调度
  const runMission = async () => {
    if (!taskInput.trim() || isRunning) return
    const title = taskInput.trim()
    let team = activeTeam
    if (!team && employees.length > 0) {
      const autoTeamName = title.length > 12 ? title.slice(0, 12) + '...' : title
      const newTeam: Team = { id: 'team_' + Date.now(), name: autoTeamName, brainModel: 'deepseek-chat', members: employees.slice(0, 5).map(e => ({ id: e.id, name: e.name, emoji: e.emoji, color: e.color, prompt: e.prompt, tags: e.tags })), createdAt: Date.now() }
      setTeams(prev => [newTeam, ...prev])
      setActiveTeamId(newTeam.id)
      setTabMode('teams')
      setTaskInput('')
      return
    }
    if (!team || team.members.length === 0) return
    const mission: Mission = { id: 'msn_' + Date.now(), title, teamId: team.id, teamName: team.name, status: 'planning', subtasks: [], report: '', error: '', createdAt: Date.now(), updatedAt: Date.now() }
    setMissions(prev => [mission, ...prev])
    setActiveMissionId(mission.id)
    setTaskInput('')
    await executeMission(mission, team)
  }

  const confirmAndRun = async () => {
    if (!activeTeam || activeTeam.members.length === 0 || isRunning) return
    const title = activeTeam.name
    const mission: Mission = { id: 'msn_' + Date.now(), title, teamId: activeTeam.id, teamName: activeTeam.name, status: 'planning', subtasks: [], report: '', error: '', createdAt: Date.now(), updatedAt: Date.now() }
    setMissions(prev => [mission, ...prev])
    setActiveMissionId(mission.id)
    setTaskInput('')
    await executeMission(mission, activeTeam)
  }

  const executeMission = async (mission: Mission, team: Team) => {
    setMissions(prev => prev.map(m => m.id === mission.id ? { ...m, status: 'planning' } : m))
    try {
      const planPrompt = `你是任务调度大脑。请将以下任务拆解为子任务，分配给团队成员。输出纯JSON数组，每个元素：{"title":"子任务名","assigneeId":"成员ID","prompt":"具体的执行指令"}\n\n任务：${mission.title}\n团队成员：${team.members.map(m => `ID:${m.id} 名称:${m.name} 标签:${m.tags.join('/')||'通用'} 提示词:${m.prompt}`).join('\n')}\n\n输出格式：直接输出 JSON 数组，不要 md 代码块。`
      const res = await api.models.chat(team.brainModel || 'deepseek-chat', [{ role: 'user', content: planPrompt }], { temperature: 0.3 })
      let planText = ''
      if (res.choices?.[0]?.message?.content) planText = res.choices[0].message.content
      else if (typeof res === 'string') planText = res
      else if ((res as any)?.response) planText = (res as any).response
      const jsonMatch = planText.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('大脑未能生成有效的任务计划')
      const plan: { title: string; assigneeId: string; prompt: string }[] = JSON.parse(jsonMatch[0])
      if (!Array.isArray(plan) || plan.length === 0) throw new Error('任务计划为空')
      const subtasks: SubTask[] = plan.map(p => ({ id: 'st_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), title: p.title, assigneeId: p.assigneeId, assigneeName: team.members.find(m => m.id === p.assigneeId)?.name || '未知', status: 'pending' as const, progress: 0, result: '', error: '', prompt: p.prompt }))
      setMissions(prev => prev.map(m => m.id === mission.id ? { ...m, subtasks, status: 'executing' } : m))
      mission.subtasks = subtasks; mission.status = 'executing'
      let collected: string[] = []
      for (let i = 0; i < subtasks.length; i++) {
        const st = subtasks[i]; const member = team.members.find(m => m.id === st.assigneeId); if (!member) continue
        setMissions(prev => prev.map(m => m.id === mission.id ? { ...m, subtasks: m.subtasks.map(s => s.id === st.id ? { ...s, status: 'running' as const } : s) } : m))
        try {
          const execRes = await api.models.chat(team.brainModel || 'deepseek-chat', [{ role: 'system', content: `你是${member.name}。${member.prompt}` }, { role: 'user', content: st.prompt }], { temperature: 0.5 })
          let result = ''
          if (execRes.choices?.[0]?.message?.content) result = execRes.choices[0].message.content
          else if (typeof execRes === 'string') result = execRes
          st.result = result; st.status = 'done'; st.progress = 100
          collected.push(`### ${member.emoji} ${member.name} — ${st.title}\n\n${result}`)
        } catch (e: any) { st.status = 'error'; st.error = e?.message || '执行出错'; collected.push(`### ${member.emoji} ${member.name} — ${st.title}\n\n错误: ${st.error}`) }
        setMissions(prev => prev.map(m => m.id === mission.id ? { ...m, subtasks: [...m.subtasks] } : m))
      }
      setMissions(prev => prev.map(m => m.id === mission.id ? { ...m, status: 'done', report: `# ${mission.title}\n\n` + collected.join('\n\n---\n\n'), updatedAt: Date.now() } : m))
    } catch (e: any) { setMissions(prev => prev.map(m => m.id === mission.id ? { ...m, status: 'error', error: e?.message || '执行出错' } : m)) }
  }

  // 统计
  const todayTokens = missions.reduce((sum, m) => sum + (m.report ? m.report.length : 0) * 3, 0)
  const completedMissions = missions.filter(m => m.status === 'done').length
  const allMissions = missions.length

  const statusConfig: Record<string, { label: string; cls: string }> = {
    done: { label: '已完成', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    executing: { label: '执行中', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    planning: { label: '规划中', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    error: { label: '失败', cls: 'bg-red-50 text-red-700 border-red-200' },
    draft: { label: '草稿', cls: 'bg-gray-50 text-gray-600 border-gray-200' },
  }

  // 3D 场景 Agent 数据（等距坐标位置映射 6x6 网格）
  const deskSpots3D = [
    { gx: 1, gy: 1 }, { gx: 3, gy: 1 }, { gx: 5, gy: 1 },
    { gx: 0, gy: 3 }, { gx: 2, gy: 3 }, { gx: 4, gy: 3 },
    { gx: 1, gy: 5 }, { gx: 3, gy: 5 }, { gx: 5, gy: 5 },
  ]

  const agents3D = useMemo(() => {
    if (!activeTeam) return []
    return activeTeam.members.map((m, i) => {
      const st = activeMission?.subtasks?.find(s => s.assigneeId === m.id)
      const spot = deskSpots3D[i % deskSpots3D.length]
      return {
        id: m.id,
        name: m.name,
        color: m.color,
        emoji: (m as any).emoji || '🤖',
        gx: spot.gx,
        gy: spot.gy,
        targetGx: spot.gx,
        targetGy: spot.gy,
        state: (st?.status === 'running' ? 'working' :
          st?.status === 'done' ? 'done' :
          st?.status === 'error' ? 'error' : 'idle') as Agent3DState,
        progress: st?.progress || 0,
      }
    })
  }, [activeTeam, activeMission])

  type Agent3DState = 'idle' | 'working' | 'meeting' | 'done' | 'error'

  // ═══════════════════════ 渲染 ═══════════════════════
  return (
    <div className="flex h-full bg-[#F8FAFC] text-slate-700 overflow-hidden font-sans">
      {/* ═══ 左侧边栏 ═══ */}
      <div className={`shrink-0 transition-all duration-300 ${showLeftPanel ? 'w-60' : 'w-0'} overflow-hidden`}>
        <div className="h-full flex flex-col bg-white border-r border-slate-200">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#1E40AF] flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <span className="font-bold text-sm text-slate-800 tracking-tight">翼站智脑</span>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="w-full bg-slate-50 text-xs rounded-lg pl-8 pr-3 py-2 outline-none border border-slate-200 focus:border-[#1E40AF]/30 transition-colors placeholder:text-slate-400 text-slate-600" placeholder="搜索智能体或团队..." />
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {[
              { id: 'overview', label: '工作间总览', icon: GanttChart, dot: 'bg-[#1E40AF]' },
              { id: 'agents', label: '智能体管理', icon: Users, dot: 'bg-violet-500' },
              { id: 'teams', label: '专家团管理', icon: Brain, dot: 'bg-amber-500' },
            ].map(item => (
              <button key={item.id} onClick={() => setTabMode(item.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${tabMode === item.id ? 'bg-slate-50 text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'}`}>
                <span className={`w-1 h-4 rounded-full ${item.dot} transition-opacity ${tabMode === item.id ? 'opacity-100' : 'opacity-0'}`} />
                <item.icon size={16} strokeWidth={1.8} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mx-4 my-2 h-px bg-slate-100" />

          <div className="px-4 space-y-1">
            <button onClick={() => { setShowCreateTeam(true); setTabMode('teams') }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
              <Sparkles size={15} strokeWidth={1.5} /> 新建任务
            </button>
            <button onClick={() => { setShowCreateEmployee(true); setTabMode('agents') }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
              <UserPlus size={15} strokeWidth={1.5} /> 创建智能体
            </button>
            <button onClick={() => setShowCreateTeam(true)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
              <Brain size={15} strokeWidth={1.5} /> 组建专家团
            </button>
          </div>

          <div className="mt-auto p-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>工作间在线</span>
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-slate-400 cursor-pointer hover:text-slate-600">
              <Settings size={13} /> 系统设置
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 主内容区 ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部标签栏 */}
        <div className="h-11 flex items-center gap-2 px-4 border-b border-slate-200 bg-white/50 shrink-0">
          <button onClick={() => setShowLeftPanel(!showLeftPanel)} className={`p-1.5 rounded-md transition-colors ${showLeftPanel ? 'text-slate-400 hover:text-slate-600' : 'text-[#1E40AF]'}`}>
            <PanelLeftOpen size={15} />
          </button>
          {teams.map(team => (
            <button key={team.id} onClick={() => setActiveTeamId(team.id)}
              className={`px-3 py-1 rounded-md text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${activeTeamId === team.id ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-white/70 border border-transparent'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${activeTeamId === team.id ? 'bg-[#1E40AF]' : 'bg-slate-300'}`} />
              {team.name} <span className="text-slate-400 ml-0.5">{team.members.length}人</span>
            </button>
          ))}
          <button onClick={() => setShowCreateTeam(true)} className="text-xs text-slate-400 hover:text-[#1E40AF] transition-colors ml-1">+ 新建</button>
          {isRunning && <div className="ml-auto flex items-center gap-1.5 bg-white rounded-full px-3 py-1 shadow-sm border border-slate-200 text-xs text-blue-600"><Loader2 size={12} className="animate-spin" /> 调度中...</div>}
        </div>

        {/* CSS 3D 等距工作间总览 */}
        {tabMode === 'overview' && (
          <div className="h-[calc(100vh-180px)] border-b border-slate-200 shrink-0">
            <IsometricOffice3D
              agents={agents3D}
              missionRunning={isRunning}
              activeTeamName={activeTeam?.name}
            />
          </div>
        )}

        {/* 智能体管理 */}
        {tabMode === 'agents' && (
          <div className="shrink-0 border-b border-slate-200 bg-white/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">智能体 ({employees.length})</span>
              <button onClick={() => setShowCreateEmployee(true)} className="text-xs text-[#1E40AF] hover:text-blue-700 font-medium">+ 新建</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {employees.map(emp => {
                const { Icon, bg, fg } = getDomainIcon(emp.color, emp.tags)
                return (
                  <div key={emp.id}
                    className="group flex items-center gap-3 p-2.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => activeTeam && addMemberToTeam(activeTeam.id, emp)}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                      <Icon size={15} style={{ color: fg }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-700 truncate">{emp.name}</div>
                      <div className="flex gap-1 mt-0.5">
                        {emp.tags.slice(0, 2).map(t => <span key={t} className="text-[10px] text-slate-400">#{t}</span>)}
                      </div>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: emp.color }} />
                    <Plus size={12} className="text-slate-300 group-hover:text-[#1E40AF] transition-colors" />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 专家团编辑 */}
        {tabMode === 'teams' && activeTeam && (
          <div className="shrink-0 border-b border-slate-200 bg-white/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{activeTeam.name}</span>
                <span className="text-xs text-slate-400">{activeTeam.members.length}/5人</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => deleteTeam(activeTeam.id)} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"><Trash2 size={11} /> 解散</button>
                {activeTeam.members.length > 0 && (
                  <button onClick={confirmAndRun} disabled={isRunning}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[#1E40AF] hover:bg-blue-700 text-white transition-colors disabled:opacity-40 flex items-center gap-1.5 shadow-sm">
                    {isRunning ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />} 启动
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeTeam.members.map(m => {
                const { Icon, bg, fg } = getDomainIcon(m.color, m.tags)
                return (
                  <div key={m.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs">
                    <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                      <Icon size={10} style={{ color: fg }} />
                    </div>
                    <span className="text-slate-600">{m.name.length > 5 ? m.name.slice(0,4)+'..' : m.name}</span>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                    <button onClick={() => removeMemberFromTeam(activeTeam.id, m.id)} className="text-slate-400 hover:text-red-400"><X size={10} /></button>
                  </div>
                )
              })}
              {activeTeam.members.length < 5 && (
                <button onClick={() => setTabMode('agents')} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-slate-300 text-xs text-slate-400 hover:text-[#1E40AF] hover:border-blue-300 transition-all">
                  <Plus size={10} /> 添加成员
                </button>
              )}
            </div>
          </div>
        )}

        {/* ═══ 中央工作区 - 卡片式团队仪表盘 ═══ */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 活跃工作间 */}
          {activeTeam && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Workflow size={16} className="text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-700">当前工作间 · {activeTeam.name}</h2>
                {isRunning && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 font-medium">运行中</span>}
              </div>

              {/* 成员卡片 */}
              <div className="grid grid-cols-2 gap-3">
                {activeTeam.members.map(m => {
                  const { Icon, bg, fg } = getDomainIcon(m.color, m.tags)
                  const st = activeMission?.subtasks.find(s => s.assigneeId === m.id)
                  const isWorking = st?.status === 'running'
                  const isDone = st?.status === 'done'
                  return (
                    <div key={m.id} className={`p-4 rounded-xl border transition-all ${isWorking ? 'bg-blue-50/50 border-blue-200 shadow-sm' : isDone ? 'bg-emerald-50/30 border-emerald-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors`} style={{ backgroundColor: isWorking ? '#dbeafe' : bg }}>
                            <Icon size={18} style={{ color: fg }} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-700">{m.name}</div>
                            <div className="flex gap-1 mt-0.5">
                              {m.tags.slice(0, 3).map(t => <span key={t} className="text-[10px] text-slate-400">#{t}</span>)}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                          {st && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${st.status === 'done' ? 'bg-emerald-100 text-emerald-700' : st.status === 'running' ? 'bg-blue-100 text-blue-700 animate-pulse' : st.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                              {st.status === 'done' ? '完成' : st.status === 'running' ? '执行' : st.status === 'error' ? '失败' : '待命'}
                            </span>
                          )}
                        </div>
                      </div>
                      {st && (st.status === 'running' || st.status === 'done') && (
                        <div>
                          <div className="text-[11px] text-slate-500 truncate mb-1.5">{st.title}</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 rounded-full bg-slate-200">
                              <div className={`h-full rounded-full transition-all duration-700 ${st.status === 'done' ? 'bg-emerald-400' : 'bg-[#1E40AF]'}`} style={{ width: `${st.progress}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-400 tabular-nums">{st.progress}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 任务输入栏 */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex -space-x-1">
              {activeTeam?.members.slice(0, 4).map(m => {
                const { Icon, bg, fg } = getDomainIcon(m.color, m.tags)
                return (
                  <div key={m.id} className="w-6 h-6 rounded-full ring-2 ring-white flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                    <Icon size={10} style={{ color: fg }} />
                  </div>
                )
              })}
            </div>
            <input value={taskInput} onChange={e => setTaskInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && runMission()}
              placeholder={employees.length > 0 ? '输入任务描述，AI 大脑自动分配...' : '请先在智能体管理中创建智能体'}
              disabled={isRunning || employees.length === 0}
              className="flex-1 bg-transparent text-sm outline-none text-slate-600 placeholder:text-slate-400 disabled:opacity-40" />
            <button onClick={runMission} disabled={!taskInput.trim() || isRunning || employees.length === 0}
              className="px-4 py-2 bg-[#1E40AF] hover:bg-blue-700 text-white text-xs rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm font-medium">
              {isRunning ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              {isRunning ? '执行中' : '发送'}
            </button>
          </div>

          {/* 子任务进度列表 */}
          {activeMission && activeMission.subtasks.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">子任务进度</h3>
              {activeMission.subtasks.map(st => (
                <div key={st.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-slate-200/80">
                  {st.status === 'done' ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    : st.status === 'running' ? <Loader2 size={14} className="text-blue-500 animate-spin shrink-0" />
                    : st.status === 'error' ? <AlertCircle size={14} className="text-red-500 shrink-0" />
                    : <Clock4 size={14} className="text-slate-300 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-700 truncate">{st.title}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">{st.assigneeName}</span>
                    </div>
                    <div className="flex-1 h-1 rounded-full bg-slate-100 mt-1.5">
                      <div className={`h-full rounded-full transition-all duration-500 ${st.status === 'done' ? 'bg-emerald-400' : st.status === 'running' ? 'bg-[#1E40AF]' : 'bg-slate-300'}`} style={{ width: `${st.progress}%` }} />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 tabular-nums w-8 text-right">{st.progress}%</span>
                </div>
              ))}
            </div>
          )}

          {/* 空态 */}
          {employees.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users size={40} className="text-slate-300 mb-4" />
              <h3 className="text-sm font-medium text-slate-600 mb-1">暂无智能体</h3>
              <p className="text-xs text-slate-400 mb-4">创建一个智能体来开始组建团队</p>
              <button onClick={() => setShowCreateEmployee(true)} className="px-4 py-2 bg-[#1E40AF] text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">创建智能体</button>
            </div>
          )}

          {/* 无活跃团队 */}
          {employees.length > 0 && !activeTeam && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Brain size={36} className="text-slate-300 mb-3" />
              <h3 className="text-sm font-medium text-slate-600 mb-1">选择或创建专家团</h3>
              <p className="text-xs text-slate-400 mb-4">在顶部标签栏选择一个工作间，或组建新团队</p>
              <button onClick={() => setShowCreateTeam(true)} className="px-4 py-2 border border-[#1E40AF] text-[#1E40AF] text-xs rounded-lg hover:bg-blue-50 transition-colors">组建专家团</button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ 右侧数据面板 ═══ */}
      <div className={`shrink-0 transition-all duration-300 ${showRightPanel ? 'w-72' : 'w-0'} overflow-hidden`}>
        <div className="h-full flex flex-col bg-white border-l border-slate-200">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="font-semibold text-sm text-slate-700">数据面板</span>
            <button onClick={() => setShowRightPanel(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={14} /></button>
          </div>

          <div className="p-4 space-y-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2"><Zap size={13} className="text-amber-500" /> 今日 Token 消耗</div>
              <div className="text-xl font-bold text-slate-800 tracking-tight">{(todayTokens / 1000).toFixed(1)}k</div>
              <div className="text-[10px] text-slate-400 mt-1">估算值，基于字符数</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2"><TrendingUp size={13} className="text-emerald-500" /> Token 节省量</div>
              <div className="text-xl font-bold text-slate-800 tracking-tight">{(todayTokens * 0.3 / 1000).toFixed(1)}k</div>
              <div className="text-[10px] text-slate-400 mt-1">约节省 30%</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2"><BarChart3 size={13} className="text-slate-500" /> 任务统计</div>
              <div className="flex gap-4 text-xs">
                <div><span className="text-slate-800 font-bold">{completedMissions}</span><span className="text-slate-400 ml-1">完成</span></div>
                <div><span className="text-slate-600 font-bold">{allMissions - completedMissions}</span><span className="text-slate-400 ml-1">进行</span></div>
                <div><span className="text-slate-600 font-bold">{allMissions}</span><span className="text-slate-400 ml-1">总计</span></div>
              </div>
            </div>
          </div>

          <div className="px-4 pb-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3"><History size={12} /> 历史任务</div>
          </div>
          <div className="flex-1 overflow-y-auto px-4">
            {missions.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-8">暂无历史任务</div>
            ) : (
              <div className="space-y-1.5 pb-4">
                {missions.map(m => {
                  const sc = statusConfig[m.status] || statusConfig.draft
                  return (
                    <button key={m.id} onClick={() => setActiveMissionId(m.id)}
                      className={`w-full text-left p-2.5 rounded-lg transition-all border ${activeMissionId === m.id ? 'bg-slate-50 border-slate-200' : 'bg-transparent border-transparent hover:bg-slate-50'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-medium text-slate-700 truncate">{m.title}</div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${sc.cls} shrink-0`}>{sc.label}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">{new Date(m.createdAt).toLocaleString('zh-CN', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {activeMission && (
            <div className="border-t border-slate-100 p-4 max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">任务产出</span>
                <button onClick={() => setActiveMissionId(null)} className="text-slate-400 hover:text-slate-600"><X size={12} /></button>
              </div>
              {activeMission.status === 'done' ? (
                <div className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: activeMission.report.replace(/\n/g, '<br/>').replace(/### (.*)/g, '<strong class="text-blue-700">$1</strong>').replace(/```(\w+)?\n?([\s\S]*?)```/g, '<pre class="bg-slate-100 p-2 rounded text-[10px] overflow-x-auto mt-1 mb-1">$2</pre>') }} />
              ) : activeMission.status === 'error' ? (
                <div className="text-xs text-red-500">{activeMission.error || '未知错误'}</div>
              ) : activeMission.status === 'executing' ? (
                <div className="space-y-2">
                  {activeMission.subtasks.map(st => (
                    <div key={st.id} className="bg-slate-50 rounded-lg p-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600">{st.assigneeName}</span>
                        <span className={st.status === 'done' ? 'text-emerald-500' : st.status === 'running' ? 'text-blue-500' : st.status === 'error' ? 'text-red-500' : 'text-slate-400'}>
                          {st.status === 'done' ? '✓' : st.status === 'running' ? '...' : st.status === 'error' ? '✗' : '⌛'}
                        </span>
                      </div>
                      <div className="w-full h-1 rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#1E40AF] transition-all" style={{ width: `${st.progress}%` }} /></div>
                    </div>
                  ))}
                </div>
              ) : (<div className="text-xs text-slate-400 text-center py-4">等待规划...</div>)}
            </div>
          )}
        </div>
      </div>

      {/* ═══ 创建智能体弹窗 ═══ */}
      {showCreateEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowCreateEmployee(false)}>
          <div className="bg-white rounded-2xl p-6 w-[400px] shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <span className="font-semibold text-base text-slate-800">创建智能体</span>
              <button onClick={() => setShowCreateEmployee(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1.5 font-medium">名称</label>
                <input value={newEmp.name} onChange={e => setNewEmp(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-slate-50 text-sm rounded-lg px-3 py-2.5 outline-none border border-slate-200 focus:border-[#1E40AF]/40 transition-colors text-slate-700" placeholder="例如：代码审查师" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1.5 font-medium">Emoji 标识</label>
                <input value={newEmp.emoji} onChange={e => setNewEmp(p => ({ ...p, emoji: e.target.value }))}
                  className="w-full bg-slate-50 text-sm rounded-lg px-3 py-2.5 outline-none border border-slate-200 focus:border-[#1E40AF]/40 transition-colors text-slate-700" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1.5 font-medium">专业领域标签 (逗号分隔)</label>
                <input value={newEmp.tags} onChange={e => setNewEmp(p => ({ ...p, tags: e.target.value }))}
                  className="w-full bg-slate-50 text-sm rounded-lg px-3 py-2.5 outline-none border border-slate-200 focus:border-[#1E40AF]/40 transition-colors text-slate-700" placeholder="安全, Python, 代码审查" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1.5 font-medium">系统提示词</label>
                <textarea value={newEmp.prompt} onChange={e => setNewEmp(p => ({ ...p, prompt: e.target.value }))}
                  className="w-full bg-slate-50 text-sm rounded-lg px-3 py-2.5 outline-none border border-slate-200 focus:border-[#1E40AF]/40 transition-colors text-slate-700 h-20 resize-none" placeholder="定义智能体的专业能力和行为方式..." />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 font-medium">标识色</label>
                <div className="flex gap-1.5">
                  {EMPLOYEE_COLORS.map(c => (
                    <button key={c} onClick={() => setNewEmp(p => ({ ...p, color: c }))}
                      className={`w-5 h-5 rounded-full transition-all ring-offset-2 ${newEmp.color === c ? 'ring-2 ring-slate-400 scale-110' : 'hover:scale-105'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowCreateEmployee(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 rounded-lg transition-colors">取消</button>
              <button onClick={addEmployee} disabled={!newEmp.name.trim()}
                className="px-4 py-2 bg-[#1E40AF] hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-sm">创建</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 组建专家团弹窗 ═══ */}
      {showCreateTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowCreateTeam(false)}>
          <div className="bg-white rounded-2xl p-6 w-[400px] shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <span className="font-semibold text-base text-slate-800">组建专家团</span>
              <button onClick={() => setShowCreateTeam(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <input id="team-name-input"
              className="w-full bg-slate-50 text-sm rounded-lg px-3 py-2.5 outline-none border border-slate-200 focus:border-[#1E40AF]/40 transition-colors text-slate-700 mb-4"
              placeholder="输入专家团名称..." autoFocus
              onKeyDown={e => e.key === 'Enter' && addTeam((document.getElementById('team-name-input') as HTMLInputElement)?.value)} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreateTeam(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 rounded-lg transition-colors">取消</button>
              <button onClick={() => addTeam((document.getElementById('team-name-input') as HTMLInputElement)?.value)}
                className="px-4 py-2 bg-[#1E40AF] hover:bg-blue-700 text-white text-sm rounded-lg transition-colors shadow-sm">创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
