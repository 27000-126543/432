import { create } from 'zustand'
import type {
  Player,
  Facility,
  WeatherState,
  GridRegion,
  GridLine,
  GridEvent,
  Order,
  Trade,
  PriceHistory,
  SupplyDemandSnapshot,
  HeatmapCell,
  Guild,
  LeaderboardEntry,
  Notification,
  DashboardStats,
  ServerLoad,
  FacilityType,
  OrderType,
  TerrainType,
  SpecialModifier,
} from '@/types'
import {
  generateCurrentPlayer,
  generateMockFacilities,
  generateAllFacilities,
  generateMockOrders,
  generateMockTrades,
  generatePriceHistory,
  generateMockGuilds,
  generateLeaderboards,
  generateMockNotifications,
  generateMockGridEvents,
  createInitialWeather,
} from '@/mock/dataGenerator'
import {
  initializeGridLines,
  initializeGridRegions,
  updateGridLineStatus,
  generateHeatmap,
  generateSupplyDemandSnapshot,
  updateServerLoads,
  simulateRegionFlow,
  calculateGridStability,
} from '@/engine/gridEngine'
import {
  updateWeather,
  generateRandomEvent,
} from '@/engine/weatherEngine'
import {
  calculateFacilityEfficiency,
  calculateFacilityOutput,
  calculateFacilityDurabilityDecay,
  calculateUpgradeCost,
  calculateRepairCost,
  generateSpecialModifier,
  calculateMaintenanceCost,
} from '@/engine/facilityEngine'
import {
  matchOrders,
  calculateDynamicPrice,
  createOrder as createNewOrder,
  getOrderBookStats,
} from '@/engine/exchangeEngine'
import { GRID_CONSTANTS, FACILITY_CONFIG } from '@/constants'
import { generateId, randomBetween, randomInt, randomChoice, clamp } from '@/utils'
import {
  createGuild,
  startHubUpgrade,
  contributeToUpgrade,
  approveUpgrade,
  completeUpgrade,
  calculateGuildBonus,
  createSuperHub,
} from '@/engine/guildEngine'
import type { PDFReportData } from '@/utils/pdfExport'

interface GameState {
  currentPlayer: Player
  allPlayers: Map<string, Player>
  
  playerFacilities: Facility[]
  allFacilities: Facility[]
  
  weather: WeatherState
  
  gridRegions: GridRegion[]
  gridLines: GridLine[]
  gridEvents: GridEvent[]
  heatmapCells: HeatmapCell[]
  supplyDemandSnapshots: SupplyDemandSnapshot[]
  serverLoads: ServerLoad[]
  
  buyOrders: Order[]
  sellOrders: Order[]
  trades: Trade[]
  priceHistory: PriceHistory[]
  currentPrice: number
  priceChange24h: number
  
  guilds: Guild[]
  
  leaderboards: {
    generation: LeaderboardEntry[]
    trading: LeaderboardEntry[]
    guildCoverage: LeaderboardEntry[]
  }
  
  notifications: Notification[]
  
  stats: DashboardStats
  lastUpdate: number
  tickCount: number
  
  actions: {
    tick: () => void
    updateEvery5Seconds: () => void
    updateEvery30Seconds: () => void
    
    buildFacility: (type: FacilityType, terrain: TerrainType, x: number, y: number) => boolean
    upgradeFacility: (facilityId: string) => boolean
    repairFacility: (facilityId: string) => boolean
    toggleFacility: (facilityId: string) => void
    maintainFacility: (facilityId: string) => void
    
    placeOrder: (type: OrderType, amount: number, price: number) => boolean
    cancelOrder: (orderId: string) => void
    getOrderBook: () => ReturnType<typeof getOrderBookStats>
    
    reinforceGridLine: (lineId: string) => void
    dispatchRepairTeam: (lineId: string) => void
    
    joinGuild: (guildId: string) => void
    leaveGuild: () => void
    createGuild: (name: string) => void
    contributeToGuild: (gold: number, materials: Record<string, number>) => void
    requestHubUpgrade: () => void
    approveHubUpgrade: (role: 'leader' | 'viceLeader' | 'techOfficer', approve: boolean) => void
    buildHub: (regionIndex: number) => boolean
    appointMember: (memberId: string, role: 'vice_leader' | 'tech_officer' | 'member') => boolean
    
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
    markNotificationRead: (notificationId: string) => void
    markAllNotificationsRead: () => void
    
    getFacilityOutputDetails: (facilityId: string) => {
      baseOutput: number
      efficiency: number
      actualOutput: number
      weatherBonus: number
      terrainBonus: number
      synergyBonus: number
      maintenanceCost: number
    }
    
    exportReport: (options?: {
      playerInfo?: boolean
      summary?: boolean
      facilities?: boolean
      priceChart?: boolean
      supplyDemandChart?: boolean
      radarChart?: boolean
      leaderboard?: boolean
      guild?: boolean
    }) => Promise<void>
  }
}

export const useGameStore = create<GameState>((set, get) => {
  const initialPlayer = generateCurrentPlayer()
  const initialPlayerFacilities = generateMockFacilities(initialPlayer.id, 12)
  const initialAllFacilities = generateAllFacilities(500)
  const initialRegions = initializeGridRegions()
  const initialLines = initializeGridLines()
  const initialBuyOrders = generateMockOrders(150)
  const initialSellOrders = generateMockOrders(150)
  const initialTrades = generateMockTrades(100)
  const initialPriceHistory = generatePriceHistory(168)
  const initialGuilds = generateMockGuilds()
  const initialGridEvents = generateMockGridEvents()
  const initialHeatmap = generateHeatmap(initialRegions, initialLines, GRID_CONSTANTS.HEATMAP_SIZE)
  const initialSnapshots = generateSupplyDemandSnapshot(initialRegions)
  const initialServerLoads = updateServerLoads()
  const initialNotifications = generateMockNotifications()
  
  const initialPrice = initialPriceHistory.length > 0 
    ? initialPriceHistory[initialPriceHistory.length - 1].price 
    : GRID_CONSTANTS.BASE_PRICE
  
  const price24hAgo = initialPriceHistory.length >= 48
    ? initialPriceHistory[initialPriceHistory.length - 48].price
    : initialPrice
  const priceChange24h = (initialPrice - price24hAgo) / price24hAgo
  
  const totalSupply = initialRegions.reduce((s, r) => s + r.totalSupply, 0)
  const totalDemand = initialRegions.reduce((s, r) => s + r.totalDemand, 0)
  const activeFacilitiesCount = initialAllFacilities.filter(f => f.isActive).length
  const avgLossRate = initialLines.reduce((s, l) => s + l.lossRate, 0) / Math.max(initialLines.length, 1)
  const gridStability = calculateGridStability(initialLines, initialRegions)
  const totalTrades24h = initialTrades.filter(t => t.timestamp > Date.now() - 86400000).length
  const totalVolume24h = initialTrades
    .filter(t => t.timestamp > Date.now() - 86400000)
    .reduce((s, t) => s + t.amount * t.price, 0)
  const totalOnlinePlayers = initialServerLoads.reduce((s, sl) => s + sl.onlinePlayers, 0)
  
  return {
    currentPlayer: initialPlayer,
    allPlayers: new Map(),
    
    playerFacilities: initialPlayerFacilities,
    allFacilities: initialAllFacilities,
    
    weather: createInitialWeather(),
    
    gridRegions: initialRegions,
    gridLines: initialLines,
    gridEvents: initialGridEvents,
    heatmapCells: initialHeatmap,
    supplyDemandSnapshots: initialSnapshots,
    serverLoads: initialServerLoads,
    
    buyOrders: initialBuyOrders.filter(o => o.type === 'buy'),
    sellOrders: initialSellOrders.filter(o => o.type === 'sell'),
    trades: initialTrades,
    priceHistory: initialPriceHistory,
    currentPrice: initialPrice,
    priceChange24h,
    
    guilds: initialGuilds,
    
    leaderboards: {
      generation: generateLeaderboards('generation', 100),
      trading: generateLeaderboards('trading', 100),
      guildCoverage: generateLeaderboards('guild_coverage', 50),
    },
    
    notifications: initialNotifications,
    
    stats: {
      totalGenerated: totalSupply,
      totalConsumed: totalDemand,
      currentPrice: initialPrice,
      priceChange24h,
      activeFacilities: activeFacilitiesCount,
      activePlayers: totalOnlinePlayers,
      totalTrades24h,
      totalVolume24h,
      gridStability,
      avgLossRate,
    },
    
    lastUpdate: Date.now(),
    tickCount: 0,
    
    actions: {
      tick: () => {
        const state = get()
        const now = Date.now()
        const newTick = state.tickCount + 1
        
        const expiredEvents = state.gridEvents.filter(e => e.isActive && e.endTime <= now)
        if (expiredEvents.length > 0) {
          for (const ev of expiredEvents) {
            get().actions.addNotification({
              type: 'info',
              title: '事件结束',
              message: `${ev.type === 'energy_overload' ? '能源过载' : ev.type === 'mana_tide' ? '魔力潮汐' : ev.type === 'storm' ? '魔法风暴' : ev.type === 'energy_theft' ? '窃能事件' : ev.type === 'efficiency_boost' ? '效率提升' : '价格震荡'}事件已结束`,
            })
          }
        }
        const markedGridEvents = state.gridEvents.map(e => (e.endTime <= now ? { ...e, isActive: false } : e))
        const activeGridEvents = markedGridEvents.filter(e => e.isActive && e.endTime > now)
        
        const weather = updateWeather(state.weather)
        
        let allFacilities = state.allFacilities.map(f => {
          const eventOutputMultiplier = activeGridEvents.reduce((mult, ev) => {
            if (ev.effect.outputMultiplier === undefined) return mult
            const match =
              (ev.facilityId && ev.facilityId === f.id) ||
              (!ev.facilityId && !ev.regionId) ||
              (!ev.facilityId && ev.regionId && Math.random() < 0.3)
            return match ? mult * ev.effect.outputMultiplier : mult
          }, 1)

          if (!f.isActive) return { ...f, eventMultiplier: eventOutputMultiplier }
          
          const nearby = state.allFacilities.filter(other => {
            if (other.id === f.id || !other.isActive) return false
            const dx = other.x - f.x
            const dy = other.y - f.y
            return Math.sqrt(dx * dx + dy * dy) < 80
          })
          
          const efficiency = calculateFacilityEfficiency(f, weather, nearby)
          const decay = calculateFacilityDurabilityDecay(f, weather)
          
          let newModifiers = f.specialModifiers.filter(
            m => m.expiresAt === null || m.expiresAt > now
          )
          
          if (Math.random() < 0.001) {
            const modifier = generateSpecialModifier(f.type)
            if (modifier) newModifiers.push(modifier)
          }
          
          return {
            ...f,
            efficiency,
            durability: Math.max(0, f.durability - decay * 0.01),
            specialModifiers: newModifiers,
            eventMultiplier: eventOutputMultiplier,
          }
        })
        
        let playerFacilities = state.playerFacilities.map(f => {
          const allF = allFacilities.find(af => af.id === f.id)
          if (allF) return allF
          
          const eventOutputMultiplier = activeGridEvents.reduce((mult, ev) => {
            if (ev.effect.outputMultiplier === undefined) return mult
            const match =
              (ev.facilityId && ev.facilityId === f.id) ||
              (!ev.facilityId && !ev.regionId) ||
              (!ev.facilityId && ev.regionId && Math.random() < 0.3)
            return match ? mult * ev.effect.outputMultiplier : mult
          }, 1)

          const nearby = state.playerFacilities.filter(other => {
            if (other.id === f.id || !other.isActive) return false
            const dx = other.x - f.x
            const dy = other.y - f.y
            return Math.sqrt(dx * dx + dy * dy) < 80
          })
          
          const efficiency = calculateFacilityEfficiency(f, weather, nearby)
          const decay = calculateFacilityDurabilityDecay(f, weather)
          
          return {
            ...f,
            efficiency,
            durability: Math.max(0, f.durability - decay * 0.01),
            eventMultiplier: eventOutputMultiplier,
          }
        })
        
        const baseGridLines = state.gridLines.map(updateGridLineStatus)
        const processedLines = baseGridLines.map(line => {
          let newLine = { ...line }
          
          if (newLine.baseLossRate === undefined) newLine.baseLossRate = newLine.lossRate
          
          let totalTempAddon = 0
          for (const ev of activeGridEvents) {
            const match =
              (ev.lineId && ev.lineId === line.id) ||
              (!ev.lineId && Math.random() < 0.3)
            if (!match) continue
            
            if (ev.effect.durabilityDamage) {
              newLine.durability = Math.max(0, newLine.durability - ev.effect.durabilityDamage / 1000)
            }
            if (ev.effect.lossRateIncrease) {
              totalTempAddon += ev.effect.lossRateIncrease
            }
          }
          newLine.eventAppliedLossRate = totalTempAddon
          newLine.temporaryLossRate = totalTempAddon
          
          const baseLoss = newLine.baseLossRate || 0.03
          const targetLoss = clamp(baseLoss * (1 + totalTempAddon), 0.005, 0.8)
          newLine.lossRate = newLine.lossRate * 0.9 + targetLoss * 0.1
          
          if (totalTempAddon > 0.01) {
            newLine.displayStatus = 'damaged'
          } else if (newLine.lossRate > baseLoss * 1.1) {
            newLine.displayStatus = 'recovering'
          } else {
            newLine.displayStatus = 'normal'
          }
          
          return newLine
        })
        
        let gridEvents = markedGridEvents.filter(e => e.endTime > now)
        const newEvent = generateRandomEvent(
          state.gridRegions.map(r => r.id),
          processedLines.map(l => l.id),
          allFacilities.filter(f => f.isActive).map(f => f.id)
        )
        if (newEvent) {
          gridEvents = [...gridEvents, newEvent]
          get().actions.addNotification({
            type: 'event',
            title: `${newEvent.type === 'energy_overload' ? '能源过载' : 
                    newEvent.type === 'mana_tide' ? '魔力潮汐' :
                    newEvent.type === 'storm' ? '魔法风暴' :
                    newEvent.type === 'energy_theft' ? '窃能事件' :
                    newEvent.type === 'efficiency_boost' ? '效率提升' : '价格震荡'}警报`,
            message: newEvent.description,
          })
        }
        
        const eventMultiplier = activeGridEvents
          .filter(e => e.effect.priceMultiplier)
          .reduce((acc, e) => acc * (e.effect.priceMultiplier || 1), 1)
        
        const totalSupply = state.gridRegions.reduce((s, r) => s + r.totalSupply, 0)
        const totalDemand = state.gridRegions.reduce((s, r) => s + r.totalDemand, 0)
        const newPrice = calculateDynamicPrice(totalSupply, totalDemand, state.priceHistory, eventMultiplier)
        
        const { trades: matchedTrades, updatedBuyOrders, updatedSellOrders } = matchOrders(
          state.buyOrders,
          state.sellOrders
        )
        
        let trades = state.trades
        let player = state.currentPlayer
        
        if (matchedTrades.length > 0) {
          trades = [...matchedTrades, ...state.trades].slice(0, 200)
          
          for (const trade of matchedTrades) {
            if (trade.buyerId === player.id) {
              const buyPrice = trade.buyOrderPrice || trade.price
              const refund = Math.max(0, Math.floor((buyPrice - trade.price) * trade.amount))
              player = {
                ...player,
                manaTokens: player.manaTokens + trade.amount,
                gold: player.gold + refund,
                totalTraded: player.totalTraded + 1,
              }
            }
            if (trade.sellerId === player.id) {
              const receive = Math.floor(trade.amount * trade.price - trade.fee)
              player = {
                ...player,
                gold: player.gold + receive,
                totalTraded: player.totalTraded + 1,
              }
            }
          }
        }
        
        const { regions: flowRegions, lines: flowLines } = simulateRegionFlow(
          state.gridRegions,
          processedLines
        )
        
        let buyOrders = updatedBuyOrders.filter(
          o => (o.status === 'pending' || o.status === 'partial') && o.expiresAt > now
        )
        let sellOrders = updatedSellOrders.filter(
          o => (o.status === 'pending' || o.status === 'partial') && o.expiresAt > now
        )
        
        if (Math.random() < 0.3) {
          const types: OrderType[] = ['buy', 'sell']
          for (let i = 0; i < randomInt(1, 5); i++) {
            const mockPlayer = generateId('plr')
            const type = randomChoice(types)
            const order = createNewOrder(
              mockPlayer,
              `玩家_${randomInt(1000, 9999)}`,
              type,
              randomInt(100, 5000),
              Math.floor(newPrice * randomBetween(0.9, 1.1))
            )
            if (type === 'buy') {
              buyOrders.push(order)
            } else {
              sellOrders.push(order)
            }
          }
        }
        
        set({
          tickCount: newTick,
          lastUpdate: now,
          weather,
          allFacilities,
          playerFacilities,
          gridLines: flowLines,
          gridEvents,
          buyOrders,
          sellOrders,
          trades,
          currentPrice: newPrice,
          gridRegions: flowRegions,
          currentPlayer: player,
        })
      },
      
      updateEvery5Seconds: () => {
        const state = get()
        const now = Date.now()
        
        const heatmap = generateHeatmap(state.gridRegions, state.gridLines, GRID_CONSTANTS.HEATMAP_SIZE)
        const snapshot = generateSupplyDemandSnapshot(state.gridRegions)
        
        const newHistoryPoint: PriceHistory = {
          timestamp: now,
          price: state.currentPrice,
          volume: state.trades.slice(0, 10).reduce((s, t) => s + t.amount, 0),
          regionId: 'reg-001',
        }
        
        const priceHistory = [...state.priceHistory.slice(-GRID_CONSTANTS.PRICE_HISTORY_POINTS), newHistoryPoint]
        
        const price24hAgo = priceHistory.length >= 48
          ? priceHistory[priceHistory.length - 48].price
          : state.currentPrice
        const priceChange24h = price24hAgo > 0 ? (state.currentPrice - price24hAgo) / price24hAgo : 0
        
        const gridRegions = state.gridRegions.map(r => ({
          ...r,
          totalSupply: Math.floor(r.totalSupply * randomBetween(0.98, 1.02)),
          totalDemand: Math.floor(r.totalDemand * randomBetween(0.98, 1.02)),
          congestionLevel: clamp(r.congestionLevel + randomBetween(-0.02, 0.02), 0.1, 0.95),
          priceMultiplier: clamp(r.priceMultiplier + randomBetween(-0.01, 0.01), 0.8, 1.2),
        }))
        
        const totalSupply = gridRegions.reduce((s, r) => s + r.totalSupply, 0)
        const totalDemand = gridRegions.reduce((s, r) => s + r.totalDemand, 0)
        const baseStability = calculateGridStability(state.gridLines, gridRegions)
        const eventPenalty = clamp(1 - state.gridLines.reduce((s, l) => s + (l.eventAppliedLossRate || 0), 0) / Math.max(state.gridLines.length, 1) * 0.5, 0.5, 1)
        const gridStability = clamp(baseStability * eventPenalty, 0, 1)
        const avgLossRate = state.gridLines.reduce((s, l) => s + l.lossRate, 0) / Math.max(state.gridLines.length, 1)
        
        const totalGenerated = state.playerFacilities
          .filter(f => f.isActive)
          .reduce((s, f) => {
            const base = calculateFacilityOutput(f, f.efficiency)
            const mult = (f as any).eventMultiplier || 1
            return s + base * mult
          }, 0)
        
        const currentPlayer = {
          ...state.currentPlayer,
          totalGenerated: state.currentPlayer.totalGenerated + totalGenerated * 5,
        }
        
        set({
          heatmapCells: heatmap,
          supplyDemandSnapshots: [...state.supplyDemandSnapshots.slice(-200), ...snapshot],
          priceHistory,
          priceChange24h,
          gridRegions,
          stats: {
            ...state.stats,
            totalGenerated: totalSupply,
            totalConsumed: totalDemand,
            currentPrice: state.currentPrice,
            priceChange24h,
            gridStability,
            avgLossRate,
          },
          currentPlayer,
        })
      },
      
      updateEvery30Seconds: () => {
        const state = get()
        const serverLoads = updateServerLoads()
        const totalOnlinePlayers = serverLoads.reduce((s, sl) => s + sl.onlinePlayers, 0)
        
        const newGeneration = [...state.leaderboards.generation]
        const newTrading = [...state.leaderboards.trading]
        
        for (let i = 0; i < 10; i++) {
          const idx = randomInt(0, newGeneration.length - 1)
          newGeneration[idx] = {
            ...newGeneration[idx],
            change: randomInt(-5, 5),
          }
        }
        
        set({
          serverLoads,
          leaderboards: {
            ...state.leaderboards,
            generation: newGeneration,
            trading: newTrading,
          },
          stats: {
            ...state.stats,
            activePlayers: totalOnlinePlayers,
          },
        })
      },
      
      buildFacility: (type, terrain, x, y) => {
        const state = get()
        const config = FACILITY_CONFIG[type]
        const cost = config.baseCost
        
        if (state.currentPlayer.gold < cost) {
          get().actions.addNotification({
            type: 'error',
            title: '建造失败',
            message: '金币不足，无法建造设施',
          })
          return false
        }
        
        const facility: Facility = {
          id: generateId('fcl'),
          playerId: state.currentPlayer.id,
          type,
          name: `${config.name} #${state.playerFacilities.length + 1}`,
          level: 1,
          x,
          y,
          terrain,
          baseOutput: config.baseOutput,
          efficiency: 1,
          lastMaintenance: Date.now(),
          maintenanceCost: config.baseMaintenance,
          durability: 1,
          maxDurability: 1,
          createdAt: Date.now(),
          isActive: true,
          specialModifiers: [],
        }
        
        set({
          currentPlayer: {
            ...state.currentPlayer,
            gold: state.currentPlayer.gold - cost,
          },
          playerFacilities: [...state.playerFacilities, facility],
          allFacilities: [...state.allFacilities, facility],
        })
        
        get().actions.addNotification({
          type: 'success',
          title: '建造成功',
          message: `${config.name}已建造完成并开始发电`,
        })
        
        return true
      },
      
      upgradeFacility: (facilityId) => {
        const state = get()
        const facility = state.playerFacilities.find(f => f.id === facilityId)
        if (!facility) return false
        
        const cost = calculateUpgradeCost(facility)
        if (state.currentPlayer.gold < cost) {
          get().actions.addNotification({
            type: 'error',
            title: '升级失败',
            message: '金币不足，无法升级设施',
          })
          return false
        }
        
        const updatedFacilities = state.playerFacilities.map(f => {
          if (f.id === facilityId) {
            const config = FACILITY_CONFIG[f.type]
            return {
              ...f,
              level: f.level + 1,
              baseOutput: config.baseOutput * (1 + f.level * 0.15),
              durability: f.maxDurability,
              maxDurability: 1,
            }
          }
          return f
        })
        
        set({
          currentPlayer: {
            ...state.currentPlayer,
            gold: state.currentPlayer.gold - cost,
          },
          playerFacilities: updatedFacilities,
        })
        
        get().actions.addNotification({
          type: 'success',
          title: '升级成功',
          message: `${facility.name}已升级至Lv.${facility.level + 1}`,
        })
        
        return true
      },
      
      repairFacility: (facilityId) => {
        const state = get()
        const facility = state.playerFacilities.find(f => f.id === facilityId)
        if (!facility) return false
        
        const cost = calculateRepairCost(facility)
        if (state.currentPlayer.gold < cost) {
          get().actions.addNotification({
            type: 'error',
            title: '维修失败',
            message: '金币不足，无法维修设施',
          })
          return false
        }
        
        const updatedFacilities = state.playerFacilities.map(f => {
          if (f.id === facilityId) {
            return {
              ...f,
              durability: f.maxDurability,
            }
          }
          return f
        })
        
        set({
          currentPlayer: {
            ...state.currentPlayer,
            gold: state.currentPlayer.gold - cost,
          },
          playerFacilities: updatedFacilities,
        })
        
        return true
      },
      
      toggleFacility: (facilityId) => {
        set(state => ({
          playerFacilities: state.playerFacilities.map(f =>
            f.id === facilityId ? { ...f, isActive: !f.isActive } : f
          ),
        }))
      },
      
      maintainFacility: (facilityId) => {
        const state = get()
        const facility = state.playerFacilities.find(f => f.id === facilityId)
        if (!facility) return
        
        const cost = calculateMaintenanceCost(facility)
        if (state.currentPlayer.gold < cost) {
          get().actions.addNotification({
            type: 'error',
            title: '维护失败',
            message: '金币不足',
          })
          return
        }
        
        const updatedFacilities = state.playerFacilities.map(f => {
          if (f.id === facilityId) {
            return {
              ...f,
              lastMaintenance: Date.now(),
              durability: Math.min(f.maxDurability, f.durability + 0.1),
            }
          }
          return f
        })
        
        set({
          currentPlayer: {
            ...state.currentPlayer,
            gold: state.currentPlayer.gold - cost,
          },
          playerFacilities: updatedFacilities,
        })
      },
      
      placeOrder: (type, amount, price) => {
        const state = get()
        const player = state.currentPlayer
        
        const totalCost = amount * price
        
        if (type === 'buy' && player.gold < totalCost) {
          get().actions.addNotification({
            type: 'error',
            title: '下单失败',
            message: '金币不足',
          })
          return false
        }
        
        if (type === 'sell' && player.manaTokens < amount) {
          get().actions.addNotification({
            type: 'error',
            title: '下单失败',
            message: '魔力代币不足',
          })
          return false
        }
        
        const order = createNewOrder(
          player.id,
          player.name,
          type,
          amount,
          price
        )
        
        let updatedPlayer = { ...player }
        if (type === 'buy') {
          updatedPlayer.gold -= totalCost
        } else {
          updatedPlayer.manaTokens -= amount
        }
        
        if (type === 'buy') {
          set({
            buyOrders: [...state.buyOrders, order],
            currentPlayer: updatedPlayer,
          })
        } else {
          set({
            sellOrders: [...state.sellOrders, order],
            currentPlayer: updatedPlayer,
          })
        }
        
        get().actions.addNotification({
          type: 'success',
          title: '下单成功',
          message: `已提交${type === 'buy' ? '买入' : '卖出'}订单：${amount}魔力 @ ${price}金币`,
        })
        
        return true
      },
      
      cancelOrder: (orderId) => {
        const state = get()
        const buyOrder = state.buyOrders.find(o => o.id === orderId)
        const sellOrder = state.sellOrders.find(o => o.id === orderId)
        const order = buyOrder || sellOrder
        
        if (!order) return
        
        let player = state.currentPlayer
        const remaining = order.amount - order.filledAmount
        
        if (order.type === 'buy') {
          player = {
            ...player,
            gold: player.gold + remaining * order.price,
          }
        } else {
          player = {
            ...player,
            manaTokens: player.manaTokens + remaining,
          }
        }
        
        set({
          buyOrders: state.buyOrders.filter(o => o.id !== orderId),
          sellOrders: state.sellOrders.filter(o => o.id !== orderId),
          currentPlayer: player,
        })
      },
      
      getOrderBook: () => {
        const state = get()
        return getOrderBookStats([...state.buyOrders, ...state.sellOrders])
      },
      
      reinforceGridLine: (lineId) => {
        const state = get()
        const cost = 5000
        
        if (state.currentPlayer.gold < cost) {
          get().actions.addNotification({
            type: 'error',
            title: '加固失败',
            message: '金币不足',
          })
          return
        }
        
        const gridLines = state.gridLines.map(l => {
          if (l.id === lineId) {
            return {
              ...l,
              durability: Math.min(l.maxDurability, l.durability + 0.3),
              lossRate: Math.max(0.005, l.lossRate - 0.01),
              lastReinforced: Date.now(),
            }
          }
          return l
        })
        
        set({
          gridLines,
          currentPlayer: {
            ...state.currentPlayer,
            gold: state.currentPlayer.gold - cost,
          },
        })
      },
      
      dispatchRepairTeam: (lineId) => {
        const cost = 10000
        const state = get()
        
        if (state.currentPlayer.gold < cost) {
          get().actions.addNotification({
            type: 'error',
            title: '派遣失败',
            message: '金币不足',
          })
          return
        }
        
        const gridLines = state.gridLines.map(l => {
          if (l.id === lineId) {
            return {
              ...l,
              durability: l.maxDurability,
              status: 'normal' as const,
            }
          }
          return l
        })
        
        set({
          gridLines,
          currentPlayer: {
            ...state.currentPlayer,
            gold: state.currentPlayer.gold - cost,
          },
        })
        
        get().actions.addNotification({
          type: 'success',
          title: '修复队已派遣',
          message: '修复队已到达目标位置并完成修复工作',
        })
      },
      
      joinGuild: (guildId) => {
        const state = get()
        if (state.currentPlayer.guildId) {
          get().actions.addNotification({
            type: 'warning',
            title: '加入失败',
            message: '您已在公会中，请先退出当前公会',
          })
          return
        }
        
        const guilds = state.guilds.map(g => {
          if (g.id === guildId && !g.members.includes(state.currentPlayer.id)) {
            return {
              ...g,
              members: [...g.members, state.currentPlayer.id],
              memberCount: g.memberCount + 1,
            }
          }
          return g
        })
        
        const targetGuild = guilds.find(g => g.id === guildId)
        
        set({
          guilds,
          currentPlayer: {
            ...state.currentPlayer,
            guildId,
            guildRole: 'member',
          },
        })
        
        if (targetGuild) {
          get().actions.addNotification({
            type: 'success',
            title: '加入公会',
            message: `您已成功加入「${targetGuild.name}」`,
          })
        }
      },
      
      leaveGuild: () => {
        const state = get()
        if (!state.currentPlayer.guildId) return
        
        const guilds = state.guilds.map(g => {
          if (g.id === state.currentPlayer.guildId) {
            return {
              ...g,
              members: g.members.filter(m => m !== state.currentPlayer.id),
              memberCount: Math.max(0, g.memberCount - 1),
              viceLeaders: g.viceLeaders.filter(id => id !== state.currentPlayer.id),
              techOfficers: g.techOfficers.filter(id => id !== state.currentPlayer.id),
            }
          }
          return g
        })
        
        set({
          guilds,
          currentPlayer: {
            ...state.currentPlayer,
            guildId: null,
            guildRole: null,
          },
        })
        
        get().actions.addNotification({
          type: 'info',
          title: '退出公会',
          message: '您已退出公会',
        })
      },
      
      createGuild: (name) => {
        const state = get()
        if (state.currentPlayer.guildId) return
        if (state.currentPlayer.gold < 1000000) {
          get().actions.addNotification({
            type: 'error',
            title: '创建失败',
            message: '创建公会需要1,000,000金币',
          })
          return
        }
        
        const newGuild = createGuild(name, state.currentPlayer)
        
        set({
          guilds: [...state.guilds, newGuild],
          currentPlayer: {
            ...state.currentPlayer,
            gold: state.currentPlayer.gold - 1000000,
            guildId: newGuild.id,
            guildRole: 'leader',
          },
        })
      },
      
      contributeToGuild: (gold, materials) => {
        const state = get()
        const player = state.currentPlayer
        if (!player.guildId) return
        
        if (player.gold < gold) {
          get().actions.addNotification({
            type: 'error',
            title: '贡献失败',
            message: '金币不足',
          })
          return
        }
        
        const guilds = state.guilds.map(g => {
          if (g.id === player.guildId) {
            const newMaterials = { ...g.materials }
            for (const [key, val] of Object.entries(materials)) {
              newMaterials[key] = (newMaterials[key] || 0) + val
            }
            
            let updatedGuild = {
              ...g,
              gold: g.gold + gold,
              materials: newMaterials,
              totalContribution: g.totalContribution + gold,
            }
            
            if (g.hub?.upgradeProcess) {
              const oldStatus = g.hub.upgradeProcess.status
              const newProcess = contributeToUpgrade(g.hub.upgradeProcess, gold, materials)
              
              if (oldStatus === 'collecting' && newProcess.status === 'approving') {
                const viceLeadersApprovals: Record<string, 'pending'> = {}
                for (const vl of g.viceLeaders) {
                  viceLeadersApprovals[vl] = 'pending'
                }
                const techOfficersApprovals: Record<string, 'pending'> = {}
                for (const to of g.techOfficers) {
                  techOfficersApprovals[to] = 'pending'
                }
                newProcess.approvals = {
                  ...newProcess.approvals,
                  viceLeaders: viceLeadersApprovals,
                  techOfficers: techOfficersApprovals,
                }
              }
              
              updatedGuild.hub = {
                ...g.hub,
                upgradeProcess: newProcess,
              }
            }
            
            return updatedGuild
          }
          return g
        })
        
        set({
          guilds,
          currentPlayer: {
            ...player,
            gold: player.gold - gold,
          },
        })
      },
      
      requestHubUpgrade: () => {
        const state = get()
        const player = state.currentPlayer
        if (!player.guildId || player.guildRole !== 'tech_officer') return
        
        const guild = state.guilds.find(g => g.id === player.guildId)
        if (!guild?.hub) return
        
        const process = startHubUpgrade(guild.hub)
        if (!process) return
        
        const guilds = state.guilds.map(g => {
          if (g.id === player.guildId && g.hub) {
            return {
              ...g,
              hub: {
                ...g.hub,
                upgradeProcess: process,
              },
            }
          }
          return g
        })
        
        set({ guilds })
      },
      
      approveHubUpgrade: (role, approve) => {
        const state = get()
        const player = state.currentPlayer
        if (!player.guildId) return
        
        const guild = state.guilds.find(g => g.id === player.guildId)
        if (!guild?.hub?.upgradeProcess) return
        
        const { process: updatedProcess, allApproved } = approveUpgrade(
          guild.hub.upgradeProcess,
          role,
          player.id,
          approve ? 'approved' : 'rejected'
        )
        
        let newHub = guild.hub
        if (allApproved) {
          newHub = completeUpgrade(guild.hub, updatedProcess)
          newHub.upgradeProcess = null
        }
        
        const guildBonus = newHub ? calculateGuildBonus({ ...guild, hub: newHub }) : null
        
        const guilds = state.guilds.map(g => {
          if (g.id === player.guildId) {
            return {
              ...g,
              hub: {
                ...newHub,
                upgradeProcess: !allApproved ? updatedProcess : null,
              },
              efficiencyBonus: guildBonus ? guildBonus.efficiencyBonus : g.efficiencyBonus,
              feeDiscount: guildBonus ? guildBonus.feeDiscount : g.feeDiscount,
              gridCoverage: guildBonus ? guildBonus.coverage : g.gridCoverage,
            }
          }
          return g
        })
        
        set({ guilds })
      },
      
      buildHub: (regionIndex) => {
        const state = get()
        const player = state.currentPlayer
        if (!player.guildId) return false
        if (player.guildRole !== 'leader' && player.guildRole !== 'vice_leader' && player.guildRole !== 'tech_officer') {
          get().actions.addNotification({ type: 'error', title: '无权限', message: '仅公会干部可建造枢纽' })
          return false
        }
        const guild = state.guilds.find(g => g.id === player.guildId)
        if (!guild) return false
        if (guild.hub) {
          get().actions.addNotification({ type: 'warning', title: '已存在枢纽', message: '该公会已建造超级能源枢纽' })
          return false
        }
        const cost = 500000
        if (guild.gold < cost) {
          get().actions.addNotification({ type: 'error', title: '金库不足', message: `建造枢纽需要公会金库 ${cost.toLocaleString()} 金币` })
          return false
        }
        
        const hub = createSuperHub(guild, regionIndex)
        const bonus = calculateGuildBonus({ ...guild, hub })
        
        const guilds = state.guilds.map(g => {
          if (g.id === player.guildId) {
            return {
              ...g,
              gold: g.gold - cost,
              hub,
              efficiencyBonus: bonus.efficiencyBonus,
              feeDiscount: bonus.feeDiscount,
              gridCoverage: bonus.coverage,
            }
          }
          return g
        })
        
        set({ guilds })
        get().actions.addNotification({ type: 'success', title: '建造成功', message: '超级能源枢纽建造完成，全体公会成员享受加成！' })
        return true
      },
      
      appointMember: (memberId, role) => {
        const state = get()
        const player = state.currentPlayer
        if (!player.guildId || player.guildRole !== 'leader') {
          get().actions.addNotification({ type: 'error', title: '无权限', message: '仅会长可任命职位' })
          return false
        }
        const guild = state.guilds.find(g => g.id === player.guildId)
        if (!guild) return false
        if (!guild.members.includes(memberId)) {
          get().actions.addNotification({ type: 'error', title: '任命失败', message: '该玩家不在本公会' })
          return false
        }
        
        const guilds = state.guilds.map(g => {
          if (g.id !== player.guildId) return g
          
          const newVice = g.viceLeaders.filter(id => id !== memberId)
          const newTech = g.techOfficers.filter(id => id !== memberId)
          
          if (role === 'vice_leader') newVice.push(memberId)
          if (role === 'tech_officer') newTech.push(memberId)
          
          return {
            ...g,
            viceLeaders: newVice,
            techOfficers: newTech,
          }
        })
        
        set({ guilds })
        get().actions.addNotification({
          type: 'success',
          title: '任命成功',
          message: `已将玩家任命为${role === 'vice_leader' ? '副会长' : role === 'tech_officer' ? '技术官' : '普通成员'}`,
        })
        return true
      },
      
      addNotification: (notification) => {
        set(state => ({
          notifications: [
            {
              id: generateId('not'),
              timestamp: Date.now(),
              read: false,
              ...notification,
            },
            ...state.notifications,
          ].slice(0, 100),
        }))
      },
      
      markNotificationRead: (notificationId) => {
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        }))
      },
      
      markAllNotificationsRead: () => {
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
        }))
      },
      
      getFacilityOutputDetails: (facilityId) => {
        const state = get()
        const facility = state.playerFacilities.find(f => f.id === facilityId)
        if (!facility) {
          return {
            baseOutput: 0,
            efficiency: 0,
            actualOutput: 0,
            weatherBonus: 0,
            terrainBonus: 0,
            synergyBonus: 0,
            maintenanceCost: 0,
          }
        }
        
        const config = FACILITY_CONFIG[facility.type]
        const nearby = state.playerFacilities.filter(other => {
          if (other.id === facilityId || !other.isActive) return false
          const dx = other.x - facility.x
          const dy = other.y - facility.y
          return Math.sqrt(dx * dx + dy * dy) < 80
        })
        
        const efficiency = calculateFacilityEfficiency(facility, state.weather, nearby)
        const actualOutput = calculateFacilityOutput(facility, efficiency)
        const maintenanceCost = calculateMaintenanceCost(facility)
        
        const weatherBonus = config.weatherModifiers[state.weather.current]
        const terrainBonus = config.terrainModifiers[facility.terrain]
        const synergyBonus = nearby.reduce((b, f) => b + config.synergyBonus[f.type], 0)
        
        return {
          baseOutput: facility.baseOutput,
          efficiency,
          actualOutput,
          weatherBonus,
          terrainBonus,
          synergyBonus,
          maintenanceCost,
        }
      },
      
      exportReport: async (userOptions = {}) => {
        const state = get()
        const { downloadPDF, captureChart } = await import('@/utils/pdfExport')
        
        const defaultOptions = {
          playerInfo: true,
          summary: true,
          facilities: true,
          priceChart: true,
          supplyDemandChart: true,
          radarChart: true,
          leaderboard: true,
          guild: true,
        }
        const options = { ...defaultOptions, ...userOptions }
        
        const [priceChart, supplyDemandChart, radarChart] = await Promise.all([
          options.priceChart ? captureChart('price-chart-container') : Promise.resolve(undefined),
          options.supplyDemandChart ? captureChart('supply-demand-chart-container') : Promise.resolve(undefined),
          options.radarChart ? captureChart('radar-chart-container') : Promise.resolve(undefined),
        ])

        const playerGuild = state.guilds.find(g => g.id === state.currentPlayer.guildId)
        const guildForReport: PDFReportData['guild'] = playerGuild ? {
          name: playerGuild.name,
          emblem: playerGuild.emblem,
          level: playerGuild.level,
          memberRole: state.currentPlayer.guildRole === 'leader' ? '会长'
                     : state.currentPlayer.guildRole === 'vice_leader' ? '副会长'
                     : state.currentPlayer.guildRole === 'tech_officer' ? '技术官'
                     : '成员',
          memberCount: playerGuild.memberCount,
          gold: playerGuild.gold,
          materials: playerGuild.materials,
          hub: playerGuild.hub ? {
            level: playerGuild.hub.level,
            name: playerGuild.hub.name,
            coverageRadius: playerGuild.hub.coverageRadius,
            totalOutput: playerGuild.hub.totalOutput,
            upgradeStatus: playerGuild.hub.upgradeProcess
              ? (playerGuild.hub.upgradeProcess.status === 'collecting' ? '收集中'
                : playerGuild.hub.upgradeProcess.status === 'approving' ? '审批中'
                : playerGuild.hub.upgradeProcess.status === 'upgrading' ? '升级中'
                : playerGuild.hub.upgradeProcess.status)
              : undefined,
          } : undefined,
        } : null
        
        await downloadPDF({
          player: state.currentPlayer,
          stats: state.stats,
          facilities: state.playerFacilities,
          supplyDemandHistory: state.supplyDemandSnapshots.slice(-100),
          priceHistory: state.priceHistory.slice(-100),
          leaderboard: {
            generation: state.leaderboards.generation,
            trading: state.leaderboards.trading,
          },
          generatedAt: Date.now(),
          charts: {
            priceChart,
            supplyDemandChart,
            radarChart,
          },
          guild: guildForReport,
          options,
        })
      },
    },
  }
})
