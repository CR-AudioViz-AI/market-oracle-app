'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface StockPick {
  id: string
  ticker: string
  ai_name: string
  price: number
  current_price: number
  target_price: number
  confidence_score: number
  reasoning: string
  picked_at: string
}

export default function Dashboard() {
  const [picks, setPicks] = useState<StockPick[]>([])
  const [filteredPicks, setFilteredPicks] = useState<StockPick[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAI, setSelectedAI] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [showAll, setShowAll] = useState(false)
  const [expandedPick, setExpandedPick] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadPicks()
    const interval = setInterval(loadPicks, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    filterPicks()
  }, [picks, selectedAI, selectedStatus, searchTerm])

  async function loadPicks() {
    const { data, error } = await supabase
      .from('ai_stock_picks')
      .select('*')
      .order('picked_at', { ascending: false })

    if (data) {
      setPicks(data)
    }
    setLoading(false)
  }

  function filterPicks() {
    let filtered = [...picks]

    if (selectedAI !== 'All') {
      filtered = filtered.filter(p => p.ai_name === selectedAI)
    }

    if (selectedStatus === 'Winning') {
      filtered = filtered.filter(p => p.current_price > p.price)
    } else if (selectedStatus === 'Losing') {
      filtered = filtered.filter(p => p.current_price < p.price)
    }

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.ticker.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredPicks(filtered)
  }

  function calculatePerformance(pick: StockPick) {
    return ((pick.current_price - pick.price) / pick.price * 100).toFixed(2)
  }

  function calculateTargetDistance(pick: StockPick) {
    return ((pick.target_price - pick.current_price) / pick.current_price * 100).toFixed(2)
  }

  const aiList = ['All', ...Array.from(new Set(picks.map(p => p.ai_name)))]
  const winningPicks = picks.filter(p => p.current_price > p.price).length
  const losingPicks = picks.filter(p => p.current_price < p.price).length
  const avgConfidence = picks.length > 0 
    ? (picks.reduce((sum, p) => sum + p.confidence_score, 0) / picks.length).toFixed(1)
    : 0
  const winRate = picks.length > 0 ? (winningPicks / picks.length * 100).toFixed(1) : 0

  const displayPicks = showAll ? filteredPicks : filteredPicks.slice(0, 20)

  // AI Leaderboard
  const aiStats = aiList.filter(ai => ai !== 'All').map(aiName => {
    const aiPicks = picks.filter(p => p.ai_name === aiName)
    const wins = aiPicks.filter(p => p.current_price > p.price).length
    const totalPicks = aiPicks.length
    const winRate = totalPicks > 0 ? (wins / totalPicks * 100) : 0
    const avgConf = totalPicks > 0 
      ? aiPicks.reduce((sum, p) => sum + p.confidence_score, 0) / totalPicks 
      : 0
    return { aiName, totalPicks, wins, winRate, avgConf }
  }).sort((a, b) => b.winRate - a.winRate)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading Market Oracle...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
            🔮 Market Oracle
          </h1>
          <p className="text-xl text-gray-300">AI Battle: 5 Models Compete to Pick Winning Stocks</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-6 rounded-lg border border-blue-500/30">
            <div className="text-3xl font-bold">{picks.length}</div>
            <div className="text-gray-300">Total Picks</div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 p-6 rounded-lg border border-green-500/30">
            <div className="text-3xl font-bold text-green-400">{winningPicks}</div>
            <div className="text-gray-300">Winning ({winRate}%)</div>
          </div>
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 p-6 rounded-lg border border-red-500/30">
            <div className="text-3xl font-bold text-red-400">{losingPicks}</div>
            <div className="text-gray-300">Losing</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-6 rounded-lg border border-purple-500/30">
            <div className="text-3xl font-bold text-purple-400">{avgConfidence}%</div>
            <div className="text-gray-300">Avg Confidence</div>
          </div>
        </div>

        {/* AI Leaderboard */}
        <div className="bg-white/5 rounded-lg p-6 mb-8 border border-white/10">
          <h2 className="text-2xl font-bold mb-4">🏆 AI Leaderboard</h2>
          <div className="grid gap-3">
            {aiStats.map((ai, idx) => (
              <div key={ai.aiName} className="bg-white/5 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''}
                  </span>
                  <div>
                    <div className="font-bold">{ai.aiName}</div>
                    <div className="text-sm text-gray-400">{ai.totalPicks} picks</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-400">{ai.winRate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-400">Win Rate</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/5 rounded-lg p-6 mb-8 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm mb-2">Filter by AI</label>
              <select 
                value={selectedAI}
                onChange={(e) => setSelectedAI(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg p-2"
              >
                {aiList.map(ai => (
                  <option key={ai} value={ai}>{ai}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2">Filter by Status</label>
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg p-2"
              >
                <option value="All">All</option>
                <option value="Winning">Winning</option>
                <option value="Losing">Losing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2">Search Ticker</label>
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="e.g. AAPL"
                className="w-full bg-white/10 border border-white/20 rounded-lg p-2"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg"
              >
                {showAll ? 'Show Less' : `Show All ${filteredPicks.length}`}
              </button>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            Showing {displayPicks.length} of {filteredPicks.length} picks
          </div>
        </div>

        {/* Stock Picks Table */}
        <div className="bg-white/5 rounded-lg p-6 mb-8 border border-white/10">
          <h2 className="text-2xl font-bold mb-4">📊 All AI Stock Picks</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left p-3">Ticker</th>
                  <th className="text-left p-3">AI</th>
                  <th className="text-right p-3">Entry</th>
                  <th className="text-right p-3">Current</th>
                  <th className="text-right p-3">Target</th>
                  <th className="text-right p-3">Performance</th>
                  <th className="text-right p-3">Confidence</th>
                  <th className="text-center p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayPicks.map(pick => {
                  const perf = parseFloat(calculatePerformance(pick))
                  const isExpanded = expandedPick === pick.id
                  
                  return (
                    <tr key={pick.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="p-3">
                        <div className="font-bold text-lg">{pick.ticker}</div>
                      </td>
                      <td className="p-3">
                        <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-sm">
                          {pick.ai_name}
                        </span>
                      </td>
                      <td className="text-right p-3 font-mono">${pick.price.toFixed(2)}</td>
                      <td className="text-right p-3 font-mono">${pick.current_price.toFixed(2)}</td>
                      <td className="text-right p-3 font-mono">${pick.target_price.toFixed(2)}</td>
                      <td className={`text-right p-3 font-bold ${perf >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {perf >= 0 ? '+' : ''}{perf}%
                      </td>
                      <td className="text-right p-3">{pick.confidence_score}%</td>
                      <td className="text-center p-3">
                        <button
                          onClick={() => setExpandedPick(isExpanded ? null : pick.id)}
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          {isExpanded ? '▲ Hide' : '▼ Details'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${pick.id}-details`} className="bg-white/10">
                        <td colSpan={8} className="p-6">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-bold text-lg mb-3">📋 AI Reasoning</h4>
                              <p className="text-gray-300 leading-relaxed">{pick.reasoning}</p>
                            </div>
                            <div>
                              <h4 className="font-bold text-lg mb-3">📊 Pick Details</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Entry Price:</span>
                                  <span className="font-mono">${pick.price.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Current Price:</span>
                                  <span className="font-mono">${pick.current_price.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Target Price:</span>
                                  <span className="font-mono">${pick.target_price.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Distance to Target:</span>
                                  <span className="font-mono">{calculateTargetDistance(pick)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Confidence:</span>
                                  <span>{pick.confidence_score}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Picked:</span>
                                  <span>{new Date(pick.picked_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tr>
                )
              })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white/5 rounded-lg p-6 mb-8 border border-white/10">
          <h2 className="text-2xl font-bold mb-4">📈 Performance Overview</h2>
          <div className="h-64 flex items-end justify-around gap-4">
            {aiStats.map(ai => (
              <div key={ai.aiName} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t-lg transition-all"
                  style={{ height: `${ai.winRate}%` }}
                />
                <div className="text-xs mt-2 text-center">
                  <div className="font-bold">{ai.aiName}</div>
                  <div className="text-gray-400">{ai.winRate.toFixed(0)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What This Means */}
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-6 border border-purple-500/30">
          <h2 className="text-2xl font-bold mb-4">💡 What This Means</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              <strong className="text-white">Market Oracle</strong> is an AI battle platform where 5 different AI models compete to pick winning stocks. 
              Each AI analyzes the market independently and picks stocks they believe will increase in value.
            </p>
            <p>
              <strong className="text-white">Performance</strong> shows how well each stock is doing. Green means the current price is higher than when the AI picked it (winning). 
              Red means it's lower (losing). The percentage tells you exactly how much it's gained or lost.
            </p>
            <p>
              <strong className="text-white">Entry/Current/Target</strong> are three key prices: Entry is what the stock cost when picked, Current is what it costs now, 
              and Target is where the AI thinks it will go. If Current reaches Target, that's a successful prediction!
            </p>
            <p>
              <strong className="text-white">Confidence Score</strong> (0-100%) shows how sure the AI is about this pick. Higher confidence means the AI strongly believes in this stock.
            </p>
            <p>
              Click <strong className="text-white">"▼ Details"</strong> on any pick to see the full AI reasoning - why that AI chose this specific stock. 
              This helps you learn how AI thinks about stock picking.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
