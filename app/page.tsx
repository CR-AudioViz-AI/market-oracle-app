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

export default function DashboardPage() {
  const [picks, setPicks] = useState<StockPick[]>([])
  const [prices, setPrices] = useState<Record<string, StockPrice>>({})
  const [aiModelCount, setAiModelCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null)

  useEffect(() => {
    loadDashboardData()
    
    // Auto-refresh prices every 15 minutes
    const refreshInterval = setInterval(() => {
      loadPrices(picks.map(p => p.symbol))
    }, 15 * 60 * 1000)

    return () => clearInterval(refreshInterval)
  }, [])

  useEffect(() => {
    if (picks.length > 0) {
      loadPrices(picks.map(p => p.symbol))
    }
  }, [picks])

  async function loadDashboardData() {
    setLoading(true)
    
    // Load ALL active picks (not limited to 20)
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
      .select('id, ai_name, is_active')
      .eq('is_active', true)

    if (modelsData) {
      setAiModelCount(modelsData.length)
    }

    setLoading(false)
  }

  async function loadPrices(symbols: string[]) {
    if (symbols.length === 0) return

    try {
      // Remove duplicates
      const uniqueSymbols = [...new Set(symbols)]
      
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-3xl font-bold mb-4">Loading Market Oracle...</div>
          <div className="text-slate-400">Fetching real-time data...</div>
        </div>
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

  // Calculate top performers
  const picksWithGains = picks.map(pick => {
    const currentPrice = prices[pick.symbol]?.price || pick.entry_price
    const gain = ((currentPrice - pick.entry_price) / pick.entry_price) * 100
    return { ...pick, currentPrice, gain }
  }).sort((a, b) => b.gain - a.gain)

  const topPerformer = picksWithGains[0]
  const worstPerformer = picksWithGains[picksWithGains.length - 1]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-brand-cyan to-brand-navy">
            AI Stock Battle Dashboard
          </h1>
          <p className="text-xl text-slate-300">
            {aiModelCount} AI Models | {picks.length} Active Picks | Real-Time Data
          </p>
          {lastPriceUpdate && (
            <p className="text-sm text-slate-500 mt-2">
              Prices updated: {lastPriceUpdate.toLocaleTimeString()} (Auto-refreshes every 15 min)
            </p>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-brand-cyan/30 transition cursor-pointer">
            <div className="text-slate-400 text-sm mb-1">Total Active Picks</div>
            <div className="text-4xl font-bold text-white">{picks.length}</div>
            <div className="text-xs text-slate-500 mt-2">All AI picks combined</div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-brand-cyan/30 transition cursor-pointer">
            <div className="text-slate-400 text-sm mb-1">AI Models Active</div>
            <div className="text-4xl font-bold text-brand-cyan">{aiModelCount}</div>
            <div className="text-xs text-slate-500 mt-2">{Object.keys(aiGroups).join(', ')}</div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-green-500/30 transition cursor-pointer">
            <div className="text-slate-400 text-sm mb-1">Avg Confidence</div>
            <div className="text-4xl font-bold text-green-400">
              {picks.length > 0 ? (picks.reduce((sum, p) => sum + p.confidence_score, 0) / picks.length).toFixed(0) : 0}%
            </div>
            <div className="text-xs text-slate-500 mt-2">Weighted average</div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-500/30 transition cursor-pointer">
            <div className="text-slate-400 text-sm mb-1">Top Performer</div>
            <div className="text-2xl font-bold text-purple-400">
              {topPerformer ? topPerformer.symbol : 'N/A'}
            </div>
            <div className="text-sm text-green-400">
              {topPerformer ? `+${topPerformer.gain.toFixed(1)}%` : '--'}
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-red-500/30 transition cursor-pointer">
            <div className="text-slate-400 text-sm mb-1">Portfolio Value</div>
            <div className="text-4xl font-bold text-white">
              ${picks.reduce((sum, p) => {
                const currentPrice = prices[p.symbol]?.price || p.entry_price
                return sum + currentPrice
              }, 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-2">Real-time valuation</div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          {[
            { name: 'Portfolio', href: '/portfolio', icon: '💼', color: 'blue' },
            { name: 'Backtesting', href: '/backtesting', icon: '📊', color: 'green' },
            { name: 'Voting', href: '/voting', icon: '🗳️', color: 'purple' },
            { name: 'Paper Trade', href: '/paper-trading', icon: '📝', color: 'yellow' },
            { name: 'Watchlist', href: '/watchlist', icon: '⭐', color: 'pink' },
            { name: 'Community', href: '/community', icon: '💬', color: 'indigo' },
            { name: 'Alerts', href: '/alerts', icon: '🔔', color: 'red' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`bg-gradient-to-br from-${item.color}-500/20 to-${item.color}-600/20 hover:from-${item.color}-500/30 hover:to-${item.color}-600/30 border border-${item.color}-400/30 rounded-xl p-4 text-center transition`}
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <div className="font-semibold text-sm">{item.name}</div>
            </Link>
          ))}
        </div>

        {/* AI Pick Groups */}
        <div className="space-y-8">
          {Object.entries(aiGroups).map(([aiName, aiPicks]) => (
            <div key={aiName} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{aiName}</h2>
                <span className="px-4 py-2 bg-brand-cyan/20 text-brand-cyan rounded-full font-semibold">
                  {aiPicks.length} picks
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiPicks.slice(0, 9).map((pick) => {
                  const isExpanded = expandedId === pick.id
                  const priceData = prices[pick.symbol]
                  const currentPrice = priceData?.price || pick.entry_price
                  const gain = ((currentPrice - pick.entry_price) / pick.entry_price) * 100
                  const targetGain = ((pick.target_price - pick.entry_price) / pick.entry_price) * 100
                  const isWinning = gain > 0

                  return (
                    <Link
                      key={pick.id}
                      href={`/stock/${pick.symbol}`}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-brand-cyan/50 transition group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-2xl font-bold group-hover:text-brand-cyan transition">
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
                          <div className="text-xs text-blue-300">+{targetGain.toFixed(1)}%</div>
                        </div>
                      </div>

                      {pick.sector && (
                        <div className="text-xs text-slate-500 mb-2">
                          {pick.sector} {pick.catalyst && `• ${pick.catalyst}`}
                        </div>
                      )}

                      <div className="text-xs text-slate-500 mt-2 group-hover:text-brand-cyan transition">
                        Click for full analysis →
                      </div>
                    </Link>
                  )
                })}
              </div>

              {aiPicks.length > 9 && (
                <div className="mt-6 text-center">
                  <Link
                    href="/hot-picks"
                    className="inline-block px-6 py-3 bg-brand-cyan/20 hover:bg-brand-cyan/30 text-brand-cyan rounded-lg font-semibold transition border border-brand-cyan/30"
                  >
                    View All {aiPicks.length} Picks →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Additional Features */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/insights" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 text-center transition group">
            <div className="text-4xl mb-2">📈</div>
            <div className="font-semibold group-hover:text-brand-cyan transition">AI Insights</div>
          </Link>
          <Link href="/sectors" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 text-center transition group">
            <div className="text-4xl mb-2">🏭</div>
            <div className="font-semibold group-hover:text-brand-cyan transition">Sectors</div>
          </Link>
          <Link href="/charts" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 text-center transition group">
            <div className="text-4xl mb-2">📉</div>
            <div className="font-semibold group-hover:text-brand-cyan transition">Charts</div>
          </Link>
          <Link href="/export" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 text-center transition group">
            <div className="text-4xl mb-2">💾</div>
            <div className="font-semibold group-hover:text-brand-cyan transition">Export</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
