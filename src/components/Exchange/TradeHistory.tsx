import { useGameStore } from '@/store/gameStore'
import { formatNumber, formatTime } from '@/utils'

const TradeHistory = () => {
  const trades = useGameStore(state => state.trades)
  const currentPlayer = useGameStore(state => state.currentPlayer)

  const displayTrades = trades.slice(0, 30)

  return (
    <div className="bg-slate-900/80 rounded-lg border border-slate-700/50 overflow-hidden flex flex-col h-full">
      <div className="px-3 py-2 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">成交历史</h3>
        <span className="text-xs text-slate-500">共 {trades.length} 笔</span>
      </div>

      <div className="grid grid-cols-4 px-3 py-1.5 text-[10px] text-slate-500 border-b border-slate-700/30">
        <span>时间</span>
        <span className="text-right">价格</span>
        <span className="text-right">数量</span>
        <span className="text-right">总额</span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {displayTrades.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">暂无成交记录</div>
        ) : (
          displayTrades.map(trade => {
            const isMyTrade = trade.buyerId === currentPlayer.id || trade.sellerId === currentPlayer.id
            const isBuy = trade.buyerId === currentPlayer.id
            return (
              <div
                key={trade.id}
                className={`grid grid-cols-4 px-3 py-1.5 text-xs border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${
                  isMyTrade ? (isBuy ? 'bg-emerald-500/5' : 'bg-rose-500/5') : ''
                }`}
              >
                <span className="text-slate-500 font-mono truncate">{formatTime(trade.timestamp)}</span>
                <span className={`text-right font-mono ${isBuy ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {trade.price.toLocaleString()}
                </span>
                <span className="text-right text-slate-300 font-mono">{formatNumber(trade.amount, 0)}</span>
                <span className="text-right text-slate-400 font-mono">{formatNumber(trade.amount * trade.price, 0)}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default TradeHistory
