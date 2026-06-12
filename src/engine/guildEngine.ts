import type { Guild, SuperHub, UpgradeProcess, ApprovalStatus, Player } from '@/types'
import { HUB_UPGRADE_COSTS, HUB_EFFICIENCY_BONUS, HUB_FEE_DISCOUNT, HUB_COVERAGE, GRID_REGIONS } from '@/constants'
import { generateId, randomBetween, randomInt, randomChoice } from '@/utils'

export const createGuild = (name: string, leader: Player): Guild => {
  return {
    id: generateId('gld'),
    name,
    emblem: randomChoice(['⚔️', '🏰', '🌟', '🔮', '🐉', '🦅', '⚡', '🌹']),
    leaderId: leader.id,
    viceLeaders: [],
    techOfficers: [],
    members: [leader.id],
    memberCount: 1,
    level: 1,
    gold: 0,
    materials: { mana_crystal: 0, arcane_core: 0, dragon_scale: 0 },
    hub: null,
    efficiencyBonus: 0,
    feeDiscount: 0,
    gridCoverage: 0,
    totalContribution: 0,
    createdAt: Date.now(),
  }
}

export const createSuperHub = (guild: Guild, regionIndex: number): SuperHub => {
  const region = GRID_REGIONS[regionIndex % GRID_REGIONS.length]
  return {
    id: generateId('hub'),
    guildId: guild.id,
    level: 1,
    name: `${guild.name}能源枢纽`,
    regionId: region.id,
    x: region.centerX + randomBetween(-30, 30),
    y: region.centerY + randomBetween(-30, 30),
    totalOutput: 500,
    coverageRadius: HUB_COVERAGE[1],
    connectedLines: [],
    upgradeProcess: null,
    stats: {
      totalGenerated: 0,
      peakOutput: 500,
      totalTraded: 0,
      uptime: 100,
      eventsHandled: 0,
    },
  }
}

export const startHubUpgrade = (hub: SuperHub): UpgradeProcess | null => {
  const nextLevel = hub.level + 1
  if (nextLevel >= HUB_UPGRADE_COSTS.length) return null
  
  const costs = HUB_UPGRADE_COSTS[nextLevel]
  
  return {
    id: generateId('upg'),
    hubId: hub.id,
    targetLevel: nextLevel,
    requiredGold: costs.gold,
    requiredMaterials: { ...costs.materials },
    contributedGold: 0,
    contributedMaterials: {
      mana_crystal: 0,
      arcane_core: 0,
      dragon_scale: 0,
    },
    approvals: {
      leader: 'pending',
      viceLeaders: {},
      techOfficers: {},
    },
    status: 'collecting',
    startTime: Date.now(),
    completeTime: null,
  }
}

export const contributeToUpgrade = (
  process: UpgradeProcess,
  gold: number,
  materials: Record<string, number>
): UpgradeProcess => {
  const updated = { ...process }
  updated.contributedGold = Math.min(updated.requiredGold, updated.contributedGold + gold)
  
  for (const [key, value] of Object.entries(materials)) {
    const required = updated.requiredMaterials[key] || 0
    const current = updated.contributedMaterials[key] || 0
    updated.contributedMaterials[key] = Math.min(required, current + value)
  }
  
  const goldReady = updated.contributedGold >= updated.requiredGold
  const materialsReady = Object.entries(updated.requiredMaterials).every(
    ([k, v]) => (updated.contributedMaterials[k] || 0) >= v
  )
  
  if (goldReady && materialsReady) {
    updated.status = 'approving'
  }
  
  return updated
}

export const approveUpgrade = (
  process: UpgradeProcess,
  role: 'leader' | 'viceLeader' | 'techOfficer',
  memberId: string,
  status: ApprovalStatus
): { process: UpgradeProcess; allApproved: boolean } => {
  const updated = { ...process, approvals: { ...process.approvals } }
  
  if (role === 'leader') {
    updated.approvals.leader = status
  } else if (role === 'viceLeader') {
    updated.approvals.viceLeaders = {
      ...updated.approvals.viceLeaders,
      [memberId]: status,
    }
  } else {
    updated.approvals.techOfficers = {
      ...updated.approvals.techOfficers,
      [memberId]: status,
    }
  }
  
  if (status === 'rejected') {
    updated.status = 'rejected'
    return { process: updated, allApproved: false }
  }
  
  const leaderApproved = updated.approvals.leader === 'approved'
  const hasVice = Object.keys(updated.approvals.viceLeaders).length > 0
  const viceApproved = !hasVice || Object.values(updated.approvals.viceLeaders).every(s => s === 'approved')
  const hasTech = Object.keys(updated.approvals.techOfficers).length > 0
  const techApproved = !hasTech || Object.values(updated.approvals.techOfficers).every(s => s === 'approved')
  
  const allApproved = leaderApproved && viceApproved && techApproved
  
  if (allApproved) {
    updated.status = 'upgrading'
    updated.completeTime = Date.now() + 60000
  }
  
  return { process: updated, allApproved }
}

export const completeUpgrade = (hub: SuperHub, process: UpgradeProcess): SuperHub => {
  const newLevel = process.targetLevel
  const bonus = HUB_EFFICIENCY_BONUS[newLevel] || HUB_EFFICIENCY_BONUS[HUB_EFFICIENCY_BONUS.length - 1]
  const discount = HUB_FEE_DISCOUNT[newLevel] || HUB_FEE_DISCOUNT[HUB_FEE_DISCOUNT.length - 1]
  const coverage = HUB_COVERAGE[newLevel] || HUB_COVERAGE[HUB_COVERAGE.length - 1]
  
  return {
    ...hub,
    level: newLevel,
    totalOutput: Math.floor(hub.totalOutput * (1 + 0.5)),
    coverageRadius: coverage,
    stats: {
      ...hub.stats,
      peakOutput: Math.floor(hub.stats.peakOutput * (1 + 0.5)),
    },
  }
}

export const calculateGuildBonus = (guild: Guild): { efficiencyBonus: number; feeDiscount: number; coverage: number } => {
  if (!guild.hub) {
    return { efficiencyBonus: 0, feeDiscount: 0, coverage: 0 }
  }
  const level = Math.min(guild.hub.level, HUB_EFFICIENCY_BONUS.length - 1)
  return {
    efficiencyBonus: HUB_EFFICIENCY_BONUS[level],
    feeDiscount: HUB_FEE_DISCOUNT[level],
    coverage: HUB_COVERAGE[level],
  }
}

export const addGuildMember = (guild: Guild, playerId: string, role: 'member' | 'vice_leader' | 'tech_officer' = 'member'): Guild => {
  if (guild.members.includes(playerId)) return guild
  
  const updated = {
    ...guild,
    members: [...guild.members, playerId],
    memberCount: guild.memberCount + 1,
  }
  
  if (role === 'vice_leader') {
    updated.viceLeaders = [...guild.viceLeaders, playerId]
  } else if (role === 'tech_officer') {
    updated.techOfficers = [...guild.techOfficers, playerId]
  }
  
  return updated
}

export const getMemberContributionRank = (
  guild: Guild,
  contributions: Record<string, number>
): Array<{ playerId: string; contribution: number; rank: number }> => {
  return guild.members
    .map(id => ({
      playerId: id,
      contribution: contributions[id] || 0,
    }))
    .sort((a, b) => b.contribution - a.contribution)
    .map((item, idx) => ({ ...item, rank: idx + 1 }))
}
