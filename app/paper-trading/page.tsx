'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface PaperPosition {
  id: string
  symbol: string
  shares: number
  entryPrice: number
  currentPrice: number
  entryDate: string
}

interface Trade {
  id: string
  symbol: string
  type: 'BUY' | 'SELL'
  shares: number
  price: number
  total: number
  date: string
}

export default function PaperTradingPage() {
  const [balance, setBalance] = useState(100000) // Starting $100k
  const [positions, setPositions] = useState<PaperPosition[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [showTradeModal, setShowTradeModal] = useState(false)
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY')
  const [tradeData, setTradeData] = useState({
    symbol: '',
    shares: 0,
    price: 0
  })
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([])

  useEffect(() => {
    loadPaperAccount()
    loadAvailableSymbols()
  }, [])

  async function loadAvailableSymbols() {
    const { data: picks } = await supabase
      .from('stock_picks')
      .select('symbol')
      .eq('status', 'OPEN')

    if (picks) {
      const symbols = Array.from(new Set(picks.map(p => p.symbol)))
      setAvailableSymbols(symbols)
    }
  }

  function loadPaperAccount() {
    // Load from localStorage if exists
    const savedBalance = localStorage.getItem('paper_balance')
    const savedPositions = localStorage.getItem('paper_positions')
    const savedTrades = localStorage.getItem('paper_trades')

    if (savedBalance) setBalance(parseFloat(savedBalance))
    if (savedPositions) setPositions(JSON.parse(savedPositions))
    if (savedTrades) setTrades(JSON.parse(savedTrades))
  }

  function savePaperAccount() {
    localStorage.setItem('paper_balance', balance.toString())
    localStorage.setItem('paper_positions', JSON.stringify(positions))
    localStorage.setItem('paper_trades', JSON.stringify(trades))
  }

  function executeTrade() {
    const { symbol, shares, price } = tradeData
    
    if (!symbol || shares <= 0 || price <= 0) {
      alert('Please fill all fields correctly')
      return
    }

    const total = shares * price

    if (tradeType === 'BUY') {
      if (total > balance) {
        alert('Insufficient funds!')
        return
      }

      // Check if position exists
      const existingPosition = positions.find(p => p.symbol === symbol.toUpperCase())
      
      if (existingPosition) {
        // Add to existing position
        const newShares = existingPosition.shares + shares
        const newAvgPrice = ((existingPosition.entryPrice * existingPosition.shares) + total) / newShares
        
        setPositions(positions.map(p =>
          p.symbol === symbol.toUpperCase()
            ? { ...p, shares: newShares, entryPrice: newAvgPrice }
            : p
        ))
      } else {
        // Create new position
        const newPosition: PaperPosition = {
          id: Date.now().toString(),
          symbol: symbol.toUpperCase(),
          shares,
          entryPrice: price,
          currentPrice: price,
          entryDate: new Date().toISOString()
        }
        setPositions([...positions, newPosition])
      }

      setBalance(balance - total)
    } else {
      // SELL
      const position = positions.find(p => p.symbol === symbol.toUpperCase())
      
      if (!position) {
        alert('You don\'t own this stock!')
        return
      }

      if (shares > position.shares) {
        alert(`You only own ${position.shares} shares!`)
        return
      }

      // Update or remove position
      if (shares === position.shares) {
        setPositions(positions.filter(p => p.symbol !== symbol.toUpperCase()))
      } else {
        setPositions(positions.map(p =>
          p.symbol === symbol.toUpperCase()
            ? { ...p, shares: p.shares - shares }
            : p
        ))
      }

      setBalance(balance + total)
    }

    // Record trade
    const newTrade: Trade = {
      id: Date.now().toString(),
      symbol: symbol.toUpperCase(),
      type: tradeType,
      shares,
      price,
      total,
      date: new Date().toISOString()
    }
    setTrades([newTrade, ...trades])

    // Reset and close
    setTradeData({ symbol: '', shares: 0, price: 0 })
    setShowTradeModal(false)

    // Save to localStorage
    setTimeout(savePaperAccount, 100)
  }

  function resetAccount() {
    if (confirm('Reset your paper trading account? This will erase all positions and trades.')) {
      setBalance(100000)
      setPositions([])
      setTrades([])
      localStorage.removeItem('paper_balance')
      localStorage.removeItem('paper_positions')
      localStorage.removeItem('paper_trades')
    }
  }

  function calculatePortfolioValue() {
    const positionsValue = positions.reduce((sum, p) => sum + (p.currentPrice * p.shares), 0)
    return balance + positionsValue
  }

  function calculateTotalGainLoss() {
    const totalValue = calculatePortfolioValue()
    return totalValue - 100000
  }

  const totalValue = calculatePortfolioValue()
  const totalGainLoss = calculateTotalGainLoss()
  const totalGainLossPercent = (totalGainLoss / 100000) * 100

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
              <h1 className="text-4xl font-bold text-white mb-2">Paper Trading</h1>
              <p className="text-gray-300">Practice trading with virtual money - $100,000 starting balance</p>
            </div>
            <button
              onClick={resetAccount}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold rounded-lg transition text-sm"
            >
              Reset Account
            </button>
          </div>
        </div>

        {/* Account Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Cash Balance</div>
            <div className="text-3xl font-bold text-white">${balance.toFixed(2)}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Total Value</div>
            <div className="text-3xl font-bold text-white">${totalValue.toFixed(2)}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Gain/Loss</div>
            <div className={`text-3xl font-bold ${totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toFixed(2)}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Return</div>
            <div className={`text-3xl font-bold ${totalGainLossPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => {
              setTradeType('BUY')
              setShowTradeModal(true)
            }}
            className="flex-1 px-6 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition text-lg"
          >
            🟢 BUY Stock
          </button>
          <button
            onClick={() => {
              setTradeType('SELL')
              setShowTradeModal(true)
            }}
            className="flex-1 px-6 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition text-lg"
          >
            🔴 SELL Stock
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Positions */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Your Positions</h2>
            
            {positions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No positions yet. Click BUY to start trading!
              </div>
            ) : (
              <div className="space-y-3">
                {positions.map(position => {
                  const value = position.currentPrice * position.shares
                  const cost = position.entryPrice * position.shares
                  const gainLoss = value - cost
                  const gainLossPercent = (gainLoss / cost) * 100

                  return (
                    <div key={position.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xl font-bold text-white">{position.symbol}</div>
                        <div className="text-sm text-gray-400">{position.shares} shares</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-400">Avg Price</div>
                          <div className="text-white font-semibold">${position.entryPrice.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Current</div>
                          <div className="text-white font-semibold">${position.currentPrice.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Value</div>
                          <div className="text-white font-semibold">${value.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Gain/Loss</div>
                          <div className={`font-semibold ${gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {gainLoss >= 0 ? '+' : ''}${gainLoss.toFixed(2)} ({gainLossPercent.toFixed(1)}%)
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Trades */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Trade History</h2>
            
            {trades.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No trades yet
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {trades.slice(0, 20).map(trade => (
                  <div key={trade.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          trade.type === 'BUY' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {trade.type}
                        </span>
                        <span className="text-white font-bold">{trade.symbol}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">${trade.total.toFixed(2)}</div>
                        <div className="text-gray-400 text-xs">
                          {trade.shares} @ ${trade.price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {new Date(trade.date).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trade Modal */}
        {showTradeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-6">
                {tradeType === 'BUY' ? '🟢 Buy Stock' : '🔴 Sell Stock'}
              </h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Stock Symbol</label>
                  {tradeType === 'BUY' ? (
                    <select
                      className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                      value={tradeData.symbol}
                      onChange={(e) => setTradeData({...tradeData, symbol: e.target.value})}
                    >
                      <option value="">Select stock...</option>
                      {availableSymbols.map(symbol => (
                        <option key={symbol} value={symbol}>{symbol}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                      value={tradeData.symbol}
                      onChange={(e) => setTradeData({...tradeData, symbol: e.target.value})}
                    >
                      <option value="">Select stock...</option>
                      {positions.map(p => (
                        <option key={p.symbol} value={p.symbol}>{p.symbol} ({p.shares} shares)</option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Number of Shares</label>
                  <input
                    type="number"
                    placeholder="100"
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    value={tradeData.shares || ''}
                    onChange={(e) => setTradeData({...tradeData, shares: parseInt(e.target.value) || 0})}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Price per Share</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    value={tradeData.price || ''}
                    onChange={(e) => setTradeData({...tradeData, price: parseFloat(e.target.value) || 0})}
                  />
                </div>

                {tradeData.shares > 0 && tradeData.price > 0 && (
                  <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
                    <div className="text-gray-300 text-sm">Total {tradeType === 'BUY' ? 'Cost' : 'Proceeds'}</div>
                    <div className="text-2xl font-bold text-white">
                      ${(tradeData.shares * tradeData.price).toFixed(2)}
                    </div>
                    {tradeType === 'BUY' && (
                      <div className="text-gray-400 text-xs mt-1">
                        Balance after: ${(balance - (tradeData.shares * tradeData.price)).toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowTradeModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={executeTrade}
                  className={`flex-1 px-4 py-3 font-semibold rounded-lg transition ${
                    tradeType === 'BUY'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {tradeType === 'BUY' ? 'Buy' : 'Sell'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">📊 How Paper Trading Works</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              <strong className="text-white">Virtual Money:</strong> Start with $100,000 in fake money. Practice without risk!
            </p>
            <p>
              <strong className="text-white">Real Prices:</strong> Use actual stock prices from AI picks. Simulate real market conditions.
            </p>
            <p>
              <strong className="text-white">Build Strategy:</strong> Test different approaches. Learn what works before using real money.
            </p>
            <p>
              <strong className="text-white">Track Performance:</strong> Monitor your gains and losses. See how you'd do in the real market.
            </p>
            <p className="text-yellow-400 text-sm">
              💡 Tip: Paper trading is perfect for testing AI stock picks before committing real capital!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

