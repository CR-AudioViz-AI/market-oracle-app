'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Position {
  id: string
  symbol: string
  quantity: number
  entry_price: number
  current_price: number
  total_cost: number
  current_value: number
  gain_loss: number
  gain_loss_percent: number
}

interface Trade {
  id: string
  symbol: string
  action: 'BUY' | 'SELL'
  quantity: number
  price: number
  total: number
  timestamp: string
}

export default function PaperTradingPage() {
  const [cash, setCash] = useState(100000)
  const [positions, setPositions] = useState<Position[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)

  // Buy/Sell form state
  const [selectedSymbol, setSelectedSymbol] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY')
  const [availableStocks, setAvailableStocks] = useState<string[]>([])

  useEffect(() => {
    // Get or create user ID
    let uid = localStorage.getItem('market_oracle_user_id')
    if (!uid) {
      uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('market_oracle_user_id', uid)
    }
    setUserId(uid)

    loadPortfolio()
    loadAvailableStocks()
  }, [])

  async function loadAvailableStocks() {
    const { data } = await supabase
      .from('stock_picks')
      .select('symbol')
      .eq('status', 'OPEN')

    if (data) {
      const symbols = Array.from(new Set(data.map(p => p.symbol)))
      setAvailableStocks(symbols)
    }
  }

  async function loadPortfolio() {
    // Load portfolio from localStorage for now
    const savedPortfolio = localStorage.getItem('paper_trading_portfolio')
    if (savedPortfolio) {
      const portfolio = JSON.parse(savedPortfolio)
      setCash(portfolio.cash || 100000)
      setPositions(portfolio.positions || [])
      setTrades(portfolio.trades || [])
    }

    setLoading(false)
  }

  async function getCurrentPrice(symbol: string): Promise<number> {
    try {
      const response = await fetch(`/api/stock-price?symbols=${symbol}`)
      const data = await response.json()
      return data.prices[symbol]?.price || 0
    } catch (error) {
      // Fallback to entry price from database
      const { data } = await supabase
        .from('stock_picks')
        .select('entry_price')
        .eq('symbol', symbol)
        .eq('status', 'OPEN')
        .limit(1)
        .single()

      return data?.entry_price || 100
    }
  }

  async function executeTrade() {
    if (!selectedSymbol || quantity <= 0) {
      alert('Please select a stock and enter a valid quantity')
      return
    }

    const currentPrice = await getCurrentPrice(selectedSymbol)
    const total = currentPrice * quantity

    if (action === 'BUY') {
      if (total > cash) {
        alert('Insufficient funds!')
        return
      }

      // Buy stock
      const existingPosition = positions.find(p => p.symbol === selectedSymbol)

      if (existingPosition) {
        // Add to existing position
        const newQuantity = existingPosition.quantity + quantity
        const newAvgPrice = ((existingPosition.entry_price * existingPosition.quantity) + (currentPrice * quantity)) / newQuantity

        setPositions(positions.map(p =>
          p.symbol === selectedSymbol
            ? {
                ...p,
                quantity: newQuantity,
                entry_price: newAvgPrice,
                total_cost: newAvgPrice * newQuantity,
                current_price: currentPrice,
                current_value: currentPrice * newQuantity,
                gain_loss: (currentPrice - newAvgPrice) * newQuantity,
                gain_loss_percent: ((currentPrice - newAvgPrice) / newAvgPrice) * 100
              }
            : p
        ))
      } else {
        // Create new position
        setPositions([...positions, {
          id: `pos_${Date.now()}`,
          symbol: selectedSymbol,
          quantity,
          entry_price: currentPrice,
          current_price: currentPrice,
          total_cost: total,
          current_value: total,
          gain_loss: 0,
          gain_loss_percent: 0
        }])
      }

      setCash(cash - total)

    } else {
      // Sell stock
      const position = positions.find(p => p.symbol === selectedSymbol)

      if (!position || position.quantity < quantity) {
        alert('Insufficient shares to sell!')
        return
      }

      if (position.quantity === quantity) {
        // Close position
        setPositions(positions.filter(p => p.symbol !== selectedSymbol))
      } else {
        // Reduce position
        setPositions(positions.map(p =>
          p.symbol === selectedSymbol
            ? {
                ...p,
                quantity: p.quantity - quantity,
                total_cost: p.entry_price * (p.quantity - quantity),
                current_value: currentPrice * (p.quantity - quantity),
                gain_loss: (currentPrice - p.entry_price) * (p.quantity - quantity),
                gain_loss_percent: ((currentPrice - p.entry_price) / p.entry_price) * 100
              }
            : p
        ))
      }

      setCash(cash + total)
    }

    // Record trade
    const newTrade: Trade = {
      id: `trade_${Date.now()}`,
      symbol: selectedSymbol,
      action,
      quantity,
      price: currentPrice,
      total,
      timestamp: new Date().toISOString()
    }

    setTrades([newTrade, ...trades])

    // Save to localStorage
    savePortfolio()

    // Reset form
    setSelectedSymbol('')
    setQuantity(1)

    alert(`${action} order executed successfully!`)
  }

  function savePortfolio() {
    const portfolio = {
      cash,
      positions,
      trades
    }
    localStorage.setItem('paper_trading_portfolio', JSON.stringify(portfolio))
  }

  useEffect(() => {
    if (!loading) {
      savePortfolio()
    }
  }, [cash, positions, trades])

  const portfolioValue = positions.reduce((sum, p) => sum + p.current_value, 0)
  const totalValue = cash + portfolioValue
  const totalGainLoss = totalValue - 100000
  const totalGainLossPercent = ((totalValue - 100000) / 100000) * 100

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-2xl">Loading paper trading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="text-4xl font-bold mb-2">📝 Paper Trading</h1>
        <p className="text-slate-400 mb-8">
          Practice trading with $100,000 virtual cash - No real money at risk
        </p>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-sm text-slate-400 mb-1">Cash Available</div>
            <div className="text-3xl font-bold text-green-400">
              ${cash.toLocaleString(undefined, {maximumFractionDigits: 2})}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-sm text-slate-400 mb-1">Positions Value</div>
            <div className="text-3xl font-bold">
              ${portfolioValue.toLocaleString(undefined, {maximumFractionDigits: 2})}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-sm text-slate-400 mb-1">Total Value</div>
            <div className="text-3xl font-bold text-blue-400">
              ${totalValue.toLocaleString(undefined, {maximumFractionDigits: 2})}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-sm text-slate-400 mb-1">Total Gain/Loss</div>
            <div className={`text-3xl font-bold ${totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString(undefined, {maximumFractionDigits: 2})}
            </div>
            <div className={`text-sm ${totalGainLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {totalGainLoss >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Trade Form */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
          <h2 className="text-2xl font-bold mb-6">Execute Trade</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Action
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAction('BUY')}
                  className={`flex-1 py-2 rounded-lg font-semibold transition ${
                    action === 'BUY'
                      ? 'bg-green-500 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  BUY
                </button>
                <button
                  onClick={() => setAction('SELL')}
                  className={`flex-1 py-2 rounded-lg font-semibold transition ${
                    action === 'SELL'
                      ? 'bg-red-500 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  SELL
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Stock Symbol
              </label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="">Select stock...</option>
                {availableStocks.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={executeTrade}
                disabled={!selectedSymbol || quantity <= 0}
                className={`w-full py-2 rounded-lg font-semibold transition ${
                  action === 'BUY'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                } disabled:bg-slate-600 text-white`}
              >
                {action} {selectedSymbol || 'Stock'}
              </button>
            </div>
          </div>
        </div>

        {/* Current Positions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Open Positions ({positions.length})</h2>

          {positions.length > 0 ? (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left">Symbol</th>
                    <th className="px-6 py-3 text-right">Quantity</th>
                    <th className="px-6 py-3 text-right">Avg Price</th>
                    <th className="px-6 py-3 text-right">Current Price</th>
                    <th className="px-6 py-3 text-right">Total Value</th>
                    <th className="px-6 py-3 text-right">Gain/Loss</th>
                    <th className="px-6 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position) => (
                    <tr key={position.id} className="border-t border-white/10">
                      <td className="px-6 py-4 font-bold">{position.symbol}</td>
                      <td className="px-6 py-4 text-right">{position.quantity}</td>
                      <td className="px-6 py-4 text-right">${position.entry_price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">${position.current_price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">${position.current_value.toFixed(2)}</td>
                      <td className={`px-6 py-4 text-right font-semibold ${
                        position.gain_loss >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {position.gain_loss >= 0 ? '+' : ''}${position.gain_loss.toFixed(2)}
                        <br />
                        <span className="text-xs">
                          ({position.gain_loss >= 0 ? '+' : ''}{position.gain_loss_percent.toFixed(2)}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedSymbol(position.symbol)
                            setAction('SELL')
                            setQuantity(position.quantity)
                          }}
                          className="px-4 py-1 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition text-sm"
                        >
                          Sell
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-12 border border-white/10 text-center">
              <div className="text-4xl mb-4">📊</div>
              <div className="text-slate-400">No open positions. Start trading above!</div>
            </div>
          )}
        </div>

        {/* Trade History */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Trades ({trades.length})</h2>

          {trades.length > 0 ? (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left">Time</th>
                    <th className="px-6 py-3 text-left">Action</th>
                    <th className="px-6 py-3 text-left">Symbol</th>
                    <th className="px-6 py-3 text-right">Quantity</th>
                    <th className="px-6 py-3 text-right">Price</th>
                    <th className="px-6 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.slice(0, 20).map((trade) => (
                    <tr key={trade.id} className="border-t border-white/10">
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(trade.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          trade.action === 'BUY'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {trade.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold">{trade.symbol}</td>
                      <td className="px-6 py-4 text-right">{trade.quantity}</td>
                      <td className="px-6 py-4 text-right">${trade.price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-semibold">
                        ${trade.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-12 border border-white/10 text-center">
              <div className="text-4xl mb-4">📜</div>
              <div className="text-slate-400">No trades yet. Execute your first trade above!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
