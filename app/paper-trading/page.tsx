'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface PaperTrade {
  id: string
  symbol: string
  action: 'BUY' | 'SELL'
  shares: number
  entry_price: number
  current_price: number
  timestamp: string
  pnl: number
  pnl_percent: number
}

interface PortfolioMetrics {
  totalValue: number
  cashBalance: number
  investedValue: number
  totalPnL: number
  totalPnLPercent: number
  dayChange: number
  dayChangePercent: number
}

export default function PaperTradingPage() {
  const [trades, setTrades] = useState<PaperTrade[]>([])
  const [metrics, setMetrics] = useState<PortfolioMetrics>({
    totalValue: 100000,
    cashBalance: 75000,
    investedValue: 25000,
    totalPnL: 2500,
    totalPnLPercent: 2.5,
    dayChange: 450,
    dayChangePercent: 0.45
  })
  const [selectedStock, setSelectedStock] = useState('')
  const [shares, setShares] = useState(1)
  const [loading, setLoading] = useState(false)
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null)

  const [availableStocks, setAvailableStocks] = useState<string[]>([])

  useEffect(() => {
    loadPaperTrades()
    loadAvailableStocks()
  }, [])

  async function loadAvailableStocks() {
    const { data } = await supabase
      .from('stock_picks')
      .select('symbol')
      .eq('status', 'OPEN')
      .limit(20)

    if (data) {
      const symbols = Array.from(new Set(data.map(d => d.symbol)))
      setAvailableStocks(symbols)
    }
  }

  async function loadPaperTrades() {
    // Simulated paper trades for demo
    const demoTrades: PaperTrade[] = [
      {
        id: '1',
        symbol: 'NVDA',
        action: 'BUY',
        shares: 10,
        entry_price: 450.25,
        current_price: 465.80,
        timestamp: '2025-11-06T10:30:00',
        pnl: 155.50,
        pnl_percent: 3.45
      },
      {
        id: '2',
        symbol: 'TSLA',
        action: 'BUY',
        shares: 15,
        entry_price: 235.60,
        current_price: 241.30,
        timestamp: '2025-11-05T14:20:00',
        pnl: 85.50,
        pnl_percent: 2.42
      },
      {
        id: '3',
        symbol: 'AMD',
        action: 'BUY',
        shares: 20,
        entry_price: 185.40,
        current_price: 179.20,
        timestamp: '2025-11-04T09:15:00',
        pnl: -124.00,
        pnl_percent: -3.34
      }
    ]

    setTrades(demoTrades)
  }

  async function executeTrade(action: 'BUY' | 'SELL') {
    if (!selectedStock || shares <= 0) return

    setLoading(true)

    // Get current price from Supabase
    const { data } = await supabase
      .from('stock_picks')
      .select('entry_price')
      .eq('symbol', selectedStock)
      .single()

    const price = data?.entry_price || 100

    const newTrade: PaperTrade = {
      id: Date.now().toString(),
      symbol: selectedStock,
      action,
      shares,
      entry_price: price,
      current_price: price,
      timestamp: new Date().toISOString(),
      pnl: 0,
      pnl_percent: 0
    }

    setTrades(prev => [newTrade, ...prev])
    setSelectedStock('')
    setShares(1)
    setLoading(false)
  }

  function closeTrade(tradeId: string) {
    setTrades(prev => prev.filter(t => t.id !== tradeId))
  }

  const portfolioHistory = [
    { date: 'Nov 1', value: 100000 },
    { date: 'Nov 2', value: 100500 },
    { date: 'Nov 3', value: 99800 },
    { date: 'Nov 4', value: 101200 },
    { date: 'Nov 5', value: 101800 },
    { date: 'Nov 6', value: 102500 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Paper Trading</h1>
          <p className="text-gray-300">Practice trading with virtual money - zero risk, real learning</p>
        </div>

        {/* Portfolio Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Total Value</div>
            <div className="text-3xl font-bold text-white">${metrics.totalValue.toLocaleString()}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Cash Balance</div>
            <div className="text-3xl font-bold text-white">${metrics.cashBalance.toLocaleString()}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Invested</div>
            <div className="text-3xl font-bold text-white">${metrics.investedValue.toLocaleString()}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Total P&L</div>
            <div className={`text-3xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {metrics.totalPnL >= 0 ? '+' : ''}${metrics.totalPnL.toLocaleString()}
            </div>
            <div className={`text-sm ${metrics.totalPnLPercent >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {metrics.totalPnLPercent >= 0 ? '+' : ''}{metrics.totalPnLPercent}%
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Today's Change</div>
            <div className={`text-3xl font-bold ${metrics.dayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {metrics.dayChange >= 0 ? '+' : ''}${metrics.dayChange}
            </div>
            <div className={`text-sm ${metrics.dayChangePercent >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {metrics.dayChangePercent >= 0 ? '+' : ''}{metrics.dayChangePercent}%
            </div>
          </div>
        </div>

        {/* Portfolio Chart */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Portfolio Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={portfolioHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="date" stroke="#ffffff80" />
              <YAxis stroke="#ffffff80" />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Trading Interface */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Execute Trade</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
            >
              <option value="">Select Stock</option>
              {availableStocks.map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(parseInt(e.target.value) || 1)}
              min="1"
              placeholder="Shares"
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
            />
            <button
              onClick={() => executeTrade('BUY')}
              disabled={loading || !selectedStock}
              className="bg-green-500/20 text-green-300 hover:bg-green-500/30 disabled:bg-gray-500/20 disabled:text-gray-500 rounded-lg px-6 py-3 font-semibold transition"
            >
              {loading ? 'Processing...' : 'BUY'}
            </button>
            <button
              onClick={() => executeTrade('SELL')}
              disabled={loading || !selectedStock}
              className="bg-red-500/20 text-red-300 hover:bg-red-500/30 disabled:bg-gray-500/20 disabled:text-gray-500 rounded-lg px-6 py-3 font-semibold transition"
            >
              {loading ? 'Processing...' : 'SELL'}
            </button>
          </div>
        </div>

        {/* Active Trades */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Active Positions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Symbol</th>
                  <th className="text-center py-3 px-4 text-gray-300 font-semibold">Action</th>
                  <th className="text-center py-3 px-4 text-gray-300 font-semibold">Shares</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Entry Price</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Current Price</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">P&L</th>
                  <th className="text-center py-3 px-4 text-gray-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => {
                  const isExpanded = expandedTrade === trade.id
                  return (
                    <>
                      <tr
                        key={trade.id}
                        className="border-b border-white/10 hover:bg-white/5 cursor-pointer transition"
                        onClick={() => setExpandedTrade(isExpanded ? null : trade.id)}
                      >
                        <td className="py-4 px-4 text-white font-bold">{trade.symbol}</td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            trade.action === 'BUY' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                          }`}>
                            {trade.action}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center text-white">{trade.shares}</td>
                        <td className="py-4 px-4 text-right text-white">${trade.entry_price.toFixed(2)}</td>
                        <td className="py-4 px-4 text-right text-white">${trade.current_price.toFixed(2)}</td>
                        <td className={`py-4 px-4 text-right font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                          <div className="text-sm">({trade.pnl_percent >= 0 ? '+' : ''}{trade.pnl_percent.toFixed(2)}%)</div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              closeTrade(trade.id)
                            }}
                            className="px-4 py-1 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition text-sm"
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-white/5">
                          <td colSpan={7} className="p-6">
                            <div className="grid grid-cols-4 gap-4">
                              <div>
                                <div className="text-gray-400 text-sm">Trade Time</div>
                                <div className="text-white font-semibold">
                                  {new Date(trade.timestamp).toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-sm">Total Cost</div>
                                <div className="text-white font-semibold">
                                  ${(trade.entry_price * trade.shares).toFixed(2)}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-sm">Current Value</div>
                                <div className="text-white font-semibold">
                                  ${(trade.current_price * trade.shares).toFixed(2)}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-sm">Return %</div>
                                <div className={`font-semibold ${trade.pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {trade.pnl_percent >= 0 ? '+' : ''}{trade.pnl_percent.toFixed(2)}%
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* What This Means Section */}
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">💡 What This Means</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              <strong className="text-white">Paper Trading:</strong> Practice trading with $100,000 virtual money. Test strategies, learn market mechanics, and build confidence - all without risking real capital.
            </p>
            <p>
              <strong className="text-white">Understanding P&L:</strong> Profit & Loss shows how your trades perform. Green means profit, red means loss. Track P&L both in dollars and percentage to understand relative performance.
            </p>
            <p>
              <strong className="text-white">Portfolio Metrics:</strong> Total Value = Cash + Invested positions. Watch how your decisions impact overall portfolio performance over time.
            </p>
            <p>
              <strong className="text-white">Buy vs Sell:</strong> BUY means you expect price to go up (go long). SELL means you expect price to go down (go short). Both can be profitable with correct predictions.
            </p>
            <p>
              <strong className="text-white">Trading Strategy:</strong> Start small, diversify across multiple stocks, use stop-losses to limit downside, and take profits when targets are hit. Learn discipline here before using real money.
            </p>
            <p>
              <strong className="text-white">Key Lesson:</strong> Successful trading requires patience, discipline, and risk management. Paper trading lets you fail safely and learn from mistakes without financial consequences.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
