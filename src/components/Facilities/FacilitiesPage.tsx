import { useState, useMemo } from 'react'
import type { Facility, FacilityType } from '@/types'
import { useGameStore } from '@/store/gameStore'
import { FACILITY_CONFIG, TERRAIN_CONFIG, WEATHER_CONFIG } from '@/constants'
import FacilityCard from './FacilityCard'
import BuildPanel from './BuildPanel'
import {
  calculateUpgradeCost,
  calculateRepairCost,
  calculateFacilityOutput,
} from '@/engine/facilityEngine'

type FilterType = 'all' | FacilityType
type FilterStatus = 'all' | 'active' | 'inactive' | 'damaged'

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toFixed(0)
}

export default function FacilitiesPage() {
  const {
    playerFacilities,
    currentPlayer,
    weather,
    actions,
  } = useGameStore()

  const [showBuildPanel, setShowBuildPanel] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const weatherConfig = WEATHER_CONFIG[weather.current]

  const filteredFacilities = useMemo(() => {
    return playerFacilities.filter((f) => {
      if (filterType !== 'all' && f.type !== filterType) return false
      if (filterStatus === 'active' && !f.isActive) return false
      if (filterStatus === 'inactive' && f.isActive) return false
      if (filterStatus === 'damaged' && f.durability / f.maxDurability > 0.5) return false
      if (
        searchQuery &&
        !f.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false
      return true
    })
  }, [playerFacilities, filterType, filterStatus, searchQuery])

  const stats = useMemo(() => {
    const total = playerFacilities.length
    const active = playerFacilities.filter((f) => f.isActive).length
    const damaged = playerFacilities.filter((f) => f.durability / f.maxDurability < 0.5).length
    const totalOutput = playerFacilities
      .filter((f) => f.isActive)
      .reduce((s, f) => s + calculateFacilityOutput(f, f.efficiency), 0)
    const totalMaintenance = playerFacilities.reduce(
      (s, f) => s + f.maintenanceCost,
      0
    )
    const avgEfficiency =
      total > 0
        ? playerFacilities.reduce((s, f) => s + f.efficiency, 0) / total
        : 0

    return { total, active, damaged, totalOutput, totalMaintenance, avgEfficiency }
  }, [playerFacilities])

  const handleSelectFacility = (facility: Facility) => {
    setSelectedFacility(facility)
  }

  const handleCloseDetail = () => {
    setSelectedFacility(null)
  }

  const facilityTypes: { value: FilterType; label: string; icon: string }[] = [
    { value: 'all', label: '全部', icon: '🏗️' },
    { value: 'mana_turbine', label: '魔力涡轮', icon: '🌀' },
    { value: 'solar_tower', label: '太阳能塔', icon: '☀️' },
    { value: 'geothermal_core', label: '地热核心', icon: '🌋' },
  ]

  const statusFilters: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'active', label: '运行中' },
    { value: 'inactive', label: '已停止' },
    { value: 'damaged', label: '待维修' },
  ]

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">能源设施</h1>
              <p className="text-sm text-slate-500 mt-1">
                管理和维护您的魔能发电设施
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2"
                style={{
                  backgroundColor: weatherConfig.color + '20',
                  color: weatherConfig.color,
                }}
              >
                <span>{weatherConfig.icon}</span>
                <span>{weatherConfig.name}</span>
              </div>
              <button
                onClick={() => setShowBuildPanel(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:from-indigo-600 hover:to-violet-600 transition-all"
              >
                + 建造新设施
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-100">
              <div className="text-xs text-slate-500 mb-1">设施总数</div>
              <div className="text-xl font-bold text-slate-800">
                {stats.total}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-100">
              <div className="text-xs text-slate-500 mb-1">运行中</div>
              <div className="text-xl font-bold text-emerald-600">
                {stats.active}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-100">
              <div className="text-xs text-slate-500 mb-1">待维修</div>
              <div className="text-xl font-bold text-rose-600">
                {stats.damaged}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-100">
              <div className="text-xs text-slate-500 mb-1">总产出</div>
              <div className="text-xl font-bold text-cyan-600">
                +{formatNumber(stats.totalOutput)}/h
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-100">
              <div className="text-xs text-slate-500 mb-1">维护成本</div>
              <div className="text-xl font-bold text-amber-600">
                -{formatNumber(stats.totalMaintenance)}/h
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-100">
              <div className="text-xs text-slate-500 mb-1">平均效率</div>
              <div className="text-xl font-bold text-indigo-600">
                {(stats.avgEfficiency * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  🔍
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索设施名称..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl overflow-x-auto">
                {facilityTypes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setFilterType(t.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                      filterType === t.value
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl">
                {statusFilters.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setFilterStatus(s.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      filterStatus === s.value
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredFacilities.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-100 text-center">
              <div className="text-5xl mb-4">🏭</div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                暂无设施
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                  ? '没有找到匹配的设施，请调整筛选条件'
                  : '开始建造您的第一座能源设施吧！'}
              </p>
              {!searchQuery && filterType === 'all' && filterStatus === 'all' && (
                <button
                  onClick={() => setShowBuildPanel(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
                >
                  🏗️ 建造第一座设施
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredFacilities.map((facility) => (
                <FacilityCard
                  key={facility.id}
                  facility={facility}
                  onSelect={handleSelectFacility}
                />
              ))}
            </div>
          )}
        </div>

        {showBuildPanel && (
          <div className="w-full lg:w-[420px] flex-shrink-0 lg:sticky lg:top-6 self-start">
            <BuildPanel onClose={() => setShowBuildPanel(false)} />
          </div>
        )}
      </div>

      {selectedFacility && (
        <FacilityDetailModal
          facility={selectedFacility}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  )
}

function FacilityDetailModal({
  facility,
  onClose,
}: {
  facility: Facility
  onClose: () => void
}) {
  const { currentPlayer, weather, actions } = useGameStore()
  const config = FACILITY_CONFIG[facility.type]
  const terrainConfig = TERRAIN_CONFIG[facility.terrain]
  const weatherConfig = WEATHER_CONFIG[weather.current]

  const details = actions.getFacilityOutputDetails(facility.id)
  const upgradeCost = calculateUpgradeCost(facility)
  const repairCost = calculateRepairCost(facility)
  const durabilityPercent = (facility.durability / facility.maxDurability) * 100

  const weatherBonus = config.weatherModifiers[weather.current]
  const terrainBonus = config.terrainModifiers[facility.terrain]

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="h-2"
          style={{ backgroundColor: config.colors.primary }}
        />
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8px)]">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: config.colors.primary + '15' }}
              >
                {config.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {facility.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: config.colors.primary + '15',
                      color: config.colors.primary,
                    }}
                  >
                    Lv.{facility.level}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    {terrainConfig.icon} {terrainConfig.name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      facility.isActive
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {facility.isActive ? '● 运行中' : '○ 已停止'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <p className="text-sm text-slate-600 mb-6 p-4 bg-slate-50 rounded-xl">
            {config.description}
          </p>

          <div className="space-y-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              📊 产出分析
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50">
                <div className="text-xs text-slate-500 mb-1">基础产出</div>
                <div className="text-lg font-semibold text-slate-800">
                  {details.baseOutput.toFixed(0)}/h
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <div className="text-xs text-slate-500 mb-1">实际产出</div>
                <div className="text-lg font-semibold text-emerald-600">
                  +{details.actualOutput.toFixed(0)}/h
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <div className="text-xs text-slate-500 mb-1">效率系数</div>
                <div className="text-lg font-semibold text-indigo-600">
                  {(details.efficiency * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <div className="text-xs text-slate-500 mb-1">维护成本</div>
                <div className="text-lg font-semibold text-rose-600">
                  -{details.maintenanceCost.toFixed(0)}/h
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              🎯 加成因素
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-50">
                <span className="text-sm text-slate-700 flex items-center gap-2">
                  {weatherConfig.icon} 天气加成 ({weatherConfig.name})
                </span>
                <span
                  className={`text-sm font-semibold ${
                    weatherBonus >= 1 ? 'text-emerald-600' : 'text-rose-500'
                  }`}
                >
                  {weatherBonus >= 1 ? '+' : ''}
                  {((weatherBonus - 1) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50">
                <span className="text-sm text-slate-700 flex items-center gap-2">
                  {terrainConfig.icon} 地形加成 ({terrainConfig.name})
                </span>
                <span
                  className={`text-sm font-semibold ${
                    terrainBonus >= 1 ? 'text-emerald-600' : 'text-rose-500'
                  }`}
                >
                  {terrainBonus >= 1 ? '+' : ''}
                  {((terrainBonus - 1) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-violet-50">
                <span className="text-sm text-slate-700 flex items-center gap-2">
                  🤝 协同加成
                </span>
                <span className="text-sm font-semibold text-emerald-600">
                  +{((details.synergyBonus || 0) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                🛠️ 耐久状态
              </h3>
              <span className="text-xs text-slate-500">
                {(facility.durability * config.baseDurability).toFixed(0)} /{' '}
                {config.baseDurability}
              </span>
            </div>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  durabilityPercent > 60
                    ? 'bg-emerald-500'
                    : durabilityPercent > 30
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.max(0, durabilityPercent)}%` }}
              />
            </div>
          </div>

          {facility.specialModifiers && facility.specialModifiers.length > 0 && (
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                ✨ 特殊效果
              </h3>
              <div className="space-y-2">
                {facility.specialModifiers.map((mod) => (
                  <div
                    key={mod.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-100"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-800">
                        {mod.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {mod.description}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-amber-600">
                      +{(mod.value * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  actions.upgradeFacility(facility.id)
                }}
                disabled={currentPlayer.gold < upgradeCost}
                className="py-3 rounded-xl font-semibold text-sm transition-all bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div>⬆️ 升级</div>
                <div className="text-xs font-normal mt-0.5 opacity-80">
                  💰 {upgradeCost.toLocaleString()}
                </div>
              </button>
              <button
                onClick={() => {
                  actions.repairFacility(facility.id)
                }}
                disabled={
                  currentPlayer.gold < repairCost || durabilityPercent >= 100
                }
                className="py-3 rounded-xl font-semibold text-sm transition-all bg-amber-50 text-amber-600 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div>🔧 维修</div>
                <div className="text-xs font-normal mt-0.5 opacity-80">
                  💰 {repairCost.toLocaleString()}
                </div>
              </button>
            </div>
            <button
              onClick={() => {
                actions.toggleFacility(facility.id)
              }}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                facility.isActive
                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              }`}
            >
              {facility.isActive ? '⏸️ 停止运行' : '▶️ 启动运行'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
