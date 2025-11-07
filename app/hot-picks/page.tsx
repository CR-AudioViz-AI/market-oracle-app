"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function HotPicksPage() {
  const [picks, setPicks] = useState<any[]>([])
  const [filteredPicks, setFilteredPicks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  
  const [selectedAI, setSelectedAI] = useState<string>('all')
  const [minConfidence, setMinConfidence] = useState<number>(70)
  const [sortBy, setSortBy] = useState<string>('performance')
  const [showAll, setShowAll] = useState(false)
  
  const [aiOptions, setAiOptions] = useState<string[]>([])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000) // Auto-refresh every minute
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    applyFilters()
  }, [picks, selectedAI, minConfidence, sortBy])

  async function fetchData() {
    const { data } = await supabase
      .from('stock_picks')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setPicks(data)
      
      // Extract unique AI names
      const unique = Array.from(new Set(data.map(d => d.ai_name)))
      setAiOptions(['all', ...unique])
      
      // Get most recent price update time
      const recentUpdate = data
        .filter(p => p.price_updated_at)
        .sort((a, b) => new Date(b.price_updated_at).getTime() - new Date(a.price_updated_at).getTime())[0]
      
      if (recentUpdate) {
        setLastUpdate(recentUpdate.price_updated_at)
      }
    }
    setLoading(false)
  }

  async function refreshPrices() {
    setRefreshing(true)
    try {
      const response = await fetch('/api/update-prices?limit=50')
      const data = await response.json()
      console.log('Price update:', data)
      
      // Refresh the picks data
      await fetchData()
      
      alert(`✅ Updated ${data.updated} prices successfully!`)
    } catch (error) {
      console.error('Error refreshing prices:', error)
      alert('❌ Failed to refresh prices. Please try again.')
    }
    setRefreshing(false)
  }

  function applyFilters() {
    let filtered = [...picks]
    
    if (selectedAI !== 'all') {
      filtered = filtered.filter(pick => pick.ai_name === selectedAI)
    }
    
    filtered = filtered.filter(pick => pick.confidence_score >= minConfidence)
    
    switch(sortBy) {
      case 'performance':
        filtered.sort((a, b) => (b.price_change_percent || 0) - (a.price_change_percent || 0))
        break
      case 'confidence':
        filtered.sort((a, b) => b.confidence_score - a.confidence_score)
        break
      case 'potential':
        filtered.sort((a, b) => {
          const aGain = ((a.target_price - a.entry_price) / a.entry_price) * 100
          const bGain = ((b.target_price - b.entry_price) / b.entry_price) * 100
          return bGain - aGain
        })
        break
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }
    
    setFilteredPicks(filtered)
  }

  function formatTime(timestamp: string) {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60)
    
    if (diff < 1) return 'Just now'
    if (diff < 60) return `${diff} min ago`
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#E31937] mx-auto mb-4"></div>
          <div className="text-2xl text-[#E31937] font-bold">Loading Hot Picks...</div>
        </div>
      </div>
    )
  }

  const displayPicks = showAll ? filteredPicks : filteredPicks.slice(0, 12)
  
  // Calculate stats
  const avgPerformance = filteredPicks.length > 0
    ? filteredPicks.reduce((sum, p) => sum + (p.price_change_percent || 0), 0) / filteredPicks.length
    : 0
  const winners = filteredPicks.filter(p => (p.price_change_percent || 0) > 0).length
  const losers = filteredPicks.filter(p => (p.price_change_percent || 0) < 0).length

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-[#E31937] via-[#FF6B6B] to-[#FFA500] bg-clip-text text-transparent mb-4">
          🔥 Hot Picks
        </h1>
        <p className="text-xl text-gray-300 mb-2">
          AI-powered stock picks with live performance tracking
        </p>
        <p className="text-gray-400">
          High-confidence predictions from 5 competing AIs - See what's winning NOW! 📈
        </p>
      </div>

      {/* Price Update Bar */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-500/30 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-400">Last Price Update</div>
            <div className="text-lg font-bold text-white">
              {lastUpdate ? formatTime(lastUpdate) : 'No updates yet'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              💡 Prices delayed ~15 minutes (Yahoo Finance free tier)
            </div>
          </div>
          <button
            onClick={refreshPrices}
            disabled={refreshing}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-lg transition-all disabled:cursor-not-allowed"
          >
            {refreshing ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Updating...
              </span>
            ) : (
              '🔄 Refresh Prices'
            )}
          </button>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
          <div className="text-sm text-gray-400">Total Picks</div>
          <div className="text-3xl font-bold text-white">{filteredPicks.length}</div>
        </div>
        <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
          <div className="text-sm text-gray-300">Winners</div>
          <div className="text-3xl font-bold text-green-400">{winners}</div>
        </div>
        <div className="bg-red-500/20 rounded-xl p-4 border border-red-500/30">
          <div className="text-sm text-gray-300">Losers</div>
          <div className="text-3xl font-bold text-red-400">{losers}</div>
        </div>
        <div className={`rounded-xl p-4 border ${avgPerformance >= 0 ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
          <div className="text-sm text-gray-300">Avg Performance</div>
          <div className={`text-3xl font-bold ${avgPerformance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {avgPerformance >= 0 ? '+' : ''}{avgPerformance.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20 mb-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Filter by AI</label>
            <select
              value={selectedAI}
              onChange={(e) => setSelectedAI(e.target.value)}
              className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-4 py-2 text-white"
            >
              {aiOptions.map(ai => (
                <option key={ai} value={ai}>
                  {ai === 'all' ? 'All AIs' : ai}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              Min Confidence: {minConfidence}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-4 py-2 text-white"
            >
              <option value="performance">Current Performance</option>
              <option value="confidence">Highest Confidence</option>
              <option value="potential">Target Potential</option>
              <option value="newest">Newest First</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Display</label>
            <button
              onClick={() => setShowAll(!showAll)}
              className={`w-full py-2 rounded-lg font-medium transition-all ${
                showAll
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-900 border border-purple-500/30 text-purple-300'
              }`}
            >
              {showAll ? `Showing All (${filteredPicks.length})` : `Show All (${filteredPicks.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* Picks Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayPicks.map((pick) => {
          const targetGain = ((pick.target_price - pick.entry_price) / pick.entry_price) * 100
          const currentGain = pick.price_change_percent || 0
          const currentPrice = pick.current_price || pick.entry_price
          const isWinning = currentGain > 0
          
          return (
            <div key={pick.id} className={`bg-slate-900/50 rounded-xl p-6 border ${isWinning ? 'border-green-500/30' : currentGain < 0 ? 'border-red-500/30' : 'border-purple-500/20'}`}>
              {/* Header with Symbol and Performance */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-3xl font-bold text-white">${pick.symbol}</div>
                  <div className="text-sm text-gray-400 mt-1">{pick.ai_name}</div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${isWinning ? 'text-green-400' : currentGain < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {currentGain >= 0 ? '+' : ''}{currentGain.toFixed(2)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {isWinning ? '🟢 Winning' : currentGain < 0 ? '🔴 Losing' : '⚪ Flat'}
                  </div>
                </div>
              </div>

              {/* Confidence Badge */}
              <div className="mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  pick.confidence_score >= 80 ? 'bg-green-500/20 text-green-300' :
                  pick.confidence_score >= 60 ? 'bg-blue-500/20 text-blue-300' :
                  'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {pick.confidence_score}% Confidence
                </span>
              </div>

              {/* Price Info */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-sm text-gray-400">Entry Price</span>
                  <span className="font-bold text-white">${pick.entry_price.toFixed(2)}</span>
                </div>
                
                <div className={`flex justify-between items-center p-3 rounded-lg ${isWinning ? 'bg-green-500/20' : currentGain < 0 ? 'bg-red-500/20' : 'bg-slate-800/50'}`}>
                  <span className="text-sm text-gray-300">Current Price</span>
                  <div className="text-right">
                    <div className={`font-bold ${isWinning ? 'text-green-400' : currentGain < 0 ? 'text-red-400' : 'text-white'}`}>
                      ${currentPrice.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {currentGain >= 0 ? '+' : ''}{(currentPrice - pick.entry_price).toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-blue-500/20 rounded-lg">
                  <span className="text-sm text-gray-300">Target Price</span>
                  <div className="text-right">
                    <div className="font-bold text-blue-400">${pick.target_price.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">
                      +{targetGain.toFixed(1)}% potential
                    </div>
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="mb-4">
                <div className="text-xs text-gray-400 mb-1">AI Reasoning:</div>
                <div className="text-sm text-gray-300 line-clamp-2">
                  {pick.reasoning}
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-xs text-gray-500 text-center pt-3 border-t border-gray-700">
                Picked {formatTime(pick.created_at)} • Updated {formatTime(pick.price_updated_at)}
              </div>
            </div>
          )
        })}
      </div>

      {!showAll && filteredPicks.length > 12 && (
        <div className="text-center mt-8">
          <button
            onClick={() => setShowAll(true)}
            className="px-8 py-4 bg-gradient-to-r from-[#E31937] to-[#FFA500] hover:from-[#C71530] hover:to-[#FF8C00] text-white font-bold rounded-lg transition-all"
          >
            Show All {filteredPicks.length} Picks
          </button>
        </div>
      )}

      {/* Empty State */}
      {filteredPicks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-2xl font-bold text-white mb-2">No picks match your filters</h3>
          <p className="text-gray-400">Try adjusting your filters to see more picks</p>
        </div>
      )}
    </div>
  )
}
