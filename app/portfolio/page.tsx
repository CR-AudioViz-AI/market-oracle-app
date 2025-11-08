'use client'

import { useState } from 'react'
import { Briefcase, TrendingUp, TrendingDown } from 'lucide-react'

export default function PortfolioPage() {
  const [positions] = useState([
    { symbol: 'AAPL', shares: 10, avgPrice: 150, currentPrice: 165, ai: 'Javari AI' },
    { symbol: 'TSLA', shares: 5, avgPrice: 200, currentPrice: 185, ai: 'Claude' },
    { symbol: 'NVDA', shares: 8, avgPrice: 400, currentPrice: 450, ai: 'GPT-4' }
  ])

  const totalValue = positions.reduce((sum, p) => sum + (p.shares * p.currentPrice), 0)
  const totalCost = positions.reduce((sum, p) => sum + (p.shares * p.avgPrice), 0)
  const totalGain = totalValue - totalCost
  const totalGainPct = (totalGain / totalCost) * 100

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 flex items-center justify-center gap-4">
          <Briefcase className="w-12 h-12 text-brand-cyan" />
          <span className="gradient-text">Portfolio</span>
        </h1>
        <p className="text-xl text-slate-300">Track your investment positions and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
          <p className="text-slate-400 text-sm mb-1">Total Value</p>
          <p className="text-3xl font-bold text-brand-cyan">${totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
          <p className="text-slate-400 text-sm mb-1">Total Gain/Loss</p>
          <p className={`text-3xl font-bold ${totalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${totalGain.toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
          <p className="text-slate-400 text-sm mb-1">Return</p>
          <p className={`text-3xl font-bold ${totalGainPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalGainPct >= 0 ? '+' : ''}{totalGainPct.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
        <h3 className="text-xl font-bold mb-6">Your Holdings</h3>
        <div className="space-y-4">
          {positions.map(pos => {
            const value = pos.shares * pos.currentPrice
            const cost = pos.shares * pos.avgPrice
            const gain = value - cost
            const gainPct = (gain / cost) * 100

            return (
              <div key={pos.symbol} className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xl font-bold">{pos.symbol}</h4>
                    <p className="text-sm text-slate-400">{pos.shares} shares • Avg: ${pos.avgPrice}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">${value.toLocaleString()}</p>
                    <p className={`text-sm flex items-center gap-1 justify-end ${gainPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {gainPct >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(2)}%
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Current Price</p>
                    <p className="font-semibold">${pos.currentPrice}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Gain/Loss</p>
                    <p className={`font-semibold ${gain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${gain.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">AI Pick</p>
                    <p className="font-semibold">{pos.ai}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
