'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface WatchlistItem {
  id: string
  symbol: string
  added_at: string
  notes: string
  target_price?: number
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [newSymbol, setNewSymbol] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [newTargetPrice, setNewTargetPrice] = useState<number | undefined>()
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWatchlist()
    loadAvailableSymbols()
  }, [])

  async function loadAvailableSymbols() {
    const { data } = await supabase
      .from('stock_picks')
      .select('symbol')
      .eq('status', 'OPEN')

    if (data) {
      const symbols = Array.from(new Set(data.map(p => p.symbol)))
      setAvailableSymbols(symbols)
    }
  }

  function loadWatchlist() {
    const saved = localStorage.getItem('market_oracle_watchlist')
    if (saved) {
      setWatchlist(JSON.parse(saved))
    }
    setLoading(false)
  }

  function addToWatchlist() {
    if (!newSymbol) {
      alert('Please select a symbol')
      return
    }

    if (watchlist.some(item => item.symbol === newSymbol)) {
      alert('Symbol already in watchlist')
      return
    }

    const newItem: WatchlistItem = {
      id: `watch_${Date.now()}`,
      symbol: newSymbol,
      added_at: new Date().toISOString(),
      notes: newNotes,
      target_price: newTargetPrice
    }

    const updated = [newItem, ...watchlist]
    setWatchlist(updated)
    localStorage.setItem('market_oracle_watchlist', JSON.stringify(updated))

    // Reset form
    setNewSymbol('')
    setNewNotes('')
    setNewTargetPrice(undefined)
  }

  function removeFromWatchlist(id: string) {
    const updated = watchlist.filter(item => item.id !== id)
    setWatchlist(updated)
    localStorage.setItem('market_oracle_watchlist', JSON.stringify(updated))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-2xl">Loading watchlist...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="text-4xl font-bold mb-2">⭐ My Watchlist</h1>
        <p className="text-slate-400 mb-8">
          Track stocks you're interested in - your personal research list
        </p>

        {/* Instructions */}
        <div className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 mb-8">
          <h3 className="font-bold text-lg mb-4">💡 How to Use Your Watchlist</h3>
          
          <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-300">
            <div>
              <strong className="text-blue-400">📋 What is a Watchlist?</strong>
              <p className="mt-2">
                A watchlist is your personal list of stocks you're researching or considering for investment. 
                It's like bookmarking stocks you want to keep an eye on.
              </p>
            </div>

            <div>
              <strong className="text-green-400">✅ Why Use a Watchlist?</strong>
              <ul className="mt-2 space-y-1 ml-4">
                <li>• Track stocks before buying</li>
                <li>• Monitor price movements</li>
                <li>• Keep research notes</li>
                <li>• Set target prices</li>
              </ul>
            </div>

            <div>
              <strong className="text-purple-400">🎯 Best Practices</strong>
              <ul className="mt-2 space-y-1 ml-4">
                <li>• Add stocks you're researching</li>
                <li>• Write notes on why you're watching</li>
                <li>• Set target buy/sell prices</li>
                <li>• Review watchlist weekly</li>
              </ul>
            </div>

            <div>
              <strong className="text-yellow-400">⚠️ Important Tips</strong>
              <ul className="mt-2 space-y-1 ml-4">
                <li>• Watchlist ≠ Buy immediately</li>
                <li>• Do your own research first</li>
                <li>• Remove stocks you're no longer interested in</li>
                <li>• Use notes to track your thinking</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Add to Watchlist Form */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
          <h2 className="text-2xl font-bold mb-6">Add to Watchlist</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Stock Symbol *
              </label>
              <select
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="">Select symbol...</option>
                {availableSymbols.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Target Price (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={newTargetPrice || ''}
                onChange={(e) => setNewTargetPrice(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="e.g. 150.00"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={addToWatchlist}
                disabled={!newSymbol}
                className="w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white font-semibold rounded-lg transition"
              >
                Add to Watchlist
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes (Why are you watching this stock?)
            </label>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="e.g. High AI confidence, waiting for dip below $100, earnings coming up..."
              rows={2}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 resize-none"
            />
          </div>
        </div>

        {/* Watchlist Items */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Watchlist ({watchlist.length})</h2>

          {watchlist.length > 0 ? (
            <div className="space-y-4">
              {watchlist.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Link
                          href={`/stock/${item.symbol}`}
                          className="text-3xl font-bold hover:text-blue-400 transition"
                        >
                          {item.symbol}
                        </Link>
                        {item.target_price && (
                          <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-semibold">
                            Target: ${item.target_price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {item.notes && (
                        <div className="text-slate-300 mb-3">
                          <strong className="text-slate-400 text-sm">Notes:</strong> {item.notes}
                        </div>
                      )}

                      <div className="text-xs text-slate-500">
                        Added: {new Date(item.added_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/stock/${item.symbol}`}
                        className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition text-sm"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => removeFromWatchlist(item.id)}
                        className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-12 border border-white/10 text-center">
              <div className="text-6xl mb-4">⭐</div>
              <div className="text-2xl font-bold mb-2">Your Watchlist is Empty</div>
              <div className="text-slate-400 mb-4">
                Add stocks you're researching or considering for investment
              </div>
              <div className="text-sm text-slate-500">
                Tip: Start by adding hot picks or high-confidence AI recommendations
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
