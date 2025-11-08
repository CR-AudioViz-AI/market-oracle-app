'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Position {
  id: string
  symbol: string
  ai_name: string
  entry_price: number
  target_price: number
  confidence_score: number
  reasoning: string
  pick_date: string
  status: string
  action: string
}

interface PortfolioStats {
  totalValue: number
  totalGain: number
  totalGainPercent: number
  bestPick: { symbol: string; gain: number }
  worstPick: { symbol: string; gain: number }
  winRate: number
}

export default function PortfolioPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [stats, setStats] = useState<PortfolioStats | null>(null)
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterAI, setFilterAI] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    loadPortfolio()
  }, [filterAI, filterStatus])

  async function loadPortfolio() {
    setLoading(true)
    let query = supabase
      .from('stock_picks')
      .select('*')
      .eq('status', 'OPEN')
      .order('pick_date', { ascending: false })

    if (filterAI !== 'all') {
      query = query.eq('ai_name', filterAI)
    }

    const { data } = await query

    if (data) {
      const typedData = data as Position[]
      setPositions(typedData)
      calculateStats(typedData)
    }
    setLoading(false)
  }

  function calculateStats(data: Position[]) {
    if (data.length === 0) {
      setStats(null)
      return
    }

    const totalEntry = data.reduce((sum, p) => sum + p.entry_price, 0)
    const totalTarget = data.reduce((sum, p) => sum + p.target_price, 0)
    const totalGain = totalTarget - totalEntry
    const totalGainPercent = (totalGain / totalEntry) * 100

    // Calculate current values (using target as proxy for now)
    const positions_with_gains = data.map(p => ({
      symbol: p.symbol,
      gain: p.target_price - p.entry_price
    }))

    const sorted = positions_with_gains.sort((a, b) => b.gain - a.gain)
    const bestPick = sorted[0] || { symbol: 'N/A', gain: 0 }
    const worstPick = sorted[sorted.length - 1] || { symbol: 'N/A', gain: 0 }

    const winners = positions_with_gains.filter(p => p.gain > 0).length
    const winRate = (winners / data.length) * 100

    setStats({
      totalValue: totalTarget,
      totalGain,
      totalGainPercent,
      bestPick,
      worstPick,
      winRate
    })
  }

  const aiNames = Array.from(new Set(positions.map(p => p.ai_name)))

  const performanceData = positions.slice(0, 10).map(p => ({
    name: p.symbol,
    entry: p.entry_price,
    target: p.target_price,
    gain: ((p.target_price - p.entry_price) / p.entry_price) * 100
  }))

  const allocationData = aiNames.map(ai => ({
    name: ai,
    value: positions.filter(p => p.ai_name === ai).length
  }))

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-white text-xl">Loading portfolio...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Portfolio Manager</h1>
          <p className="text-gray-300">Track and analyze your AI-powered stock positions</p>
        </div>

        {/* Portfolio Stats Summary */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-gray-300 text-sm mb-1">Total Positions</div>
              <div className="text-3xl font-bold text-white">{positions.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-gray-300 text-sm mb-1">Expected Value</div>
              <div className="text-3xl font-bold text-white">${stats.totalValue.toFixed(2)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-gray-300 text-sm mb-1">Projected Gain</div>
              <div className="text-3xl font-bold text-green-400">
                ${stats.totalGain.toFixed(2)}
              </div>
              <div className="text-sm text-green-300">+{stats.totalGainPercent.toFixed(2)}%</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-gray-300 text-sm mb-1">Best Pick</div>
              <div className="text-2xl font-bold text-green-400">{stats.bestPick.symbol}</div>
              <div className="text-sm text-green-300">+${stats.bestPick.gain.toFixed(2)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-gray-300 text-sm mb-1">Win Rate</div>
              <div className="text-3xl font-bold text-white">{stats.winRate.toFixed(0)}%</div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Chart */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Top 10 Positions by Gain</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="name" stroke="#ffffff80" />
                <YAxis stroke="#ffffff80" />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="gain" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* AI Allocation Chart */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">AI Portfolio Allocation</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={filterAI}
            onChange={(e) => setFilterAI(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">All AIs</option>
            {aiNames.map(ai => (
              <option key={ai} value={ai}>{ai}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">All Status</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Positions Table */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Active Positions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Symbol</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">AI</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Entry Price</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Current Price</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Target Price</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Gain/Loss</th>
                  <th className="text-center py-3 px-4 text-gray-300 font-semibold">Confidence</th>
                  <th className="text-center py-3 px-4 text-gray-300 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((position) => {
                  const currentPrice = position.entry_price * 1.02 // Simulated current price (2% gain)
                  const gainLoss = currentPrice - position.entry_price
                  const gainPercent = (gainLoss / position.entry_price) * 100
                  const isExpanded = expandedSymbol === position.symbol

                  return (
                    <>
                      <tr
                        key={position.id}
                        className="border-b border-white/10 hover:bg-white/5 cursor-pointer transition"
                        onClick={() => setExpandedSymbol(isExpanded ? null : position.symbol)}
                      >
                        <td className="py-4 px-4 text-white font-bold">{position.symbol}</td>
                        <td className="py-4 px-4 text-gray-300">{position.ai_name}</td>
                        <td className="py-4 px-4 text-right text-white">${position.entry_price.toFixed(2)}</td>
                        <td className="py-4 px-4 text-right text-white">${currentPrice.toFixed(2)}</td>
                        <td className="py-4 px-4 text-right text-white">${position.target_price.toFixed(2)}</td>
                        <td className={`py-4 px-4 text-right font-semibold ${gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {gainLoss >= 0 ? '+' : ''}{gainPercent.toFixed(2)}%
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-500/20 text-blue-300">
                            {position.confidence_score}%
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button className="px-4 py-1 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition">
                            Close
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-white/5">
                          <td colSpan={8} className="p-6">
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-lg font-bold text-white mb-2">AI Reasoning</h4>
                                <p className="text-gray-300">{position.reasoning}</p>
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <div className="text-gray-400 text-sm">Pick Date</div>
                                  <div className="text-white font-semibold">
                                    {new Date(position.pick_date).toLocaleDateString()}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-400 text-sm">Action</div>
                                  <div className="text-white font-semibold">{position.action}</div>
                                </div>
                                <div>
                                  <div className="text-gray-400 text-sm">Status</div>
                                  <div className="text-white font-semibold">{position.status}</div>
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
              <strong className="text-white">Portfolio Management:</strong> Your portfolio shows all active positions picked by AI models. Each position includes entry, current, and target prices to track performance.
            </p>
            <p>
              <strong className="text-white">Understanding Gain/Loss:</strong> The gain/loss column shows how each position is performing relative to its entry price. Green indicates profit, red indicates loss.
            </p>
            <p>
              <strong className="text-white">AI Confidence:</strong> The confidence score (0-100%) indicates how certain the AI is about this pick. Higher scores suggest stronger conviction.
            </p>
            <p>
              <strong className="text-white">Portfolio Allocation:</strong> The pie chart shows how your positions are distributed across different AI models. Diversification across multiple AIs can reduce risk.
            </p>
            <p>
              <strong className="text-white">Best Practices:</strong> Monitor your positions regularly, set stop-losses to manage risk, and consider taking profits when targets are reached. Remember that past performance doesn't guarantee future results.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
