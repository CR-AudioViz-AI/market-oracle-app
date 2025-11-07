"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PaperTradingPage() {
  const [balance, setBalance] = useState(10000)
  const [positions, setPositions] = useState<any[]>([])
  const [availablePicks, setAvailablePicks] = useState<any[]>([]

)
  const [filteredPicks, setFilteredPicks] = useState<any[]>([])
  const [selectedStock, setSelectedStock] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  
  // Filter states
  const [selectedAI, setSelectedAI] = useState('all')
  const [minConfidence, setMinConfidence] = useState(0)
  const [sortBy, setSortBy] = useState('confidence')
  const [showAll, setShowAll] = useState(false)
  const [aiOptions, setAiOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [availablePicks, selectedAI, minConfidence, sortBy])

  async function fetchData() {
    const { data } = await supabase
      .from('stock_picks')
      .select('*')

    if (data) {
      setAvailablePicks(data)
      
      // Extract unique AI names
      const unique = Array.from(new Set(data.map(d: any) => d.ai_name)))
      setAiOptions(['all', ...unique])
    }
    setLoading(false)
  }

  function applyFilters() {
    let filtered = [...availablePicks]
    
    // Filter by AI
    if (selectedAI !== 'all') {
      filtered = filtered.filter(pick: any) => pick.ai_name === selectedAI)
    }
    
    // Filter by confidence
    filtered = filtered.filter(pick: any) => pick.confidence_score >= minConfidence)
    
    // Sort
    switch(sortBy) {
      case 'confidence':
        filtered.sort(a: any, b: any) => b.confidence_score - a.confidence_score)
        break
      case 'potential':
        filtered.sort(a: any, b: any) => {
          const aGain = ((a.target_price - a.entry_price) / a.entry_price) * 100
          const bGain = ((b.target_price - b.entry_price) / b.entry_price) * 100
          return bGain - aGain
        })
        break
      case 'price_low':
        filtered.sort(a: any, b: any) => a.entry_price - b.entry_price)
        break
      case 'price_high':
        filtered.sort(a: any, b: any) => b.entry_price - a.entry_price)
        break
      case 'newest':
        filtered.sort(a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }
    
    setFilteredPicks(filtered)
  }

  function buyStock(pick: any) {
    const cost = pick.entry_price * quantity
    if (cost <= balance) {
      setBalance(balance - cost)
      setPositions([...positions, {
        ...pick,
        quantity,
        buyPrice: pick.entry_price,
        currentPrice: pick.entry_price,
        timestamp: new Date().toISOString()
      }])
      setSelectedStock(null)
      setQuantity(1)
    }
  }

  function sellStock(index: number) {
    const position = positions[index]
    const revenue = position.currentPrice * position.quantity
    setBalance(balance + revenue)
        // @ts-ignore
    setPositions(positions.filter((_, i) => i !== index))
  }

  const totalPositionValue = positions.reduce((sum, pos) => 
    sum + (pos.currentPrice * pos.quantity), 0)
  const netProfit = (balance + totalPositionValue) - 10000
  const profitPercent = ((netProfit / 10000) * 100).toFixed(2)

  const displayPicks = showAll ? filteredPicks : filteredPicks.slice(0, 12)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-400 mx-auto mb-4"></div>
          <div className="text-2xl text-green-400 font-bold">Loading Portfolio...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4">
          💰 Paper Trading
        </h1>
        <p className="text-xl text-gray-300 mb-2">
          Practice trading with $10,000 virtual money - Zero risk, real experience!
        </p>
        <p className="text-gray-400">
          Learn how to trade without losing a penny. Build confidence before using real money 📈
        </p>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30">
          <div className="text-sm text-gray-400 mb-2">Cash Balance</div>
          <div className="text-3xl font-bold text-green-400">${balance.toFixed(2)}</div>
          <div className="text-xs text-green-300 mt-1">Available to trade</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-500/30">
          <div className="text-sm text-gray-400 mb-2">Positions Value</div>
          <div className="text-3xl font-bold text-blue-400">${totalPositionValue.toFixed(2)}</div>
          <div className="text-xs text-blue-300 mt-1">{positions.length} stocks held</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
          <div className="text-sm text-gray-400 mb-2">Total Portfolio</div>
          <div className="text-3xl font-bold text-white">${(balance + totalPositionValue).toFixed(2)}</div>
          <div className="text-xs text-purple-300 mt-1">Cash + Stocks</div>
        </div>

        <div className={`bg-gradient-to-br ${netProfit >= 0 ? 'from-green-500/20 to-emerald-500/20 border-green-500/30' : 'from-red-500/20 to-pink-500/20 border-red-500/30'} rounded-xl p-6 border`}>
          <div className="text-sm text-gray-400 mb-2">Net Profit/Loss</div>
          <div className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(2)}
          </div>
          <div className={`text-xs mt-1 ${netProfit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
            {netProfit >= 0 ? '+' : ''}{profitPercent}%
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20 mb-8">
        <h2 className="text-2xl font-bold mb-6">💡 How Paper Trading Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div>
            <div className="text-4xl mb-3">1️⃣</div>
            <h3 className="font-bold text-white mb-2">Start with $10K</h3>
            <p className="text-sm text-gray-300">You get $10,000 virtual money. Not real cash, so zero stress!</p>
          </div>
          <div>
            <div className="text-4xl mb-3">2️⃣</div>
            <h3 className="font-bold text-white mb-2">Buy AI Picks</h3>
            <p className="text-sm text-gray-300">Choose from high-confidence AI predictions. Buy with virtual money.</p>
          </div>
          <div>
            <div className="text-4xl mb-3">3️⃣</div>
            <h3 className="font-bold text-white mb-2">Watch It Grow</h3>
            <p className="text-sm text-gray-300">Track your positions. Sell when you hit your target or cut losses.</p>
          </div>
          <div>
            <div className="text-4xl mb-3">4️⃣</div>
            <h3 className="font-bold text-white mb-2">Learn & Improve</h3>
            <p className="text-sm text-gray-300">See what works. Build confidence. Graduate to real trading!</p>
          </div>
        </div>
      </div>

      {/* Current Positions */}
      {positions.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20 mb-8">
          <h2 className="text-3xl font-bold mb-6">📊 Your Positions</h2>
          <div className="space-y-4">
        // @ts-ignore
            {positions.map((pos, idx) => {
              const gain = ((pos.currentPrice - pos.buyPrice) / pos.buyPrice * 100).toFixed(2)
              return (
                <div key={idx} className="bg-slate-900/50 rounded-lg p-6 border border-purple-500/20">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-2xl font-bold text-white mb-1">${pos.symbol}</div>
                      <div className="text-sm text-gray-400">
                        {pos.quantity} shares @ ${pos.buyPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${parseFloat(gain) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {parseFloat(gain) >= 0 ? '+' : ''}{gain}%
                      </div>
                      <div className="text-sm text-gray-400">
                        ${(pos.currentPrice * pos.quantity).toFixed(2)} value
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => sellStock(idx)}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-3 rounded-lg transition-all"
                  >
                    Sell Position
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filters & Controls */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">🛒 Available Stocks</h2>
          <div className="text-sm text-gray-400">
            Showing {displayPicks.length} of {filteredPicks.length} stocks
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {/* AI Filter */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Filter by AI</label>
            <select
              value={selectedAI}
              onChange={(e) => setSelectedAI(e.target.value)}
              className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-4 py-2 text-white text-sm"
            >
              {aiOptions.map(ai: any) => (
                <option key={ai} value={ai}>
                  {ai === 'all' ? 'All AIs' : ai}
                </option>
              ))}
            </select>
          </div>

          {/* Confidence Filter */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              Min Confidence: {minConfidence}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-4 py-2 text-white text-sm"
            >
              <option value="confidence">Highest Confidence</option>
              <option value="potential">Highest Potential Gain</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>

          {/* Show All Toggle */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Display</label>
            <button
              onClick={() => setShowAll(!showAll)}
              className={`w-full py-2 rounded-lg font-medium transition-all ${
                showAll
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-900 border border-purple-500/30 text-purple-300 hover:bg-slate-800'
              }`}
            >
              {showAll ? `Showing All (${filteredPicks.length})` : `Show All (${filteredPicks.length})`}
            </button>
          </div>
        </div>

        {/* Quick Filter Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => { setMinConfidence(70); setSortBy('confidence') }}
            className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-300 rounded-full text-xs hover:bg-green-500/30 transition-all"
          >
            🔥 High Confidence (70%+)
          </button>
          <button
            onClick={() => { setMinConfidence(0); setSortBy('potential') }}
            className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-full text-xs hover:bg-blue-500/30 transition-all"
          >
            🚀 Best Potential Gains
          </button>
          <button
            onClick={() => { setMinConfidence(0); setSortBy('newest') }}
            className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-full text-xs hover:bg-purple-500/30 transition-all"
          >
            ⚡ Latest Picks
          </button>
          <button
            onClick={() => { setSelectedAI('all'); setMinConfidence(0); setSortBy('confidence'); setShowAll(false) }}
            className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-300 rounded-full text-xs hover:bg-red-500/30 transition-all"
          >
            🔄 Reset Filters
          </button>
        </div>
      </div>

      {/* Available Stocks Grid */}
      <div className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20 mb-8">
        {displayPicks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">No stocks match your filters</h3>
            <p className="text-gray-400">Try adjusting your filters to see more options</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        // @ts-ignore
              {displayPicks.map((pick) => {
                const canAfford = pick.entry_price * quantity <= balance
                const potentialGain = ((pick.target_price - pick.entry_price) / pick.entry_price) * 100
                
                return (
                  <div key={pick.id} className={`bg-slate-900/50 rounded-lg p-6 border ${canAfford ? 'border-green-500/30' : 'border-red-500/30'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-3xl font-bold text-white">${pick.symbol}</div>
                      <div className="text-right">
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          pick.confidence_score >= 80 ? 'bg-green-500/20 text-green-300' :
                          pick.confidence_score >= 60 ? 'bg-blue-500/20 text-blue-300' :
                          'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {pick.confidence_score}% confident
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full">
                        {pick.ai_name}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-800/50 rounded p-2">
                        <div className="text-xs text-gray-400">Current Price</div>
                        <div className="font-bold text-white">${pick.entry_price.toFixed(2)}</div>
                      </div>
                      <div className="bg-slate-800/50 rounded p-2">
                        <div className="text-xs text-gray-400">Target Price</div>
                        <div className="font-bold text-green-400">${pick.target_price.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-xs text-gray-400 mb-1">Potential Gain</div>
                      <div className={`text-2xl font-bold ${potentialGain >= 20 ? 'text-green-400' : potentialGain >= 10 ? 'text-blue-400' : 'text-yellow-400'}`}>
                        +{potentialGain.toFixed(1)}%
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="text-sm text-gray-400 mb-2 block">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={selectedStock?.id === pick.id ? quantity : 1}
                        onChange={(e) => {
                          setSelectedStock(pick)
                          setQuantity(parseInt(e.target.value) || 1)
                        }}
                        className="w-full bg-slate-800 border border-purple-500/30 rounded px-3 py-2 text-white"
                      />
                      <div className="text-xs text-gray-400 mt-1">
                        Total: ${(pick.entry_price * (selectedStock?.id === pick.id ? quantity : 1)).toFixed(2)}
                      </div>
                    </div>

                    <button
                      onClick={() => { setSelectedStock(pick); buyStock(pick) }}
                      disabled={!canAfford}
                      className={`w-full font-bold py-3 rounded-lg transition-all ${
                        canAfford
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? 'Buy Now 💰' : 'Insufficient Funds'}
                    </button>
                  </div>
                )
              })}
            </div>

            {!showAll && filteredPicks.length > 12 && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowAll(true)}
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg transition-all"
                >
                  Show All {filteredPicks.length} Stocks
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
