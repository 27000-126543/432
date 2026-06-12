import type { Guild } from '@/types'
import { useGameStore } from '@/store/gameStore'
import { HUB_COVERAGE } from '@/constants'

interface GuildCardProps {
  guild: Guild
  onJoin: () => void
}

export default function GuildCard({ guild, onJoin }: GuildCardProps) {
  const { currentPlayer } = useGameStore()

  const coverageLevel = HUB_COVERAGE[guild.hub?.level || 0] || 0
  const hasJoined = currentPlayer.guildId === guild.id

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'leader':
        return { bg: 'bg-amber-50', text: 'text-amber-600' }
      case 'vice_leader':
        return { bg: 'bg-purple-50', text: 'text-purple-600' }
      case 'tech_officer':
        return { bg: 'bg-cyan-50', text: 'text-cyan-600' }
      default:
        return { bg: 'bg-slate-50', text: 'text-slate-600' }
    }
  }

  const roleBadge = getRoleBadgeColor(currentPlayer.guildRole || '')

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all">
      <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl shadow-inner">
              {guild.emblem}
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-lg">{guild.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">
                  Lv.{guild.level}
                </span>
                {hasJoined && currentPlayer.guildRole && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge.bg} ${roleBadge.text}`}>
                    {currentPlayer.guildRole === 'leader' && '👑 会长'}
                    {currentPlayer.guildRole === 'vice_leader' && '⚔️ 副会长'}
                    {currentPlayer.guildRole === 'tech_officer' && '🔧 技术官'}
                    {currentPlayer.guildRole === 'member' && '👤 成员'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-slate-50 text-center">
            <div className="text-xl mb-1">👥</div>
            <div className="text-sm font-bold text-slate-800">{guild.memberCount}</div>
            <div className="text-[10px] text-slate-500">成员</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-center">
            <div className="text-xl mb-1">📡</div>
            <div className="text-sm font-bold text-emerald-700">
              {guild.hub ? `Lv.${guild.hub.level}` : '—'}
            </div>
            <div className="text-[10px] text-emerald-600">枢纽等级</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-center">
            <div className="text-xl mb-1">🌐</div>
            <div className="text-sm font-bold text-amber-700">{coverageLevel}%</div>
            <div className="text-[10px] text-amber-600">覆盖率</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>💰</span>
              <span>金库</span>
              <span className="font-semibold text-slate-700">{guild.gold.toLocaleString()}</span>
            </div>
            {(guild.efficiencyBonus > 0 || guild.feeDiscount > 0) && (
              <div className="flex items-center gap-2 text-[10px]">
                {guild.efficiencyBonus > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-medium">
                    效率+{(guild.efficiencyBonus * 100).toFixed(0)}%
                  </span>
                )}
                {guild.feeDiscount > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-600 font-medium">
                    折扣-{(guild.feeDiscount * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            onClick={onJoin}
            disabled={hasJoined || !!currentPlayer.guildId}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              hasJoined
                ? 'bg-emerald-100 text-emerald-700 cursor-default'
                : currentPlayer.guildId
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-200'
            }`}
          >
            {hasJoined ? '✓ 已加入' : currentPlayer.guildId ? '已在其他公会' : '加入公会'}
          </button>
        </div>
      </div>
    </div>
  )
}
