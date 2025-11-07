"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function WatchlistPage() {
  const [picks, setPicks] = useState<any[]>([])
  const [watchlist, setWatchlist] = useState<string[]>([])

  useEffect(() => {
    fetchPicks()
  }, [])

  async function fetchPicks() {
    const { data } = await supabase.from('stock_picks').select('*').limit(30)
    if (data) setPicks(data)
  }

  function addToWatchlist(symbol: string) {
    if (!watchlist.includes(symbol)) {
      setWatchlist([...watchlist, symbol])
    }
  }

  function removeFromWatchlist(symbol: string) {
    setWatchlist(watchlist.filter(s => s !== symbol))
  }

  const watchedPicks = picks.filter(p => watchlist.includes(p.symbol))

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-4">
          ⭐ Watchlist
        </h1>
        <p className="text-xl text-gray-300 mb-2">Your favorite picks in one place</p>
        <p className="text-gray-400">Track the stocks you care about. Get notified on price changes 📊</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Watched Stocks */}
        <div className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20">
          <h2 className="text-2xl font-bold mb-6">💫 Your Watchlist ({watchlist.length})</h2>
          {watchedPicks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👀</div>
              <p className="text-gray-400">Add stocks from the right to start tracking!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {watchedPicks.map((pick) => (
                <div key={pick.id} className="bg-slate-900/50 rounded-lg p-6 border border-purple-500/20">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-2xl font-bold text-white mb-1">${pick.symbol}</div>
                      <div className="text-sm text-gray-400">{pick.ai_name}</div>
                    </div>
                    <button 
                      onClick={() => removeFromWatchlist(pick.symbol)}
                      className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm hover:bg-red-500/30 transition"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/50 rounded p-3">
                      <div className="text-xs text-gray-400">Current</div>
                      <div className="font-bold text-blue-400">${pick.entry_price.toFixed(2)}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-3">
                      <div className="text-xs text-gray-400">Target</div>
                      <div className="font-bold text-green-400">${pick.target_price.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Picks */}
        <div className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20">
          <h2 className="text-2xl font-bold mb-6">➕ Add to Watchlist</h2>
          <div className="space-y-4">
            {picks.filter(p => !watchlist.includes(p.symbol)).slice(0, 10).map((pick) => (
              <div key={pick.id} className="bg-slate-900/50 rounded-lg p-4 border border-purple-500/20 hover:border-purple-400 transition cursor-pointer"
                   onClick={() => addToWatchlist(pick.symbol)}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-lg font-bold text-white">${pick.symbol}</div>
                    <div className="text-sm text-gray-400">{pick.ai_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">
                      +{(((pick.target_price - pick.entry_price) / pick.entry_price) * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-purple-400">{pick.confidence_score}% conf</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
