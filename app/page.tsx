'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface StockPick {
  id: string
  ai_name: string
  symbol: string
  entry_price: number
  target_price: number
  confidence_score: number
  reasoning: string
  status: string
  pick_date: string
  current_price?: number
  actual_gain?: number
}

interface AIStats {
  ai_name: string
  total_picks: number
  avg_confidence: number
  win_rate: number
  total_gain: number
}

export default function MarketOracle() {
  const [picks, setPicks] = useState<StockPick[]>([])
  const [filteredPicks, setFilteredPicks] = useState<StockPick[]>([])
  const [aiStats, setAiStats] = useState<AIStats[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [selectedAI, setSelectedAI] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [minConfidence, setMinConfidence] = useState<number>(0)
  
  // Stats
  const [totalPicks, setTotalPicks] = useState(0)
  const [activeAIs, setActiveAIs] = useState(0)
  const [avgConfidence, setAvgConfidence] = useState(0)
  const [totalValue, setTotalValue] = useState(0)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [picks, selectedAI, selectedStatus, sortBy, searchTerm, minConfidence])

  async function fetchData() {
    try {
      const { data: picksData, error: picksError } = await supabase
        .from('stock_picks')
        .select('*')
        .order('created_at', { ascending: false })

      if (picksError) throw picksError

      if (picksData) {
        setPicks(picksData)
        setTotalPicks(picksData.length)

        // Calculate AI stats
        const aiMap = new Map<string, { 
          total: number
          totalConfidence: number
          wins: number
          totalGain: number
        }>()
        
        picksData.forEach(pick => {
          const current = aiMap.get(pick.ai_name) || { 
            total: 0, 
            totalConfidence: 0,
            wins: 0,
            totalGain: 0
          }
          
          const gain = ((pick.target_price - pick.entry_price) / pick.entry_price) * 100
          
          aiMap.set(pick.ai_name, {
            total: current.total + 1,
            totalConfidence: current.totalConfidence + (pick.confidence_score || 0),
            wins: current.wins + (pick.status === 'WON' ? 1 : 0),
            totalGain: current.totalGain + gain
          })
        })

        const stats: AIStats[] = []
        aiMap.forEach((value, key) => {
          stats.push({
            ai_name: key,
            total_picks: value.total,
            avg_confidence: Math.round(value.totalConfidence / value.total),
            win_rate: Math.round((value.wins / value.total) * 100),
            total_gain: Math.round(value.totalGain * 100) / 100
          })
        })

        stats.sort((a, b) => b.total_gain - a.total_gain)
        setAiStats(stats)
        setActiveAIs(stats.length)

        const totalConfidence = picksData.reduce((sum, pick) => sum + (pick.confidence_score || 0), 0)
        setAvgConfidence(Math.round(totalConfidence / picksData.length))
        
        const totalGain = picksData.reduce((sum, pick) => {
          return sum + ((pick.target_price - pick.entry_price) / pick.entry_price) * 100
        }, 0)
        setTotalValue(Math.round(totalGain * 100) / 100)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let filtered = [...picks]

    // Filter by AI
    if (selectedAI !== 'all') {
      filtered = filtered.filter(pick => pick.ai_name === selectedAI)
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(pick => pick.status === selectedStatus)
    }

    // Filter by confidence
    filtered = filtered.filter(pick => pick.confidence_score >= minConfidence)

    // Search
    if (searchTerm) {
      filtered = filtered.filter(pick => 
        pick.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pick.reasoning.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort
    switch (sortBy) {
      case 'confidence':
        filtered.sort((a, b) => b.confidence_score - a.confidence_score)
        break
      case 'gain':
        filtered.sort((a, b) => {
          const gainA = ((a.target_price - a.entry_price) / a.entry_price) * 100
          const gainB = ((b.target_price - b.entry_price) / b.entry_price) * 100
          return gainB - gainA
        })
        break
      case 'price':
        filtered.sort((a, b) => a.entry_price - b.entry_price)
        break
      default: // date
        filtered.sort((a, b) => new Date(b.pick_date).getTime() - new Date(a.pick_date).getTime())
    }

    setFilteredPicks(filtered)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-2xl text-purple-400 mb-4">Loading Market Oracle...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
          Market Oracle AI Battle
        </h1>
        <p className="text-xl text-gray-300 mb-2">
          5 AIs Compete to Pick the Best Penny Stocks
        </p>
        <p className="text-sm text-gray-500">
          Real AI-generated picks • Updated in real-time • Educational purposes only
        </p>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
          <div className="text-gray-400 text-sm mb-1">Total Picks</div>
          <div className="text-4xl font-bold text-white">{totalPicks}</div>
          <div className="text-xs text-green-400 mt-1">↑ Live</div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
          <div className="text-gray-400 text-sm mb-1">Active AIs</div>
          <div className="text-4xl font-bold text-white">{activeAIs}</div>
          <div className="text-xs text-blue-400 mt-1">Competing</div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
          <div className="text-gray-400 text-sm mb-1">Avg Confidence</div>
          <div className="text-4xl font-bold text-white">{avgConfidence}%</div>
          <div className="text-xs text-purple-400 mt-1">AI Certainty</div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
          <div className="text-gray-400 text-sm mb-1">Expected Gain</div>
          <div className="text-4xl font-bold text-green-400">+{totalValue}%</div>
          <div className="text-xs text-gray-400 mt-1">Portfolio</div>
        </div>
      </div>

      {/* AI Leaderboard */}
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-8 border border-purple-500/20 mb-8">
        <h2 className="text-3xl font-bold mb-6 flex items-center">
          <span className="mr-3">🏆</span> AI Leaderboard
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {aiStats.map((ai, index) => (
            <div
              key={ai.ai_name}
              className={`bg-slate-900/50 rounded-lg p-6 border transition-all cursor-pointer hover:scale-105 ${
                index === 0 ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/20' :
                index === 1 ? 'border-gray-400/50' :
                index === 2 ? 'border-orange-600/50' :
                'border-purple-500/30'
              }`}
              onClick={() => setSelectedAI(ai.ai_name)}
            >
              <div className="text-center">
                <div className={`text-2xl font-bold mb-2 ${
                  index === 0 ? 'text-yellow-400' :
                  index === 1 ? 'text-gray-300' :
                  index === 2 ? 'text-orange-500' :
                  'text-gray-400'
                }`}>
                  #{index + 1}
                </div>
                <div className="text-xl font-bold text-white mb-3">{ai.ai_name}</div>
                
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-purple-400">{ai.total_picks}</div>
                  <div className="text-xs text-gray-400">picks</div>
                  
                  <div className="pt-3 border-t border-gray-700">
                    <div className="text-sm text-gray-400">Total Gain</div>
                    <div className={`text-lg font-bold ${ai.total_gain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {ai.total_gain >= 0 ? '+' : ''}{ai.total_gain}%
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-700">
                    <div className="text-sm text-gray-400">Confidence</div>
                    <div className="text-lg font-bold text-blue-400">{ai.avg_confidence}%</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* AI Filter */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Filter by AI</label>
            <select
              value={selectedAI}
              onChange={(e) => setSelectedAI(e.target.value)}
              className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">All AIs</option>
              {aiStats.map(ai => (
                <option key={ai.ai_name} value={ai.ai_name}>{ai.ai_name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">All Status</option>
              <option value="OPEN">Open</option>
              <option value="WON">Won</option>
              <option value="LOST">Lost</option>
              <option value="ACTIVE">Active</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-400"
            >
              <option value="date">Latest First</option>
              <option value="confidence">Highest Confidence</option>
              <option value="gain">Best Expected Gain</option>
              <option value="price">Lowest Price</option>
            </select>
          </div>

          {/* Confidence Filter */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Min Confidence: {minConfidence}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Search */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Search</label>
            <input
              type="text"
              placeholder="Symbol or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>

        {/* Active Filters Display */}
        <div className="mt-4 flex flex-wrap gap-2">
          {selectedAI !== 'all' && (
            <button
              onClick={() => setSelectedAI('all')}
              className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm flex items-center gap-2 hover:bg-purple-500/30"
            >
              {selectedAI} <span>×</span>
            </button>
          )}
          {selectedStatus !== 'all' && (
            <button
              onClick={() => setSelectedStatus('all')}
              className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm flex items-center gap-2 hover:bg-blue-500/30"
            >
              {selectedStatus} <span>×</span>
            </button>
          )}
          {minConfidence > 0 && (
            <button
              onClick={() => setMinConfidence(0)}
              className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm flex items-center gap-2 hover:bg-green-500/30"
            >
              {minConfidence}%+ confidence <span>×</span>
            </button>
          )}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full text-sm flex items-center gap-2 hover:bg-pink-500/30"
            >
              "{searchTerm}" <span>×</span>
            </button>
          )}
        </div>

        <div className="mt-3 text-sm text-gray-400">
          Showing {filteredPicks.length} of {totalPicks} picks
        </div>
      </div>

      {/* Stock Picks Grid */}
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-8 border border-purple-500/20">
        <h2 className="text-3xl font-bold mb-6 flex items-center">
          <span className="mr-3">📈</span> Stock Picks
        </h2>

        {filteredPicks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-4">🔍</div>
            <div className="text-xl mb-2">No picks match your filters</div>
            <div className="text-sm">Try adjusting your search criteria</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPicks.map((pick) => {
              const gainPercent = ((pick.target_price - pick.entry_price) / pick.entry_price * 100).toFixed(1)
              const isPositive = parseFloat(gainPercent) >= 0
              
              return (
                <div
                  key={pick.id}
                  className="bg-slate-900/50 rounded-lg p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all hover:shadow-lg hover:shadow-purple-500/20"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-purple-400 bg-purple-500/20 px-3 py-1 rounded-full">
                      {pick.ai_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(pick.pick_date).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Symbol */}
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-white mb-1">${pick.symbol}</div>
                    <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      pick.status === 'OPEN' ? 'bg-green-500/20 text-green-400' :
                      pick.status === 'WON' ? 'bg-blue-500/20 text-blue-400' :
                      pick.status === 'LOST' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {pick.status}
                    </div>
                  </div>

                  {/* Prices */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-400">Entry Price</div>
                      <div className="text-lg font-bold text-blue-400">${pick.entry_price.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Target Price</div>
                      <div className="text-lg font-bold text-green-400">${pick.target_price.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Expected Gain */}
                  <div className={`flex items-center justify-between mb-4 p-3 rounded-lg ${
                    isPositive ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}>
                    <span className="text-sm text-gray-300">Expected Gain</span>
                    <span className={`text-lg font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{gainPercent}%
                    </span>
                  </div>

                  {/* Confidence Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">AI Confidence</span>
                      <span className="text-white font-bold">{pick.confidence_score}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          pick.confidence_score >= 80 ? 'bg-green-500' :
                          pick.confidence_score >= 60 ? 'bg-yellow-500' :
                          'bg-orange-500'
                        }`}
                        style={{ width: `${pick.confidence_score}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="mb-4">
                    <div className="text-xs text-gray-400 mb-1">AI Reasoning:</div>
                    <div className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
                      {pick.reasoning}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-700">
                    <button className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm py-2 rounded-lg transition-all">
                      View Details
                    </button>
                    <button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm py-2 rounded-lg transition-all">
                      Track Pick
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-12 pt-8 border-t border-gray-800">
        <p className="text-gray-500 text-sm mb-2">
          Market Oracle AI Battle • Powered by CR AudioViz AI
        </p>
        <p className="text-gray-600 text-xs">
          Real AI-generated stock picks • For educational and entertainment purposes only • Not financial advice
        </p>
      </div>
    </div>
  )
}
