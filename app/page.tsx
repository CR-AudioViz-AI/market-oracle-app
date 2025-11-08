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
  symbol: string
  ai_name: string
  entry_price: number
  target_price: number
  confidence_score: number
  reasoning: string
  pick_date: string
  status: string
}

export default function DashboardPage() {
  const [picks, setPicks] = useState<StockPick[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadPicks()
  }, [])

  async function loadPicks() {
    setLoading(true)
    const { data } = await supabase
      .from('stock_picks')
      .select('*')
      .eq('status', 'OPEN')
      .order('pick_date', { ascending: false })
      .limit(20)

    if (data) {
      setPicks(data as StockPick[])
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading Market Oracle...</div>
      </div>
    )
  }

  // Group picks by AI
  const aiGroups = picks.reduce((acc, pick) => {
    if (!acc[pick.ai_name]) {
      acc[pick.ai_name] = []
    }
    acc[pick.ai_name].push(pick)
    return acc
  }, {} as Record<string, StockPick[]>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            🔮 Market Oracle
          </h1>
          <p className="text-xl text-gray-300">AI Battle: 5 Models Compete to Pick the Best Stocks</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Total Active Picks</div>
            <div className="text-3xl font-bold text-white">{picks.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">AI Models Active</div>
            <div className="text-3xl font-bold text-blue-400">{Object.keys(aiGroups).length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Avg Confidence</div>
            <div className="text-3xl font-bold text-green-400">
              {picks.length > 0 ? (picks.reduce((sum, p) => sum + p.confidence_score, 0) / picks.length).toFixed(0) : 0}%
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Avg Target Gain</div>
            <div className="text-3xl font-bold text-purple-400">
              {picks.length > 0 
                ? (picks.reduce((sum, p) => sum + ((p.target_price - p.entry_price) / p.entry_price * 100), 0) / picks.length).toFixed(1)
                : 0}%
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <Link href="/portfolio" className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border border-blue-400/30 rounded-xl p-4 text-center transition">
            <div className="text-3xl mb-2">💼</div>
            <div className="font-semibold">Portfolio</div>
          </Link>
          <Link href="/backtesting" className="bg-gradient-to-br from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 border border-green-400/30 rounded-xl p-4 text-center transition">
            <div className="text-3xl mb-2">📊</div>
            <div className="font-semibold">Backtesting</div>
          </Link>
          <Link href="/voting" className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 border border-purple-400/30 rounded-xl p-4 text-center transition">
            <div className="text-3xl mb-2">🗳️</div>
            <div className="font-semibold">Voting</div>
          </Link>
          <Link href="/paper-trading" className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 hover:from-yellow-500/30 hover:to-yellow-600/30 border border-yellow-400/30 rounded-xl p-4 text-center transition">
            <div className="text-3xl mb-2">📝</div>
            <div className="font-semibold">Paper Trade</div>
          </Link>
          <Link href="/watchlist" className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 hover:from-pink-500/30 hover:to-pink-600/30 border border-pink-400/30 rounded-xl p-4 text-center transition">
            <div className="text-3xl mb-2">⭐</div>
            <div className="font-semibold">Watchlist</div>
          </Link>
          <Link href="/community" className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 hover:from-indigo-500/30 hover:to-indigo-600/30 border border-indigo-400/30 rounded-xl p-4 text-center transition">
            <div className="text-3xl mb-2">💬</div>
            <div className="font-semibold">Community</div>
          </Link>
          <Link href="/alerts" className="bg-gradient-to-br from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 border border-red-400/30 rounded-xl p-4 text-center transition">
            <div className="text-3xl mb-2">🔔</div>
            <div className="font-semibold">Alerts</div>
          </Link>
        </div>

        {/* AI Pick Groups */}
        <div className="space-y-8">
          {Object.entries(aiGroups).map(([aiName, aiPicks]) => (
            <div key={aiName} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{aiName}</h2>
                <span className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full font-semibold">
                  {aiPicks.length} picks
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiPicks.slice(0, 6).map((pick) => {
                  const isExpanded = expandedId === pick.id
                  const currentPrice = pick.entry_price * 1.02 // Simulated current price
                  const gain = ((currentPrice - pick.entry_price) / pick.entry_price) * 100
                  const targetGain = ((pick.target_price - pick.entry_price) / pick.entry_price) * 100

                  return (
                    <div
                      key={pick.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : pick.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-2xl font-bold">{pick.symbol}</div>
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-semibold">
                          {pick.confidence_score}%
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                        <div>
                          <div className="text-gray-400">Entry</div>
                          <div className="font-semibold">${pick.entry_price.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Current</div>
                          <div className="font-semibold text-green-400">${currentPrice.toFixed(2)}</div>
                          <div className="text-xs text-green-300">+{gain.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Target</div>
                          <div className="font-semibold">${pick.target_price.toFixed(2)}</div>
                          <div className="text-xs text-blue-300">+{targetGain.toFixed(1)}%</div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <div className="text-gray-300 text-sm mb-2">AI Reasoning:</div>
                          <div className="text-gray-400 text-sm">{pick.reasoning}</div>
                          <div className="mt-3 text-xs text-gray-500">
                            Picked: {new Date(pick.pick_date).toLocaleDateString()}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 mt-2">
                        Click to {isExpanded ? 'hide' : 'show'} reasoning
                      </div>
                    </div>
                  )
                })}
              </div>

              {aiPicks.length > 6 && (
                <div className="mt-4 text-center">
                  <Link
                    href="/hot-picks"
                    className="inline-block px-6 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg font-semibold transition"
                  >
                    View All {aiPicks.length} Picks →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Additional Pages Links */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/insights" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 text-center transition">
            <div className="text-2xl mb-2">📈</div>
            <div className="font-semibold">Insights</div>
          </Link>
          <Link href="/sectors" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 text-center transition">
            <div className="text-2xl mb-2">🏭</div>
            <div className="font-semibold">Sectors</div>
          </Link>
          <Link href="/charts" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 text-center transition">
            <div className="text-2xl mb-2">📉</div>
            <div className="font-semibold">Charts</div>
          </Link>
          <Link href="/export" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 text-center transition">
            <div className="text-2xl mb-2">💾</div>
            <div className="font-semibold">Export</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
