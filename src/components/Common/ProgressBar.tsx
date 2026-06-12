import React from 'react'

interface ProgressBarProps {
  value: number
  max?: number
  color?: string
  showLabel?: boolean
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-4',
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = '#a855f7',
  showLabel = false,
  label,
  size = 'md',
}) => {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))
  const displayLabel = label ?? `${value} / ${max}`

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          {label ? (
            <span className="text-xs font-medium text-white/70">{label}</span>
          ) : (
            <span className="text-xs font-medium text-white/70">{displayLabel}</span>
          )}
          <span className="text-xs font-semibold text-white/90">
            {percent.toFixed(0)}%
          </span>
        </div>
      )}
      <div className={`w-full rounded-full overflow-hidden bg-white/10 ${sizeMap[size]}`}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percent}%`,
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}80`,
          }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
