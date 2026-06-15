'use client'

/**
 * WorkstationGrid — 游戏化平面办公室工位系统（灵动版）
 * 参考图效果：顶部居中标题+统计，3x3工位网格
 * 每个工位含显示器图标、卡通头像、状态圆点、名称、职位、状态标签
 * 整体风格温暖、卡通、活泼，带呼吸灯/浮动/hover抬起等灵动动画
 */
import { useState, useMemo } from 'react'
import {
  Wifi, Coffee, Loader2, CheckCircle2, AlertCircle, Clock,
  Search, Dumbbell, Zap, MessageSquare, Code
} from 'lucide-react'

export interface WorkstationMember {
  id: string
  name: string
  color: string
  state: 'idle' | 'working' | 'done' | 'error' | 'meeting'
  progress: number
  title?: string        // 职位/描述，如"主管助手"
  tags?: string[]
  prompt?: string
  emoji?: string        // 卡通头像emoji，如"🐺"
}

interface Props {
  members: WorkstationMember[]
  missionRunning: boolean
  activeTeamName?: string
  onMemberClick?: (member: WorkstationMember) => void
}

// ═══════════════════════════════════════
// 状态配置（活泼配色 + 灵动屏幕内容）
// ═══════════════════════════════════════
const STATE_CONFIG: Record<string, {
  label: string
  dotColor: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
  screenContent: React.ReactNode
}> = {
  idle: {
    label: '在线',
    dotColor: '#34D399',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-600',
    badgeBorder: 'border-emerald-200',
    screenContent: <MessageSquare size={10} className="text-emerald-400 animate-pulse" />,
  },
  working: {
    label: '忙碌',
    dotColor: '#F59E0B',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-600',
    badgeBorder: 'border-amber-200',
    screenContent: (
      <div className="flex items-center gap-0.5">
        <span className="w-1 h-1 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1 h-1 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1 h-1 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    ),
  },
  done: {
    label: '完成',
    dotColor: '#10B981',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-600',
    badgeBorder: 'border-emerald-200',
    screenContent: <CheckCircle2 size={10} className="text-emerald-400" />,
  },
  error: {
    label: '出错',
    dotColor: '#EF4444',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-500',
    badgeBorder: 'border-red-200',
    screenContent: <AlertCircle size={10} className="text-red-400 animate-pulse" />,
  },
  meeting: {
    label: '会议',
    dotColor: '#8B5CF6',
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-600',
    badgeBorder: 'border-violet-200',
    screenContent: <Wifi size={10} className="text-violet-400 animate-pulse" />,
  },
}

// 默认emoji映射（让头像更卡通）
const DEFAULT_EMOJIS = ['🐺', '🤖', '👨‍💻', '👩‍💻', '👾', '🦄', '🐱', '🦊', '🐼']
function getEmoji(member: WorkstationMember, idx: number) {
  return member.emoji || DEFAULT_EMOJIS[idx % DEFAULT_EMOJIS.length]
}

// 获取职位描述
function getTitle(member: WorkstationMember) {
  if (member.title) return member.title
  if (member.tags && member.tags.length > 0) {
    return member.tags[0] + '专员'
  }
  return '智能助手'
}

// ═══════════════════════════════════════
// 显示器图标组件（带灵动屏幕内容）
// ═══════════════════════════════════════
function MonitorIcon({ screenContent }: { screenContent: React.ReactNode }) {
  return (
    <div className="relative w-16 h-12 mx-auto mb-1 group-hover/monitor:scale-105 transition-transform duration-300">
      {/* 显示器底座 */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-slate-300 rounded-sm" />
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-2 bg-slate-300 rounded-sm" />
      {/* 显示器屏幕 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-9 bg-slate-800 rounded-md flex items-center justify-center shadow-sm border-b-2 border-slate-900 overflow-hidden">
        {/* 屏幕背景微光 */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700/30 to-transparent" />
        <div className="relative z-10 w-10 h-6 bg-slate-700/40 rounded flex items-center justify-center">
          {screenContent}
        </div>
        {/* 电源指示灯 — 闪烁 */}
        <div className="absolute bottom-0.5 right-1 w-1 h-1 rounded-full bg-emerald-400/80 animate-pulse" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// 卡通头像组件（带浮动动画 + 呼吸状态圆点）
// ═══════════════════════════════════════
function CartoonAvatar({
  emoji, color, dotColor
}: { emoji: string; color: string; dotColor: string }) {
  return (
    <div className="relative mx-auto mb-2 animate-float">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md border-2 border-white transition-transform duration-300 hover:scale-110"
        style={{ backgroundColor: color + '25' }} // 15%透明度背景，更柔和
      >
        {emoji}
      </div>
      {/* 状态圆点 — 头像右下角，带脉冲光环 */}
      <span
        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm z-10"
        style={{ backgroundColor: dotColor }}
      />
      <span
        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white animate-ping opacity-40"
        style={{ backgroundColor: dotColor }}
      />
    </div>
  )
}

// ═══════════════════════════════════════
// 主组件
// ═══════════════════════════════════════
export default function WorkstationGrid({ members, missionRunning, activeTeamName, onMemberClick }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  // 统计
  const stats = useMemo(() => {
    const online = members.filter(m => m.state === 'idle').length
    const busy = members.filter(m => m.state === 'working' || m.state === 'meeting').length
    const free = 9 - members.length
    return { online, busy, free }
  }, [members])

  // 标题文本
  const officeName = activeTeamName || 'Marvis办公室'

  // 装饰区域数据（休息区/健身区/会议室）
  const decorZones = [
    { id: 'rest', label: '休息区', icon: Coffee, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', iconBg: 'bg-amber-100' },
    { id: 'gym', label: '健身区', icon: Dumbbell, color: 'text-rose-400', bg: 'bg-rose-50', border: 'border-rose-100', iconBg: 'bg-rose-100' },
    { id: 'meet', label: '会议室', icon: Zap, color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-100', iconBg: 'bg-violet-100' },
  ]

  return (
    <div className="h-full flex flex-col bg-[#FAF8F5] relative overflow-hidden">
      {/* ═══ 顶部标题区 ═══ */}
      <div className="pt-5 pb-2 text-center shrink-0">
        <h2 className="text-lg font-bold text-slate-800 tracking-wide">
          {officeName}
        </h2>
        <div className="flex items-center justify-center gap-3 mt-1 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            在线: {stats.online}
          </span>
          <span className="w-px h-3 bg-slate-200" />
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: '300ms' }} />
            忙碌: {stats.busy}
          </span>
          <span className="w-px h-3 bg-slate-200" />
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            空闲: {stats.free}
          </span>
          {missionRunning && (
            <>
              <span className="w-px h-3 bg-slate-200" />
              <span className="flex items-center gap-1 text-blue-500">
                <Loader2 size={10} className="animate-spin" />
                调度中
              </span>
            </>
          )}
        </div>
      </div>

      {/* ═══ 办公室场景 ═══ */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="max-w-xl mx-auto">
          {/* 有团队但没成员时的引导提示 */}
          {members.length === 0 && activeTeamName && (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <Search size={28} className="text-slate-300" />
              </div>
              <div className="text-sm font-semibold text-slate-600 mb-1">
                「{activeTeamName}」还没有成员
              </div>
              <div className="text-xs text-slate-400 max-w-[240px]">
                请先创建智能体并添加到团队中，他们就会出现在这里的工作位上~
              </div>
            </div>
          )}

          {/* 3x3 工位网格 */}
          <div className={`grid grid-cols-3 gap-3 ${members.length === 0 && activeTeamName ? 'hidden' : ''}`}>
            {Array.from({ length: 9 }, (_, i) => {
              const m = members[i]
              const config = m ? STATE_CONFIG[m.state] || STATE_CONFIG.idle : null
              const isHovered = hoveredIdx === i

              // 是否是特殊装饰位置（最后三个）
              const decorIndex = i - 6
              const isDecorSlot = i >= 6 && decorIndex >= 0 && decorIndex < decorZones.length && !m

              if (isDecorSlot) {
                const zone = decorZones[decorIndex]
                const ZIcon = zone.icon
                return (
                  <div
                    key={i}
                    data-station={i}
                    className={`
                      relative rounded-2xl border transition-all duration-300 cursor-default
                      ${zone.bg} ${zone.border}
                      hover:shadow-lg hover:scale-[1.03] hover:-translate-y-1
                    `}
                    style={{ minHeight: 168 }}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-5">
                      <div className={`
                        w-10 h-10 rounded-full ${zone.iconBg} flex items-center justify-center mb-2
                        border-2 border-white shadow-sm
                        transition-transform duration-300
                        ${isHovered ? 'scale-110 rotate-6' : ''}
                      `}>
                        <ZIcon size={18} className={zone.color} />
                      </div>
                      <span className="text-xs font-medium text-slate-500">{zone.label}</span>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={i}
                  data-station={i}
                  className={`
                    relative rounded-2xl border-2 transition-all duration-300 cursor-pointer
                    ${m
                      ? `bg-white border-slate-100 hover:shadow-xl hover:scale-[1.03] hover:-translate-y-1 hover:border-slate-200 active:scale-[0.98] active:translate-y-0`
                      : 'bg-white/60 border-slate-200/60 border-dashed hover:bg-white/80 hover:shadow-md hover:scale-[1.02] hover:-translate-y-0.5'
                    }
                    ${isHovered && m ? 'ring-2 ring-offset-2 ring-blue-200' : ''}
                  `}
                  style={{ minHeight: 172 }}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => m && onMemberClick?.(m)}
                >
                  {m ? (
                    <div className="p-3 h-full flex flex-col items-center justify-between">
                      {/* 上半部分：显示器 + 头像 */}
                      <div className="flex flex-col items-center w-full group/monitor">
                        <MonitorIcon screenContent={config!.screenContent} />
                        <CartoonAvatar
                          emoji={getEmoji(m, i)}
                          color={m.color}
                          dotColor={config!.dotColor}
                        />
                        {/* 名称 */}
                        <div className="text-sm font-bold text-slate-800 text-center leading-tight tracking-tight">
                          {m.name}
                        </div>
                        {/* 职位 */}
                        <div className="text-[10px] text-slate-400 mt-0.5 text-center">
                          {getTitle(m)}
                        </div>
                      </div>

                      {/* 下半部分：状态标签 */}
                      <div className="flex flex-col items-center gap-1.5 mt-2 w-full">
                        {/* 如果正在工作，显示进度 */}
                        {m.state === 'working' && (
                          <div className="w-full px-2">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-amber-400 transition-all duration-700"
                                  style={{ width: `${m.progress}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-slate-400 tabular-nums font-medium">{m.progress}%</span>
                            </div>
                          </div>
                        )}
                        {/* 状态标签 pill */}
                        <span className={`
                          inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border shadow-sm
                          ${config!.badgeBg} ${config!.badgeText} ${config!.badgeBorder}
                        `}>
                          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: config!.dotColor }} />
                          {config!.label}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* 空工位 */
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 min-h-[140px]">
                      <div className={`
                        relative mb-2 transition-all duration-300
                        ${isHovered ? 'scale-110' : ''}
                      `}>
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm">
                          <Search size={16} className="text-slate-300" />
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">空工位</span>
                      {isHovered && (
                        <span className="text-[9px] text-slate-300 mt-0.5 animate-fade-in">点击添加Agent</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* 底部可爱提示 */}
          <div className="mt-4 text-center text-[10px] text-slate-300 flex items-center justify-center gap-1.5">
            <Coffee size={10} className="animate-bounce" style={{ animationDelay: '0ms', animationDuration: '2s' }} />
            点击工位与Agent互动 · 工作台温暖如家
            <Coffee size={10} className="animate-bounce" style={{ animationDelay: '600ms', animationDuration: '2s' }} />
          </div>
        </div>
      </div>

      {/* 全局CSS动画定义 */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
