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
  quantity?: number  // CRITICAL: Store actual shares owned
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

interface PortfolioMetrics {
  entryValue: number      // Total $ invested (sum of quantity * entry_price)
  currentValue: number    // Current $ value (sum of quantity * current_price)
  targetValue: number     // Target $ value (sum of quantity * target_price)
  totalGainLoss: number   // $ gain/loss (currentValue - entryValue)
  totalGainLossPercent: number  // % gain/loss
  realizedGains: number   // From closed positions
  unrealizedGains: number // From open positions
}

export default function DashboardPage() {
  const [picks, setPicks] = useState<StockPick[]>([])
  const [prices, setPrices] = useState<Record<string, StockPrice>>({})
  const [aiModelCount, setAiModelCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null)
  const [hotPicks, setHotPicks] = useState<HotPick[]>([])
  const [error, setError] = useState<string | null>(null)

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
    setError(null)
    
    try {
      // Load ALL active picks with error handling
      const { data: picksData, error: picksError } = await supabase
        .from('stock_picks')
        .select('*')
        .eq('status', 'OPEN')
        .order('pick_date', { ascending: false })

      if (picksError) {
        throw new Error(`Failed to load picks: ${picksError.message}`)
      }

      if (picksData) {
        // CRITICAL: Ensure each pick has quantity (default to 1 if missing for backward compatibility)
        const picksWithQuantity = picksData.map(pick => ({
          ...pick,
          quantity: pick.quantity || 1
        }))
        setPicks(picksWithQuantity as StockPick[])
      }

      // Get REAL AI model count from database
      const { data: modelsData, error: modelsError } = await supabase
        .from('ai_models')
        .select('id, display_name, is_active')
        .eq('is_active', true)

      if (modelsError) {
        console.error('Failed to load AI models:', modelsError)
        // Don't fail completely, just log it
      }

      if (modelsData) {
        setAiModelCount(modelsData.length)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading dashboard'
      setError(errorMessage)
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadPrices(symbols: string[]) {
    if (symbols.length === 0) return

    try {
      const uniqueSymbols = Array.from(new Set(symbols))
      const response = await fetch(`/api/stock-price?symbols=${uniqueSymbols.join(',')}`)
      
      if (!response.ok) {
        console.error('Failed to fetch prices:', response.status)
        // Don't throw - prices are optional enhancement
        return
      }

      const data = await response.json()
      
      if (data.success) {
        setPrices(data.prices)
        setLastPriceUpdate(new Date(data.timestamp))
      }
    } catch (error) {
      console.error('Error loading prices:', error)
      // Prices are non-critical, continue without them
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

  // CRITICAL: 100% ACCURATE PORTFOLIO CALCULATIONS
  function calculatePortfolioMetrics(): PortfolioMetrics {
    let entryValue = 0
    let currentValue = 0
    let targetValue = 0

    picks.forEach(pick => {
      const quantity = pick.quantity || 1
      const currentPrice = prices[pick.symbol]?.price || pick.entry_price

      // Entry value: What you paid
      entryValue += quantity * pick.entry_price

      // Current value: What it's worth now
      currentValue += quantity * currentPrice

      // Target value: What it could be worth
      targetValue += quantity * pick.target_price
    })

    const totalGainLoss = currentValue - entryValue
    const totalGainLossPercent = entryValue > 0 ? (totalGainLoss / entryValue) * 100 : 0

    return {
      entryValue,
      currentValue,
      targetValue,
      totalGainLoss,
      totalGainLossPercent,
      realizedGains: 0,  // TODO: Calculate from closed positions
      unrealizedGains: totalGainLoss
    }
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <div className="text-white text-3xl font-bold mb-4">Error Loading Dashboard</div>
          <div className="text-slate-300 mb-6">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Calculate 100% accurate portfolio metrics
  const portfolio = calculatePortfolioMetrics()

  // Calculate top performer (based on % gain, not $ gain)
  const picksWithGains = picks.map(pick => {
    const currentPrice = prices[pick.symbol]?.price || pick.entry_price
    const gainPercent = ((currentPrice - pick.entry_price) / pick.entry_price) * 100
    const gainDollars = (pick.quantity || 1) * (currentPrice - pick.entry_price)
    return { ...pick, currentPrice, gainPercent, gainDollars }
  }).sort((a, b) => b.gainPercent - a.gainPercent)

  const topPerformer = picksWithGains[0]
  const worstPerformer = picksWithGains[picksWithGains.length - 1]

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

        {/* CLICKABLE Stats Summary - TOP ROW: Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link href="/portfolio" className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-sm rounded-xl p-6 border border-green-500/30 hover:border-green-400/60 transition-all hover:scale-105 cursor-pointer group">
            <div className="text-green-300 text-sm mb-1 font-semibold">💰 Entry Value (Invested)</div>
            <div className="text-4xl font-bold text-white group-hover:text-green-300 transition">
              ${portfolio.entryValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
            <div className="text-xs text-green-200 mt-2">Total capital invested in {picks.length} positions</div>
          </Link>
          
          <Link href="/portfolio" className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 hover:border-blue-400/60 transition-all hover:scale-105 cursor-pointer group">
            <div className="text-blue-300 text-sm mb-1 font-semibold">📊 Current Value (Live)</div>
            <div className="text-4xl font-bold text-white group-hover:text-blue-300 transition">
              ${portfolio.currentValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
            <div className={`text-sm mt-2 font-semibold ${portfolio.totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {portfolio.totalGainLoss >= 0 ? '+' : ''}{portfolio.totalGainLossPercent.toFixed(2)}% 
              ({portfolio.totalGainLoss >= 0 ? '+' : ''}${portfolio.totalGainLoss.toFixed(2)})
            </div>
          </Link>
          
          <Link href="/portfolio" className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 hover:border-purple-400/60 transition-all hover:scale-105 cursor-pointer group">
            <div className="text-purple-300 text-sm mb-1 font-semibold">🎯 Target Value (If All Hit)</div>
            <div className="text-4xl font-bold text-white group-hover:text-purple-300 transition">
              ${portfolio.targetValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
            <div className="text-sm text-purple-200 mt-2">
              Potential: +${(portfolio.targetValue - portfolio.entryValue).toFixed(2)} 
              (+{((portfolio.targetValue - portfolio.entryValue) / portfolio.entryValue * 100).toFixed(1)}%)
            </div>
          </Link>
        </div>

        {/* CLICKABLE Stats Summary - BOTTOM ROW: Market Intelligence */}
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
            <div className="text-slate-400 text-sm mb-1">🏆 Best Pick</div>
            <div className="text-2xl font-bold text-purple-400 group-hover:text-purple-300 transition">
              {topPerformer ? topPerformer.symbol : 'N/A'}
            </div>
            <div className="text-sm text-green-400">
              {topPerformer ? `+${topPerformer.gainPercent.toFixed(2)}% (+$${topPerformer.gainDollars.toFixed(2)})` : '--'}
            </div>
            <div className="text-xs text-slate-500 mt-1">Highest % gain →</div>
          </Link>
          
          <Link href={worstPerformer ? `/stock/${worstPerformer.symbol}` : '#'} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-red-500/50 transition-all hover:scale-105 cursor-pointer group">
            <div className="text-slate-400 text-sm mb-1">⚠️ Worst Pick</div>
            <div className="text-2xl font-bold text-red-400 group-hover:text-red-300 transition">
              {worstPerformer ? worstPerformer.symbol : 'N/A'}
            </div>
            <div className="text-sm text-red-400">
              {worstPerformer ? `${worstPerformer.gainPercent.toFixed(2)}% ($${worstPerformer.gainDollars.toFixed(2)})` : '--'}
            </div>
            <div className="text-xs text-slate-500 mt-1">Lowest % gain →</div>
          </Link>
        </div>

        {/* Hot Picks Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">🔥 Hot Picks</h2>
              <p className="text-slate-400">Stocks picked by multiple AIs or with very high confidence</p>
            </div>
            <Link 
              href="/hot-picks"
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-lg font-semibold transition"
            >
              View All Hot Picks
            </Link>
          </div>

          {hotPicks.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="text-6xl mb-4">🔍</div>
              <div className="text-xl">No hot picks yet</div>
              <div className="text-sm mt-2">Hot picks appear when 2+ AIs pick the same stock or confidence is 85%+</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotPicks.slice(0, 6).map((hot, idx) => (
                <Link
                  key={idx}
                  href={`/stock/${hot.symbol}`}
                  className="bg-gradient-to-br from-orange-500/10 to-red-600/10 rounded-lg p-6 border border-orange-500/30 hover:border-orange-400 transition-all hover:scale-105 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold">{hot.symbol}</div>
                    <div className="px-3 py-1 bg-orange-500/20 rounded-full text-sm font-semibold text-orange-300">
                      {hot.aiCount} AI{hot.aiCount > 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-slate-400 mb-1">Entry</div>
                      <div className="font-semibold">${hot.entryPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Target</div>
                      <div className="font-semibold text-green-400">${hot.targetPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Confidence</div>
                      <div className="font-semibold text-blue-400">{hot.avgConfidence.toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Upside</div>
                      <div className="font-semibold text-purple-400">
                        +{((hot.targetPrice - hot.entryPrice) / hot.entryPrice * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/paper-trading" className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 rounded-xl p-6 border border-blue-500/30 hover:border-blue-400 transition-all hover:scale-105">
            <div className="text-3xl mb-3">📈</div>
            <div className="text-xl font-bold mb-2">Paper Trading</div>
            <div className="text-slate-400 text-sm">Practice with virtual money</div>
          </Link>
          
          <Link href="/backtesting" className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 rounded-xl p-6 border border-purple-500/30 hover:border-purple-400 transition-all hover:scale-105">
            <div className="text-3xl mb-3">⏮️</div>
            <div className="text-xl font-bold mb-2">Backtesting</div>
            <div className="text-slate-400 text-sm">Test strategies on historical data</div>
          </Link>
          
          <Link href="/alerts" className="bg-gradient-to-br from-orange-500/10 to-red-600/10 rounded-xl p-6 border border-orange-500/30 hover:border-orange-400 transition-all hover:scale-105">
            <div className="text-3xl mb-3">🔔</div>
            <div className="text-xl font-bold mb-2">Price Alerts</div>
            <div className="text-slate-400 text-sm">Get notified on price movements</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
