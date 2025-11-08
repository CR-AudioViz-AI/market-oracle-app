'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface VotingStock {
  id: string
  symbol: string
  ai_name: string
  entry_price: number
  target_price: number
  confidence_score: number
  reasoning: string
  pick_date: string
  bullish_votes: number
  bearish_votes: number
  total_votes: number
}

interface VoteResult {
  symbol: string
  bullishPercent: number
  bearishPercent: number
  totalVotes: number
  consensus: 'Bullish' | 'Bearish' | 'Neutral'
}

export default function VotingPage() {
  const [stocks, setStocks] = useState<VotingStock[]>([])
  const [voteResults, setVoteResults] = useState<VoteResult[]>([])
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userVotes, setUserVotes] = useState<Record<string, 'bull' | 'bear'>>({})

  useEffect(() => {
    loadVotingData()
  }, [])

  async function loadVotingData() {
    setLoading(true)
    const { data } = await supabase
      .from('stock_picks')
      .select('*')
      .eq('status', 'OPEN')
      .order('pick_date', { ascending: false })
      .limit(20)

    if (data) {
      // Simulate vote counts for demonstration
      const stocksWithVotes: VotingStock[] = data.map(stock => {
        const bullish = Math.floor(Math.random() * 100) + 50
        const bearish = Math.floor(Math.random() * 80) + 20
        return {
          ...stock,
          bullish_votes: bullish,
          bearish_votes: bearish,
          total_votes: bullish + bearish
        }
      })

      setStocks(stocksWithVotes)
      calculateVoteResults(stocksWithVotes)
    }
    setLoading(false)
  }

  function calculateVoteResults(data: VotingStock[]) {
    const results: VoteResult[] = data.map(stock => {
      const total = stock.bullish_votes + stock.bearish_votes
      const bullishPercent = total > 0 ? (stock.bullish_votes / total) * 100 : 50
      const bearishPercent = total > 0 ? (stock.bearish_votes / total) * 100 : 50
      
      let consensus: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral'
      if (bullishPercent > 60) consensus = 'Bullish'
      else if (bearishPercent > 60) consensus = 'Bearish'

      return {
        symbol: stock.symbol,
        bullishPercent,
        bearishPercent,
        totalVotes: total,
        consensus
      }
    })

    setVoteResults(results)
  }

  function handleVote(symbol: string, voteType: 'bull' | 'bear') {
    // Update local state
    setUserVotes(prev => ({ ...prev, [symbol]: voteType }))

    // Update stock votes
    setStocks(prev => prev.map(stock => {
      if (stock.symbol === symbol) {
        return {
          ...stock,
          bullish_votes: voteType === 'bull' ? stock.bullish_votes + 1 : stock.bullish_votes,
          bearish_votes: voteType === 'bear' ? stock.bearish_votes + 1 : stock.bearish_votes,
          total_votes: stock.total_votes + 1
        }
      }
      return stock
    }))

    // Recalculate results
    calculateVoteResults(stocks)
  }

  const consensusData = [
    { name: 'Bullish', value: voteResults.filter(r => r.consensus === 'Bullish').length, color: '#10b981' },
    { name: 'Bearish', value: voteResults.filter(r => r.consensus === 'Bearish').length, color: '#ef4444' },
    { name: 'Neutral', value: voteResults.filter(r => r.consensus === 'Neutral').length, color: '#6b7280' }
  ]

  const topVotedStocks = [...stocks]
    .sort((a, b) => b.total_votes - a.total_votes)
    .slice(0, 5)
    .map(stock => {
      const result = voteResults.find(r => r.symbol === stock.symbol)
      return {
        name: stock.symbol,
        bullish: result?.bullishPercent || 0,
        bearish: result?.bearishPercent || 0
      }
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-white text-xl">Loading voting data...</div>
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
          <h1 className="text-4xl font-bold text-white mb-2">Community Voting</h1>
          <p className="text-gray-300">Vote on AI picks and see what the community thinks</p>
        </div>

        {/* Voting Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Total Stocks</div>
            <div className="text-3xl font-bold text-white">{stocks.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Total Votes Cast</div>
            <div className="text-3xl font-bold text-white">
              {stocks.reduce((sum, s) => sum + s.total_votes, 0)}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Bullish Consensus</div>
            <div className="text-3xl font-bold text-green-400">
              {voteResults.filter(r => r.consensus === 'Bullish').length}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Bearish Consensus</div>
            <div className="text-3xl font-bold text-red-400">
              {voteResults.filter(r => r.consensus === 'Bearish').length}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Consensus Distribution */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Community Sentiment Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={consensusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {consensusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Voted Stocks */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Most Voted Stocks</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topVotedStocks}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="name" stroke="#ffffff80" />
                <YAxis stroke="#ffffff80" />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="bullish" fill="#10b981" name="Bullish %" />
                <Bar dataKey="bearish" fill="#ef4444" name="Bearish %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Voting Table */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Vote on AI Picks</h2>
          <div className="space-y-4">
            {stocks.map((stock) => {
              const result = voteResults.find(r => r.symbol === stock.symbol)
              const isExpanded = expandedSymbol === stock.symbol
              const userVote = userVotes[stock.symbol]

              return (
                <div key={stock.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  {/* Stock Header */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-white">{stock.symbol}</div>
                        <div className="text-gray-400">picked by {stock.ai_name}</div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          result?.consensus === 'Bullish' ? 'bg-green-500/20 text-green-300' :
                          result?.consensus === 'Bearish' ? 'bg-red-500/20 text-red-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {result?.consensus}
                        </span>
                      </div>
                      <button
                        onClick={() => setExpandedSymbol(isExpanded ? null : stock.symbol)}
                        className="text-blue-400 hover:text-blue-300 transition"
                      >
                        {isExpanded ? '▼ Hide Details' : '▶ Show Details'}
                      </button>
                    </div>

                    {/* Price Info */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div>
                        <div className="text-gray-400 text-sm">Entry Price</div>
                        <div className="text-white font-bold text-xl">${stock.entry_price.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Current Price</div>
                        <div className="text-white font-bold text-xl">${(stock.entry_price * 1.03).toFixed(2)}</div>
                        <div className="text-green-400 text-sm">+3.0%</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Target Price</div>
                        <div className="text-white font-bold text-xl">${stock.target_price.toFixed(2)}</div>
                        <div className="text-blue-400 text-sm">
                          +{((stock.target_price - stock.entry_price) / stock.entry_price * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Voting Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-green-400">🐂 Bullish {result?.bullishPercent.toFixed(0)}%</span>
                        <span className="text-gray-400">{result?.totalVotes} votes</span>
                        <span className="text-red-400">Bearish {result?.bearishPercent.toFixed(0)}% 🐻</span>
                      </div>
                      <div className="h-4 bg-gray-700 rounded-full overflow-hidden flex">
                        <div
                          className="bg-green-500"
                          style={{ width: `${result?.bullishPercent}%` }}
                        />
                        <div
                          className="bg-red-500"
                          style={{ width: `${result?.bearishPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Vote Buttons */}
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleVote(stock.symbol, 'bull')}
                        disabled={!!userVote}
                        className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
                          userVote === 'bull'
                            ? 'bg-green-500 text-white'
                            : userVote
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                        }`}
                      >
                        {userVote === 'bull' ? '✓ Voted Bullish' : '🐂 Vote Bullish'}
                      </button>
                      <button
                        onClick={() => handleVote(stock.symbol, 'bear')}
                        disabled={!!userVote}
                        className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
                          userVote === 'bear'
                            ? 'bg-red-500 text-white'
                            : userVote
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                        }`}
                      >
                        {userVote === 'bear' ? '✓ Voted Bearish' : '🐻 Vote Bearish'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="p-6 bg-white/5 border-t border-white/10">
                      <h4 className="text-lg font-bold text-white mb-3">AI Reasoning</h4>
                      <p className="text-gray-300 mb-4">{stock.reasoning}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-gray-400 text-sm">AI Confidence</div>
                          <div className="text-white font-semibold">{stock.confidence_score}%</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">Pick Date</div>
                          <div className="text-white font-semibold">
                            {new Date(stock.pick_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* What This Means Section */}
        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">💡 What This Means</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              <strong className="text-white">Community Voting:</strong> This feature lets you see what other traders think about AI picks. Wisdom of the crowd can provide valuable perspective beyond AI analysis.
            </p>
            <p>
              <strong className="text-white">Bullish vs Bearish:</strong> A bullish vote means you believe the stock will go up. A bearish vote means you think it will go down. The percentage shows community consensus.
            </p>
            <p>
              <strong className="text-white">Understanding Consensus:</strong> When 60%+ vote one way, it's considered consensus. Strong consensus (75%+) often indicates high conviction about direction.
            </p>
            <p>
              <strong className="text-white">Contrarian Opportunity:</strong> When community and AI disagree, it might signal opportunity. Sometimes the crowd is wrong - that's when smart traders profit.
            </p>
            <p>
              <strong className="text-white">Vote Responsibly:</strong> Your vote should be based on your own analysis and research. Don't just follow the crowd - think independently and vote what you truly believe.
            </p>
            <p>
              <strong className="text-white">Important:</strong> Voting results reflect community opinion, not financial advice. Always do your own research before making investment decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
