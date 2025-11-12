'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Flame, Brain } from 'lucide-react'

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

interface ConsensusPick {
  symbol: string
  aiCount: number
  picks: StockPick[]
  avgEntry: number
  avgTarget: number
  avgConfidence: number
  consensusPercent: number
}

export default function HotPicksPage() {
  const [picks, setPicks] = useState<StockPick[]>([])
  const [consensusPicks, setConsensusPicks] = useState<ConsensusPick[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null)

  useEffect(() => {
    loadPicks()
  }, [])

  async function loadPicks() {
    const { data } = await supabase
      .from('stock_picks')
      .select('*')
      .eq('status', 'OPEN')
      .order('pick_date', { ascending: false })

    if (data) {
      setPicks(data as StockPick[])
      calculateConsensus(data as StockPick[])
    }
    setLoading(false)
  }

  function calculateConsensus(allPicks: StockPick[]) {
    // Group by symbol
    const grouped = allPicks.reduce((acc, pick) => {
      if (!acc[pick.symbol]) {
        acc[pick.symbol] = []
      }
      acc[pick.symbol].push(pick)
      return acc
    }, {} as Record<string, StockPick[]>)

    // Calculate consensus for stocks picked by 2+ AIs
    const consensus = Object.entries(grouped)
      .filter(([_, picks]) => picks.length >= 2)
      .map(([symbol, picks]) => ({
        symbol,
        aiCount: picks.length,
        picks: picks.sort((a, b) => b.confidence_score - a.confidence_score),
        avgEntry: picks.reduce((sum, p) => sum + p.entry_price, 0) / picks.length,
        avgTarget: picks.reduce((sum, p) => sum + p.target_price, 0) / picks.length,
        avgConfidence: picks.reduce((sum, p) => sum + p.confidence_score, 0) / picks.length,
        consensusPercent: (picks.length / 5) * 100 // 5 AIs total
      }))
      .sort((a, b) => b.aiCount - a.aiCount)

    setConsensusPicks(consensus)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-3xl font-bold mb-4">Loading Hot Picks...</div>
          <div className="text-slate-400">Finding AI consensus...</div>
        </div>
      </div>
    )
  }

  // Count consensus levels
  const allAIsAgree = consensusPicks.filter(p => p.aiCount === 5).length
  const fourAIsAgree = consensusPicks.filter(p => p.aiCount === 4).length
  const threeAIsAgree = consensusPicks.filter(p => p.aiCount === 3).length
  const twoAIsAgree = consensusPicks.filter(p => p.aiCount === 2).length

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
          <h1 className="text-5xl font-bold mb-3 flex items-center gap-3">
            <Flame className="w-12 h-12 text-orange-500" />
            Hot Picks
          </h1>
          <p className="text-xl text-slate-300">
            Stocks with AI consensus - multiple AIs agree these are winners
          </p>
        </div>

        {/* Consensus Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-xl p-6 border border-orange-500/30">
            <div className="text-4xl font-bold mb-2">{allAIsAgree}</div>
            <div className="text-sm text-slate-300">🔥 All 5 AIs Agree</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/30">
            <div className="text-4xl font-bold mb-2">{fourAIsAgree}</div>
            <div className="text-sm text-slate-300">⭐ 4 AIs Agree</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
            <div className="text-4xl font-bold mb-2">{threeAIsAgree}</div>
            <div className="text-sm text-slate-300">✓ 3 AIs Agree</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
            <div className="text-4xl font-bold mb-2">{twoAIsAgree}</div>
            <div className="text-sm text-slate-300">~ 2 AIs Agree</div>
          </div>
        </div>

        {/* Consensus Strength Chart */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/10">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Brain className="w-6 h-6 text-brand-cyan" />
            Consensus Strength
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { count: 5, label: '5 AIs', stocks: allAIsAgree },
              { count: 4, label: '4 AIs', stocks: fourAIsAgree },
              { count: 3, label: '3 AIs', stocks: threeAIsAgree },
              { count: 2, label: '2 AIs', stocks: twoAIsAgree }
            ].map(level => (
              <div key={level.count} className="text-center">
                <div className="text-6xl font-bold text-brand-cyan mb-2">
                  {level.stocks}
                </div>
                <div className="text-slate-400">{level.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Consensus Picks */}
        {consensusPicks.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-12 border border-white/10 text-center">
            <Flame className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">No Consensus Picks Yet</h3>
            <p className="text-slate-400">
              Hot Picks appear when 2 or more AIs select the same stock. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {consensusPicks.map(consensus => (
              <div
                key={consensus.symbol}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-brand-cyan/30 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <Link
                        href={`/stock/${consensus.symbol}`}
                        className="text-3xl font-bold hover:text-brand-cyan transition"
                      >
                        {consensus.symbol}
                      </Link>
                      <span className={`px-4 py-2 rounded-full font-semibold text-sm ${
                        consensus.aiCount === 5 ? 'bg-orange-500/20 text-orange-400' :
                        consensus.aiCount === 4 ? 'bg-yellow-500/20 text-yellow-400' :
                        consensus.aiCount === 3 ? 'bg-blue-500/20 text-blue-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {consensus.aiCount} AIs ({consensus.consensusPercent.toFixed(0)}% consensus)
                      </span>
                    </div>
                    <div className="text-slate-400 text-sm">
                      Picked by: {consensus.picks.map(p => p.ai_name).join(', ')}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-slate-400 text-sm mb-1">Avg Entry</div>
                      <div className="text-xl font-bold">${consensus.avgEntry.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-400 text-sm mb-1">Avg Target</div>
                      <div className="text-xl font-bold text-brand-cyan">${consensus.avgTarget.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-400 text-sm mb-1">Avg Confidence</div>
                      <div className="text-xl font-bold text-green-400">{consensus.avgConfidence.toFixed(0)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-400 text-sm mb-1">Upside</div>
                      <div className="text-xl font-bold text-green-400">
                        +{(((consensus.avgTarget - consensus.avgEntry) / consensus.avgEntry) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Individual AI Picks */}
                <div className="mt-4">
                  <button
                    onClick={() => setExpandedSymbol(expandedSymbol === consensus.symbol ? null : consensus.symbol)}
                    className="text-brand-cyan hover:text-brand-cyan/80 transition text-sm font-semibold mb-3"
                  >
                    {expandedSymbol === consensus.symbol ? '▼' : '▶'} View Individual AI Picks ({consensus.aiCount})
                  </button>

                  {expandedSymbol === consensus.symbol && (
                    <div className="grid md:grid-cols-2 gap-4">
                      {consensus.picks.map(pick => (
                        <div key={pick.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold">{pick.ai_name}</span>
                            <span className="text-sm text-slate-400">{pick.confidence_score}% confidence</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                            <div>
                              <div className="text-slate-400 text-xs">Entry</div>
                              <div className="font-semibold">${pick.entry_price.toFixed(2)}</div>
                            </div>
                            <div>
                              <div className="text-slate-400 text-xs">Target</div>
                              <div className="font-semibold">${pick.target_price.toFixed(2)}</div>
                            </div>
                            <div>
                              <div className="text-slate-400 text-xs">Upside</div>
                              <div className="font-semibold text-green-400">
                                +{(((pick.target_price - pick.entry_price) / pick.entry_price) * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          {pick.catalyst && (
                            <div className="text-xs text-slate-400 mt-2">
                              <span className="font-semibold">Catalyst:</span> {pick.catalyst}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
