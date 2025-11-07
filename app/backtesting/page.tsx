"use client"

import { useState } from 'react'

export default function BacktestingPage() {
  const [selectedAI, setSelectedAI] = useState('Javari AI')
  const [timeframe, setTimeframe] = useState('30')
  
  const aiOptions = ['Javari AI', 'Claude', 'GPT-4', 'Gemini', 'Perplexity']
  
  const mockResults = {
    totalTrades: 45,
    wins: 28,
    losses: 17,
    winRate: 62.2,
    avgGain: 8.5,
    maxGain: 47.3,
    maxLoss: -12.1,
    sharpeRatio: 1.8
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent mb-4">
          📈 Backtesting Lab
        </h1>
        <p className="text-xl text-gray-300 mb-2">
          Test AI strategies on historical data - See what would have happened
        </p>
        <p className="text-gray-400">
          Time travel for traders! See if following an AI would have made you rich 💰
        </p>
      </div>

      {/* Strategy Selector */}
      <div className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20 mb-8">
        <h2 className="text-2xl font-bold mb-6">⚙️ Configure Backtest</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Select AI</label>
            <select 
              value={selectedAI}
              onChange={(e) => setSelectedAI(e.target.value)}
              className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-4 py-3 text-white"
            >
              {aiOptions.map(ai => (
                <option key={ai}>{ai}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Timeframe (Days)</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-4 py-3 text-white"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Starting Capital</label>
            <input
              type="number"
              defaultValue="10000"
              className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-4 py-3 text-white"
            />
          </div>
        </div>

        <button className="w-full mt-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 rounded-lg transition-all text-lg">
          Run Backtest 🚀
        </button>
      </div>

      {/* Results */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20">
          <h2 className="text-2xl font-bold mb-6">📊 Performance Metrics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-lg">
              <span className="text-gray-400">Total Trades</span>
              <span className="text-2xl font-bold text-white">{mockResults.totalTrades}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-500/20 rounded-lg border border-green-500/30">
              <span className="text-gray-300">Wins</span>
              <span className="text-2xl font-bold text-green-400">{mockResults.wins}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-red-500/20 rounded-lg border border-red-500/30">
              <span className="text-gray-300">Losses</span>
              <span className="text-2xl font-bold text-red-400">{mockResults.losses}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
              <span className="text-gray-300">Win Rate</span>
              <span className="text-2xl font-bold text-purple-400">{mockResults.winRate}%</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20">
          <h2 className="text-2xl font-bold mb-6">💰 Profit Analysis</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-lg">
              <span className="text-gray-400">Avg Gain per Trade</span>
              <span className="text-2xl font-bold text-green-400">+{mockResults.avgGain}%</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-500/20 rounded-lg border border-green-500/30">
              <span className="text-gray-300">Best Trade</span>
              <span className="text-2xl font-bold text-green-400">+{mockResults.maxGain}%</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-red-500/20 rounded-lg border border-red-500/30">
              <span className="text-gray-300">Worst Trade</span>
              <span className="text-2xl font-bold text-red-400">{mockResults.maxLoss}%</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <span className="text-gray-300">Sharpe Ratio</span>
              <span className="text-2xl font-bold text-blue-400">{mockResults.sharpeRatio}</span>
            </div>
          </div>
        </div>
      </div>

      {/* What This Means */}
      <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-8 border border-blue-500/30">
        <h2 className="text-2xl font-bold mb-4">💡 What These Numbers Mean</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="font-bold text-white mb-2">🎯 Win Rate</div>
            <p className="text-sm text-gray-300">
              {mockResults.winRate}% win rate means this AI was right {mockResults.winRate} out of 100 times. 
              Anything above 60% is really good! Most pros aim for 55-60%.
            </p>
          </div>
          <div>
            <div className="font-bold text-white mb-2">📈 Sharpe Ratio</div>
            <p className="text-sm text-gray-300">
              Measures risk-adjusted returns. Above 1.0 is good, above 2.0 is excellent. 
              This AI at {mockResults.sharpeRatio} is crushing it!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
