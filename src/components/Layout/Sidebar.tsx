import React from 'react'

export type PageKey =
  | 'dashboard'
  | 'facilities'
  | 'exchange'
  | 'grid'
  | 'guild'
  | 'leaderboard'
  | 'report'

interface SidebarProps {
  currentPage: PageKey
  onPageChange: (page: PageKey) => void
}

const menuItems: { key: PageKey; label: string; icon: string }[] = [
  { key: 'dashboard', label: '仪表盘', icon: '📊' },
  { key: 'facilities', label: '能源设施', icon: '⚡' },
  { key: 'exchange', label: '交易所', icon: '💱' },
  { key: 'grid', label: '电网', icon: '🔌' },
  { key: 'guild', label: '公会', icon: '🏰' },
  { key: 'leaderboard', label: '排行榜', icon: '🏆' },
  { key: 'report', label: '报告导出', icon: '📄' },
]

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  return (
    <aside className="w-64 h-screen bg-slate-900 border-r border-slate-700 flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          魔力能源交易所
        </h1>
        <p className="text-xs text-slate-400 mt-1">Magic Energy Exchange</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = currentPage === item.key
          return (
            <button
              key={item.key}
              onClick={() => onPageChange(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-2">系统状态</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-slate-200">服务运行中</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
