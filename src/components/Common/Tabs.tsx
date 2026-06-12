import React from 'react'

interface TabItem {
  key: string
  label: string
  icon?: string
}

interface TabsProps {
  tabs: TabItem[]
  activeKey: string
  onChange: (key: string) => void
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeKey, onChange }) => {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex-1 min-w-0 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-purple-500/40 to-pink-500/40 text-white border border-purple-500/40 shadow-lg shadow-purple-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.icon && <span className="text-base">{tab.icon}</span>}
            <span className="truncate">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default Tabs
