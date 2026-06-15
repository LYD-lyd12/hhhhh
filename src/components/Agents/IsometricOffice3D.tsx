'use client'

import React, { useState, useEffect, useMemo } from 'react'

type Agent3DState = 'working' | 'idle' | 'done' | 'error' | 'sleeping' | 'coffee' | 'exercise' | 'chatting' | 'meeting'

interface Agent3D {
  id: string
  name: string
  color: string
  emoji?: string
  gx: number
  gy: number
  state: Agent3DState
  progress?: number
  role?: string
}

interface IsometricOffice3DProps {
  agents: Agent3D[]
  missionRunning?: boolean
  activeTeamName?: string
}

const ROLE_COLORS: Record<string, { main: string; dark: string; light: string; accent: string }> = {
  '产品经理': { main: '#FF6B9D', dark: '#C44569', light: '#FFB3C6', accent: '#FF8FAB' },
  '设计师': { main: '#A78BFA', dark: '#7C3AED', light: '#DDD6FE', accent: '#8B5CF6' },
  '前端工程师': { main: '#38BDF8', dark: '#0284C7', light: '#BAE6FD', accent: '#0EA5E9' },
  '后端工程师': { main: '#34D399', dark: '#059669', light: '#A7F3D0', accent: '#10B981' },
  '算法工程师': { main: '#FBBF24', dark: '#D97706', light: '#FEF3C7', accent: '#F59E0B' },
  '测试工程师': { main: '#F472B6', dark: '#DB2777', light: '#FBCFE8', accent: '#EC4899' },
  default: { main: '#60A5FA', dark: '#2563EB', light: '#BFDBFE', accent: '#3B82F6' },
}

function getRoleColors(role?: string, fallbackColor?: string) {
  if (role) {
    const key = Object.keys(ROLE_COLORS).find(k => role.includes(k) || k.includes(role))
    if (key) return ROLE_COLORS[key]
  }
  if (fallbackColor) {
    return { main: fallbackColor, dark: fallbackColor, light: fallbackColor, accent: fallbackColor }
  }
  return ROLE_COLORS.default
}

// ═══════════════════════ 全新精致卡通角色 - 高级版 ═══════════════════════
function CuteAgentCharacter({
  state,
  name,
  role,
  scale = 1,
  color,
  isWalking = false,
}: {
  state: Agent3DState
  name: string
  role?: string
  scale?: number
  color?: string
  isWalking?: boolean
}) {
  const colors = getRoleColors(role, color)
  const isWorking = state === 'working'
  const isSleeping = state === 'sleeping' || state === 'idle'
  const isDone = state === 'done'
  const isError = state === 'error'
  const isCoffee = state === 'coffee'
  const isExercise = state === 'exercise'
  const isChatting = state === 'chatting'
  const isMeeting = state === 'meeting'

  return (
    <div
      className="relative"
      style={{
        width: `${90 * scale}px`,
        height: `${120 * scale}px`,
        animation: isWalking ? 'charWalk 0.6s ease-in-out infinite' :
                   isWorking ? 'charWork 1.2s ease-in-out infinite' :
                   isSleeping ? 'charSleep 4s ease-in-out infinite' :
                   isCoffee ? 'charCoffee 2s ease-in-out infinite' :
                   isExercise ? 'charExercise 0.5s ease-in-out infinite' :
                   isDone ? 'charHappy 1.5s ease-in-out infinite' :
                   isChatting ? 'charChat 1s ease-in-out infinite' :
                   isMeeting ? 'charChat 1.5s ease-in-out infinite' :
                   'charIdle 5s ease-in-out infinite',
        filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.15))',
      }}
    >
      {/* 阴影 - 动态呼吸效果 */}
      <div
        className="absolute bottom-0 left-1/2 rounded-full"
        style={{
          width: `${60 * scale}px`,
          height: `${16 * scale}px`,
          transform: 'translateX(-50%)',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 70%)',
          animation: 'shadowBreath 2s ease-in-out infinite',
        }}
      />

      {/* 身体 - 圆润卡通身材 */}
      <div
        className="absolute left-1/2 rounded-3xl"
        style={{
          width: `${58 * scale}px`,
          height: `${50 * scale}px`,
          bottom: `${10 * scale}px`,
          transform: 'translateX(-50%)',
          background: `linear-gradient(180deg, ${colors.light} 0%, ${colors.main} 50%, ${colors.dark} 100%)`,
          boxShadow: `inset -4px -4px 10px rgba(0,0,0,0.15), inset 4px 4px 10px rgba(255,255,255,0.4), 0 6px 12px rgba(0,0,0,0.15)`,
          border: `${3 * scale}px solid ${colors.dark}`,
        }}
      >
        {/* 角色标识徽章 */}
        <div
          className="absolute left-1/2 top-1.5 rounded-full flex items-center justify-center font-bold"
          style={{
            width: `${26 * scale}px`,
            height: `${16 * scale}px`,
            transform: 'translateX(-50%)',
            background: `linear-gradient(180deg, #FFFFFF 0%, ${colors.light} 100%)`,
            color: colors.dark,
            fontSize: `${9 * scale}px`,
            boxShadow: `0 2px 4px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.8)`,
            border: `${1.5 * scale}px solid ${colors.main}`,
          }}
        >
          {role ? role.slice(0, 2) : 'AI'}
        </div>

        {/* 口袋装饰 - 带小物件 */}
        <div
          className="absolute left-1/2 rounded-xl overflow-hidden"
          style={{
            width: `${20 * scale}px`,
            height: `${14 * scale}px`,
            bottom: `${6 * scale}px`,
            transform: 'translateX(-50%)',
            background: `linear-gradient(180deg, ${colors.main} 0%, ${colors.dark} 100%)`,
            border: `${2 * scale}px solid ${colors.dark}`,
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2)',
          }}
        >
          {/* 口袋里的小物件 - 随机出现 */}
          <div
            className="absolute rounded-full"
            style={{
              width: `${6 * scale}px`,
              height: `${6 * scale}px`,
              bottom: `${2 * scale}px`,
              left: `${5 * scale}px`,
              background: isDone ? '#FFD700' : '#FF6B9D',
              animation: 'pocketItemWiggle 3s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* 手臂 - 左右交替动画 */}
      <div
        className="absolute rounded-full"
        style={{
          width: `${16 * scale}px`,
          height: `${16 * scale}px`,
          left: `${6 * scale}px`,
          bottom: `${24 * scale}px`,
          background: 'linear-gradient(145deg, #FFE4C4 0%, #FFDAB9 50%, #F5C6A5 100%)',
          border: `${2.5 * scale}px solid #E8C4A0`,
          boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.1)',
          animation: isWorking ? 'handType 0.3s ease-in-out infinite' :
                     isWalking ? 'armSwingLeft 0.6s ease-in-out infinite' :
                     isCoffee ? 'armLift 1s ease-in-out infinite' :
                     isExercise ? 'armPumpLeft 0.4s ease-in-out infinite' :
                     isChatting ? 'armWave 0.8s ease-in-out infinite' :
                     'none',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: `${16 * scale}px`,
          height: `${16 * scale}px`,
          right: `${6 * scale}px`,
          bottom: `${24 * scale}px`,
          background: 'linear-gradient(145deg, #FFE4C4 0%, #FFDAB9 50%, #F5C6A5 100%)',
          border: `${2.5 * scale}px solid #E8C4A0`,
          boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.1)',
          animation: isWorking ? 'handType 0.3s ease-in-out infinite 0.15s' :
                     isWalking ? 'armSwingRight 0.6s ease-in-out infinite' :
                     isExercise ? 'armPumpRight 0.4s ease-in-out infinite' :
                     'none',
        }}
      />

      {/* 腿部 - 走路动画 */}
      <div
        className="absolute rounded-full"
        style={{
          width: `${14 * scale}px`,
          height: `${20 * scale}px`,
          left: `${22 * scale}px`,
          bottom: `${-2 * scale}px`,
          background: `linear-gradient(180deg, ${colors.main} 0%, ${colors.dark} 100%)`,
          border: `${2 * scale}px solid ${colors.dark}`,
          animation: isWalking ? 'legStepLeft 0.6s ease-in-out infinite' :
                     isExercise ? 'legBendLeft 0.5s ease-in-out infinite' :
                     'none',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: `${14 * scale}px`,
          height: `${20 * scale}px`,
          right: `${22 * scale}px`,
          bottom: `${-2 * scale}px`,
          background: `linear-gradient(180deg, ${colors.main} 0%, ${colors.dark} 100%)`,
          border: `${2 * scale}px solid ${colors.dark}`,
          animation: isWalking ? 'legStepRight 0.6s ease-in-out infinite' :
                     isExercise ? 'legBendRight 0.5s ease-in-out infinite' :
                     'none',
        }}
      />

      {/* 头部 - Q版大头 */}
      <div
        className="absolute left-1/2 rounded-full"
        style={{
          width: `${70 * scale}px`,
          height: `${70 * scale}px`,
          top: `${2 * scale}px`,
          transform: 'translateX(-50%)',
          background: 'radial-gradient(circle at 30% 30%, #FFF8F0 0%, #FFE4C4 40%, #FFDAB9 70%, #F5C6A5 100%)',
          boxShadow: 'inset -5px -5px 12px rgba(0,0,0,0.08), inset 5px 5px 12px rgba(255,255,255,0.7), 0 6px 14px rgba(0,0,0,0.15)',
          border: `${3 * scale}px solid #E8C4A0`,
        }}
      >
        {/* 头发 - 时尚发型 */}
        <div
          className="absolute"
          style={{
            width: `${70 * scale}px`,
            height: `${32 * scale}px`,
            top: `${-2 * scale}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            background: `linear-gradient(180deg, ${colors.dark} 0%, ${colors.main} 50%, ${colors.accent} 100%)`,
            borderRadius: `${50 * scale}% ${50 * scale}% ${30 * scale}% ${30 * scale}% / ${80 * scale}% ${80 * scale}% ${20 * scale}% ${20 * scale}%`,
            border: `${2.5 * scale}px solid ${colors.dark}`,
            boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.3)',
          }}
        >
          {/* 头发高光 */}
          <div
            className="absolute rounded-full"
            style={{
              width: `${22 * scale}px`,
              height: `${10 * scale}px`,
              top: `${6 * scale}px`,
              left: `${12 * scale}px`,
              background: 'rgba(255,255,255,0.4)',
              transform: 'rotate(-15deg)',
              animation: 'hairShine 3s ease-in-out infinite',
            }}
          />
        </div>

        {/* 呆毛 - 多根呆毛 */}
        <div
          className="absolute left-1/2 rounded-t-full"
          style={{
            width: `${10 * scale}px`,
            height: `${16 * scale}px`,
            top: `${-10 * scale}px`,
            transform: 'translateX(-50%) rotate(-8deg)',
            background: `linear-gradient(180deg, ${colors.dark}, ${colors.main})`,
            border: `${2.5 * scale}px solid ${colors.dark}`,
            animation: 'ahogeBounce 2s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-t-full"
          style={{
            width: `${6 * scale}px`,
            height: `${10 * scale}px`,
            top: `${-6 * scale}px`,
            left: `${28 * scale}px`,
            transform: 'rotate(10deg)',
            background: `linear-gradient(180deg, ${colors.dark}, ${colors.main})`,
            border: `${2 * scale}px solid ${colors.dark}`,
            animation: 'ahogeBounce 2.5s ease-in-out infinite 0.3s',
          }}
        />

        {/* 腮红 - 多层 */}
        <div
          className="absolute rounded-full"
          style={{
            width: `${18 * scale}px`,
            height: `${12 * scale}px`,
            left: `${4 * scale}px`,
            top: `${38 * scale}px`,
            background: 'radial-gradient(circle, rgba(255, 150, 180, 0.5) 0%, transparent 70%)',
            animation: 'blushPulse 3s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: `${18 * scale}px`,
            height: `${12 * scale}px`,
            right: `${4 * scale}px`,
            top: `${38 * scale}px`,
            background: 'radial-gradient(circle, rgba(255, 150, 180, 0.5) 0%, transparent 70%)',
            animation: 'blushPulse 3s ease-in-out infinite 0.5s',
          }}
        />

        {/* 眼睛 - 更闪亮的效果 */}
        <div
          className="absolute rounded-full flex items-center justify-center overflow-hidden"
          style={{
            width: `${18 * scale}px`,
            height: `${22 * scale}px`,
            left: `${14 * scale}px`,
            top: `${22 * scale}px`,
            background: 'white',
            border: `${2.5 * scale}px solid #2D3748`,
            boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.1)',
            animation: isSleeping ? 'eyeSleep 4s ease-in-out infinite' :
                       isDone ? 'eyeSparkle 1s ease-in-out infinite' :
                       'eyeBlink 4s ease-in-out infinite',
          }}
        >
          {/* 瞳孔 */}
          <div
            className="absolute rounded-full"
            style={{
              width: `${12 * scale}px`,
              height: `${14 * scale}px`,
              background: isError ? 'linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)' :
                          isDone ? 'linear-gradient(180deg, #FFD700 0%, #FFA500 100%)' :
                          isWorking || isCoffee ? `linear-gradient(180deg, ${colors.dark} 0%, ${colors.accent} 100%)` :
                          'linear-gradient(180deg, #4A5568 0%, #2D3748 100%)',
              animation: isWorking ? 'pupilMove 2s ease-in-out infinite' :
                         isDone ? 'pupilDilate 1s ease-in-out infinite' :
                         'none',
            }}
          >
            {/* 眼睛高光 - 大高光 */}
            <div
              className="absolute rounded-full bg-white"
              style={{
                width: `${6 * scale}px`,
                height: `${6 * scale}px`,
                top: `${3 * scale}px`,
                right: `${2 * scale}px`,
                animation: 'eyeGlow 2s ease-in-out infinite',
              }}
            />
            {/* 小高光 */}
            <div
              className="absolute rounded-full bg-white opacity-80"
              style={{
                width: `${3 * scale}px`,
                height: `${3 * scale}px`,
                bottom: `${4 * scale}px`,
                left: `${3 * scale}px`,
              }}
            />
            {/* 星星效果 - 完成状态 */}
            {isDone && (
              <>
                <div
                  className="absolute text-white"
                  style={{
                    fontSize: `${6 * scale}px`,
                    top: `${1 * scale}px`,
                    right: `${1 * scale}px`,
                    animation: 'starSparkle 0.8s ease-in-out infinite',
                  }}
                >
                  ✨
                </div>
              </>
            )}
          </div>
        </div>

        {/* 右眼 - 对称效果 */}
        <div
          className="absolute rounded-full flex items-center justify-center overflow-hidden"
          style={{
            width: `${18 * scale}px`,
            height: `${22 * scale}px`,
            right: `${14 * scale}px`,
            top: `${22 * scale}px`,
            background: 'white',
            border: `${2.5 * scale}px solid #2D3748`,
            boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.1)',
            animation: isSleeping ? 'eyeSleep 4s ease-in-out infinite' :
                       isDone ? 'eyeSparkle 1s ease-in-out infinite' :
                       'eyeBlink 4s ease-in-out infinite',
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: `${12 * scale}px`,
              height: `${14 * scale}px`,
              background: isError ? 'linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)' :
                          isDone ? 'linear-gradient(180deg, #FFD700 0%, #FFA500 100%)' :
                          isWorking || isCoffee ? `linear-gradient(180deg, ${colors.dark} 0%, ${colors.accent} 100%)` :
                          'linear-gradient(180deg, #4A5568 0%, #2D3748 100%)',
              animation: isWorking ? 'pupilMove 2s ease-in-out infinite' :
                         isDone ? 'pupilDilate 1s ease-in-out infinite' :
                         'none',
            }}
          >
            <div
              className="absolute rounded-full bg-white"
              style={{
                width: `${6 * scale}px`,
                height: `${6 * scale}px`,
                top: `${3 * scale}px`,
                right: `${2 * scale}px`,
                animation: 'eyeGlow 2s ease-in-out infinite',
              }}
            />
            <div
              className="absolute rounded-full bg-white opacity-80"
              style={{
                width: `${3 * scale}px`,
                height: `${3 * scale}px`,
                bottom: `${4 * scale}px`,
                left: `${3 * scale}px`,
              }}
            />
            {isDone && (
              <div
                className="absolute text-white"
                style={{
                  fontSize: `${6 * scale}px`,
                  top: `${1 * scale}px`,
                  right: `${1 * scale}px`,
                  animation: 'starSparkle 0.8s ease-in-out infinite 0.2s',
                }}
              >
                ✨
              </div>
            )}
          </div>
        </div>

        {/* 嘴巴 - 更多表情 */}
        {isDone ? (
          <div
            className="absolute left-1/2 rounded-b-full"
            style={{
              width: `${22 * scale}px`,
              height: `${12 * scale}px`,
              bottom: `${8 * scale}px`,
              transform: 'translateX(-50%)',
              background: 'linear-gradient(180deg, #E879A8 0%, #C2185B 100%)',
              border: `${2.5 * scale}px solid #AD1457`,
              borderTop: 'none',
              animation: 'mouthHappy 1s ease-in-out infinite',
            }}
          >
            <div
              className="absolute left-1/2 rounded-full"
              style={{
                width: `${10 * scale}px`,
                height: `${5 * scale}px`,
                top: `${3 * scale}px`,
                transform: 'translateX(-50%)',
                background: '#FF8A9B',
              }}
            />
          </div>
        ) : isError ? (
          <div
            className="absolute left-1/2 rounded-full"
            style={{
              width: `${12 * scale}px`,
              height: `${14 * scale}px`,
              bottom: `${6 * scale}px`,
              transform: 'translateX(-50%)',
              background: 'linear-gradient(180deg, #E879A8 0%, #8B0000 100%)',
              border: `${2.5 * scale}px solid #7B1FA2`,
              animation: 'mouthTremble 0.3s ease-in-out infinite',
            }}
          />
        ) : isSleeping ? (
          <div
            className="absolute left-1/2 rounded-full"
            style={{
              width: `${12 * scale}px`,
              height: `${4 * scale}px`,
              bottom: `${14 * scale}px`,
              transform: 'translateX(-50%)',
              background: '#E8A0B0',
              animation: 'mouthSleep 4s ease-in-out infinite',
            }}
          />
        ) : isWorking ? (
          <div
            className="absolute left-1/2 rounded-full"
            style={{
              width: `${12 * scale}px`,
              height: `${8 * scale}px`,
              bottom: `${10 * scale}px`,
              transform: 'translateX(-50%)',
              background: 'linear-gradient(180deg, #FF8A9B 0%, #E879A8 100%)',
              border: `${2 * scale}px solid #C2185B`,
            }}
          />
        ) : isCoffee ? (
          <div
            className="absolute left-1/2 rounded-b-full"
            style={{
              width: `${16 * scale}px`,
              height: `${10 * scale}px`,
              bottom: `${8 * scale}px`,
              transform: 'translateX(-50%)',
              background: 'linear-gradient(180deg, #FFB347 0%, #FF8C00 100%)',
              border: `${2.5 * scale}px solid #D2691E`,
              borderTop: 'none',
              animation: 'mouthSip 1.5s ease-in-out infinite',
            }}
          />
        ) : isChatting ? (
          <div
            className="absolute left-1/2 rounded-full overflow-hidden"
            style={{
              width: `${14 * scale}px`,
              height: `${10 * scale}px`,
              bottom: `${10 * scale}px`,
              transform: 'translateX(-50%)',
              background: 'linear-gradient(180deg, #FF8A9B 0%, #C2185B 100%)',
              border: `${2.5 * scale}px solid #AD1457`,
              animation: 'mouthTalk 0.3s ease-in-out infinite',
            }}
          />
        ) : (
          <div
            className="absolute left-1/2 rounded-b-full"
            style={{
              width: `${18 * scale}px`,
              height: `${8 * scale}px`,
              bottom: `${10 * scale}px`,
              transform: 'translateX(-50%)',
              borderLeft: `${2.5 * scale}px solid #C2185B`,
              borderRight: `${2.5 * scale}px solid #C2185B`,
              borderBottom: `${2.5 * scale}px solid #C2185B`,
              background: 'rgba(255, 138, 155, 0.3)',
            }}
          />
        )}
      </div>

      {/* 状态气泡 - 更精致 */}
      {isWorking && (
        <>
          <div
            className="absolute -top-2 left-1/2 rounded-full flex items-center justify-center"
            style={{
              width: `${32 * scale}px`,
              height: `${32 * scale}px`,
              transform: 'translateX(-50%)',
              background: 'linear-gradient(145deg, #3B82F6, #2563EB)',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
              animation: 'bubbleWork 1s ease-in-out infinite',
            }}
          >
            <span style={{ fontSize: `${16 * scale}px` }}>💻</span>
          </div>
          {/* 工作粒子 */}
          <div className="absolute -top-4 left-1/4" style={{
            fontSize: `${8 * scale}px`,
            animation: 'particleFloat 1.5s ease-in-out infinite',
          }}>⚡</div>
          <div className="absolute -top-6 right-1/4" style={{
            fontSize: `${8 * scale}px`,
            animation: 'particleFloat 1.5s ease-in-out infinite 0.5s',
          }}>✨</div>
        </>
      )}
      {isSleeping && (
        <>
          <div
            className="absolute -top-4 right-2"
            style={{
              fontSize: `${20 * scale}px`,
              animation: 'zzzFloat 2s ease-in-out infinite',
            }}
          >
            💤
          </div>
          <div
            className="absolute -top-8 right-0"
            style={{
              fontSize: `${14 * scale}px`,
              animation: 'zzzFloat 2s ease-in-out infinite 0.5s',
              opacity: 0.7,
            }}
          >
            Z
          </div>
          <div
            className="absolute -top-12 right-4"
            style={{
              fontSize: `${10 * scale}px`,
              animation: 'zzzFloat 2s ease-in-out infinite 1s',
              opacity: 0.5,
            }}
          >
            z
          </div>
        </>
      )}
      {isDone && (
        <>
          <div
            className="absolute -top-2 left-1/2 rounded-full flex items-center justify-center"
            style={{
              width: `${32 * scale}px`,
              height: `${32 * scale}px`,
              transform: 'translateX(-50%)',
              background: 'linear-gradient(145deg, #10B981, #059669)',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
              animation: 'bubblePulse 1.5s ease-in-out infinite',
            }}
          >
            <span style={{ fontSize: `${16 * scale}px` }}>🎉</span>
          </div>
          {/* 庆祝粒子 */}
          <div className="absolute -top-6 left-1/4" style={{
            fontSize: `${10 * scale}px`,
            animation: 'confetti 1.2s ease-in-out infinite',
          }}>🎊</div>
          <div className="absolute -top-8 right-1/4" style={{
            fontSize: `${10 * scale}px`,
            animation: 'confetti 1.2s ease-in-out infinite 0.4s',
          }}>⭐</div>
          <div className="absolute -top-10 left-1/2" style={{
            fontSize: `${8 * scale}px`,
            animation: 'confetti 1.2s ease-in-out infinite 0.8s',
          }}>✨</div>
        </>
      )}
      {isError && (
        <>
          <div
            className="absolute -top-2 left-1/2 rounded-full flex items-center justify-center"
            style={{
              width: `${32 * scale}px`,
              height: `${32 * scale}px`,
              transform: 'translateX(-50%)',
              background: 'linear-gradient(145deg, #EF4444, #DC2626)',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
              animation: 'bubbleShake 0.5s ease-in-out infinite',
            }}
          >
            <span style={{ fontSize: `${16 * scale}px` }}>😫</span>
          </div>
          {/* 错误标记 */}
          <div className="absolute -top-6 left-1/4" style={{
            fontSize: `${12 * scale}px`,
            animation: 'errorShake 0.5s ease-in-out infinite',
          }}>❌</div>
        </>
      )}
      {isCoffee && (
        <>
          <div
            className="absolute -top-2 left-1/2 rounded-full flex items-center justify-center"
            style={{
              width: `${32 * scale}px`,
              height: `${32 * scale}px`,
              transform: 'translateX(-50%)',
              background: 'linear-gradient(145deg, #F59E0B, #D97706)',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
              animation: 'bubblePulse 2s ease-in-out infinite',
            }}
          >
            <span style={{ fontSize: `${16 * scale}px` }}>☕</span>
          </div>
          {/* 咖啡蒸汽 */}
          <div className="absolute -top-6 left-1/4" style={{
            fontSize: `${10 * scale}px`,
            animation: 'steamRise 1.5s ease-in-out infinite',
          }}>~</div>
          <div className="absolute -top-8 right-1/4" style={{
            fontSize: `${10 * scale}px`,
            animation: 'steamRise 1.5s ease-in-out infinite 0.5s',
          }}>~</div>
        </>
      )}
      {isExercise && (
        <>
          <div
            className="absolute -top-2 left-1/2 rounded-full flex items-center justify-center"
            style={{
              width: `${32 * scale}px`,
              height: `${32 * scale}px`,
              transform: 'translateX(-50%)',
              background: 'linear-gradient(145deg, #8B5CF6, #7C3AED)',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
              animation: 'bubbleWork 0.8s ease-in-out infinite',
            }}
          >
            <span style={{ fontSize: `${16 * scale}px` }}>💪</span>
          </div>
          {/* 运动粒子 */}
          <div className="absolute -top-6 left-1/4" style={{
            fontSize: `${10 * scale}px`,
            animation: 'sweatDrop 0.8s ease-in-out infinite',
          }}>💦</div>
        </>
      )}
      {isChatting && (
        <>
          <div
            className="absolute -top-2 left-1/2 rounded-full flex items-center justify-center"
            style={{
              width: `${32 * scale}px`,
              height: `${32 * scale}px`,
              transform: 'translateX(-50%)',
              background: 'linear-gradient(145deg, #06B6D4, #0891B2)',
              boxShadow: '0 4px 12px rgba(6, 182, 212, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
              animation: 'bubblePulse 1s ease-in-out infinite',
            }}
          >
            <span style={{ fontSize: `${16 * scale}px` }}>💬</span>
          </div>
        </>
      )}
      {isMeeting && (
        <>
          <div
            className="absolute -top-2 left-1/2 rounded-full flex items-center justify-center"
            style={{
              width: `${32 * scale}px`,
              height: `${32 * scale}px`,
              transform: 'translateX(-50%)',
              background: 'linear-gradient(145deg, #8B5CF6, #7C3AED)',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
              animation: 'bubblePulse 1.5s ease-in-out infinite',
            }}
          >
            <span style={{ fontSize: `${16 * scale}px` }}>🗣️</span>
          </div>
        </>
      )}

      {/* 名字标签 - 更精致 */}
      <div
        className="absolute -bottom-8 left-1/2 whitespace-nowrap font-semibold px-4 py-1.5 rounded-2xl shadow-lg"
        style={{
          transform: 'translateX(-50%)',
          fontSize: `${11 * scale}px`,
          background: `linear-gradient(145deg, white 0%, #F8F9FA 100%)`,
          color: colors.dark,
          border: `${2.5 * scale}px solid ${colors.main}`,
          boxShadow: `0 4px 8px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.8), 0 0 20px ${colors.main}20`,
        }}
      >
        {name}
      </div>
    </div>
  )
}

// ═══════════════════════ 精致办公桌 ═══════════════════════
function CuteDesk({
  state,
  role,
  isMain,
  color,
}: {
  state: Agent3DState
  role?: string
  isMain?: boolean
  color?: string
}) {
  const colors = getRoleColors(role, color)
  const isWorking = state === 'working'
  const isSleeping = state === 'sleeping' || state === 'idle'

  return (
    <div className="relative w-full h-48">
      {/* 桌面 */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-2xl"
        style={{
          width: '200px',
          height: '90px',
          background: 'linear-gradient(145deg, #FFFFFF 0%, #F1F5F9 50%, #E2E8F0 100%)',
          boxShadow: 'inset -4px -4px 10px rgba(0,0,0,0.08), inset 4px 4px 10px rgba(255,255,255,0.9), 0 10px 25px rgba(0,0,0,0.12)',
          border: '3px solid #CBD5E1',
          transform: 'perspective(1000px) rotateX(12deg)',
        }}
      >
        {/* 桌面纹理 */}
        <div className="absolute inset-2 rounded-xl opacity-20" style={{
          background: 'repeating-linear-gradient(90deg, transparent 0px, transparent 20px, rgba(100,100,100,0.1) 20px, rgba(100,100,100,0.1) 21px)',
        }} />
      </div>

      {/* 桌腿 */}
      <div className="absolute bottom-0 left-10 w-6 h-12 rounded-b-xl" style={{
        background: 'linear-gradient(180deg, #94A3B8 0%, #64748B 100%)',
        boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.15)',
        border: '2px solid #64748B',
      }} />
      <div className="absolute bottom-0 right-10 w-6 h-12 rounded-b-xl" style={{
        background: 'linear-gradient(180deg, #94A3B8 0%, #64748B 100%)',
        boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.15)',
        border: '2px solid #64748B',
      }} />

      {/* 显示器 */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: '80px' }}>
        <div
          className="rounded-xl relative overflow-hidden"
          style={{
            width: '130px',
            height: '80px',
            background: `linear-gradient(145deg, ${isSleeping ? '#1E293B' : '#334155'} 0%, ${isSleeping ? '#0F172A' : '#1E293B'} 100%)`,
            boxShadow: 'inset -3px -3px 6px rgba(0,0,0,0.3), inset 3px 3px 6px rgba(255,255,255,0.05), 0 8px 20px rgba(0,0,0,0.25)',
            border: '4px solid #475569',
          }}
        >
          {/* 屏幕内容 */}
          {isWorking && (
            <>
              {/* 标题栏 */}
              <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <div className="ml-2 text-xs text-slate-400 font-medium">✨ code.tsx</div>
              </div>
              {/* 代码行 */}
              <div className="absolute top-8 left-3 right-3 space-y-1.5">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-14 rounded" style={{ background: colors.light, opacity: 0.9 }} />
                  <div className="h-2 w-10 rounded" style={{ background: colors.main, opacity: 0.7 }} />
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <div className="h-2 w-12 rounded" style={{ background: colors.light, opacity: 0.8 }} />
                  <div className="h-2 w-16 rounded" style={{ background: colors.accent, opacity: 0.6 }} />
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <div className="h-2 w-10 rounded" style={{ background: colors.main, opacity: 0.7 }} />
                  <div className="h-2 w-8 rounded" style={{ background: colors.light, opacity: 0.8 }} />
                </div>
              </div>
              {/* 进度条 */}
              <div className="absolute bottom-2 left-3 right-3 h-2.5 rounded-full bg-slate-700 overflow-hidden">
                <div className="h-full rounded-full animate-pulse" style={{
                  width: '70%',
                  background: `linear-gradient(90deg, ${colors.dark}, ${colors.accent})`,
                  boxShadow: `0 0 10px ${colors.accent}`,
                }} />
              </div>
            </>
          )}
          {isSleeping && (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <div style={{ fontSize: '36px', animation: 'floatScreensaver 4s ease-in-out infinite' }}>
                  🌙
                </div>
              </div>
              <div className="absolute bottom-2 right-3 text-xs text-slate-500 font-medium">Zzz...</div>
            </>
          )}
          {state === 'done' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div style={{ fontSize: '32px', animation: 'checkmarkPop 0.6s ease-out' }}>🎉</div>
              <div className="text-sm font-bold text-emerald-400">完成啦!</div>
            </div>
          )}
          {state === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div style={{ fontSize: '32px', animation: 'errorShake 0.5s ease-in-out infinite' }}>⚠️</div>
              <div className="text-sm font-bold text-red-400">出错了</div>
            </div>
          )}
        </div>
        {/* 显示器底座 */}
        <div className="w-24 h-4 mx-auto rounded-b-lg" style={{
          background: 'linear-gradient(180deg, #475569, #334155)',
          boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
        }} />
        <div className="w-12 h-3 mx-auto rounded-b" style={{
          background: '#334155',
        }} />
      </div>

      {/* 键盘 */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-xl"
        style={{
          bottom: '18px',
          width: '110px',
          height: '38px',
          background: 'linear-gradient(145deg, #475569 0%, #334155 50%, #1E293B 100%)',
          boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.05), 0 4px 10px rgba(0,0,0,0.2)',
          border: '2px solid #64748B',
        }}
      >
        {/* 按键网格 */}
        <div className="grid grid-cols-8 gap-1 p-2">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="rounded-sm"
              style={{
                width: '10px',
                height: '8px',
                background: isWorking && i < 16 && Math.random() > 0.4 ? colors.accent : '#64748B',
                boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.1)',
                animation: isWorking && i < 16 ? `keyPress ${0.25 + (i % 4) * 0.05}s ease-in-out infinite` : 'none',
                animationDelay: `${i * 0.03}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* 咖啡杯 */}
      <div className="absolute right-12" style={{ bottom: '52px' }}>
        <div
          className="rounded-b-lg relative"
          style={{
            width: '22px',
            height: '26px',
            background: 'linear-gradient(145deg, #FCD34D 0%, #F59E0B 50%, #D97706 100%)',
            boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.15), 0 3px 8px rgba(0,0,0,0.15)',
            border: '2px solid #B45309',
          }}
        >
          {/* 把手 */}
          <div className="absolute -right-2.5 top-2 w-2.5 h-8 rounded-r-full" style={{
            border: '2px solid #B45309',
            background: 'transparent',
          }} />
          {/* 蒸汽 */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex gap-1">
            <div style={{ fontSize: '12px', animation: 'steamRise 1.5s ease-in-out infinite' }}>~</div>
            <div style={{ fontSize: '12px', animation: 'steamRise 1.5s ease-in-out infinite 0.3s' }}>~</div>
            <div style={{ fontSize: '12px', animation: 'steamRise 1.5s ease-in-out infinite 0.6s' }}>~</div>
          </div>
        </div>
      </div>

      {/* 小盆栽 */}
      <div className="absolute left-12" style={{ bottom: '52px' }}>
        <div
          className="rounded-b-lg"
          style={{
            width: '18px',
            height: '16px',
            background: 'linear-gradient(180deg, #EA580C 0%, #C2410C 100%)',
            border: '2px solid #9A3412',
          }}
        />
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: '-22px',
            fontSize: '20px',
            animation: 'plantSway 3s ease-in-out infinite',
          }}
        >
          🌿
        </div>
      </div>

      {/* 主Agent标识 - 星星 */}
      {isMain && (
        <div
          className="absolute -top-6 right-4"
          style={{
            fontSize: '28px',
            animation: 'starTwinkle 1.5s ease-in-out infinite',
            filter: 'drop-shadow(0 3px 6px rgba(255,200,0,0.5))',
          }}
        >
          ⭐
        </div>
      )}
    </div>
  )
}

// ═══════════════════════ 温馨咖啡角 ═══════════════════════
function CozyCoffeeCorner({ agents }: { agents: Agent3D[] }) {
  return (
    <div className="relative w-full rounded-3xl overflow-hidden" style={{
      minHeight: '220px',
      background: 'linear-gradient(145deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)',
      boxShadow: 'inset -4px -4px 12px rgba(139,69,19,0.08), inset 4px 4px 12px rgba(255,255,255,0.6), 0 10px 25px rgba(0,0,0,0.1)',
      border: '4px solid #F59E0B',
    }}>
      {/* 招牌 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-2 rounded-2xl shadow-lg font-bold text-sm whitespace-nowrap">
        ☕ 休闲角落
      </div>

      {/* 背景装饰 */}
      <div className="absolute top-12 left-8 w-24 h-24 rounded-full bg-yellow-200 opacity-50" style={{ filter: 'blur(25px)' }} />
      <div className="absolute bottom-12 right-8 w-20 h-20 rounded-full bg-orange-200 opacity-50" style={{ filter: 'blur(20px)' }} />

      {/* 咖啡机 */}
      <div className="absolute bottom-8 left-8" style={{ width: '90px' }}>
        <div className="relative rounded-2xl" style={{
          height: '120px',
          background: 'linear-gradient(145deg, #475569 0%, #334155 50%, #1E293B 100%)',
          boxShadow: 'inset -3px -3px 6px rgba(0,0,0,0.3), inset 3px 3px 6px rgba(255,255,255,0.05), 0 8px 20px rgba(0,0,0,0.2)',
          border: '3px solid #64748B',
        }}>
          {/* 显示屏 */}
          <div className="absolute top-3 left-3 right-3 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
            <div className="text-xs text-amber-400 font-mono font-bold">● READY</div>
          </div>
          {/* 按钮 */}
          <div className="absolute top-14 left-3 right-3 grid grid-cols-3 gap-1.5">
            {['☕', '🥛', '☕'].map((icon, i) => (
              <div key={i} className="h-8 bg-slate-700 rounded-lg flex items-center justify-center text-sm cursor-pointer hover:bg-slate-600 transition-colors shadow-md">
                {icon}
              </div>
            ))}
          </div>
          {/* 出水口 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-6 bg-slate-900 rounded-lg" />
          {/* 蒸汽效果 */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-1 opacity-80">
            <div className="text-sm text-slate-400" style={{ animation: 'steamRise 2s ease-in-out infinite' }}>~</div>
            <div className="text-sm text-slate-400" style={{ animation: 'steamRise 2s ease-in-out infinite 0.4s' }}>~</div>
            <div className="text-sm text-slate-400" style={{ animation: 'steamRise 2s ease-in-out infinite 0.8s' }}>~</div>
          </div>
        </div>
      </div>

      {/* 沙发 */}
      <div className="absolute bottom-8 right-8" style={{ width: '140px' }}>
        <div className="relative rounded-3xl" style={{
          height: '90px',
          background: 'linear-gradient(145deg, #F9A8D4 0%, #EC4899 50%, #BE185D 100%)',
          boxShadow: 'inset -3px -3px 6px rgba(0,0,0,0.15), inset 3px 3px 6px rgba(255,255,255,0.3), 0 8px 20px rgba(236,72,153,0.25)',
          border: '3px solid #BE185D',
        }}>
          {/* 靠垫 */}
          <div className="absolute top-3 left-4 w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-100 to-pink-200 shadow-md" />
          <div className="absolute top-3 right-4 w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-100 to-pink-200 shadow-md" />
          {/* 座位 */}
          <div className="absolute bottom-3 left-5 right-5 h-10 rounded-2xl bg-gradient-to-b from-pink-100 to-pink-200 shadow-inner" />
        </div>
      </div>

      {/* 小茶几 */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
        <div className="w-20 h-5 rounded-xl bg-gradient-to-b from-amber-200 to-amber-300 shadow-lg border-2 border-amber-400" />
        <div className="w-8 h-8 mx-auto rounded-b-lg bg-gradient-to-b from-amber-300 to-amber-500" />
      </div>

      {/* 角色展示 */}
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex gap-4">
        {agents.slice(0, 2).map((agent) => (
          <CuteAgentCharacter
            key={agent.id}
            state="coffee"
            name={agent.name}
            role={agent.role}
            color={agent.color}
            scale={0.75}
          />
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════ 活力健身房 ═══════════════════════
function EnergeticGymArea({ agents }: { agents: Agent3D[] }) {
  return (
    <div className="relative w-full rounded-3xl overflow-hidden" style={{
      minHeight: '220px',
      background: 'linear-gradient(145deg, #F0FDF4 0%, #BBF7D0 50%, #86EFAC 100%)',
      boxShadow: 'inset -4px -4px 12px rgba(0,100,50,0.08), inset 4px 4px 12px rgba(255,255,255,0.6), 0 10px 25px rgba(0,0,0,0.1)',
      border: '4px solid #22C55E',
    }}>
      {/* 招牌 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-6 py-2 rounded-2xl shadow-lg font-bold text-sm whitespace-nowrap">
        🏃 活力健身房
      </div>

      {/* 背景装饰 */}
      <div className="absolute top-12 right-8 w-24 h-24 rounded-full bg-green-200 opacity-50" style={{ filter: 'blur(25px)' }} />
      <div className="absolute bottom-12 left-8 w-20 h-20 rounded-full bg-emerald-200 opacity-50" style={{ filter: 'blur(20px)' }} />

      {/* 跑步机 */}
      <div className="absolute bottom-8 left-8" style={{ width: '110px' }}>
        <div className="relative rounded-2xl" style={{
          height: '130px',
          background: 'linear-gradient(145deg, #475569 0%, #334155 50%, #1E293B 100%)',
          boxShadow: 'inset -3px -3px 6px rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.2)',
          border: '3px solid #64748B',
        }}>
          {/* 控制台 */}
          <div className="absolute top-3 left-3 right-3 h-12 rounded-xl bg-slate-900 flex flex-col items-center justify-center gap-1">
            <div className="text-sm text-emerald-400 font-mono font-bold">🏃 8.5 km/h</div>
            <div className="text-xs text-blue-400 font-mono">⏱ 25:30</div>
          </div>
          {/* 扶手 */}
          <div className="absolute top-16 left-1.5 w-2.5 h-14 bg-slate-600 rounded-full" />
          <div className="absolute top-16 right-1.5 w-2.5 h-14 bg-slate-600 rounded-full" />
          {/* 跑带 */}
          <div className="absolute bottom-3 left-3 right-3 h-14 rounded-xl bg-slate-900 overflow-hidden">
            <div className="absolute inset-0" style={{
              background: 'repeating-linear-gradient(90deg, #1A1A1A 0px, #1A1A1A 18px, #2D2D2D 18px, #2D2D2D 36px)',
              animation: 'treadmillBelt 0.4s linear infinite',
            }} />
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-white to-transparent opacity-10" />
          </div>
        </div>
      </div>

      {/* 哑铃组 */}
      <div className="absolute bottom-10 right-10 flex flex-col gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-full" style={{
              background: 'linear-gradient(145deg, #94A3B8, #475569)',
              boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.1), 0 3px 8px rgba(0,0,0,0.2)',
              border: '2px solid #334155',
            }} />
            <div className="w-5 h-4 rounded" style={{
              background: 'linear-gradient(180deg, #94A3B8, #475569)',
              border: '2px solid #334155',
            }} />
            <div className="w-7 h-7 rounded-full" style={{
              background: 'linear-gradient(145deg, #94A3B8, #475569)',
              boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.1), 0 3px 8px rgba(0,0,0,0.2)',
              border: '2px solid #334155',
            }} />
          </div>
        ))}
      </div>

      {/* 瑜伽垫 */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-20 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg border-2 border-purple-700 opacity-80" style={{
        transform: 'translateX(-50%) perspective(200px) rotateX(25deg)',
      }} />

      {/* 角色展示 */}
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex gap-4">
        {agents.slice(0, 2).map((agent) => (
          <CuteAgentCharacter
            key={agent.id}
            state="exercise"
            name={agent.name}
            role={agent.role}
            color={agent.color}
            scale={0.75}
          />
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════ 精美时钟 ═══════════════════════
function ElegantClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const hours = time.getHours()
  const minutes = time.getMinutes()
  const seconds = time.getSeconds()

  const hourDeg = (hours % 12) * 30 + minutes * 0.5
  const minuteDeg = minutes * 6
  const secondDeg = seconds * 6

  return (
    <div className="relative" style={{ width: '110px', height: '110px' }}>
      {/* 外框 */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'linear-gradient(145deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
          boxShadow: 'inset -3px -3px 6px rgba(139,69,19,0.3), inset 3px 3px 6px rgba(255,255,255,0.5), 0 8px 20px rgba(255,165,0,0.3)',
        }}
      />
      {/* 内框 */}
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          top: '10px',
          left: '10px',
          right: '10px',
          bottom: '10px',
          background: 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 50%, #E2E8F0 100%)',
          boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.08), inset 2px 2px 4px rgba(255,255,255,0.9)',
        }}
      >
        {/* 刻度 */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: i % 3 === 0 ? '5px' : '3px',
              height: i % 3 === 0 ? '10px' : '5px',
              background: i % 3 === 0 ? '#475569' : '#94A3B8',
              top: '8px',
              left: '50%',
              transformOrigin: 'center 38px',
              transform: `translateX(-50%) rotate(${i * 30}deg)`,
            }}
          />
        ))}

        {/* 时针 */}
        <div
          className="absolute rounded-full"
          style={{
            width: '6px',
            height: '26px',
            background: 'linear-gradient(180deg, #334155, #0F172A)',
            bottom: '50%',
            left: '50%',
            transform: `translateX(-50%) rotate(${hourDeg}deg)`,
            transformOrigin: 'center bottom',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        />

        {/* 分针 */}
        <div
          className="absolute rounded-full"
          style={{
            width: '4px',
            height: '34px',
            background: 'linear-gradient(180deg, #334155, #0F172A)',
            bottom: '50%',
            left: '50%',
            transform: `translateX(-50%) rotate(${minuteDeg}deg)`,
            transformOrigin: 'center bottom',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        />

        {/* 秒针 */}
        <div
          className="absolute"
          style={{
            width: '2px',
            height: '38px',
            background: 'linear-gradient(180deg, #EF4444, #B91C1C)',
            bottom: '50%',
            left: '50%',
            transform: `translateX(-50%) rotate(${secondDeg}deg)`,
            transformOrigin: 'center bottom',
            boxShadow: '0 1px 3px rgba(239,68,68,0.5)',
          }}
        />

        {/* 中心点 */}
        <div
          className="absolute rounded-full"
          style={{
            width: '12px',
            height: '12px',
            background: 'linear-gradient(145deg, #FFD700, #FF8C00)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        />
      </div>

      {/* 数字时间显示 */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-1.5 rounded-xl shadow-lg text-sm font-mono font-bold whitespace-nowrap">
        {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
    </div>
  )
}

// ═══════════════════════ 主组件 ═══════════════════════
export default function IsometricOffice3D({
  agents,
  missionRunning = false,
  activeTeamName = '智能团队',
}: {
  agents: Agent3D[]
  missionRunning?: boolean
  activeTeamName?: string
}) {
  const workingAgents = agents.filter(a => a.state === 'working')
  const idleAgents = agents.filter(a => a.state === 'idle' || a.state === 'sleeping')
  const doneAgents = agents.filter(a => a.state === 'done')

  return (
    <div className="w-full min-h-[600px] relative overflow-hidden rounded-3xl" style={{
      background: 'linear-gradient(180deg, #F0F9FF 0%, #E0F2FE 30%, #F0FDF4 70%, #FEF3C7 100%)',
    }}>
      {/* 顶部装饰 */}
      <div className="absolute top-0 left-0 right-0 h-24" style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, transparent 100%)',
      }} />

      {/* 背景装饰光斑 */}
      <div className="absolute top-10 left-10 w-32 h-32 rounded-full" style={{
        background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
      }} />
      <div className="absolute top-20 right-20 w-40 h-40 rounded-full" style={{
        background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
      }} />
      <div className="absolute bottom-40 left-1/4 w-36 h-36 rounded-full" style={{
        background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
      }} />

      {/* 标题区域 */}
      <div className="relative pt-6 pb-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            ✨ {activeTeamName}
          </h1>
          {missionRunning && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-full shadow-lg animate-pulse">
            <span className="w-2 h-2 bg-white rounded-full animate-ping" />
            任务进行中
          </div>
        )}
          </div>
          <div className="flex items-center gap-6">
            <ElegantClock />
          </div>
        </div>

        {/* 状态统计 */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-2xl shadow-md border border-blue-100">
            <span className="text-xl">💻</span>
            <span className="text-sm font-semibold text-slate-700">工作中: {workingAgents.length}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-2xl shadow-md border border-emerald-100">
            <span className="text-xl">✅</span>
            <span className="text-sm font-semibold text-slate-700">已完成: {doneAgents.length}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-2xl shadow-md border border-slate-100">
            <span className="text-xl">💤</span>
            <span className="text-sm font-semibold text-slate-700">待命: {idleAgents.length}</span>
          </div>
        </div>
      </div>

      {/* 全局漂浮粒子系统 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        {/* 大光斑 */}
        {[...Array(6)].map((_, i) => (
          <div key={`glow-${i}`} className="absolute rounded-full"
            style={{
              width: `${80 + Math.sin(i * 1.7) * 40}px`,
              height: `${80 + Math.sin(i * 1.7) * 40}px`,
              left: `${15 + i * 14}%`,
              top: `${10 + i * 13}%`,
              background: `radial-gradient(circle, ${['rgba(96,165,250,0.06)','rgba(168,85,247,0.05)','rgba(34,197,94,0.05)','rgba(251,146,60,0.05)','rgba(236,72,153,0.05)','rgba(14,165,233,0.05)'][i]} 0%, transparent 70%)`,
              animation: `particleFloat ${4 + i * 1.2}s ease-in-out infinite`,
              animationDelay: `${i * 1.5}s`,
            }}
          />
        ))}
        {/* 微小灰尘粒子 - 用素数乘积做伪随机分布 */}
        {[...Array(20)].map((_, i) => (
          <div key={`dust-${i}`} className="absolute rounded-full"
            style={{
              width: `${2 + ((i * 7) % 5)}px`,
              height: `${2 + ((i * 11) % 5)}px`,
              left: `${((i * 17 + 7) % 91)}%`,
              top: `${((i * 23 + 13) % 89)}%`,
              background: 'rgba(148,163,184,0.15)',
              animation: `particleFloat ${6 + (i % 8)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.7) % 5}s`,
            }}
          />
        ))}
        {/* 金色光点 */}
        {[...Array(8)].map((_, i) => (
          <div key={`gold-${i}`} className="absolute rounded-full"
            style={{
              width: '4px',
              height: '4px',
              left: `${((i * 29 + 5) % 85)}%`,
              top: `${((i * 37 + 19) % 82)}%`,
              background: 'rgba(255,215,0,0.2)',
              boxShadow: '0 0 8px 2px rgba(255,215,0,0.15)',
              animation: `particleFloat ${5 + (i % 6)}s ease-in-out infinite`,
              animationDelay: `${(i * 1.3) % 4}s`,
            }}
          />
        ))}
      </div>

      {/* 主办公区域 */}
      <div className="relative px-6 pb-6" style={{ zIndex: 2 }}>
        {/* 办公区标题 + 场景装饰 */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-2xl">🏢</span> 办公区
          </h2>
          {/* 办公室窗户 - 带天气动画 */}
          <div className="flex items-center gap-3">
            <div className="relative w-28 h-20 rounded-2xl overflow-hidden border-3 border-amber-200 shadow-lg"
              style={{
                background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0FF 40%, #E0F0FF 100%)',
                border: '3px solid #FDE68A',
                boxShadow: 'inset 0 0 20px rgba(135,206,235,0.3), 0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              {/* 太阳 */}
              <div className="absolute rounded-full" style={{
                width: '18px', height: '18px',
                top: '8px', left: '12px',
                background: 'radial-gradient(circle, #FFD700 0%, #FFA500 60%, transparent 100%)',
                boxShadow: '0 0 20px 4px rgba(255,200,0,0.4)',
                animation: 'sunGlow 3s ease-in-out infinite',
              }} />
              {/* 云朵 */}
              <div className="absolute rounded-full bg-white/90" style={{
                width: '30px', height: '12px',
                top: '16px', left: '70%',
                animation: 'cloudDrift 8s linear infinite',
                boxShadow: '8px -4px 0 0 rgba(255,255,255,0.8), -4px 3px 0 0 rgba(255,255,255,0.7)',
              }} />
              <div className="absolute rounded-full bg-white/80" style={{
                width: '22px', height: '10px',
                top: '28px', left: '50%',
                animation: 'cloudDrift 10s linear infinite 3s',
                boxShadow: '6px -3px 0 0 rgba(255,255,255,0.7)',
              }} />
              {/* 窗格 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-0.5 h-full bg-amber-300/50" />
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-amber-300/50" />
              </div>
            </div>
            {/* 装饰画 */}
            <div className="relative w-24 h-20 rounded-2xl overflow-hidden border-3 border-amber-200 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #FFE4B5 0%, #FFD700 40%, #FFA500 100%)',
                border: '3px solid #FDE68A',
                boxShadow: 'inset 0 0 15px rgba(255,215,0,0.2), 0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              {/* 抽象太阳画 */}
              <div className="absolute rounded-full" style={{
                width: '16px', height: '16px',
                top: '6px', right: '10px',
                background: 'radial-gradient(circle, #FFF 0%, #FFD700 100%)',
                boxShadow: '0 0 12px 3px rgba(255,215,0,0.5)',
              }} />
              {/* 山 */}
              <div className="absolute bottom-0 left-0 w-12 h-10" style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                clipPath: 'polygon(0 100%, 30% 20%, 60% 50%, 100% 100%)',
                opacity: 0.5,
              }} />
              <div className="absolute bottom-0 right-0 w-12 h-10" style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                clipPath: 'polygon(0 100%, 40% 30%, 70% 60%, 100% 100%)',
                opacity: 0.4,
              }} />
              {/* 画框标签 */}
              <div className="absolute bottom-2 left-2 right-2 text-center">
                <div className="text-[8px] font-bold text-white/70">✦ 梦想 ✦</div>
              </div>
            </div>
          </div>
        </div>

        {/* Agent工位网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {agents.map((agent, index) => (
            <div
              key={agent.id}
              className="relative bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border-2 border-white hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
              style={{
                borderColor: agent.color ? `${agent.color}40` : 'rgba(59,130,246,0.25)',
              }}
            >
              {/* 角色 */}
              <div className="flex justify-center mb-4">
                <CuteAgentCharacter
                  state={agent.state}
                  name={agent.name}
                  role={agent.role}
                  color={agent.color}
                  scale={0.9}
                />
              </div>
              {/* 办公桌 */}
              <div className="mt-2">
                <CuteDesk
                  state={agent.state}
                  role={agent.role}
                  isMain={index === 0}
                  color={agent.color}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 休闲区域 - 咖啡角和健身房 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <CozyCoffeeCorner agents={agents} />
          <EnergeticGymArea agents={agents} />
        </div>
      </div>

      {/* CSS动画 - 完整版 45 个关键帧定义 */}
      <style>{`
        /* ═══════ 角色整体动画 ═══════ */
        @keyframes charWalk {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          15% { transform: translateY(-4px) rotate(-3deg); }
          35% { transform: translateY(-1px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(3deg); }
          65% { transform: translateY(-1px) rotate(0deg); }
          85% { transform: translateY(-3px) rotate(-2deg); }
        }
        @keyframes charWork {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          20% { transform: translateY(-2px) rotate(-2deg); }
          40% { transform: translateY(0) rotate(0deg); }
          60% { transform: translateY(-2px) rotate(2deg); }
          80% { transform: translateY(0) rotate(0deg); }
        }
        @keyframes charSleep {
          0%, 100% { transform: translateY(0); }
          30% { transform: translateY(2px) scale(0.98); }
          70% { transform: translateY(1px) scale(1.01); }
        }
        @keyframes charCoffee {
          0%, 100% { transform: rotate(-2deg) translateY(1px); }
          30% { transform: rotate(3deg) translateY(-3px); }
          60% { transform: rotate(-1deg) translateY(0); }
        }
        @keyframes charExercise {
          0%, 100% { transform: translateY(0) scale(1); }
          20% { transform: translateY(-10px) scale(1.02); }
          40% { transform: translateY(-3px) scale(1); }
          60% { transform: translateY(-10px) scale(1.02); }
          80% { transform: translateY(-3px) scale(1); }
        }
        @keyframes charHappy {
          0%, 100% { transform: translateY(0) scale(1) rotate(0deg); }
          12% { transform: translateY(-6px) scale(1.04) rotate(-3deg); }
          25% { transform: translateY(-2px) scale(1.01) rotate(0deg); }
          37% { transform: translateY(-6px) scale(1.04) rotate(3deg); }
          50% { transform: translateY(-2px) scale(1.01) rotate(0deg); }
          62% { transform: translateY(-4px) scale(1.02) rotate(-2deg); }
          75% { transform: translateY(-1px) scale(1) rotate(0deg); }
          87% { transform: translateY(-4px) scale(1.02) rotate(2deg); }
        }
        @keyframes charChat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-2px) rotate(-2deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(-3px) rotate(2deg); }
        }
        @keyframes charIdle {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-3px); }
        }

        /* ═══════ 手臂动画 ═══════ */
        @keyframes handType {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes armSwingLeft {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          25% { transform: rotate(-25deg) translateY(-4px); }
          75% { transform: rotate(25deg) translateY(-2px); }
        }
        @keyframes armSwingRight {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          25% { transform: rotate(25deg) translateY(-4px); }
          75% { transform: rotate(-25deg) translateY(-2px); }
        }
        @keyframes armPumpLeft {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-6px) rotate(-15deg); }
          75% { transform: translateY(4px) rotate(10deg); }
        }
        @keyframes armPumpRight {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-6px) rotate(15deg); }
          75% { transform: translateY(4px) rotate(-10deg); }
        }
        @keyframes armLift {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          40% { transform: translateY(-8px) rotate(-10deg); }
          70% { transform: translateY(-4px) rotate(-5deg); }
        }
        @keyframes armWave {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          15% { transform: rotate(-20deg) translateY(-5px); }
          30% { transform: rotate(-10deg) translateY(-3px); }
          45% { transform: rotate(-20deg) translateY(-6px); }
          60% { transform: rotate(-5deg) translateY(-2px); }
          75% { transform: rotate(-20deg) translateY(-5px); }
        }

        /* ═══════ 腿部动画 ═══════ */
        @keyframes legStepLeft {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          25% { transform: rotate(-20deg) translateY(-3px); }
          75% { transform: rotate(20deg) translateY(-1px); }
        }
        @keyframes legStepRight {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          25% { transform: rotate(20deg) translateY(-3px); }
          75% { transform: rotate(-20deg) translateY(-1px); }
        }
        @keyframes legBendLeft {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          40% { transform: rotate(-15deg) translateY(-4px); }
          80% { transform: rotate(15deg) translateY(6px); }
        }
        @keyframes legBendRight {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          40% { transform: rotate(15deg) translateY(-4px); }
          80% { transform: rotate(-15deg) translateY(6px); }
        }

        /* ═══════ 眼部动画 ═══════ */
        @keyframes eyeBlink {
          0%, 88%, 100% { transform: scaleY(1); }
          94% { transform: scaleY(0.08); }
        }
        @keyframes eyeSleep {
          0%, 100% { transform: scaleY(0.15); }
        }
        @keyframes eyeSparkle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes eyeGlow {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes pupilMove {
          0%, 100% { transform: translateX(0); }
          30% { transform: translateX(-4px); }
          70% { transform: translateX(4px); }
        }
        @keyframes pupilDilate {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.85); }
        }

        /* ═══════ 表情动画 ═══════ */
        @keyframes blushPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.85; }
        }
        @keyframes mouthHappy {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.15); }
        }
        @keyframes mouthSleep {
          0%, 100% { transform: translateX(-50%) scale(1, 0.3); }
          30% { transform: translateX(-50%) scale(1.2, 0.4); }
          60% { transform: translateX(-50%) scale(0.9, 0.25); }
        }
        @keyframes mouthSip {
          0%, 100% { transform: translateX(-50%) scale(1); }
          30% { transform: translateX(-50%) scale(0.6, 0.9); }
          60% { transform: translateX(-50%) scale(1.1, 1.05); }
        }
        @keyframes mouthTalk {
          0%, 100% { transform: translateX(-50%) scale(1, 1); }
          15% { transform: translateX(-50%) scale(1.1, 0.7); }
          30% { transform: translateX(-50%) scale(0.9, 1.1); }
          50% { transform: translateX(-50%) scale(1.05, 0.65); }
          70% { transform: translateX(-50%) scale(0.95, 1.15); }
        }
        @keyframes mouthTremble {
          0%, 100% { transform: translateX(-50%) translateX(0); }
          20% { transform: translateX(-50%) translateX(2px); }
          40% { transform: translateX(-50%) translateX(-2px); }
          60% { transform: translateX(-50%) translateX(1px); }
          80% { transform: translateX(-50%) translateX(-1px); }
        }

        /* ═══════ 装饰动画 ═══════ */
        @keyframes ahogeBounce {
          0%, 100% { transform: translateX(-50%) rotate(-8deg); }
          20% { transform: translateX(-50%) rotate(-3deg) translateY(-3px); }
          40% { transform: translateX(-50%) rotate(-10deg) translateY(-1px); }
          60% { transform: translateX(-50%) rotate(-4deg) translateY(-3px); }
          80% { transform: translateX(-50%) rotate(-7deg) translateY(0); }
        }
        @keyframes hairShine {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes shadowBreath {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.7; }
          50% { transform: translateX(-50%) scale(1.1); opacity: 0.85; }
        }
        @keyframes pocketItemWiggle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-1px) rotate(5deg); }
          75% { transform: translateY(1px) rotate(-5deg); }
        }

        /* ═══════ 气泡/状态动画 ═══════ */
        @keyframes bubbleWork {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.12); }
        }
        @keyframes bubblePulse {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 1; }
          50% { transform: translateX(-50%) scale(1.18); opacity: 0.85; }
        }
        @keyframes bubbleShake {
          0%, 100% { transform: translateX(-50%) rotate(0deg); }
          15% { transform: translateX(-50%) rotate(-6deg); }
          30% { transform: translateX(-50%) rotate(6deg); }
          45% { transform: translateX(-50%) rotate(-4deg); }
          60% { transform: translateX(-50%) rotate(4deg); }
          75% { transform: translateX(-50%) rotate(-2deg); }
        }

        /* ═══════ 粒子/特效动画 ═══════ */
        @keyframes zzzFloat {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 1; }
          50% { transform: translateY(-12px) translateX(6px) scale(1.1); opacity: 0.7; }
          100% { transform: translateY(-24px) translateX(12px) scale(0.8); opacity: 0; }
        }
        @keyframes steamRise {
          0% { transform: translateY(0) scale(1); opacity: 0.7; }
          100% { transform: translateY(-24px) scale(0.6); opacity: 0; }
        }
        @keyframes particleFloat {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.9; }
          50% { transform: translateY(-15px) translateX(5px) scale(1.2); opacity: 0.6; }
          100% { transform: translateY(-30px) translateX(-5px) scale(0.8); opacity: 0; }
        }
        @keyframes confetti {
          0% { transform: translateY(0) translateX(0) rotate(0deg) scale(1); opacity: 1; }
          25% { transform: translateY(-15px) translateX(8px) rotate(90deg) scale(1.1); opacity: 0.8; }
          50% { transform: translateY(-25px) translateX(-5px) rotate(180deg) scale(0.9); opacity: 0.5; }
          75% { transform: translateY(-35px) translateX(10px) rotate(270deg) scale(1); opacity: 0.3; }
          100% { transform: translateY(-45px) translateX(-8px) rotate(360deg) scale(0.7); opacity: 0; }
        }
        @keyframes sweatDrop {
          0% { transform: translateY(0) scale(1); opacity: 0.8; }
          100% { transform: translateY(20px) scale(0.5); opacity: 0; }
        }
        @keyframes starSparkle {
          0%, 100% { opacity: 0.6; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.3); }
        }

        /* ═══════ 场景元素动画 ═══════ */
        @keyframes plantSway {
          0%, 100% { transform: translateX(-50%) rotate(0deg); }
          15% { transform: translateX(-50%) rotate(6deg); }
          35% { transform: translateX(-50%) rotate(-5deg); }
          50% { transform: translateX(-50%) rotate(4deg); }
          65% { transform: translateX(-50%) rotate(-6deg); }
          85% { transform: translateX(-50%) rotate(3deg); }
        }
        @keyframes starTwinkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.15); }
        }
        @keyframes treadmillBelt {
          0% { background-position: 0 0; }
          100% { background-position: 40px 0; }
        }
        @keyframes floatScreensaver {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
          25% { transform: translateY(-12px) translateX(6px) rotate(15deg); }
          50% { transform: translateY(-6px) translateX(-4px) rotate(-10deg); }
          75% { transform: translateY(-16px) translateX(-8px) rotate(5deg); }
        }
        @keyframes checkmarkPop {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          60% { transform: scale(1.3) rotate(5deg); opacity: 1; }
          80% { transform: scale(0.9) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes errorShake {
          0%, 100% { transform: translateX(0); }
          10% { transform: translateX(-6px); }
          30% { transform: translateX(6px); }
          50% { transform: translateX(-4px); }
          70% { transform: translateX(4px); }
          90% { transform: translateX(-2px); }
        }
        @keyframes keyPress {
          0%, 100% { transform: translateY(0); }
          40% { transform: translateY(-3px); }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }

        /* ═══════ 场景装饰动画 ═══════ */
        @keyframes sunGlow {
          0%, 100% { box-shadow: 0 0 20px 4px rgba(255,200,0,0.4); transform: scale(1); }
          50% { box-shadow: 0 0 30px 8px rgba(255,200,0,0.6); transform: scale(1.1); }
        }
        @keyframes cloudDrift {
          0% { transform: translateX(0); }
          100% { transform: translateX(-80px); }
        }
      `}</style>
    </div>
  )
}
