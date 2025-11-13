'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { ArrowLeft, Swords, Trophy, Crown, Target, Zap, Star, Award, TrendingUp } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface AIMetrics {
  ai_name: string
  totalPicks: number
  activePicks: number
  closedPicks: number
  wins: number
  losses: number
  winRate: number
  avgConfidence: number
  avgGain: number
  totalDollars: number
  battleScore: number
}

export default function BattleRoyalePage() {
  const [battleData, setBattleData] = useState<AIMetrics[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBattleData()
  }, [])

  async function loadBattleData() {
    try {
      // Get all stock picks
      const { data: allPicks } = await supabase
        .from('stock_picks')
        .select('*')
        .order('pick_date', { ascending: false })

      if (!allPicks) {
        setLoading(false)
        return
      }

      // Get unique AI names
      const aiNames = Array.from(new Set(allPicks.map(p => p.ai_name)))

      // Calculate metrics for each AI
      const metrics = aiNames.map(aiName => {
        const aiPicks = allPicks.filter(p => p.ai_name === aiName)
        const activePicks = aiPicks.filter(p => p.status === 'OPEN')
        const closedPicks = aiPicks.filter(p => p.status === 'CLOSED' && p.exit_price != null)

        // Calculate wins/losses from CLOSED picks only
        const wins = closedPicks.filter(p => p.exit_price! > p.entry_price).length
        const losses = closedPicks.filter(p => p.exit_price! <= p.entry_price).length
        const winRate = closedPicks.length > 0 ? (wins / closedPicks.length) * 100 : 0

        // Calculate average gain for ACTIVE picks (entry to target)
        const avgGain = activePicks.length > 0
          ? activePicks.reduce((sum, p) => sum + ((p.target_price - p.entry_price) / p.entry_price * 100), 0) / activePicks.length
          : 0

        // Calculate total dollar gains from CLOSED picks
        const totalDollars = closedPicks.reduce((sum, p) => sum + (p.exit_price! - p.entry_price), 0)

        // Calculate average confidence
        const avgConfidence = aiPicks.length > 0
          ? aiPicks.reduce((sum, p) => sum + p.confidence_score, 0) / aiPicks.length
          : 0

        // Battle score: weighted combination of metrics
        const battleScore = 
          (winRate * 0.3) +           // Win rate (30%)
          (avgGain * 0.3) +            // Avg gain potential (30%)
          (avgConfidence * 0.2) +      // Confidence (20%)
          ((wins / Math.max(aiPicks.length, 1)) * 100 * 0.2) // Win ratio (20%)

        return {
          ai_name: aiName,
          totalPicks: aiPicks.length,
          activePicks: activePicks.length,
          closedPicks: closedPicks.length,
          wins,
          losses,
          winRate,
          avgConfidence,
          avgGain,
          totalDollars,
          battleScore
        }
      }).sort((a, b) => b.battleScore - a.battleScore)

      setBattleData(metrics)
    } catch (error) {
      console.error('Battle Royale error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-3xl font-bold mb-4">Loading Battle Data...</div>
          <div className="text-slate-400">Calculating AI performance...</div>
        </div>
      </div>
    )
  }

  const champion = battleData[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-brand-cyan hover:text-brand-cyan/80 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 flex items-center justify-center gap-4">
            <Swords className="w-12 h-12 text-red-500" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500">
              AI Battle Royale
            </span>
          </h1>
          <p className="text-xl text-slate-300">5 AIs compete. Only one can be champion.</p>
        </div>

        {champion && (
          <div className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 rounded-2xl p-8 border-2 border-yellow-500/50 relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 p-4">
              <Crown className="w-32 h-32 text-yellow-400 opacity-10" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <Trophy className="w-16 h-16 text-yellow-400" />
                <div>
                  <p className="text-sm text-yellow-400 font-semibold uppercase tracking-wider">Current Champion</p>
                  <h2 className="text-5xl font-bold">{champion.ai_name}</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Battle Score</p>
                  <p className="text-3xl font-bold text-yellow-400">{champion.battleScore.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Win Rate</p>
                  <p className="text-3xl font-bold text-green-400">{champion.winRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Avg Gain</p>
                  <p className="text-3xl font-bold text-brand-cyan">+{champion.avgGain.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Total Picks</p>
                  <p className="text-3xl font-bold text-white">{champion.totalPicks}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Total Dollars</p>
                  <p className="text-3xl font-bold text-green-400">
                    {champion.totalDollars >= 0 ? '+' : ''}${champion.totalDollars.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-3xl font-bold mb-6">Battle Rankings</h3>
          <div className="space-y-4">
            {battleData.map((ai, index) => (
              <div
                key={ai.ai_name}
                className={`bg-white/5 rounded-xl p-6 border transition hover:border-brand-cyan/50 ${
                  index === 0 ? 'border-yellow-500/50 bg-yellow-500/5' :
                  index === 1 ? 'border-slate-400/50' :
                  index === 2 ? 'border-orange-700/50' :
                  'border-white/10'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-center min-w-[60px]">
                      {index === 0 && <Crown className="w-10 h-10 text-yellow-400 mx-auto mb-1" />}
                      {index === 1 && <Award className="w-10 h-10 text-slate-400 mx-auto mb-1" />}
                      {index === 2 && <Star className="w-10 h-10 text-orange-700 mx-auto mb-1" />}
                      {index > 2 && <div className="text-4xl font-bold text-slate-600">#{index + 1}</div>}
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold mb-1">{ai.ai_name}</h4>
                      <p className="text-sm text-slate-400">
                        {ai.totalPicks} total picks • {ai.activePicks} active • {ai.closedPicks} closed
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Score</p>
                      <p className="text-xl font-bold text-yellow-400">{ai.battleScore.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-1">W/L</p>
                      <p className="text-xl font-bold">
                        <span className="text-green-400">{ai.wins}</span>
                        <span className="text-slate-500">/</span>
                        <span className="text-red-400">{ai.losses}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Win Rate</p>
                      <p className="text-xl font-bold text-green-400">{ai.winRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Avg Gain</p>
                      <p className="text-xl font-bold text-brand-cyan">+{ai.avgGain.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Confidence</p>
                      <p className="text-xl font-bold text-white">{ai.avgConfidence.toFixed(0)}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Total $</p>
                      <p className={`text-xl font-bold ${ai.totalDollars >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {ai.totalDollars >= 0 ? '+' : ''}${ai.totalDollars.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Battle Score = Win Rate (30%) + Avg Gain (30%) + Confidence (20%) + Win Ratio (20%)</p>
          <p className="mt-2">W/L based on closed positions only. Avg Gain calculated from active picks' targets.</p>
        </div>
      </div>
    </div>
  )
}
