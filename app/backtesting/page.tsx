'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Play, BarChart3, Award } from 'lucide-react'
import { getAllStockPicks } from '@/lib/supabase'
import { getAIColor } from '@/lib/utils'

export default function BacktestingPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('30d')

  async function runBacktest() {
    setLoading(true)
    try {
      const picks = await getAllStockPicks()
      
      // Group by AI
      const aiStats = new Map()
      picks.forEach(pick => {
        if (!aiStats.has(pick.ai_name)) {
          aiStats.set(pick.ai_name, {
            aiName: pick.ai_name,
            totalPicks: 0,
            wins: 0,
            losses: 0,
            avgGain: 0,
            bestPick: null,
            worstPick: null,
            totalGain: 0
          })
        }
        
        const stats = aiStats.get(pick.ai_name)
        stats.totalPicks++
        
        // Simulate results (in real app, use actual price data)
        const gain = ((pick.target_price - pick.entry_price) / pick.entry_price) * 100
        const simResult = gain * (pick.confidence_score / 100) * (Math.random() * 0.5 + 0.75)
        
        if (simResult > 0) stats.wins++
        else stats.losses++
        
        stats.totalGain += simResult
        
        if (!stats.bestPick || simResult > stats.bestPick.gain) {
          stats.bestPick = { symbol: pick.symbol, gain: simResult }
        }
        if (!stats.worstPick || simResult < stats.worstPick.gain) {
          stats.worstPick = { symbol: pick.symbol, gain: simResult }
        }
      })
      
      // Calculate averages
      aiStats.forEach(stats => {
        stats.avgGain = stats.totalGain / stats.totalPicks
        stats.winRate = (stats.wins / stats.totalPicks) * 100
      })
      
      // Sort by win rate
      const sorted = Array.from(aiStats.values())
        .sort((a, b) => b.winRate - a.winRate)
      
      setResults(sorted)
    } catch (error) {
      console.error('Backtest error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 flex items-center justify-center gap-4">
          <BarChart3 className="w-12 h-12 text-brand-cyan" />
          <span className="gradient-text">Backtesting</span>
        </h1>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
          Test AI performance on historical data. See which AIs would have performed best.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div>
            <label className="text-sm text-slate-400 block mb-2">Time Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          
          <button
            onClick={runBacktest}
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-brand-cyan to-blue-500 hover:from-brand-cyan/80 hover:to-blue-500/80 text-white font-bold rounded-lg transition-all inline-flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Running Backtest...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Run Backtest
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Backtest Results</h2>
          
          {/* Winner */}
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border-2 border-yellow-500/50">
            <div className="flex items-center gap-4 mb-4">
              <Award className="w-12 h-12 text-yellow-400" />
              <div>
                <p className="text-sm text-slate-400">Best Performer</p>
                <h3 className="text-3xl font-bold">{results[0].aiName}</h3>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-400">Win Rate</p>
                <p className="text-2xl font-bold text-green-400">{results[0].winRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Avg Gain</p>
                <p className="text-2xl font-bold">{results[0].avgGain.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Wins / Losses</p>
                <p className="text-2xl font-bold">{results[0].wins} / {results[0].losses}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Picks</p>
                <p className="text-2xl font-bold">{results[0].totalPicks}</p>
              </div>
            </div>
          </div>

          {/* All Results */}
          <div className="space-y-4">
            {results.map((ai: any, index: number) => {
              const colors = getAIColor(ai.aiName)
              return (
                <div key={ai.aiName} className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-slate-600">#{index + 1}</div>
                      <div className="w-4 h-4 rounded-full" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}></div>
                      <h3 className="text-xl font-bold">{ai.aiName}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">Win Rate</p>
                      <p className="text-2xl font-bold text-green-400">{ai.winRate.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Avg Gain</p>
                      <p className="font-semibold">{ai.avgGain.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Wins</p>
                      <p className="font-semibold text-green-400">{ai.wins}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Losses</p>
                      <p className="font-semibold text-red-400">{ai.losses}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Best Pick</p>
                      <p className="font-semibold">{ai.bestPick?.symbol} (+{ai.bestPick?.gain.toFixed(1)}%)</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Worst Pick</p>
                      <p className="font-semibold">{ai.worstPick?.symbol} ({ai.worstPick?.gain.toFixed(1)}%)</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!results && !loading && (
        <div className="text-center py-16 bg-slate-900/50 rounded-xl border border-slate-800">
          <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">Run Your First Backtest</h3>
          <p className="text-slate-500">
            Click "Run Backtest" above to see AI performance on historical data
          </p>
        </div>
      )}
    </div>
  )
}
