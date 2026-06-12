import React from 'react'

interface StatCardProps {
  icon: string
  label: string
  value: string
  change?: number
  color?: string
  subtitle?: string
  onClick?: () => void
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  change,
  color = '#a855f7',
  subtitle,
  onClick,
}) => {
  const isPositive = (change ?? 0) >= 0

  return (
    <div
      onClick={onClick}
      className={`stat-card ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{
            backgroundColor: `${color}20`,
            boxShadow: `0 0 15px ${color}30`,
          }}
        >
          {icon}
        </div>
        {change !== undefined && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              isPositive
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/20 text-rose-400'
            }`}
          >
            {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="text-sm text-white/60 mb-1">{label}</div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      {subtitle && <div className="text-xs text-white/40">{subtitle}</div>}
    </div>
  )
}

export default StatCard
