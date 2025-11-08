'use client'

import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'

export function RealTimePriceTracker({ symbols }: { symbols: string[] }) {
  const [prices, setPrices] = useState<Map<string, any>>(new Map())
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    updatePrices()
    const interval = setInterval(updatePrices, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [symbols])

  async function updatePrices() {
    setUpdating(true)
    // Simulate real-time price updates
    const newPrices = new Map()
    symbols.forEach(symbol => {
      const basePrice = 50 + Math.random() * 200
      const change = (Math.random() - 0.5) * 10
      const changePercent = (change / basePrice) * 100
      
      newPrices.set(symbol, {
        current: basePrice + change,
        change: change,
        changePercent: changePercent,
        high: basePrice + Math.abs(change) + 5,
        low: basePrice - Math.abs(change) - 5,
        volume: Math.floor(Math.random() * 10000000)
      })
    })
    setPrices(newPrices)
    setUpdating(false)
  }

  return (
    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-400" />
          Live Price Tracker
        </h3>
        <button
          onClick={updatePrices}
          disabled={updating}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-5 h-5 text-brand-cyan ${updating ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {symbols.slice(0, 6).map(symbol => {
          const data = prices.get(symbol) || {
            current: 0, change: 0, changePercent: 0, high: 0, low: 0, volume: 0
          }
          const isPositive = data.change >= 0

          return (
            <div key={symbol} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-bold">{symbol}</h4>
                {isPositive ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-2xl font-bold">
                    ${data.current.toFixed(2)}
                  </p>
                  <p className={`text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{data.change.toFixed(2)} ({isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%)
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-400">High</p>
                    <p className="font-semibold">${data.high.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Low</p>
                    <p className="font-semibold">${data.low.toFixed(2)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400">Volume</p>
                    <p className="font-semibold">{(data.volume / 1000000).toFixed(2)}M</p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
