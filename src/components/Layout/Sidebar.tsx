import { 
  LayoutDashboard, 
  Layers, 
  Wallet, 
  Settings, 
  BarChart3,
  Package, 
  Users,
  ChevronLeft,
  ChevronRight,
  Wand2,
  BookOpen,
  Plug,
  Bot,
  Zap,
  Store,
  Monitor
} from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  activeItem: string
  onItemClick: (item: string) => void
  role?: string
}

const commonMenuItems = [
  { id: 'agents', icon: Bot, label: '天翼智脑' },
  { id: 'dashboard', icon: LayoutDashboard, label: '仪表盘' },
  { id: 'compare', icon: Store, label: 'Agent市场' },
  { id: 'office', icon: Monitor, label: '员工实况' },
  { id: 'models', icon: Layers, label: '模型市场' },
  { id: 'skills', icon: Wand2, label: '技能资产库' },
  { id: 'kb', icon: BookOpen, label: '知识库' },
  { id: 'mcp', icon: Plug, label: 'MCP管理' },
  { id: 'api', icon: Package, label: 'API文档' },
  { id: 'billing', icon: Wallet, label: '用量看板' },
]

const adminMenuItems = [
  { id: 'nodes', icon: BarChart3, label: '节点监控' },
  { id: 'users', icon: Users, label: '用户管理' },
  { id: 'settings', icon: Settings, label: '系统设置' },
]

export default function Sidebar({ collapsed, onToggle, activeItem, onItemClick, role = 'user' }: SidebarProps) {
  return (
    <aside 
      className={`fixed left-0 top-0 h-screen transition-all duration-300 z-50 ${
        collapsed ? 'w-16' : 'w-[220px]'
      }`}
      style={{
        background: 'linear-gradient(180deg, rgba(8,12,22,0.99) 0%, rgba(12,18,32,0.97) 50%, rgba(8,12,22,0.99) 100%)',
        backdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(56, 189, 248, 0.06)',
      }}
    >
      <div className="h-full flex flex-col">
        {/* Logo */}
        <div className={`flex items-center h-14 px-4 border-b border-white/[0.04] ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30 relative">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 opacity-50 blur-sm" />
            <Zap className="w-4 h-4 text-white relative z-10" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-bold text-[15px] bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">翼站Token超市</span>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          <ul className="space-y-0 px-2">
            {commonMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeItem === item.id
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onItemClick(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-sky-500/10 text-sky-400'
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-300'
                    } ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-sky-400 rounded-full" />
                    )}
                    <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${
                      isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-400'
                    }`} />
                    {!collapsed && (
                      <span className="text-[13px] font-medium">
                        {item.label}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>

          {role === 'admin' && (
            <>
              <div className="mx-3 my-2 border-t border-white/[0.04]" />
              <div className="px-3 mb-1">
                <span className={`text-[10px] font-semibold uppercase tracking-wider text-slate-600 ${collapsed ? 'hidden' : ''}`}>
                  管理
                </span>
              </div>
              <ul className="space-y-0 px-2">
                {adminMenuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeItem === item.id
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => onItemClick(item.id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-all duration-200 group relative ${
                          isActive
                            ? 'bg-sky-500/10 text-sky-400'
                            : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-400'
                        } ${collapsed ? 'justify-center' : ''}`}
                        title={collapsed ? item.label : undefined}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-sky-400 rounded-full" />
                        )}
                        <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${
                          isActive ? 'text-sky-400' : 'text-slate-500'
                        }`} />
                        {!collapsed && (
                          <span className="text-[13px] font-medium">
                            {item.label}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </nav>

        <div className="border-t border-white/[0.04] p-1.5">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center py-2 text-slate-600 hover:text-slate-400 hover:bg-white/[0.04] rounded-md transition-all"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </aside>
  )
}
