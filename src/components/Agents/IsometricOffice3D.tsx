'use client'

import { useMemo } from 'react'

/* ═══════ 类型 ═══════ */
interface Agent3D {
  id: string; name: string; color: string; emoji?: string
  gx: number; gy: number
  state: 'idle' | 'working' | 'meeting' | 'done' | 'error'; progress: number
}
interface Props { agents: Agent3D[]; missionRunning: boolean; activeTeamName?: string }

const ROLES = [
  { label: '主控 PM', emoji: '🎯' },
  { label: '文件管家', emoji: '📁' },
  { label: '系统运维', emoji: '💻' },
  { label: '应用操作', emoji: '📱' },
  { label: '网页交互', emoji: '🌐' },
  { label: '搜索专家', emoji: '🔍' },
]

const IDLE_ACTIONS = ['sleep', 'coffee', 'gym', 'game', 'wc', 'walk'] as const
const IDLE_LABEL: Record<string, string> = { sleep: '打盹中', coffee: '喝咖啡', gym: '健身中', game: '摸鱼中', wc: '上厕所', walk: '溜达中' }

/* ═══════════════════════════════════════════════
   雪碧图逐帧动画系统 — 参考 Petdex spritesheet animation
   核心原理：多帧横向排列在 SVG 内，外层 overflow:hidden 裁切，
   用 CSS transform: translateX() + steps(N) 实现硬切逐帧动画
   ═══════════════════════════════════════════════ */

/* ── 小牛马头部部件 ── */
function BullHead({ eyeType = 'open', mouthType = 'smile' }: {
  eyeType?: 'open' | 'closed' | 'happy' | 'focus' | 'sleepy'; mouthType?: 'smile' | 'flat' | 'open' | 'sleep' | 'puff'
}) {
  return (
    <g>
      {/* 头 */}
      <ellipse cx="30" cy="16" rx="16" ry="14" fill="#ffe8cc" stroke="#e0c8a0" strokeWidth="0.6" />
      <ellipse cx="24" cy="10" rx="7" ry="5" fill="white" opacity="0.12" />
      {/* 牛角 */}
      <path d="M15,5 L19,-3 L21,8" fill="#d4b896" stroke="#a67c52" strokeWidth="0.6" strokeLinejoin="round" />
      <path d="M45,5 L41,-3 L39,8" fill="#d4b896" stroke="#a67c52" strokeWidth="0.6" strokeLinejoin="round" />
      {/* 耳朵 */}
      <ellipse cx="13" cy="10" rx="4.5" ry="3" fill="#ffd6a5" stroke="#e0c8a0" strokeWidth="0.4" transform="rotate(-15,13,10)" />
      <ellipse cx="47" cy="10" rx="4.5" ry="3" fill="#ffd6a5" stroke="#e0c8a0" strokeWidth="0.4" transform="rotate(15,47,10)" />
      {/* 眼睛 */}
      {eyeType === 'open' && <>
        <ellipse cx="23" cy="15" rx="4.5" ry="5" fill="white" stroke="#5c4033" strokeWidth="0.5" />
        <ellipse cx="37" cy="15" rx="4.5" ry="5" fill="white" stroke="#5c4033" strokeWidth="0.5" />
        <circle cx="24" cy="15" r="2.8" fill="#2d1f14" />
        <circle cx="38" cy="15" r="2.8" fill="#2d1f14" />
        <circle cx="22.5" cy="13.5" r="1" fill="white" />
        <circle cx="36.5" cy="13.5" r="1" fill="white" />
      </>}
      {eyeType === 'closed' && <>
        <path d="M19,15 Q23,17.5 27,15" fill="none" stroke="#5c4033" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M33,15 Q37,17.5 41,15" fill="none" stroke="#5c4033" strokeWidth="1.2" strokeLinecap="round" />
      </>}
      {eyeType === 'happy' && <>
        <path d="M19,16 Q23,13 27,16" fill="none" stroke="#5c4033" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M33,16 Q37,13 41,16" fill="none" stroke="#5c4033" strokeWidth="1.2" strokeLinecap="round" />
      </>}
      {eyeType === 'focus' && <>
        <ellipse cx="23" cy="15" rx="4" ry="4.5" fill="white" stroke="#5c4033" strokeWidth="0.5" />
        <ellipse cx="37" cy="15" rx="4" ry="4.5" fill="white" stroke="#5c4033" strokeWidth="0.5" />
        <circle cx="24.5" cy="15" r="2.5" fill="#2d1f14" />
        <circle cx="38.5" cy="15" r="2.5" fill="#2d1f14" />
        <line x1="19" y1="9" x2="27" y2="10" stroke="#5c4033" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="41" y1="10" x2="33" y2="9" stroke="#5c4033" strokeWidth="0.8" strokeLinecap="round" />
      </>}
      {eyeType === 'sleepy' && <>
        <ellipse cx="23" cy="16" rx="4.5" ry="3" fill="white" stroke="#5c4033" strokeWidth="0.5" />
        <ellipse cx="37" cy="16" rx="4.5" ry="3" fill="white" stroke="#5c4033" strokeWidth="0.5" />
        <circle cx="24" cy="16" r="2.2" fill="#2d1f14" />
        <circle cx="38" cy="16" r="2.2" fill="#2d1f14" />
      </>}
      {/* 嘴 */}
      {mouthType === 'smile' && <path d="M26,22 Q30,26 34,22" fill="none" stroke="#5c4033" strokeWidth="0.8" strokeLinecap="round" />}
      {mouthType === 'flat' && <line x1="27" y1="23" x2="33" y2="23" stroke="#5c4033" strokeWidth="0.8" strokeLinecap="round" />}
      {mouthType === 'open' && <ellipse cx="30" cy="23" rx="3" ry="2.5" fill="#5c4033" opacity="0.5" />}
      {mouthType === 'sleep' && <ellipse cx="30" cy="22" rx="2" ry="1.5" fill="#5c4033" opacity="0.3" />}
      {mouthType === 'puff' && <ellipse cx="32" cy="22" rx="3.5" ry="2.8" fill="#ffe8cc" stroke="#5c4033" strokeWidth="0.6" />}
      {/* 腮红 */}
      <ellipse cx="15" cy="20" rx="3.5" ry="2" fill="#ffb3b3" opacity="0.3" />
      <ellipse cx="45" cy="20" rx="3.5" ry="2" fill="#ffb3b3" opacity="0.3" />
    </g>
  )
}

/* ═══════════════════════════════════════════════
   工位角色 — 雪碧图式逐帧动画
   6帧 idle（呼吸+眨眼）+ 8帧 work（打字+摇头）
   帧横向排列，用 CSS steps() 硬切
   ═══════════════════════════════════════════════ */
function DeskBull({ agent, idx }: { agent: Agent3D; idx: number }) {
  const { state, color } = agent
  const busy = state !== 'idle'
  const idleAct = IDLE_ACTIONS[idx % 6]
  const bodyColor = color || '#2d2d3f'
  // 雪碧图参数：idle 6帧，work 8帧
  const frameCount = busy ? 8 : 6
  const frameW = 60 // 单帧宽度
  const totalW = frameW * frameCount
  const animClass = busy ? `sprite-desk-work` : `sprite-desk-idle`

  const eyeMap: Record<string, 'open' | 'closed' | 'happy' | 'focus' | 'sleepy'> = {
    sleep: 'closed', coffee: 'happy', gym: 'open', game: 'happy', wc: 'open', walk: 'open'
  }
  const mouthMap: Record<string, 'smile' | 'flat' | 'open' | 'sleep' | 'puff'> = {
    sleep: 'sleep', coffee: 'puff', gym: 'open', game: 'smile', wc: 'flat', walk: 'smile'
  }

  /* ── 绘制单帧身体 ── */
  const bodyFrame = (fy: number, armAngle: number, headDy: number, eye: 'open' | 'closed' | 'happy' | 'focus' | 'sleepy', mouth: 'smile' | 'flat' | 'open' | 'sleep' | 'puff') => (
    <g transform={`translate(0,${fy})`}>
      {/* 尾巴 */}
      <path d={`M50,44 Q${58 + armAngle * 2},${38 + armAngle} 54,30`} fill="none" stroke="#3d3027" strokeWidth="2" strokeLinecap="round" />
      {/* 身体 */}
      <ellipse cx="30" cy="44" rx="16" ry="14" fill={bodyColor} />
      <ellipse cx="24" cy="38" rx="7" ry="9" fill="white" opacity="0.08" />
      {/* 红围脖 */}
      <ellipse cx="30" cy="32" rx="14" ry="4.5" fill="#ef4444" />
      <ellipse cx="30" cy="33" rx="12" ry="2.5" fill="#dc2626" opacity="0.25" />
      <path d={`M44,32 Q${50 + armAngle},${40 + armAngle} ${47 + armAngle * 0.5},50`} stroke="#ef4444" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* 手臂 */}
      <ellipse cx={14 + armAngle * 0.3} cy={42 + armAngle * 0.5} rx="4.5" ry="7" fill={bodyColor} />
      <ellipse cx={46 - armAngle * 0.3} cy={42 + armAngle * 0.5} rx="4.5" ry="7" fill={bodyColor} />
      {/* 腿 */}
      <ellipse cx="23" cy="58" rx="4.5" ry="6" fill={bodyColor} />
      <ellipse cx="37" cy="58" rx="4.5" ry="6" fill={bodyColor} />
      {/* 头 */}
      <g transform={`translate(0,${headDy})`}><BullHead eyeType={eye} mouthType={mouth} /></g>
    </g>
  )

  return (
    <div className={animClass} style={{ width: frameW, height: 72, overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${totalW} 72`} style={{ width: totalW, height: 72 }}>
        <ellipse cx="30" cy="70" rx="14" ry="2" fill="rgba(0,0,0,0.04)" />
        {busy ? (
          <>
            {/* work 帧1-8：打字动画，手臂交替上下，头微摇 */}
            <g transform="translate(0,0)">{bodyFrame(0, 0, 2, 'focus', 'flat')}</g>
            <g transform="translate(60,0)">{bodyFrame(0, -2, 3, 'focus', 'flat')}</g>
            <g transform="translate(120,0)">{bodyFrame(0, 3, 2, 'focus', 'flat')}</g>
            <g transform="translate(180,0)">{bodyFrame(0, -1, 4, 'focus', 'flat')}</g>
            <g transform="translate(240,0)">{bodyFrame(0, 2, 2, 'focus', 'flat')}</g>
            <g transform="translate(300,0)">{bodyFrame(0, -3, 3, 'focus', 'flat')}</g>
            <g transform="translate(360,0)">{bodyFrame(0, 1, 2, 'focus', 'flat')}</g>
            <g transform="translate(420,0)">{bodyFrame(0, -2, 3, 'focus', 'flat')}</g>
          </>
        ) : (
          <>
            {/* idle 帧1-6：呼吸+眨眼循环 */}
            <g transform="translate(0,0)">{bodyFrame(0, 0, 2, eyeMap[idleAct], mouthMap[idleAct])}</g>
            <g transform="translate(60,0)">{bodyFrame(1, 0, 3, eyeMap[idleAct], mouthMap[idleAct])}</g>
            <g transform="translate(120,0)">{bodyFrame(0, 0, 2, idleAct === 'sleep' ? 'closed' : 'closed', mouthMap[idleAct])}</g>
            <g transform="translate(180,0)">{bodyFrame(-1, 0, 1, eyeMap[idleAct], mouthMap[idleAct])}</g>
            <g transform="translate(240,0)">{bodyFrame(0, 0, 2, eyeMap[idleAct], mouthMap[idleAct])}</g>
            <g transform="translate(300,0)">{bodyFrame(1, 0, 3, idleAct === 'sleep' ? 'closed' : eyeMap[idleAct], mouthMap[idleAct])}</g>
          </>
        )}
        {/* 工作中胸口光效 */}
        {busy && state === 'working' && (
          <ellipse cx="30" cy="44" rx="4" ry="3" fill="#60a5fa" opacity="0.25" className="anim-pulse" />
        )}
      </svg>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   跑步角色 — 8帧雪碧图逐帧动画
   ═══════════════════════════════════════════════ */
function RunBull({ color }: { color: string }) {
  const c = color || '#2d2d3f'
  const frameW = 40
  const frameCount = 8
  const totalW = frameW * frameCount

  const runFrame = (ox: number, lArmRot: number, rArmRot: number, lLegRot: number, rLegRot: number, headDy: number, eye: 'open' | 'focus', mouth: 'open' | 'flat') => (
    <g transform={`translate(${ox},0)`}>
      <ellipse cx="20" cy="48" rx="10" ry="1.5" fill="rgba(0,0,0,0.04)" />
      <ellipse cx="20" cy="30" rx="8" ry="10" fill={c} />
      <ellipse cx="20" cy="22" rx="7" ry="3" fill="#ef4444" />
      {/* 手臂 */}
      <ellipse cx="12" cy="28" rx="3" ry="5" fill={c} transform={`rotate(${lArmRot},12,28)`} />
      <ellipse cx="28" cy="28" rx="3" ry="5" fill={c} transform={`rotate(${rArmRot},28,28)`} />
      {/* 腿 */}
      <ellipse cx="14" cy="42" rx="3" ry="5" fill={c} transform={`rotate(${lLegRot},14,42)`} />
      <ellipse cx="26" cy="42" rx="3" ry="5" fill={c} transform={`rotate(${rLegRot},26,42)`} />
      <g transform={`translate(-10,${headDy}) scale(0.7)`}><BullHead eyeType={eye} mouthType={mouth} /></g>
    </g>
  )

  return (
    <div className="sprite-run" style={{ width: frameW, height: 50, overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${totalW} 50`} style={{ width: totalW, height: 50 }}>
        {runFrame(0, -30, 20, 20, -15, 0, 'open', 'open')}
        {runFrame(40, -20, 10, 10, -5, -2, 'focus', 'flat')}
        {runFrame(80, 20, -30, -15, 20, 0, 'open', 'open')}
        {runFrame(120, 10, -20, -5, 10, -2, 'focus', 'flat')}
        {runFrame(160, -25, 25, 25, -20, 0, 'open', 'open')}
        {runFrame(200, -15, 15, 15, -10, -1, 'focus', 'flat')}
        {runFrame(240, 25, -25, -20, 25, 0, 'open', 'open')}
        {runFrame(280, 15, -15, -10, 15, -1, 'focus', 'flat')}
        {/* 汗珠 */}
        <circle cx="32" cy="8" r="1.2" fill="#60a5fa" opacity="0.4" className="anim-sweat" />
      </svg>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   喝咖啡角色 — 6帧雪碧图逐帧动画
   ═══════════════════════════════════════════════ */
function CoffeeBull({ color }: { color: string }) {
  const c = color || '#2d2d3f'
  const frameW = 40
  const frameCount = 6
  const totalW = frameW * frameCount

  const sipFrame = (ox: number, cupY: number, headDy: number, eye: 'happy' | 'closed' | 'open', mouth: 'smile' | 'puff', rArmRot: number) => (
    <g transform={`translate(${ox},0)`}>
      <ellipse cx="20" cy="48" rx="10" ry="1.5" fill="rgba(0,0,0,0.04)" />
      <ellipse cx="20" cy="30" rx="8" ry="10" fill={c} />
      <ellipse cx="20" cy="22" rx="7" ry="3" fill="#ef4444" />
      <ellipse cx="12" cy="30" rx="3" ry="5" fill={c} />
      <ellipse cx="28" cy="28" rx="3" ry="5" fill={c} transform={`rotate(${rArmRot},28,28)`} />
      <ellipse cx="16" cy="42" rx="3" ry="5" fill={c} />
      <ellipse cx="24" cy="42" rx="3" ry="5" fill={c} />
      <g transform={`translate(-10,${headDy}) scale(0.7)`}><BullHead eyeType={eye} mouthType={mouth} /></g>
      {/* 咖啡杯 */}
      <rect x="27" y={cupY} width="7" height="7" rx="1.5" fill="white" stroke="#e2e8f0" strokeWidth="0.5" />
      <rect x="28" y={cupY + 1} width="5" height="4" rx="0.5" fill="#78350f" />
    </g>
  )

  return (
    <div className="sprite-sip" style={{ width: frameW, height: 50, overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${totalW} 50`} style={{ width: totalW, height: 50 }}>
        {sipFrame(0, 8, 0, 'happy', 'puff', -10)}
        {sipFrame(40, 9, 1, 'closed', 'smile', -15)}
        {sipFrame(80, 7, -1, 'happy', 'puff', -5)}
        {sipFrame(120, 10, 0, 'open', 'smile', 0)}
        {sipFrame(160, 8, 0, 'happy', 'puff', -10)}
        {sipFrame(200, 9, 1, 'closed', 'smile', -15)}
        {/* 蒸汽 */}
        <path d="M31,6 Q32,3 31,0" fill="none" stroke="#94a3b8" strokeWidth="0.5" opacity="0.3" className="anim-steam" />
      </svg>
    </div>
  )
}

/* ═══════ 工位角色容器 ═══════ */
function BullSprite({ agent, idx }: { agent: Agent3D; idx: number }) {
  const { state, name } = agent
  const busy = state !== 'idle'
  const idleAct = IDLE_ACTIONS[idx % 6]

  return (
    <div className="flex flex-col items-center relative" style={{ width: 60, height: 88 }}>
      <div style={{
        fontSize: 9, fontWeight: 700, color: '#334155',
        marginBottom: 0, padding: '1px 8px', borderRadius: 99,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(241,245,249,0.9))',
        border: '1px solid rgba(203,213,225,0.35)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        textAlign: 'center', maxWidth: 58, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {name.length > 5 ? name.slice(0, 5) + '…' : name}
      </div>
      <DeskBull agent={agent} idx={idx} />
      {busy && (
        <div className="absolute" style={{ top: 24, right: -4 }}>
          <div className={`rounded-full border ${
            state === 'working' ? 'bg-blue-500 border-blue-400' :
            state === 'done' ? 'bg-emerald-500 border-emerald-400' :
            state === 'error' ? 'bg-red-500 border-red-400' : 'bg-amber-500 border-amber-400'
          }`} style={{ width: 7, height: 7 }} />
        </div>
      )}
      {!busy && (
        <div className="absolute anim-float" style={{ top: -2, right: -6 }}>
          <span style={{
            fontSize: 7, fontWeight: 600, color: '#64748b',
            background: 'rgba(255,255,255,0.88)', padding: '1px 5px', borderRadius: 99,
            border: '1px solid #e2e8f0', whiteSpace: 'nowrap',
          }}>
            {IDLE_LABEL[idleAct]}
          </span>
        </div>
      )}
    </div>
  )
}

/* ═══════ 工位桌 ═══════ */
function DeskCard({ agent, idx }: { agent?: Agent3D; idx: number }) {
  const role = ROLES[idx % 6]
  const hasAgent = !!agent
  const isWorking = hasAgent && agent!.state === 'working'

  return (
    <div className="relative flex flex-col items-center" style={{ width: 130, height: 140 }}>
      <div style={{
        position: 'absolute', bottom: 32, left: 8, right: 8, height: 12,
        background: 'linear-gradient(180deg, #faf0e0, #efe0c8)',
        border: '1px solid #d4c0a0', borderRadius: 3,
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
      }} />
      <div style={{ position: 'absolute', bottom: 12, left: 18, width: 4, height: 20, background: '#c9a87c', borderRadius: 1 }} />
      <div style={{ position: 'absolute', bottom: 12, right: 18, width: 4, height: 20, background: '#c9a87c', borderRadius: 1 }} />
      <div style={{
        position: 'absolute', bottom: 44, left: '50%', transform: 'translateX(-50%)',
        width: 48, height: 28, background: '#0f172a',
        border: '1.5px solid #334155', borderRadius: 2, overflow: 'hidden',
        boxShadow: isWorking ? '0 0 8px rgba(59,130,246,0.2)' : 'none',
      }}>
        {hasAgent && agent!.state !== 'idle' ? (
          <>
            <div style={{ position: 'absolute', inset: 2, borderRadius: 1, background: 'rgba(56,189,248,0.08)' }} />
            <div style={{ position: 'absolute', top: 3, left: 3, width: 18, height: 1, borderRadius: 0.5, background: 'rgba(255,255,255,0.18)' }} />
            <div style={{ position: 'absolute', top: 6, left: 3, width: 12, height: 1, borderRadius: 0.5, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ position: 'absolute', top: 9, left: 5, width: 20, height: 1, borderRadius: 0.5, background: 'rgba(255,255,255,0.14)' }} />
            <div style={{ position: 'absolute', top: 12, left: 3, width: 10, height: 1, borderRadius: 0.5, background: 'rgba(255,255,255,0.08)' }} />
            <div className="anim-blink" style={{ position: 'absolute', top: 6, left: 17, width: 1, height: 6, background: 'rgba(255,255,255,0.5)' }} />
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 2, borderRadius: 1, background: 'rgba(30,41,59,0.4)' }} />
        )}
      </div>
      <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', width: 8, height: 5, background: '#64748b', borderRadius: 1 }} />
      <div style={{ position: 'absolute', bottom: 44, right: 14, width: 24, height: 7, background: '#94a3b8', borderRadius: 1, border: '0.5px solid #cbd5e1' }} />
      {!hasAgent && (
        <div style={{
          position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
          fontSize: 7, color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap',
          background: 'rgba(255,255,255,0.5)', padding: '1px 5px', borderRadius: 99,
        }}>
          {role.emoji} {role.label}
        </div>
      )}
      {hasAgent && (
        <div style={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)' }}>
          <BullSprite agent={agent!} idx={idx} />
        </div>
      )}
    </div>
  )
}

/* ═══════ 功能区 ═══════ */
function CoffeeStation({ idleAgents }: { idleAgents: Agent3D[] }) {
  const agent = idleAgents[0]
  return (
    <div className="relative flex flex-col items-center" style={{ width: 85, height: 75 }}>
      <div style={{ position: 'absolute', bottom: 2, left: 6, width: 22, height: 28, background: 'linear-gradient(180deg, #64748b, #475569)', borderRadius: 3, border: '1px solid #94a3b8' }}>
        <div style={{ position: 'absolute', top: 3, left: 2, right: 2, height: 2.5, background: '#e2e8f0', borderRadius: 1 }} />
        <div className="anim-pulse" style={{ position: 'absolute', top: 5, right: 3, width: 2.5, height: 2.5, borderRadius: '50%', background: '#22c55e' }} />
        <div style={{ position: 'absolute', bottom: 6, left: 3, width: 10, height: 7, background: '#1e293b', borderRadius: 1.5, border: '0.5px solid #475569' }} />
      </div>
      <div style={{ position: 'absolute', bottom: 14, right: 4, width: 10, height: 8, background: '#92400e', borderRadius: 2, border: '0.5px solid #78350f' }} />
      {agent && (
        <div style={{ position: 'absolute', bottom: 30, right: 2 }}>
          <CoffeeBull color={agent.color || '#2d2d3f'} />
        </div>
      )}
      <span style={{ fontSize: 8, color: '#78716c', fontWeight: 600, marginTop: 'auto' }}>☕ 咖啡角</span>
    </div>
  )
}

function GymStation({ idleAgents }: { idleAgents: Agent3D[] }) {
  const agent = idleAgents[0]
  return (
    <div className="relative flex flex-col items-center" style={{ width: 85, height: 75 }}>
      <div style={{ position: 'absolute', bottom: 4, left: 4, width: 44, height: 3.5, background: '#cbd5e1', borderRadius: 1 }} />
      <div style={{ position: 'absolute', bottom: 7.5, left: 8, width: 36, height: 12, background: 'linear-gradient(180deg, #475569, #334155)', borderRadius: 2, border: '1px solid #64748b' }}>
        <div style={{ position: 'absolute', top: 2, left: 3, right: 3, height: 1, background: '#1e293b', borderRadius: 0.5 }} />
        <div style={{ position: 'absolute', top: 5, left: '50%', transform: 'translateX(-50%)', width: 7, height: 3, background: '#0f172a', borderRadius: 0.5 }}>
          <div style={{ width: 2.5, height: 1.5, background: '#22c55e', borderRadius: 0.3, margin: '0.5px' }} />
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 2, left: 10, width: 32, height: 2.5, overflow: 'hidden', borderRadius: 0.5 }}>
        <div className="anim-treadmill" style={{ width: 64, height: 2.5, background: 'repeating-linear-gradient(90deg, #94a3b8 0px, #94a3b8 3px, #cbd5e1 3px, #cbd5e1 6px)' }} />
      </div>
      {agent && (
        <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)' }}>
          <RunBull color={agent.color || '#2d2d3f'} />
        </div>
      )}
      <span style={{ fontSize: 8, color: '#78716c', fontWeight: 600, marginTop: 'auto' }}>🏃 健身房</span>
    </div>
  )
}

function ToiletSign() {
  return (
    <div className="relative flex flex-col items-center" style={{ width: 44, height: 60 }}>
      <div style={{ position: 'absolute', bottom: 2, left: 2, width: 40, height: 44, background: 'linear-gradient(180deg, #f8fafc, #f1f5f9)', borderRadius: '5px 5px 0 0', border: '1px solid #e2e8f0' }}>
        <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', width: 12, height: 9, background: 'white', borderRadius: '50% 50% 2px 2px', border: '0.5px solid #e2e8f0' }} />
      </div>
      <div style={{ position: 'absolute', bottom: 22, right: 6, width: 3.5, height: 3.5, background: '#94a3b8', borderRadius: 1 }} />
      <span style={{ fontSize: 10, marginTop: 'auto' }}>🚻</span>
    </div>
  )
}

function OfficePlant({ variant = 0 }: { variant?: number }) {
  const c = [['#22c55e', '#4ade80', '#15803d'], ['#16a34a', '#22c55e', '#166534'], ['#4ade80', '#86efac', '#15803d']][variant % 3]
  return (
    <div className="relative" style={{ width: 24, height: 28 }}>
      <div style={{ position: 'absolute', bottom: 0, left: 4, width: 16, height: 8, background: 'linear-gradient(180deg, #a16207, #92400e)', borderRadius: '2px 2px 3px 3px' }} />
      <div style={{ position: 'absolute', bottom: 8, left: 2, width: 20, height: 14, background: c[0], borderRadius: '50% 50% 0 50%', opacity: 0.8 }} />
      <div style={{ position: 'absolute', bottom: 10, left: 0, width: 14, height: 10, background: c[1], borderRadius: '50% 50% 50% 0', opacity: 0.6 }} />
      <div style={{ position: 'absolute', bottom: 12, left: 8, width: 8, height: 8, background: c[2], borderRadius: '0 50% 50% 50%', opacity: 0.45 }} />
    </div>
  )
}

/* ═══════ 墙壁装饰 ═══════ */
function WallDecor() {
  return (
    <>
      <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 26, height: 26, borderRadius: '50%', background: 'white', border: '1.5px solid #d4c0a0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <svg viewBox="0 0 26 26" style={{ width: 23, height: 23, margin: 1.5 }}>
          {[0, 90, 180, 270].map(d => <line key={d} x1="13" y1="2" x2="13" y2="4" transform={`rotate(${d},13,13)`} stroke="#94a3b8" strokeWidth="0.8" />)}
          <line x1="13" y1="13" x2="13" y2="7" stroke="#334155" strokeWidth="1" strokeLinecap="round" transform="rotate(210,13,13)" />
          <line x1="13" y1="13" x2="13" y2="5" stroke="#64748b" strokeWidth="0.6" strokeLinecap="round" transform="rotate(60,13,13)" />
          <circle cx="13" cy="13" r="0.8" fill="#334155" />
        </svg>
      </div>
      <div style={{ position: 'absolute', top: 4, right: '10%', width: 56, height: 34, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '2px 3px' }}>
          <div style={{ width: '50%', height: 1.2, background: '#3b82f6', borderRadius: 1, marginBottom: 1.5 }} />
          <div style={{ width: '70%', height: 1.2, background: '#e2e8f0', borderRadius: 1, marginBottom: 1 }} />
          <div style={{ width: '40%', height: 1.2, background: '#e2e8f0', borderRadius: 1, marginBottom: 1 }} />
          <div style={{ width: '60%', height: 1.2, background: '#fbbf24', borderRadius: 1, marginBottom: 1.5 }} />
          <div style={{ width: '30%', height: 1.2, background: '#e2e8f0', borderRadius: 1, marginBottom: 1 }} />
          <div style={{ width: '50%', height: 1.2, background: '#10b981', borderRadius: 1 }} />
        </div>
      </div>
      <div style={{ position: 'absolute', top: 3, left: '6%', width: 34, height: 38, background: 'linear-gradient(180deg, #c9a87c, #b8956a)', border: '1px solid #a67c52', borderRadius: 2 }}>
        <div style={{ position: 'absolute', top: '33%', left: 1, right: 1, height: 0.8, background: '#a67c52' }} />
        <div style={{ position: 'absolute', top: '66%', left: 1, right: 1, height: 0.8, background: '#a67c52' }} />
        {[{ t: 1, l: 2, w: 4, c: '#3b82f6' }, { t: 1, l: 8, w: 3, c: '#ef4444' }, { t: 1, l: 13, w: 5, c: '#22c55e' }, { t: 1, l: 20, w: 3, c: '#f59e0b' },
          { t: 14, l: 2, w: 5, c: '#ec4899' }, { t: 14, l: 9, w: 3, c: '#06b6d4' }, { t: 14, l: 14, w: 4, c: '#84cc16' },
          { t: 26, l: 2, w: 4, c: '#f97316' }, { t: 26, l: 8, w: 5, c: '#6366f1' },
        ].map((b, i) => <div key={i} style={{ position: 'absolute', top: b.t, left: b.l, width: b.w, height: 8, background: b.c, borderRadius: 0.5 }} />)}
      </div>
      <div style={{ position: 'absolute', top: 3, left: '28%', width: 40, height: 30, background: 'linear-gradient(180deg, #bfdbfe, #93c5fd)', border: '1.5px solid #c9a87c', borderRadius: 2 }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', width: 1, height: '100%', background: '#c9a87c', transform: 'translateX(-50%)' }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: 1, background: '#c9a87c', transform: 'translateY(-50%)' }} />
        <div style={{ position: 'absolute', top: 3, left: 2, width: 8, height: 3, background: 'white', borderRadius: 99, opacity: 0.5 }} />
      </div>
    </>
  )
}

/* ═══════ 办公室主体 ═══════ */
function OfficeRoom({ agents, missionRunning }: { agents: Agent3D[]; missionRunning: boolean }) {
  const desks = useMemo(() => {
    const filled = agents.slice(0, 6)
    const remaining = 6 - filled.length
    return [
      ...filled.map((a, i) => ({ agent: a, idx: i })),
      ...Array.from({ length: remaining }, (_, i) => ({ agent: undefined as Agent3D | undefined, idx: filled.length + i })),
    ]
  }, [agents])

  const idleAgents = useMemo(() => agents.filter(a => a.state === 'idle'), [agents])
  const workingCount = agents.filter(a => a.state !== 'idle').length

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* 天花板 */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '7%', background: 'linear-gradient(180deg, #f0e8dc, #f5efe6)', borderBottom: '1.5px solid #d4c5b0' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ position: 'absolute', top: '8%', left: `${15 + i * 22}%` }}>
            <div style={{ width: 1, height: 6, background: '#b8a08a', margin: '0 auto' }} />
            <div style={{ width: 28, height: 4, background: 'linear-gradient(180deg, #faf0e0, #efe0c8)', borderRadius: '0 0 14px 14px', border: '0.5px solid #d4c0a0', boxShadow: '0 2px 6px rgba(255,220,150,0.08)' }} />
          </div>
        ))}
      </div>
      {/* 后墙 */}
      <div style={{ position: 'absolute', top: '7%', left: 0, right: 0, height: '11%', background: 'linear-gradient(180deg, #f5efe6, #faf6ef)', borderBottom: '1.5px solid #d4c5b0' }}>
        <div style={{ position: 'absolute', left: '4%', right: '4%', bottom: 3, height: 0.5, background: 'linear-gradient(90deg, transparent, #c9a87c, transparent)' }} />
        <WallDecor />
      </div>
      {/* 侧墙 */}
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '1.8%', background: 'linear-gradient(90deg, #f0e8dc, #e8ddd0)', borderRight: '0.5px solid #d4c5b0' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '1.8%', background: 'linear-gradient(270deg, #f0e8dc, #e8ddd0)', borderLeft: '0.5px solid #d4c5b0' }} />
      {/* 地板 */}
      <div style={{ position: 'absolute', top: '18%', left: 0, right: 0, bottom: 0 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #faf6ef, #f5efe6)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(90deg, rgba(201,168,124,0.05) 0px, rgba(201,168,124,0.05) 1px, transparent 1px, transparent 60px), repeating-linear-gradient(0deg, rgba(201,168,124,0.03) 0px, rgba(201,168,124,0.03) 1px, transparent 1px, transparent 160px)` }} />
        <div style={{ position: 'absolute', top: '3%', left: '6%', right: '6%', bottom: '16%', background: 'radial-gradient(ellipse at center, rgba(232,213,184,0.35) 0%, transparent 70%)', borderRadius: '40%' }} />
        <div style={{ position: 'absolute', inset: 0, padding: '0.5% 2.5% 0.5% 2.5%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', top: 0, left: 0 }}><OfficePlant variant={0} /></div>
          <div style={{ position: 'absolute', top: 0, right: 0 }}><OfficePlant variant={1} /></div>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', flex: 1, padding: '0 1.5%' }}>
            {desks.slice(0, 3).map((d, i) => <DeskCard key={i} agent={d.agent} idx={d.idx} />)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', flex: 1, padding: '0 1.5%' }}>
            {desks.slice(3, 6).map((d, i) => <DeskCard key={i + 3} agent={d.agent} idx={d.idx} />)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: '0.3%', paddingTop: '0.3%', borderTop: '1px dashed #d4c5b0' }}>
            <CoffeeStation idleAgents={idleAgents} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <div style={{ fontSize: 9, color: '#5c4033', fontWeight: 700, letterSpacing: 0.2 }}>虚拟办公室</div>
              <div style={{ fontSize: 7, color: '#94a3b8' }}>{agents.length} 位成员 · {workingCount} 工作中</div>
            </div>
            <GymStation idleAgents={idleAgents} />
            <ToiletSign />
          </div>
        </div>
      </div>
      {/* 飘浮光斑 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="anim-particle" style={{
            position: 'absolute', width: 2, height: 2, borderRadius: '50%',
            background: i % 2 === 0 ? '#fbbf24' : '#c9a87c', opacity: 0.06,
            left: `${12 + i * 14}%`, top: `${22 + (i % 3) * 18}%`,
            animationDelay: `${i * 1}s`,
          }} />
        ))}
      </div>
    </div>
  )
}

/* ═══════ 导出 ═══════ */
export default function IsometricOffice3D({ agents, missionRunning, activeTeamName }: Props) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl"
      style={{ background: 'linear-gradient(180deg, #f5efe6 0%, #e8ddd0 20%, #faf6ef 100%)' }}>
      <OfficeRoom agents={agents} missionRunning={missionRunning} />

      {/* HUD */}
      <div style={{ position: 'absolute', bottom: 6, left: 12, right: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {activeTeamName && (
            <span style={{ fontSize: 10, fontWeight: 600, color: '#5c4033', background: 'rgba(255,255,255,0.75)', padding: '2px 10px', borderRadius: 99, border: '1px solid rgba(201,168,124,0.25)' }}>
              {activeTeamName}
            </span>
          )}
          {missionRunning && (
            <span style={{ fontSize: 10, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 3, color: '#4f46e5', background: 'rgba(238,242,255,0.8)', padding: '2px 10px', borderRadius: 99, border: '1px solid rgba(165,180,252,0.25)' }}>
              <span style={{ position: 'relative', display: 'flex', width: 5, height: 5 }}>
                <span className="animate-ping" style={{ position: 'absolute', width: 5, height: 5, borderRadius: '50%', background: '#818cf8', opacity: 0.4 }} />
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#6366f1' }} />
              </span>
              调度中
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {[{ c: '#3b82f6', l: '工作中' }, { c: '#10b981', l: '已完成' }, { c: '#94a3b8', l: '待命' }, { c: '#ef4444', l: '出错' }].map((x, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 8, color: '#64748b', fontWeight: 500 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: x.c }} />{x.l}
            </div>
          ))}
        </div>
      </div>

      {/* ═══ 雪碧图逐帧动画 CSS ═══ */}
      <style jsx>{`
        /*
         * 核心原理（参考 Petdex spritesheet animation）：
         * 每个角色 SVG 内多帧横向排列，外层 overflow:hidden 裁切只显示一帧
         * 用 CSS animation + steps(N) 硬切 translateX() 实现逐帧播放
         * steps() 保证帧间无过渡，实现像素风硬切效果
         */

        /* ── 工位 idle：6帧，2fps 慢速呼吸 ── */
        .sprite-desk-idle {
          animation: spriteDeskIdle 3s steps(6) infinite;
        }
        @keyframes spriteDeskIdle {
          from { transform: translateX(0); }
          to { transform: translateX(-360px); } /* 6帧 × 60px */
        }

        /* ── 工位 work：8帧，8fps 快速打字 ── */
        .sprite-desk-work {
          animation: spriteDeskWork 1s steps(8) infinite;
        }
        @keyframes spriteDeskWork {
          from { transform: translateX(0); }
          to { transform: translateX(-480px); } /* 8帧 × 60px */
        }

        /* ── 跑步：8帧，10fps ── */
        .sprite-run {
          animation: spriteRun 0.8s steps(8) infinite;
        }
        @keyframes spriteRun {
          from { transform: translateX(0); }
          to { transform: translateX(-320px); } /* 8帧 × 40px */
        }

        /* ── 喝咖啡：6帧，3fps ── */
        .sprite-sip {
          animation: spriteSip 2s steps(6) infinite;
        }
        @keyframes spriteSip {
          from { transform: translateX(0); }
          to { transform: translateX(-240px); } /* 6帧 × 40px */
        }

        /* 通用辅助动画 */
        @keyframes blink { 0%,100%{opacity:0} 50%{opacity:1} }
        .anim-blink { animation: blink 1s step-end infinite; }

        @keyframes pulse2 { 0%,100%{opacity:0.25} 50%{opacity:0.5} }
        .anim-pulse { animation: pulse2 1.5s ease-in-out infinite; }

        @keyframes particle { 0%,100%{transform:translateY(0);opacity:0.06} 50%{transform:translateY(-12px);opacity:0.12} }
        .anim-particle { animation: particle 5s ease-in-out infinite; }

        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        .anim-float { animation: float 2.5s ease-in-out infinite; }

        @keyframes sweat { 0%{opacity:0;transform:translateY(-1px)} 50%{opacity:0.5} 100%{opacity:0;transform:translateY(3px)} }
        .anim-sweat { animation: sweat 0.8s ease-in-out infinite; }

        @keyframes steam { 0%,100%{opacity:0.25;transform:translateY(0)} 50%{opacity:0.08;transform:translateY(-2px)} }
        .anim-steam { animation: steam 2s ease-in-out infinite; }

        @keyframes treadmill { 0%{transform:translateX(0)} 100%{transform:translateX(-32px)} }
        .anim-treadmill { animation: treadmill 0.3s linear infinite; }
      `}</style>
    </div>
  )
}
