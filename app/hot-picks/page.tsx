'use client'

import { useEffect, useState } from 'react'
import { Flame, TrendingUp, Users, Target } from 'lucide-react'
import { getHotPicks } from '@/lib/supabase'
import { formatCurrency, calculateGainPercentage, formatPercentage, getAIColor } from '@/lib/utils'

export default function HotPicksPage() {
  const [hotPicks, setHotPicks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('7d')

  useEffect(() => {
    loadHotPicks()
  }, [])

  async function loadHotPicks() {
    try {
      const picks = await getHotPicks()
      setHotPicks(picks)
    } catch (error) {
      console.error('Error loading hot picks:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-slate-400">Loading hot picks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 flex items-center justify-center gap-4">
          <Flame className="w-12 h-12 text-orange-500" />
          <span className="gradient-text">Hot Picks</span>
        </h1>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto">
          Stocks where 3+ AIs agree. When multiple AIs converge on the same pick, it's worth paying attention.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-6 border border-orange-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Consensus Picks</p>
              <p className="text-4xl font-bold text-orange-400">{hotPicks.length}</p>
            </div>
            <Flame className="w-12 h-12 text-orange-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-brand-cyan/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Avg AI Agreement</p>
              <p className="text-4xl font-bold text-brand-cyan">
                {hotPicks.length > 0
                  ? (hotPicks.reduce((sum, p) => sum + p.consensus, 0) / hotPicks.length).toFixed(1)
                  : '0'} AIs
              </p>
            </div>
            <Users className="w-12 h-12 text-brand-cyan opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Avg Confidence</p>
              <p className="text-4xl font-bold text-green-400">
                {hotPicks.length > 0
                  ? hotPicks.reduce((sum, p) => sum + p.avgConfidence, 0) / hotPicks.length
                  : 0}%
              </p>
            </div>
            <Target className="w-12 h-12 text-green-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Hot Picks Grid */}
      {hotPicks.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-xl border border-slate-800">
          <Flame className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">No Consensus Picks Yet</h3>
          <p className="text-slate-500">
            When 3 or more AIs agree on a stock, it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {hotPicks.map((hot) => {
            const avgEntry = hot.picks.reduce((sum: number, p: any) => sum + p.entry_price, 0) / hot.picks.length
            const avgTarget = hot.picks.reduce((sum: number, p: any) => sum + p.target_price, 0) / hot.picks.length
            const potentialGain = calculateGainPercentage(avgEntry, avgTarget)

            return (
              <div
                key={hot.symbol}
                className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl p-6 border-2 border-orange-500/30 hover:border-orange-500/50 transition-all card-hover"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-3xl font-bold">{hot.symbol}</h3>
                      <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/20 rounded-full">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span className="text-sm font-semibold text-orange-400">
                          {hot.consensus} AIs Agree
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-400">
                      Picked by: {hot.aiNames.join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400 mb-1">Avg Confidence</p>
                    <p className="text-2xl font-bold text-green-400">{hot.avgConfidence.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <p className="text-sm text-slate-400 mb-1">Avg Entry Price</p>
                    <p className="text-2xl font-bold">{formatCurrency(avgEntry)}</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <p className="text-sm text-slate-400 mb-1">Avg Target Price</p>
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(avgTarget)}</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <p className="text-sm text-slate-400 mb-1">Potential Gain</p>
                    <p className={`text-2xl font-bold ${potentialGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercentage(potentialGain)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-300">AI Reasoning:</p>
                  {hot.picks.map((pick: any) => {
                    const colors = getAIColor(pick.ai_name)
                    return (
                      <div key={pick.id} className="bg-slate-800/50 rounded-lg p-4 border-l-4" style={{ borderColor: colors.primary }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}></div>
                          <span className="font-semibold text-sm">{pick.ai_name}</span>
                          <span className="text-xs text-slate-400">• {pick.confidence_score}% confidence</span>
                        </div>
                        <p className="text-sm text-slate-300">{pick.reasoning}</p>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-6 flex gap-4">
                  <button className="flex-1 bg-gradient-to-r from-brand-cyan to-blue-500 hover:from-brand-cyan/80 hover:to-blue-500/80 text-white font-bold py-3 rounded-lg transition-all">
                    Add to Watchlist ⭐
                  </button>
                  <button className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 rounded-lg transition-all">
                    Paper Trade 💰
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
