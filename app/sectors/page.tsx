'use client'

import { useState } from 'react'
import { PieChart, TrendingUp, TrendingDown } from 'lucide-react'

export default function SectorsPage() {
  const [timeframe, setTimeframe] = useState('1d')
  
  const sectors = [
    { name: 'Technology', performance: 2.4, stocks: 28 },
    { name: 'Healthcare', performance: 1.8, stocks: 15 },
    { name: 'Finance', performance: -0.5, stocks: 22 },
    { name: 'Energy', performance: 3.2, stocks: 12 },
    { name: 'Consumer', performance: 1.1, stocks: 18 },
    { name: 'Industrial', performance: -1.2, stocks: 14 }
  ]

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 flex items-center justify-center gap-4">
          <PieChart className="w-12 h-12 text-brand-cyan" />
          <span className="gradient-text">Sectors</span>
        </h1>
        <p className="text-xl text-slate-300">Track performance across different market sectors</p>
      </div>

      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Sector Performance</h3>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="1d">Today</option>
            <option value="1w">This Week</option>
            <option value="1m">This Month</option>
            <option value="1y">This Year</option>
          </select>
        </div>

        <div className="space-y-4">
          {sectors.map(sector => (
            <div key={sector.name} className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {sector.performance >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                  <div>
                    <h4 className="font-bold">{sector.name}</h4>
                    <p className="text-sm text-slate-400">{sector.stocks} AI picks in sector</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${sector.performance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {sector.performance >= 0 ? '+' : ''}{sector.performance}%
                  </p>
                  <p className="text-xs text-slate-400">
                    {timeframe === '1d' ? 'today' : timeframe === '1w' ? 'this week' : timeframe === '1m' ? 'this month' : 'this year'}
                  </p>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    sector.performance >= 0
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : 'bg-gradient-to-r from-red-500 to-pink-500'
                  }`}
                  style={{ width: `${Math.abs(sector.performance) * 10}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
        <h3 className="text-xl font-bold mb-4">Understanding Sectors</h3>
        <div className="space-y-4 text-slate-300">
          <p>
            Market sectors group similar companies together. Performance varies based on economic conditions,
            investor sentiment, and industry-specific factors.
          </p>
          <p>
            The timeframes show percentage change for each sector:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Today:</strong> Performance since market open</li>
            <li><strong>This Week:</strong> Performance over last 7 days</li>
            <li><strong>This Month:</strong> Performance over last 30 days</li>
            <li><strong>This Year:</strong> Year-to-date performance</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
