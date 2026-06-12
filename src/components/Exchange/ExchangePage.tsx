import { useState, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useGameStore } from '@/store/gameStore'
import { formatNumber, formatPercent, formatGold, formatEnergy } from '@/utils'
import OrderBook from './OrderBook'
import TradeHistory from './TradeHistory'
import type { OrderType } from '@/types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const ExchangePage = () => {
  const currentPlayer = useGameStore(state => state.currentPlayer)
  const currentPrice = useGameStore(state => state.currentPrice)
  const priceChange24h = useGameStore(state => state.priceChange24h)
  const priceHistory = useGameStore(state => state.priceHistory)
  const buyOrders = useGameStore(state => state.buyOrders)
  const sellOrders = useGameStore(state => state.sellOrders)
  const trades = useGameStore(state => state.trades)
  const stats = useGameStore(state => state.stats)
  const placeOrder = useGameStore(state => state.actions.placeOrder)
  const cancelOrder = useGameStore(state => state.actions.cancelOrder)

  const [orderSide, setOrderSide] = useState<OrderType>('buy')
  const [orderMode, setOrderMode] = useState<'limit' | 'market'>('limit')
  const [orderPrice, setOrderPrice] = useState<string>(currentPrice.toString())
  const [orderAmount, setOrderAmount] = useState<string>('')

  const myBuyOrders = useMemo(
    () => buyOrders.filter(o => o.playerId === currentPlayer.id),
    [buyOrders, currentPlayer.id]
  )
  const mySellOrders = useMemo(
    () => sellOrders.filter(o => o.playerId === currentPlayer.id),
    [sellOrders, currentPlayer.id]
  )

  const myTrades = useMemo(
    () => trades.filter(t => t.buyerId === currentPlayer.id || t.sellerId === currentPlayer.id).slice(0, 20),
    [trades, currentPlayer.id]
  )

  const chartData = useMemo(() => {
    const data = priceHistory.slice(-100)
    return {
      labels: data.map(p => {
        const d = new Date(p.timestamp)
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
      }),
      datasets: [
        {
          label: '价格',
          data: data.map(p => p.price),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2,
        },
      ],
    }
  }, [priceHistory])

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#e2e8f0',
        bodyColor: '#cbd5e1',
        callbacks: {
          label: ctx => {
            const y = ctx.parsed.y
            return `价格: ${y != null ? y.toLocaleString() : '-'} 金币`
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#64748b', maxTicksLimit: 8, font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#64748b', font: { size: 10 }, callback: v => v.toLocaleString() },
      },
    },
  }

  const handlePlaceOrder = () => {
    const amount = parseInt(orderAmount)
    const price = orderMode === 'market' ? currentPrice : parseInt(orderPrice)
    if (isNaN(amount) || amount <= 0) return
    if (orderMode === 'limit' && (isNaN(price) || price <= 0)) return
    placeOrder(orderSide, amount, price)
    setOrderAmount('')
  }

  const setPercentAmount = (pct: number) => {
    if (orderSide === 'buy') {
      const maxByGold = Math.floor(currentPlayer.gold / (orderMode === 'market' ? currentPrice : parseInt(orderPrice) || currentPrice))
      setOrderAmount(Math.floor(maxByGold * pct).toString())
    } else {
      setOrderAmount(Math.floor(currentPlayer.manaTokens * pct).toString())
    }
  }

  const priceUp = priceChange24h >= 0

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 lg:p-6">
      <div className="max-w-[1800px] mx-auto space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-xl border border-amber-500/30 p-4">
            <div className="text-xs text-amber-300/80 mb-1">当前价格</div>
            <div className="text-2xl font-bold font-mono text-amber-400">
              {currentPrice.toLocaleString()} <span className="text-sm font-normal text-amber-300/60">金币</span>
            </div>
            <div className={`text-sm font-mono mt-1 ${priceUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {priceUp ? '▲' : '▼'} {formatPercent(Math.abs(priceChange24h))}
              <span className="text-xs text-slate-500 ml-1">24h</span>
            </div>
          </div>

          <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 p-4">
            <div className="text-xs text-slate-400 mb-1">24h 成交量</div>
            <div className="text-xl font-bold font-mono text-slate-200">{formatNumber(stats.totalVolume24h, 0)}</div>
            <div className="text-xs text-slate-500 mt-1">{stats.totalTrades24h} 笔交易</div>
          </div>

          <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 p-4">
            <div className="text-xs text-slate-400 mb-1">我的金币</div>
            <div className="text-xl font-bold font-mono text-yellow-400">{formatGold(currentPlayer.gold)}</div>
          </div>

          <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 p-4">
            <div className="text-xs text-slate-400 mb-1">我的魔力</div>
            <div className="text-xl font-bold font-mono text-cyan-400">{formatEnergy(currentPlayer.manaTokens)}</div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 p-4" id="price-chart-container">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-slate-200">K线价格走势</h2>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 cursor-pointer hover:bg-slate-700">1H</span>
                  <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-200">24H</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 cursor-pointer hover:bg-slate-700">7D</span>
                </div>
              </div>
              <div className="h-64">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-700/50 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-emerald-400">我的买单</h3>
                  <span className="text-xs text-slate-500">{myBuyOrders.length} 笔</span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {myBuyOrders.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-sm">暂无买单</div>
                  ) : (
                    myBuyOrders.map(order => (
                      <div key={order.id} className="px-4 py-2 border-b border-slate-800/50 text-xs flex items-center justify-between hover:bg-slate-800/30">
                        <div>
                          <div className="text-emerald-400 font-mono">{order.price.toLocaleString()} 金币</div>
                          <div className="text-slate-500 font-mono">
                            {formatNumber(order.filledAmount, 0)} / {formatNumber(order.amount, 0)}
                          </div>
                        </div>
                        <button
                          onClick={() => cancelOrder(order.id)}
                          className="px-2 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-[10px]"
                        >
                          撤单
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-700/50 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-rose-400">我的卖单</h3>
                  <span className="text-xs text-slate-500">{mySellOrders.length} 笔</span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {mySellOrders.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-sm">暂无卖单</div>
                  ) : (
                    mySellOrders.map(order => (
                      <div key={order.id} className="px-4 py-2 border-b border-slate-800/50 text-xs flex items-center justify-between hover:bg-slate-800/30">
                        <div>
                          <div className="text-rose-400 font-mono">{order.price.toLocaleString()} 金币</div>
                          <div className="text-slate-500 font-mono">
                            {formatNumber(order.filledAmount, 0)} / {formatNumber(order.amount, 0)}
                          </div>
                        </div>
                        <button
                          onClick={() => cancelOrder(order.id)}
                          className="px-2 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-[10px]"
                        >
                          撤单
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden" style={{ height: '320px' }}>
              <TradeHistory />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 p-4">
              <div className="flex mb-4 rounded-lg overflow-hidden border border-slate-700/50">
                <button
                  onClick={() => setOrderSide('buy')}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    orderSide === 'buy'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  买入
                </button>
                <button
                  onClick={() => setOrderSide('sell')}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    orderSide === 'sell'
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  卖出
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setOrderMode('limit')}
                  className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                    orderMode === 'limit'
                      ? 'border-slate-500 bg-slate-700 text-slate-200'
                      : 'border-slate-700 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  限价
                </button>
                <button
                  onClick={() => setOrderMode('market')}
                  className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                    orderMode === 'market'
                      ? 'border-slate-500 bg-slate-700 text-slate-200'
                      : 'border-slate-700 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  市价
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">价格 (金币)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={orderMode === 'market' ? currentPrice : orderPrice}
                      onChange={e => setOrderPrice(e.target.value)}
                      disabled={orderMode === 'market'}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-60"
                      placeholder="输入价格"
                    />
                    {orderMode === 'market' && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-amber-400">市价</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">数量 (魔力)</label>
                  <input
                    type="number"
                    value={orderAmount}
                    onChange={e => setOrderAmount(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                    placeholder="输入数量"
                  />
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[0.25, 0.5, 0.75, 1].map(pct => (
                    <button
                      key={pct}
                      onClick={() => setPercentAmount(pct)}
                      className="py-1 text-[10px] rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                    >
                      {pct * 100}%
                    </button>
                  ))}
                </div>

                <div className="text-xs space-y-1 pt-1 border-t border-slate-700/50">
                  <div className="flex justify-between text-slate-400">
                    <span>可用</span>
                    <span className="font-mono">
                      {orderSide === 'buy' ? formatGold(currentPlayer.gold) : formatEnergy(currentPlayer.manaTokens)}
                    </span>
                  </div>
                  {orderAmount && (
                    <div className="flex justify-between text-slate-300">
                      <span>预估总额</span>
                      <span className="font-mono text-amber-400">
                        {formatGold(parseInt(orderAmount || '0') * (orderMode === 'market' ? currentPrice : parseInt(orderPrice) || currentPrice))}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={!orderAmount || parseInt(orderAmount) <= 0}
                  className={`w-full py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    orderSide === 'buy'
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                      : 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25'
                  }`}
                >
                  {orderSide === 'buy' ? '确认买入' : '确认卖出'}
                </button>
              </div>
            </div>

            <div style={{ height: '420px' }}>
              <OrderBook />
            </div>

            {myTrades.length > 0 && (
              <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-700/50">
                  <h3 className="text-sm font-semibold text-slate-200">我的成交</h3>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {myTrades.map(trade => {
                    const isBuy = trade.buyerId === currentPlayer.id
                    return (
                      <div key={trade.id} className="px-4 py-1.5 border-b border-slate-800/50 text-xs flex justify-between">
                        <span className={isBuy ? 'text-emerald-400' : 'text-rose-400'}>
                          {isBuy ? '买入' : '卖出'}
                        </span>
                        <span className="text-slate-300 font-mono">{formatNumber(trade.amount, 0)}</span>
                        <span className="text-amber-400 font-mono">{trade.price.toLocaleString()}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExchangePage
