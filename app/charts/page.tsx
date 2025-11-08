'use client'

import Link from 'next/link'

export default function ChartsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Technical Charts</h1>
          <p className="text-gray-300">Advanced charting and technical analysis tools</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-12 border border-white/20 text-center">
          <div className="text-6xl mb-6">📈</div>
          <h2 className="text-3xl font-bold text-white mb-4">Advanced Charts Coming Soon</h2>
          <p className="text-gray-300 text-lg mb-8">
            Full TradingView-style charts with technical indicators, drawing tools, and real-time data.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="p-6 bg-white/5 rounded-xl">
              <div className="text-3xl mb-3">📊</div>
              <div className="font-semibold text-white mb-2">Multiple Timeframes</div>
              <div className="text-sm text-gray-400">1m, 5m, 15m, 1h, 4h, 1D, 1W</div>
            </div>
            <div className="p-6 bg-white/5 rounded-xl">
              <div className="text-3xl mb-3">🎯</div>
              <div className="font-semibold text-white mb-2">Technical Indicators</div>
              <div className="text-sm text-gray-400">RSI, MACD, Bollinger Bands, more</div>
            </div>
            <div className="p-6 bg-white/5 rounded-xl">
              <div className="text-3xl mb-3">✏️</div>
              <div className="font-semibold text-white mb-2">Drawing Tools</div>
              <div className="text-sm text-gray-400">Trendlines, support/resistance</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl p-8 border border-white/20 mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">💡 What This Means</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              <strong className="text-white">Technical Analysis:</strong> Charts help visualize price patterns, trends, and key levels for better entry/exit decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
