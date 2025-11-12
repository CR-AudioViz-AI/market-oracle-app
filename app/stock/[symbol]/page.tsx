'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, Clock, Target, Brain, DollarSign, AlertCircle } from 'lucide-react'

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
  exit_price?: number
  exit_date?: string
}

interface StockPrice {
  price: number
  change: number
  changePercent: number
  high: number
  low: number
  volume: number
}

export default function StockDetailPage() {
  const params = useParams()
  const router = useRouter()
  const symbol = params?.symbol as string

  const [picks, setPicks] = useState<StockPick[]>([])
  const [currentPrice, setCurrentPrice] = useState<StockPrice | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    if (symbol) {
      loadStockData()
      
      // Auto-refresh price every 5 minutes
      const interval = setInterval(() => {
        loadStockPrice()
      }, 5 * 60 * 1000)

      return () => clearInterval(interval)
    }
  }, [symbol])

  async function loadStockData() {
    setLoading(true)

    // Load ALL picks for this symbol (both active and closed)
    const { data: picksData } = await supabase
      .from('stock_picks')
      .select('*')
      .eq('symbol', symbol.toUpperCase())
      .order('pick_date', { ascending: false })

    if (picksData && picksData.length > 0) {
      setPicks(picksData as StockPick[])
      await loadStockPrice()
    }

    setLoading(false)
  }

  async function loadStockPrice() {
    try {
      const response = await fetch(`/api/stock-price?symbols=${symbol.toUpperCase()}`)
      
      if (!response.ok) {
        console.error('Failed to fetch price')
        return
      }

      const data = await response.json()
      
      if (data.success && data.prices[symbol.toUpperCase()]) {
        setCurrentPrice(data.prices[symbol.toUpperCase()])
        setLastUpdate(new Date(data.timestamp))
      }
    } catch (error) {
      console.error('Error loading price:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-3xl font-bold mb-4">Loading {symbol}...</div>
          <div className="text-slate-400">Fetching stock data...</div>
        </div>
      </div>
    )
  }

  if (picks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <div className="text-white text-3xl font-bold mb-4">Stock Not Found</div>
          <div className="text-slate-400 mb-6">No AI picks found for {symbol}</div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-cyan to-brand-navy rounded-lg font-semibold hover:opacity-90 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Calculate overall performance
  const activePicks = picks.filter(p => p.status === 'OPEN')
  const closedPicks = picks.filter(p => p.status === 'CLOSED')
  
  const avgEntry = activePicks.reduce((sum, p) => sum + p.entry_price, 0) / (activePicks.length || 1)
  const avgTarget = activePicks.reduce((sum, p) => sum + p.target_price, 0) / (activePicks.length || 1)
  const avgConfidence = activePicks.reduce((sum, p) => sum + p.confidence_score, 0) / (activePicks.length || 1)

  const currentGain = currentPrice ? ((currentPrice.price - avgEntry) / avgEntry) * 100 : 0
  const targetGain = ((avgTarget - avgEntry) / avgEntry) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-brand-cyan hover:text-brand-cyan/80 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Link>

        {/* Stock Overview */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left: Stock Info */}
            <div className="flex-1">
              <h1 className="text-5xl font-bold mb-2">{symbol.toUpperCase()}</h1>
              <p className="text-slate-400 text-lg mb-4">
                {activePicks.length} Active Pick{activePicks.length !== 1 ? 's' : ''} • {closedPicks.length} Closed
              </p>
              
              {currentPrice && currentPrice.price != null && (
                <div className="flex items-baseline gap-4 mb-2">
                  <span className="text-4xl font-bold">${currentPrice.price.toFixed(2)}</span>
                  {currentPrice.changePercent != null && (
                    <span className={`text-2xl font-semibold ${currentPrice.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {currentPrice.changePercent >= 0 ? '+' : ''}{currentPrice.changePercent.toFixed(2)}%
                    </span>
                  )}
                </div>
              )}
              
              {lastUpdate && (
                <p className="text-sm text-slate-500">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </p>
              )}
            </div>

            {/* Right: Performance Metrics */}
            <div className="grid grid-cols-2 gap-4 lg:w-96">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="text-slate-400 text-sm mb-1">Avg Entry</div>
                <div className="text-2xl font-bold">${avgEntry.toFixed(2)}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="text-slate-400 text-sm mb-1">Avg Target</div>
                <div className="text-2xl font-bold">${avgTarget.toFixed(2)}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="text-slate-400 text-sm mb-1">Current Gain</div>
                <div className={`text-2xl font-bold ${currentGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {currentGain >= 0 ? '+' : ''}{currentGain.toFixed(2)}%
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="text-slate-400 text-sm mb-1">Target Gain</div>
                <div className="text-2xl font-bold text-brand-cyan">+{targetGain.toFixed(2)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Price Details */}
        {currentPrice && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-slate-400 text-sm mb-1">Current Price</div>
              <div className="text-2xl font-bold">${currentPrice.price?.toFixed(2) || 'N/A'}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-slate-400 text-sm mb-1">Day Change</div>
              <div className={`text-2xl font-bold ${(currentPrice.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {currentPrice.change != null ? `$${Math.abs(currentPrice.change).toFixed(2)}` : 'N/A'}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-slate-400 text-sm mb-1">Day High</div>
              <div className="text-2xl font-bold">${currentPrice.high?.toFixed(2) || 'N/A'}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-slate-400 text-sm mb-1">Day Low</div>
              <div className="text-2xl font-bold">${currentPrice.low?.toFixed(2) || 'N/A'}</div>
            </div>
          </div>
        )}

        {/* AI Picks */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">AI Analysis & Picks</h2>
          
          {/* Active Picks */}
          {activePicks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-brand-cyan">Active Positions</h3>
              {activePicks.map(pick => {
                const pickGain = currentPrice
                  ? ((currentPrice.price - pick.entry_price) / pick.entry_price) * 100
                  : 0

                return (
                  <div key={pick.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-brand-cyan/30 transition">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Brain className="w-6 h-6 text-brand-cyan" />
                          <span className="text-2xl font-bold">{pick.ai_name}</span>
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                            ACTIVE
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm">
                          Picked on {new Date(pick.pick_date).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-slate-400 text-sm">Confidence</div>
                          <div className="text-2xl font-bold">{pick.confidence_score}%</div>
                        </div>
                        {currentPrice && (
                          <div className="text-right">
                            <div className="text-slate-400 text-sm">Performance</div>
                            <div className={`text-2xl font-bold ${pickGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {pickGain >= 0 ? '+' : ''}{pickGain.toFixed(2)}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="text-slate-400 text-xs mb-1">Entry Price</div>
                        <div className="text-lg font-bold">${pick.entry_price.toFixed(2)}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="text-slate-400 text-xs mb-1">Target Price</div>
                        <div className="text-lg font-bold text-brand-cyan">${pick.target_price.toFixed(2)}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="text-slate-400 text-xs mb-1">Upside</div>
                        <div className="text-lg font-bold text-green-400">
                          +{(((pick.target_price - pick.entry_price) / pick.entry_price) * 100).toFixed(1)}%
                        </div>
                      </div>
                      {pick.sector && (
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="text-slate-400 text-xs mb-1">Sector</div>
                          <div className="text-sm font-semibold">{pick.sector}</div>
                        </div>
                      )}
                    </div>

                    {/* AI Reasoning */}
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        AI Analysis
                      </h4>
                      <p className="text-slate-300 text-sm leading-relaxed">{pick.reasoning}</p>
                    </div>

                    {pick.catalyst && (
                      <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-blue-400 mb-1">Catalyst</h4>
                        <p className="text-sm text-slate-300">{pick.catalyst}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Closed Picks */}
          {closedPicks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-400">Historical Positions</h3>
              {closedPicks.map(pick => {
                const finalGain = pick.exit_price
                  ? ((pick.exit_price - pick.entry_price) / pick.entry_price) * 100
                  : 0

                return (
                  <div key={pick.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 opacity-75">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Brain className="w-5 h-5 text-slate-400" />
                          <span className="text-xl font-bold">{pick.ai_name}</span>
                          <span className="px-3 py-1 bg-slate-500/20 text-slate-400 rounded-full text-sm font-semibold">
                            CLOSED
                          </span>
                        </div>
                        <p className="text-slate-500 text-sm">
                          {new Date(pick.pick_date).toLocaleDateString()} - {pick.exit_date ? new Date(pick.exit_date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>

                      {pick.exit_price && (
                        <div className="text-right">
                          <div className="text-slate-400 text-sm">Final Return</div>
                          <div className={`text-2xl font-bold ${finalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {finalGain >= 0 ? '+' : ''}{finalGain.toFixed(2)}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
