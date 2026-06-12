import { useState, useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { LeaderboardEntry } from '@/types'

type TabKey = 'generation' | 'trading' | 'guildCoverage'

const TABS: { key: TabKey; label: string; icon: string; unit: string }[] = [
  { key: 'generation', label: '发电量排行', icon: '⚡', unit: 'MWh' },
  { key: 'trading', label: '交易量排行', icon: '💎', unit: '金币' },
  { key: 'guildCoverage', label: '公会电网覆盖排行', icon: '🛡️', unit: '%' },
]

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toFixed(0)
}

const Top3Podium = ({
  entries,
  unit,
  currentPlayerId,
}: {
  entries: LeaderboardEntry[]
  unit: string
  currentPlayerId: string
}) => {
  const gold = entries[0]
  const silver = entries[1]
  const bronze = entries[2]

  const PodiumCard = ({
    entry,
    rank,
    medalColor,
    bgGradient,
    heightClass,
    order,
  }: {
    entry?: LeaderboardEntry
    rank: number
    medalColor: string
    bgGradient: string
    heightClass: string
    order: number
  }) => {
    if (!entry) {
      return (
        <div className={`flex flex-col items-center ${order === 2 ? 'order-2' : order === 1 ? 'order-1 lg:order-1' : 'order-3'}`}>
          <div className="w-16 h-16 rounded-full bg-slate-100 mb-3" />
          <div className={`w-24 lg:w-28 ${heightClass} rounded-t-2xl bg-slate-100 flex items-end justify-center pb-4`}>
            <span className="text-3xl font-bold text-slate-300">#{rank}</span>
          </div>
        </div>
      )
    }

    const isCurrentPlayer = entry.playerId === currentPlayerId

    return (
      <div className={`flex flex-col items-center ${order === 2 ? 'order-2' : order === 1 ? 'order-1 lg:order-1' : 'order-3'}`}>
        <div className="relative mb-2">
          <div
            className={`w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center text-2xl lg:text-3xl shadow-lg ring-4 ${
              isCurrentPlayer ? 'ring-indigo-400' : 'ring-white'
            }`}
            style={{ background: bgGradient }}
          >
            <img
              src={entry.avatar}
              alt={entry.playerName}
              className="w-full h-full rounded-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
          <div
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md"
            style={{ backgroundColor: medalColor }}
          >
            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
          </div>
          {isCurrentPlayer && (
            <div className="absolute -top-2 -left-2 px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full shadow-md">
              我
            </div>
          )}
        </div>

        <div className="text-center mb-2 px-2 max-w-[120px]">
          <div className={`text-sm font-bold truncate ${isCurrentPlayer ? 'text-indigo-600' : 'text-slate-800'}`}>
            {entry.playerName}
          </div>
          {entry.guildName && (
            <div className="text-[10px] text-slate-500 truncate">「{entry.guildName}」</div>
          )}
        </div>

        <div className="text-center mb-3">
          <span className="text-xl lg:text-2xl font-bold text-slate-800">
            {rank === 1 ? formatNumber(entry.value) : rank === 2 ? formatNumber(entry.value) : formatNumber(entry.value)}
          </span>
          <span className="text-xs text-slate-500 ml-1">{unit}</span>
        </div>

        <div
          className={`w-24 lg:w-28 ${heightClass} rounded-t-2xl flex flex-col items-end justify-end pb-3 relative overflow-hidden`}
          style={{ background: bgGradient }}
        >
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]" />
          <div className="relative w-full text-center">
            <div className="text-white text-3xl lg:text-4xl font-black drop-shadow-md">#{rank}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end justify-center gap-3 lg:gap-8 py-6 lg:py-10">
      <PodiumCard
        entry={silver}
        rank={2}
        medalColor="#94a3b8"
        bgGradient="linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%)"
        heightClass="h-24 lg:h-32"
        order={1}
      />
      <PodiumCard
        entry={gold}
        rank={1}
        medalColor="#f59e0b"
        bgGradient="linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)"
        heightClass="h-32 lg:h-44"
        order={2}
      />
      <PodiumCard
        entry={bronze}
        rank={3}
        medalColor="#cd7c3f"
        bgGradient="linear-gradient(180deg, #d4a574 0%, #cd7c3f 100%)"
        heightClass="h-20 lg:h-24"
        order={3}
      />
    </div>
  )
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('generation')
  const leaderboards = useGameStore((state) => state.leaderboards)
  const currentPlayer = useGameStore((state) => state.currentPlayer)

  const currentTab = TABS.find((t) => t.key === activeTab)!
  const data = useMemo(() => leaderboards[activeTab] ?? [], [leaderboards, activeTab])

  const top3 = useMemo(() => data.slice(0, 3), [data])
  const restList = useMemo(() => data.slice(3), [data])

  const myEntry = useMemo(() => {
    const found = data.find((e) => e.playerId === currentPlayer.id)
    if (found) return found
    return {
      rank: data.length + 1,
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      avatar: currentPlayer.avatar,
      value: activeTab === 'generation'
        ? currentPlayer.totalGenerated
        : activeTab === 'trading'
        ? currentPlayer.totalTraded * 1000
        : 0,
      change: 0,
      guildName: null,
    } as LeaderboardEntry
  }, [data, currentPlayer, activeTab])

  const renderRow = (entry: LeaderboardEntry, isMine: boolean = false) => (
    <div
      key={`${entry.playerId}-${entry.rank}`}
      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
        isMine
          ? 'bg-indigo-50 border-2 border-indigo-200 shadow-sm'
          : 'hover:bg-slate-50 border-2 border-transparent'
      }`}
    >
      <div className="w-8 text-center flex-shrink-0">
        {entry.rank <= 3 ? (
          <span className="text-lg">
            {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
          </span>
        ) : (
          <span
            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-bold ${
              entry.rank <= 10
                ? 'bg-slate-800 text-white'
                : entry.rank <= 50
                ? 'bg-slate-200 text-slate-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            #{entry.rank}
          </span>
        )}
      </div>

      <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm">
        <img
          src={entry.avatar}
          alt={entry.playerName}
          className="w-full h-full object-cover"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`font-semibold text-sm truncate ${
              isMine ? 'text-indigo-700' : 'text-slate-800'
            }`}
          >
            {entry.playerName}
          </span>
          {isMine && (
            <span className="px-1.5 py-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded">
              我
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 truncate">
          {entry.guildName ? `「${entry.guildName}」` : '暂无公会'}
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className="font-bold text-slate-800 text-sm">
          {formatNumber(entry.value)}
          <span className="text-xs text-slate-500 font-normal ml-1">{currentTab.unit}</span>
        </div>
        <div
          className={`text-xs font-medium inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
            entry.change > 0
              ? 'text-emerald-600 bg-emerald-50'
              : entry.change < 0
              ? 'text-rose-600 bg-rose-50'
              : 'text-slate-400 bg-slate-50'
          }`}
        >
          {entry.change > 0 ? (
            <>
              <span>↑</span>
              <span>{entry.change}</span>
            </>
          ) : entry.change < 0 ? (
            <>
              <span>↓</span>
              <span>{Math.abs(entry.change)}</span>
            </>
          ) : (
            <>
              <span>—</span>
              <span>0</span>
            </>
          )}
        </div>
      </div>
    </div>
  )

  const isMineInTop3 = top3.some((e) => e.playerId === currentPlayer.id)
  const isMineInList = restList.some((e) => e.playerId === currentPlayer.id)

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">全服排行榜</h1>
          <p className="text-sm text-slate-500 mt-1">实时更新 · 每30秒刷新一次排名</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 mb-6 inline-flex gap-1 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 lg:p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <span>{currentTab.icon}</span>
              <span>{currentTab.label}</span>
            </h2>
            <span className="text-xs text-slate-400">共 {data.length} 名玩家</span>
          </div>

          <Top3Podium
            entries={top3}
            unit={currentTab.unit}
            currentPlayerId={currentPlayer.id}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 lg:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-700">完整榜单</h3>
            <span className="text-xs text-slate-400">#4 — #{data.length}</span>
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {restList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                暂无更多排名数据
              </div>
            ) : (
              restList.map((entry) =>
                renderRow(entry, entry.playerId === currentPlayer.id)
              )
            )}
          </div>
        </div>

        {!isMineInTop3 && !isMineInList && (
          <div className="sticky bottom-4 z-10">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-indigo-200 p-4">
              <div className="text-xs text-indigo-500 font-semibold mb-2 flex items-center gap-1">
                <span>📍</span>
                <span>我的排名</span>
              </div>
              {renderRow(myEntry, true)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
