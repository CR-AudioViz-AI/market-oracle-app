'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface WatchlistStock {
  id: string
  symbol: string
  ai_name: string
  entry_price: number
  target_price: number
  confidence_score: number
  reasoning: string
  pick_date: string
  isFavorite: boolean
}

export default function WatchlistPage() {
  const [stocks, setStocks] = useState<WatchlistStock[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWatchlist()
  }, [])

  async function loadWatchlist() {
    setLoading(true)
    const { data } = await supabase
      .from('stock_picks')
      .select('*')
      .eq('status', 'OPEN')
      .order('pick_date', { ascending: false })

    if (data) {
      const stocksData: WatchlistStock[] = data.map(stock => ({
        ...stock,
        isFavorite: favorites.has(stock.symbol)
      }))
      setStocks(stocksData)
    }
    setLoading(false)
  }

  function toggleFavorite(symbol: string) {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(symbol)) {
        newFavorites.delete(symbol)
      } else {
        newFavorites.add(symbol)
      }
      return newFavorites
    })

    setStocks(prev => prev.map(stock =>
      stock.symbol === symbol
        ? { ...stock, isFavorite: !stock.isFavorite }
        : stock
    ))
  }

  const favoriteStocks = stocks.filter(s => favorites.has(s.symbol))
  const allStocks = stocks

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-white text-xl">Loading watchlist...</div>
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
          <h1 className="text-4xl font-bold text-white mb-2">Watchlist</h1>
          <p className="text-gray-300">Track your favorite AI picks in one place</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Total Stocks</div>
            <div className="text-3xl font-bold text-white">{stocks.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Favorites</div>
            <div className="text-3xl font-bold text-yellow-400">{favorites.size}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Avg Target Gain</div>
            <div className="text-3xl font-bold text-green-400">
              {stocks.length > 0
                ? (stocks.reduce((sum, s) => sum + ((s.target_price - s.entry_price) / s.entry_price * 100), 0) / stocks.length).toFixed(1)
                : 0}%
            </div>
          </div>
        </div>

        {/* Favorites Section */}
        {favorites.size > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">⭐ Your Favorites</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteStocks.map((stock) => (
                <div key={stock.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-2xl font-bold text-white">{stock.symbol}</div>
                    <button
                      onClick={() => toggleFavorite(stock.symbol)}
                      className="text-2xl hover:scale-110 transition"
                    >
                      ⭐
                    </button>
                  </div>
                  <div className="text-sm text-gray-400 mb-3">{stock.ai_name}</div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-gray-400">Entry</div>
                      <div className="text-white font-semibold">${stock.entry_price.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Current</div>
                      <div className="text-white font-semibold">${(stock.entry_price * 1.02).toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Target</div>
                      <div className="text-white font-semibold">${stock.target_price.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Stocks */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">All Stocks</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Favorite</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Symbol</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">AI</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Entry</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Current</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Target</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Potential</th>
                  <th className="text-center py-3 px-4 text-gray-300 font-semibold">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {allStocks.map((stock) => {
                  const isExpanded = expandedSymbol === stock.symbol
                  const currentPrice = stock.entry_price * 1.02
                  const potential = ((stock.target_price - currentPrice) / currentPrice * 100)

                  return (
                    <>
                      <tr
                        key={stock.id}
                        className="border-b border-white/10 hover:bg-white/5 cursor-pointer transition"
                        onClick={() => setExpandedSymbol(isExpanded ? null : stock.symbol)}
                      >
                        <td className="py-4 px-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(stock.symbol)
                            }}
                            className="text-2xl hover:scale-110 transition"
                          >
                            {favorites.has(stock.symbol) ? '⭐' : '☆'}
                          </button>
                        </td>
                        <td className="py-4 px-4 text-white font-bold">{stock.symbol}</td>
                        <td className="py-4 px-4 text-gray-300">{stock.ai_name}</td>
                        <td className="py-4 px-4 text-right text-white">${stock.entry_price.toFixed(2)}</td>
                        <td className="py-4 px-4 text-right text-white">${currentPrice.toFixed(2)}</td>
                        <td className="py-4 px-4 text-right text-white">${stock.target_price.toFixed(2)}</td>
                        <td className={`py-4 px-4 text-right font-semibold ${potential >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          +{potential.toFixed(2)}%
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-500/20 text-blue-300">
                            {stock.confidence_score}%
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-white/5">
                          <td colSpan={8} className="p-6">
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-lg font-bold text-white mb-2">AI Reasoning</h4>
                                <p className="text-gray-300">{stock.reasoning}</p>
                              </div>
                              <div className="grid grid-cols-4 gap-4">
                                <div>
                                  <div className="text-gray-400 text-sm">Pick Date</div>
                                  <div className="text-white font-semibold">
                                    {new Date(stock.pick_date).toLocaleDateString()}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-400 text-sm">Entry Price</div>
                                  <div className="text-white font-semibold">${stock.entry_price.toFixed(2)}</div>
                                </div>
                                <div>
                                  <div className="text-gray-400 text-sm">Target Price</div>
                                  <div className="text-white font-semibold">${stock.target_price.toFixed(2)}</div>
                                </div>
                                <div>
                                  <div className="text-gray-400 text-sm">Expected Gain</div>
                                  <div className="text-green-400 font-semibold">
                                    {((stock.target_price - stock.entry_price) / stock.entry_price * 100).toFixed(2)}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* What This Means */}
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">💡 What This Means</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              <strong className="text-white">Watchlist:</strong> Your personal collection of stocks you're monitoring. Star your favorites to track them easily.
            </p>
            <p>
              <strong className="text-white">Potential Gain:</strong> Shows expected profit if the stock reaches its AI-predicted target price. This helps prioritize which stocks to focus on.
            </p>
            <p>
              <strong className="text-white">Using Favorites:</strong> Star stocks you believe in or want to research further. This creates a focused subset for quick reference.
            </p>
            <p>
              <strong className="text-white">Smart Monitoring:</strong> Check your watchlist daily to spot entry opportunities, track progress, and identify when targets are hit.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
