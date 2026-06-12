import { useState, useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { formatNumber, formatPercent, formatDuration } from '@/utils'
import { EVENT_CONFIG, TERRAIN_CONFIG, FACILITY_CONFIG } from '@/constants'
import type { GridLine, LineStatus } from '@/types'

const GRID_WIDTH = 800
const GRID_HEIGHT = 600
const HEATMAP_SIZE = 20
const CELL_W = GRID_WIDTH / HEATMAP_SIZE
const CELL_H = GRID_HEIGHT / HEATMAP_SIZE

const densityToColor = (density: number): string => {
  const d = Math.min(100, Math.max(0, density)) / 100
  const r = Math.floor(30 + d * 200)
  const g = Math.floor(80 + (1 - d) * 120)
  const b = Math.floor(180 + (1 - d) * 40)
  return `rgba(${r}, ${g}, ${b}, ${0.15 + d * 0.4})`
}

const formatRemaining = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes > 0) {
    return `${minutes}分${seconds.toString().padStart(2, '0')}秒`
  }
  return `${seconds}秒`
}

const statusColor: Record<LineStatus, string> = {
  normal: '#22c55e',
  damaged: '#f59e0b',
  critical: '#ef4444',
  destroyed: '#6b7280',
}

const statusLabel: Record<LineStatus, string> = {
  normal: '正常',
  damaged: '受损',
  critical: '危险',
  destroyed: '损毁',
}

const GridPage = () => {
  const gridRegions = useGameStore(state => state.gridRegions)
  const gridLines = useGameStore(state => state.gridLines)
  const gridEvents = useGameStore(state => state.gridEvents)
  const heatmapCells = useGameStore(state => state.heatmapCells)
  const allFacilities = useGameStore(state => state.allFacilities)
  const stats = useGameStore(state => state.stats)
  const reinforceGridLine = useGameStore(state => state.actions.reinforceGridLine)
  const dispatchRepairTeam = useGameStore(state => state.actions.dispatchRepairTeam)

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)

  const regionMap = useMemo(() => {
    const m = new Map<string, typeof gridRegions[0]>()
    gridRegions.forEach(r => m.set(r.id, r))
    return m
  }, [gridRegions])

  const lineRegionPairs = useMemo(() => {
    return gridLines.map(line => ({
      line,
      from: regionMap.get(line.fromRegionId),
      to: regionMap.get(line.toRegionId),
    })).filter(p => p.from && p.to)
  }, [gridLines, regionMap])

  const activeEvents = useMemo(
    () => gridEvents.filter(e => e.isActive && e.endTime > Date.now()),
    [gridEvents]
  )

  const now = Date.now()

  const getFacilityIcon = (type: string) => FACILITY_CONFIG[type as keyof typeof FACILITY_CONFIG]?.icon || '⚡'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 lg:p-6">
      <div className="max-w-[1920px] mx-auto space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 p-3">
            <div className="text-xs text-slate-400 mb-1">电网稳定度</div>
            <div className="text-xl font-bold font-mono text-emerald-400">{formatPercent(stats.gridStability)}</div>
            <div className="mt-1.5 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.gridStability * 100}%` }} />
            </div>
          </div>
          <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 p-3">
            <div className="text-xs text-slate-400 mb-1">总供电</div>
            <div className="text-xl font-bold font-mono text-cyan-400">{formatNumber(stats.totalGenerated, 0)}</div>
          </div>
          <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 p-3">
            <div className="text-xs text-slate-400 mb-1">总需求</div>
            <div className="text-xl font-bold font-mono text-amber-400">{formatNumber(stats.totalConsumed, 0)}</div>
          </div>
          <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 p-3">
            <div className="text-xs text-slate-400 mb-1">平均损耗率</div>
            <div className="text-xl font-bold font-mono text-rose-400">{formatPercent(stats.avgLossRate)}</div>
          </div>
          <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 p-3">
            <div className="text-xs text-slate-400 mb-1">活跃事件</div>
            <div className="text-xl font-bold font-mono text-purple-400">{activeEvents.length}</div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-slate-200">跨服电网地图</h2>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" /> 正常线路
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500" /> 受损
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500" /> 危险
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-purple-500" /> 事件
                  </div>
                </div>
              </div>

              <div className="relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800" style={{ aspectRatio: `${GRID_WIDTH}/${GRID_HEIGHT}` }}>
                <svg viewBox={`0 0 ${GRID_WIDTH} ${GRID_HEIGHT}`} className="w-full h-full">
                  <defs>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <radialGradient id="regionGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {heatmapCells.map((cell, idx) => (
                    <rect
                      key={idx}
                      x={cell.x * CELL_W}
                      y={cell.y * CELL_H}
                      width={CELL_W + 0.5}
                      height={CELL_H + 0.5}
                      fill={densityToColor(cell.density)}
                      rx={1}
                    />
                  ))}

                  {lineRegionPairs.map(({ line, from, to }, idx) => {
                    const loadRatio = line.currentLoad / line.capacity
                    const strokeWidth = 2 + loadRatio * 4
                    return (
                      <g key={line.id || idx}>
                        <line
                          x1={from!.centerX}
                          y1={from!.centerY}
                          x2={to!.centerX}
                          y2={to!.centerY}
                          stroke={statusColor[line.status]}
                          strokeWidth={strokeWidth}
                          strokeOpacity={line.status === 'destroyed' ? 0.3 : 0.7}
                          strokeLinecap="round"
                          strokeDasharray={line.status === 'damaged' ? '8,4' : line.status === 'critical' ? '4,4' : undefined}
                        />
                        {line.status !== 'normal' && line.status !== 'destroyed' && (
                          <line
                            x1={from!.centerX}
                            y1={from!.centerY}
                            x2={to!.centerX}
                            y2={to!.centerY}
                            stroke={statusColor[line.status]}
                            strokeWidth={strokeWidth + 2}
                            strokeOpacity={0.2}
                            strokeLinecap="round"
                            filter="url(#glow)"
                          />
                        )}
                      </g>
                    )
                  })}

                  {gridRegions.map(region => {
                    const isSelected = selectedRegion === region.id
                    const imbalance = region.totalDemand / Math.max(region.totalSupply, 1)
                    const regionColor = imbalance > 1.2 ? '#ef4444' : imbalance < 0.8 ? '#22c55e' : '#38bdf8'
                    return (
                      <g
                        key={region.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedRegion(isSelected ? null : region.id)}
                      >
                        <circle cx={region.centerX} cy={region.centerY} r={50} fill="url(#regionGlow)" />
                        <circle
                          cx={region.centerX}
                          cy={region.centerY}
                          r={isSelected ? 22 : 18}
                          fill={regionColor}
                          fillOpacity={0.2}
                          stroke={regionColor}
                          strokeWidth={isSelected ? 3 : 2}
                          filter="url(#glow)"
                        />
                        <circle cx={region.centerX} cy={region.centerY} r={6} fill={regionColor} />
                        <text
                          x={region.centerX}
                          y={region.centerY + 35}
                          textAnchor="middle"
                          fill="#e2e8f0"
                          fontSize="11"
                          fontWeight="500"
                        >
                          {region.name}
                        </text>
                        <text
                          x={region.centerX}
                          y={region.centerY + 48}
                          textAnchor="middle"
                          fill="#64748b"
                          fontSize="9"
                        >
                          {region.players}人 · {region.facilities}设施
                        </text>
                      </g>
                    )
                  })}

                  {allFacilities.slice(0, 80).map(facility => (
                    <text
                      key={facility.id}
                      x={facility.x}
                      y={facility.y}
                      fontSize="10"
                      textAnchor="middle"
                      opacity={0.7}
                    >
                      {getFacilityIcon(facility.type)}
                    </text>
                  ))}

                  {activeEvents.slice(0, 10).map(event => {
                    const region = event.regionId ? regionMap.get(event.regionId) : null
                    if (!region) return null
                    const config = EVENT_CONFIG[event.type]
                    const remaining = Math.max(0, event.endTime - now)
                    return (
                      <g key={event.id}>
                        <circle
                          cx={region.centerX}
                          cy={region.centerY - 50}
                          r={14}
                          fill={config?.severityColors[event.severity] || '#a855f7'}
                          fillOpacity={0.3}
                          stroke={config?.severityColors[event.severity] || '#a855f7'}
                          strokeWidth={2}
                          filter="url(#glow)"
                        />
                        <text
                          x={region.centerX}
                          y={region.centerY - 46}
                          textAnchor="middle"
                          fontSize="12"
                        >
                          {config?.icon || '⚠️'}
                        </text>
                      </g>
                    )
                  })}
                </svg>

                {selectedRegion && (() => {
                  const region = regionMap.get(selectedRegion)
                  if (!region) return null
                  const imbalance = region.totalSupply - region.totalDemand
                  return (
                    <div className="absolute top-3 left-3 bg-slate-900/95 backdrop-blur rounded-lg border border-slate-700 p-3 w-56 shadow-xl">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-slate-200 text-sm">{region.name}</h4>
                        <button onClick={() => setSelectedRegion(null)} className="text-slate-500 hover:text-slate-300 text-xs">✕</button>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">服务器</span>
                          <span className="text-slate-200 font-mono">{region.serverId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">供电量</span>
                          <span className="text-cyan-400 font-mono">{formatNumber(region.totalSupply, 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">需求量</span>
                          <span className="text-amber-400 font-mono">{formatNumber(region.totalDemand, 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">差值</span>
                          <span className={`font-mono ${imbalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {imbalance >= 0 ? '+' : ''}{formatNumber(imbalance, 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">价格系数</span>
                          <span className="text-slate-200 font-mono">×{region.priceMultiplier.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">拥堵度</span>
                          <span className={`font-mono ${region.congestionLevel > 0.7 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {formatPercent(region.congestionLevel)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full mt-1">
                          <div
                            className={`h-full rounded-full ${region.congestionLevel > 0.7 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${region.congestionLevel * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-700/50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">区域供需列表</h3>
                <span className="text-xs text-slate-500">{gridRegions.length} 个区域</span>
              </div>
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-800/50 sticky top-0">
                    <tr className="text-slate-400">
                      <th className="px-4 py-2 text-left font-medium">区域名称</th>
                      <th className="px-4 py-2 text-right font-medium">服务器</th>
                      <th className="px-4 py-2 text-right font-medium">供电</th>
                      <th className="px-4 py-2 text-right font-medium">需求</th>
                      <th className="px-4 py-2 text-right font-medium">差值</th>
                      <th className="px-4 py-2 text-right font-medium">价格系数</th>
                      <th className="px-4 py-2 text-right font-medium">拥堵度</th>
                      <th className="px-4 py-2 text-right font-medium">玩家/设施</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gridRegions.map(region => {
                      const imbalance = region.totalSupply - region.totalDemand
                      return (
                        <tr
                          key={region.id}
                          className="border-t border-slate-800/50 hover:bg-slate-800/30 cursor-pointer"
                          onClick={() => setSelectedRegion(region.id)}
                        >
                          <td className="px-4 py-2 text-slate-200">{region.name}</td>
                          <td className="px-4 py-2 text-right text-slate-400 font-mono">{region.serverId}</td>
                          <td className="px-4 py-2 text-right text-cyan-400 font-mono">{formatNumber(region.totalSupply, 0)}</td>
                          <td className="px-4 py-2 text-right text-amber-400 font-mono">{formatNumber(region.totalDemand, 0)}</td>
                          <td className={`px-4 py-2 text-right font-mono font-medium ${imbalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {imbalance >= 0 ? '+' : ''}{formatNumber(imbalance, 0)}
                          </td>
                          <td className="px-4 py-2 text-right text-slate-300 font-mono">×{region.priceMultiplier.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right">
                            <div className="inline-flex items-center gap-2">
                              <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${region.congestionLevel > 0.7 ? 'bg-rose-500' : region.congestionLevel > 0.5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${region.congestionLevel * 100}%` }}
                                />
                              </div>
                              <span className={`font-mono ${region.congestionLevel > 0.7 ? 'text-rose-400' : 'text-slate-400'}`}>
                                {formatPercent(region.congestionLevel, 0)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right text-slate-400 font-mono">
                            {region.players}/{region.facilities}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-700/50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">传输线路</h3>
                <span className="text-xs text-slate-500">{gridLines.length} 条线路</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {gridLines.map(line => {
                  const from = regionMap.get(line.fromRegionId)
                  const to = regionMap.get(line.toRegionId)
                  const loadRatio = line.currentLoad / line.capacity
                  if (!from || !to) return null
                  return (
                    <div key={line.id} className="px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: statusColor[line.status] }}
                          />
                          <span className="text-xs font-medium text-slate-200">
                            {from.name.split('区')[0]} → {to.name.split('区')[0]}
                          </span>
                        </div>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: `${statusColor[line.status]}20`,
                            color: statusColor[line.status],
                          }}
                        >
                          {statusLabel[line.status]}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] mb-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">耐久</span>
                          <div className="flex items-center gap-2">
                            <span className={`font-mono ${line.durability < 0.3 ? 'text-rose-400' : line.durability < 0.6 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {formatPercent(line.durability, 0)}
                            </span>
                            {line.durability < 0.8 && (
                              <span className="text-[10px] text-orange-400 whitespace-nowrap">
                                -{((1 - line.durability) * 100).toFixed(0)}% 永久损伤
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">损耗率</span>
                          <div className="flex flex-col items-end">
                            <span className="text-slate-300 font-mono">{formatPercent(line.lossRate)}</span>
                            {(line.eventAppliedLossRate || 0) > 0.01 && (
                              <span className="text-[10px] text-red-400">
                                事件影响 +{((line.eventAppliedLossRate || 0) * 100).toFixed(1)}%
                              </span>
                            )}
                            {line.displayStatus === 'recovering' && (
                              <span className="text-[10px] text-yellow-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                                恢复中
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mb-2">
                        <div className="flex justify-between text-[10px] mb-0.5">
                          <span className="text-slate-500">负载</span>
                          <span className="text-slate-400 font-mono">
                            {formatNumber(line.currentLoad, 0)} / {formatNumber(line.capacity, 0)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${loadRatio > 0.9 ? 'bg-rose-500' : loadRatio > 0.7 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(loadRatio * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => reinforceGridLine(line.id)}
                          disabled={line.status === 'destroyed'}
                          className="flex-1 py-1 text-[10px] rounded bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          加固 (5K金币)
                        </button>
                        <button
                          onClick={() => dispatchRepairTeam(line.id)}
                          disabled={line.durability >= 0.9}
                          className="flex-1 py-1 text-[10px] rounded bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          修复队 (1W金币)
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-700/50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">随机事件</h3>
                <span className="text-xs text-purple-400">{activeEvents.length} 活跃</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {gridEvents.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-sm">暂无事件</div>
                ) : (
                  gridEvents.slice(0, 20).map(event => {
                    const config = EVENT_CONFIG[event.type]
                    const region = event.regionId ? regionMap.get(event.regionId) : null
                    const remaining = Math.max(0, event.endTime - now)
                    const totalDuration = event.endTime - event.startTime
                    const progress = 1 - remaining / Math.max(totalDuration, 1)
                    return (
                      <div
                        key={event.id}
                        className={`px-4 py-2.5 border-b border-slate-800/50 ${!event.isActive ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                            style={{ backgroundColor: `${config?.severityColors[event.severity] || '#a855f7'}30` }}
                          >
                            {config?.icon || '⚠️'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="text-xs font-semibold text-slate-200 truncate">
                                {config?.name || event.type}
                              </span>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span
                                    key={i}
                                    className={`w-1 h-1 rounded-full ${i < event.severity ? '' : 'bg-slate-700'}`}
                                    style={i < event.severity ? { backgroundColor: config?.severityColors[event.severity] } : {}}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-400 mb-1 line-clamp-2">{event.description}</p>
                            {event.isActive && (
                              <p className="text-[10px] text-slate-400 mb-1.5">
                                {event.type === 'storm' && '影响：降低输出 + 线路耐久损耗 + 损耗率上升'}
                                {event.type === 'energy_theft' && '影响：传输损耗率大幅上升'}
                                {event.type === 'energy_overload' && '影响：设施输出提升，但耐久损耗加快'}
                                {event.type === 'mana_tide' && '影响：全服设施输出显著提升'}
                                {event.type === 'efficiency_boost' && '影响：设施效率大幅提升'}
                                {event.type === 'price_surge' && '影响：市场价格剧烈波动'}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-500">
                                {region ? region.name : event.lineId ? `线路 ${event.lineId.slice(-4)}` : '全局'}
                              </span>
                              <span className={`font-mono ${event.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {event.isActive ? `剩余 ${formatDuration(remaining)}` : '已结束'}
                              </span>
                            </div>
                            {event.isActive && (
                              <div className="mt-1.5">
                                <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                                  <span>剩余时间</span>
                                  <span>{formatRemaining(remaining)}</span>
                                </div>
                                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${progress * 100}%`,
                                      backgroundColor: config?.severityColors[event.severity] || '#a855f7',
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 p-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">地形图例</h3>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(TERRAIN_CONFIG).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-1.5 text-[11px]">
                    <span>{cfg.icon}</span>
                    <span className="text-slate-400">{cfg.name}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <h4 className="text-xs font-medium text-slate-300 mb-2">设施图例</h4>
                <div className="grid grid-cols-1 gap-1.5">
                  {Object.entries(FACILITY_CONFIG).map(([key, cfg]) => (
                    <div key={key} className="flex items-center gap-2 text-[11px]">
                      <span className="text-base">{cfg.icon}</span>
                      <span className="text-slate-400 flex-1">{cfg.name}</span>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cfg.colors.primary }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GridPage
