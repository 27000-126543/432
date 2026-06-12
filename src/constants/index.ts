import type { FacilityType, WeatherType, TerrainType, EventType } from '@/types'

export const FACILITY_CONFIG: Record<FacilityType, {
  name: string
  icon: string
  description: string
  baseOutput: number
  baseCost: number
  baseMaintenance: number
  baseDurability: number
  colors: { primary: string; secondary: string }
  weatherModifiers: Record<WeatherType, number>
  terrainModifiers: Record<TerrainType, number>
  synergyBonus: Record<FacilityType, number>
}> = {
  mana_turbine: {
    name: '魔力涡轮',
    icon: '🌀',
    description: '利用魔力流动驱动涡轮发电，受风力影响大',
    baseOutput: 100,
    baseCost: 10000,
    baseMaintenance: 50,
    baseDurability: 1000,
    colors: { primary: '#0ea5e9', secondary: '#7dd3fc' },
    weatherModifiers: {
      sunny: 0.8,
      cloudy: 0.9,
      rainy: 1.0,
      stormy: 1.8,
      windy: 1.6,
      foggy: 0.7,
    },
    terrainModifiers: {
      plain: 1.0,
      mountain: 1.3,
      forest: 0.8,
      desert: 0.6,
      volcanic: 1.1,
      coastal: 1.4,
    },
    synergyBonus: {
      mana_turbine: 0.0,
      solar_tower: 0.05,
      geothermal_core: 0.1,
    },
  },
  solar_tower: {
    name: '太阳能塔',
    icon: '☀️',
    description: '汇聚阳光转化为魔力能源，晴天效率最高',
    baseOutput: 120,
    baseCost: 15000,
    baseMaintenance: 60,
    baseDurability: 1200,
    colors: { primary: '#f59e0b', secondary: '#fcd34d' },
    weatherModifiers: {
      sunny: 1.6,
      cloudy: 0.6,
      rainy: 0.3,
      stormy: 0.1,
      windy: 1.0,
      foggy: 0.2,
    },
    terrainModifiers: {
      plain: 1.1,
      mountain: 1.2,
      forest: 0.7,
      desert: 1.5,
      volcanic: 0.9,
      coastal: 1.0,
    },
    synergyBonus: {
      mana_turbine: 0.05,
      solar_tower: 0.0,
      geothermal_core: 0.08,
    },
  },
  geothermal_core: {
    name: '地热核心',
    icon: '🌋',
    description: '汲取地核热能，输出稳定但维护成本高',
    baseOutput: 150,
    baseCost: 25000,
    baseMaintenance: 100,
    baseDurability: 800,
    colors: { primary: '#ec4899', secondary: '#f9a8d4' },
    weatherModifiers: {
      sunny: 1.0,
      cloudy: 1.0,
      rainy: 0.9,
      stormy: 0.8,
      windy: 1.0,
      foggy: 1.0,
    },
    terrainModifiers: {
      plain: 0.6,
      mountain: 1.4,
      forest: 0.7,
      desert: 0.9,
      volcanic: 1.8,
      coastal: 0.8,
    },
    synergyBonus: {
      mana_turbine: 0.1,
      solar_tower: 0.08,
      geothermal_core: 0.0,
    },
  },
}

export const WEATHER_CONFIG: Record<WeatherType, {
  name: string
  icon: string
  color: string
  duration: [number, number]
  transitionChance: number
}> = {
  sunny: {
    name: '晴朗',
    icon: '☀️',
    color: '#fbbf24',
    duration: [60000, 120000],
    transitionChance: 0.3,
  },
  cloudy: {
    name: '多云',
    icon: '⛅',
    color: '#94a3b8',
    duration: [45000, 90000],
    transitionChance: 0.25,
  },
  rainy: {
    name: '降雨',
    icon: '🌧️',
    color: '#60a5fa',
    duration: [30000, 60000],
    transitionChance: 0.35,
  },
  stormy: {
    name: '雷暴',
    icon: '⛈️',
    color: '#6366f1',
    duration: [20000, 45000],
    transitionChance: 0.4,
  },
  windy: {
    name: '大风',
    icon: '💨',
    color: '#34d399',
    duration: [40000, 80000],
    transitionChance: 0.3,
  },
  foggy: {
    name: '浓雾',
    icon: '🌫️',
    color: '#a1a1aa',
    duration: [25000, 50000],
    transitionChance: 0.35,
  },
}

export const TERRAIN_CONFIG: Record<TerrainType, {
  name: string
  icon: string
  color: string
}> = {
  plain: { name: '平原', icon: '🌾', color: '#84cc16' },
  mountain: { name: '山脉', icon: '🏔️', color: '#78716c' },
  forest: { name: '森林', icon: '🌲', color: '#16a34a' },
  desert: { name: '沙漠', icon: '🏜️', color: '#eab308' },
  volcanic: { name: '火山', icon: '🌋', color: '#dc2626' },
  coastal: { name: '海岸', icon: '🏖️', color: '#06b6d4' },
}

export const EVENT_CONFIG: Record<EventType, {
  name: string
  icon: string
  severityColors: Record<number, string>
  baseProbability: number
  minDuration: number
  maxDuration: number
}> = {
  energy_overload: {
    name: '能源过载',
    icon: '⚡',
    severityColors: { 1: '#fef3c7', 2: '#fcd34d', 3: '#f59e0b', 4: '#d97706', 5: '#b45309' },
    baseProbability: 0.002,
    minDuration: 10000,
    maxDuration: 30000,
  },
  mana_tide: {
    name: '魔力潮汐',
    icon: '🌊',
    severityColors: { 1: '#e0f2fe', 2: '#7dd3fc', 3: '#38bdf8', 4: '#0284c7', 5: '#0369a1' },
    baseProbability: 0.003,
    minDuration: 15000,
    maxDuration: 45000,
  },
  storm: {
    name: '魔法风暴',
    icon: '🌪️',
    severityColors: { 1: '#e0e7ff', 2: '#a5b4fc', 3: '#818cf8', 4: '#6366f1', 5: '#4f46e5' },
    baseProbability: 0.004,
    minDuration: 20000,
    maxDuration: 60000,
  },
  energy_theft: {
    name: '窃能事件',
    icon: '🥷',
    severityColors: { 1: '#f3e8ff', 2: '#d8b4fe', 3: '#c084fc', 4: '#a855f7', 5: '#9333ea' },
    baseProbability: 0.0015,
    minDuration: 5000,
    maxDuration: 15000,
  },
  efficiency_boost: {
    name: '效率提升',
    icon: '✨',
    severityColors: { 1: '#dcfce7', 2: '#86efac', 3: '#4ade80', 4: '#22c55e', 5: '#16a34a' },
    baseProbability: 0.0025,
    minDuration: 20000,
    maxDuration: 50000,
  },
  price_surge: {
    name: '价格震荡',
    icon: '📈',
    severityColors: { 1: '#fee2e2', 2: '#fca5a5', 3: '#f87171', 4: '#ef4444', 5: '#dc2626' },
    baseProbability: 0.003,
    minDuration: 15000,
    maxDuration: 40000,
  },
}

export const SERVERS = [
  { id: 'srv-001', name: '艾泽拉斯', region: '东部王国' },
  { id: 'srv-002', name: '卡利姆多', region: '西部大陆' },
  { id: 'srv-003', name: '诺森德', region: '北境冻土' },
  { id: 'srv-004', name: '潘达利亚', region: '迷雾群岛' },
  { id: 'srv-005', name: '德拉诺', region: '异界领域' },
]

export const GRID_REGIONS = [
  { id: 'reg-001', name: '暴风城供电区', serverId: 'srv-001', centerX: 200, centerY: 200 },
  { id: 'reg-002', name: '铁炉堡工业区', serverId: 'srv-001', centerX: 400, centerY: 150 },
  { id: 'reg-003', name: '达纳苏斯林区', serverId: 'srv-002', centerX: 150, centerY: 350 },
  { id: 'reg-004', name: '奥格瑞玛核心区', serverId: 'srv-002', centerX: 350, centerY: 400 },
  { id: 'reg-005', name: '冰封皇冠区', serverId: 'srv-003', centerX: 500, centerY: 100 },
  { id: 'reg-006', name: '龙眠神殿区', serverId: 'srv-003', centerX: 600, centerY: 250 },
  { id: 'reg-007', name: '翡翠林区', serverId: 'srv-004', centerX: 300, centerY: 500 },
  { id: 'reg-008', name: '锦绣谷圣区', serverId: 'srv-004', centerX: 500, centerY: 450 },
  { id: 'reg-009', name: '影月谷区', serverId: 'srv-005', centerX: 100, centerY: 450 },
  { id: 'reg-010', name: '塔拉多平原', serverId: 'srv-005', centerX: 650, centerY: 380 },
]

export const HUB_UPGRADE_COSTS = [
  { level: 1, gold: 0, materials: { mana_crystal: 0, arcane_core: 0, dragon_scale: 0 } },
  { level: 2, gold: 100000, materials: { mana_crystal: 500, arcane_core: 50, dragon_scale: 10 } },
  { level: 3, gold: 300000, materials: { mana_crystal: 1500, arcane_core: 150, dragon_scale: 30 } },
  { level: 4, gold: 800000, materials: { mana_crystal: 4000, arcane_core: 400, dragon_scale: 80 } },
  { level: 5, gold: 2000000, materials: { mana_crystal: 10000, arcane_core: 1000, dragon_scale: 200 } },
]

export const HUB_EFFICIENCY_BONUS = [0, 0.05, 0.12, 0.22, 0.35, 0.5]
export const HUB_FEE_DISCOUNT = [0, 0.03, 0.07, 0.12, 0.2, 0.3]
export const HUB_COVERAGE = [0, 50, 80, 120, 170, 250]

export const MATERIALS = {
  mana_crystal: { name: '魔力水晶', icon: '💎', color: '#0ea5e9' },
  arcane_core: { name: '奥术核心', icon: '🔮', color: '#a855f7' },
  dragon_scale: { name: '龙鳞', icon: '🐉', color: '#22c55e' },
  phoenix_feather: { name: '凤凰羽毛', icon: '🪶', color: '#ef4444' },
  star_dust: { name: '星尘', icon: '✨', color: '#fbbf24' },
}

export const GRID_CONSTANTS = {
  BASE_PRICE: 100,
  MIN_PRICE: 20,
  MAX_PRICE: 500,
  SUPPLY_DEMAND_SENSITIVITY: 0.3,
  MATCH_ENGINE_INTERVAL: 100,
  MAX_ORDERS_PER_PLAYER: 50,
  ORDER_EXPIRY_MS: 3600000,
  TRANSACTION_FEE: 0.005,
  MIN_LINE_DURABILITY: 0.1,
  LINE_REPAIR_RATE: 10,
  GRID_UPDATE_INTERVAL: 5000,
  HEATMAP_SIZE: 20,
  PRICE_HISTORY_POINTS: 288,
  LEADERBOARD_REFRESH: 30000,
}
