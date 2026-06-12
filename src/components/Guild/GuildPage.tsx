import { useState, useMemo, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import {
  HUB_UPGRADE_COSTS,
  HUB_EFFICIENCY_BONUS,
  HUB_FEE_DISCOUNT,
  HUB_COVERAGE,
  MATERIALS,
} from '@/constants'
import type { GuildRole, ApprovalStatus } from '@/types'
import GuildCard from './GuildCard'

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toFixed(0)
}

const roleLabels: Record<GuildRole, { label: string; icon: string; color: string }> = {
  leader: { label: '会长', icon: '👑', color: 'from-amber-400 to-orange-500' },
  vice_leader: { label: '副会长', icon: '⚔️', color: 'from-purple-400 to-pink-500' },
  tech_officer: { label: '技术官', icon: '🔧', color: 'from-cyan-400 to-blue-500' },
  member: { label: '成员', icon: '👤', color: 'from-slate-400 to-slate-500' },
}

const statusLabels: Record<ApprovalStatus, { label: string; color: string; icon: string }> = {
  pending: { label: '待审批', color: 'bg-amber-100 text-amber-700', icon: '⏳' },
  approved: { label: '已通过', color: 'bg-emerald-100 text-emerald-700', icon: '✓' },
  rejected: { label: '已拒绝', color: 'bg-rose-100 text-rose-700', icon: '✗' },
}

export default function GuildPage() {
  const { guilds, currentPlayer, actions } = useGameStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newGuildName, setNewGuildName] = useState('')
  const [contributeGold, setContributeGold] = useState(0)
  const [contributeMaterials, setContributeMaterials] = useState<Record<string, number>>({})
  const [upgradeCountdown, setUpgradeCountdown] = useState<number>(0)

  const myGuild = useMemo(
    () => guilds.find((g) => g.id === currentPlayer.guildId) || null,
    [guilds, currentPlayer.guildId]
  )

  const filteredGuilds = useMemo(() => {
    if (!searchQuery.trim()) return guilds
    const q = searchQuery.toLowerCase()
    return guilds.filter((g) => g.name.toLowerCase().includes(q))
  }, [guilds, searchQuery])

  const nextLevelCost = useMemo(() => {
    if (!myGuild?.hub) return null
    const nextLevel = myGuild.hub.level + 1
    return HUB_UPGRADE_COSTS.find((c) => c.level === nextLevel) || null
  }, [myGuild])

  const upgradeProcess = myGuild?.hub?.upgradeProcess || null

  useEffect(() => {
    if (!upgradeProcess || upgradeProcess.status !== 'upgrading' || !upgradeProcess.completeTime) {
      setUpgradeCountdown(0)
      return
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, upgradeProcess.completeTime! - Date.now())
      setUpgradeCountdown(remaining)
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [upgradeProcess])

  const formatCountdown = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const getMemberRole = (guild: typeof myGuild, memberId: string): GuildRole => {
    if (!guild) return 'member'
    if (guild.leaderId === memberId) return 'leader'
    if (guild.viceLeaders.includes(memberId)) return 'vice_leader'
    if (guild.techOfficers.includes(memberId)) return 'tech_officer'
    return 'member'
  }

  const canApprove = useMemo(() => {
    if (!myGuild || !upgradeProcess) return false
    if (upgradeProcess.status !== 'approving') return false

    const role = currentPlayer.guildRole
    if (role === 'leader') return upgradeProcess.approvals.leader === 'pending'
    if (role === 'vice_leader') {
      return (
        upgradeProcess.approvals.viceLeaders[currentPlayer.id] === 'pending'
      )
    }
    if (role === 'tech_officer') {
      return (
        upgradeProcess.approvals.techOfficers[currentPlayer.id] === 'pending'
      )
    }
    return false
  }, [myGuild, upgradeProcess, currentPlayer])

  const handleCreateGuild = () => {
    if (!newGuildName.trim()) return
    actions.createGuild(newGuildName.trim())
    setShowCreateModal(false)
    setNewGuildName('')
  }

  const handleContribute = () => {
    if (contributeGold <= 0 && Object.values(contributeMaterials).every((v) => v <= 0)) return
    const materials: Record<string, number> = {}
    for (const [key, val] of Object.entries(contributeMaterials)) {
      if (val > 0) materials[key] = val
    }
    actions.contributeToGuild(contributeGold, materials)
    setContributeGold(0)
    setContributeMaterials({})
  }

  const handleApprove = (approve: boolean) => {
    const roleMap: Record<string, 'leader' | 'viceLeader' | 'techOfficer'> = {
      leader: 'leader',
      vice_leader: 'viceLeader',
      tech_officer: 'techOfficer',
    }
    const role = roleMap[currentPlayer.guildRole || '']
    if (!role) return
    actions.approveHubUpgrade(role, approve)
  }

  if (!myGuild) {
    return (
      <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">公会系统</h1>
            <p className="text-sm text-slate-500 mt-1">加入或创建公会，共建超级能源枢纽</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
          >
            + 创建公会 (1,000,000💰)
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索公会名称..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGuilds.map((guild) => (
            <GuildCard
              key={guild.id}
              guild={guild}
              onJoin={() => actions.joinGuild(guild.id)}
            />
          ))}
        </div>

        {filteredGuilds.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <div className="text-5xl mb-4">🏰</div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">未找到公会</h3>
            <p className="text-sm text-slate-500">尝试调整搜索关键词，或创建一个新的公会吧！</p>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">创建新公会</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">公会名称</label>
                  <input
                    type="text"
                    value={newGuildName}
                    onChange={(e) => setNewGuildName(e.target.value)}
                    placeholder="请输入公会名称..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    maxLength={20}
                  />
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-2 text-amber-700">
                    <span className="text-lg">💰</span>
                    <span className="text-sm font-medium">创建费用：1,000,000 金币</span>
                  </div>
                  <p className="text-xs text-amber-600 mt-1">
                    当前金币：{currentPlayer.gold.toLocaleString()}
                    {currentPlayer.gold < 1000000 && (
                      <span className="ml-1 text-rose-600">（金币不足）</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewGuildName('')
                  }}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateGuild}
                  disabled={!newGuildName.trim() || currentPlayer.gold < 1000000}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认创建
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const myRole = currentPlayer.guildRole || 'member'
  const roleInfo = roleLabels[myRole]
  const membersWithRoles = myGuild.members.map((memberId) => ({
    id: memberId,
    name: `玩家_${memberId.slice(-4)}`,
    role: getMemberRole(myGuild, memberId),
    contribution: Math.floor(Math.random() * 1000000),
    avatar: ['🧙', '🧝', '🧛', '🧚', '🦸', '🥷', '👨‍🔬', '👩‍🔧'][
      parseInt(memberId.slice(-1), 16) % 8
    ],
  })).sort((a, b) => {
    const roleOrder: Record<string, number> = { leader: 0, vice_leader: 1, tech_officer: 2, member: 3 }
    return roleOrder[a.role] - roleOrder[b.role]
  })

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">{myGuild.name}</h1>
              <div className={`px-3 py-1 rounded-full text-sm font-semibold text-white bg-gradient-to-r ${roleInfo.color} shadow-md`}>
                {roleInfo.icon} {roleInfo.label}
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              公会等级 Lv.{myGuild.level} · 建立于 {new Date(myGuild.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            if (confirm('确定要退出公会吗？')) actions.leaveGuild()
          }}
          disabled={myRole === 'leader'}
          className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 font-medium hover:bg-rose-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          退出公会
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="h-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🏰</span> 公会信息
              </h3>

              <div className="flex items-start gap-6 mb-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-5xl shadow-inner border-4 border-white">
                  {myGuild.emblem}
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
                    <div className="text-2xl font-bold text-indigo-700">Lv.{myGuild.level}</div>
                    <div className="text-xs text-indigo-600 mt-1">公会等级</div>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                    <div className="text-2xl font-bold text-emerald-700">{myGuild.memberCount}</div>
                    <div className="text-xs text-emerald-600 mt-1">成员数量</div>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                    <div className="text-2xl font-bold text-amber-700">{formatNumber(myGuild.gold)}</div>
                    <div className="text-xs text-amber-600 mt-1">公会金币</div>
                  </div>
                  <div className="p-4 rounded-xl bg-cyan-50/50 border border-cyan-100">
                    <div className="text-2xl font-bold text-cyan-700">{formatNumber(myGuild.totalContribution)}</div>
                    <div className="text-xs text-cyan-600 mt-1">累计贡献</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <span>📦</span> 材料库存
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Object.entries(MATERIALS).map(([key, mat]) => {
                    const stock = myGuild.materials[key] || 0
                    return (
                      <div
                        key={key}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{mat.icon}</span>
                          <span className="text-xs font-medium text-slate-600 truncate">{mat.name}</span>
                        </div>
                        <div className="text-lg font-bold" style={{ color: mat.color }}>
                          {formatNumber(stock)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {myGuild.hub && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="h-3 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="text-2xl">⚡</span> 超级能源枢纽
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-700 text-sm font-semibold">
                      Lv.{myGuild.hub.level}
                    </span>
                  </h3>
                  {myRole === 'tech_officer' && !upgradeProcess && nextLevelCost && (
                    <button
                      onClick={() => actions.requestHubUpgrade()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-200 active:scale-95"
                    >
                      🚀 申请升级
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100">
                    <div className="text-xs text-cyan-600 mb-1">📍 位置</div>
                    <div className="text-sm font-bold text-cyan-800">
                      X:{myGuild.hub.x} Y:{myGuild.hub.y}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                    <div className="text-xs text-emerald-600 mb-1">⚡ 产出</div>
                    <div className="text-sm font-bold text-emerald-800">
                      {formatNumber(myGuild.hub.totalOutput)}/h
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                    <div className="text-xs text-amber-600 mb-1">🌐 覆盖范围</div>
                    <div className="text-sm font-bold text-amber-800">
                      {HUB_COVERAGE[myGuild.hub.level] || 0}km
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                    <div className="text-xs text-purple-600 mb-1">🔗 连接线路</div>
                    <div className="text-sm font-bold text-purple-800">
                      {myGuild.hub.connectedLines.length} 条
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-600">⚡ 效率加成</span>
                      <span className="text-xs text-slate-400">升级后</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-emerald-600">
                        +{((HUB_EFFICIENCY_BONUS[myGuild.hub.level] || 0) * 100).toFixed(0)}%
                      </span>
                      {nextLevelCost && (
                        <span className="text-sm text-slate-400">
                          → +{((HUB_EFFICIENCY_BONUS[nextLevelCost.level] || 0) * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-600">💸 手续费折扣</span>
                      <span className="text-xs text-slate-400">升级后</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-cyan-600">
                        -{((HUB_FEE_DISCOUNT[myGuild.hub.level] || 0) * 100).toFixed(0)}%
                      </span>
                      {nextLevelCost && (
                        <span className="text-sm text-slate-400">
                          → -{((HUB_FEE_DISCOUNT[nextLevelCost.level] || 0) * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-600">🌐 覆盖率</span>
                      <span className="text-xs text-slate-400">升级后</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-amber-600">
                        {HUB_COVERAGE[myGuild.hub.level] || 0}%
                      </span>
                      {nextLevelCost && (
                        <span className="text-sm text-slate-400">
                          → {HUB_COVERAGE[nextLevelCost.level] || 0}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {myGuild.hub.stats && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">📊 枢纽统计</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="text-center p-3 rounded-lg bg-slate-50">
                        <div className="text-lg font-bold text-slate-700">{formatNumber(myGuild.hub.stats.totalGenerated)}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">累计发电</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-slate-50">
                        <div className="text-lg font-bold text-slate-700">{formatNumber(myGuild.hub.stats.peakOutput)}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">峰值输出</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-slate-50">
                        <div className="text-lg font-bold text-slate-700">{formatNumber(myGuild.hub.stats.totalTraded)}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">撮合交易</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-slate-50">
                        <div className="text-lg font-bold text-slate-700">{(myGuild.hub.stats.uptime * 100).toFixed(1)}%</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">运行时长</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-slate-50">
                        <div className="text-lg font-bold text-slate-700">{myGuild.hub.stats.eventsHandled}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">处理事件</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {upgradeProcess && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="h-3 bg-gradient-to-r from-orange-400 via-rose-500 to-red-500 animate-pulse" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="text-2xl">🔄</span> 枢纽升级流程
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold">
                      → Lv.{upgradeProcess.targetLevel}
                    </span>
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    upgradeProcess.status === 'collecting'
                      ? 'bg-blue-100 text-blue-700'
                      : upgradeProcess.status === 'approving'
                      ? 'bg-amber-100 text-amber-700'
                      : upgradeProcess.status === 'upgrading'
                      ? 'bg-emerald-100 text-emerald-700'
                      : upgradeProcess.status === 'rejected'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {upgradeProcess.status === 'collecting' && '📦 收集贡献中'}
                    {upgradeProcess.status === 'approving' && '✅ 审批中'}
                    {upgradeProcess.status === 'upgrading' && '⚙️ 升级中'}
                    {upgradeProcess.status === 'rejected' && '❌ 已拒绝'}
                    {upgradeProcess.status === 'completed' && '🎉 已完成'}
                  </span>
                </div>

                {upgradeProcess.status === 'collecting' && (
                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <span>💰</span> 金币贡献
                        </span>
                        <span className="text-sm text-slate-500">
                          <span className="font-semibold text-indigo-600">
                            {formatNumber(upgradeProcess.contributedGold)}
                          </span>
                          {' / '}
                          {formatNumber(upgradeProcess.requiredGold)}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (upgradeProcess.contributedGold / Math.max(1, upgradeProcess.requiredGold)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(upgradeProcess.requiredMaterials).map(([key, required]) => {
                        if (required <= 0) return null
                        const contributed = upgradeProcess.contributedMaterials[key] || 0
                        const mat = MATERIALS[key as keyof typeof MATERIALS]
                        const percent = (contributed / Math.max(1, required)) * 100
                        return (
                          <div key={key}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <span>{mat?.icon || '📦'}</span>
                                {mat?.name || key}
                              </span>
                              <span className="text-sm text-slate-500">
                                <span className="font-semibold" style={{ color: mat?.color }}>
                                  {formatNumber(contributed)}
                                </span>
                                {' / '}
                                {formatNumber(required)}
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(100, percent)}%`,
                                  backgroundColor: mat?.color || '#6366f1',
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {upgradeProcess.status === 'approving' && (
                  <div className="space-y-5">
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">👑</span>
                          <div>
                            <div className="font-semibold text-amber-800">会长审批</div>
                            <div className="text-xs text-amber-600">最终决策权</div>
                          </div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${statusLabels[upgradeProcess.approvals.leader].color}`}>
                          {statusLabels[upgradeProcess.approvals.leader].icon} {statusLabels[upgradeProcess.approvals.leader].label}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                        <div className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                          <span className="text-xl">⚔️</span> 副会长审批
                          <span className="text-xs font-normal text-purple-600">
                            ({Object.keys(upgradeProcess.approvals.viceLeaders).length}人)
                          </span>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(upgradeProcess.approvals.viceLeaders).map(([id, status]) => (
                            <div key={id} className="flex items-center justify-between text-sm">
                              <span className="text-purple-700">玩家_{id.slice(-4)}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusLabels[status].color}`}>
                                {statusLabels[status].icon} {statusLabels[status].label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-100">
                        <div className="font-semibold text-cyan-800 mb-3 flex items-center gap-2">
                          <span className="text-xl">🔧</span> 技术官审批
                          <span className="text-xs font-normal text-cyan-600">
                            ({Object.keys(upgradeProcess.approvals.techOfficers).length}人)
                          </span>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(upgradeProcess.approvals.techOfficers).map(([id, status]) => (
                            <div key={id} className="flex items-center justify-between text-sm">
                              <span className="text-cyan-700">玩家_{id.slice(-4)}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusLabels[status].color}`}>
                                {statusLabels[status].icon} {statusLabels[status].label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {canApprove && (
                      <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => handleApprove(true)}
                          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
                        >
                          ✓ 通过审批
                        </button>
                        <button
                          onClick={() => handleApprove(false)}
                          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-semibold hover:from-rose-600 hover:to-red-700 transition-all shadow-lg shadow-rose-200 active:scale-95"
                        >
                          ✗ 拒绝
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {upgradeProcess.status === 'upgrading' && (
                  <div className="text-center py-8">
                    <div className="relative w-40 h-40 mx-auto mb-6">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="url(#upgradeGradient)"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray="283"
                          style={{
                            strokeDashoffset: 283 * (1 - Math.min(1, upgradeCountdown / (1000 * 60 * 30))),
                            transition: 'stroke-dashoffset 1s linear',
                          }}
                        />
                        <defs>
                          <linearGradient id="upgradeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="50%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl mb-1 animate-bounce">⚡</span>
                        <div className="text-2xl font-bold text-slate-800">
                          {formatCountdown(upgradeCountdown)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">升级中...</div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500">超级能源枢纽正在升级，请耐心等待</p>
                  </div>
                )}

                {upgradeProcess.status === 'rejected' && (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-4">❌</div>
                    <h4 className="text-lg font-bold text-rose-700 mb-2">升级申请被拒绝</h4>
                    <p className="text-sm text-slate-500">升级申请未能通过审批，技术官可重新发起申请</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="text-2xl">👥</span> 公会成员
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-sm font-medium">
                {membersWithRoles.length} 人
              </span>
            </h3>

            <div className="space-y-2">
              {membersWithRoles.map((member) => {
                const memberRoleInfo = roleLabels[member.role]
                return (
                  <div
                    key={member.id}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-slate-50 ${
                      member.id === currentPlayer.id ? 'bg-indigo-50/60 border border-indigo-100' : ''
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-2xl shadow-sm">
                      {member.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800">
                          {member.name}
                          {member.id === currentPlayer.id && (
                            <span className="text-xs text-indigo-600 ml-1">(我)</span>
                          )}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${memberRoleInfo.color} shadow-sm`}>
                          {memberRoleInfo.icon} {memberRoleInfo.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        累计贡献：<span className="font-medium text-slate-700">{formatNumber(member.contribution)}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-slate-400 mb-1">贡献排名</div>
                      <div className="text-lg font-bold text-indigo-600">
                        #{membersWithRoles.indexOf(member) + 1}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="text-2xl">🎁</span> 贡献物资
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  💰 金币贡献
                  <span className="text-xs text-slate-400 ml-2">
                    (当前: {currentPlayer.gold.toLocaleString()})
                  </span>
                </label>
                <input
                  type="number"
                  value={contributeGold || ''}
                  onChange={(e) => setContributeGold(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="输入金币数量..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  min={0}
                  max={currentPlayer.gold}
                />
                <div className="flex gap-2 mt-2">
                  {[10000, 50000, 100000, 500000].map((val) => (
                    <button
                      key={val}
                      onClick={() => setContributeGold(Math.min(val, currentPlayer.gold))}
                      className="flex-1 py-1.5 text-xs rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors font-medium"
                    >
                      {formatNumber(val)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">📦 材料贡献</label>
                <div className="space-y-2">
                  {Object.entries(MATERIALS).map(([key, mat]) => (
                    <div key={key} className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: mat.color + '15' }}
                      >
                        {mat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-600 truncate">{mat.name}</div>
                        <input
                          type="number"
                          value={contributeMaterials[key] || ''}
                          onChange={(e) =>
                            setContributeMaterials({
                              ...contributeMaterials,
                              [key]: Math.max(0, parseInt(e.target.value) || 0),
                            })
                          }
                          placeholder="0"
                          className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          min={0}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleContribute}
                disabled={contributeGold <= 0 && Object.values(contributeMaterials).every((v) => !v || v <= 0)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all shadow-xl shadow-indigo-200/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                🚀 提交贡献
              </button>
            </div>
          </div>

          {nextLevelCost && !upgradeProcess && (
            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-0.5 shadow-xl shadow-indigo-200">
              <div className="bg-white rounded-[14px] p-5">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">🚀</span> 升级到 Lv.{nextLevelCost.level} 所需
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💰</span>
                      <span className="text-sm font-medium text-amber-800">金币</span>
                    </div>
                    <span className="text-sm font-bold text-amber-700">
                      {nextLevelCost.gold.toLocaleString()}
                    </span>
                  </div>

                  {Object.entries(nextLevelCost.materials).map(([key, req]) => {
                    if (req <= 0) return null
                    const mat = MATERIALS[key as keyof typeof MATERIALS]
                    const current = myGuild.materials[key] || 0
                    const enough = current >= req
                    return (
                      <div
                        key={key}
                        className={`flex items-center justify-between p-3 rounded-xl border ${
                          enough
                            ? 'bg-emerald-50 border-emerald-100'
                            : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{mat?.icon}</span>
                          <span className="text-sm font-medium text-slate-700">{mat?.name}</span>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-bold ${enough ? 'text-emerald-700' : 'text-slate-600'}`}>
                            {formatNumber(current)}
                          </span>
                          <span className="text-xs text-slate-400"> / {formatNumber(req)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="text-xs text-slate-500 mb-2">升级后获得加成：</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                      效率 +{((HUB_EFFICIENCY_BONUS[nextLevelCost.level] || 0) * 100).toFixed(0)}%
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-700 text-xs font-medium">
                      折扣 -{((HUB_FEE_DISCOUNT[nextLevelCost.level] || 0) * 100).toFixed(0)}%
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                      覆盖 {HUB_COVERAGE[nextLevelCost.level] || 0}km
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
