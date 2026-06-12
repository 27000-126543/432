import { useState, useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { Line, Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js'
import dayjs from 'dayjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Title,
  Tooltip,
  Legend
)

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toFixed(0)
}

const StatCard = ({
  icon,
  label,
  value,
  change,
  color,
}: {
  icon: string
  label: string
  value: string
  change?: number
  color: string
}) => (
  <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-2">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
        style={{ backgroundColor: color + '15', color }}
      >
        {icon}
      </div>
      {change !== undefined && (
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}
        >
          {change >= 0 ? '↑' : '↓'} {(Math.abs(change) * 100).toFixed(1)}%
        </span>
      )}
    </div>
    <div className="text-xl font-bold text-slate-800 mb-0.5">{value}</div>
    <div className="text-xs text-slate-500">{label}</div>
  </div>
)

export default function ReportPage() {
  const { stats, priceHistory, supplyDemandSnapshots, currentPlayer, playerFacilities, guilds, actions } = useGameStore()
  const [options, setOptions] = useState({
    playerInfo: true,
    priceChart: true,
    supplyDemandChart: true,
    radarChart: true,
    summary: true,
    facilities: true,
    leaderboard: true,
    guild: true,
  })
  const [isExporting, setIsExporting] = useState(false)

  const priceChartData = useMemo(() => {
    const pointsPerDay = 48
    const days7 = priceHistory.slice(-pointsPerDay * 7)
    const step = Math.max(1, Math.floor(days7.length / 28))
    const sampled = days7.filter((_, i) => i % step === 0)

    return {
      labels: sampled.map((p) => dayjs(p.timestamp).format('MM/DD HH:mm')),
      datasets: [
        {
          label: '价格 (金币/魔力)',
          data: sampled.map((p) => p.price),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 5,
          pointBackgroundColor: '#6366f1',
          borderWidth: 2,
        },
      ],
    }
  }, [priceHistory])

  const priceChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: '7天价格走势',
        align: 'start' as const,
        font: { size: 14, weight: 'bold' as const },
        color: '#1e293b',
        padding: { bottom: 16 },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', maxTicksLimit: 7, font: { size: 10 } },
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: { color: '#94a3b8', font: { size: 10 } },
      },
    },
  }

  const supplyDemandChartData = useMemo(() => {
    const snapshots = supplyDemandSnapshots.slice(-50)
    const labels = snapshots.map((s) => dayjs(s.timestamp).format('HH:mm'))
    const supplyData = snapshots.map((s) => s.supply)
    const demandData = snapshots.map((s) => s.demand)

    return {
      labels,
      datasets: [
        {
          label: '能源供应',
          data: supplyData,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.08)',
          yAxisID: 'y',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: '能源需求',
          data: demandData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          yAxisID: 'y',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    }
  }, [supplyDemandSnapshots])

  const supplyDemandChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 11 },
          color: '#64748b',
          padding: 16,
        },
      },
      title: {
        display: true,
        text: '供需关系曲线',
        align: 'start' as const,
        font: { size: 14, weight: 'bold' as const },
        color: '#1e293b',
        padding: { bottom: 16 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatNumber(ctx.parsed.y ?? 0)} MWh`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', maxTicksLimit: 8, font: { size: 10 } },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: { color: '#f1f5f9' },
        ticks: {
          color: '#94a3b8',
          font: { size: 10 },
          callback: (v) => formatNumber(Number(v)),
        },
      },
    },
  }

  const radarChartData = useMemo(() => {
    const totalGeneration = currentPlayer.totalGenerated
    const avgEfficiency =
      playerFacilities.length > 0
        ? playerFacilities.reduce((s, f) => s + f.efficiency, 0) / playerFacilities.length
        : 0
    const facilitiesCount = playerFacilities.length
    const tradingVolume = currentPlayer.totalTraded
    const gridStabilityScore = stats.gridStability * 100
    const playerGuild = guilds.find((g) => g.id === currentPlayer.guildId)
    const guildContribution = playerGuild
      ? Math.min(100, (playerGuild.totalContribution / 1000000) * 100)
      : 0

    const normalize = (val: number, max: number) => Math.min(100, (val / max) * 100)

    return {
      labels: ['发电量', '效率', '设施数', '交易量', '电网稳定性', '公会贡献'],
      datasets: [
        {
          label: '我的能力值',
          data: [
            normalize(totalGeneration, 10000000),
            avgEfficiency * 100,
            normalize(facilitiesCount, 50),
            normalize(tradingVolume, 10000),
            gridStabilityScore,
            guildContribution,
          ],
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: '#6366f1',
          borderWidth: 2,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#6366f1',
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    }
  }, [currentPlayer, playerFacilities, stats.gridStability, guilds])

  const radarChartOptions: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: '综合能力雷达图',
        align: 'start' as const,
        font: { size: 14, weight: 'bold' as const },
        color: '#1e293b',
        padding: { bottom: 16 },
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        beginAtZero: true,
        ticks: {
          stepSize: 20,
          font: { size: 9 },
          color: '#94a3b8',
          backdropColor: 'transparent',
        },
        grid: {
          color: '#e2e8f0',
        },
        angleLines: {
          color: '#e2e8f0',
        },
        pointLabels: {
          font: { size: 11, weight: 500 },
          color: '#475569',
        },
      },
    },
  }

  const statCards = [
    {
      icon: '💰',
      label: '当前价格',
      value: stats.currentPrice.toFixed(1) + ' 金币',
      change: stats.priceChange24h,
      color: '#f59e0b',
    },
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
      icon: '🏭',
      label: '活跃设施',
      value: formatNumber(stats.activeFacilities) + ' 座',
      color: '#22c55e',
    },
    {
      icon: '📊',
      label: '24h交易笔数',
      value: formatNumber(stats.totalTrades24h) + ' 笔',
      color: '#14b8a6',
    },
    {
      icon: '💎',
      label: '24h交易额',
      value: formatNumber(stats.totalVolume24h) + ' 金币',
      color: '#ec4899',
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

  const toggleOption = (key: keyof typeof options) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const optionLabels: { key: keyof typeof options; label: string; icon: string }[] = [
    { key: 'playerInfo', label: '玩家概况', icon: '👤' },
    { key: 'priceChart', label: '价格走势图', icon: '📈' },
    { key: 'supplyDemandChart', label: '供需曲线图', icon: '📊' },
    { key: 'radarChart', label: '能力雷达图', icon: '🎯' },
    { key: 'summary', label: '数据摘要', icon: '📋' },
    { key: 'facilities', label: '设施清单', icon: '🏭' },
    { key: 'leaderboard', label: '排行榜信息', icon: '🏆' },
    { key: 'guild', label: '公会信息', icon: '🛡️' },
  ]

  const hasAnyOption = Object.values(options).some(Boolean)

  const handleExport = async () => {
    if (!hasAnyOption) return
    setIsExporting(true)
    try {
      await actions.exportReport(options)
    } catch (e) {
      console.error('Export failed:', e)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">报告导出中心</h1>
          <p className="text-sm text-slate-500 mt-1">
            生成完整的能源运营分析报告，包含图表、数据和排名信息，一键导出为PDF文件
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {statCards.map((card, idx) => (
            <StatCard key={idx} {...card} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div
            id="price-chart-container"
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5"
          >
            <div style={{ height: 280 }}>
              <Line data={priceChartData} options={priceChartOptions} />
            </div>
          </div>

          <div
            id="supply-demand-chart-container"
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5"
          >
            <div style={{ height: 280 }}>
              <Line data={supplyDemandChartData} options={supplyDemandChartOptions} />
            </div>
          </div>
        </div>

        <div
          id="radar-chart-container"
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div style={{ height: 340 }}>
              <Radar data={radarChartData} options={radarChartOptions} />
            </div>
            <div className="space-y-3">
              <h4 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <span>🎯</span>
                <span>能力维度解析</span>
              </h4>
              <div className="space-y-2.5">
                {[
                  { label: '发电量', score: radarChartData.datasets[0].data[0], color: '#0ea5e9', desc: '历史累计发电总量' },
                  { label: '效率', score: radarChartData.datasets[0].data[1], color: '#22c55e', desc: '设施平均运行效率' },
                  { label: '设施数', score: radarChartData.datasets[0].data[2], color: '#8b5cf6', desc: '拥有的发电设施数量' },
                  { label: '交易量', score: radarChartData.datasets[0].data[3], color: '#f59e0b', desc: '历史交易总次数' },
                  { label: '电网稳定性', score: radarChartData.datasets[0].data[4], color: '#06b6d4', desc: '所在区域电网稳定度' },
                  { label: '公会贡献', score: radarChartData.datasets[0].data[5], color: '#ec4899', desc: '对公会的资源贡献' },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700">{item.label}</span>
                      <span className="text-sm font-bold" style={{ color: item.color }}>
                        {item.score.toFixed(1)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${item.score}%`, backgroundColor: item.color }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 lg:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <span>📄</span>
                <span>导出选项</span>
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                选择需要包含在报告中的内容模块
              </p>
            </div>
            <span className="text-xs text-slate-400">
              已选 {Object.values(options).filter(Boolean).length} / {Object.keys(options).length}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {optionLabels.map(({ key, label, icon }) => (
              <label
                key={key}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  options[key]
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options[key]}
                  onChange={() => toggleOption(key)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg flex-shrink-0">{icon}</span>
                  <span className={`text-sm font-medium truncate ${options[key] ? 'text-indigo-700' : 'text-slate-700'}`}>
                    {label}
                  </span>
                </div>
              </label>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4 border-t border-slate-100">
            <div className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <span className="text-2xl">💡</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-amber-800">导出提示</p>
                <p className="text-xs text-amber-700 truncate">
                  报告将使用当前数据快照生成，包含选中模块的图表和统计信息
                </p>
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting || !hasAnyOption}
              className={`px-8 py-3.5 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                isExporting || !hasAnyOption
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-indigo-500/25 hover:shadow-indigo-500/40'
              }`}
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>正在生成报告...</span>
                </>
              ) : (
                <>
                  <span className="text-lg">📥</span>
                  <span>生成 PDF 报告</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
