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
  strategy: 'all' | 'high-confidence' | 'multi-ai' | 'single-ai'
  aiModel?: string
  minConfidence: number
}

interface BacktestResult {
  totalTrades: number
  winners: number
  losers: number
  winRate: number
  totalReturn: number
  totalReturnPercent: number
  avgGainPerTrade: number
  maxDrawdown: number
  sharpeRatio: number
  bestTrade: { symbol: string; gain: number }
  worstTrade: { symbol: string; loss: number }
}

export default function BacktestingPage() {
  const [config, setConfig] = useState<BacktestConfig>({
    startDate: '2024-01-01',
    endDate: new Date().toISOString().split('T')[0],
    initialCapital: 10000,
    strategy: 'all',
    minConfidence: 70
  })

  const [result, setResult] = useState<BacktestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [aiModels, setAiModels] = useState<string[]>([])

  useEffect(() => {
    loadAIModels()
  }, [])

  async function loadAIModels() {
    const { data } = await supabase
      .from('ai_models')
      .select('display_name')
      .eq('is_active', true)

    if (data) {
      setAiModels(data.map(m => m.display_name))
    }
  }

  async function runBacktest() {
    setLoading(true)
    setResult(null)

    try {
      // Fetch historical picks within date range
      let query = supabase
        .from('stock_picks')
        .select('*')
        .eq('status', 'CLOSED')
        .gte('pick_date', config.startDate)
        .lte('pick_date', config.endDate)
        .gte('confidence_score', config.minConfidence)

      if (config.strategy === 'single-ai' && config.aiModel) {
        query = query.eq('ai_name', config.aiModel)
      }

      const { data: picks } = await query

      if (!picks || picks.length === 0) {
        alert('No closed trades found in this date range')
        setLoading(false)
        return
      }

      // Filter by strategy
      let filteredPicks = picks
      
      if (config.strategy === 'high-confidence') {
        filteredPicks = picks.filter(p => p.confidence_score >= 85)
      } else if (config.strategy === 'multi-ai') {
        // Find symbols picked by multiple AIs
        const symbolCounts: Record<string, number> = {}
        picks.forEach(p => {
          symbolCounts[p.symbol] = (symbolCounts[p.symbol] || 0) + 1
        })
        const multiAISymbols = Object.keys(symbolCounts).filter(s => symbolCounts[s] >= 2)
        filteredPicks = picks.filter(p => multiAISymbols.includes(p.symbol))
      }

      // Calculate results
      const winners = filteredPicks.filter(p => p.exit_price && p.exit_price > p.entry_price)
      const losers = filteredPicks.filter(p => p.exit_price && p.exit_price <= p.entry_price)

      const totalReturn = filteredPicks.reduce((sum, p) => {
        if (p.exit_price) {
          return sum + (p.exit_price - p.entry_price)
        }
        return sum
      }, 0)

      const totalReturnPercent = (totalReturn / config.initialCapital) * 100

      const tradesWithGains = filteredPicks.map(p => ({
        symbol: p.symbol,
        gain: p.exit_price ? ((p.exit_price - p.entry_price) / p.entry_price) * 100 : 0
      }))

      const bestTrade = tradesWithGains.reduce((best, current) => 
        current.gain > best.gain ? current : best, tradesWithGains[0])

      const worstTrade = tradesWithGains.reduce((worst, current) => 
        current.gain < worst.gain ? current : worst, tradesWithGains[0])

      setResult({
        totalTrades: filteredPicks.length,
        winners: winners.length,
        losers: losers.length,
        winRate: (winners.length / filteredPicks.length) * 100,
        totalReturn,
        totalReturnPercent,
        avgGainPerTrade: totalReturn / filteredPicks.length,
        maxDrawdown: Math.min(...tradesWithGains.map(t => t.gain)),
        sharpeRatio: 0, // Simplified for now
        bestTrade,
        worstTrade
      })

    } catch (error) {
      console.error('Backtest error:', error)
      alert('Error running backtest')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="text-4xl font-bold mb-2">📊 Backtesting Engine</h1>
        <p className="text-slate-400 mb-8">
          Test AI strategies against historical data to see how they would have performed
        </p>

        {/* Configuration Panel */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
          <h2 className="text-2xl font-bold mb-6">Configure Backtest</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              />
            </div>

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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Strategy
              </label>
              <select
                value={config.strategy}
                onChange={(e) => setConfig({...config, strategy: e.target.value as any})}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="all">All Picks</option>
                <option value="high-confidence">High Confidence Only (85%+)</option>
                <option value="multi-ai">Multi-AI Consensus</option>
                <option value="single-ai">Single AI Model</option>
              </select>
            </div>

            {config.strategy === 'single-ai' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select AI Model
                </label>
                <select
                  value={config.aiModel || ''}
                  onChange={(e) => setConfig({...config, aiModel: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                >
                  <option value="">Select model...</option>
                  {aiModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button
            onClick={runBacktest}
            disabled={loading || (config.strategy === 'single-ai' && !config.aiModel)}
            className="mt-6 w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white font-semibold rounded-lg transition"
          >
            {loading ? 'Running Backtest...' : 'Run Backtest'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-green-500/30">
              <h2 className="text-2xl font-bold mb-6">Backtest Results</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Total Trades</div>
                  <div className="text-3xl font-bold">{result.totalTrades}</div>
                </div>

                <div>
                  <div className="text-sm text-slate-400 mb-1">Win Rate</div>
                  <div className="text-3xl font-bold text-green-400">{result.winRate.toFixed(1)}%</div>
                  <div className="text-xs text-slate-500">{result.winners}W / {result.losers}L</div>
                </div>

                <div>
                  <div className="text-sm text-slate-400 mb-1">Total Return</div>
                  <div className={`text-3xl font-bold ${result.totalReturnPercent > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {result.totalReturnPercent > 0 ? '+' : ''}{result.totalReturnPercent.toFixed(2)}%
                  </div>
                  <div className="text-xs text-slate-500">
                    ${result.totalReturn.toFixed(2)}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-400 mb-1">Avg Gain/Trade</div>
                  <div className="text-3xl font-bold">${result.avgGainPerTrade.toFixed(2)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
                <div className="bg-green-500/10 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">Best Trade</div>
                  <div className="text-2xl font-bold text-green-400">
                    {result.bestTrade.symbol}
                  </div>
                  <div className="text-lg text-green-300">
                    +{result.bestTrade.gain.toFixed(2)}%
                  </div>
                </div>

                <div className="bg-red-500/10 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">Worst Trade</div>
                  <div className="text-2xl font-bold text-red-400">
                    {result.worstTrade.symbol}
                  </div>
                  <div className="text-lg text-red-300">
                    {result.worstTrade.gain.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="text-sm text-slate-400 mb-2">Final Portfolio Value</div>
                <div className="text-4xl font-bold">
                  ${(config.initialCapital + result.totalReturn).toLocaleString(undefined, {maximumFractionDigits: 2})}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
          <h3 className="font-bold text-lg mb-4">💡 How to Use Backtesting</h3>
          <ol className="space-y-2 text-sm text-slate-300">
            <li><strong>1.</strong> Select your date range to test (must have closed trades in this period)</li>
            <li><strong>2.</strong> Set your initial capital amount</li>
            <li><strong>3.</strong> Choose a strategy:
              <ul className="ml-6 mt-2 space-y-1">
                <li>• <strong>All Picks:</strong> Test every AI pick in the range</li>
                <li>• <strong>High Confidence:</strong> Only picks with 85%+ confidence</li>
                <li>• <strong>Multi-AI Consensus:</strong> Stocks picked by 2+ AIs</li>
                <li>• <strong>Single AI:</strong> Test one specific AI model</li>
              </ul>
            </li>
            <li><strong>4.</strong> Click "Run Backtest" to see historical performance</li>
            <li><strong>5.</strong> Analyze win rate, returns, and best/worst trades</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
