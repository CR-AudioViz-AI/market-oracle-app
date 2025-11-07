"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ChartsPage() {
  const [picks, setPicks] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    fetchPicks()
  }, [])

  async function fetchPicks() {
    const { data } = await supabase
      .from('stock_picks')
      .select('*')
      .limit(20)
    if (data) {
      setPicks(data)
      setSelected(data[0])
    }
  }

  const indicators = [
    { name: 'Moving Average (MA)', icon: '📈', desc: 'Smooths out price trends over time' },
    { name: 'RSI (Relative Strength)', icon: '💪', desc: 'Shows if stock is overbought/oversold' },
    { name: 'MACD', icon: '🎯', desc: 'Momentum and trend direction' },
    { name: 'Bollinger Bands', icon: '📊', desc: 'Volatility and price extremes' },
    { name: 'Volume', icon: '🔊', desc: 'Trading activity strength' },
    { name: 'Support/Resistance', icon: '⚖️', desc: 'Key price levels' }
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4">
          📉 Advanced Charts
        </h1>
        <p className="text-xl text-gray-300 mb-2">
          Technical analysis made simple - 20+ indicators at your fingertips
        </p>
        <p className="text-gray-400">
          Read charts like a pro. Spot patterns. Time your entries perfectly 🎯
        </p>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white">${selected?.symbol || 'Loading...'}</h2>
            <p className="text-gray-400">Click any pick below to see its chart</p>
          </div>
          <select className="bg-slate-900 border border-purple-500/30 rounded-lg px-4 py-2 text-white">
            <option>1 Day</option>
            <option>1 Week</option>
            <option>1 Month</option>
            <option>3 Months</option>
            <option>1 Year</option>
          </select>
        </div>

        {/* Simulated Chart Area */}
        <div className="bg-slate-900/80 rounded-lg p-8 mb-6" style={{ height: '400px' }}>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-xl text-gray-400">Interactive chart coming soon!</p>
              <p className="text-sm text-gray-500 mt-2">Will include TradingView integration</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {selected && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Current</div>
              <div className="text-xl font-bold text-white">${selected.entry_price.toFixed(2)}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Target</div>
              <div className="text-xl font-bold text-green-400">${selected.target_price.toFixed(2)}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Upside</div>
              <div className="text-xl font-bold text-blue-400">
                +{(((selected.target_price - selected.entry_price) / selected.entry_price) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">AI Score</div>
              <div className="text-xl font-bold text-purple-400">{selected.confidence_score}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Technical Indicators */}
      <div className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20 mb-8">
        <h2 className="text-2xl font-bold mb-6">🛠️ Available Indicators</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {indicators.map((ind, idx) => (
            <div key={idx} className="bg-slate-900/50 rounded-lg p-6 hover:bg-slate-900/80 transition-all cursor-pointer border border-purple-500/20">
              <div className="text-3xl mb-3">{ind.icon}</div>
              <div className="font-bold text-white mb-2">{ind.name}</div>
              <div className="text-sm text-gray-400">{ind.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stock Picker */}
      <div className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20">
        <h2 className="text-2xl font-bold mb-6">📋 Select Stock to Analyze</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {picks.map((pick) => (
            <div
              key={pick.id}
              onClick={() => setSelected(pick)}
              className={`cursor-pointer p-4 rounded-lg transition-all ${
                selected?.id === pick.id
                  ? 'bg-purple-500/30 border-2 border-purple-400'
                  : 'bg-slate-900/50 border-2 border-transparent hover:border-purple-500/30'
              }`}
            >
              <div className="text-xl font-bold text-white mb-1">${pick.symbol}</div>
              <div className="text-sm text-gray-400">{pick.ai_name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
