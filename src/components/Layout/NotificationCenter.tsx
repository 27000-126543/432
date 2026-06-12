import React from 'react'
import { useGameStore } from '@/store/gameStore'
import type { Notification } from '@/types'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

const typeConfig: Record<
  Notification['type'],
  { bg: string; icon: string; label: string; badge: string }
> = {
  info: {
    bg: 'bg-blue-500/10 border-blue-500/30',
    icon: 'ℹ️',
    label: '信息',
    badge: 'bg-blue-500',
  },
  success: {
    bg: 'bg-green-500/10 border-green-500/30',
    icon: '✅',
    label: '成功',
    badge: 'bg-green-500',
  },
  warning: {
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    icon: '⚠️',
    label: '警告',
    badge: 'bg-yellow-500',
  },
  error: {
    bg: 'bg-red-500/10 border-red-500/30',
    icon: '❌',
    label: '错误',
    badge: 'bg-red-500',
  },
  event: {
    bg: 'bg-purple-500/10 border-purple-500/30',
    icon: '⚡',
    label: '事件',
    badge: 'bg-purple-500',
  },
}

const formatTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const notifications = useGameStore((s) => s.notifications)
  const markNotificationRead = useGameStore((s) => s.actions.markNotificationRead)
  const markAllNotificationsRead = useGameStore((s) => s.actions.markAllNotificationsRead)

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleItemClick = (notification: Notification) => {
    if (!notification.read) {
      markNotificationRead(notification.id)
    }
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed top-0 right-0 h-screen w-96 bg-slate-900 border-l border-slate-700 shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🔔</span> 通知中心
                {unreadCount > 0 && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500 text-white">
                    {unreadCount} 未读
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                共 {notifications.length} 条通知
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsRead}
                  className="px-3 py-1.5 text-xs font-medium text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                >
                  全部已读
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex border-b border-slate-700 px-4">
            {(['all', 'unread', 'event', 'warning', 'error'] as const).map((tab) => {
              const labels: Record<string, string> = {
                all: '全部',
                unread: '未读',
                event: '事件',
                warning: '警告',
                error: '错误',
              }
              const count =
                tab === 'all'
                  ? notifications.length
                  : tab === 'unread'
                  ? unreadCount
                  : notifications.filter((n) => n.type === tab).length
              return (
                <button
                  key={tab}
                  className="px-4 py-3 text-sm font-medium text-slate-400 hover:text-white border-b-2 border-transparent hover:border-slate-500 transition-colors whitespace-nowrap"
                >
                  {labels[tab]}
                  {count > 0 && (
                    <span className="ml-1 text-xs text-slate-500">({count})</span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <span className="text-5xl mb-4">📭</span>
                <p className="text-sm">暂无通知</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const config = typeConfig[notification.type]
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleItemClick(notification)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
                      config.bg
                    } ${!notification.read ? 'ring-1 ring-indigo-500/50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <span className="text-lg">{config.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-white truncate">
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded text-white ${config.badge}`}
                            >
                              {config.label}
                            </span>
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default NotificationCenter
