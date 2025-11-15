'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface BacktestConfig {
  startDate: string
  endDate: string
  initialCapital: number
  positionSize: 'equal' | 'confidence' | 'risk-weighted'
  strategy: 'all' | 'high-confidence' | 'multi-ai' | 'single-ai'
  aiModel?: string
  minConfidence: number
  maxPositionPercent: number  // Max % of capital per position
  riskFreeRate: number  // For Sharpe ratio (annual %)
}

interface BacktestResult {
  totalTrades: number
  winners: number
  losers: number
  pending: number
  winRate: number
  totalReturn: number
  totalReturnPercent: number
  averageGain: number
  averageLoss: number
  bestTrade: { symbol: string; gain: number; gainPercent: number }
  worstTrade: { symbol: string; gain: number; gainPercent: number }
  sharpeRatio: number
  maxDrawdown: number
  finalPortfolioValue: number
  profitFactor: number
  trades: TradeDetail[]
  portfolioHistory: PortfolioSnapshot[]
}

interface TradeDetail {
  symbol: string
  entryPrice: number
  exitPrice: number
  shares: number
  entryValue: number
  exitValue: number
  gainLoss: number
  gainLossPercent: number
  entryDate: string
  exitDate: string | null
  aiName: string
  confidence: number
}

interface PortfolioSnapshot {
  date: string
  value: number
  cashBalance: number
  positions: number
}

interface StockPick {
  id: string
  symbol: string
  ai_name: string
  entry_price: number
  exit_price: number | null
  confidence_score: number
  pick_date: string
  exit_date: string | null
  status: string
}

export default function BacktestingPage() {
  const [config, setConfig] = useState<BacktestConfig>({
    startDate: '2024-01-01',
    endDate: new Date().toISOString().split('T')[0],
    initialCapital: 10000,
    positionSize: 'equal',
    strategy: 'all',
    minConfidence: 70,
    maxPositionPercent: 10,  // Max 10% per position
    riskFreeRate: 4.5  // Treasury rate
  })

  const [result, setResult] = useState<BacktestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableAIs, setAvailableAIs] = useState<string[]>([])

  useEffect(() => {
    loadAvailableAIs()
  }, [])

  async function loadAvailableAIs() {
    try {
      const { data } = await supabase
        .from('ai_models')
        .select('display_name')
        .eq('is_active', true)

      if (data) {
        setAvailableAIs(data.map(m => m.display_name))
      }
    } catch (err) {
      console.error('Error loading AIs:', err)
    }
  }

  async function runBacktest() {
    setLoading(true)
    setError(null)

    try {
      // Load historical picks in date range
      const { data: picks, error: picksError } = await supabase
        .from('stock_picks')
        .select('*')
        .gte('pick_date', config.startDate)
        .lte('pick_date', config.endDate)
        .order('pick_date', { ascending: true })

      if (picksError) {
        throw new Error(`Failed to load picks: ${picksError.message}`)
      }

      if (!picks || picks.length === 0) {
        throw new Error('No picks found in selected date range')
      }

      // Filter picks based on strategy
      let filteredPicks: StockPick[] = picks as StockPick[]
      
      if (config.strategy === 'high-confidence') {
        filteredPicks = picks.filter(p => p.confidence_score >= 85)
      } else if (config.strategy === 'multi-ai') {
        const symbolCounts: Record<string, number> = {}
        picks.forEach(p => {
          symbolCounts[p.symbol] = (symbolCounts[p.symbol] || 0) + 1
        })
        const multiAISymbols = Object.keys(symbolCounts).filter(s => symbolCounts[s] >= 2)
        filteredPicks = picks.filter(p => multiAISymbols.includes(p.symbol))
      } else if (config.strategy === 'single-ai' && config.aiModel) {
        filteredPicks = picks.filter(p => p.ai_name === config.aiModel)
      }

      // Further filter by min confidence
      filteredPicks = filteredPicks.filter(p => p.confidence_score >= config.minConfidence)

      if (filteredPicks.length === 0) {
        throw new Error('No picks match your strategy criteria')
      }

      // CRITICAL: Calculate proper position sizing
      const trades: TradeDetail[] = []
      let cashBalance = config.initialCapital
      const positions: Record<string, number> = {}
      const portfolioHistory: PortfolioSnapshot[] = []
      const returns: number[] = []
      let peakValue = config.initialCapital
      let maxDrawdown = 0

      for (const pick of filteredPicks) {
        // Calculate position size based on strategy
        let positionValue = 0

        if (config.positionSize === 'equal') {
          // Equal weighting: divide capital by expected number of positions
          const avgPositions = Math.min(20, filteredPicks.length / 2)
          positionValue = config.initialCapital / avgPositions
        } else if (config.positionSize === 'confidence') {
          // Confidence weighting: higher confidence = larger position
          const confidenceWeight = pick.confidence_score / 100
          positionValue = config.initialCapital * 0.05 * confidenceWeight
        } else {
          // Risk-weighted: based on distance to target
          const upside = (pick.target_price - pick.entry_price) / pick.entry_price
          const riskWeight = Math.min(upside / 0.5, 1)  // Cap at 50% upside
          positionValue = config.initialCapital * 0.05 * riskWeight
        }

        // Apply max position size constraint
        const maxPosition = config.initialCapital * (config.maxPositionPercent / 100)
        positionValue = Math.min(positionValue, maxPosition)

        // Calculate shares (must be whole numbers for stocks)
        const shares = Math.floor(positionValue / pick.entry_price)
        
        if (shares === 0) continue  // Skip if can't afford even 1 share

        const actualEntryValue = shares * pick.entry_price

        // Check if we have enough cash
        if (actualEntryValue > cashBalance) {
          // Reduce shares to fit available cash
          const affordableShares = Math.floor(cashBalance / pick.entry_price)
          if (affordableShares === 0) continue
        }

        // Execute trade
        const actualShares = Math.min(shares, Math.floor(cashBalance / pick.entry_price))
        const entryValue = actualShares * pick.entry_price

        // Only execute if exit price exists (completed trade)
        if (!pick.exit_price || !pick.exit_date) {
          // Pending trade
          trades.push({
            symbol: pick.symbol,
            entryPrice: pick.entry_price,
            exitPrice: 0,
            shares: actualShares,
            entryValue,
            exitValue: 0,
            gainLoss: 0,
            gainLossPercent: 0,
            entryDate: pick.pick_date,
            exitDate: null,
            aiName: pick.ai_name,
            confidence: pick.confidence_score
          })
          continue
        }

        const exitValue = actualShares * pick.exit_price
        const gainLoss = exitValue - entryValue
        const gainLossPercent = (gainLoss / entryValue) * 100

        // Update cash balance
        cashBalance -= entryValue  // Buy
        cashBalance += exitValue   // Sell

        // Record trade
        trades.push({
          symbol: pick.symbol,
          entryPrice: pick.entry_price,
          exitPrice: pick.exit_price,
          shares: actualShares,
          entryValue,
          exitValue,
          gainLoss,
          gainLossPercent,
          entryDate: pick.pick_date,
          exitDate: pick.exit_date,
          aiName: pick.ai_name,
          confidence: pick.confidence_score
        })

        // Record return for Sharpe ratio
        returns.push(gainLossPercent / 100)

        // Update portfolio value
        const currentPortfolioValue = cashBalance
        portfolioHistory.push({
          date: pick.exit_date,
          value: currentPortfolioValue,
          cashBalance,
          positions: 0
        })

        // Track drawdown
        if (currentPortfolioValue > peakValue) {
          peakValue = currentPortfolioValue
        } else {
          const drawdown = (peakValue - currentPortfolioValue) / peakValue
          maxDrawdown = Math.max(maxDrawdown, drawdown)
        }
      }

      // Calculate final results
      const completedTrades = trades.filter(t => t.exitPrice > 0)
      const winners = completedTrades.filter(t => t.gainLoss > 0)
      const losers = completedTrades.filter(t => t.gainLoss <= 0)
      const pending = trades.filter(t => t.exitPrice === 0)

      const totalReturn = completedTrades.reduce((sum, t) => sum + t.gainLoss, 0)
      const totalReturnPercent = (totalReturn / config.initialCapital) * 100
      const finalPortfolioValue = cashBalance

      const winRate = completedTrades.length > 0
        ? (winners.length / completedTrades.length) * 100
        : 0

      const averageGain = winners.length > 0
        ? winners.reduce((sum, t) => sum + t.gainLossPercent, 0) / winners.length
        : 0

      const averageLoss = losers.length > 0
        ? losers.reduce((sum, t) => sum + t.gainLossPercent, 0) / losers.length
        : 0

      // CRITICAL: Calculate Sharpe Ratio
      // Sharpe = (Average Return - Risk Free Rate) / Standard Deviation of Returns
      const avgReturn = returns.length > 0
        ? returns.reduce((sum, r) => sum + r, 0) / returns.length
        : 0

      const variance = returns.length > 0
        ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
        : 0

      const stdDev = Math.sqrt(variance)
      const riskFreeRateDecimal = config.riskFreeRate / 100
      const annualizedReturn = avgReturn * 252  // 252 trading days
      const annualizedStdDev = stdDev * Math.sqrt(252)
      const sharpeRatio = annualizedStdDev > 0
        ? (annualizedReturn - riskFreeRateDecimal) / annualizedStdDev
        : 0

      // Calculate profit factor
      const totalGains = winners.reduce((sum, t) => sum + t.gainLoss, 0)
      const totalLosses = Math.abs(losers.reduce((sum, t) => sum + t.gainLoss, 0))
      const profitFactor = totalLosses > 0 ? totalGains / totalLosses : 0

      // Find best and worst trades
      const sortedByGain = completedTrades.sort((a, b) => b.gainLossPercent - a.gainLossPercent)
      const bestTrade = sortedByGain[0] || { symbol: 'N/A', gain: 0, gainPercent: 0 }
      const worstTrade = sortedByGain[sortedByGain.length - 1] || { symbol: 'N/A', gain: 0, gainPercent: 0 }

      setResult({
        totalTrades: filteredPicks.length,
        winners: winners.length,
        losers: losers.length,
        pending: pending.length,
        winRate,
        totalReturn,
        totalReturnPercent,
        averageGain,
        averageLoss,
        bestTrade: {
          symbol: bestTrade.symbol,
          gain: bestTrade.gainLoss || 0,
          gainPercent: bestTrade.gainLossPercent || 0
        },
        worstTrade: {
          symbol: worstTrade.symbol,
          gain: worstTrade.gainLoss || 0,
          gainPercent: worstTrade.gainLossPercent || 0
        },
        sharpeRatio,
        maxDrawdown: maxDrawdown * 100,
        finalPortfolioValue,
        profitFactor,
        trades: trades.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()),
        portfolioHistory
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during backtest'
      setError(errorMessage)
      console.error('Backtest error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            ⏮️ Strategy Backtesting
          </h1>
          <p className="text-xl text-slate-300">
            Test AI strategies with REAL capital allocation and risk metrics
          </p>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
          <h2 className="text-2xl font-bold mb-6">Backtest Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={config.startDate}
                onChange={(e) => setConfig({...config, startDate: e.target.value})}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={config.endDate}
                onChange={(e) => setConfig({...config, endDate: e.target.value})}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              />
            </div>

            {/* Initial Capital */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Initial Capital ($)
              </label>
              <input
                type="number"
                value={config.initialCapital}
                onChange={(e) => setConfig({...config, initialCapital: Number(e.target.value)})}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              />
            </div>

            {/* Position Sizing */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Position Sizing
              </label>
              <select
                value={config.positionSize}
                onChange={(e) => setConfig({...config, positionSize: e.target.value as any})}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="equal">Equal Weight</option>
                <option value="confidence">Confidence Weight</option>
                <option value="risk-weighted">Risk-Weighted</option>
              </select>
            </div>

            {/* Strategy */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Strategy
              </label>
              <select
                value={config.strategy}
                onChange={(e) => setConfig({...config, strategy: e.target.value as any})}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="all">All Picks</option>
                <option value="high-confidence">High Confidence Only</option>
                <option value="multi-ai">Multi-AI Consensus</option>
                <option value="single-ai">Single AI</option>
              </select>
            </div>

            {/* AI Model (if single-ai strategy) */}
            {config.strategy === 'single-ai' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  AI Model
                </label>
                <select
                  value={config.aiModel || ''}
                  onChange={(e) => setConfig({...config, aiModel: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                >
                  <option value="">Select AI...</option>
                  {availableAIs.map(ai => (
                    <option key={ai} value={ai}>{ai}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Min Confidence */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Min Confidence (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={config.minConfidence}
                onChange={(e) => setConfig({...config, minConfidence: Number(e.target.value)})}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              />
            </div>

            {/* Max Position % */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Max Position (% of capital)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={config.maxPositionPercent}
                onChange={(e) => setConfig({...config, maxPositionPercent: Number(e.target.value)})}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              />
            </div>

            {/* Risk Free Rate */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Risk-Free Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                step="0.1"
                value={config.riskFreeRate}
                onChange={(e) => setConfig({...config, riskFreeRate: Number(e.target.value)})}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              />
            </div>
          </div>

          {/* Run Button */}
          <button
            onClick={runBacktest}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-700 disabled:to-slate-700 rounded-lg font-bold text-lg transition disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Running Backtest...
              </span>
            ) : (
              'Run Backtest'
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-center">
              <div className="text-3xl mr-4">⚠️</div>
              <div>
                <div className="font-bold text-red-400 mb-1">Backtest Error</div>
                <div className="text-slate-300">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl p-6 border border-green-500/30">
                <div className="text-sm text-green-300 mb-2">Final Portfolio Value</div>
                <div className="text-4xl font-bold">
                  ${result.finalPortfolioValue.toLocaleString(undefined, {maximumFractionDigits: 2})}
                </div>
                <div className={`text-sm mt-2 font-semibold ${result.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {result.totalReturn >= 0 ? '+' : ''}${result.totalReturn.toFixed(2)} ({result.totalReturnPercent >= 0 ? '+' : ''}{result.totalReturnPercent.toFixed(2)}%)
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="text-sm text-slate-400 mb-2">Win Rate</div>
                <div className="text-4xl font-bold text-blue-400">
                  {result.winRate.toFixed(1)}%
                </div>
                <div className="text-sm text-slate-400 mt-2">
                  {result.winners}W / {result.losers}L / {result.pending}P
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="text-sm text-slate-400 mb-2">Sharpe Ratio</div>
                <div className={`text-4xl font-bold ${result.sharpeRatio >= 1 ? 'text-green-400' : result.sharpeRatio >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {result.sharpeRatio.toFixed(2)}
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  {result.sharpeRatio >= 2 ? 'Excellent' : result.sharpeRatio >= 1 ? 'Good' : result.sharpeRatio >= 0 ? 'Acceptable' : 'Poor'}
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="text-sm text-slate-400 mb-2">Max Drawdown</div>
                <div className="text-4xl font-bold text-red-400">
                  -{result.maxDrawdown.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Largest peak-to-trough decline
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="text-sm text-slate-400 mb-2">Profit Factor</div>
                <div className={`text-4xl font-bold ${result.profitFactor >= 2 ? 'text-green-400' : result.profitFactor >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {result.profitFactor.toFixed(2)}
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Gross profit ÷ Gross loss
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="text-sm text-slate-400 mb-2">Avg Win</div>
                <div className="text-4xl font-bold text-green-400">
                  +{result.averageGain.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Per winning trade
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="text-sm text-slate-400 mb-2">Avg Loss</div>
                <div className="text-4xl font-bold text-red-400">
                  {result.averageLoss.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Per losing trade
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="text-sm text-slate-400 mb-2">Total Trades</div>
                <div className="text-4xl font-bold text-purple-400">
                  {result.totalTrades}
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Completed: {result.winners + result.losers}
                </div>
              </div>
            </div>

            {/* Best/Worst Trades */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-xl p-6 border border-green-500/30">
                <div className="text-lg font-bold mb-4 text-green-300">🏆 Best Trade</div>
                <div className="text-3xl font-bold mb-2">{result.bestTrade.symbol}</div>
                <div className="text-2xl font-bold text-green-400">
                  +${result.bestTrade.gain.toFixed(2)} (+{result.bestTrade.gainPercent.toFixed(1)}%)
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-500/10 to-rose-600/10 rounded-xl p-6 border border-red-500/30">
                <div className="text-lg font-bold mb-4 text-red-300">⚠️ Worst Trade</div>
                <div className="text-3xl font-bold mb-2">{result.worstTrade.symbol}</div>
                <div className="text-2xl font-bold text-red-400">
                  ${result.worstTrade.gain.toFixed(2)} ({result.worstTrade.gainPercent.toFixed(1)}%)
                </div>
              </div>
            </div>

            {/* Trade History */}
            <div className="bg-white/5 rounded-xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold mb-6">Trade History</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="pb-3 px-4">Symbol</th>
                      <th className="pb-3 px-4">AI</th>
                      <th className="pb-3 px-4">Shares</th>
                      <th className="pb-3 px-4">Entry</th>
                      <th className="pb-3 px-4">Exit</th>
                      <th className="pb-3 px-4">P/L</th>
                      <th className="pb-3 px-4">%</th>
                      <th className="pb-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.slice(0, 50).map((trade, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="py-3 px-4 font-bold">{trade.symbol}</td>
                        <td className="py-3 px-4 text-sm text-slate-400">{trade.aiName}</td>
                        <td className="py-3 px-4">{trade.shares.toLocaleString()}</td>
                        <td className="py-3 px-4">${trade.entryPrice.toFixed(2)}</td>
                        <td className="py-3 px-4">{trade.exitPrice > 0 ? `$${trade.exitPrice.toFixed(2)}` : '-'}</td>
                        <td className={`py-3 px-4 font-semibold ${trade.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {trade.gainLoss >= 0 ? '+' : ''}${trade.gainLoss.toFixed(2)}
                        </td>
                        <td className={`py-3 px-4 font-semibold ${trade.gainLossPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {trade.gainLossPercent >= 0 ? '+' : ''}{trade.gainLossPercent.toFixed(1)}%
                        </td>
                        <td className="py-3 px-4">
                          {trade.exitPrice === 0 ? (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">Pending</span>
                          ) : trade.gainLoss >= 0 ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">Win</span>
                          ) : (
                            <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs">Loss</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {result.trades.length > 50 && (
                <div className="text-center mt-6 text-slate-400">
                  Showing first 50 of {result.trades.length} trades
                </div>
              )}
            </div>

            {/* What This Means */}
            <div className="bg-blue-500/10 rounded-xl p-8 border border-blue-500/30 mt-8">
              <h2 className="text-2xl font-bold mb-4">📊 What This Means</h2>
              
              <div className="space-y-4 text-slate-300">
                <div>
                  <strong className="text-white">Win Rate:</strong> {result.winRate.toFixed(1)}% of your trades were profitable. 
                  {result.winRate >= 60 ? ' Excellent! Above 60% is very strong.' : result.winRate >= 50 ? ' Good! Above 50% means more wins than losses.' : ' Below 50% means you lost more trades than you won.'}
                </div>

                <div>
                  <strong className="text-white">Sharpe Ratio:</strong> {result.sharpeRatio.toFixed(2)} measures risk-adjusted returns. 
                  {result.sharpeRatio >= 2 ? ' Exceptional! You earned great returns for the risk taken.' : result.sharpeRatio >= 1 ? ' Good! Returns justify the risk.' : result.sharpeRatio >= 0 ? ' Acceptable, but you could earn similar returns with less risk elsewhere.' : ' Poor risk/reward profile.'}
                </div>

                <div>
                  <strong className="text-white">Max Drawdown:</strong> Your portfolio value dropped as much as {result.maxDrawdown.toFixed(1)}% from peak to trough. 
                  {result.maxDrawdown <= 10 ? ' Excellent risk management!' : result.maxDrawdown <= 20 ? ' Moderate volatility.' : ' High volatility - nerve-wracking for most investors.'}
                </div>

                <div>
                  <strong className="text-white">Profit Factor:</strong> {result.profitFactor.toFixed(2)} means for every $1 you lost, you made ${result.profitFactor.toFixed(2)} in gains. 
                  {result.profitFactor >= 2 ? ' Excellent! Strong positive expectancy.' : result.profitFactor >= 1 ? ' Profitable, but room for improvement.' : ' Losing strategy overall.'}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Instructions */}
        {!result && (
          <div className="bg-white/5 rounded-xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold mb-6">How to Use Backtesting</h2>
            
            <ol className="space-y-4 text-slate-300">
              <li className="flex">
                <span className="font-bold text-purple-400 mr-3">1.</span>
                <div>
                  <strong className="text-white">Select your date range:</strong> Choose dates that have completed trades (picks with exit prices)
                </div>
              </li>
              <li className="flex">
                <span className="font-bold text-purple-400 mr-3">2.</span>
                <div>
                  <strong className="text-white">Set initial capital:</strong> How much money you would have started with
                </div>
              </li>
              <li className="flex">
                <span className="font-bold text-purple-400 mr-3">3.</span>
                <div>
                  <strong className="text-white">Choose position sizing:</strong>
                  <ul className="ml-6 mt-2 space-y-1 text-sm">
                    <li>• <strong>Equal Weight:</strong> Same $ amount per position</li>
                    <li>• <strong>Confidence Weight:</strong> Higher confidence = larger position</li>
                    <li>• <strong>Risk-Weighted:</strong> Based on upside potential</li>
                  </ul>
                </div>
              </li>
              <li className="flex">
                <span className="font-bold text-purple-400 mr-3">4.</span>
                <div>
                  <strong className="text-white">Select a strategy:</strong>
                  <ul className="ml-6 mt-2 space-y-1 text-sm">
                    <li>• <strong>All Picks:</strong> Every AI pick in the range</li>
                    <li>• <strong>High Confidence:</strong> Only picks with 85%+ confidence</li>
                    <li>• <strong>Multi-AI Consensus:</strong> Stocks picked by 2+ AIs</li>
                    <li>• <strong>Single AI:</strong> Follow one specific AI model</li>
                  </ul>
                </div>
              </li>
              <li className="flex">
                <span className="font-bold text-purple-400 mr-3">5.</span>
                <div>
                  <strong className="text-white">Click "Run Backtest":</strong> The system will calculate actual shares purchased, real P/L, Sharpe ratio, and all metrics based on your capital allocation strategy
                </div>
              </li>
            </ol>

            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="font-bold text-yellow-300 mb-2">⚠️ Important Notes:</div>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Backtesting shows what WOULD HAVE happened - it doesn't guarantee future results</li>
                <li>• Uses REAL capital allocation (not just % gains like competitors)</li>
                <li>• Sharpe ratio measures risk-adjusted returns (higher = better)</li>
                <li>• Max drawdown shows largest peak-to-trough decline</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
