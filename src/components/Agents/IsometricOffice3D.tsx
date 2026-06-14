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
   全新角色设计 — 精致 Q 版卡通小人
   设计理念：
   - 大头圆身，Q 版比例（头占 40%）
   - 简洁线条，不画牛角/尾巴（小尺寸下太杂乱）
   - 大圆眼 + 高光 + 腮红 = 可爱感
   - 红围脖保留为品牌标识
   - 每帧有明显动作差异，动画更生动
   ═══════════════════════════════════════════════ */

/* ── 头部组件（80x80 viewBox 内） ── */
function CuteHead({ eye, mouth, blush = true }: {
  eye: 'open' | 'closed' | 'happy' | 'focus' | 'sleepy' | 'wink'
  mouth: 'smile' | 'flat' | 'o' | 'sleep' | 'grin'
  blush?: boolean
}) {
  return (
    <g>
      {/* 头发/头顶 */}
      <ellipse cx="40" cy="22" rx="24" ry="22" fill="#3d3027" />
      {/* 脸 */}
      <ellipse cx="40" cy="26" rx="21" ry="19" fill="#ffe0bd" />
      {/* 刘海 */}
      <path d="M18,18 Q25,8 40,10 Q55,8 62,18 Q58,14 50,16 Q42,12 34,14 Q26,12 22,16 Z" fill="#3d3027" />
      {/* 眼睛 */}
      {eye === 'open' && <>
        <ellipse cx="32" cy="26" rx="5" ry="5.5" fill="white" />
        <ellipse cx="48" cy="26" rx="5" ry="5.5" fill="white" />
        <circle cx="33" cy="26" r="3.2" fill="#1a1a2e" />
        <circle cx="49" cy="26" r="3.2" fill="#1a1a2e" />
        <circle cx="31" cy="24" r="1.3" fill="white" />
        <circle cx="47" cy="24" r="1.3" fill="white" />
      </>}
      {eye === 'closed' && <>
        <path d="M27,26 Q32,30 37,26" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" />
        <path d="M43,26 Q48,30 53,26" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" />
      </>}
      {eye === 'happy' && <>
        <path d="M27,27 Q32,23 37,27" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" />
        <path d="M43,27 Q48,23 53,27" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" />
      </>}
      {eye === 'focus' && <>
        <ellipse cx="32" cy="26" rx="4.5" ry="5" fill="white" />
        <ellipse cx="48" cy="26" rx="4.5" ry="5" fill="white" />
        <circle cx="33.5" cy="26" r="3" fill="#1a1a2e" />
        <circle cx="49.5" cy="26" r="3" fill="#1a1a2e" />
        <circle cx="32" cy="24" r="1.1" fill="white" />
        <circle cx="48" cy="24" r="1.1" fill="white" />
        {/* 专注眉毛 */}
        <line x1="26" y1="19" x2="37" y2="20.5" stroke="#3d3027" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="54" y1="20.5" x2="43" y2="19" stroke="#3d3027" strokeWidth="1.8" strokeLinecap="round" />
      </>}
      {eye === 'sleepy' && <>
        <ellipse cx="32" cy="27" rx="5" ry="3" fill="white" />
        <ellipse cx="48" cy="27" rx="5" ry="3" fill="white" />
        <circle cx="33" cy="27" r="2.2" fill="#1a1a2e" />
        <circle cx="49" cy="27" r="2.2" fill="#1a1a2e" />
        {/* 半闭眼皮 */}
        <path d="M27,24 Q32,22 37,24" fill="#ffe0bd" stroke="#3d3027" strokeWidth="0.8" />
        <path d="M43,24 Q48,22 53,24" fill="#ffe0bd" stroke="#3d3027" strokeWidth="0.8" />
      </>}
      {eye === 'wink' && <>
        <ellipse cx="32" cy="26" rx="5" ry="5.5" fill="white" />
        <circle cx="33" cy="26" r="3.2" fill="#1a1a2e" />
        <circle cx="31" cy="24" r="1.3" fill="white" />
        <path d="M43,26 Q48,23 53,26" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" />
      </>}
      {/* 嘴 */}
      {mouth === 'smile' && <path d="M35,34 Q40,39 45,34" fill="none" stroke="#c0392b" strokeWidth="1.5" strokeLinecap="round" />}
      {mouth === 'flat' && <line x1="36" y1="35" x2="44" y2="35" stroke="#c0392b" strokeWidth="1.5" strokeLinecap="round" />}
      {mouth === 'o' && <ellipse cx="40" cy="35" rx="3" ry="3.5" fill="#c0392b" opacity="0.6" />}
      {mouth === 'sleep' && <ellipse cx="40" cy="34" rx="2.5" ry="2" fill="#c0392b" opacity="0.3" />}
      {mouth === 'grin' && <path d="M34,33 Q40,40 46,33" fill="#c0392b" opacity="0.5" stroke="#c0392b" strokeWidth="0.8" />}
      {/* 腮红 */}
      {blush && <>
        <ellipse cx="24" cy="32" rx="4" ry="2.5" fill="#ffb3b3" opacity="0.35" />
        <ellipse cx="56" cy="32" rx="4" ry="2.5" fill="#ffb3b3" opacity="0.35" />
      </>}
    </g>
  )
}

/* ═══════════════════════════════════════════════
   工位角色 — 精致 Q 版逐帧动画
   idle: 8帧（呼吸+眨眼+小动作）
   work: 8帧（打字+专注）
   viewBox: 80x100 每帧
   ═══════════════════════════════════════════════ */
function DeskCharacter({ agent, idx }: { agent: Agent3D; idx: number }) {
  const { state, color } = agent
  const busy = state !== 'idle'
  const idleAct = IDLE_ACTIONS[idx % 6]
  const bodyColor = color || '#4a5568'
  const frameCount = 8
  const frameW = 80
  const totalW = frameW * frameCount
  const animClass = busy ? 'sprite-desk-work' : 'sprite-desk-idle'

  const eyeMap: Record<string, 'open' | 'closed' | 'happy' | 'focus' | 'sleepy' | 'wink'> = {
    sleep: 'closed', coffee: 'happy', gym: 'open', game: 'wink', wc: 'open', walk: 'open'
  }
  const mouthMap: Record<string, 'smile' | 'flat' | 'o' | 'sleep' | 'grin'> = {
    sleep: 'sleep', coffee: 'grin', gym: 'o', game: 'smile', wc: 'flat', walk: 'smile'
  }

  /* 绘制单帧：参数化身体偏移/手臂/头偏/表情 */
  const frame = (ox: number, bodyY: number, lArmDy: number, rArmDy: number, headDy: number, eye: 'open' | 'closed' | 'happy' | 'focus' | 'sleepy' | 'wink', mouth: 'smile' | 'flat' | 'o' | 'sleep' | 'grin') => (
    <g transform={`translate(${ox},0)`}>
      {/* 阴影 */}
      <ellipse cx="40" cy="96" rx="18" ry="3" fill="rgba(0,0,0,0.06)" />
      {/* 身体组 */}
      <g transform={`translate(0,${bodyY})`}>
        {/* 身体 */}
        <rect x="26" y="52" width="28" height="28" rx="10" fill={bodyColor} />
        {/* 衣服高光 */}
        <rect x="28" y="54" width="10" height="12" rx="4" fill="white" opacity="0.08" />
        {/* 红围脖 */}
        <rect x="24" y="50" width="32" height="8" rx="4" fill="#ef4444" />
        <rect x="24" y="52" width="32" height="4" rx="2" fill="#dc2626" opacity="0.3" />
        {/* 围脖飘带 */}
        <path d={`M52,54 Q58,${58 + lArmDy} 54,${64 + lArmDy * 0.5}`} stroke="#ef4444" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* 左臂 */}
        <rect x="16" y={54 + lArmDy} width="12" height="8" rx="4" fill={bodyColor} />
        {/* 右臂 */}
        <rect x="52" y={54 + rArmDy} width="12" height="8" rx="4" fill={bodyColor} />
        {/* 手（肤色小圆） */}
        <circle cx="16" cy={58 + lArmDy} r="3.5" fill="#ffe0bd" />
        <circle cx="64" cy={58 + rArmDy} r="3.5" fill="#ffe0bd" />
        {/* 腿 */}
        <rect x="28" y="78" width="9" height="12" rx="4" fill={bodyColor} />
        <rect x="43" y="78" width="9" height="12" rx="4" fill={bodyColor} />
        {/* 鞋 */}
        <ellipse cx="32" cy="91" rx="6" ry="3.5" fill="#2d2d3f" />
        <ellipse cx="48" cy="91" rx="6" ry="3.5" fill="#2d2d3f" />
        {/* 头 */}
        <g transform={`translate(0,${headDy})`}>
          <CuteHead eye={eye} mouth={mouth} />
        </g>
      </g>
    </g>
  )

  return (
    <div className={animClass} style={{ width: frameW, height: 100, overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${totalW} 100`} style={{ width: totalW, height: 100 }}>
        {busy ? (
          /* work 8帧：打字动作，手臂上下交替，头微偏 */
          <>
            {frame(0, 0, 0, 0, 0, 'focus', 'flat')}
            {frame(80, 0, 4, -2, 1, 'focus', 'flat')}
            {frame(160, 0, -2, 4, -1, 'focus', 'flat')}
            {frame(240, 0, 3, -1, 0, 'focus', 'flat')}
            {frame(320, 0, -1, 3, 1, 'focus', 'flat')}
            {frame(400, 0, 4, -2, -1, 'focus', 'flat')}
            {frame(480, 0, -2, 4, 0, 'focus', 'flat')}
            {frame(560, 0, 2, -1, 1, 'focus', 'flat')}
          </>
        ) : (
          /* idle 8帧：呼吸+眨眼+微动 */
          <>
            {frame(0, 0, 0, 0, 0, eyeMap[idleAct], mouthMap[idleAct])}
            {frame(80, 1, 0, 0, 1, eyeMap[idleAct], mouthMap[idleAct])}
            {frame(160, 0, 0, 0, 0, 'closed', mouthMap[idleAct])}
            {frame(240, -1, 0, 0, -1, eyeMap[idleAct], mouthMap[idleAct])}
            {frame(320, 0, 0, 0, 0, eyeMap[idleAct], mouthMap[idleAct])}
            {frame(400, 1, 0, 0, 1, eyeMap[idleAct], mouthMap[idleAct])}
            {frame(480, 0, 0, 0, 0, 'closed', mouthMap[idleAct])}
            {frame(560, -1, 0, 0, -1, eyeMap[idleAct], mouthMap[idleAct])}
          </>
        )}
      </svg>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   跑步角色 — 8帧逐帧动画
   viewBox: 50x60 每帧
   ═══════════════════════════════════════════════ */
function RunCharacter({ color }: { color: string }) {
  const c = color || '#4a5568'
  const frameW = 50
  const frameCount = 8
  const totalW = frameW * frameCount

  const runFrame = (ox: number, lLeg: number, rLeg: number, lArm: number, rArm: number, bodyY: number, headDy: number) => (
    <g transform={`translate(${ox},0)`}>
      <ellipse cx="25" cy="57" rx="12" ry="2" fill="rgba(0,0,0,0.05)" />
      <g transform={`translate(0,${bodyY})`}>
        {/* 身体 */}
        <rect x="15" y="28" width="20" height="18" rx="7" fill={c} />
        {/* 红围脖 */}
        <rect x="13" y="26" width="24" height="6" rx="3" fill="#ef4444" />
        {/* 左臂 */}
        <rect x="6" y={30 + lArm} width="10" height="6" rx="3" fill={c} />
        <circle cx="6" cy={33 + lArm} r="3" fill="#ffe0bd" />
        {/* 右臂 */}
        <rect x="34" y={30 + rArm} width="10" height="6" rx="3" fill={c} />
        <circle cx="44" cy={33 + rArm} r="3" fill="#ffe0bd" />
        {/* 左腿 */}
        <rect x="16" y={44 + lLeg} width="7" height="10" rx="3" fill={c} />
        <ellipse cx="19" cy={55 + lLeg} rx="4.5" ry="2.5" fill="#2d2d3f" />
        {/* 右腿 */}
        <rect x="27" y={44 + rLeg} width="7" height="10" rx="3" fill={c} />
        <ellipse cx="31" cy={55 + rLeg} rx="4.5" ry="2.5" fill="#2d2d3f" />
        {/* 头 */}
        <g transform={`translate(-15,${headDy}) scale(0.6)`}>
          <CuteHead eye="focus" mouth="o" blush={false} />
        </g>
      </g>
      {/* 汗珠 */}
      <circle cx="38" cy="8" r="1.5" fill="#60a5fa" opacity="0.4" className="anim-sweat" />
    </g>
  )

  /* 跑步8帧：腿交替前后，手臂反向摆动，身体上下弹跳 */
  const poses = [
    { lL: 0, rL: -6, lA: -4, rA: 4, bY: 0, hD: 0 },
    { lL: -3, rL: -3, lA: -2, rA: 2, bY: -2, hD: -1 },
    { lL: -6, rL: 0, lA: 4, rA: -4, bY: 0, hD: 0 },
    { lL: -3, rL: -3, lA: 2, rA: -2, bY: -1, hD: 0 },
    { lL: 0, rL: -6, lA: -4, rA: 4, bY: 0, hD: 0 },
    { lL: -3, rL: -3, lA: -2, rA: 2, bY: -2, hD: -1 },
    { lL: -6, rL: 0, lA: 4, rA: -4, bY: 0, hD: 0 },
    { lL: -3, rL: -3, lA: 2, rA: -2, bY: -1, hD: 0 },
  ]

  return (
    <div className="sprite-run" style={{ width: frameW, height: 60, overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${totalW} 60`} style={{ width: totalW, height: 60 }}>
        {poses.map((p, i) => runFrame(i * frameW, p.lL, p.rL, p.lA, p.rA, p.bY, p.hD))}
      </svg>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   喝咖啡角色 — 6帧逐帧动画
   viewBox: 50x60 每帧
   ═══════════════════════════════════════════════ */
function CoffeeCharacter({ color }: { color: string }) {
  const c = color || '#4a5568'
  const frameW = 50
  const frameCount = 6
  const totalW = frameW * frameCount

  const sipFrame = (ox: number, cupY: number, headDy: number, eye: 'happy' | 'closed' | 'open' | 'wink', mouth: 'smile' | 'grin', bodyY: number) => (
    <g transform={`translate(${ox},0)`}>
      <ellipse cx="25" cy="57" rx="12" ry="2" fill="rgba(0,0,0,0.05)" />
      <g transform={`translate(0,${bodyY})`}>
        <rect x="15" y="28" width="20" height="18" rx="7" fill={c} />
        <rect x="13" y="26" width="24" height="6" rx="3" fill="#ef4444" />
        {/* 左臂（放下） */}
        <rect x="6" y="30" width="10" height="6" rx="3" fill={c} />
        <circle cx="6" cy="33" r="3" fill="#ffe0bd" />
        {/* 右臂（举杯） */}
        <rect x="34" y={cupY} width="10" height="6" rx="3" fill={c} />
        <circle cx="44" cy={cupY + 3} r="3" fill="#ffe0bd" />
        {/* 咖啡杯 */}
        <rect x="40" y={cupY - 4} width="8" height="8" rx="2" fill="white" stroke="#e2e8f0" strokeWidth="0.8" />
        <rect x="41" y={cupY - 3} width="6" height="5" rx="1" fill="#78350f" />
        {/* 蒸汽 */}
        <path d={`M44,${cupY - 6} Q45,${cupY - 9} 44,${cupY - 12}`} fill="none" stroke="#94a3b8" strokeWidth="0.6" opacity="0.3" className="anim-steam" />
        {/* 腿 */}
        <rect x="16" y="44" width="7" height="10" rx="3" fill={c} />
        <rect x="27" y="44" width="7" height="10" rx="3" fill={c} />
        <ellipse cx="19" cy="55" rx="4.5" ry="2.5" fill="#2d2d3f" />
        <ellipse cx="31" cy="55" rx="4.5" ry="2.5" fill="#2d2d3f" />
        {/* 头 */}
        <g transform={`translate(-15,${headDy}) scale(0.6)`}>
          <CuteHead eye={eye} mouth={mouth} blush={true} />
        </g>
      </g>
    </g>
  )

  return (
    <div className="sprite-sip" style={{ width: frameW, height: 60, overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${totalW} 60`} style={{ width: totalW, height: 60 }}>
        {sipFrame(0, 22, 0, 'happy', 'grin', 0)}
        {sipFrame(50, 18, -2, 'closed', 'grin', -1)}
        {sipFrame(100, 20, 0, 'happy', 'smile', 0)}
        {sipFrame(150, 24, 1, 'wink', 'smile', 1)}
        {sipFrame(200, 20, -1, 'happy', 'grin', 0)}
        {sipFrame(250, 18, -2, 'closed', 'grin', -1)}
      </svg>
    </div>
  )
}

/* ═══════ 工位角色容器 ═══════ */
function CharacterSprite({ agent, idx }: { agent: Agent3D; idx: number }) {
  const { state, name } = agent
  const busy = state !== 'idle'
  const idleAct = IDLE_ACTIONS[idx % 6]

  return (
    <div className="flex flex-col items-center relative" style={{ width: 80, height: 116 }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: '#334155',
        marginBottom: 0, padding: '2px 10px', borderRadius: 99,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(241,245,249,0.9))',
        border: '1px solid rgba(203,213,225,0.35)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        textAlign: 'center', maxWidth: 76, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {name.length > 6 ? name.slice(0, 6) + '…' : name}
      </div>
      <DeskCharacter agent={agent} idx={idx} />
      {busy && (
        <div className="absolute" style={{ top: 28, right: -2 }}>
          <div className={`rounded-full border-2 ${
            state === 'working' ? 'bg-blue-500 border-blue-400' :
            state === 'done' ? 'bg-emerald-500 border-emerald-400' :
            state === 'error' ? 'bg-red-500 border-red-400' : 'bg-amber-500 border-amber-400'
          }`} style={{ width: 9, height: 9 }} />
        </div>
      )}
      {!busy && (
        <div className="absolute anim-float" style={{ top: -2, right: -8 }}>
          <span style={{
            fontSize: 8, fontWeight: 600, color: '#64748b',
            background: 'rgba(255,255,255,0.88)', padding: '2px 6px', borderRadius: 99,
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
    <div className="relative flex flex-col items-center" style={{ width: 150, height: 170 }}>
      {/* 桌面 */}
      <div style={{
        position: 'absolute', bottom: 36, left: 8, right: 8, height: 14,
        background: 'linear-gradient(180deg, #faf0e0, #efe0c8)',
        border: '1px solid #d4c0a0', borderRadius: 3,
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
      }} />
      {/* 桌腿 */}
      <div style={{ position: 'absolute', bottom: 14, left: 20, width: 5, height: 22, background: '#c9a87c', borderRadius: 1 }} />
      <div style={{ position: 'absolute', bottom: 14, right: 20, width: 5, height: 22, background: '#c9a87c', borderRadius: 1 }} />
      {/* 显示器 */}
      <div style={{
        position: 'absolute', bottom: 50, left: '50%', transform: 'translateX(-50%)',
        width: 56, height: 34, background: '#0f172a',
        border: '1.5px solid #334155', borderRadius: 2, overflow: 'hidden',
        boxShadow: isWorking ? '0 0 12px rgba(59,130,246,0.25)' : 'none',
      }}>
        {hasAgent && agent!.state !== 'idle' ? (
          <>
            <div style={{ position: 'absolute', inset: 2, borderRadius: 1, background: 'rgba(56,189,248,0.08)' }} />
            <div style={{ position: 'absolute', top: 4, left: 4, width: 22, height: 1.5, borderRadius: 1, background: 'rgba(255,255,255,0.2)' }} />
            <div style={{ position: 'absolute', top: 7, left: 4, width: 15, height: 1.5, borderRadius: 1, background: 'rgba(255,255,255,0.12)' }} />
            <div style={{ position: 'absolute', top: 10, left: 6, width: 24, height: 1.5, borderRadius: 1, background: 'rgba(255,255,255,0.16)' }} />
            <div style={{ position: 'absolute', top: 13, left: 4, width: 12, height: 1.5, borderRadius: 1, background: 'rgba(255,255,255,0.1)' }} />
            <div className="anim-blink" style={{ position: 'absolute', top: 7, left: 20, width: 1.5, height: 7, background: 'rgba(255,255,255,0.5)' }} />
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 2, borderRadius: 1, background: 'rgba(30,41,59,0.4)' }} />
        )}
      </div>
      {/* 显示器支架 */}
      <div style={{ position: 'absolute', bottom: 46, left: '50%', transform: 'translateX(-50%)', width: 10, height: 6, background: '#64748b', borderRadius: 1 }} />
      {/* 键盘 */}
      <div style={{ position: 'absolute', bottom: 50, right: 14, width: 28, height: 9, background: '#94a3b8', borderRadius: 1, border: '0.5px solid #cbd5e1' }} />
      {/* 空位标签 */}
      {!hasAgent && (
        <div style={{
          position: 'absolute', bottom: 70, left: '50%', transform: 'translateX(-50%)',
          fontSize: 8, color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap',
          background: 'rgba(255,255,255,0.5)', padding: '2px 6px', borderRadius: 99,
        }}>
          {role.emoji} {role.label}
        </div>
      )}
      {/* 角色 */}
      {hasAgent && (
        <div style={{ position: 'absolute', bottom: 88, left: '50%', transform: 'translateX(-50%)' }}>
          <CharacterSprite agent={agent!} idx={idx} />
        </div>
      )}
    </div>
  )
}

/* ═══════ 功能区 ═══════ */
function CoffeeStation({ idleAgents }: { idleAgents: Agent3D[] }) {
  const agent = idleAgents[0]
  return (
    <div className="relative flex flex-col items-center" style={{ width: 100, height: 85 }}>
      {/* 咖啡机 */}
      <div style={{ position: 'absolute', bottom: 2, left: 8, width: 26, height: 32, background: 'linear-gradient(180deg, #64748b, #475569)', borderRadius: 3, border: '1px solid #94a3b8' }}>
        <div style={{ position: 'absolute', top: 3, left: 2, right: 2, height: 3, background: '#e2e8f0', borderRadius: 1 }} />
        <div className="anim-pulse" style={{ position: 'absolute', top: 5, right: 4, width: 3, height: 3, borderRadius: '50%', background: '#22c55e' }} />
        <div style={{ position: 'absolute', bottom: 7, left: 4, width: 12, height: 8, background: '#1e293b', borderRadius: 1.5, border: '0.5px solid #475569' }} />
      </div>
      {/* 杯子 */}
      <div style={{ position: 'absolute', bottom: 16, right: 6, width: 12, height: 10, background: '#92400e', borderRadius: 2, border: '0.5px solid #78350f' }} />
      {agent && (
        <div style={{ position: 'absolute', bottom: 34, right: 0 }}>
          <CoffeeCharacter color={agent.color || '#4a5568'} />
        </div>
      )}
      <span style={{ fontSize: 9, color: '#78716c', fontWeight: 600, marginTop: 'auto' }}>☕ 咖啡角</span>
    </div>
  )
}

function GymStation({ idleAgents }: { idleAgents: Agent3D[] }) {
  const agent = idleAgents[0]
  return (
    <div className="relative flex flex-col items-center" style={{ width: 100, height: 85 }}>
      {/* 跑步机 */}
      <div style={{ position: 'absolute', bottom: 4, left: 6, width: 52, height: 4, background: '#cbd5e1', borderRadius: 1 }} />
      <div style={{ position: 'absolute', bottom: 8, left: 10, width: 44, height: 14, background: 'linear-gradient(180deg, #475569, #334155)', borderRadius: 2, border: '1px solid #64748b' }}>
        <div style={{ position: 'absolute', top: 2, left: 4, right: 4, height: 1.2, background: '#1e293b', borderRadius: 0.5 }} />
        <div style={{ position: 'absolute', top: 5, left: '50%', transform: 'translateX(-50%)', width: 8, height: 4, background: '#0f172a', borderRadius: 0.5 }}>
          <div style={{ width: 3, height: 2, background: '#22c55e', borderRadius: 0.3, margin: '0.5px' }} />
        </div>
      </div>
      {/* 跑步带 */}
      <div style={{ position: 'absolute', bottom: 2, left: 12, width: 38, height: 3, overflow: 'hidden', borderRadius: 0.5 }}>
        <div className="anim-treadmill" style={{ width: 76, height: 3, background: 'repeating-linear-gradient(90deg, #94a3b8 0px, #94a3b8 3px, #cbd5e1 3px, #cbd5e1 6px)' }} />
      </div>
      {agent && (
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)' }}>
          <RunCharacter color={agent.color || '#4a5568'} />
        </div>
      )}
      <span style={{ fontSize: 9, color: '#78716c', fontWeight: 600, marginTop: 'auto' }}>🏃 健身房</span>
    </div>
  )
}

function ToiletSign() {
  return (
    <div className="relative flex flex-col items-center" style={{ width: 50, height: 65 }}>
      <div style={{ position: 'absolute', bottom: 2, left: 4, width: 42, height: 48, background: 'linear-gradient(180deg, #f8fafc, #f1f5f9)', borderRadius: '5px 5px 0 0', border: '1px solid #e2e8f0' }}>
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 14, height: 10, background: 'white', borderRadius: '50% 50% 2px 2px', border: '0.5px solid #e2e8f0' }} />
      </div>
      <div style={{ position: 'absolute', bottom: 24, right: 8, width: 4, height: 4, background: '#94a3b8', borderRadius: 1 }} />
      <span style={{ fontSize: 11, marginTop: 'auto' }}>🚻</span>
    </div>
  )
}

function OfficePlant({ variant = 0 }: { variant?: number }) {
  const c = [['#22c55e', '#4ade80', '#15803d'], ['#16a34a', '#22c55e', '#166534'], ['#4ade80', '#86efac', '#15803d']][variant % 3]
  return (
    <div className="relative" style={{ width: 28, height: 32 }}>
      <div style={{ position: 'absolute', bottom: 0, left: 5, width: 18, height: 9, background: 'linear-gradient(180deg, #a16207, #92400e)', borderRadius: '2px 2px 3px 3px' }} />
      <div style={{ position: 'absolute', bottom: 9, left: 2, width: 24, height: 16, background: c[0], borderRadius: '50% 50% 0 50%', opacity: 0.8 }} />
      <div style={{ position: 'absolute', bottom: 11, left: 0, width: 16, height: 12, background: c[1], borderRadius: '50% 50% 50% 0', opacity: 0.6 }} />
      <div style={{ position: 'absolute', bottom: 14, left: 9, width: 10, height: 10, background: c[2], borderRadius: '0 50% 50% 50%', opacity: 0.45 }} />
    </div>
  )
}

/* ═══════ 墙壁装饰 ═══════ */
function WallDecor() {
  return (
    <>
      {/* 时钟 */}
      <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 30, height: 30, borderRadius: '50%', background: 'white', border: '1.5px solid #d4c0a0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <svg viewBox="0 0 30 30" style={{ width: 27, height: 27, margin: 1.5 }}>
          {[0, 90, 180, 270].map(d => <line key={d} x1="15" y1="2" x2="15" y2="5" transform={`rotate(${d},15,15)`} stroke="#94a3b8" strokeWidth="1" />)}
          <line x1="15" y1="15" x2="15" y2="8" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" transform="rotate(210,15,15)" />
          <line x1="15" y1="15" x2="15" y2="6" stroke="#64748b" strokeWidth="0.8" strokeLinecap="round" transform="rotate(60,15,15)" />
          <circle cx="15" cy="15" r="1" fill="#334155" />
        </svg>
      </div>
      {/* 仪表盘 */}
      <div style={{ position: 'absolute', top: 4, right: '10%', width: 64, height: 38, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '3px 4px' }}>
          <div style={{ width: '50%', height: 1.5, background: '#3b82f6', borderRadius: 1, marginBottom: 2 }} />
          <div style={{ width: '70%', height: 1.5, background: '#e2e8f0', borderRadius: 1, marginBottom: 1.5 }} />
          <div style={{ width: '40%', height: 1.5, background: '#e2e8f0', borderRadius: 1, marginBottom: 1.5 }} />
          <div style={{ width: '60%', height: 1.5, background: '#fbbf24', borderRadius: 1, marginBottom: 2 }} />
          <div style={{ width: '30%', height: 1.5, background: '#e2e8f0', borderRadius: 1, marginBottom: 1.5 }} />
          <div style={{ width: '50%', height: 1.5, background: '#10b981', borderRadius: 1 }} />
        </div>
      </div>
      {/* 书架 */}
      <div style={{ position: 'absolute', top: 3, left: '6%', width: 38, height: 42, background: 'linear-gradient(180deg, #c9a87c, #b8956a)', border: '1px solid #a67c52', borderRadius: 2 }}>
        <div style={{ position: 'absolute', top: '33%', left: 1, right: 1, height: 1, background: '#a67c52' }} />
        <div style={{ position: 'absolute', top: '66%', left: 1, right: 1, height: 1, background: '#a67c52' }} />
        {[{ t: 1, l: 2, w: 5, c: '#3b82f6' }, { t: 1, l: 9, w: 4, c: '#ef4444' }, { t: 1, l: 15, w: 6, c: '#22c55e' }, { t: 1, l: 23, w: 4, c: '#f59e0b' },
          { t: 15, l: 2, w: 6, c: '#ec4899' }, { t: 15, l: 10, w: 4, c: '#06b6d4' }, { t: 15, l: 16, w: 5, c: '#84cc16' },
          { t: 29, l: 2, w: 5, c: '#f97316' }, { t: 29, l: 9, w: 6, c: '#6366f1' },
        ].map((b, i) => <div key={i} style={{ position: 'absolute', top: b.t, left: b.l, width: b.w, height: 9, background: b.c, borderRadius: 0.5 }} />)}
      </div>
      {/* 窗户 */}
      <div style={{ position: 'absolute', top: 3, left: '28%', width: 44, height: 34, background: 'linear-gradient(180deg, #bfdbfe, #93c5fd)', border: '1.5px solid #c9a87c', borderRadius: 2 }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', width: 1, height: '100%', background: '#c9a87c', transform: 'translateX(-50%)' }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: 1, background: '#c9a87c', transform: 'translateY(-50%)' }} />
        <div style={{ position: 'absolute', top: 3, left: 3, width: 9, height: 4, background: 'white', borderRadius: 99, opacity: 0.5 }} />
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
              <div style={{ fontSize: 10, color: '#5c4033', fontWeight: 700, letterSpacing: 0.2 }}>虚拟办公室</div>
              <div style={{ fontSize: 8, color: '#94a3b8' }}>{agents.length} 位成员 · {workingCount} 工作中</div>
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

      {/* ═══ 逐帧动画 CSS ═══ */}
      <style jsx>{`
        /* 工位 idle：8帧，2.5fps */
        .sprite-desk-idle {
          animation: spriteDeskIdle 3.2s steps(8) infinite;
        }
        @keyframes spriteDeskIdle {
          from { transform: translateX(0); }
          to { transform: translateX(-640px); }
        }

        /* 工位 work：8帧，8fps */
        .sprite-desk-work {
          animation: spriteDeskWork 1s steps(8) infinite;
        }
        @keyframes spriteDeskWork {
          from { transform: translateX(0); }
          to { transform: translateX(-640px); }
        }

        /* 跑步：8帧，10fps */
        .sprite-run {
          animation: spriteRun 0.8s steps(8) infinite;
        }
        @keyframes spriteRun {
          from { transform: translateX(0); }
          to { transform: translateX(-400px); }
        }

        /* 喝咖啡：6帧，3fps */
        .sprite-sip {
          animation: spriteSip 2s steps(6) infinite;
        }
        @keyframes spriteSip {
          from { transform: translateX(0); }
          to { transform: translateX(-300px); }
        }

        /* 辅助动画 */
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

        @keyframes treadmill { 0%{transform:translateX(0)} 100%{transform:translateX(-38px)} }
        .anim-treadmill { animation: treadmill 0.3s linear infinite; }
      `}</style>
    </div>
  )
}
