import { useState } from 'react'
import type { Facility } from '@/types'
import { FACILITY_CONFIG, TERRAIN_CONFIG } from '@/constants'
import { useGameStore } from '@/store/gameStore'
import {
  calculateUpgradeCost,
  calculateRepairCost,
  calculateFacilityOutput,
} from '@/engine/facilityEngine'

interface FacilityCardProps {
  facility: Facility
  onSelect: (facility: Facility) => void
}

export default function FacilityCard({ facility, onSelect }: FacilityCardProps) {
  const { currentPlayer, actions } = useGameStore()
  const config = FACILITY_CONFIG[facility.type]
  const terrainConfig = TERRAIN_CONFIG[facility.terrain]

  const [showActions, setShowActions] = useState(false)

  const actualOutput = calculateFacilityOutput(facility, facility.efficiency)
  const durabilityPercent = (facility.durability / facility.maxDurability) * 100
  const efficiencyPercent = facility.efficiency * 100

  const upgradeCost = calculateUpgradeCost(facility)
  const repairCost = calculateRepairCost(facility)

  const durabilityColor =
    durabilityPercent > 60
      ? 'bg-emerald-500'
      : durabilityPercent > 30
      ? 'bg-amber-500'
      : 'bg-rose-500'

  const handleUpgrade = (e: React.MouseEvent) => {
    e.stopPropagation()
    actions.upgradeFacility(facility.id)
  }

  const handleRepair = (e: React.MouseEvent) => {
    e.stopPropagation()
    actions.repairFacility(facility.id)
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    actions.toggleFacility(facility.id)
  }

  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
      onClick={() => onSelect(facility)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className="h-2"
        style={{ backgroundColor: config.colors.primary }}
      />

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: config.colors.primary + '15' }}
            >
              {config.icon}
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">{facility.name}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="text-xs px-1.5 py-0.5 rounded font-medium"
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
              </div>
            </div>
          </div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              facility.isActive
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {facility.isActive ? '●' : '○'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="p-2 rounded-xl bg-slate-50">
            <div className="text-[10px] text-slate-500 mb-0.5">效率</div>
            <div className="text-sm font-semibold text-slate-800">
              {efficiencyPercent.toFixed(0)}%
            </div>
            <div className="w-full h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  efficiencyPercent > 80
                    ? 'bg-emerald-500'
                    : efficiencyPercent > 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, efficiencyPercent)}%` }}
              />
            </div>
          </div>
          <div className="p-2 rounded-xl bg-slate-50">
            <div className="text-[10px] text-slate-500 mb-0.5">耐久</div>
            <div className="text-sm font-semibold text-slate-800">
              {durabilityPercent.toFixed(0)}%
            </div>
            <div className="w-full h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${durabilityColor}`}
                style={{ width: `${Math.max(0, durabilityPercent)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs mb-3 pb-3 border-b border-slate-100">
          <div>
            <span className="text-slate-500">输出</span>
            <span className="ml-2 font-semibold text-emerald-600">
              +{actualOutput.toFixed(0)}/h
            </span>
          </div>
          <div>
            <span className="text-slate-500">维护</span>
            <span className="ml-2 font-semibold text-rose-600">
              -{facility.maintenanceCost.toFixed(0)}/h
            </span>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 transition-opacity ${
            showActions ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            onClick={handleUpgrade}
            disabled={currentPlayer.gold < upgradeCost}
            className="flex-1 py-1.5 px-2 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            升级 {upgradeCost.toLocaleString()}💰
          </button>
          <button
            onClick={handleRepair}
            disabled={currentPlayer.gold < repairCost || durabilityPercent >= 100}
            className="flex-1 py-1.5 px-2 text-xs font-medium rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            维修 {repairCost.toLocaleString()}💰
          </button>
          <button
            onClick={handleToggle}
            className={`py-1.5 px-3 text-xs font-medium rounded-lg transition-colors ${
              facility.isActive
                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
            }`}
          >
            {facility.isActive ? '关闭' : '启动'}
          </button>
        </div>
      </div>
    </div>
  )
}
