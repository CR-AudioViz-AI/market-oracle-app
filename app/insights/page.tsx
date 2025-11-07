"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function InsightsPage() {
  const [picks, setPicks] = useState<any[]>([])
  const [selectedPick, setSelectedPick] = useState<any>(null)

  useEffect(() => {
    fetchPicks()
  }, [])

  async function fetchPicks() {
    const { data } = await supabase
      .from('stock_picks')
      .select('*')
      .order('confidence_score', { ascending: false })
      .limit(15)

    if (data) {
      setPicks(data)
      if (data.length > 0) {
        setSelectedPick(data[0])
      }
    }
  }

  if (!selectedPick) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl text-purple-400">Loading insights...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
          💡 AI Insights
        </h1>
        <p className="text-xl text-gray-300 mb-2">
          See exactly how AIs think - Full transparency, zero black boxes
        </p>
        <p className="text-gray-400">
          Ever wondered why an AI picked a stock? Now you know! 🔍
        </p>
      </div>

      {/* Why Transparency Matters */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-8 border border-blue-500/30 mb-8">
        <h2 className="text-2xl font-bold mb-6">🔒 Why AI Transparency Matters</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="font-bold text-white mb-2">Build Trust</h3>
            <p className="text-sm text-gray-300">See the logic behind every pick. No mysterious trust us vibes. You decide if it makes sense!</p>
          </div>
          <div>
            <div className="text-4xl mb-3">📚</div>
            <h3 className="font-bold text-white mb-2">Learn Faster</h3>
            <p className="text-sm text-gray-300">Understanding AI reasoning = learning pro strategies. It&apos;s like watching a master play chess with commentary.</p>
          </div>
          <div>
            <div className="text-4xl mb-3">⚖️</div>
            <h3 className="font-bold text-white mb-2">Make Better Calls</h3>
            <p className="text-sm text-gray-300">When you know WHY, you can combine it with your own research. Two brains better than one!</p>
          </div>
        </div>
      </div>

      {/* Pick Selection */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1 bg-slate-800/50 rounded-xl p-6 border border-purple-500/20">
          <h2 className="text-xl font-bold mb-4">Select a Pick</h2>
          <div className="space-y-3">
            {picks.map((pick) => (
              <div
                key={pick.id}
                onClick={() => setSelectedPick(pick)}
                className={`cursor-pointer p-4 rounded-lg transition-all ${
                  selectedPick?.id === pick.id
                    ? 'bg-purple-500/30 border-2 border-purple-400'
                    : 'bg-slate-900/50 border-2 border-transparent hover:border-purple-500/30'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-bold text-white">${pick.symbol}</span>
                  <span className="text-sm text-purple-300">{pick.confidence_score}%</span>
                </div>
                <div className="text-sm text-gray-400">{pick.ai_name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Insight */}
        <div className="md:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-4xl font-bold text-white mb-2">${selectedPick.symbol}</div>
                <div className="text-lg text-purple-300">{selectedPick.ai_name}</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-400">
                  +{(((selectedPick.target_price - selectedPick.entry_price) / selectedPick.entry_price) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">Expected gain</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Entry Price</div>
                <div className="text-2xl font-bold text-blue-400">${selectedPick.entry_price.toFixed(2)}</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Target Price</div>
                <div className="text-2xl font-bold text-green-400">${selectedPick.target_price.toFixed(2)}</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Confidence</div>
                <div className="text-2xl font-bold text-purple-400">{selectedPick.confidence_score}%</div>
              </div>
            </div>
          </div>

          {/* AI Reasoning */}
          <div className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20">
            <h3 className="text-2xl font-bold mb-4">🧠 AI Reasoning</h3>
            <div className="bg-slate-900/50 rounded-lg p-6 border-l-4 border-purple-500">
              <p className="text-gray-300 leading-relaxed">
                {selectedPick.reasoning}
              </p>
            </div>
          </div>

          {/* What This Means (Translation) */}
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-8 border border-blue-500/30">
            <h3 className="text-2xl font-bold mb-4">🔍 What This Means (Plain English)</h3>
            <div className="space-y-4">
              <div>
                <div className="font-bold text-white mb-2">🎯 The Play:</div>
                <p className="text-gray-300">
                  This AI thinks {selectedPick.symbol} is undervalued right now. It expects the price to jump from ${selectedPick.entry_price.toFixed(2)} to ${selectedPick.target_price.toFixed(2)}.
                </p>
              </div>
              <div>
                <div className="font-bold text-white mb-2">💪 Confidence Level:</div>
                <p className="text-gray-300">
                  {selectedPick.confidence_score >= 80 ? 'VERY HIGH - This is a strong conviction pick. The AI really believes in this one!' :
                   selectedPick.confidence_score >= 60 ? 'MODERATE - Good pick, but not the AI's highest confidence. Proceed with caution.' :
                   'LOWER - This is more speculative. Higher risk, higher reward potential.'}
                </p>
              </div>
              <div>
                <div className="font-bold text-white mb-2">⚠️ Should You Follow It?</div>
                <p className="text-gray-300">
                  {selectedPick.confidence_score >= 80 ? 'This is worth serious consideration! High confidence + good reasoning = strong play.' :
                   selectedPick.confidence_score >= 60 ? 'Maybe! Do your own research first. Use this as a starting point, not the final word.' :
                   'Probably not unless you really understand the sector. This is a riskier play.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
