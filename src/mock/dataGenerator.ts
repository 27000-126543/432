import type {
  Player,
  Facility,
  FacilityType,
  TerrainType,
  Order,
  Trade,
  PriceHistory,
  Guild,
  LeaderboardEntry,
  GridEvent,
  Notification,
  EventType,
} from '@/types'
import { SERVERS, TERRAIN_CONFIG, FACILITY_CONFIG } from '@/constants'
import {
  generateId,
  randomInt,
  randomBetween,
  randomChoice,
  weightedChoice,
} from '@/utils'
import { createGuild, createSuperHub } from '@/engine/guildEngine'
import { createInitialWeather } from '@/engine/weatherEngine'

const PLAYER_NAMES = [
  '星辰法师', '魔力使者', '符文大师', '奥术学者', '元素召唤师',
  '暗夜游侠', '圣光骑士', '风暴祭司', '大地守护', '烈焰术士',
  '冰霜女王', '虚空行者', '灵魂收割者', '自然德鲁伊', '雷霆战神',
  '暗影刺客', '光明牧师', '时空旅者', '龙语者', '精灵射手',
  '矮人铁匠', '地精工程师', '巨力战士', '血魔法师', '亡灵巫师',
]

const GUILD_NAMES = [
  '永恒之光', '星辰议会', '魔力联盟', '元素圣殿', '龙鳞军团',
  '暗影兄弟会', '凤凰涅槃', '雷神之锤', '自然守护', '奥术学院',
]

export const generateMockPlayer = (): Player => {
  const name = randomChoice(PLAYER_NAMES)
  const totalGenerated = randomInt(10000, 10000000)
  const totalTraded = randomInt(100, 50000)
  
  return {
    id: generateId('plr'),
    name: `${name}_${randomInt(1000, 9999)}`,
    avatar: randomChoice(['🧙', '🧝', '🧚', '🦸', '🧛', '🧟', '👸', '🤴']),
    level: randomInt(1, 100),
    gold: randomInt(10000, 10000000),
    manaTokens: randomInt(1000, 500000),
    guildId: null,
    guildRole: null,
    totalGenerated,
    totalTraded,
    reputation: randomInt(0, 10000),
  }
}

export const generateCurrentPlayer = (): Player => {
  return {
    id: 'current-player',
    name: '魔力领主',
    avatar: '🧙‍♂️',
    level: 42,
    gold: 1256800,
    manaTokens: 85200,
    guildId: null,
    guildRole: null,
    totalGenerated: 2856400,
    totalTraded: 15680,
    reputation: 3560,
  }
}

export const generateMockFacilities = (playerId: string, count: number): Facility[] => {
  const facilities: Facility[] = []
  const types: FacilityType[] = ['mana_turbine', 'solar_tower', 'geothermal_core']
  const typeWeights = [0.45, 0.35, 0.2]
  const terrains = Object.keys(TERRAIN_CONFIG) as TerrainType[]
  
  for (let i = 0; i < count; i++) {
    const type = weightedChoice(types, typeWeights)
    const config = FACILITY_CONFIG[type]
    const terrain = randomChoice(terrains)
    const level = randomInt(1, 10)
    
    facilities.push({
      id: generateId('fcl'),
      playerId,
      type,
      name: `${config.name} #${i + 1}`,
      level,
      x: randomInt(50, 750),
      y: randomInt(50, 550),
      terrain,
      baseOutput: config.baseOutput * (1 + (level - 1) * 0.15),
      efficiency: randomBetween(0.7, 1.4),
      lastMaintenance: Date.now() - randomInt(0, 86400000),
      maintenanceCost: Math.floor(config.baseMaintenance * (1 + (level - 1) * 0.2)),
      durability: randomBetween(0.5, 1.0),
      maxDurability: 1.0,
      createdAt: Date.now() - randomInt(86400000, 864000000),
      isActive: Math.random() > 0.1,
      specialModifiers: [],
    })
  }
  
  return facilities
}

export const generateAllFacilities = (count: number): Facility[] => {
  const facilities: Facility[] = []
  const types: FacilityType[] = ['mana_turbine', 'solar_tower', 'geothermal_core']
  const typeWeights = [0.4, 0.35, 0.25]
  const terrains = Object.keys(TERRAIN_CONFIG) as TerrainType[]
  
  for (let i = 0; i < count; i++) {
    const type = weightedChoice(types, typeWeights)
    const config = FACILITY_CONFIG[type]
    const terrain = randomChoice(terrains)
    const level = randomInt(1, 15)
    
    facilities.push({
      id: generateId('fcl'),
      playerId: generateId('plr'),
      type,
      name: `${config.name}-${randomInt(1000, 9999)}`,
      level,
      x: randomInt(0, 800),
      y: randomInt(0, 600),
      terrain,
      baseOutput: config.baseOutput * (1 + (level - 1) * 0.15),
      efficiency: randomBetween(0.5, 1.8),
      lastMaintenance: Date.now() - randomInt(0, 172800000),
      maintenanceCost: Math.floor(config.baseMaintenance * (1 + (level - 1) * 0.2)),
      durability: randomBetween(0.3, 1.0),
      maxDurability: 1.0,
      createdAt: Date.now() - randomInt(86400000, 2592000000),
      isActive: Math.random() > 0.15,
      specialModifiers: [],
    })
  }
  
  return facilities
}

export const generateMockOrders = (count: number): Order[] => {
  const orders: Order[] = []
  
  for (let i = 0; i < count; i++) {
    const isBuy = Math.random() > 0.5
    const player = generateMockPlayer()
    
    orders.push({
      id: generateId('ord'),
      playerId: player.id,
      playerName: player.name,
      type: isBuy ? 'buy' : 'sell',
      amount: randomInt(100, 10000),
      filledAmount: 0,
      price: Math.floor(randomBetween(80, 150)),
      timestamp: Date.now() - randomInt(0, 3600000),
      status: 'pending',
      expiresAt: Date.now() + randomInt(60000, 3600000),
    })
  }
  
  return orders
}

export const generateMockTrades = (count: number): Trade[] => {
  const trades: Trade[] = []
  
  for (let i = 0; i < count; i++) {
    const buyer = generateMockPlayer()
    const seller = generateMockPlayer()
    const amount = randomInt(100, 5000)
    const price = Math.floor(randomBetween(90, 140))
    
    trades.push({
      id: generateId('trd'),
      buyOrderId: generateId('ord'),
      sellOrderId: generateId('ord'),
      buyerId: buyer.id,
      sellerId: seller.id,
      amount,
      price,
      timestamp: Date.now() - randomInt(0, 86400000),
      regionId: `reg-${String(randomInt(1, 10)).padStart(3, '0')}`,
      fee: Math.floor(amount * price * 0.005),
    })
  }
  
  return trades.sort((a, b) => b.timestamp - a.timestamp)
}

export const generatePriceHistory = (hours: number = 168): PriceHistory[] => {
  const history: PriceHistory[] = []
  const now = Date.now()
  const interval = 1800000
  let price = 100
  
  for (let i = hours * 2; i >= 0; i--) {
    const change = randomBetween(-8, 8)
    price = Math.max(50, Math.min(200, price + change))
    const trend = Math.sin(i / 20) * 10
    price += trend
    
    history.push({
      timestamp: now - i * interval,
      price: Math.floor(price),
      volume: randomInt(10000, 100000),
      regionId: 'reg-001',
    })
  }
  
  return history
}

export const generateMockGuilds = (): Guild[] => {
  const guilds: Guild[] = []
  
  for (let i = 0; i < 8; i++) {
    const leader = generateMockPlayer()
    const guild = createGuild(GUILD_NAMES[i] || `公会${i + 1}`, leader)
    
    for (let j = 0; j < randomInt(10, 80); j++) {
      const member = generateMockPlayer()
      guild.members.push(member.id)
      guild.memberCount++
    }
    
    if (guild.memberCount >= 5) {
      guild.viceLeaders = [guild.members[1]]
    }
    if (guild.memberCount >= 8) {
      guild.techOfficers = [guild.members[2]]
    }
    
    guild.gold = randomInt(100000, 10000000)
    guild.materials = {
      mana_crystal: randomInt(1000, 50000),
      arcane_core: randomInt(100, 5000),
      dragon_scale: randomInt(10, 500),
    }
    guild.level = randomInt(1, 10)
    guild.gridCoverage = randomInt(100, 1000)
    guild.totalContribution = randomInt(10000, 1000000)
    
    if (i < 5) {
      guild.hub = createSuperHub(guild, i)
      guild.hub.level = randomInt(1, 4)
      guild.efficiencyBonus = guild.hub.level * 0.05
      guild.feeDiscount = guild.hub.level * 0.03
    }
    
    guilds.push(guild)
  }
  
  return guilds
}

export const generateLeaderboards = (
  type: 'generation' | 'trading' | 'guild_coverage',
  count: number = 100
): LeaderboardEntry[] => {
  const entries: LeaderboardEntry[] = []
  const usedNames = new Set<string>()
  
  for (let i = 0; i < count; i++) {
    let player: Player
    do {
      player = generateMockPlayer()
    } while (usedNames.has(player.name))
    usedNames.add(player.name)
    
    let value: number
    switch (type) {
      case 'generation':
        value = Math.floor(randomInt(100000, 50000000) / (i + 1))
        break
      case 'trading':
        value = Math.floor(randomInt(10000, 10000000) / (i + 1))
        break
      case 'guild_coverage':
        value = Math.floor(randomInt(500, 10000) / (i + 1) * 10)
        break
    }
    
    entries.push({
      rank: i + 1,
      playerId: player.id,
      playerName: player.name,
      avatar: player.avatar,
      value,
      change: randomInt(-10, 10),
      guildName: Math.random() > 0.4 ? randomChoice(GUILD_NAMES) : null,
    })
  }
  
  return entries
}

export const generateMockNotifications = (): Notification[] => {
  const templates = [
    { type: 'event' as const, title: '能源过载警告', message: '您的魔力涡轮#3即将过载，请及时处理！' },
    { type: 'success' as const, title: '订单成交', message: '您的出售订单已全部成交，获得125,600金币' },
    { type: 'info' as const, title: '公会升级', message: '您的公会能源枢纽已升级至Lv.3！' },
    { type: 'warning' as const, title: '线路受损', message: '连接暴风城区的输电线路因风暴受损' },
    { type: 'event' as const, title: '魔力潮汐来袭', message: '全服魔力潮汐，能源产出提升30%！' },
    { type: 'error' as const, title: '维护提醒', message: '您的地热核心耐久度过低，建议维修' },
    { type: 'success' as const, title: '设施建造完成', message: '您的太阳能塔已建造完成并开始发电' },
    { type: 'info' as const, title: '审批通过', message: '您提交的枢纽升级申请已全员通过' },
  ]
  
  return templates.map((t, i) => ({
    id: generateId('not'),
    type: t.type,
    title: t.title,
    message: t.message,
    timestamp: Date.now() - i * randomInt(60000, 3600000),
    read: Math.random() > 0.6,
  }))
}

export const generateMockGridEvents = (): GridEvent[] => {
  const events: GridEvent[] = []
  const types: EventType[] = ['mana_tide', 'efficiency_boost', 'storm', 'energy_overload']
  
  for (let i = 0; i < 5; i++) {
    const type = randomChoice<EventType>(types)
    const severity = randomInt(2, 4) as 1 | 2 | 3 | 4 | 5
    const duration = randomInt(15000, 60000)
    
    events.push({
      id: generateId('evt'),
      type,
      severity,
      regionId: `reg-${String(randomInt(1, 10)).padStart(3, '0')}`,
      lineId: Math.random() > 0.5 ? generateId('lin') : null,
      facilityId: Math.random() > 0.7 ? generateId('fcl') : null,
      startTime: Date.now() - randomInt(0, 120000),
      endTime: Date.now() + duration,
      description: `区域${type === 'mana_tide' ? '魔力潮汐' : type === 'efficiency_boost' ? '效率提升' : type === 'storm' ? '魔法风暴' : '能源过载'}事件`,
      effect: {
        outputMultiplier: type === 'storm' ? 1 - 0.1 * severity / 3 : 1 + 0.1 * severity / 3,
      },
      isActive: true,
    })
  }
  
  return events
}

export { createInitialWeather }
