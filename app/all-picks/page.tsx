'use client'

import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface StockPick {
  id: string
  symbol: string
  ai_name: string
  entry_price: number
  target_price: number
  confidence_score: number
  reasoning: string
  pick_date: string
  status: string
  sector?: string
}

// Separate component for content that uses useSearchParams
function AllPicksContent() {
  const searchParams = useSearchParams()
  const aiFilter = searchParams.get('ai')

  const [picks, setPicks] = useState<StockPick[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'date' | 'confidence' | 'symbol'>('date')
  const [filterStatus, setFilterStatus] = useState<'all' | 'OPEN' | 'CLOSED'>('OPEN')

  useEffect(() => {
    loadPicks()
  }, [filterStatus, aiFilter])

  async function loadPicks() {
    let query = supabase.from('stock_picks').select('*')

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus)
    }

    if (aiFilter) {
      query = query.eq('ai_name', aiFilter)
    }

    const { data } = await query

    if (data) {
      setPicks(data as StockPick[])
    }

    setLoading(false)
  }

  const sortedPicks = [...picks].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.pick_date).getTime() - new Date(a.pick_date).getTime()
      case 'confidence':
        return b.confidence_score - a.confidence_score
      case 'symbol':
        return a.symbol.localeCompare(b.symbol)
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-2xl">Loading picks...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              {aiFilter ? `${aiFilter} Picks` : 'All Picks'}
            </h1>
            <p className="text-slate-400">{picks.length} total picks</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Status</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded ${filterStatus === 'all' ? 'bg-blue-600' : 'bg-slate-800'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('OPEN')}
                className={`px-4 py-2 rounded ${filterStatus === 'OPEN' ? 'bg-blue-600' : 'bg-slate-800'}`}
              >
                Open
              </button>
              <button
                onClick={() => setFilterStatus('CLOSED')}
                className={`px-4 py-2 rounded ${filterStatus === 'CLOSED' ? 'bg-blue-600' : 'bg-slate-800'}`}
              >
                Closed
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2 rounded bg-slate-800 text-white"
            >
              <option value="date">Date</option>
              <option value="confidence">Confidence</option>
              <option value="symbol">Symbol</option>
            </select>
          </div>
        </div>

        {/* Picks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedPicks.map((pick) => (
            <div key={pick.id} className="bg-slate-900 rounded-lg p-6 border border-slate-800">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-blue-400">{pick.symbol}</h3>
                  <p className="text-sm text-slate-400">{pick.ai_name}</p>
                </div>
                <span className={`px-3 py-1 rounded text-sm ${
                  pick.status === 'OPEN' ? 'bg-green-600' : 'bg-slate-600'
                }`}>
                  {pick.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Entry:</span>
                  <span className="font-mono">${pick.entry_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target:</span>
                  <span className="font-mono text-green-400">${pick.target_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Upside:</span>
                  <span className="font-mono text-green-400">
                    {((pick.target_price - pick.entry_price) / pick.entry_price * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Confidence:</span>
                  <span className="font-mono">{pick.confidence_score}%</span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-slate-400 mb-1">Reasoning:</p>
                <p className="text-sm text-slate-300 line-clamp-3">{pick.reasoning}</p>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>{new Date(pick.pick_date).toLocaleDateString()}</span>
                {pick.sector && <span>{pick.sector}</span>}
              </div>
            </div>
          ))}
        </div>

        {picks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-xl">No picks found</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Main component with Suspense wrapper
export default function AllPicksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-2xl">Loading picks...</div>
      </div>
    }>
      <AllPicksContent />
    </Suspense>
  )
}
