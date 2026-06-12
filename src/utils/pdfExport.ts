import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import type { 
  DashboardStats, 
  Facility, 
  SupplyDemandSnapshot, 
  PriceHistory,
  LeaderboardEntry,
  Player
} from '@/types'
import { formatNumber, formatDateTime, formatPercent } from '@/utils'
import { FACILITY_CONFIG } from '@/constants'

export interface ExportOptions {
  playerInfo: boolean
  priceChart: boolean
  supplyDemandChart: boolean
  radarChart: boolean
  summary: boolean
  facilities: boolean
  leaderboard: boolean
  guild: boolean
}

export interface PDFReportData {
  player: Player
  stats: DashboardStats
  facilities: Facility[]
  supplyDemandHistory: SupplyDemandSnapshot[]
  priceHistory: PriceHistory[]
  leaderboard: {
    generation: LeaderboardEntry[]
    trading: LeaderboardEntry[]
  }
  generatedAt: number
  charts: {
    priceChart?: string
    supplyDemandChart?: string
    radarChart?: string
  }
  guild?: {
    name: string
    emblem: string
    level: number
    memberRole: string
    memberCount: number
    gold: number
    materials: Record<string, number>
    hub?: {
      level: number
      name: string
      coverageRadius: number
      totalOutput: number
      upgradeStatus?: string
    }
  } | null
  options?: {
    playerInfo?: boolean
    summary?: boolean
    facilities?: boolean
    priceChart?: boolean
    supplyDemandChart?: boolean
    radarChart?: boolean
    leaderboard?: boolean
    guild?: boolean
  }
}

export const generateEnergyReport = async (
  data: PDFReportData
): Promise<Blob> => {
  const opts = data.options || {
    playerInfo: true, summary: true, facilities: true,
    priceChart: true, supplyDemandChart: true, radarChart: true,
    leaderboard: true, guild: true,
  }
  const hasAny = Object.values(opts).some(v => v === true)
  if (!hasAny) {
    return new Blob([''], { type: 'application/pdf' })
  }

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  let y = 15
  
  doc.setFillColor(168, 85, 247)
  doc.rect(0, 0, pageWidth, 30, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('魔法能源交易所报告', pageWidth / 2, y + 5, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`生成时间: ${formatDateTime(data.generatedAt)}`, pageWidth / 2, y + 14, { align: 'center' })
  
  y = 45
  
  if (opts.playerInfo) {
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('一、玩家概况', 15, y)
    y += 8
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`玩家名称: ${data.player.name}`, 15, y)
    doc.text(`等级: Lv.${data.player.level}`, 100, y)
    y += 6
    doc.text(`总发电量: ${formatNumber(data.player.totalGenerated)} 魔力`, 15, y)
    doc.text(`总交易量: ${formatNumber(data.player.totalTraded)} 笔`, 100, y)
    y += 6
    doc.text(`持有金币: ${formatNumber(data.player.gold)}`, 15, y)
    doc.text(`魔力代币: ${formatNumber(data.player.manaTokens)}`, 100, y)
    y += 10
  }
  
  if (opts.summary) {
    if (y > pageHeight - 80) { doc.addPage(); y = 15 }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('二、全服能源概览', 15, y)
    y += 8
    
    const stats = [
      ['指标', '数值', '变化'],
      ['总发电量', `${formatNumber(data.stats.totalGenerated)} 魔力`, ''],
      ['总消耗量', `${formatNumber(data.stats.totalConsumed)} 魔力`, ''],
      ['当前价格', `${formatNumber(data.stats.currentPrice)} 金币/魔力`, 
        `${data.stats.priceChange24h >= 0 ? '+' : ''}${formatPercent(data.stats.priceChange24h)}`],
      ['活跃设施', `${formatNumber(data.stats.activeFacilities)} 座`, ''],
      ['在线玩家', `${formatNumber(data.stats.activePlayers)} 人`, ''],
      ['24h交易量', `${formatNumber(data.stats.totalTrades24h)} 笔`, ''],
      ['24h交易额', `${formatNumber(data.stats.totalVolume24h)} 金币`, ''],
      ['电网稳定性', formatPercent(data.stats.gridStability), ''],
      ['平均损耗率', formatPercent(data.stats.avgLossRate), ''],
    ]
    
    drawTable(doc, stats, 15, y, pageWidth - 30)
    y += (stats.length + 1) * 7 + 5
  }
  
  if (opts.facilities) {
    if (y > pageHeight - 80) { doc.addPage(); y = 15 }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('三、设施运营状况', 15, y)
    y += 8
    
    const facilityData = [
      ['设施类型', '数量', '总输出', '平均效率', '维护成本'],
    ]
    
    const facilityGroups = data.facilities.reduce((acc, f) => {
      acc[f.type] = acc[f.type] || []
      acc[f.type].push(f)
      return acc
    }, {} as Record<string, Facility[]>)
    
    for (const [type, facilities] of Object.entries(facilityGroups)) {
      const config = FACILITY_CONFIG[type as keyof typeof FACILITY_CONFIG]
      const totalOutput = facilities.reduce((s, f) => s + f.baseOutput * f.efficiency, 0)
      const avgEfficiency = facilities.reduce((s, f) => s + f.efficiency, 0) / facilities.length
      const totalMaintenance = facilities.reduce((s, f) => s + f.maintenanceCost, 0)
      
      facilityData.push([
        config.name,
        `${facilities.length} 座`,
        `${formatNumber(totalOutput)} 魔力`,
        formatPercent(avgEfficiency),
        `${formatNumber(totalMaintenance)} 金币`,
      ])
    }
    
    drawTable(doc, facilityData, 15, y, pageWidth - 30)
    y += (facilityData.length + 1) * 7 + 5
  }
  
  if (opts.priceChart && data.charts.priceChart) {
    if (y > pageHeight - 100) { doc.addPage(); y = 15 }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('四、价格走势分析', 15, y)
    y += 8
    
    const imgWidth = pageWidth - 30
    const imgHeight = 60
    try {
      doc.addImage(data.charts.priceChart, 'PNG', 15, y, imgWidth, imgHeight)
      y += imgHeight + 8
    } catch (e) {
      console.error('Failed to add price chart', e)
    }
  }
  
  if (opts.supplyDemandChart && data.charts.supplyDemandChart) {
    if (y > pageHeight - 60) { doc.addPage(); y = 15 }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('五、供需关系趋势', 15, y)
    y += 8
    
    const imgWidth = pageWidth - 30
    const imgHeight = 60
    try {
      doc.addImage(data.charts.supplyDemandChart, 'PNG', 15, y, imgWidth, imgHeight)
      y += imgHeight + 8
    } catch (e) {
      console.error('Failed to add supply demand chart', e)
    }
  }
  
  if (opts.radarChart && data.charts.radarChart) {
    if (y > pageHeight - 60) { doc.addPage(); y = 15 }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('六、综合能力评估', 15, y)
    y += 8
    
    const imgWidth = 80
    const imgHeight = 80
    try {
      doc.addImage(data.charts.radarChart, 'PNG', pageWidth / 2 - imgWidth / 2, y, imgWidth, imgHeight)
      y += imgHeight + 8
    } catch (e) {
      console.error('Failed to add radar chart', e)
    }
  }
  
  if (opts.leaderboard) {
    if (y > pageHeight - 100) { doc.addPage(); y = 15 }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('七、全服排行榜', 15, y)
    y += 8
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('发电量排行 TOP 10', 15, y)
    y += 6
    
    const genData = [
      ['排名', '玩家', '公会', '发电量', '变化'],
    ]
    data.leaderboard.generation.slice(0, 10).forEach(e => {
      genData.push([
        `#${e.rank}`,
        e.playerName,
        e.guildName || '-',
        formatNumber(e.value),
        `${e.change >= 0 ? '↑' : '↓'}${Math.abs(e.change)}`,
      ])
    })
    drawTable(doc, genData, 15, y, pageWidth - 30)
    y += (genData.length + 1) * 7 + 5
    
    if (y > pageHeight - 60) {
      doc.addPage()
      y = 15
    }
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('交易量排行 TOP 10', 15, y)
    y += 6
    
    const tradeData = [
      ['排名', '玩家', '公会', '交易量', '变化'],
    ]
    data.leaderboard.trading.slice(0, 10).forEach(e => {
      tradeData.push([
        `#${e.rank}`,
        e.playerName,
        e.guildName || '-',
        formatNumber(e.value),
        `${e.change >= 0 ? '↑' : '↓'}${Math.abs(e.change)}`,
      ])
    })
    drawTable(doc, tradeData, 15, y, pageWidth - 30)
    y += (tradeData.length + 1) * 7 + 8
  }
  
  if (opts.guild) {
    if (y > pageHeight - 60) { doc.addPage(); y = 15 }
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('八、公会信息', 15, y)
    y += 8

    if (!data.guild) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(120, 120, 120)
      doc.text('您当前未加入任何公会。创建或加入公会后可享受：', 15, y)
      y += 6
      doc.text('  · 公会效率加成（最高 +50% 发电效率）', 15, y); y += 6
      doc.text('  · 交易手续费折扣（最高 -30%）', 15, y); y += 6
      doc.text('  · 联合建造超级能源枢纽，扩大电网覆盖范围', 15, y); y += 6
      doc.text('  · 成员贡献材料，获得公会排名荣誉', 15, y); y += 6
    } else {
      const g = data.guild
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`公会名称：${g.emblem} ${g.name}`, 15, y); y += 6
      doc.setFont('helvetica', 'normal')
      doc.text(`公会等级：Lv.${g.level}`, 15, y); y += 6
      doc.text(`您的身份：${g.memberRole}`, 15, y); y += 6
      doc.text(`成员数量：${g.memberCount} 人`, 15, y); y += 6
      doc.text(`公会金库：${g.gold.toLocaleString()} 金币`, 15, y); y += 6
      
      y += 2
      doc.setFont('helvetica', 'bold')
      doc.text('材料库存：', 15, y); y += 6
      doc.setFont('helvetica', 'normal')
      const matMap: Record<string, string> = {
        mana_crystal: '💎 魔力水晶',
        arcane_core: '🔮 奥术核心',
        dragon_scale: '🐉 龙鳞',
      }
      for (const [k, label] of Object.entries(matMap)) {
        const v = g.materials[k] || 0
        doc.text(`  ${label}：${v.toLocaleString()}`, 15, y); y += 6
      }
      
      if (g.hub) {
        y += 2
        doc.setFont('helvetica', 'bold')
        doc.text('超级能源枢纽：', 15, y); y += 6
        doc.setFont('helvetica', 'normal')
        doc.text(`  名称：${g.hub.name}`, 15, y); y += 6
        doc.text(`  等级：Lv.${g.hub.level}`, 15, y); y += 6
        doc.text(`  总输出：${g.hub.totalOutput.toLocaleString()} 魔力/时`, 15, y); y += 6
        doc.text(`  覆盖范围：${g.hub.coverageRadius} km`, 15, y); y += 6
        if (g.hub.upgradeStatus) {
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(168, 85, 247)
          doc.text(`  升级状态：${g.hub.upgradeStatus}`, 15, y); y += 6
          doc.setTextColor(0, 0, 0)
        }
      } else {
        y += 2
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(120, 120, 120)
        doc.text('超级能源枢纽：尚未建造（需公会金库 500,000 金币）', 15, y); y += 6
        doc.setTextColor(0, 0, 0)
      }
    }
    y += 4
  }
  
  doc.setDrawColor(168, 85, 247)
  doc.setLineWidth(0.5)
  doc.line(15, y, pageWidth - 15, y)
  y += 6
  
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.setFont('helvetica', 'italic')
  doc.text(
    '本报告由魔法能源交易所系统自动生成，数据仅供参考。',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )
  
  return doc.output('blob')
}

const drawTable = (
  doc: jsPDF,
  data: string[][],
  x: number,
  y: number,
  width: number
) => {
  const startY = y
  const rowHeight = 7
  const colCount = data[0].length
  const colWidth = width / colCount
  
  for (let i = 0; i < data.length; i++) {
    const rowY = startY + i * rowHeight
    
    if (i === 0) {
      doc.setFillColor(168, 85, 247)
      doc.rect(x, rowY, width, rowHeight, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
    } else {
      if (i % 2 === 0) {
        doc.setFillColor(245, 243, 255)
        doc.rect(x, rowY, width, rowHeight, 'F')
      }
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'normal')
    }
    
    doc.setFontSize(9)
    for (let j = 0; j < colCount; j++) {
      doc.text(
        data[i][j] || '',
        x + j * colWidth + 2,
        rowY + 5
      )
    }
  }
  
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
}

export const captureChart = async (elementId: string): Promise<string | undefined> => {
  const el = document.getElementById(elementId)
  if (!el) return undefined
  
  try {
    const canvas = await html2canvas(el, {
      backgroundColor: '#ffffff',
      scale: 2,
    })
    return canvas.toDataURL('image/png')
  } catch (e) {
    console.error('Failed to capture chart', e)
    return undefined
  }
}

export const downloadPDF = async (data: PDFReportData, filename?: string) => {
  const blob = await generateEnergyReport(data)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `能源报告_${Date.now()}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
