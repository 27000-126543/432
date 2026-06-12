export type FacilityType = 'mana_turbine' | 'solar_tower' | 'geothermal_core'

export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'windy' | 'foggy'

export type TerrainType = 'plain' | 'mountain' | 'forest' | 'desert' | 'volcanic' | 'coastal'

export type OrderType = 'buy' | 'sell'

export type OrderStatus = 'pending' | 'matched' | 'cancelled' | 'partial'

export type LineStatus = 'normal' | 'damaged' | 'critical' | 'destroyed'

export type EventType = 
  | 'energy_overload' 
  | 'mana_tide' 
  | 'storm' 
  | 'energy_theft' 
  | 'efficiency_boost' 
  | 'price_surge'

export type GuildRole = 'leader' | 'vice_leader' | 'tech_officer' | 'member'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface Player {
  id: string
  name: string
  avatar: string
  level: number
  gold: number
  manaTokens: number
  guildId: string | null
  guildRole: GuildRole | null
  totalGenerated: number
  totalTraded: number
  reputation: number
}

export interface Facility {
  id: string
  playerId: string
  type: FacilityType
  name: string
  level: number
  x: number
  y: number
  terrain: TerrainType
  baseOutput: number
  efficiency: number
  lastMaintenance: number
  maintenanceCost: number
  durability: number
  maxDurability: number
  createdAt: number
  isActive: boolean
  specialModifiers: SpecialModifier[]
}

export interface SpecialModifier {
  id: string
  name: string
  description: string
  effectType: 'output_boost' | 'efficiency_boost' | 'maintenance_reduction'
  value: number
  expiresAt: number | null
}

export interface WeatherState {
  current: WeatherType
  nextTransition: number
  windSpeed: number
  temperature: number
  humidity: number
  manaDensity: number
  solarIntensity: number
}

export interface GridRegion {
  id: string
  name: string
  serverId: string
  centerX: number
  centerY: number
  totalSupply: number
  totalDemand: number
  priceMultiplier: number
  congestionLevel: number
  players: number
  facilities: number
}

export interface GridLine {
  id: string
  fromRegionId: string
  toRegionId: string
  capacity: number
  currentLoad: number
  status: LineStatus
  durability: number
  maxDurability: number
  lossRate: number
  lastReinforced: number
  repairTeams: string[]
  baseLossRate?: number
  temporaryLossRate?: number
  eventAppliedLossRate?: number
  displayStatus?: 'recovering' | 'normal' | 'damaged'
}

export interface GridEvent {
  id: string
  type: EventType
  severity: 1 | 2 | 3 | 4 | 5
  regionId: string | null
  lineId: string | null
  facilityId: string | null
  affectedLineIds?: string[]
  startTime: number
  endTime: number
  description: string
  effect: GridEventEffect
  isActive: boolean
}

export interface GridEventEffect {
  outputMultiplier?: number
  priceMultiplier?: number
  lossRateIncrease?: number
  durabilityDamage?: number
  bonusTokens?: number
}

export interface Order {
  id: string
  playerId: string
  playerName: string
  type: OrderType
  amount: number
  filledAmount: number
  price: number
  timestamp: number
  status: OrderStatus
  expiresAt: number
}

export interface Trade {
  id: string
  buyOrderId: string
  sellOrderId: string
  buyerId: string
  sellerId: string
  amount: number
  price: number
  timestamp: number
  regionId: string
  fee: number
  buyOrderPrice?: number
  sellOrderPrice?: number
}

export interface PriceHistory {
  timestamp: number
  price: number
  volume: number
  regionId: string
}

export interface SupplyDemandSnapshot {
  timestamp: number
  regionId: string
  supply: number
  demand: number
  price: number
  lossRate: number
  congestion: number
}

export interface HeatmapCell {
  x: number
  y: number
  supply: number
  demand: number
  density: number
  regionId: string
}

export interface Guild {
  id: string
  name: string
  emblem: string
  leaderId: string
  viceLeaders: string[]
  techOfficers: string[]
  members: string[]
  memberCount: number
  level: number
  gold: number
  materials: Record<string, number>
  hub: SuperHub | null
  efficiencyBonus: number
  feeDiscount: number
  gridCoverage: number
  totalContribution: number
  createdAt: number
}

export interface SuperHub {
  id: string
  guildId: string
  level: number
  name: string
  regionId: string
  x: number
  y: number
  totalOutput: number
  coverageRadius: number
  connectedLines: string[]
  upgradeProcess: UpgradeProcess | null
  stats: HubStats
}

export interface HubStats {
  totalGenerated: number
  peakOutput: number
  totalTraded: number
  uptime: number
  eventsHandled: number
}

export interface UpgradeProcess {
  id: string
  hubId: string
  targetLevel: number
  requiredGold: number
  requiredMaterials: Record<string, number>
  contributedGold: number
  contributedMaterials: Record<string, number>
  approvals: {
    leader: ApprovalStatus
    viceLeaders: Record<string, ApprovalStatus>
    techOfficers: Record<string, ApprovalStatus>
  }
  status: 'collecting' | 'approving' | 'upgrading' | 'completed' | 'rejected'
  startTime: number
  completeTime: number | null
}

export interface RepairTeam {
  id: string
  playerId: string
  lineId: string | null
  eventId: string | null
  status: 'idle' | 'traveling' | 'repairing' | 'returning'
  eta: number | null
  efficiency: number
}

export interface LeaderboardEntry {
  rank: number
  playerId: string
  playerName: string
  avatar: string
  value: number
  change: number
  guildName: string | null
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'event'
  title: string
  message: string
  timestamp: number
  read: boolean
  link?: string
}

export interface ServerLoad {
  serverId: string
  name: string
  onlinePlayers: number
  activeFacilities: number
  ordersPerSecond: number
  tradesPerSecond: number
  cpuUsage: number
  memoryUsage: number
  latency: number
  status: 'healthy' | 'warning' | 'critical'
}

export interface DashboardStats {
  totalGenerated: number
  totalConsumed: number
  currentPrice: number
  priceChange24h: number
  activeFacilities: number
  activePlayers: number
  totalTrades24h: number
  totalVolume24h: number
  gridStability: number
  avgLossRate: number
}
