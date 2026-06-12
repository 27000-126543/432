import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'gold'
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-white/10 text-white/80 border border-white/20',
  success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  danger: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
  info: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  gold: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
}) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]}`}
    >
      {children}
    </span>
  )
}

export default Badge
