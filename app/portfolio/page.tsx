'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Position {
  id: string
  symbol: string
  shares: number
  entryPrice: number
  currentPrice: number
  entryDate: string
  aiName: string
  confidence: number
}

export default function PortfolioPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newPosition, setNewPosition] = useState({
    symbol: '',
    shares: 0,
    entryPrice: 0
  })

  useEffect(() => {
    loadPortfolio()
  }, [])

  async function loadPortfolio() {
    setLoading(true)
    
    // Get user's positions from database
    // For demo, we'll create sample positions from stock picks
    const { data: picks } = await supabase
      .from('stock_picks')
      .select('*')
      .eq('status', 'OPEN')
      .limit(10)

    if (picks) {
      const portfolioPositions: Position[] = picks.map(pick => ({
        id: pick.id,
        symbol: pick.symbol,
        shares: 100, // Default 100 shares
        entryPrice: pick.entry_price,
        currentPrice: pick.entry_price * (1 + (Math.random() * 0.1 - 0.05)), // Simulated current price
        entryDate: pick.pick_date,
        aiName: pick.ai_name,
        confidence: pick.confidence * 100
      }))
      setPositions(portfolioPositions)
    }
    
    setLoading(false)
  }

  function calculateMetrics() {
    const totalValue = positions.reduce((sum, p) => sum + (p.currentPrice * p.shares), 0)
    const totalCost = positions.reduce((sum, p) => sum + (p.entryPrice * p.shares), 0)
    const totalGainLoss = totalValue - totalCost
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost * 100) : 0
    
    return { totalValue, totalCost, totalGainLoss, totalGainLossPercent }
  }

  function addPosition() {
    if (!newPosition.symbol || newPosition.shares <= 0 || newPosition.entryPrice <= 0) {
      alert('Please fill all fields correctly')
      return
    }

    const position: Position = {
      id: Date.now().toString(),
      symbol: newPosition.symbol.toUpperCase(),
      shares: newPosition.shares,
      entryPrice: newPosition.entryPrice,
      currentPrice: newPosition.entryPrice * (1 + (Math.random() * 0.1 - 0.05)),
      entryDate: new Date().toISOString(),
      aiName: 'Manual Entry',
      confidence: 0
    }

    setPositions([...positions, position])
    setShowAddModal(false)
    setNewPosition({ symbol: '', shares: 0, entryPrice: 0 })
  }

  function removePosition(id: string) {
    if (confirm('Remove this position from portfolio?')) {
      setPositions(positions.filter(p => p.id !== id))
    }
  }

  const metrics = calculateMetrics()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-white text-xl">Loading portfolio...</div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">My Portfolio</h1>
              <p className="text-gray-300">Track your stock positions and performance</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition"
            >
              + Add Position
            </button>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Total Value</div>
            <div className="text-3xl font-bold text-white">${metrics.totalValue.toFixed(2)}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Total Cost</div>
            <div className="text-3xl font-bold text-white">${metrics.totalCost.toFixed(2)}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Gain/Loss</div>
            <div className={`text-3xl font-bold ${metrics.totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${metrics.totalGainLoss.toFixed(2)}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Return</div>
            <div className={`text-3xl font-bold ${metrics.totalGainLossPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {metrics.totalGainLossPercent >= 0 ? '+' : ''}{metrics.totalGainLossPercent.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Positions Table */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">Positions</h2>
          
          {positions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-4">No positions yet</div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition"
              >
                Add Your First Position
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Symbol</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Shares</th>
                    <th className="text-right py-3 px-4 text-gray-300 font-semibold">Entry Price</th>
                    <th className="text-right py-3 px-4 text-gray-300 font-semibold">Current Price</th>
                    <th className="text-right py-3 px-4 text-gray-300 font-semibold">Position Value</th>
                    <th className="text-right py-3 px-4 text-gray-300 font-semibold">Gain/Loss</th>
                    <th className="text-right py-3 px-4 text-gray-300 font-semibold">Return %</th>
                    <th className="text-center py-3 px-4 text-gray-300 font-semibold">AI Source</th>
                    <th className="text-center py-3 px-4 text-gray-300 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position) => {
                    const positionValue = position.currentPrice * position.shares
                    const positionCost = position.entryPrice * position.shares
                    const gainLoss = positionValue - positionCost
                    const gainLossPercent = (gainLoss / positionCost * 100)

                    return (
                      <tr key={position.id} className="border-b border-white/10 hover:bg-white/5 transition">
                        <td className="py-4 px-4">
                          <Link 
                            href={`/stock/${position.symbol}`}
                            className="text-white font-bold hover:text-blue-400 transition"
                          >
                            {position.symbol}
                          </Link>
                        </td>
                        <td className="py-4 px-4 text-white">{position.shares}</td>
                        <td className="py-4 px-4 text-right text-white">${position.entryPrice.toFixed(2)}</td>
                        <td className="py-4 px-4 text-right text-white">${position.currentPrice.toFixed(2)}</td>
                        <td className="py-4 px-4 text-right text-white font-semibold">${positionValue.toFixed(2)}</td>
                        <td className={`py-4 px-4 text-right font-semibold ${gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${gainLoss.toFixed(2)}
                        </td>
                        <td className={`py-4 px-4 text-right font-semibold ${gainLossPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-500/20 text-blue-300">
                            {position.aiName}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => removePosition(position.id)}
                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Position Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-6">Add Position</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Stock Symbol</label>
                  <input
                    type="text"
                    placeholder="AAPL"
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none uppercase"
                    value={newPosition.symbol}
                    onChange={(e) => setNewPosition({...newPosition, symbol: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Number of Shares</label>
                  <input
                    type="number"
                    placeholder="100"
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    value={newPosition.shares || ''}
                    onChange={(e) => setNewPosition({...newPosition, shares: parseFloat(e.target.value)})}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Entry Price</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    value={newPosition.entryPrice || ''}
                    onChange={(e) => setNewPosition({...newPosition, entryPrice: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={addPosition}
                  className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition"
                >
                  Add Position
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">💡 Portfolio Tips</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              <strong className="text-white">Diversification:</strong> Don't put all your eggs in one basket. Spread investments across different sectors.
            </p>
            <p>
              <strong className="text-white">Regular Review:</strong> Check your portfolio weekly to stay informed about your positions.
            </p>
            <p>
              <strong className="text-white">Set Targets:</strong> Define profit targets and stop-loss levels for each position before entering.
            </p>
            <p>
              <strong className="text-white">Follow AI Confidence:</strong> Higher confidence picks from multiple AIs tend to perform better.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
