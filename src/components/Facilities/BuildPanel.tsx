import { useState } from 'react'
import type { FacilityType, TerrainType } from '@/types'
import { FACILITY_CONFIG, TERRAIN_CONFIG, WEATHER_CONFIG } from '@/constants'
import { useGameStore } from '@/store/gameStore'

const facilityTypes: FacilityType[] = ['mana_turbine', 'solar_tower', 'geothermal_core']
const terrainTypes: TerrainType[] = ['plain', 'mountain', 'forest', 'desert', 'volcanic', 'coastal']

interface BuildPanelProps {
  onClose?: () => void
}

export default function BuildPanel({ onClose }: BuildPanelProps) {
  const { currentPlayer, weather, actions } = useGameStore()

  const [selectedType, setSelectedType] = useState<FacilityType>('mana_turbine')
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainType>('plain')

  const config = FACILITY_CONFIG[selectedType]
  const terrainConfig = TERRAIN_CONFIG[selectedTerrain]
  const weatherConfig = WEATHER_CONFIG[weather.current]

  const terrainBonus = config.terrainModifiers[selectedTerrain]
  const weatherBonus = config.weatherModifiers[weather.current]
  const totalModifier = terrainBonus * weatherBonus
  const estimatedOutput = Math.floor(config.baseOutput * totalModifier)

  const canAfford = currentPlayer.gold >= config.baseCost

  const handleBuild = () => {
    if (!canAfford) return
    const x = Math.floor(Math.random() * 600) + 50
    const y = Math.floor(Math.random() * 500) + 50
    const success = actions.buildFacility(selectedType, selectedTerrain, x, y)
    if (success && onClose) {
      onClose()
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">建造新设施</h3>
          <p className="text-sm text-slate-500 mt-0.5">选择设施类型和建在地地形</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors flex items-center justify-center"
          >
            ✕
          </button>
        )}
      </div>

      <div className="p-5 space-y-5">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            设施类型
          </label>
          <div className="grid grid-cols-3 gap-3">
            {facilityTypes.map((type) => {
              const fc = FACILITY_CONFIG[type]
              const isSelected = selectedType === type
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`p-4 rounded-2xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/50'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3"
                    style={{ backgroundColor: fc.colors.primary + '15' }}
                  >
                    {fc.icon}
                  </div>
                  <div className="font-semibold text-slate-800 text-sm mb-1">
                    {fc.name}
                  </div>
                  <div className="text-xs text-slate-500 line-clamp-2 mb-2">
                    {fc.description}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-amber-600">💰</span>
                    <span className="font-medium text-slate-700">
                      {fc.baseCost.toLocaleString()}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            地形选择
          </label>
          <div className="grid grid-cols-6 gap-2">
            {terrainTypes.map((terrain) => {
              const tc = TERRAIN_CONFIG[terrain]
              const isSelected = selectedTerrain === terrain
              const modifier = config.terrainModifiers[terrain]
              return (
                <button
                  key={terrain}
                  onClick={() => setSelectedTerrain(terrain)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/50'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-2xl mb-1 text-center">{tc.icon}</div>
                  <div className="text-xs font-medium text-slate-700 text-center mb-1">
                    {tc.name}
                  </div>
                  <div
                    className={`text-[10px] font-semibold text-center ${
                      modifier >= 1 ? 'text-emerald-600' : 'text-rose-500'
                    }`}
                  >
                    {modifier >= 1 ? '+' : ''}
                    {((modifier - 1) * 100).toFixed(0)}%
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">基础产出</span>
            <span className="text-sm font-semibold text-slate-800">
              {config.baseOutput}/h
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 flex items-center gap-1">
              {terrainConfig.icon} 地形加成 ({terrainConfig.name})
            </span>
            <span
              className={`text-sm font-semibold ${
                terrainBonus >= 1 ? 'text-emerald-600' : 'text-rose-500'
              }`}
            >
              {terrainBonus >= 1 ? '×' : '×'}
              {terrainBonus.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 flex items-center gap-1">
              {weatherConfig.icon} 天气加成 ({weatherConfig.name})
            </span>
            <span
              className={`text-sm font-semibold ${
                weatherBonus >= 1 ? 'text-emerald-600' : 'text-rose-500'
              }`}
            >
              {weatherBonus >= 1 ? '×' : '×'}
              {weatherBonus.toFixed(2)}
            </span>
          </div>
          <div className="h-px bg-slate-200" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">预计产出</span>
            <span className="text-lg font-bold text-emerald-600">
              +{estimatedOutput}/h
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 text-center">
            <div className="text-xs text-slate-500 mb-1">维护成本</div>
            <div className="text-sm font-semibold text-rose-600">
              -{config.baseMaintenance}/h
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 text-center">
            <div className="text-xs text-slate-500 mb-1">基础耐久</div>
            <div className="text-sm font-semibold text-slate-800">
              {config.baseDurability}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 text-center">
            <div className="text-xs text-slate-500 mb-1">建造价格</div>
            <div
              className={`text-sm font-semibold ${
                canAfford ? 'text-amber-600' : 'text-rose-500'
              }`}
            >
              💰 {config.baseCost.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 mb-1">当前金币</div>
              <div className="text-lg font-bold text-slate-800">
                💰 {currentPlayer.gold.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 mb-1">建造后余额</div>
              <div
                className={`text-lg font-bold ${
                  canAfford ? 'text-emerald-600' : 'text-rose-500'
                }`}
              >
                💰 {(currentPlayer.gold - config.baseCost).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleBuild}
          disabled={!canAfford}
          className={`w-full py-3.5 rounded-xl font-semibold text-base transition-all ${
            canAfford
              ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {canAfford ? '🏗️ 开始建造' : '💰 金币不足'}
        </button>
      </div>
    </div>
  )
}
