import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { formatNumber } from '@/utils'

interface DepthRow {
  price: number
  volume: number
  cumulative: number
}

const OrderBook = () => {
  const getOrderBook = useGameStore(state => state.actions.getOrderBook)

  const orderBook = useMemo(() => getOrderBook(), [getOrderBook])

  const maxCumulative = Math.max(
    orderBook.buyDepth.length > 0 ? orderBook.buyDepth[orderBook.buyDepth.length - 1].cumulative : 0,
    orderBook.sellDepth.length > 0 ? orderBook.sellDepth[orderBook.sellDepth.length - 1].cumulative : 0,
    1
  )

  const renderRows = (rows: DepthRow[], isBuy: boolean) => {
    return rows.map((row, idx) => {
      const widthPct = (row.cumulative / maxCumulative) * 100
      return (
        <div key={idx} className="relative h-6 flex items-center justify-between text-xs px-2">
          <div
            className={`absolute top-0 ${isBuy ? 'right-0' : 'left-0'} h-full ${isBuy ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}
            style={{ width: `${widthPct}%` }}
          />
          <span className={`relative z-10 font-mono ${isBuy ? 'text-emerald-400' : 'text-rose-400'}`}>
            {row.price.toLocaleString()}
          </span>
          <span className="relative z-10 text-slate-300 font-mono">
            {formatNumber(row.volume, 0)}
          </span>
          <span className="relative z-10 text-slate-500 font-mono w-14 text-right">
            {formatNumber(row.cumulative, 0)}
          </span>
        </div>
      )
    })
  }

  return (
    <div className="bg-slate-900/80 rounded-lg border border-slate-700/50 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">订单簿</h3>
        <div className="flex gap-3 text-xs text-slate-400">
          <span>买 <span className="text-emerald-400 font-mono">{orderBook.buyOrders}</span></span>
          <span>卖 <span className="text-rose-400 font-mono">{orderBook.sellOrders}</span></span>
        </div>
      </div>

      <div className="grid grid-cols-3 px-2 py-1.5 text-[10px] text-slate-500 border-b border-slate-700/30">
        <span>价格</span>
        <span className="text-center">数量</span>
        <span className="text-right">累计</span>
      </div>

      <div className="max-h-48 overflow-y-auto">
        {[...orderBook.sellDepth].reverse().map((row, idx) => {
          const actualIdx = orderBook.sellDepth.length - 1 - idx
          return renderRows([orderBook.sellDepth[actualIdx]], false)[0]
        })}
      </div>

      <div className="px-3 py-2 border-y border-slate-700/50 bg-slate-800/50 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500">价差</div>
          <div className="text-sm font-mono text-slate-300">{orderBook.spread.toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">标记价格</div>
          <div className="text-base font-bold font-mono text-amber-400">
            {orderBook.bestBid > 0 && orderBook.bestAsk > 0
              ? Math.floor((orderBook.bestBid + orderBook.bestAsk) / 2).toLocaleString()
              : '-'}
          </div>
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto">
        {renderRows(orderBook.buyDepth, true)}
      </div>

      <div className="px-3 py-2 border-t border-slate-700/50 bg-slate-800/30 text-xs text-slate-400 flex justify-between">
        <span>买量: <span className="text-emerald-400 font-mono">{formatNumber(orderBook.buyVolume, 0)}</span></span>
        <span>卖量: <span className="text-rose-400 font-mono">{formatNumber(orderBook.sellVolume, 0)}</span></span>
      </div>
    </div>
  )
}

export default OrderBook
