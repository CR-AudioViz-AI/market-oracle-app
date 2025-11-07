"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function MarketOracle() {
  const [picks, setPicks] = useState<any[]>([])
  const [filteredPicks, setFilteredPicks] = useState<any[]>([])
  const [aiStats, setAiStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [selectedAI, setSelectedAI] = useState<string>('all')
  const [minConfidence, setMinConfidence] = useState<number>(0)
  const [searchTerm, setSearchTerm] = useState<string>('')
  
  // Stats
  const [userStreak, setUserStreak] = useState(7) // Days visiting
  const [totalGains, setTotalGains] = useState(0)

  useEffect(() => {
    fetchData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    applyFilters()
  }, [picks, selectedAI, minConfidence, searchTerm])

  async function fetchData() {
    const { data: picksData } = await supabase
      .from('stock_picks')
      .select('*')
      .order('created_at', { ascending: false })

    if (picksData) {
      setPicks(picksData)
      
      // Calculate AI stats
      const aiMap = new Map()
      picksData.forEach(pick => {
        if (!aiMap.has(pick.ai_name)) {
          aiMap.set(pick.ai_name, {
            ai_name: pick.ai_name,
            total_picks: 0,
            total_gain: 0,
            avg_confidence: 0,
            total_confidence: 0
          })
        }
        const ai = aiMap.get(pick.ai_name)
        ai.total_picks++
        ai.total_gain += ((pick.target_price - pick.entry_price) / pick.entry_price) * 100
        ai.total_confidence += pick.confidence_score
      })

      const stats = Array.from(aiMap.values()).map(ai => ({
        ...ai,
        avg_confidence: Math.round(ai.total_confidence / ai.total_picks),
        total_gain: Math.round(ai.total_gain * 10) / 10
      }))

      stats.sort((a, b) => b.total_gain - a.total_gain)
      setAiStats(stats)
      
      const totalGain = stats.reduce((sum, ai) => sum + ai.total_gain, 0)
      setTotalGains(Math.round(totalGain))
    }
    setLoading(false)
  }

  function applyFilters() {
    let filtered = [...picks]
    
    if (selectedAI !== 'all') {
      filtered = filtered.filter(pick => pick.ai_name === selectedAI)
    }
    
    filtered = filtered.filter(pick => pick.confidence_score >= minConfidence)
    
    if (searchTerm) {
      filtered = filtered.filter(pick => 
        pick.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pick.reasoning.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredPicks(filtered)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <div className="text-2xl text-purple-400 font-bold">Loading the Oracle...</div>
          <div className="text-gray-400 mt-2">Analyzing {picks.length} AI predictions</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Hero Section */}
      <div className="text-center mb-12 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 blur-3xl -z-10"></div>
        
        <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4 animate-gradient">
          Market Oracle
        </h1>
        
        <p className="text-2xl text-gray-300 mb-4">
          5 AIs Battle. You Profit. 🚀
        </p>
        
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="bg-green-500/20 px-6 py-3 rounded-full border border-green-500/30">
            <span className="text-green-400 font-bold">🔥 {userStreak} Day Streak!</span>
          </div>
          
          <div className="bg-purple-500/20 px-6 py-3 rounded-full border border-purple-500/30">
            <span className="text-purple-300 font-bold">💎 {picks.length} Live Picks</span>
          </div>
          
          <div className="bg-blue-500/20 px-6 py-3 rounded-full border border-blue-500/30">
            <span className="text-blue-300 font-bold">📈 +{totalGains}% Total Gains</span>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Link href="/hot-picks" className="group">
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-6 border border-orange-500/30 hover:scale-105 transition-transform cursor-pointer">
            <div className="text-4xl mb-2">🔥</div>
            <h3 className="text-xl font-bold text-white mb-2">Hot Picks</h3>
            <p className="text-sm text-gray-300">Multiple AIs agree</p>
            <div className="mt-4 text-orange-400 font-bold group-hover:translate-x-2 transition-transform">View Picks →</div>
          </div>
        </Link>

        <Link href="/portfolio" className="group">
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30 hover:scale-105 transition-transform cursor-pointer">
            <div className="text-4xl mb-2">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">Your Portfolio</h3>
            <p className="text-sm text-gray-300">Track all picks</p>
            <div className="mt-4 text-purple-400 font-bold group-hover:translate-x-2 transition-transform">View Stats →</div>
          </div>
        </Link>

        <Link href="/paper-trading" className="group">
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30 hover:scale-105 transition-transform cursor-pointer">
            <div className="text-4xl mb-2">💰</div>
            <h3 className="text-xl font-bold text-white mb-2">Paper Trade</h3>
            <p className="text-sm text-gray-300">Practice risk-free</p>
            <div className="mt-4 text-green-400 font-bold group-hover:translate-x-2 transition-transform">Start Trading →</div>
          </div>
        </Link>

        <Link href="/learn" className="group">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-500/30 hover:scale-105 transition-transform cursor-pointer">
            <div className="text-4xl mb-2">📚</div>
            <h3 className="text-xl font-bold text-white mb-2">Learn</h3>
            <p className="text-sm text-gray-300">Trading guides</p>
            <div className="mt-4 text-blue-400 font-bold group-hover:translate-x-2 transition-transform">Get Smart →</div>
          </div>
        </Link>
      </div>

      {/* AI Leaderboard */}
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-8 border border-purple-500/20 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">🏆 AI Leaderboard</h2>
          <span className="text-sm text-gray-400">Updated 30s ago</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {aiStats.map((ai, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''
            const borderColor = index === 0 ? 'border-yellow-500/50' : 
                               index === 1 ? 'border-gray-400/50' : 
                               index === 2 ? 'border-orange-600/50' : 'border-purple-500/30'
            
            return (
              <div
                key={ai.ai_name}
                onClick={() => setSelectedAI(ai.ai_name)}
                className={`bg-slate-900/50 rounded-lg p-6 border-2 ${borderColor} hover:scale-105 transition-all cursor-pointer ${
                  selectedAI === ai.ai_name ? 'ring-2 ring-purple-400' : ''
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{medal || '⭐'}</div>
                  <div className="text-xl font-bold text-white mb-2">{ai.ai_name}</div>
                  
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-green-400">
                      +{ai.total_gain}%
                    </div>
                    <div className="text-xs text-gray-400">Total Expected</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Picks</span>
                      <span className="text-white font-bold">{ai.total_picks}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Confidence</span>
                      <span className="text-blue-400 font-bold">{ai.avg_confidence}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {selectedAI !== 'all' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setSelectedAI('all')}
              className="px-6 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-full transition"
            >
              Clear Filter ✕
            </button>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20 mb-8">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">🔍 Search Stocks</label>
            <input
              type="text"
              placeholder="Type a symbol like AAPL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">🤖 Filter by AI</label>
            <select
              value={selectedAI}
              onChange={(e) => setSelectedAI(e.target.value)}
              className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400 transition"
            >
              <option value="all">All AIs</option>
              {aiStats.map(ai => (
                <option key={ai.ai_name} value={ai.ai_name}>{ai.ai_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">💪 Min Confidence: {minConfidence}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-400">
          Showing <span className="text-purple-400 font-bold">{filteredPicks.length}</span> of {picks.length} picks
        </div>
      </div>

      {/* Stock Picks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPicks.slice(0, 12).map((pick) => {
          const gainPercent = ((pick.target_price - pick.entry_price) / pick.entry_price * 100).toFixed(1)
          const isHot = pick.confidence_score >= 80
          
          return (
            <div
              key={pick.id}
              className={`bg-slate-900/50 rounded-xl p-6 border-2 hover:scale-105 transition-all cursor-pointer ${
                isHot ? 'border-orange-500/50 shadow-lg shadow-orange-500/20' : 'border-purple-500/30'
              }`}
            >
              {isHot && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full">
                    🔥 HOT PICK
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm font-semibold rounded-full">
                  {pick.ai_name}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(pick.pick_date).toLocaleDateString()}
                </span>
              </div>

              <div className="text-4xl font-black text-white mb-3">${pick.symbol}</div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400">Entry</div>
                  <div className="text-lg font-bold text-blue-400">${pick.entry_price.toFixed(2)}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400">Target</div>
                  <div className="text-lg font-bold text-green-400">${pick.target_price.toFixed(2)}</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-4 mb-4 border border-green-500/30">
                <div className="text-sm text-gray-300 mb-1">Expected Gain</div>
                <div className="text-3xl font-bold text-green-400">+{gainPercent}%</div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">AI Confidence</span>
                  <span className="font-bold text-white">{pick.confidence_score}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      pick.confidence_score >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                      pick.confidence_score >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                      'bg-gradient-to-r from-red-500 to-pink-500'
                    }`}
                    style={{ width: `${pick.confidence_score}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-xs text-gray-400 bg-slate-800/30 rounded-lg p-3 mb-4 line-clamp-2">
                {pick.reasoning}
              </div>

              <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-lg transition-all">
                Add to Watchlist ⭐
              </button>
            </div>
          )
        })}
      </div>

      {filteredPicks.length > 12 && (
        <div className="text-center mt-8">
          <button className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all">
            Load More Picks ({filteredPicks.length - 12} remaining)
          </button>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-12 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 rounded-xl p-8 border border-purple-500/30 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Trading?</h2>
        <p className="text-gray-300 mb-6">Practice with $10,000 virtual money. Zero risk. Real experience.</p>
        <Link href="/paper-trading">
          <button className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl text-lg transition-all">
            Start Paper Trading 💰
          </button>
        </Link>
      </div>
    </div>
  )
}
