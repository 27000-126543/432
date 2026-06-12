import type { GridLine, GridRegion, HeatmapCell, SupplyDemandSnapshot, ServerLoad } from '@/types'
import { GRID_REGIONS, GRID_CONSTANTS, SERVERS } from '@/constants'
import { generateId, randomBetween, randomInt, clamp } from '@/utils'

export const initializeGridLines = (): GridLine[] => {
  const lines: GridLine[] = []
  
  for (let i = 0; i < GRID_REGIONS.length; i++) {
    for (let j = i + 1; j < GRID_REGIONS.length; j++) {
      const r1 = GRID_REGIONS[i]
      const r2 = GRID_REGIONS[j]
      const dist = Math.sqrt((r1.centerX - r2.centerX) ** 2 + (r1.centerY - r2.centerY) ** 2)
      
      if (dist < 250) {
        const capacity = randomInt(5000, 20000)
        const baseLoss = randomBetween(0.01, 0.05)
        lines.push({
          id: generateId('lin'),
          fromRegionId: r1.id,
          toRegionId: r2.id,
          capacity,
          currentLoad: randomInt(1000, capacity * 0.7),
          status: 'normal',
          durability: randomBetween(0.7, 1.0),
          maxDurability: 1.0,
          lossRate: baseLoss,
          lastReinforced: Date.now(),
          repairTeams: [],
          baseLossRate: baseLoss,
          temporaryLossRate: 0,
          eventAppliedLossRate: 0,
          displayStatus: 'normal',
        })
      }
    }
  }
  
  return lines
}

export const initializeGridRegions = (): GridRegion[] => {
  return GRID_REGIONS.map(r => ({
    id: r.id,
    name: r.name,
    serverId: r.serverId,
    centerX: r.centerX,
    centerY: r.centerY,
    totalSupply: randomInt(50000, 200000),
    totalDemand: randomInt(40000, 180000),
    priceMultiplier: randomBetween(0.9, 1.1),
    congestionLevel: randomBetween(0.3, 0.8),
    players: randomInt(100, 1500),
    facilities: randomInt(200, 800),
  }))
}

export const calculateGridLoss = (
  line: GridLine,
  power: number
): { delivered: number; lost: number } => {
  const lossRate = line.lossRate * (1 + line.durability < 0.5 ? 0.3 : 0) * (line.status === 'damaged' ? 1.5 : line.status === 'critical' ? 2.5 : 1)
  const lost = Math.floor(power * clamp(lossRate, 0, 0.5))
  return { delivered: power - lost, lost }
}

export const updateGridLineStatus = (line: GridLine): GridLine => {
  const loadRatio = line.currentLoad / line.capacity
  let status = line.status
  
  if (line.durability <= 0.1) {
    status = 'destroyed'
  } else if (line.durability <= 0.3 || loadRatio > 0.95) {
    status = 'critical'
  } else if (line.durability <= 0.6 || loadRatio > 0.8) {
    status = 'damaged'
  } else {
    status = 'normal'
  }
  
  let decay = 0.0001
  decay *= (1 + loadRatio * 0.5)
  
  return {
    ...line,
    status,
    durability: Math.max(0, line.durability - decay),
  }
}

export const reinforceLine = (line: GridLine): GridLine => {
  return {
    ...line,
    durability: Math.min(line.maxDurability, line.durability + 0.2),
    lossRate: Math.max(0.005, line.lossRate - 0.005),
    lastReinforced: Date.now(),
  }
}

export const repairLine = (line: GridLine, amount: number): GridLine => {
  const newDurability = clamp(line.durability + amount, 0, line.maxDurability)
  let status = line.status
  
  if (newDurability > 0.6 && line.currentLoad / line.capacity < 0.8) {
    status = 'normal'
  } else if (newDurability > 0.3) {
    status = 'damaged'
  }
  
  return {
    ...line,
    durability: Math.min(line.maxDurability, newDurability),
    status,
  }
}

export const calculateGridStability = (lines: GridLine[], regions: GridRegion[]): number => {
  if (lines.length === 0) return 0
  
  const avgDurability = lines.reduce((s, l) => s + l.durability, 0) / lines.length
  
  const avgCongestion = regions.reduce((s, r) => s + r.congestionLevel, 0) / regions.length
  
  const normalRatio = lines.filter(l => l.status === 'normal').length / lines.length
  
  return clamp(avgDurability * 0.4 + (1 - avgCongestion) * 0.3 + normalRatio * 0.3, 0, 1)
}

export const generateHeatmap = (regions: GridRegion[], lines: GridLine[], size = 20): HeatmapCell[] => {
  const cells: HeatmapCell[] = []
  const gridWidth = 800
  const gridHeight = 600
  const cellWidth = gridWidth / size
  const cellHeight = gridHeight / size
  
  for (let gx = 0; gx < size; gx++) {
    for (let gy = 0; gy < size; gy++) {
      const centerX = gx * cellWidth + cellWidth / 2
      const centerY = gy * cellHeight + cellHeight / 2
      
      let supply = 0
      let demand = 0
      let density = 0
      let nearestRegion = regions[0]
      let minDist = Infinity
      
      for (const region of regions) {
        const dist = Math.sqrt(
          (centerX - region.centerX) ** 2 + 
          (centerY - region.centerY) ** 2
        )
        if (dist < minDist) {
          minDist = dist
          nearestRegion = region
        }
        const influence = Math.max(0, 1 - dist / 300)
        supply += region.totalSupply * influence
        demand += region.totalDemand * influence
        density += region.players * influence * 0.1
      }
      
      for (const line of lines) {
        const fromR = regions.find(r => r.id === line.fromRegionId)
        const toR = regions.find(r => r.id === line.toRegionId)
        if (!fromR || !toR) continue
        
        const lineDist = pointToLineDistance(
          centerX, centerY,
          fromR.centerX, fromR.centerY,
          toR.centerX, toR.centerY
        )
        if (lineDist < 30) {
          density += line.currentLoad / line.capacity * 50
        }
      }
      
      cells.push({
        x: gx,
        y: gy,
        supply,
        demand,
        density: clamp(density, 0, 100),
        regionId: nearestRegion.id,
      })
    }
  }
  
  return cells
}

const pointToLineDistance = (
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number => {
  const A = px - x1
  const B = py - y1
  const C = x2 - x1
  const D = y2 - y1
  
  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1
  
  if (lenSq !== 0) param = dot / lenSq
  
  let xx, yy
  if (param < 0) {
    xx = x1; yy = y1
  } else if (param > 1) {
    xx = x2; yy = y2
  } else {
    xx = x1 + param * C
    yy = y1 + param * D
  }
  
  const dx = px - xx
  const dy = py - yy
  return Math.sqrt(dx * dx + dy * dy)
}

export const generateSupplyDemandSnapshot = (
  regions: GridRegion[]
): SupplyDemandSnapshot[] => {
  const now = Date.now()
  return regions.map(r => ({
    timestamp: now,
    regionId: r.id,
    supply: r.totalSupply,
    demand: r.totalDemand,
    price: GRID_CONSTANTS.BASE_PRICE * (r.totalDemand / Math.max(r.totalSupply, 1)) * r.priceMultiplier,
    lossRate: 0.05 * (1 + r.congestionLevel),
    congestion: r.congestionLevel,
  }))
}

export const updateServerLoads = (): ServerLoad[] => {
  return SERVERS.map(s => {
    const onlinePlayers = randomInt(500, 5000)
    const activeFacilities = Math.floor(onlinePlayers * randomBetween(1.5, 3))
    const ordersPerSecond = randomInt(100, 5000)
    const tradesPerSecond = Math.floor(ordersPerSecond * randomBetween(0.3, 0.6))
    const cpuUsage = randomBetween(30, 85)
    const memoryUsage = randomBetween(40, 75)
    const latency = randomInt(10, 80)
    
    let status: ServerLoad['status'] = 'healthy'
    if (cpuUsage > 90 || latency > 100 || memoryUsage > 90) {
      status = 'critical'
    } else if (cpuUsage > 75 || latency > 60) {
      status = 'warning'
    }
    
    return {
      serverId: s.id,
      name: `${s.name} - ${s.region}`,
      onlinePlayers,
      activeFacilities,
      ordersPerSecond,
      tradesPerSecond,
      cpuUsage,
      memoryUsage,
      latency,
      status,
    }
  })
}

export const simulateRegionFlow = (
  regions: GridRegion[],
  lines: GridLine[]
): { regions: GridRegion[]; lines: GridLine[] } => {
  const updatedRegions = regions.map(r => ({ ...r }))
  const updatedLines = lines.map(l => ({ ...l }))
  
  const sortedRegions = [...updatedRegions].sort((a, b) =>
    (a.totalSupply / Math.max(a.totalDemand, 1)) - (b.totalSupply / Math.max(b.totalDemand, 1))
  )
  
  for (let i = 0; i < Math.min(3, sortedRegions.length); i++) {
    const surplus = sortedRegions[i]
    const deficitIdx = sortedRegions.length - 1 - i
    if (deficitIdx <= i) break
    
    const deficit = sortedRegions[deficitIdx]
    const line = updatedLines.find(l =>
      (l.fromRegionId === surplus.id && l.toRegionId === deficit.id) ||
      (l.fromRegionId === deficit.id && l.toRegionId === surplus.id)
    )
    
    if (!line) continue
    
    const surplusAmount = Math.max(0, surplus.totalSupply - surplus.totalDemand)
    const deficitAmount = Math.max(0, deficit.totalDemand - deficit.totalSupply)
    const transfer = Math.min(surplusAmount, deficitAmount, line.capacity - line.currentLoad)
    
    if (transfer > 0) {
      const { delivered, lost } = calculateGridLoss(line, transfer)
      line.currentLoad += transfer
      surplus.totalSupply -= transfer
      deficit.totalSupply += delivered
    }
  }
  
  return { regions: updatedRegions, lines: updatedLines }
}
