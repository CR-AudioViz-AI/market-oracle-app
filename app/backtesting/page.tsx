'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface BacktestResult {
  id: string
  symbol: string
  ai_name: string
  entry_price: number
  target_price: number
  confidence_score: number
  reasoning: string
  pick_date: string
  status: string
  outcome: string
  return_percent: number | null
}

interface AIPerformance {
  ai_name: string
  totalPicks: number
  winners: number
  losers: number
  winRate: number
  avgReturn: number
  totalReturn: number
}

export default function BacktestingPage() {
  const [results, setResults] = useState<BacktestResult[]>([])
  const [aiPerformance, setAiPerformance] = useState<AIPerformance[]>([])
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterAI, setFilterAI] = useState<string>('all')
  const [filterOutcome, setFilterOutcome] = useState<string>('all')

  useEffect(() => {
    loadBacktestData()
  }, [filterAI, filterOutcome])

  async function loadBacktestData() {
    setLoading(true)
    let query = supabase
      .from('stock_picks')
      .select('*')
      .order('pick_date', { ascending: false })

    if (filterAI !== 'all') {
      query = query.eq('ai_name', filterAI)
    }

    if (filterOutcome !== 'all') {
      query = query.eq('outcome', filterOutcome)
    }

    const { data } = await query

    if (data) {
      const typedData = data as BacktestResult[]
      
      // Calculate simulated returns for each pick
      const dataWithReturns = typedData.map(pick => {
        const simulatedReturn = pick.target_price && pick.entry_price 
          ? ((pick.target_price - pick.entry_price) / pick.entry_price) * 100 
          : 0
        return {
          ...pick,
          return_percent: pick.return_percent || simulatedReturn
        }
      })
      
      setResults(dataWithReturns)
      calculateAIPerformance(dataWithReturns)
    }
    setLoading(false)
  }

  function calculateAIPerformance(data: BacktestResult[]) {
    const aiGroups = data.reduce((acc, pick) => {
      if (!acc[pick.ai_name]) {
        acc[pick.ai_name] = []
      }
      acc[pick.ai_name].push(pick)
      return acc
    }, {} as Record<string, BacktestResult[]>)

    const performance: AIPerformance[] = Object.entries(aiGroups).map(([ai_name, picks]) => {
      const winners = picks.filter(p => (p.return_percent || 0) > 0).length
      const losers = picks.filter(p => (p.return_percent || 0) < 0).length
      const totalPicks = picks.length
      const winRate = (winners / totalPicks) * 100
      const avgReturn = picks.reduce((sum, p) => sum + (p.return_percent || 0), 0) / totalPicks
      const totalReturn = picks.reduce((sum, p) => sum + (p.return_percent || 0), 0)

      return {
        ai_name,
        totalPicks,
        winners,
        losers,
        winRate,
        avgReturn,
        totalReturn
      }
    })

    setAiPerformance(performance.sort((a, b) => b.winRate - a.winRate))
  }

  const aiNames = Array.from(new Set(results.map(r => r.ai_name)))

  const performanceChartData = aiPerformance.map(ai => ({
    name: ai.ai_name.split(' ')[0],
    winRate: ai.winRate,
    avgReturn: ai.avgReturn,
    totalPicks: ai.totalPicks
  }))

  const monthlyData = results.reduce((acc, result) => {
    const month = new Date(result.pick_date).toLocaleString('default', { month: 'short' })
    if (!acc[month]) {
      acc[month] = { month, wins: 0, losses: 0 }
    }
    if ((result.return_percent || 0) > 0) {
      acc[month].wins++
    } else {
      acc[month].losses++
    }
    return acc
  }, {} as Record<string, any>)

  const monthlyChartData = Object.values(monthlyData)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-white text-xl">Loading backtesting data...</div>
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
          <h1 className="text-4xl font-bold text-white mb-2">Backtesting & Performance</h1>
          <p className="text-gray-300">Analyze historical AI pick performance with detailed metrics</p>
        </div>

        {/* Performance Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Total Picks Analyzed</div>
            <div className="text-3xl font-bold text-white">{results.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Overall Win Rate</div>
            <div className="text-3xl font-bold text-green-400">
              {results.length > 0 
                ? ((results.filter(r => (r.return_percent || 0) > 0).length / results.length) * 100).toFixed(1)
                : 0}%
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Average Return</div>
            <div className="text-3xl font-bold text-blue-400">
              {results.length > 0
                ? (results.reduce((sum, r) => sum + (r.return_percent || 0), 0) / results.length).toFixed(2)
                : 0}%
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Best AI</div>
            <div className="text-2xl font-bold text-white">
              {aiPerformance[0]?.ai_name.split(' ')[0] || 'N/A'}
            </div>
            <div className="text-sm text-green-300">
              {aiPerformance[0]?.winRate.toFixed(1)}% wins
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* AI Performance Comparison */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">AI Win Rate Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="name" stroke="#ffffff80" />
                <YAxis stroke="#ffffff80" />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="winRate" fill="#10b981" name="Win Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Performance */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Monthly Win/Loss Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="month" stroke="#ffffff80" />
                <YAxis stroke="#ffffff80" />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="wins" fill="#10b981" name="Wins" />
                <Bar dataKey="losses" fill="#ef4444" name="Losses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Performance Breakdown */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">AI Performance Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">AI Model</th>
                  <th className="text-center py-3 px-4 text-gray-300 font-semibold">Total Picks</th>
                  <th className="text-center py-3 px-4 text-gray-300 font-semibold">Winners</th>
                  <th className="text-center py-3 px-4 text-gray-300 font-semibold">Losers</th>
                  <th className="text-center py-3 px-4 text-gray-300 font-semibold">Win Rate</th>
                  <th className="text-center py-3 px-4 text-gray-300 font-semibold">Avg Return</th>
                  <th className="text-center py-3 px-4 text-gray-300 font-semibold">Total Return</th>
                </tr>
              </thead>
              <tbody>
                {aiPerformance.map((ai) => (
                  <tr key={ai.ai_name} className="border-b border-white/10 hover:bg-white/5 transition">
                    <td className="py-4 px-4 text-white font-bold">{ai.ai_name}</td>
                    <td className="py-4 px-4 text-center text-white">{ai.totalPicks}</td>
                    <td className="py-4 px-4 text-center text-green-400">{ai.winners}</td>
                    <td className="py-4 px-4 text-center text-red-400">{ai.losers}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        ai.winRate >= 60 ? 'bg-green-500/20 text-green-300' :
                        ai.winRate >= 50 ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {ai.winRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className={`py-4 px-4 text-center font-semibold ${ai.avgReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {ai.avgReturn >= 0 ? '+' : ''}{ai.avgReturn.toFixed(2)}%
                    </td>
                    <td className={`py-4 px-4 text-center font-semibold ${ai.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {ai.totalReturn >= 0 ? '+' : ''}{ai.totalReturn.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            value={filterOutcome}
            onChange={(e) => setFilterOutcome(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">All Outcomes</option>
            <option value="pending">Pending</option>
            <option value="win">Winners</option>
            <option value="loss">Losers</option>
          </select>
        </div>

        {/* Detailed Results Table */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Detailed Pick History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Symbol</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">AI</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Entry Price</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Target Price</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Return</th>
                  <th className="text-center py-3 px-4 text-gray-300 font-semibold">Confidence</th>
                  <th className="text-center py-3 px-4 text-gray-300 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 50).map((result) => {
                  const isExpanded = expandedSymbol === result.symbol
                  const returnPercent = result.return_percent || 0

                  return (
                    <>
                      <tr
                        key={result.id}
                        className="border-b border-white/10 hover:bg-white/5 cursor-pointer transition"
                        onClick={() => setExpandedSymbol(isExpanded ? null : result.symbol)}
                      >
                        <td className="py-4 px-4 text-white font-bold">{result.symbol}</td>
                        <td className="py-4 px-4 text-gray-300">{result.ai_name}</td>
                        <td className="py-4 px-4 text-right text-white">${result.entry_price.toFixed(2)}</td>
                        <td className="py-4 px-4 text-right text-white">${result.target_price.toFixed(2)}</td>
                        <td className={`py-4 px-4 text-right font-semibold ${returnPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {returnPercent >= 0 ? '+' : ''}{returnPercent.toFixed(2)}%
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-500/20 text-blue-300">
                            {result.confidence_score}%
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center text-gray-300">
                          {new Date(result.pick_date).toLocaleDateString()}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-white/5">
                          <td colSpan={7} className="p-6">
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-lg font-bold text-white mb-2">AI Reasoning & Analysis</h4>
                                <p className="text-gray-300">{result.reasoning}</p>
                              </div>
                              <div className="grid grid-cols-4 gap-4">
                                <div>
                                  <div className="text-gray-400 text-sm">Entry Price</div>
                                  <div className="text-white font-semibold text-lg">${result.entry_price.toFixed(2)}</div>
                                </div>
                                <div>
                                  <div className="text-gray-400 text-sm">Target Price</div>
                                  <div className="text-white font-semibold text-lg">${result.target_price.toFixed(2)}</div>
                                </div>
                                <div>
                                  <div className="text-gray-400 text-sm">Expected Gain</div>
                                  <div className="text-green-400 font-semibold text-lg">
                                    {((result.target_price - result.entry_price) / result.entry_price * 100).toFixed(2)}%
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-400 text-sm">Status</div>
                                  <div className="text-white font-semibold">{result.status}</div>
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
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">💡 What This Means</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              <strong className="text-white">Backtesting:</strong> Backtesting analyzes historical AI picks to measure performance. It helps you understand which AI models perform best and identify patterns in their predictions.
            </p>
            <p>
              <strong className="text-white">Win Rate:</strong> The percentage of picks that resulted in profit. A win rate above 50% means more winning picks than losing picks. Top traders aim for 60%+ win rates.
            </p>
            <p>
              <strong className="text-white">Average Return:</strong> The average profit/loss percentage across all picks. This metric shows consistency - a high average return with high win rate indicates reliable performance.
            </p>
            <p>
              <strong className="text-white">Understanding Risk:</strong> Higher confidence scores don't always guarantee success. Look at both confidence AND historical win rate to make informed decisions.
            </p>
            <p>
              <strong className="text-white">Using This Data:</strong> Compare AI models side-by-side to see which ones align with your risk tolerance. Consider diversifying across multiple high-performing AIs rather than following just one.
            </p>
            <p>
              <strong className="text-white">Important Note:</strong> Past performance does not guarantee future results. Market conditions change, and historical data is just one factor in decision-making.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
