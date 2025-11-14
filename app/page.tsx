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
  sector?: string
  catalyst?: string
}

interface StockPrice {
  price: number
  change: number
  changePercent: number
}

interface HotPick {
  symbol: string
  picks: StockPick[]
  aiCount: number
  avgConfidence: number
  highestConfidence: number
  entryPrice: number
  targetPrice: number
}

export default function DashboardPage() {
  const [picks, setPicks] = useState<StockPick[]>([])
  const [prices, setPrices] = useState<Record<string, StockPrice>>({})
  const [aiModelCount, setAiModelCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null)
  const [hotPicks, setHotPicks] = useState<HotPick[]>([])

  useEffect(() => {
    loadDashboardData()
    
    // Auto-refresh prices every 15 minutes
    const refreshInterval = setInterval(() => {
      if (picks.length > 0) {
        loadPrices(picks.map(p => p.symbol))
      }
    }, 15 * 60 * 1000)

    return () => clearInterval(refreshInterval)
  }, [])

  useEffect(() => {
    if (picks.length > 0) {
      loadPrices(picks.map(p => p.symbol))
      calculateHotPicks()
    }
  }, [picks])

  async function loadDashboardData() {
    setLoading(true)
    
    // Load ALL active picks
    const { data: picksData } = await supabase
      .from('stock_picks')
      .select('*')
      .eq('status', 'OPEN')
      .order('pick_date', { ascending: false })

    if (picksData) {
      setPicks(picksData as StockPick[])
    }

    // Get REAL AI model count from database
    const { data: modelsData } = await supabase
      .from('ai_models')
      .select('id, display_name, is_active')
      .eq('is_active', true)

    if (modelsData) {
      setAiModelCount(modelsData.length)
    }

    setLoading(false)
  }

  async function loadPrices(symbols: string[]) {
    if (symbols.length === 0) return

    try {
      const uniqueSymbols = Array.from(new Set(symbols))
      const response = await fetch(`/api/stock-price?symbols=${uniqueSymbols.join(',')}`)
      
      if (!response.ok) {
        console.error('Failed to fetch prices:', response.status)
        return
      }

      const data = await response.json()
      
      if (data.success) {
        setPrices(data.prices)
        setLastPriceUpdate(new Date(data.timestamp))
      }
    } catch (error) {
      console.error('Error loading prices:', error)
    }
  }

  function calculateHotPicks() {
    // Group picks by symbol
    const symbolGroups: Record<string, StockPick[]> = {}
    
    picks.forEach(pick => {
      if (!symbolGroups[pick.symbol]) {
        symbolGroups[pick.symbol] = []
      }
      symbolGroups[pick.symbol].push(pick)
    })

    // Calculate hot picks: stocks with 2+ AI picks OR 85%+ confidence
    const hot: HotPick[] = []
    
    Object.entries(symbolGroups).forEach(([symbol, stockPicks]) => {
      const aiCount = stockPicks.length
      const avgConfidence = stockPicks.reduce((sum, p) => sum + p.confidence_score, 0) / aiCount
      const highestConfidence = Math.max(...stockPicks.map(p => p.confidence_score))
      
      // Hot pick criteria: Multiple AIs OR very high confidence
      if (aiCount >= 2 || highestConfidence >= 85) {
        hot.push({
          symbol,
          picks: stockPicks,
          aiCount,
          avgConfidence,
          highestConfidence,
          entryPrice: stockPicks[0].entry_price,
          targetPrice: stockPicks[0].target_price
        })
      }
    })

    // Sort by AI count first, then confidence
    hot.sort((a, b) => {
      if (b.aiCount !== a.aiCount) return b.aiCount - a.aiCount
      return b.avgConfidence - a.avgConfidence
    })

    setHotPicks(hot)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-white text-3xl font-bold mb-4">Loading Market Oracle...</div>
          <div className="text-slate-400">Fetching real-time data...</div>
        </div>
      </div>
    )
  }

  // Calculate portfolio value
  const portfolioValue = picks.reduce((sum, p) => {
    const currentPrice = prices[p.symbol]?.price || p.entry_price
    return sum + currentPrice
  }, 0)

  // Calculate top performer
  const picksWithGains = picks.map(pick => {
    const currentPrice = prices[pick.symbol]?.price || pick.entry_price
    const gain = ((currentPrice - pick.entry_price) / pick.entry_price) * 100
    return { ...pick, currentPrice, gain }
  }).sort((a, b) => b.gain - a.gain)

  const topPerformer = picksWithGains[0]

  // Calculate average confidence
  const avgConfidence = picks.length > 0 
    ? (picks.reduce((sum, p) => sum + p.confidence_score, 0) / picks.length).toFixed(0)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            AI Stock Battle Dashboard
          </h1>
          <p className="text-xl text-slate-300">
            Real-Time AI Stock Picks | Live Market Data | Professional Analytics
          </p>
          {lastPriceUpdate && (
            <p className="text-sm text-slate-500 mt-2">
              Prices updated: {lastPriceUpdate.toLocaleTimeString()} (Auto-refreshes every 15 min)
            </p>
          )}
        </div>

        {/* CLICKABLE Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Link href="/all-picks" className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-blue-500/50 transition-all hover:scale-105 cursor-pointer group">
            <div className="text-slate-400 text-sm mb-1">Total Active Picks</div>
            <div className="text-4xl font-bold text-white group-hover:text-blue-400 transition">{picks.length}</div>
            <div className="text-xs text-slate-500 mt-2">Click to view all picks →</div>
          </Link>
          
          <Link href="/ai-models" className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-cyan-500/50 transition-all hover:scale-105 cursor-pointer group">
            <div className="text-slate-400 text-sm mb-1">AI Models Active</div>
            <div className="text-4xl font-bold text-cyan-400 group-hover:text-cyan-300 transition">{aiModelCount}</div>
            <div className="text-xs text-slate-500 mt-2">View AI model details →</div>
          </Link>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-green-500/50 transition-all hover:scale-105 cursor-pointer group relative">
            <div className="text-slate-400 text-sm mb-1">Avg Confidence</div>
            <div className="text-4xl font-bold text-green-400 group-hover:text-green-300 transition">{avgConfidence}%</div>
            <div className="text-xs text-slate-500 mt-2">Weighted average of all AI picks</div>
            
            {/* Tooltip on hover */}
            <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-slate-900 rounded-lg border border-green-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-xs">
              <strong>How It's Calculated:</strong>
              <p className="mt-1">Average confidence score across all {picks.length} active picks. Higher scores indicate stronger AI conviction.</p>
            </div>
          </div>
          
          <Link href={topPerformer ? `/stock/${topPerformer.symbol}` : '#'} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition-all hover:scale-105 cursor-pointer group">
            <div className="text-slate-400 text-sm mb-1">Top Performer</div>
            <div className="text-2xl font-bold text-purple-400 group-hover:text-purple-300 transition">
              {topPerformer ? topPerformer.symbol : 'N/A'}
            </div>
            <div className="text-sm text-green-400">
              {topPerformer ? `+${topPerformer.gain.toFixed(2)}% (+$${(topPerformer.currentPrice - topPerformer.entry_price).toFixed(2)})` : '--'}
            </div>
            <div className="text-xs text-slate-500 mt-1">Click for full analysis →</div>
          </Link>
          
          <Link href="/portfolio" className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-yellow-500/50 transition-all hover:scale-105 cursor-pointer group">
            <div className="text-slate-400 text-sm mb-1">Portfolio Value</div>
            <div className="text-3xl font-bold text-white group-hover:text-yellow-400 transition">
              ${portfolioValue.toLocaleString(undefined, {maximumFractionDigits: 0})}
            </div>
            <div className="text-xs text-slate-500 mt-2">View portfolio breakdown →</div>
          </Link>
        </div>

        {/* HOT PICKS - Multi-AI or High Confidence */}
        {hotPicks.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold">🔥 Hot Picks</h2>
              <span className="text-sm text-slate-400">
                Stocks with 2+ AI picks or 85%+ confidence
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotPicks.slice(0, 6).map((hotPick) => {
                const priceData = prices[hotPick.symbol]
                const currentPrice = priceData?.price || hotPick.entryPrice
                const gain = ((currentPrice - hotPick.entryPrice) / hotPick.entryPrice) * 100
                const isWinning = gain > 0

                return (
                  <Link
                    key={hotPick.symbol}
                    href={`/stock/${hotPick.symbol}`}
                    className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl p-6 border-2 border-orange-500/30 hover:border-orange-500/60 transition-all hover:scale-105 group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-3xl font-bold group-hover:text-orange-400 transition">
                        {hotPick.symbol}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="px-3 py-1 bg-orange-500/30 text-orange-200 rounded-full text-sm font-bold">
                          {hotPick.aiCount} AI{hotPick.aiCount > 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-slate-400 mt-1">
                          {hotPick.avgConfidence.toFixed(0)}% avg confidence
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                      <div>
                        <div className="text-slate-400">Current Price</div>
                        <div className={`font-semibold text-lg ${isWinning ? 'text-green-400' : 'text-red-400'}`}>
                          ${currentPrice.toFixed(2)}
                        </div>
                        <div className={`text-xs ${isWinning ? 'text-green-300' : 'text-red-300'}`}>
                          {isWinning ? '+' : ''}{gain.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">Picked By</div>
                        <div className="font-semibold text-sm">
                          {hotPick.picks.map(p => p.ai_name).join(', ')}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-orange-300 mt-2 group-hover:text-orange-200 transition">
                      Click for full analysis & AI reasoning →
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <Link href="/portfolio" className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border border-blue-400/30 rounded-xl p-4 text-center transition-all hover:scale-105">
            <div className="text-3xl mb-2">💼</div>
            <div className="font-semibold text-sm">Portfolio</div>
          </Link>
          <Link href="/backtesting" className="bg-gradient-to-br from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 border border-green-400/30 rounded-xl p-4 text-center transition-all hover:scale-105">
            <div className="text-3xl mb-2">📊</div>
            <div className="font-semibold text-sm">Backtesting</div>
          </Link>
          <Link href="/voting" className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 border border-purple-400/30 rounded-xl p-4 text-center transition-all hover:scale-105">
            <div className="text-3xl mb-2">🗳️</div>
            <div className="font-semibold text-sm">Voting</div>
          </Link>
          <Link href="/paper-trading" className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 hover:from-yellow-500/30 hover:to-yellow-600/30 border border-yellow-400/30 rounded-xl p-4 text-center transition-all hover:scale-105">
            <div className="text-3xl mb-2">📝</div>
            <div className="font-semibold text-sm">Paper Trade</div>
          </Link>
          <Link href="/watchlist" className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 hover:from-pink-500/30 hover:to-pink-600/30 border border-pink-400/30 rounded-xl p-4 text-center transition-all hover:scale-105">
            <div className="text-3xl mb-2">⭐</div>
            <div className="font-semibold text-sm">Watchlist</div>
          </Link>
          <Link href="/community" className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 hover:from-indigo-500/30 hover:to-indigo-600/30 border border-indigo-400/30 rounded-xl p-4 text-center transition-all hover:scale-105">
            <div className="text-3xl mb-2">💬</div>
            <div className="font-semibold text-sm">Community</div>
          </Link>
          <Link href="/alerts" className="bg-gradient-to-br from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 border border-red-400/30 rounded-xl p-4 text-center transition-all hover:scale-105">
            <div className="text-3xl mb-2">🔔</div>
            <div className="font-semibold text-sm">Alerts</div>
          </Link>
        </div>

        {/* All Picks by AI */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">All AI Picks</h2>
          
          {Object.entries(
            picks.reduce((acc, pick) => {
              if (!acc[pick.ai_name]) acc[pick.ai_name] = []
              acc[pick.ai_name].push(pick)
              return acc
            }, {} as Record<string, StockPick[]>)
          ).map(([aiName, aiPicks]) => (
            <div key={aiName} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">{aiName}</h3>
                <span className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full font-semibold">
                  {aiPicks.length} pick{aiPicks.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiPicks.slice(0, 6).map((pick) => {
                  const priceData = prices[pick.symbol]
                  const currentPrice = priceData?.price || pick.entry_price
                  const gain = ((currentPrice - pick.entry_price) / pick.entry_price) * 100
                  const isWinning = gain > 0

                  return (
                    <Link
                      key={pick.id}
                      href={`/stock/${pick.symbol}`}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-blue-500/50 transition-all hover:scale-105 group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-2xl font-bold group-hover:text-blue-400 transition">
                          {pick.symbol}
                        </div>
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-semibold">
                          {pick.confidence_score}%
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                        <div>
                          <div className="text-slate-400">Entry</div>
                          <div className="font-semibold">${pick.entry_price.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Current</div>
                          <div className={`font-semibold ${isWinning ? 'text-green-400' : 'text-red-400'}`}>
                            ${currentPrice.toFixed(2)}
                          </div>
                          <div className={`text-xs ${isWinning ? 'text-green-300' : 'text-red-300'}`}>
                            {isWinning ? '+' : ''}{gain.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Target</div>
                          <div className="font-semibold">${pick.target_price.toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="text-xs text-blue-300 mt-2 group-hover:text-blue-200 transition">
                        Click for full analysis →
                      </div>
                    </Link>
                  )
                })}
              </div>

              {aiPicks.length > 6 && (
                <div className="mt-4 text-center">
                  <Link
                    href={`/all-picks?ai=${encodeURIComponent(aiName)}`}
                    className="inline-block px-6 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg font-semibold transition"
                  >
                    View All {aiPicks.length} {aiName} Picks →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Additional Features */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/insights" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 text-center transition-all hover:scale-105 group">
            <div className="text-4xl mb-2">📈</div>
            <div className="font-semibold group-hover:text-blue-400 transition">AI Insights</div>
          </Link>
          <Link href="/sectors" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 text-center transition-all hover:scale-105 group">
            <div className="text-4xl mb-2">🏭</div>
            <div className="font-semibold group-hover:text-blue-400 transition">Sectors</div>
          </Link>
          <Link href="/charts" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 text-center transition-all hover:scale-105 group">
            <div className="text-4xl mb-2">📉</div>
            <div className="font-semibold group-hover:text-blue-400 transition">Charts</div>
          </Link>
          <Link href="/export" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 text-center transition-all hover:scale-105 group">
            <div className="text-4xl mb-2">💾</div>
            <div className="font-semibold group-hover:text-blue-400 transition">Export</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
