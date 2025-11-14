'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ChartData {
  symbol: string
  data: {
    date: string
    price: number
    volume: number
  }[]
}

export default function ChartsPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL')
  const [timeframe, setTimeframe] = useState('1M')
  const [chartType, setChartType] = useState('line')
  const [symbols, setSymbols] = useState<string[]>([])
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [comparison, setComparison] = useState<string[]>([])

  useEffect(() => {
    loadSymbols()
  }, [])

  useEffect(() => {
    if (selectedSymbol) {
      loadChartData(selectedSymbol, timeframe)
    }
  }, [selectedSymbol, timeframe])

  async function loadSymbols() {
    const { data: picks } = await supabase
      .from('stock_picks')
      .select('symbol')
      .eq('status', 'OPEN')

    if (picks) {
      const uniqueSymbols = [...new Set(picks.map(p => p.symbol))]
      setSymbols(uniqueSymbols)
      if (uniqueSymbols.length > 0 && !selectedSymbol) {
        setSelectedSymbol(uniqueSymbols[0])
      }
    }
  }

  async function loadChartData(symbol: string, timeframe: string) {
    setLoading(true)
    
    // Generate sample chart data
    const days = timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : timeframe === '3M' ? 90 : 365
    const basePrice = 100 + Math.random() * 100
    const data = []
    
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const variation = (Math.random() - 0.5) * 10
      const price = basePrice + variation + (days - i) * 0.5
      
      data.push({
        date: date.toISOString().split('T')[0],
        price: Math.max(10, price),
        volume: Math.floor(Math.random() * 10000000) + 1000000
      })
    }

    setChartData({ symbol, data })
    setLoading(false)
  }

  function addToComparison(symbol: string) {
    if (!comparison.includes(symbol) && comparison.length < 3) {
      setComparison([...comparison, symbol])
    }
  }

  function removeFromComparison(symbol: string) {
    setComparison(comparison.filter(s => s !== symbol))
  }

  function calculateStats() {
    if (!chartData || chartData.data.length === 0) return null

    const prices = chartData.data.map(d => d.price)
    const firstPrice = prices[0]
    const lastPrice = prices[prices.length - 1]
    const change = lastPrice - firstPrice
    const changePercent = (change / firstPrice) * 100
    const high = Math.max(...prices)
    const low = Math.min(...prices)
    const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length

    return { firstPrice, lastPrice, change, changePercent, high, low, avg }
  }

  const stats = calculateStats()

  if (loading && !chartData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-white text-xl">Loading charts...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Stock Charts</h1>
          <p className="text-gray-300">Interactive price charts and technical analysis</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Select Stock</label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none"
            >
              {symbols.map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Timeframe</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none"
            >
              <option value="1W">1 Week</option>
              <option value="1M">1 Month</option>
              <option value="3M">3 Months</option>
              <option value="1Y">1 Year</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Chart Type</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none"
            >
              <option value="line">Line Chart</option>
              <option value="candlestick">Candlestick</option>
              <option value="area">Area Chart</option>
              <option value="bar">Bar Chart</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Add Comparison</label>
            <select
              onChange={(e) => {
                addToComparison(e.target.value)
                e.target.value = ''
              }}
              className="w-full px-4 py-3 bg-white/10 text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select stock...</option>
              {symbols.filter(s => s !== selectedSymbol && !comparison.includes(s)).map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Tags */}
        {comparison.length > 0 && (
          <div className="mb-6 flex gap-2 flex-wrap">
            <span className="text-gray-300 text-sm">Comparing with:</span>
            {comparison.map(symbol => (
              <span
                key={symbol}
                className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm flex items-center gap-2"
              >
                {symbol}
                <button
                  onClick={() => removeFromComparison(symbol)}
                  className="hover:text-purple-100"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-gray-400 text-xs mb-1">Open</div>
              <div className="text-white font-bold">${stats.firstPrice.toFixed(2)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-gray-400 text-xs mb-1">Current</div>
              <div className="text-white font-bold">${stats.lastPrice.toFixed(2)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-gray-400 text-xs mb-1">Change</div>
              <div className={`font-bold ${stats.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.change >= 0 ? '+' : ''}${stats.change.toFixed(2)}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-gray-400 text-xs mb-1">Change %</div>
              <div className={`font-bold ${stats.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.changePercent >= 0 ? '+' : ''}{stats.changePercent.toFixed(2)}%
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-gray-400 text-xs mb-1">High</div>
              <div className="text-green-400 font-bold">${stats.high.toFixed(2)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-gray-400 text-xs mb-1">Low</div>
              <div className="text-red-400 font-bold">${stats.low.toFixed(2)}</div>
            </div>
          </div>
        )}

        {/* Main Chart */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white">{selectedSymbol}</h2>
            <div className="text-gray-400 text-sm">{timeframe} Price Chart - {chartType}</div>
          </div>

          {/* SVG Chart Placeholder */}
          <div className="bg-gray-800/50 rounded-lg p-6 h-96 relative">
            {chartData && chartData.data.length > 0 ? (
              <svg className="w-full h-full" viewBox="0 0 800 300">
                {/* Grid lines */}
                <g className="grid">
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <line
                      key={i}
                      x1="0"
                      y1={i * 60}
                      x2="800"
                      y2={i * 60}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="1"
                    />
                  ))}
                </g>

                {/* Price line */}
                <polyline
                  points={chartData.data.map((d, i) => {
                    const x = (i / chartData.data.length) * 800
                    const minPrice = Math.min(...chartData.data.map(d => d.price))
                    const maxPrice = Math.max(...chartData.data.map(d => d.price))
                    const y = 280 - ((d.price - minPrice) / (maxPrice - minPrice)) * 260
                    return `${x},${y}`
                  }).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />

                {/* Data points */}
                {chartData.data.map((d, i) => {
                  const x = (i / chartData.data.length) * 800
                  const minPrice = Math.min(...chartData.data.map(d => d.price))
                  const maxPrice = Math.max(...chartData.data.map(d => d.price))
                  const y = 280 - ((d.price - minPrice) / (maxPrice - minPrice)) * 260
                  
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="3"
                      fill="#3b82f6"
                      className="hover:r-5 transition-all cursor-pointer"
                    >
                      <title>{d.date}: ${d.price.toFixed(2)}</title>
                    </circle>
                  )
                })}

                {/* Axis labels */}
                <text x="10" y="20" fill="rgba(255,255,255,0.5)" fontSize="12">
                  ${stats?.high.toFixed(0)}
                </text>
                <text x="10" y="290" fill="rgba(255,255,255,0.5)" fontSize="12">
                  ${stats?.low.toFixed(0)}
                </text>
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No chart data available
              </div>
            )}
          </div>

          {/* Chart Legend */}
          <div className="mt-4 flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-blue-500"></div>
              <span className="text-gray-300 text-sm">{selectedSymbol}</span>
            </div>
            {comparison.map((symbol, i) => {
              const colors = ['#8b5cf6', '#ec4899', '#f59e0b']
              return (
                <div key={symbol} className="flex items-center gap-2">
                  <div className="w-4 h-1" style={{ backgroundColor: colors[i] }}></div>
                  <span className="text-gray-300 text-sm">{symbol}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Volume Chart */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Volume</h3>
          <div className="bg-gray-800/50 rounded-lg p-6 h-48">
            {chartData && chartData.data.length > 0 && (
              <div className="flex items-end justify-between h-full gap-1">
                {chartData.data.map((d, i) => {
                  const maxVolume = Math.max(...chartData.data.map(d => d.volume))
                  const height = (d.volume / maxVolume) * 100
                  return (
                    <div
                      key={i}
                      className="bg-blue-500/50 hover:bg-blue-500 transition-colors cursor-pointer flex-1"
                      style={{ height: `${height}%` }}
                      title={`${d.date}: ${d.volume.toLocaleString()}`}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Technical Indicators (Coming Soon) */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">📈 Technical Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Moving Averages</h3>
              <p className="text-gray-300 text-sm">MA(20), MA(50), MA(200)</p>
              <div className="mt-2 text-yellow-400 text-sm">Coming Soon</div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">RSI (Relative Strength)</h3>
              <p className="text-gray-300 text-sm">14-day RSI indicator</p>
              <div className="mt-2 text-yellow-400 text-sm">Coming Soon</div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">MACD</h3>
              <p className="text-gray-300 text-sm">Moving Average Convergence Divergence</p>
              <div className="mt-2 text-yellow-400 text-sm">Coming Soon</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
