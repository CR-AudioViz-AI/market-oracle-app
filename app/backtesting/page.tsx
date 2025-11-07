"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function BacktestingPage() {
  const [selectedAI, setSelectedAI] = useState('all')
  const [timeframe, setTimeframe] = useState('30')
  const [startingCapital, setStartingCapital] = useState(10000)
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [aiOptions, setAiOptions] = useState<string[]>([])
  
  useEffect(() => {
    fetchAIModels()
  }, [])

  async function fetchAIModels() {
    const { data } = await supabase
      .from('stock_picks')
      .select('ai_name')
    
    if (data) {
      const unique = Array.from(new Set(data.map((d: any) => d.ai_name))) as string[] as string[]
      setAiOptions(['all', ...unique])
    }
  }

  async function runBacktest() {
    setIsRunning(true)
    
    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(timeframe))
      
      // Fetch historical picks
      let query = supabase
        .from('stock_picks')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      
      if (selectedAI !== 'all') {
        query = query.eq('ai_name', selectedAI)
      }
      
      const { data: picks } = await query
      
      if (!picks || picks.length === 0) {
        setResults({
          error: 'No picks found for this timeframe',
          totalTrades: 0
        })
        setIsRunning(false)
        return
      }
      
      // Calculate backtest metrics
      let capital = startingCapital
      let wins = 0
      let losses = 0
      const trades: any[] = []
      let maxGain = 0
      let maxLoss = 0
      let totalGainPercent = 0
      
      picks.forEach(pick => {
        // Simulate trade entry
        const entryPrice = pick.entry_price
        const targetPrice = pick.target_price
        const currentPrice = pick.current_price || pick.entry_price
        
        // Calculate position size (5% of capital per trade)
        const positionSize = capital * 0.05
        const shares = Math.floor(positionSize / entryPrice)
        const investedAmount = shares * entryPrice
        
        if (investedAmount === 0) return
        
        // Determine if trade hit target or current status
        let exitPrice = currentPrice
        let returnPercent = ((exitPrice - entryPrice) / entryPrice) * 100
        let profit = (exitPrice - entryPrice) * shares
        
        // Track wins/losses
        if (returnPercent > 0) {
          wins++
        } else {
          losses++
        }
        
        // Update capital
        capital += profit
        
        // Track max gain/loss
        if (returnPercent > maxGain) maxGain = returnPercent
        if (returnPercent < maxLoss) maxLoss = returnPercent
        
        totalGainPercent += returnPercent
        
        trades.push({
          symbol: pick.symbol,
          ai: pick.ai_name,
          entryPrice,
          exitPrice,
          returnPercent,
          profit,
          date: new Date(pick.created_at).toLocaleDateString()
        })
      })
      
      const totalTrades = picks.length
      const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0
      const avgGain = totalTrades > 0 ? totalGainPercent / totalTrades : 0
      const finalCapital = capital
      const totalProfit = finalCapital - startingCapital
      const totalReturn = ((finalCapital - startingCapital) / startingCapital) * 100
      
      // Calculate Sharpe Ratio (simplified)
      const returns = trades.map((t: any) => t.returnPercent)
      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
      const stdDev = Math.sqrt(variance)
      const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0
      
      setResults({
        totalTrades,
        wins,
        losses,
        winRate: winRate.toFixed(2),
        avgGain: avgGain.toFixed(2),
        maxGain: maxGain.toFixed(2),
        maxLoss: maxLoss.toFixed(2),
        sharpeRatio: sharpeRatio.toFixed(2),
        startingCapital: startingCapital.toFixed(2),
        finalCapital: finalCapital.toFixed(2),
        totalProfit: totalProfit.toFixed(2),
        totalReturn: totalReturn.toFixed(2),
        trades: trades.slice(0, 10), // Show last 10 trades
        timeframeUsed: timeframe,
        aiUsed: selectedAI
      })
      
    } catch (error) {
      console.error('Backtest error:', error)
      setResults({
        error: 'Failed to run backtest. Please try again.'
      })
    }
    
    setIsRunning(false)
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
              {aiOptions.map((ai: any) => (
                <option key={ai} value={ai}>
                  {ai === 'all' ? 'All AIs Combined' : ai}
                </option>
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
              <option value="14">Last 14 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="60">Last 60 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Starting Capital ($)</label>
            <input
              type="number"
              value={startingCapital}
              onChange={(e) => setStartingCapital(parseInt(e.target.value) || 10000)}
              className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-4 py-3 text-white"
              min="1000"
              step="1000"
            />
          </div>
        </div>

        <button 
          onClick={runBacktest}
          disabled={isRunning}
          className="w-full mt-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-all text-lg"
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Running Backtest...
            </span>
          ) : (
            'Run Backtest 🚀'
          )}
        </button>
      </div>

      {/* Results Display */}
      {results && !results.error && (
        <>
          {/* Summary Stats */}
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30 mb-8">
            <h2 className="text-2xl font-bold mb-4">💰 Backtest Summary</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-300">Starting Capital</div>
                <div className="text-2xl font-bold text-white">${results.startingCapital}</div>
              </div>
              <div>
                <div className="text-sm text-gray-300">Final Capital</div>
                <div className="text-2xl font-bold text-green-400">${results.finalCapital}</div>
              </div>
              <div>
                <div className="text-sm text-gray-300">Total Profit/Loss</div>
                <div className={`text-2xl font-bold ${parseFloat(results.totalProfit) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {parseFloat(results.totalProfit) >= 0 ? '+' : ''}${results.totalProfit} ({parseFloat(results.totalReturn) >= 0 ? '+' : ''}{results.totalReturn}%)
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20">
              <h2 className="text-2xl font-bold mb-6">📊 Performance Metrics</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-lg">
                  <span className="text-gray-400">Total Trades</span>
                  <span className="text-2xl font-bold text-white">{results.totalTrades}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-500/20 rounded-lg border border-green-500/30">
                  <span className="text-gray-300">Wins</span>
                  <span className="text-2xl font-bold text-green-400">{results.wins}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-red-500/20 rounded-lg border border-red-500/30">
                  <span className="text-gray-300">Losses</span>
                  <span className="text-2xl font-bold text-red-400">{results.losses}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
                  <span className="text-gray-300">Win Rate</span>
                  <span className="text-2xl font-bold text-purple-400">{results.winRate}%</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20">
              <h2 className="text-2xl font-bold mb-6">💎 Profit Analysis</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-lg">
                  <span className="text-gray-400">Avg Gain per Trade</span>
                  <span className={`text-2xl font-bold ${parseFloat(results.avgGain) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {parseFloat(results.avgGain) >= 0 ? '+' : ''}{results.avgGain}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-500/20 rounded-lg border border-green-500/30">
                  <span className="text-gray-300">Best Trade</span>
                  <span className="text-2xl font-bold text-green-400">+{results.maxGain}%</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-red-500/20 rounded-lg border border-red-500/30">
                  <span className="text-gray-300">Worst Trade</span>
                  <span className="text-2xl font-bold text-red-400">{results.maxLoss}%</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <span className="text-gray-300">Sharpe Ratio</span>
                  <span className="text-2xl font-bold text-blue-400">{results.sharpeRatio}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Trades */}
          {results.trades && results.trades.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20 mb-8">
              <h2 className="text-2xl font-bold mb-6">📜 Sample Trades (Last 10)</h2>
              <div className="space-y-3">
                {results.trades.map((trade: any, idx: number) => (
                  <div key={idx} className="bg-slate-900/50 rounded-lg p-4 border border-purple-500/20">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xl font-bold text-white">${trade.symbol}</span>
                        <span className="text-sm text-gray-400 ml-3">{trade.ai}</span>
                        <span className="text-sm text-gray-500 ml-3">{trade.date}</span>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${trade.returnPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {trade.returnPercent >= 0 ? '+' : ''}{trade.returnPercent.toFixed(2)}%
                        </div>
                        <div className="text-sm text-gray-400">
                          ${trade.entryPrice.toFixed(2)} → ${trade.exitPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What This Means */}
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-8 border border-blue-500/30">
            <h2 className="text-2xl font-bold mb-4">💡 What These Numbers Mean</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="font-bold text-white mb-2">🎯 Win Rate</div>
                <p className="text-sm text-gray-300">
                  {results.winRate}% win rate means this strategy was profitable {results.winRate} out of 100 times. 
                  Anything above 60% is excellent! Most professional traders aim for 55-60%.
                </p>
              </div>
              <div>
                <div className="font-bold text-white mb-2">📈 Sharpe Ratio</div>
                <p className="text-sm text-gray-300">
                  Measures risk-adjusted returns. Above 1.0 is good, above 2.0 is excellent. 
                  This backtest scored {results.sharpeRatio} - {parseFloat(results.sharpeRatio) >= 2 ? 'crushing it!' : parseFloat(results.sharpeRatio) >= 1 ? 'solid performance!' : 'room for improvement.'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Error Display */}
      {results && results.error && (
        <div className="bg-red-500/20 rounded-xl p-8 border border-red-500/30">
          <h2 className="text-2xl font-bold text-red-400 mb-4">⚠️ No Data Found</h2>
          <p className="text-gray-300">{results.error}</p>
          <p className="text-gray-400 mt-4">Try selecting a different AI or longer timeframe.</p>
        </div>
      )}

      {/* Instructions if no results yet */}
      {!results && (
        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-8 border border-blue-500/30">
          <h2 className="text-2xl font-bold mb-4">💡 How Backtesting Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-4xl mb-3">1️⃣</div>
              <h3 className="font-bold text-white mb-2">Configure Settings</h3>
              <p className="text-sm text-gray-300">
                Choose which AI to test, the timeframe, and your starting capital.
              </p>
            </div>
            <div>
              <div className="text-4xl mb-3">2️⃣</div>
              <h3 className="font-bold text-white mb-2">Run the Test</h3>
              <p className="text-sm text-gray-300">
                We analyze historical picks and simulate what would have happened if you followed that AI.
              </p>
            </div>
            <div>
              <div className="text-4xl mb-3">3️⃣</div>
              <h3 className="font-bold text-white mb-2">Review Results</h3>
              <p className="text-sm text-gray-300">
                See win rate, total profit, and detailed trade history. Learn what works!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
