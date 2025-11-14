'use client'

import { useEffect, useState } from 'react'
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

export default function AllPicksPage() {
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
              {(['OPEN', 'CLOSED', 'all'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    filterStatus === status
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {status === 'all' ? 'All' : status}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
            >
              <option value="date">Date</option>
              <option value="confidence">Confidence</option>
              <option value="symbol">Symbol</option>
            </select>
          </div>
        </div>

        {/* Picks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedPicks.map((pick) => (
            <Link
              key={pick.id}
              href={`/stock/${pick.symbol}`}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-blue-500/50 transition group"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-2xl font-bold group-hover:text-blue-400 transition">
                    {pick.symbol}
                  </div>
                  <div className="text-sm text-slate-400">{pick.ai_name}</div>
                </div>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-semibold">
                  {pick.confidence_score}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                <div>
                  <div className="text-slate-400">Entry</div>
                  <div className="font-semibold">${pick.entry_price.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-slate-400">Target</div>
                  <div className="font-semibold">${pick.target_price.toFixed(2)}</div>
                </div>
              </div>

              {pick.sector && (
                <div className="text-xs text-slate-500 mb-3">
                  Sector: {pick.sector}
                </div>
              )}

              <div className="text-xs text-slate-400">
                {new Date(pick.pick_date).toLocaleDateString()}
              </div>

              <div className="text-xs text-blue-300 mt-3 group-hover:text-blue-200 transition">
                View full analysis →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
