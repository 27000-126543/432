export const randomBetween = (min: number, max: number): number => {
  return Math.random() * (max - min) + min
}

export const randomInt = (min: number, max: number): number => {
  return Math.floor(randomBetween(min, max + 1))
}

export const randomChoice = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)]
}

export const weightedChoice = <T>(items: T[], weights: number[]): T => {
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  let random = Math.random() * totalWeight
  for (let i = 0; i < items.length; i++) {
    random -= weights[i]
    if (random <= 0) return items[i]
  }
  return items[items.length - 1]
}

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value))
}

export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t
}

export const formatNumber = (num: number, decimals = 2): string => {
  if (num >= 1e12) return (num / 1e12).toFixed(decimals) + 'T'
  if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K'
  return num.toFixed(decimals)
}

export const formatGold = (num: number): string => {
  return formatNumber(num, 0) + ' 金币'
}

export const formatEnergy = (num: number): string => {
  return formatNumber(num, 1) + ' 魔力'
}

export const formatPercent = (num: number, decimals = 1): string => {
  return (num * 100).toFixed(decimals) + '%'
}

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}

export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}天${hours % 24}小时`
  if (hours > 0) return `${hours}小时${minutes % 60}分`
  if (minutes > 0) return `${minutes}分${seconds % 60}秒`
  return `${seconds}秒`
}

export const generateId = (prefix = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export const distance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

export const exponentialMovingAverage = (
  values: number[],
  period: number
): number => {
  const k = 2 / (period + 1)
  let ema = values[0]
  for (let i = 1; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k)
  }
  return ema
}

export const calculateRSI = (prices: number[], period = 14): number => {
  if (prices.length < period + 1) return 50
  
  let gains = 0
  let losses = 0
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1]
    if (diff > 0) gains += diff
    else losses -= diff
  }
  
  const avgGain = gains / period
  const avgLoss = losses / period
  
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

export const hashString = (str: string): number => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

export const seededRandom = (seed: number): (() => number) => {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}
