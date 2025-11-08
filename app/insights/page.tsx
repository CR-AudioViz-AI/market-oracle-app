'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface StockPick {
  id: string
  ticker: string
  ai_name: string
  price: number
  current_price: number
  target_price: number
  confidence_score: number
  reasoning: string
  picked_at: string
}

export default function InsightsPage() {
  const [picks, setPicks] = useState<StockPick[]>([])
  const [filteredPicks, setFilteredPicks] = useState<StockPick[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAI, setSelectedAI] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPick, setSelectedPick] = useState<StockPick | null>(null)
  
  // Available Indicators toggles
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

  async function loadPicks() {
    const { data } = await supabase
      .from('ai_stock_picks')
      .select('*')
      .order('picked_at', { ascending: false })

    if (data) {
      setPicks(data)
      if (data.length > 0) setSelectedPick(data[0])
    }
    setLoading(false)
  }

  function filterPicks() {
    let filtered = [...picks]

    if (selectedAI !== 'All') {
      filtered = filtered.filter(p => p.ai_name === selectedAI)
    }

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.ticker.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredPicks(filtered)
  }

  function calculateIndicators(pick: StockPick) {
    const currentPerf = ((pick.current_price - pick.price) / pick.price * 100)
    const targetDistance = ((pick.target_price - pick.current_price) / pick.current_price * 100)
    const riskReward = Math.abs(targetDistance / (currentPerf || 1))
    const momentum = currentPerf > 0 ? 'Bullish' : currentPerf < 0 ? 'Bearish' : 'Neutral'
    const volatility = Math.abs(currentPerf) > 10 ? 'High' : Math.abs(currentPerf) > 5 ? 'Medium' : 'Low'
    
    return {
      currentPerf,
      targetDistance,
      riskReward,
      momentum,
      volatility,
      confidence: pick.confidence_score
    }
  }

  const aiList = ['All', ...Array.from(new Set(picks.map(p => p.ai_name)))]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading AI Insights...</div>
      </div>
    )
  }

  const indicators = selectedPick ? calculateIndicators(selectedPick) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🔍 AI Insights</h1>
          <p className="text-gray-300">Deep dive into AI reasoning and technical indicators</p>
        </div>

        {/* Stock Selector */}
        <div className="bg-white/5 rounded-lg p-6 mb-8 border border-white/10">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-2">Select Stock</label>
              <select 
                onChange={(e) => {
                  const pick = picks.find(p => p.id === e.target.value)
                  setSelectedPick(pick || null)
                }}
                value={selectedPick?.id || ''}
                className="w-full bg-white/10 border border-white/20 rounded-lg p-3"
              >
                {picks.map(pick => (
                  <option key={pick.id} value={pick.id}>
                    {pick.ticker} - {pick.ai_name} - ${pick.current_price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2">Filter by AI</label>
              <select 
                value={selectedAI}
                onChange={(e) => setSelectedAI(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg p-3"
              >
                {aiList.map(ai => (
                  <option key={ai} value={ai}>{ai}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2">Search Ticker</label>
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="e.g. AAPL"
                className="w-full bg-white/10 border border-white/20 rounded-lg p-3"
              />
            </div>
          </div>
        </div>

        {selectedPick && indicators && (
          <>
            {/* Stock Summary */}
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg p-6 mb-8 border border-cyan-500/30">
              <div className="grid md:grid-cols-4 gap-6">
                <div>
                  <div className="text-3xl font-bold">{selectedPick.ticker}</div>
                  <div className="text-gray-300">{selectedPick.ai_name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Entry Price</div>
                  <div className="text-2xl font-mono">${selectedPick.price.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Current Price</div>
                  <div className="text-2xl font-mono">${selectedPick.current_price.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Target Price</div>
                  <div className="text-2xl font-mono">${selectedPick.target_price.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Available Indicators */}
            <div className="bg-white/5 rounded-lg p-6 mb-8 border border-white/10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">📊 Available Indicators</h2>
                <div className="text-sm text-gray-400">Toggle indicators on/off</div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Indicator 1: Current Performance */}
                <div className={`p-4 rounded-lg border-2 transition-all ${
                  showCurrentPerf ? 'bg-blue-500/20 border-blue-500' : 'bg-white/5 border-white/20'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">Current Performance</h3>
                      <p className="text-sm text-gray-400">Entry vs Current</p>
                    </div>
                    <button
                      onClick={() => setShowCurrentPerf(!showCurrentPerf)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        showCurrentPerf ? 'bg-blue-500 text-white' : 'bg-white/10'
                      }`}
                    >
                      {showCurrentPerf ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {showCurrentPerf && (
                    <>
                      <div className={`text-3xl font-bold mb-2 ${
                        indicators.currentPerf >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {indicators.currentPerf >= 0 ? '+' : ''}{indicators.currentPerf.toFixed(2)}%
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${indicators.currentPerf >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(Math.abs(indicators.currentPerf) * 5, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {indicators.currentPerf >= 0 ? 'Gaining' : 'Losing'} since AI picked it
                      </p>
                    </>
                  )}
                </div>

                {/* Indicator 2: Distance to Target */}
                <div className={`p-4 rounded-lg border-2 transition-all ${
                  showTargetDistance ? 'bg-purple-500/20 border-purple-500' : 'bg-white/5 border-white/20'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">Distance to Target</h3>
                      <p className="text-sm text-gray-400">How far to go</p>
                    </div>
                    <button
                      onClick={() => setShowTargetDistance(!showTargetDistance)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        showTargetDistance ? 'bg-purple-500 text-white' : 'bg-white/10'
                      }`}
                    >
                      {showTargetDistance ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {showTargetDistance && (
                    <>
                      <div className="text-3xl font-bold text-purple-400 mb-2">
                        {indicators.targetDistance.toFixed(2)}%
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500"
                          style={{ width: `${Math.min(Math.abs(indicators.targetDistance) * 5, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {indicators.targetDistance > 0 ? 'Target above current' : 'Target reached!'}
                      </p>
                    </>
                  )}
                </div>

                {/* Indicator 3: AI Confidence */}
                <div className={`p-4 rounded-lg border-2 transition-all ${
                  showConfidence ? 'bg-cyan-500/20 border-cyan-500' : 'bg-white/5 border-white/20'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">AI Confidence</h3>
                      <p className="text-sm text-gray-400">How sure is AI</p>
                    </div>
                    <button
                      onClick={() => setShowConfidence(!showConfidence)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        showConfidence ? 'bg-cyan-500 text-white' : 'bg-white/10'
                      }`}
                    >
                      {showConfidence ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {showConfidence && (
                    <>
                      <div className="text-3xl font-bold text-cyan-400 mb-2">
                        {indicators.confidence}%
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-cyan-500"
                          style={{ width: `${indicators.confidence}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {indicators.confidence >= 80 ? 'Very confident' : 
                         indicators.confidence >= 60 ? 'Moderately confident' : 'Lower confidence'}
                      </p>
                    </>
                  )}
                </div>

                {/* Indicator 4: Risk/Reward Ratio */}
                <div className={`p-4 rounded-lg border-2 transition-all ${
                  showRiskReward ? 'bg-yellow-500/20 border-yellow-500' : 'bg-white/5 border-white/20'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">Risk/Reward</h3>
                      <p className="text-sm text-gray-400">Potential vs risk</p>
                    </div>
                    <button
                      onClick={() => setShowRiskReward(!showRiskReward)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        showRiskReward ? 'bg-yellow-500 text-white' : 'bg-white/10'
                      }`}
                    >
                      {showRiskReward ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {showRiskReward && (
                    <>
                      <div className="text-3xl font-bold text-yellow-400 mb-2">
                        {indicators.riskReward.toFixed(2)}:1
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {indicators.riskReward > 2 ? 'Good' : indicators.riskReward > 1 ? 'Fair' : 'High risk'} risk/reward
                      </p>
                    </>
                  )}
                </div>

                {/* Indicator 5: Momentum */}
                <div className={`p-4 rounded-lg border-2 transition-all ${
                  showMomentum ? 'bg-green-500/20 border-green-500' : 'bg-white/5 border-white/20'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">Momentum Score</h3>
                      <p className="text-sm text-gray-400">Price direction</p>
                    </div>
                    <button
                      onClick={() => setShowMomentum(!showMomentum)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        showMomentum ? 'bg-green-500 text-white' : 'bg-white/10'
                      }`}
                    >
                      {showMomentum ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {showMomentum && (
                    <>
                      <div className={`text-3xl font-bold mb-2 ${
                        indicators.momentum === 'Bullish' ? 'text-green-400' : 
                        indicators.momentum === 'Bearish' ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {indicators.momentum === 'Bullish' ? '📈' : 
                         indicators.momentum === 'Bearish' ? '📉' : '➡️'} {indicators.momentum}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Price trend since entry
                      </p>
                    </>
                  )}
                </div>

                {/* Indicator 6: Volatility */}
                <div className={`p-4 rounded-lg border-2 transition-all ${
                  showVolatility ? 'bg-red-500/20 border-red-500' : 'bg-white/5 border-white/20'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">Volatility</h3>
                      <p className="text-sm text-gray-400">Price stability</p>
                    </div>
                    <button
                      onClick={() => setShowVolatility(!showVolatility)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        showVolatility ? 'bg-red-500 text-white' : 'bg-white/10'
                      }`}
                    >
                      {showVolatility ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {showVolatility && (
                    <>
                      <div className={`text-3xl font-bold mb-2 ${
                        indicators.volatility === 'High' ? 'text-red-400' : 
                        indicators.volatility === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {indicators.volatility}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {indicators.volatility === 'High' ? 'Large price swings' : 
                         indicators.volatility === 'Medium' ? 'Moderate movement' : 'Stable price'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="bg-white/5 rounded-lg p-6 mb-8 border border-white/10">
              <h2 className="text-2xl font-bold mb-4">🤖 AI Reasoning</h2>
              <div className="bg-white/5 p-4 rounded-lg">
                <p className="text-gray-300 leading-relaxed">{selectedPick.reasoning}</p>
              </div>
              <div className="mt-4 grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">AI Model:</span>
                  <span className="ml-2 font-bold">{selectedPick.ai_name}</span>
                </div>
                <div>
                  <span className="text-gray-400">Picked Date:</span>
                  <span className="ml-2 font-bold">{new Date(selectedPick.picked_at).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-400">Days Held:</span>
                  <span className="ml-2 font-bold">
                    {Math.floor((Date.now() - new Date(selectedPick.picked_at).getTime()) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* What This Means */}
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-6 border border-purple-500/30">
          <h2 className="text-2xl font-bold mb-4">💡 What This Means</h2>
          <div className="space-y-3 text-gray-300">
            <p>
              <strong className="text-white">Available Indicators</strong> are 6 different ways to analyze a stock pick. 
              Toggle them on/off to see which metrics matter most to you.
            </p>
            <p>
              <strong className="text-white">Current Performance</strong> shows if the stock is winning or losing since the AI picked it. 
              Green = making money, Red = losing money.
            </p>
            <p>
              <strong className="text-white">Distance to Target</strong> tells you how much further the stock needs to go to reach the AI's prediction. 
              Smaller numbers mean it's almost there!
            </p>
            <p>
              <strong className="text-white">Risk/Reward Ratio</strong> compares potential gain to current risk. 
              Higher numbers (like 3:1) mean more potential reward for the risk taken.
            </p>
            <p>
              <strong className="text-white">AI Reasoning</strong> shows exactly why the AI chose this stock. 
              This transparency helps you understand AI decision-making and learn investment strategies.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
