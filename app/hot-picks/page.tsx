"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function HotPicksPage() {
  const [allPicks, setAllPicks] = useState<any[]>([])
  const [hotPicks, setHotPicks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    minConsensus: 1,
    minConfidence: 0,
    sortBy: 'consensus'
  })

  useEffect(() => {
    fetchHotPicks()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, allPicks])

  async function fetchHotPicks() {
    const { data } = await supabase
      .from('stock_picks')
      .select('*')
      .gte('confidence_score', 60)
      .order('confidence_score', { ascending: false })

    if (data) {
      setAllPicks(data)
    }
    setLoading(false)
  }

  function applyFilters() {
    const symbolMap = new Map()
    
    allPicks.forEach(pick => {
      if (!symbolMap.has(pick.symbol)) {
        symbolMap.set(pick.symbol, {
          symbol: pick.symbol,
          picks: [],
          consensus: 0,
          avgConfidence: 0,
          avgGain: 0,
          entry_price: pick.entry_price,
          target_price: pick.target_price
        })
      }
      const stock = symbolMap.get(pick.symbol)
      stock.picks.push(pick)
      stock.consensus = stock.picks.length
    })

    let hot = Array.from(symbolMap.values()).map(stock => {
      const totalConf = stock.picks.reduce((sum: number, p: any) => sum + p.confidence_score, 0)
      const totalGain = stock.picks.reduce((sum: number, p: any) => {
        return sum + ((p.target_price - p.entry_price) / p.entry_price) * 100
      }, 0)
      
      return {
        ...stock,
        avgConfidence: Math.round(totalConf / stock.picks.length),
        avgGain: Math.round((totalGain / stock.picks.length) * 10) / 10
      }
    })

    hot = hot.filter(s => s.consensus >= filters.minConsensus)
    hot = hot.filter(s => s.avgConfidence >= filters.minConfidence)

    switch(filters.sortBy) {
      case 'consensus':
        hot.sort((a, b) => b.consensus - a.consensus || b.avgConfidence - a.avgConfidence)
        break
      case 'confidence':
        hot.sort((a, b) => b.avgConfidence - a.avgConfidence)
        break
      case 'gains':
        hot.sort((a, b) => b.avgGain - a.avgGain)
        break
    }

    setHotPicks(hot)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#00CED1] mx-auto mb-4"></div>
          <div className="text-2xl text-[#00CED1] font-bold">Loading hot picks...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-[#E31937] via-orange-400 to-[#00CED1] bg-clip-text text-transparent mb-4">
          🔥 Hot Picks
        </h1>
        <p className="text-xl text-gray-300 mb-2">
          Stocks that multiple AIs agree on = Higher confidence = Less risk
        </p>
        <p className="text-gray-400">
          When 3+ AIs all pick the same stock, it&apos;s basically them saying &quot;yo, this one&apos;s gonna pop off&quot; 🚀
        </p>
      </div>

      {/* Metric Explanations */}
      <div className="bg-gradient-to-r from-[#003366]/50 to-[#00CED1]/20 rounded-xl p-6 border border-[#00CED1]/30 mb-8">
        <h2 className="text-xl font-bold mb-4 text-[#00CED1]">📊 What Do These Numbers Mean?</h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="font-bold text-white mb-2">💯 AI Confidence %</div>
            <p className="text-gray-300">How sure each AI is about this pick. 80%+ = very confident. This is their conviction level.</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="font-bold text-white mb-2">💰 Entry vs Target</div>
            <p className="text-gray-300"><strong>Entry</strong> = Price they recommend buying at. <strong>Target</strong> = Price they expect it to reach (sell point).</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="font-bold text-white mb-2">🎯 Expected Gain %</div>
            <p className="text-gray-300">The potential profit. +20% means if you buy $100 worth, you could make $20 profit.</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-[#00CED1]/20 mb-8">
        <h2 className="text-xl font-bold mb-4">⚙️ Filters & Sorting</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Min AI Consensus: {filters.minConsensus}</label>
            <input
              type="range"
              min="1"
              max="5"
              value={filters.minConsensus}
              onChange={(e) => setFilters({...filters, minConsensus: parseInt(e.target.value)})}
              className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#00CED1]"
            />
            <div className="text-xs text-gray-500 mt-1">{filters.minConsensus} or more AIs</div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Min Confidence: {filters.minConfidence}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.minConfidence}
              onChange={(e) => setFilters({...filters, minConfidence: parseInt(e.target.value)})}
              className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#00CED1]"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
              className="w-full bg-slate-900 border border-[#00CED1]/30 rounded-lg px-4 py-2 text-white"
            >
              <option value="consensus">Most AIs Agree</option>
              <option value="confidence">Highest Confidence</option>
              <option value="gains">Biggest Expected Gains</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-400">
          Showing <span className="text-[#00CED1] font-bold">{hotPicks.length}</span> hot picks
        </div>
      </div>

      {/* Hot Picks Grid */}
      {hotPicks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-xl text-gray-400">No picks match your filters. Try adjusting them!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotPicks.map((stock, idx) => {
            const tier = stock.consensus >= 5 ? 'legendary' :
                        stock.consensus >= 4 ? 'hot' :
                        stock.consensus >= 3 ? 'warm' :
                        stock.consensus >= 2 ? 'rising' : 'standard'
            
            const tierColors = {
              legendary: 'from-yellow-500 to-orange-500',
              hot: 'from-[#E31937] to-pink-500',
              warm: 'from-orange-500 to-red-400',
              rising: 'from-purple-500 to-pink-500',
              standard: 'from-blue-500 to-[#00CED1]'
            }

            const tierLabels = {
              legendary: '👑 LEGENDARY',
              hot: '🔥 SUPER HOT',
              warm: '🌶️ HOT',
              rising: '📈 RISING',
              standard: '⭐ SOLID'
            }

            return (
              <div
                key={idx}
                className={`bg-gradient-to-br ${tierColors[tier]}/20 rounded-xl p-6 border-2 ${
                  tier === 'legendary' ? 'border-yellow-500/50 shadow-2xl shadow-yellow-500/20' :
                  tier === 'hot' ? 'border-[#E31937]/50' :
                  'border-[#00CED1]/30'
                } hover:scale-105 transition-transform`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-4 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${tierColors[tier]} text-white`}>
                    {tierLabels[tier]}
                  </span>
                  <span className="text-3xl">{tier === 'legendary' ? '👑' : tier === 'hot' ? '🔥' : '⭐'}</span>
                </div>

                <div className="text-4xl font-bold text-white mb-2">${stock.symbol}</div>

                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-1">{stock.consensus} AIs picked this</div>
                  <div className="flex gap-1">
                    {stock.picks.map((pick: any, i: number) => (
                      <div key={i} className="w-8 h-8 bg-[#00CED1]/30 rounded-full flex items-center justify-center text-xs font-bold" title={pick.ai_name}>
                        {pick.ai_name[0]}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400">Entry</div>
                    <div className="text-lg font-bold text-blue-400">${stock.entry_price.toFixed(2)}</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400">Target</div>
                    <div className="text-lg font-bold text-green-400">${stock.target_price.toFixed(2)}</div>
                  </div>
                </div>

                <div className="bg-green-500/20 rounded-lg p-4 mb-4">
                  <div className="text-sm text-gray-300 mb-1">Expected Gain</div>
                  <div className="text-3xl font-bold text-green-400">+{stock.avgGain}%</div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Avg AI Confidence</span>
                    <span className="font-bold text-white">{stock.avgConfidence}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full bg-gradient-to-r ${tierColors[tier]}`}
                      style={{ width: `${stock.avgConfidence}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-xs text-gray-400 bg-slate-900/30 rounded-lg p-3">
                  {stock.consensus >= 5 ? '5 AIs all agree - this is RARE! Like finding a unicorn 🦄' :
                   stock.consensus >= 4 ? '4 AIs think this will blow up - strong consensus!' :
                   stock.consensus >= 3 ? '3 AIs see potential - solid pick with confirmation' :
                   stock.consensus >= 2 ? '2 AIs like it - good double confirmation' :
                   'Single AI high-confidence pick - still strong!'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
