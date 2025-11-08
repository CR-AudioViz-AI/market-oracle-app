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

interface ConsensusPick {
  ticker: string
  aiCount: number
  picks: StockPick[]
  avgEntry: number
  avgCurrent: number
  avgTarget: number
  avgConfidence: number
  consensusPercent: number
}

export default function HotPicksPage() {
  const [picks, setPicks] = useState<StockPick[]>([])
  const [consensusPicks, setConsensusPicks] = useState<ConsensusPick[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null)

  useEffect(() => {
    loadPicks()
  }, [])

  async function loadPicks() {
    const { data } = await supabase
      .from('ai_stock_picks')
      .select('*')
      .order('picked_at', { ascending: false })

    if (data) {
      setPicks(data)
      calculateConsensus(data)
    }
    setLoading(false)
  }

  function calculateConsensus(allPicks: StockPick[]) {
    const grouped = allPicks.reduce((acc, pick) => {
      if (!acc[pick.ticker]) {
        acc[pick.ticker] = []
      }
      acc[pick.ticker].push(pick)
      return acc
    }, {} as Record<string, StockPick[]>)

    const consensus = Object.entries(grouped)
      .filter(([_, picks]) => picks.length >= 2)
      .map(([ticker, picks]) => ({
        ticker,
        aiCount: picks.length,
        picks: picks.sort((a, b) => b.confidence_score - a.confidence_score),
        avgEntry: picks.reduce((sum, p) => sum + p.price, 0) / picks.length,
        avgCurrent: picks.reduce((sum, p) => sum + p.current_price, 0) / picks.length,
        avgTarget: picks.reduce((sum, p) => sum + p.target_price, 0) / picks.length,
        avgConfidence: picks.reduce((sum, p) => sum + p.confidence_score, 0) / picks.length,
        consensusPercent: (picks.length / 5) * 100
      }))
      .sort((a, b) => b.aiCount - a.aiCount)

    setConsensusPicks(consensus)
  }

  function calculatePerformance(entry: number, current: number) {
    return ((current - entry) / entry * 100).toFixed(2)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading Hot Picks...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🔥 Hot Picks</h1>
          <p className="text-gray-300">Stocks with AI consensus - multiple AIs agree these are winners</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 p-6 rounded-lg border border-red-500/30">
            <div className="text-3xl font-bold">{consensusPicks.filter(p => p.aiCount === 5).length}</div>
            <div className="text-gray-300">🔥 All 5 AIs Agree</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 p-6 rounded-lg border border-orange-500/30">
            <div className="text-3xl font-bold">{consensusPicks.filter(p => p.aiCount === 4).length}</div>
            <div className="text-gray-300">⭐ 4 AIs Agree</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/20 to-green-500/20 p-6 rounded-lg border border-yellow-500/30">
            <div className="text-3xl font-bold">{consensusPicks.filter(p => p.aiCount === 3).length}</div>
            <div className="text-gray-300">✓ 3 AIs Agree</div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 p-6 rounded-lg border border-green-500/30">
            <div className="text-3xl font-bold">{consensusPicks.filter(p => p.aiCount === 2).length}</div>
            <div className="text-gray-300">~ 2 AIs Agree</div>
          </div>
        </div>

        {/* Consensus Chart */}
        <div className="bg-white/5 rounded-lg p-6 mb-8 border border-white/10">
          <h2 className="text-2xl font-bold mb-4">📊 Consensus Strength</h2>
          <div className="h-64 flex items-end justify-around gap-4">
            {[5, 4, 3, 2].map(count => {
              const picksCount = consensusPicks.filter(p => p.aiCount === count).length
              const maxCount = Math.max(...[5, 4, 3, 2].map(c => consensusPicks.filter(p => p.aiCount === c).length))
              const height = maxCount > 0 ? (picksCount / maxCount * 100) : 0
              
              return (
                <div key={count} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-red-500 to-orange-500 rounded-t-lg transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <div className="text-center mt-2">
                    <div className="font-bold text-2xl">{picksCount}</div>
                    <div className="text-xs text-gray-400">{count} AIs</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Consensus Picks */}
        <div className="space-y-6">
          {consensusPicks.map(consensus => {
            const perf = parseFloat(calculatePerformance(consensus.avgEntry, consensus.avgCurrent))
            const isExpanded = expandedTicker === consensus.ticker
            
            return (
              <div key={consensus.ticker} className="bg-white/5 rounded-lg border border-white/10">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-3xl font-bold">{consensus.ticker}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          consensus.aiCount === 5 ? 'bg-red-500 text-white' :
                          consensus.aiCount === 4 ? 'bg-orange-500 text-white' :
                          consensus.aiCount === 3 ? 'bg-yellow-500 text-black' :
                          'bg-green-500 text-white'
                        }`}>
                          {consensus.aiCount}/5 AIs Agree ({consensus.consensusPercent}%)
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        {consensus.picks.map(p => p.ai_name).join(', ')}
                      </div>
                    </div>
                    <div className={`text-3xl font-bold ${perf >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {perf >= 0 ? '+' : ''}{perf}%
                    </div>
                  </div>

                  {/* Price Table */}
                  <div className="grid md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-400">Avg Entry</div>
                      <div className="text-2xl font-mono">${consensus.avgEntry.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Avg Current</div>
                      <div className="text-2xl font-mono">${consensus.avgCurrent.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Avg Target</div>
                      <div className="text-2xl font-mono">${consensus.avgTarget.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Avg Confidence</div>
                      <div className="text-2xl">{consensus.avgConfidence.toFixed(0)}%</div>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedTicker(isExpanded ? null : consensus.ticker)}
                    className="text-cyan-400 hover:text-cyan-300 text-sm"
                  >
                    {isExpanded ? '▲ Hide AI Details' : '▼ Show All AI Reasoning'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/10 p-6 bg-white/5">
                    <h4 className="font-bold text-lg mb-4">Individual AI Picks:</h4>
                    <div className="space-y-4">
                      {consensus.picks.map(pick => (
                        <div key={pick.id} className="bg-white/5 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="font-bold text-lg">{pick.ai_name}</div>
                              <div className="text-sm text-gray-400">{pick.confidence_score}% confident</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-400">Entry → Current → Target</div>
                              <div className="font-mono">
                                ${pick.price.toFixed(2)} → ${pick.current_price.toFixed(2)} → ${pick.target_price.toFixed(2)}
                              </div>
                            </div>
                          </div>
                          <div className="text-gray-300 text-sm leading-relaxed">
                            {pick.reasoning}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {consensusPicks.length === 0 && (
          <div className="bg-white/5 rounded-lg p-12 text-center border border-white/10">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold mb-2">No Consensus Picks Yet</h3>
            <p className="text-gray-400">
              Consensus picks appear when 2 or more AIs choose the same stock. Check back later!
            </p>
          </div>
        )}

        {/* What This Means */}
        <div className="mt-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-6 border border-purple-500/30">
          <h2 className="text-2xl font-bold mb-4">💡 What This Means</h2>
          <div className="space-y-3 text-gray-300">
            <p>
              <strong className="text-white">Consensus = Multiple AIs Agree.</strong> When 2 or more completely independent AI models pick the same stock, that's a powerful signal. They each analyzed the market differently but reached the same conclusion.
            </p>
            <p>
              <strong className="text-white">5/5 AIs = Strongest Consensus.</strong> If ALL 5 AIs picked the same stock, that's extremely rare and significant. These are the hottest picks with maximum AI confidence.
            </p>
            <p>
              <strong className="text-white">Average Prices</strong> show the consensus entry, current, and target. If 3 AIs picked at different times, we show the average to give you the overall consensus view.
            </p>
            <p>
              <strong className="text-white">Individual AI Reasoning</strong> (click Show Details) lets you see why each AI chose this stock. Compare their logic to understand different perspectives.
            </p>
            <p>
              Hot Picks have higher probability of success because multiple independent analyses confirmed the same opportunity. But remember: even strong consensus isn't guaranteed!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
