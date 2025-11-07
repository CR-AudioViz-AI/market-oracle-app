"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PortfolioPage() {
  const [picks, setPicks] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalPicks: 0,
    totalValue: 0,
    avgGain: 0,
    bestPick: { symbol: '', gain: 0 },
    worstPick: { symbol: '', gain: 0 }
  })

  useEffect(() => {
    fetchPortfolio()
  }, [])

  async function fetchPortfolio() {
    const { data } = await supabase
      .from('stock_picks')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setPicks(data)
      
      // Calculate stats
      const gains = data.map(pick => {
        const gain = ((pick.target_price - pick.entry_price) / pick.entry_price) * 100
        return { symbol: pick.symbol, gain }
      })
      
      const totalGain = gains.reduce((sum, item) => sum + item.gain, 0)
      const best = gains.reduce((max, item) => item.gain > max.gain ? item : max, gains[0] || { gain: 0 })
      const worst = gains.reduce((min, item) => item.gain < min.gain ? item : min, gains[0] || { gain: 0 })

      setStats({
        totalPicks: data.length,
        totalValue: data.reduce((sum, pick) => sum + pick.entry_price, 0),
        avgGain: totalGain / data.length,
        bestPick: best,
        worstPick: worst
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Intro for 21-year-olds */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          📊 Your Portfolio
        </h1>
        <p className="text-xl text-gray-300 mb-2">
          Track ALL the AI stock picks in one place
        </p>
        <p className="text-gray-400">
          Think of this as your trading dashboard - see which AI picks are crushing it 🚀 and which ones are flopping 📉
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
          <div className="text-sm text-gray-400 mb-2">Total Picks</div>
          <div className="text-3xl font-bold text-white">{stats.totalPicks}</div>
          <div className="text-xs text-purple-300 mt-1">All AI predictions</div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30">
          <div className="text-sm text-gray-400 mb-2">Avg Expected Gain</div>
          <div className="text-3xl font-bold text-green-400">+{stats.avgGain.toFixed(1)}%</div>
          <div className="text-xs text-green-300 mt-1">Average upside</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-500/30">
          <div className="text-sm text-gray-400 mb-2">Total Value</div>
          <div className="text-3xl font-bold text-white">${stats.totalValue.toFixed(0)}</div>
          <div className="text-xs text-blue-300 mt-1">If you bought all</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-yellow-500/30">
          <div className="text-sm text-gray-400 mb-2">Best Pick</div>
          <div className="text-2xl font-bold text-white">${stats.bestPick.symbol}</div>
          <div className="text-lg font-bold text-green-400">+{stats.bestPick.gain.toFixed(1)}%</div>
        </div>

        <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-xl p-6 border border-red-500/30">
          <div className="text-sm text-gray-400 mb-2">Worst Pick</div>
          <div className="text-2xl font-bold text-white">${stats.worstPick.symbol}</div>
          <div className="text-lg font-bold text-red-400">{stats.worstPick.gain.toFixed(1)}%</div>
        </div>
      </div>

      {/* What This Means (Educational) */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20 mb-8">
        <h2 className="text-2xl font-bold mb-4">💡 What You&apos;re Looking At</h2>
        <div className="grid md:grid-cols-3 gap-6 text-gray-300">
          <div>
            <div className="text-lg font-bold text-purple-400 mb-2">Total Picks</div>
            <p className="text-sm">Every stock that our 5 AIs have recommended. More picks = more opportunities to find winners.</p>
          </div>
          <div>
            <div className="text-lg font-bold text-green-400 mb-2">Expected Gain</div>
            <p className="text-sm">The average % profit the AIs think you could make. This is their target price vs. entry price. Higher = better!</p>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-400 mb-2">Portfolio Value</div>
            <p className="text-sm">If you bought 1 share of every pick, this is what you&apos;d spend. Helps you budget your investment.</p>
          </div>
        </div>
      </div>

      {/* All Picks Table */}
      <div className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20">
        <h2 className="text-3xl font-bold mb-6">All Picks Breakdown</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="pb-4 text-gray-400 font-semibold">Stock</th>
                <th className="pb-4 text-gray-400 font-semibold">AI</th>
                <th className="pb-4 text-gray-400 font-semibold">Entry Price</th>
                <th className="pb-4 text-gray-400 font-semibold">Target Price</th>
                <th className="pb-4 text-gray-400 font-semibold">Expected Gain</th>
                <th className="pb-4 text-gray-400 font-semibold">Confidence</th>
                <th className="pb-4 text-gray-400 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {picks.slice(0, 20).map((pick, idx) => {
                const gain = ((pick.target_price - pick.entry_price) / pick.entry_price) * 100
                return (
                  <tr key={idx} className="border-b border-gray-800 hover:bg-slate-700/30 transition">
                    <td className="py-4 font-bold text-white">${pick.symbol}</td>
                    <td className="py-4">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                        {pick.ai_name}
                      </span>
                    </td>
                    <td className="py-4 text-blue-400">${pick.entry_price.toFixed(2)}</td>
                    <td className="py-4 text-green-400">${pick.target_price.toFixed(2)}</td>
                    <td className="py-4">
                      <span className={`font-bold ${gain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {gain >= 0 ? '+' : ''}{gain.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                            style={{ width: `${pick.confidence_score}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-400">{pick.confidence_score}%</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        pick.status === 'OPEN' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {pick.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-center text-gray-400">
          Showing 20 of {stats.totalPicks} total picks
        </div>
      </div>
    </div>
  )
}
