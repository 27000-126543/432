import type { Facility, WeatherState, FacilityType, SpecialModifier } from '@/types'
import { FACILITY_CONFIG } from '@/constants'
import { clamp, randomBetween, randomInt } from '@/utils'

export const calculateFacilityEfficiency = (
  facility: Facility,
  weather: WeatherState,
  nearbyFacilities: Facility[]
): number => {
  const config = FACILITY_CONFIG[facility.type]
  
  let efficiency = 1.0
  
  efficiency *= config.weatherModifiers[weather.current]
  efficiency *= config.terrainModifiers[facility.terrain]
  
  const levelMultiplier = 1 + (facility.level - 1) * 0.15
  efficiency *= levelMultiplier
  
  const durabilityFactor = 0.5 + (facility.durability / facility.maxDurability) * 0.5
  efficiency *= durabilityFactor
  
  const synergyBonus = nearbyFacilities.reduce((bonus, f) => {
    if (f.id === facility.id) return bonus
    return bonus + config.synergyBonus[f.type]
  }, 0)
  efficiency *= (1 + Math.min(synergyBonus, 0.5))
  
  const modifierBonus = facility.specialModifiers
    .filter(m => m.expiresAt === null || m.expiresAt > Date.now())
    .reduce((acc, m) => {
      if (m.effectType === 'efficiency_boost') return acc + m.value
      return acc
    }, 0)
  efficiency *= (1 + modifierBonus)
  
  return clamp(efficiency, 0.1, 3.0)
}

export const calculateFacilityOutput = (
  facility: Facility,
  efficiency: number
): number => {
  const config = FACILITY_CONFIG[facility.type]
  let output = config.baseOutput * efficiency
  
  const outputModifiers = facility.specialModifiers
    .filter(m => m.expiresAt === null || m.expiresAt > Date.now())
    .reduce((acc, m) => {
      if (m.effectType === 'output_boost') return acc + m.value
      return acc
    }, 0)
  output *= (1 + outputModifiers)
  
  return Math.floor(output)
}

export const calculateMaintenanceCost = (
  facility: Facility
): number => {
  const config = FACILITY_CONFIG[facility.type]
  let cost = config.baseMaintenance
  
  const levelMultiplier = 1 + (facility.level - 1) * 0.2
  cost *= levelMultiplier
  
  const durabilityPenalty = Math.max(0, 1 - facility.durability / facility.maxDurability)
  cost *= (1 + durabilityPenalty * 0.5)
  
  const modifierReduction = facility.specialModifiers
    .filter(m => m.expiresAt === null || m.expiresAt > Date.now())
    .reduce((acc, m) => {
      if (m.effectType === 'maintenance_reduction') return acc + m.value
      return acc
    }, 0)
  cost *= (1 - Math.min(modifierReduction, 0.5))
  
  return Math.floor(cost)
}

export const calculateFacilityCost = (type: FacilityType, level: number): number => {
  const config = FACILITY_CONFIG[type]
  return Math.floor(config.baseCost * Math.pow(1.6, level - 1))
}

export const calculateUpgradeCost = (facility: Facility): number => {
  return calculateFacilityCost(facility.type, facility.level + 1)
}

export const calculateRepairCost = (facility: Facility): number => {
  const damageRatio = 1 - facility.durability / facility.maxDurability
  const baseCost = calculateFacilityCost(facility.type, facility.level) * 0.1
  return Math.floor(baseCost * damageRatio)
}

export const calculateFacilityDurabilityDecay = (
  facility: Facility,
  weather: WeatherState
): number => {
  let decay = 0.1
  
  switch (weather.current) {
    case 'stormy': decay *= 3.0; break
    case 'rainy': decay *= 1.5; break
    case 'foggy': decay *= 1.2; break
    case 'windy': decay *= 1.8; break
    default: decay *= 1.0
  }
  
  if (facility.terrain === 'volcanic') decay *= 1.5
  if (facility.terrain === 'coastal') decay *= 1.3
  
  decay *= (1 + facility.level * 0.05)
  
  return decay
}

export const generateSpecialModifier = (facilityType: FacilityType): SpecialModifier | null => {
  if (Math.random() > 0.15) return null
  
  const effectTypes: Array<SpecialModifier['effectType']> = [
    'output_boost',
    'efficiency_boost',
    'maintenance_reduction',
  ]
  
  const effectType = effectTypes[randomInt(0, 2)]
  const value = randomBetween(0.05, 0.2)
  const duration = randomInt(300000, 1800000)
  
  const names = {
    output_boost: ['魔力增幅', '能量涌动', '奥术灌注'],
    efficiency_boost: ['优化回路', '精准校准', '共鸣共振'],
    maintenance_reduction: ['自修复涂层', '耐久附魔', '减损结界'],
  }
  
  return {
    id: `mod-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: names[effectType][randomInt(0, 2)],
    description: `${effectType === 'output_boost' ? '输出' : effectType === 'efficiency_boost' ? '效率' : '维护'}提升${(value * 100).toFixed(0)}%`,
    effectType,
    value,
    expiresAt: Date.now() + duration,
  }
}
