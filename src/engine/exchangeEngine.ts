import type { Order, Trade, PriceHistory, OrderType } from '@/types'
import { GRID_CONSTANTS } from '@/constants'
import { generateId, clamp, exponentialMovingAverage } from '@/utils'

interface MatchResult {
  trades: Trade[]
  updatedBuyOrders: Order[]
  updatedSellOrders: Order[]
}

export const matchOrders = (buyOrders: Order[], sellOrders: Order[]): MatchResult => {
  const trades: Trade[] = []
  const updatedBuyOrders = [...buyOrders]
  const updatedSellOrders = [...sellOrders]
  
  const sortedBuys = updatedBuyOrders
    .filter(o => o.status === 'pending' || o.status === 'partial')
    .sort((a, b) => {
      if (b.price !== a.price) return b.price - a.price
      return a.timestamp - b.timestamp
    })
  
  const sortedSells = updatedSellOrders
    .filter(o => o.status === 'pending' || o.status === 'partial')
    .sort((a, b) => {
      if (a.price !== b.price) return a.price - b.price
      return a.timestamp - b.timestamp
    })
  
  let buyIdx = 0
  let sellIdx = 0
  
  while (buyIdx < sortedBuys.length && sellIdx < sortedSells.length) {
    const buy = sortedBuys[buyIdx]
    const sell = sortedSells[sellIdx]
    
    if (buy.price < sell.price) break
    
    const buyRemaining = buy.amount - buy.filledAmount
    const sellRemaining = sell.amount - sell.filledAmount
    const matchAmount = Math.min(buyRemaining, sellRemaining)
    
    if (matchAmount <= 0) {
      if (buyRemaining <= 0) buyIdx++
      if (sellRemaining <= 0) sellIdx++
      continue
    }
    
    const matchPrice = calculateMatchPrice(buy, sell)
    const fee = Math.floor(matchAmount * matchPrice * GRID_CONSTANTS.TRANSACTION_FEE)
    
    const trade: Trade = {
      id: generateId('trd'),
      buyOrderId: buy.id,
      sellOrderId: sell.id,
      buyerId: buy.playerId,
      sellerId: sell.playerId,
      amount: matchAmount,
      price: matchPrice,
      timestamp: Date.now(),
      regionId: buy.id < sell.id ? buy.id : sell.id,
      fee,
    }
    
    trades.push(trade)
    
    buy.filledAmount += matchAmount
    sell.filledAmount += matchAmount
    
    if (buy.filledAmount >= buy.amount) {
      buy.status = 'matched'
      buyIdx++
    } else {
      buy.status = 'partial'
    }
    
    if (sell.filledAmount >= sell.amount) {
      sell.status = 'matched'
      sellIdx++
    } else {
      sell.status = 'partial'
    }
  }
  
  return { trades, updatedBuyOrders, updatedSellOrders }
}

const calculateMatchPrice = (buy: Order, sell: Order): number => {
  const midPrice = (buy.price + sell.price) / 2
  const timeWeight = buy.timestamp < sell.timestamp ? 0.6 : 0.4
  const weightedPrice = buy.price * timeWeight + sell.price * (1 - timeWeight)
  return Math.floor((midPrice + weightedPrice) / 2)
}

export const calculateDynamicPrice = (
  supply: number,
  demand: number,
  history: PriceHistory[],
  eventMultiplier: number = 1
): number => {
  const ratio = demand / Math.max(supply, 1)
  const sds = GRID_CONSTANTS.SUPPLY_DEMAND_SENSITIVITY
  let price = GRID_CONSTANTS.BASE_PRICE * Math.pow(ratio, sds)
  
  if (history.length > 0) {
    const recentPrices = history.slice(-20).map(h => h.price)
    const ema = exponentialMovingAverage(recentPrices, Math.min(10, recentPrices.length))
    price = price * 0.7 + ema * 0.3
  }
  
  price *= eventMultiplier
  
  return clamp(
    Math.floor(price),
    GRID_CONSTANTS.MIN_PRICE,
    GRID_CONSTANTS.MAX_PRICE
  )
}

export const createOrder = (
  playerId: string,
  playerName: string,
  type: OrderType,
  amount: number,
  price: number
): Order => {
  return {
    id: generateId('ord'),
    playerId,
    playerName,
    type,
    amount,
    filledAmount: 0,
    price: clamp(price, GRID_CONSTANTS.MIN_PRICE, GRID_CONSTANTS.MAX_PRICE),
    timestamp: Date.now(),
    status: 'pending',
    expiresAt: Date.now() + GRID_CONSTANTS.ORDER_EXPIRY_MS,
  }
}

export const getOrderBookStats = (orders: Order[]) => {
  const now = Date.now()
  const activeOrders = orders.filter(
    o => (o.status === 'pending' || o.status === 'partial') && o.expiresAt > now
  )
  
  const buys = activeOrders.filter(o => o.type === 'buy')
  const sells = activeOrders.filter(o => o.type === 'sell')
  
  const buyVolume = buys.reduce((s, o) => s + (o.amount - o.filledAmount), 0)
  const sellVolume = sells.reduce((s, o) => s + (o.amount - o.filledAmount), 0)
  
  const avgBuyPrice = buys.length > 0
    ? buys.reduce((s, o) => s + o.price * (o.amount - o.filledAmount), 0) / buyVolume
    : 0
  
  const avgSellPrice = sells.length > 0
    ? sells.reduce((s, o) => s + o.price * (o.amount - o.filledAmount), 0) / sellVolume
    : 0
  
  const bestBid = buys.length > 0 ? Math.max(...buys.map(o => o.price)) : 0
  const bestAsk = sells.length > 0 ? Math.min(...sells.map(o => o.price)) : 0
  const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0
  
  const buyDepth: { price: number; volume: number; cumulative: number }[] = []
  const sellDepth: { price: number; volume: number; cumulative: number }[] = []
  
  const buyPriceGroups = new Map<number, number>()
  for (const o of buys) {
    const remaining = o.amount - o.filledAmount
    buyPriceGroups.set(o.price, (buyPriceGroups.get(o.price) || 0) + remaining)
  }
  
  let cumulative = 0
  const sortedBuyPrices = Array.from(buyPriceGroups.keys()).sort((a, b) => b - a).slice(0, 10)
  for (const price of sortedBuyPrices) {
    cumulative += buyPriceGroups.get(price)!
    buyDepth.push({ price, volume: buyPriceGroups.get(price)!, cumulative })
  }
  
  cumulative = 0
  const sellPriceGroups = new Map<number, number>()
  for (const o of sells) {
    const remaining = o.amount - o.filledAmount
    sellPriceGroups.set(o.price, (sellPriceGroups.get(o.price) || 0) + remaining)
  }
  
  const sortedSellPrices = Array.from(sellPriceGroups.keys()).sort((a, b) => a - b).slice(0, 10)
  for (const price of sortedSellPrices) {
    cumulative += sellPriceGroups.get(price)!
    sellDepth.push({ price, volume: sellPriceGroups.get(price)!, cumulative })
  }
  
  return {
    totalOrders: activeOrders.length,
    buyOrders: buys.length,
    sellOrders: sells.length,
    buyVolume,
    sellVolume,
    avgBuyPrice: Math.floor(avgBuyPrice),
    avgSellPrice: Math.floor(avgSellPrice),
    bestBid,
    bestAsk,
    spread,
    buyDepth,
    sellDepth,
  }
}
