"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function MarketOracle() {
  const [picks, setPicks] = useState<any[]>([])
  const [filteredPicks, setFilteredPicks] = useState<any[]>([])
  const [aiStats, setAiStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  
  const [selectedAI, setSelectedAI] = useState<string>('all')
  const [minConfidence, setMinConfidence] = useState<number>(0)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('confidence')
  
  const [userStreak, setUserStreak] = useState(7)
  const [totalGains, setTotalGains] = useState(0)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    applyFilters()
  }, [picks, selectedAI, minConfidence, searchTerm, sortBy])

  async function fetchData() {
    const { data: picksData } = await supabase
      .from('stock_picks')
      .select('*')
      .order('created_at', { ascending: false })

    if (picksData) {
      setPicks(picksData)
      
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

      const stats = Array.from(aiMap.values()).map((ai: any) => ({
        ...ai,
        avg_confidence: Math.round(ai.total_confidence / ai.total_picks),
        total_gain: Math.round(ai.total_gain * 10) / 10
      }))

      stats.sort((a: any, b: any) => b.total_gain - a.total_gain)
      setAiStats(stats)
      
      const totalGain = stats.reduce((sum, ai) => sum + ai.total_gain, 0)
      setTotalGains(Math.round(totalGain))
    }
    setLoading(false)
  }

  function applyFilters() {
    let filtered = [...picks]
    
    if (selectedAI !== 'all') {
      filtered = filtered.filter((pick: any) => pick.ai_name === selectedAI)
    }
    
    filtered = filtered.filter((pick: any) => pick.confidence_score >= minConfidence)
    
    if (searchTerm) {
      filtered = filtered.filter((pick: any) => 
        pick.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pick.reasoning.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    switch(sortBy) {
      case 'confidence':
        filtered.sort((a: any, b: any) => b.confidence_score - a.confidence_score)
        break
      case 'gains':
        filtered.sort((a: any, b: any) => {
          const aGain = ((a.target_price - a.entry_price) / a.entry_price) * 100
          const bGain = ((b.target_price - b.entry_price) / b.entry_price) * 100
          return bGain - aGain
        })
        break
      case 'newest':
        filtered.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }
    
    setFilteredPicks(filtered)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#00CED1] mx-auto mb-4"></div>
          <div className="text-2xl text-[#00CED1] font-bold">Loading the Oracle...</div>
          <div className="text-gray-400 mt-2">Analyzing {picks.length} AI predictions</div>
        </div>
      </div>
    )
  }

  const displayPicks = showAll ? filteredPicks : filteredPicks.slice(0, 12)

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="text-center mb-12 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00CED1]/10 via-[#E31937]/10 to-[#003366]/10 blur-3xl -z-10"></div>
        
        <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-[#00CED1] via-white to-[#E31937] bg-clip-text text-transparent mb-4 animate-gradient">
          Market Oracle
        </h1>
        
        <p className="text-2xl text-gray-300 mb-4">
          5 AIs Battle. You Profit. 🚀
        </p>
        
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="bg-green-500/20 px-6 py-3 rounded-full border border-green-500/30">
            <span className="text-green-400 font-bold">🔥 {userStreak} Day Streak!</span>
          </div>
          
          <div className="bg-[#00CED1]/20 px-6 py-3 rounded-full border border-[#00CED1]/30">
            <span className="text-[#00CED1] font-bold">💎 {picks.length} Live Picks</span>
          </div>
          
          <div className="bg-blue-500/20 px-6 py-3 rounded-full border border-blue-500/30">
            <span className="text-blue-300 font-bold">📈 +{totalGains}% Total Gains</span>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Link href="/hot-picks" className="group">
          <div className="bg-gradient-to-br from-[#E31937]/20 to-orange-500/20 rounded-xl p-6 border border-[#E31937]/30 hover:scale-105 transition-transform cursor-pointer">
            <div className="text-4xl mb-2">🔥</div>
            <h3 className="text-xl font-bold text-white mb-2">Hot Picks</h3>
            <p className="text-sm text-gray-300">Multiple AIs agree</p>
            <div className="mt-4 text-[#E31937] font-bold group-hover:translate-x-2 transition-transform">View Picks →</div>
          </div>
        </Link>

        <Link href="/portfolio" className="group">
          <div className="bg-gradient-to-br from-[#00CED1]/20 to-blue-500/20 rounded-xl p-6 border border-[#00CED1]/30 hover:scale-105 transition-transform cursor-pointer">
            <div className="text-4xl mb-2">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">Your Portfolio</h3>
            <p className="text-sm text-gray-300">Track all picks</p>
            <div className="mt-4 text-[#00CED1] font-bold group-hover:translate-x-2 transition-transform">View Stats →</div>
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
          <div className="bg-gradient-to-br from-[#003366]/20 to-purple-500/20 rounded-xl p-6 border border-[#003366]/30 hover:scale-105 transition-transform cursor-pointer">
            <div className="text-4xl mb-2">📚</div>
            <h3 className="text-xl font-bold text-white mb-2">Learn</h3>
            <p className="text-sm text-gray-300">Trading guides</p>
            <div className="mt-4 text-purple-400 font-bold group-hover:translate-x-2 transition-transform">Get Smart →</div>
          </div>
        </Link>
      </div>

      {/* AI Leaderboard */}
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-8 border border-[#00CED1]/20 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">🏆 AI Leaderboard</h2>
          <span className="text-sm text-gray-400">Updated 30s ago</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        // @ts-ignore
          {aiStats.map((ai, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''
            const borderColor = index === 0 ? 'border-yellow-500/50' : 
                               index === 1 ? 'border-gray-400/50' : 
                               index === 2 ? 'border-orange-600/50' : 'border-[#00CED1]/30'
            
            return (
              <div
                key={ai.ai_name}
                onClick={() => setSelectedAI(ai.ai_name)}
                className={`bg-slate-900/50 rounded-lg p-6 border-2 ${borderColor} hover:scale-105 transition-all cursor-pointer ${
                  selectedAI === ai.ai_name ? 'ring-2 ring-[#00CED1]' : ''
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
                      <span className="text-[#00CED1] font-bold">{ai.avg_confidence}%</span>
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
              className="px-6 py-2 bg-[#00CED1]/20 hover:bg-[#00CED1]/30 text-[#00CED1] rounded-full transition"
            >
              Clear Filter ✕
            </button>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-[#00CED1]/20 mb-8">
        <h2 className="text-xl font-bold mb-4">⚙️ Search & Filter All Picks</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">🔍 Search Stocks</label>
            <input
              type="text"
              placeholder="Type a symbol like AAPL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-[#00CED1]/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00CED1] transition"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">💪 Min Confidence: {minConfidence}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#00CED1]"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">📊 Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-900 border border-[#00CED1]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00CED1] transition"
            >
              <option value="confidence">Highest Confidence</option>
              <option value="gains">Biggest Expected Gains</option>
              <option value="newest">Newest First</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">👁️ Display</label>
            <button
              onClick={() => setShowAll(!showAll)}
              className={`w-full py-3 rounded-lg font-bold transition-all ${
                showAll
                  ? 'bg-[#00CED1] text-white'
                  : 'bg-slate-900 border border-[#00CED1]/30 text-[#00CED1] hover:bg-[#00CED1]/10'
              }`}
            >
              {showAll ? `Showing All ${filteredPicks.length}` : `Show All (${filteredPicks.length})`}
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-400">
          Showing <span className="text-[#00CED1] font-bold">{displayPicks.length}</span> of {filteredPicks.length} filtered picks ({picks.length} total)
        </div>
      </div>

      {/* Stock Picks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        // @ts-ignore
        {displayPicks.map((pick) => {
          const gainPercent = ((pick.target_price - pick.entry_price) / pick.entry_price * 100).toFixed(1)
          const isHot = pick.confidence_score >= 80
          
          return (
            <div
              key={pick.id}
              className={`bg-slate-900/50 rounded-xl p-6 border-2 hover:scale-105 transition-all cursor-pointer ${
                isHot ? 'border-[#E31937]/50 shadow-lg shadow-[#E31937]/20' : 'border-[#00CED1]/30'
              }`}
            >
              {isHot && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-gradient-to-r from-[#E31937] to-orange-500 text-white text-xs font-bold rounded-full">
                    🔥 HOT PICK
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-[#00CED1]/20 text-[#00CED1] text-sm font-semibold rounded-full">
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

              <button className="w-full bg-gradient-to-r from-[#00CED1] to-blue-500 hover:from-[#00CED1]/80 hover:to-blue-500/80 text-white font-bold py-3 rounded-lg transition-all">
                Add to Watchlist ⭐
              </button>
            </div>
          )
        })}
      </div>

      {!showAll && filteredPicks.length > 12 && (
        <div className="text-center">
          <button 
            onClick={() => setShowAll(true)}
            className="px-8 py-4 bg-gradient-to-r from-[#00CED1] to-blue-500 hover:from-[#00CED1]/80 hover:to-blue-500/80 text-white font-bold rounded-xl transition-all text-lg"
          >
            Show All {filteredPicks.length} Picks →
          </button>
        </div>
      )}

      {showAll && (
        <div className="text-center">
          <button 
            onClick={() => {setShowAll(false); window.scrollTo({top: 0, behavior: 'smooth'})}}
            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-[#00CED1]/30 text-[#00CED1] font-bold rounded-xl transition-all"
          >
            Show Less ↑
          </button>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-12 bg-gradient-to-r from-[#00CED1]/10 via-[#E31937]/10 to-[#003366]/10 rounded-xl p-8 border border-[#00CED1]/30 text-center">
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
