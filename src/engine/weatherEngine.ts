import type { WeatherState, WeatherType, GridEvent, EventType, GridEventEffect } from '@/types'
import { WEATHER_CONFIG, EVENT_CONFIG } from '@/constants'
import { randomBetween, randomInt, weightedChoice, randomChoice, generateId } from '@/utils'

export const createInitialWeather = (): WeatherState => {
  const weathers: WeatherType[] = ['sunny', 'cloudy', 'rainy', 'stormy', 'windy', 'foggy']
  const weights = [30, 25, 15, 5, 15, 10]
  
  const current = weightedChoice(weathers, weights)
  const config = WEATHER_CONFIG[current]
  
  return {
    current,
    nextTransition: Date.now() + randomBetween(config.duration[0], config.duration[1]),
    windSpeed: calculateWindSpeed(current),
    temperature: calculateTemperature(current),
    humidity: calculateHumidity(current),
    manaDensity: randomBetween(0.5, 1.5),
    solarIntensity: calculateSolarIntensity(current),
  }
}

const calculateWindSpeed = (weather: WeatherType): number => {
  switch (weather) {
    case 'windy': return randomBetween(50, 100)
    case 'stormy': return randomBetween(70, 120)
    case 'cloudy': return randomBetween(10, 30)
    case 'rainy': return randomBetween(15, 40)
    case 'foggy': return randomBetween(0, 10)
    default: return randomBetween(5, 20)
  }
}

const calculateTemperature = (weather: WeatherType): number => {
  switch (weather) {
    case 'sunny': return randomBetween(25, 38)
    case 'cloudy': return randomBetween(15, 28)
    case 'rainy': return randomBetween(10, 22)
    case 'stormy': return randomBetween(8, 18)
    case 'windy': return randomBetween(12, 25)
    case 'foggy': return randomBetween(5, 18)
    default: return 20
  }
}

const calculateHumidity = (weather: WeatherType): number => {
  switch (weather) {
    case 'rainy': return randomBetween(70, 95)
    case 'stormy': return randomBetween(80, 100)
    case 'foggy': return randomBetween(85, 100)
    case 'cloudy': return randomBetween(45, 70)
    case 'windy': return randomBetween(25, 50)
    default: return randomBetween(20, 45)
  }
}

const calculateSolarIntensity = (weather: WeatherType): number => {
  switch (weather) {
    case 'sunny': return randomBetween(0.85, 1.0)
    case 'cloudy': return randomBetween(0.35, 0.65)
    case 'windy': return randomBetween(0.55, 0.8)
    case 'rainy': return randomBetween(0.15, 0.35)
    case 'foggy': return randomBetween(0.05, 0.2)
    case 'stormy': return randomBetween(0.0, 0.15)
    default: return 0.5
  }
}

export const updateWeather = (weather: WeatherState): WeatherState => {
  const now = Date.now()
  if (now < weather.nextTransition) {
    return {
      ...weather,
      windSpeed: weather.windSpeed + randomBetween(-2, 2),
      temperature: weather.temperature + randomBetween(-0.5, 0.5),
      humidity: clamp01(weather.humidity + randomBetween(-1, 1)),
      manaDensity: clamp01(weather.manaDensity + randomBetween(-0.02, 0.02), 0.3, 2.0),
      solarIntensity: clamp01(weather.solarIntensity + randomBetween(-0.02, 0.02), 0, 1),
    }
  }
  
  const nextWeather = transitionWeather(weather.current)
  const config = WEATHER_CONFIG[nextWeather]
  
  return {
    current: nextWeather,
    nextTransition: now + randomBetween(config.duration[0], config.duration[1]),
    windSpeed: calculateWindSpeed(nextWeather),
    temperature: calculateTemperature(nextWeather),
    humidity: calculateHumidity(nextWeather),
    manaDensity: randomBetween(0.5, 1.5),
    solarIntensity: calculateSolarIntensity(nextWeather),
  }
}

const transitionWeather = (current: WeatherType): WeatherType => {
  const transitions: Record<WeatherType, WeatherType[]> = {
    sunny: ['sunny', 'sunny', 'cloudy', 'windy', 'foggy'],
    cloudy: ['cloudy', 'sunny', 'rainy', 'windy', 'foggy'],
    rainy: ['rainy', 'cloudy', 'stormy', 'foggy'],
    stormy: ['stormy', 'rainy', 'windy', 'cloudy'],
    windy: ['windy', 'sunny', 'cloudy', 'stormy'],
    foggy: ['foggy', 'cloudy', 'sunny', 'rainy'],
  }
  
  return randomChoice(transitions[current])
}

const clamp01 = (value: number, min = 0, max = 100): number => {
  return Math.max(min, Math.min(max, value))
}

export const generateRandomEvent = (
  regionIds: string[],
  lineIds: string[],
  facilityIds: string[]
): GridEvent | null => {
  const eventTypes: EventType[] = [
    'energy_overload',
    'mana_tide',
    'storm',
    'energy_theft',
    'efficiency_boost',
    'price_surge',
  ]
  
  for (const type of eventTypes) {
    const config = EVENT_CONFIG[type]
    if (Math.random() < config.baseProbability) {
      const severity = randomInt(1, 5) as 1 | 2 | 3 | 4 | 5
      const duration = randomBetween(config.minDuration, config.maxDuration)
      
      let regionId: string | null = null
      let lineId: string | null = null
      let facilityId: string | null = null
      let affectedLineIds: string[] | undefined = undefined
      
      if (type === 'storm') {
        lineId = lineIds.length > 0 ? randomChoice(lineIds) : null
        regionId = regionIds.length > 0 ? randomChoice(regionIds) : null
        if (lineIds.length > 0) {
          const n = Math.min(lineIds.length, 2 + Math.floor(severity / 2))
          const shuffled = [...lineIds].sort(() => Math.random() - 0.5)
          affectedLineIds = shuffled.slice(0, n)
          if (lineId && !affectedLineIds.includes(lineId)) {
            affectedLineIds[0] = lineId
          }
        }
      } else if (type === 'energy_theft') {
        lineId = lineIds.length > 0 ? randomChoice(lineIds) : null
        if (lineIds.length > 0) {
          const n = Math.min(lineIds.length, 1 + Math.floor(severity / 3))
          const shuffled = [...lineIds].sort(() => Math.random() - 0.5)
          affectedLineIds = shuffled.slice(0, n)
          if (lineId && !affectedLineIds.includes(lineId)) {
            affectedLineIds[0] = lineId
          }
        }
      } else if (type === 'energy_overload') {
        facilityId = facilityIds.length > 0 ? randomChoice(facilityIds) : null
        regionId = regionIds.length > 0 ? randomChoice(regionIds) : null
      } else if (type === 'efficiency_boost') {
        regionId = regionIds.length > 0 ? randomChoice(regionIds) : null
      } else {
        regionId = regionIds.length > 0 ? randomChoice(regionIds) : null
      }
      
      return {
        id: generateId('evt'),
        type,
        severity,
        regionId,
        lineId,
        facilityId,
        affectedLineIds,
        startTime: Date.now(),
        endTime: Date.now() + duration,
        description: generateEventDescription(type, severity),
        effect: generateEventEffect(type, severity),
        isActive: true,
      }
    }
  }
  
  return null
}

const generateEventDescription = (type: EventType, severity: number): string => {
  const templates: Record<EventType, string[]> = {
    energy_overload: [
      '局部魔力浓度异常升高，设施出现过载迹象',
      '强烈的魔力波动导致部分设施超负荷运转',
      '严重的能源过载已波及多个设施，需立即处理',
    ],
    mana_tide: [
      '微弱的魔力潮汐开始涌动',
      '显著的魔力潮汐正在提升能源产出',
      '史诗级魔力潮汐席卷大陆，能源产量暴增',
    ],
    storm: [
      '小型魔法风暴正在形成',
      '中型魔法风暴逼近，电网稳定性下降',
      '剧烈魔法风暴肆虐，多条线路受损',
    ],
    energy_theft: [
      '检测到少量能源异常流失',
      '窃能行为正在侵蚀电网供给',
      '大规模窃能活动严重影响能源供应',
    ],
    efficiency_boost: [
      '环境因素导致效率小幅提升',
      '奥术共鸣显著提升了设施效率',
      '奇迹级能量共鸣，效率达到前所未有的高度',
    ],
    price_surge: [
      '市场出现轻微波动',
      '供需失衡导致价格剧烈波动',
      '市场恐慌，能源价格剧烈震荡',
    ],
  }
  
  const idx = Math.min(Math.floor((severity - 1) / 2), 2)
  return templates[type][idx]
}

const generateEventEffect = (type: EventType, severity: number): GridEventEffect => {
  const factor = severity / 3
  
  switch (type) {
    case 'energy_overload':
      return {
        outputMultiplier: 1 + 0.1 * factor,
        durabilityDamage: 5 * severity,
      }
    case 'mana_tide':
      return {
        outputMultiplier: 1 + 0.2 * factor,
      }
    case 'storm':
      return {
        outputMultiplier: 1 - 0.1 * factor,
        lossRateIncrease: 0.05 * factor,
        durabilityDamage: 10 * severity,
      }
    case 'energy_theft':
      return {
        lossRateIncrease: 0.03 * factor,
      }
    case 'efficiency_boost':
      return {
        outputMultiplier: 1 + 0.15 * factor,
      }
    case 'price_surge':
      return {
        priceMultiplier: 1 + 0.2 * factor,
      }
    default:
      return {}
  }
}
