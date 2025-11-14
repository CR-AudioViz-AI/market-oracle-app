'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface AIModel {
  id: string
  ai_name: string
  display_name: string
  provider: string
  model_version: string
  is_active: boolean
  description: string | null
  created_at: string
}

interface ModelStats {
  totalPicks: number
  activePicks: number
  winRate: number
  avgConfidence: number
}

export default function AIModelsPage() {
  const [models, setModels] = useState<AIModel[]>([])
  const [stats, setStats] = useState<Record<string, ModelStats>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadModels()
  }, [])

  async function loadModels() {
    // Load all AI models
    const { data: modelsData } = await supabase
      .from('ai_models')
      .select('*')
      .order('is_active', { ascending: false })
      .order('display_name', { ascending: true })

    if (modelsData) {
      setModels(modelsData as AIModel[])

      // Load stats for each model
      const statsData: Record<string, ModelStats> = {}
      
      for (const model of modelsData) {
        const { data: picks } = await supabase
          .from('stock_picks')
          .select('*')
          .eq('ai_name', model.display_name)

        const activePicks = picks?.filter(p => p.status === 'OPEN') || []
        const closedPicks = picks?.filter(p => p.status === 'CLOSED') || []
        const winners = closedPicks.filter(p => p.exit_price && p.exit_price > p.entry_price)

        statsData[model.ai_name] = {
          totalPicks: picks?.length || 0,
          activePicks: activePicks.length,
          winRate: closedPicks.length > 0 ? (winners.length / closedPicks.length) * 100 : 0,
          avgConfidence: picks && picks.length > 0 
            ? picks.reduce((sum, p) => sum + p.confidence_score, 0) / picks.length 
            : 0
        }
      }

      setStats(statsData)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-2xl">Loading AI models...</div>
      </div>
    )
  }

  const activeModels = models.filter(m => m.is_active)
  const inactiveModels = models.filter(m => !m.is_active)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="text-4xl font-bold mb-2">AI Models</h1>
        <p className="text-slate-400 mb-8">
          Meet the AI models competing in the Market Oracle stock battle
        </p>

        {/* Active Models */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-green-400">
            🟢 Active Models ({activeModels.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeModels.map((model) => {
              const modelStats = stats[model.ai_name] || { totalPicks: 0, activePicks: 0, winRate: 0, avgConfidence: 0 }

              return (
                <div
                  key={model.id}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-green-500/30 hover:border-green-500/60 transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold">{model.display_name}</h3>
                      <p className="text-sm text-slate-400">
                        {model.provider} • {model.model_version}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-semibold">
                      Active
                    </span>
                  </div>

                  {model.description && (
                    <p className="text-slate-300 mb-4 text-sm">{model.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
                    <div>
                      <div className="text-xs text-slate-400">Total Picks</div>
                      <div className="text-2xl font-bold">{modelStats.totalPicks}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Active Picks</div>
                      <div className="text-2xl font-bold text-blue-400">{modelStats.activePicks}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Win Rate</div>
                      <div className="text-2xl font-bold text-green-400">{modelStats.winRate.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Avg Confidence</div>
                      <div className="text-2xl font-bold text-purple-400">{modelStats.avgConfidence.toFixed(0)}%</div>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-slate-500">
                    <strong>Specialization:</strong> {
                      model.ai_name === 'perplexity' ? 'Real-time data analysis' :
                      model.ai_name === 'gpt4' ? 'Pattern recognition & forecasting' :
                      model.ai_name === 'claude' ? 'Risk assessment & analysis' :
                      model.ai_name === 'gemini' ? 'Multimodal market insights' :
                      model.ai_name === 'javari' ? 'Autonomous decision-making' :
                      'General market analysis'
                    }
                  </div>

                  <div className="mt-3 text-xs text-slate-500">
                    <strong>Active Since:</strong> {new Date(model.created_at).toLocaleDateString()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Inactive Models */}
        {inactiveModels.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-slate-500">
              ⚪ Inactive Models ({inactiveModels.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inactiveModels.map((model) => (
                <div
                  key={model.id}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 opacity-60"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold">{model.display_name}</h3>
                      <p className="text-sm text-slate-400">
                        {model.provider} • {model.model_version}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-slate-500/20 text-slate-400 rounded-full text-sm font-semibold">
                      Inactive
                    </span>
                  </div>

                  {model.description && (
                    <p className="text-slate-400 text-sm">{model.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="mt-12 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold mb-4">🤖 How the AI Battle Works</h2>
          <div className="space-y-3 text-slate-300">
            <p>
              <strong>1. Analysis:</strong> Each AI model independently analyzes market data, news, and trends
            </p>
            <p>
              <strong>2. Picks:</strong> Models make stock picks with confidence scores and reasoning
            </p>
            <p>
              <strong>3. Competition:</strong> All picks are tracked in real-time with live market data
            </p>
            <p>
              <strong>4. Performance:</strong> Win rates and returns are calculated when positions close
            </p>
            <p>
              <strong>5. Learning:</strong> Top performers influence the consensus "hot picks"
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
