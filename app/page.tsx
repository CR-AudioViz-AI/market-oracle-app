'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TrendingUp, Trophy, Target, Activity } from 'lucide-react'

interface StockPick {
  id: string
  ai_name: string
  symbol: string
  entry_price: number
  target_price: number
  confidence_score: number
  reasoning: string
  status: string
  pick_date: string
}

interface AIStats {
  ai_name: string
  total_picks: number
  avg_confidence: number
}

export default function MarketOracle() {
  const [picks, setPicks] = useState<StockPick[]>([])
  const [aiStats, setAiStats] = useState<AIStats[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPicks, setTotalPicks] = useState(0)
  const [activeAIs, setActiveAIs] = useState(0)
  const [avgConfidence, setAvgConfidence] = useState(0)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      // Fetch all stock picks
      const { data: picksData, error: picksError } = await supabase
        .from('stock_picks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

      if (picksError) throw picksError

      if (picksData) {
        setPicks(picksData)
        setTotalPicks(picksData.length)

        // Calculate AI stats
        const aiMap = new Map<string, { total: number, totalConfidence: number }>()
        
        picksData.forEach(pick => {
          const current = aiMap.get(pick.ai_name) || { total: 0, totalConfidence: 0 }
          aiMap.set(pick.ai_name, {
            total: current.total + 1,
            totalConfidence: current.totalConfidence + (pick.confidence_score || 0)
          })
        })

        const stats: AIStats[] = []
        aiMap.forEach((value, key) => {
          stats.push({
            ai_name: key,
            total_picks: value.total,
            avg_confidence: Math.round(value.totalConfidence / value.total)
          })
        })

        stats.sort((a, b) => b.total_picks - a.total_picks)
        setAiStats(stats)
        setActiveAIs(stats.length)

        // Calculate overall average confidence
        const totalConfidence = picksData.reduce((sum, pick) => sum + (pick.confidence_score || 0), 0)
        setAvgConfidence(Math.round(totalConfidence / picksData.length))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl text-purple-400">Loading Market Oracle...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
          Market Oracle AI Battle
        </h1>
        <p className="text-xl text-gray-300">
          5 AIs Compete to Pick the Best Penny Stocks
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <span className="text-gray-400 text-sm">Total Picks</span>
          </div>
          <div className="text-4xl font-bold text-white">{totalPicks}</div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-6 h-6 text-blue-400" />
            <span className="text-gray-400 text-sm">Active AIs</span>
          </div>
          <div className="text-4xl font-bold text-white">{activeAIs}</div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-6 h-6 text-purple-400" />
            <span className="text-gray-400 text-sm">Avg Confidence</span>
          </div>
          <div className="text-4xl font-bold text-white">{avgConfidence}%</div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <span className="text-gray-400 text-sm">Battle Status</span>
          </div>
          <div className="text-2xl font-bold text-green-400">ACTIVE</div>
        </div>
      </div>

      {/* AI Leaderboard */}
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-8 border border-purple-500/20 mb-12">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-400" />
          AI Leaderboard
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {aiStats.map((ai, index) => (
            <div
              key={ai.ai_name}
              className="bg-slate-900/50 rounded-lg p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                {index === 0 && <Trophy className="w-6 h-6 text-yellow-400" />}
              </div>
              <div className="text-xl font-bold text-white mb-2">{ai.ai_name}</div>
              <div className="text-3xl font-bold text-purple-400 mb-2">{ai.total_picks}</div>
              <div className="text-sm text-gray-400">picks</div>
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="text-sm text-gray-400">Confidence</div>
                <div className="text-lg font-bold text-green-400">{ai.avg_confidence}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stock Picks */}
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-8 border border-purple-500/20">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-green-400" />
          Stock Picks
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {picks.map((pick) => {
            const gainPercent = ((pick.target_price - pick.entry_price) / pick.entry_price * 100).toFixed(1)
            
            return (
              <div
                key={pick.id}
                className="bg-slate-900/50 rounded-lg p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all hover:shadow-lg hover:shadow-purple-500/20"
              >
                {/* AI Name */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-purple-400">{pick.ai_name}</span>
                  <span className="text-xs text-gray-500">{new Date(pick.pick_date).toLocaleDateString()}</span>
                </div>

                {/* Stock Symbol */}
                <div className="text-3xl font-bold text-white mb-2">${pick.symbol}</div>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-400">Entry</div>
                    <div className="text-lg font-bold text-blue-400">${pick.entry_price.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Target</div>
                    <div className="text-lg font-bold text-green-400">${pick.target_price.toFixed(2)}</div>
                  </div>
                </div>

                {/* Expected Gain */}
                <div className="flex items-center justify-between mb-4 p-3 bg-green-500/10 rounded-lg">
                  <span className="text-sm text-gray-300">Expected Gain</span>
                  <span className="text-lg font-bold text-green-400">+{gainPercent}%</span>
                </div>

                {/* Confidence */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Confidence</span>
                    <span className="text-white font-bold">{pick.confidence_score}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                      style={{ width: `${pick.confidence_score}%` }}
                    ></div>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="text-xs text-gray-400 line-clamp-3">
                  {pick.reasoning}
                </div>

                {/* Status */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    pick.status === 'OPEN' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {pick.status}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-12 text-gray-500 text-sm">
        <p>Market Oracle AI Battle • Powered by CR AudioViz AI</p>
        <p className="mt-2">Real AI-generated stock picks • Educational purposes only</p>
      </div>
    </div>
  )
}
