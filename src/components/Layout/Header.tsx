'use client'

import { Bell, Search, User, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function Header() {
  const [showMenu, setShowMenu] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setShowMenu(false);
  };

  return (
    <header
      className="h-14 px-6 flex items-center justify-between sticky top-0 z-40"
      style={{
        background: 'linear-gradient(180deg, rgba(6,9,24,0.98) 0%, rgba(6,9,24,0.92) 100%)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(56, 189, 248, 0.06)',
      }}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索模型、API..."
            className="pl-9 pr-4 py-1.5 w-64 text-sm rounded-lg transition-all duration-200
              bg-white/[0.04] border border-white/[0.06] text-slate-300 placeholder-slate-500
              focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/30
              hover:border-white/10"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* 状态指示 */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/5 border border-emerald-500/10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-pulse" />
          <span className="text-[11px] text-emerald-400/80 font-medium">运行中</span>
        </div>

        {/* 通知 */}
        <button className="relative p-1.5 text-slate-400 hover:text-sky-400 hover:bg-white/[0.04] rounded-lg transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 pl-3 border-l border-white/[0.06] hover:bg-white/[0.04] rounded-lg transition-all py-1.5 pr-2"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/15 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-slate-300">{user?.name || '用户'}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 rounded-xl overflow-hidden z-50"
                style={{
                  background: 'rgba(15, 23, 42, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(56, 189, 248, 0.15)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                }}
              >
                <div className="px-4 py-3 border-b border-sky-500/10">
                  <p className="text-sm font-medium text-slate-200">{user?.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{user?.role === 'admin' ? '管理员' : '用户'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
