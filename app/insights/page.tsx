'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, Brain, Target, AlertCircle, Activity } from 'lucide-react'

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

export default function InsightsPage() {
  const [picks, setPicks] = useState<StockPick[]>([])
  const [prices, setPrices] = useState<Record<string, StockPrice>>({})
  const [filteredPicks, setFilteredPicks] = useState<StockPick[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAI, setSelectedAI] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPick, setSelectedPick] = useState<StockPick | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  
  // Indicator toggles
  const [showCurrentPerf, setShowCurrentPerf] = useState(true)
  const [showTargetDistance, setShowTargetDistance] = useState(true)
  const [showConfidence, setShowConfidence] = useState(true)
  const [showRiskReward, setShowRiskReward] = useState(true)
  const [showMomentum, setShowMomentum] = useState(true)
  const [showVolatility, setShowVolatility] = useState(true)

  useEffect(() => {
    loadPicks()
  }, [])

  useEffect(() => {
    filterPicks()
  }, [picks, selectedAI, searchTerm])

  useEffect(() => {
    if (picks.length > 0) {
      loadPrices(picks.map(p => p.symbol))
    }
  }, [picks])

  async function loadPicks() {
    setLoading(true)
    
    const { data } = await supabase
      .from('stock_picks')
      .select('*')
      .eq('status', 'OPEN')
      .order('pick_date', { ascending: false })

    if (data && data.length > 0) {
      setPicks(data as StockPick[])
      setSelectedPick(data[0] as StockPick)
    }
    
    setLoading(false)
  }

  async function loadPrices(symbols: string[]) {
    if (symbols.length === 0) return

    try {
      const uniqueSymbols = Array.from(new Set(symbols))
      const response = await fetch(`/api/stock-price?symbols=${uniqueSymbols.join(',')}`)
      
      if (!response.ok) return

      const data = await response.json()
      
      if (data.success) {
        setPrices(data.prices)
        setLastUpdate(new Date(data.timestamp))
      }
    } catch (error) {
      console.error('Error loading prices:', error)
    }
  }

  function filterPicks() {
    let filtered = [...picks]

    if (selectedAI !== 'All') {
      filtered = filtered.filter(p => p.ai_name === selectedAI)
    }

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredPicks(filtered)
  }

  function calculateIndicators(pick: StockPick) {
    const currentPrice = prices[pick.symbol]?.price || pick.entry_price
    const currentPerf = ((currentPrice - pick.entry_price) / pick.entry_price * 100)
    const targetDistance = ((pick.target_price - currentPrice) / currentPrice * 100)
    const riskReward = targetDistance / Math.abs(currentPerf || 1)
    const momentum = currentPerf > 0 ? 'Bullish' : currentPerf < 0 ? 'Bearish' : 'Neutral'
    const volatility = Math.abs(currentPerf) > 10 ? 'High' : Math.abs(currentPerf) > 5 ? 'Medium' : 'Low'
    
    return {
      currentPrice,
      currentPerf,
      targetDistance,
      riskReward,
      momentum,
      volatility,
      confidence: pick.confidence_score
    }
  }

  // Get unique AI names from picks
  const aiList = ['All', ...Array.from(new Set(picks.map(p => p.ai_name)))]
  
  // Get unique stocks (group by symbol)
  const uniqueStocks = Array.from(new Set(picks.map(p => p.symbol))).sort()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-3xl font-bold mb-4">Loading AI Insights...</div>
          <div className="text-slate-400">Analyzing market data...</div>
        </div>
      </div>
    )
  }

  if (picks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <div className="text-white text-3xl font-bold mb-4">No Active Picks</div>
          <div className="text-slate-400 mb-6">Check back soon for AI analysis</div>
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

  const indicators = selectedPick ? calculateIndicators(selectedPick) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-brand-cyan hover:text-brand-cyan/80 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-brand-cyan to-brand-navy">
            AI Insights
          </h1>
          <p className="text-xl text-slate-300">Deep dive into AI reasoning and technical indicators</p>
          {lastUpdate && (
            <p className="text-sm text-slate-500 mt-2">
              Prices updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Stock Selector */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/10">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-2 text-slate-400">Select Stock</label>
              <select 
                onChange={(e) => {
                  const symbol = e.target.value
                  // Find first pick for this symbol
                  const pick = picks.find(p => p.symbol === symbol)
                  setSelectedPick(pick || null)
                }}
                value={selectedPick?.symbol || ''}
                className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
              >
                {uniqueStocks.map(symbol => {
                  const pickCount = picks.filter(p => p.symbol === symbol).length
                  const firstPick = picks.find(p => p.symbol === symbol)!
                  const currentPrice = prices[symbol]?.price || firstPick.entry_price
                  return (
                    <option key={symbol} value={symbol}>
                      {symbol} - {pickCount} AI{pickCount > 1 ? 's' : ''} - ${currentPrice.toFixed(2)}
                    </option>
                  )
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2 text-slate-400">Filter by AI</label>
              <select 
                value={selectedAI}
                onChange={(e) => setSelectedAI(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
              >
                {aiList.map(ai => (
                  <option key={ai} value={ai}>{ai}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2 text-slate-400">Search Symbol</label>
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="e.g. AAPL"
                className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-slate-500"
              />
            </div>
          </div>
        </div>

        {selectedPick && indicators && (
          <>
            {/* Stock Summary */}
            <div className="bg-gradient-to-br from-brand-cyan/20 to-brand-navy/20 rounded-xl p-6 mb-8 border border-brand-cyan/30">
              <div className="grid md:grid-cols-4 gap-6">
                <div>
                  <div className="text-4xl font-bold mb-1">{selectedPick.symbol}</div>
                  <div className="text-slate-300 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    {selectedPick.ai_name}
                  </div>
                  <div className="text-sm text-slate-400 mt-2">
                    Picked {new Date(selectedPick.pick_date).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Entry Price</div>
                  <div className="text-3xl font-mono font-bold">${selectedPick.entry_price.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Current Price</div>
                  <div className="text-3xl font-mono font-bold">${indicators.currentPrice.toFixed(2)}</div>
                  <div className={`text-sm font-semibold ${indicators.currentPerf >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {indicators.currentPerf >= 0 ? '+' : ''}{indicators.currentPerf.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Target Price</div>
                  <div className="text-3xl font-mono font-bold text-brand-cyan">${selectedPick.target_price.toFixed(2)}</div>
                  <div className="text-sm text-green-400 font-semibold">
                    +{(((selectedPick.target_price - selectedPick.entry_price) / selectedPick.entry_price) * 100).toFixed(2)}% potential
                  </div>
                </div>
              </div>
            </div>

            {/* Available Indicators */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Technical Indicators</h2>
                <div className="text-sm text-slate-400">Toggle indicators on/off</div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Indicator 1: Current Performance */}
                <div className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                  showCurrentPerf ? 'bg-blue-500/20 border-blue-500' : 'bg-white/5 border-white/20'
                }`} onClick={() => setShowCurrentPerf(!showCurrentPerf)}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">Current Performance</h3>
                      <p className="text-sm text-slate-400">Entry vs Current</p>
                    </div>
                    <Activity className="w-6 h-6 text-brand-cyan" />
                  </div>
                  <div className={`text-4xl font-bold mb-2 ${indicators.currentPerf >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {indicators.currentPerf >= 0 ? '+' : ''}{indicators.currentPerf.toFixed(2)}%
                  </div>
                  <div className="text-sm text-slate-300">
                    {indicators.currentPerf >= 0 ? 'Gaining' : 'Losing'} since entry at ${selectedPick.entry_price.toFixed(2)}
                  </div>
                </div>

                {/* Indicator 2: Target Distance */}
                <div className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                  showTargetDistance ? 'bg-purple-500/20 border-purple-500' : 'bg-white/5 border-white/20'
                }`} onClick={() => setShowTargetDistance(!showTargetDistance)}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">Target Distance</h3>
                      <p className="text-sm text-slate-400">Current to Target</p>
                    </div>
                    <Target className="w-6 h-6 text-brand-cyan" />
                  </div>
                  <div className="text-4xl font-bold text-brand-cyan mb-2">
                    +{indicators.targetDistance.toFixed(2)}%
                  </div>
                  <div className="text-sm text-slate-300">
                    Remaining upside to ${selectedPick.target_price.toFixed(2)}
                  </div>
                </div>

                {/* Indicator 3: Confidence Score */}
                <div className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                  showConfidence ? 'bg-green-500/20 border-green-500' : 'bg-white/5 border-white/20'
                }`} onClick={() => setShowConfidence(!showConfidence)}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">AI Confidence</h3>
                      <p className="text-sm text-slate-400">Model Certainty</p>
                    </div>
                    <Brain className="w-6 h-6 text-brand-cyan" />
                  </div>
                  <div className="text-4xl font-bold text-green-400 mb-2">
                    {indicators.confidence}%
                  </div>
                  <div className="text-sm text-slate-300">
                    {indicators.confidence >= 80 ? 'Very High' : indicators.confidence >= 70 ? 'High' : 'Moderate'} confidence level
                  </div>
                </div>

                {/* Indicator 4: Risk/Reward Ratio */}
                <div className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                  showRiskReward ? 'bg-yellow-500/20 border-yellow-500' : 'bg-white/5 border-white/20'
                }`} onClick={() => setShowRiskReward(!showRiskReward)}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">Risk/Reward</h3>
                      <p className="text-sm text-slate-400">Ratio Analysis</p>
                    </div>
                    <TrendingUp className="w-6 h-6 text-brand-cyan" />
                  </div>
                  <div className="text-4xl font-bold text-yellow-400 mb-2">
                    {indicators.riskReward.toFixed(2)}:1
                  </div>
                  <div className="text-sm text-slate-300">
                    {indicators.riskReward > 2 ? 'Favorable' : indicators.riskReward > 1 ? 'Balanced' : 'Cautious'} setup
                  </div>
                </div>

                {/* Indicator 5: Momentum */}
                <div className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                  showMomentum ? 'bg-orange-500/20 border-orange-500' : 'bg-white/5 border-white/20'
                }`} onClick={() => setShowMomentum(!showMomentum)}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">Momentum</h3>
                      <p className="text-sm text-slate-400">Trend Direction</p>
                    </div>
                    {indicators.momentum === 'Bullish' ? (
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-400" />
                    )}
                  </div>
                  <div className={`text-4xl font-bold mb-2 ${
                    indicators.momentum === 'Bullish' ? 'text-green-400' : 
                    indicators.momentum === 'Bearish' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {indicators.momentum}
                  </div>
                  <div className="text-sm text-slate-300">
                    Current trend is {indicators.momentum.toLowerCase()}
                  </div>
                </div>

                {/* Indicator 6: Volatility */}
                <div className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                  showVolatility ? 'bg-red-500/20 border-red-500' : 'bg-white/5 border-white/20'
                }`} onClick={() => setShowVolatility(!showVolatility)}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">Volatility</h3>
                      <p className="text-sm text-slate-400">Price Movement</p>
                    </div>
                    <Activity className="w-6 h-6 text-brand-cyan" />
                  </div>
                  <div className={`text-4xl font-bold mb-2 ${
                    indicators.volatility === 'High' ? 'text-red-400' : 
                    indicators.volatility === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {indicators.volatility}
                  </div>
                  <div className="text-sm text-slate-300">
                    {indicators.volatility} price fluctuation
                  </div>
                </div>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/10">
              <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                <Brain className="w-8 h-8 text-brand-cyan" />
                AI Analysis & Reasoning
              </h2>
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">
                  {selectedPick.reasoning}
                </p>
              </div>
              
              {selectedPick.catalyst && (
                <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-400 mb-2">Key Catalyst</h4>
                  <p className="text-slate-300">{selectedPick.catalyst}</p>
                </div>
              )}
              
              {selectedPick.sector && (
                <div className="mt-4 bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-400 mb-2">Sector</h4>
                  <p className="text-slate-300">{selectedPick.sector}</p>
                </div>
              )}
            </div>

            {/* View Full Details Link */}
            <div className="text-center">
              <Link
                href={`/stock/${selectedPick.symbol}`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-cyan to-brand-navy rounded-lg font-semibold hover:opacity-90 transition text-lg"
              >
                View Full Stock Details
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
