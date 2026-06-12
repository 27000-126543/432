import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import dayjs from 'dayjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toFixed(0)
}

const formatTime = (ts: number) => {
  const diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return Math.floor(diff / 86400000) + '天前'
}

const StatCard = ({
  icon,
  label,
  value,
  change,
  changeLabel,
  color,
}: {
  icon: string
  label: string
  value: string
  change?: number
  changeLabel?: string
  color: string
}) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
        style={{ backgroundColor: color + '15' }}
      >
        {icon}
      </div>
      {change !== undefined && (
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}
        >
          {change >= 0 ? '↑' : '↓'} {Math.abs(change * 100).toFixed(1)}%
          {changeLabel && ` ${changeLabel}`}
        </span>
      )}
    </div>
    <div className="text-2xl font-bold text-slate-800 mb-1">{value}</div>
    <div className="text-sm text-slate-500">{label}</div>
  </div>
)

export default function DashboardPage() {
  const {
    stats,
    priceHistory,
    heatmapCells,
    gridEvents,
    trades,
    gridRegions,
  } = useGameStore()

  const priceChartData = useMemo(() => {
    const last48 = priceHistory.slice(-48)
    return {
      labels: last48.map((p) => dayjs(p.timestamp).format('HH:mm')),
      datasets: [
        {
          label: '价格 (金币/魔力)',
          data: last48.map((p) => p.price),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    }
  }, [priceHistory])

  const priceChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', maxTicksLimit: 8 },
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: { color: '#94a3b8' },
      },
    },
  }

  const heatmapSize = 20
  const maxDensity = useMemo(() => {
    return Math.max(...heatmapCells.map((c) => c.density), 1)
  }, [heatmapCells])

  const recentEvents = gridEvents.slice(0, 5)
  const recentTrades = trades.slice(0, 5)

  const statCards = [
    {
      icon: '⚡',
      label: '总发电量',
      value: formatNumber(stats.totalGenerated) + ' MWh',
      color: '#0ea5e9',
    },
    {
      icon: '🔋',
      label: '总消耗量',
      value: formatNumber(stats.totalConsumed) + ' MWh',
      color: '#8b5cf6',
    },
    {
      icon: '💰',
      label: '当前价格',
      value: stats.currentPrice.toFixed(1) + ' 金币',
      change: stats.priceChange24h,
      changeLabel: '24h',
      color: '#f59e0b',
    },
    {
      icon: '🏭',
      label: '活跃设施',
      value: formatNumber(stats.activeFacilities) + ' 座',
      color: '#22c55e',
    },
    {
      icon: '👥',
      label: '在线玩家',
      value: formatNumber(stats.activePlayers) + ' 人',
      color: '#ec4899',
    },
    {
      icon: '📊',
      label: '24h交易量',
      value: formatNumber(stats.totalVolume24h) + ' 金币',
      color: '#14b8a6',
    },
    {
      icon: '🛡️',
      label: '电网稳定性',
      value: (stats.gridStability * 100).toFixed(1) + '%',
      color: '#06b6d4',
    },
    {
      icon: '⚠️',
      label: '平均损耗率',
      value: (stats.avgLossRate * 100).toFixed(2) + '%',
      color: '#ef4444',
    },
  ]

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">能源控制台</h1>
          <p className="text-sm text-slate-500 mt-1">实时监控整个魔能电网的运行状态</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-sm font-medium rounded-full">
            ● 系统正常
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <StatCard key={idx} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">价格走势</h3>
              <p className="text-sm text-slate-500">过去24小时魔力代币价格变化</p>
            </div>
            <div className="flex gap-2">
              {['1h', '6h', '24h', '7d'].map((t, i) => (
                <button
                  key={t}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    i === 2
                      ? 'bg-indigo-50 text-indigo-600 font-medium'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div id="price-chart-container" style={{ height: 280 }}>
            <Line data={priceChartData} options={priceChartOptions} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-800">供需热力图</h3>
            <p className="text-sm text-slate-500">区域能源密度分布</p>
          </div>
          <div
            className="grid gap-0.5 mx-auto"
            style={{
              gridTemplateColumns: `repeat(${heatmapSize}, 1fr)`,
              width: '100%',
              maxWidth: 280,
              aspectRatio: '1',
            }}
          >
            {Array.from({ length: heatmapSize * heatmapSize }).map((_, i) => {
              const x = i % heatmapSize
              const y = Math.floor(i / heatmapSize)
              const cell = heatmapCells.find((c) => c.x === x && c.y === y)
              const intensity = cell ? cell.density / maxDensity : 0
              const hue = 200 - intensity * 160
              return (
                <div
                  key={i}
                  className="rounded-[2px] transition-all hover:scale-110"
                  style={{
                    backgroundColor: `hsla(${hue}, 70%, 50%, ${0.15 + intensity * 0.85})`,
                  }}
                  title={
                    cell
                      ? `供应: ${cell.supply}, 需求: ${cell.demand}`
                      : undefined
                  }
                />
              )
            })}
          </div>
          <div className="flex justify-between mt-4 text-xs text-slate-500">
            <span>低需求</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-cyan-200" />
              <div className="w-3 h-3 rounded bg-cyan-400" />
              <div className="w-3 h-3 rounded bg-amber-400" />
              <div className="w-3 h-3 rounded bg-rose-500" />
            </div>
            <span>高需求</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">最近事件</h3>
              <p className="text-sm text-slate-500">电网突发事件监控</p>
            </div>
            <span className="text-xs text-slate-400">{gridEvents.length} 条</span>
          </div>
          <div className="space-y-3">
            {recentEvents.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                暂无事件，系统运行平稳
              </div>
            ) : (
              recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{
                      backgroundColor: `hsl(${(event.severity * 40) % 360}, 70%, 95%)`,
                    }}
                  >
                    {event.type === 'energy_overload' && '⚡'}
                    {event.type === 'mana_tide' && '🌊'}
                    {event.type === 'storm' && '🌪️'}
                    {event.type === 'energy_theft' && '🥷'}
                    {event.type === 'efficiency_boost' && '✨'}
                    {event.type === 'price_surge' && '📈'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 text-sm">
                        {event.type === 'energy_overload' && '能源过载'}
                        {event.type === 'mana_tide' && '魔力潮汐'}
                        {event.type === 'storm' && '魔法风暴'}
                        {event.type === 'energy_theft' && '窃能事件'}
                        {event.type === 'efficiency_boost' && '效率提升'}
                        {event.type === 'price_surge' && '价格震荡'}
                      </span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          event.severity >= 4
                            ? 'bg-rose-100 text-rose-700'
                            : event.severity >= 2
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        Lv.{event.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {event.description}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {formatTime(event.startTime)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">最近交易</h3>
              <p className="text-sm text-slate-500">最新成交记录</p>
            </div>
            <span className="text-xs text-slate-400">{trades.length} 条</span>
          </div>
          <div className="space-y-2">
            {recentTrades.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                暂无交易记录
              </div>
            ) : (
              recentTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-lg">
                      💎
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">
                        {trade.amount.toLocaleString()} 魔力
                      </div>
                      <div className="text-xs text-slate-500">
                        @ {trade.price.toFixed(1)} 金币
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-800">
                      {(trade.amount * trade.price).toLocaleString()} 金币
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatTime(trade.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-800">区域概览</h3>
          <p className="text-sm text-slate-500">各供电区供需情况</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {gridRegions.slice(0, 10).map((region) => {
            const ratio = region.totalSupply / Math.max(region.totalDemand, 1)
            const health = ratio >= 1.1 ? 'good' : ratio >= 0.9 ? 'warn' : 'bad'
            return (
              <div
                key={region.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-800 truncate">
                    {region.name}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      health === 'good'
                        ? 'bg-emerald-500'
                        : health === 'warn'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="text-slate-500">供应</div>
                  <div className="text-right text-slate-700 font-medium">
                    {formatNumber(region.totalSupply)}
                  </div>
                  <div className="text-slate-500">需求</div>
                  <div className="text-right text-slate-700 font-medium">
                    {formatNumber(region.totalDemand)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
