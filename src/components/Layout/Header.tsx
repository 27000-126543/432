import React from 'react'
import { useGameStore } from '@/store/gameStore'
import type { WeatherType } from '@/types'

interface HeaderProps {
  onToggleNotification: () => void
  unreadCount: number
}

const weatherMap: Record<WeatherType, { label: string; icon: string; color: string }> = {
  sunny: { label: '晴天', icon: '☀️', color: 'text-yellow-400' },
  cloudy: { label: '多云', icon: '⛅', color: 'text-slate-300' },
  rainy: { label: '雨天', icon: '🌧️', color: 'text-blue-400' },
  stormy: { label: '风暴', icon: '⛈️', color: 'text-purple-400' },
  windy: { label: '大风', icon: '💨', color: 'text-cyan-400' },
  foggy: { label: '雾霾', icon: '🌫️', color: 'text-gray-400' },
}

const formatNumber = (num: number): string => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K'
  return Math.floor(num).toLocaleString()
}

const Header: React.FC<HeaderProps> = ({ onToggleNotification, unreadCount }) => {
  const currentPlayer = useGameStore((s) => s.currentPlayer)
  const weather = useGameStore((s) => s.weather)
  const currentPrice = useGameStore((s) => s.currentPrice)
  const priceChange24h = useGameStore((s) => s.priceChange24h)

  const weatherInfo = weatherMap[weather.current]
  const isPriceUp = priceChange24h >= 0

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-700 px-6 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-4 py-2">
          <span className={`text-xl ${weatherInfo.color}`}>{weatherInfo.icon}</span>
          <div>
            <p className="text-xs text-slate-400">天气</p>
            <p className="text-sm font-medium text-white">{weatherInfo.label}</p>
          </div>
          <div className="w-px h-8 bg-slate-600 mx-2" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-slate-500">风速:</span>
              <span className="text-slate-300">{weather.windSpeed.toFixed(1)}m/s</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">温度:</span>
              <span className="text-slate-300">{weather.temperature.toFixed(0)}°C</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">湿度:</span>
              <span className="text-slate-300">{(weather.humidity * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">魔力密度:</span>
              <span className="text-indigo-300">{(weather.manaDensity * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-800 rounded-lg px-4 py-2">
          <span className="text-xl">💠</span>
          <div>
            <p className="text-xs text-slate-400">当前价格</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">
                {currentPrice.toFixed(2)}
                <span className="text-xs text-slate-400 font-normal ml-1">金币/魔力</span>
              </span>
              <span
                className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                  isPriceUp
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {isPriceUp ? '▲' : '▼'} {Math.abs(priceChange24h * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-4 bg-slate-800 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <div>
              <p className="text-xs text-slate-400">金币</p>
              <p className="text-sm font-semibold text-yellow-400">
                {formatNumber(currentPlayer.gold)}
              </p>
            </div>
          </div>

          <div className="w-px h-8 bg-slate-600" />

          <div className="flex items-center gap-2">
            <span className="text-xl">🔮</span>
            <div>
              <p className="text-xs text-slate-400">魔力代币</p>
              <p className="text-sm font-semibold text-indigo-400">
                {formatNumber(currentPlayer.manaTokens)}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onToggleNotification}
          className="relative w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
        >
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-3 bg-slate-800 rounded-lg pl-2 pr-4 py-1.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
            {currentPlayer.avatar || currentPlayer.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{currentPlayer.name}</p>
            <p className="text-xs text-slate-400">
              Lv.{currentPlayer.level} · 声望 {currentPlayer.reputation.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
