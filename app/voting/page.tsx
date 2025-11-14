'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

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
}

interface Vote {
  user_id: string
  pick_id: string
  vote_type: 'bullish' | 'bearish'
  created_at: string
}

interface VoteSummary {
  bullish: number
  bearish: number
  total: number
  sentiment: number // -100 to +100
}

export default function VotingPage() {
  const [picks, setPicks] = useState<StockPick[]>([])
  const [votes, setVotes] = useState<Record<string, VoteSummary>>({})
  const [userVotes, setUserVotes] = useState<Record<string, 'bullish' | 'bearish'>>({})
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    // Get or create user ID
    let uid = localStorage.getItem('market_oracle_user_id')
    if (!uid) {
      uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('market_oracle_user_id', uid)
    }
    setUserId(uid)

    loadPicksAndVotes()
  }, [])

  async function loadPicksAndVotes() {
    // Load active picks
    const { data: picksData } = await supabase
      .from('stock_picks')
      .select('*')
      .eq('status', 'OPEN')
      .order('pick_date', { ascending: false })
      .limit(20)

    if (picksData) {
      setPicks(picksData as StockPick[])

      // Load votes for these picks
      const pickIds = picksData.map(p => p.id)
      const { data: votesData } = await supabase
        .from('pick_votes')
        .select('*')
        .in('pick_id', pickIds)

      if (votesData) {
        // Calculate vote summaries
        const summaries: Record<string, VoteSummary> = {}
        const userVoteMap: Record<string, 'bullish' | 'bearish'> = {}

        pickIds.forEach(pickId => {
          const pickVotes = votesData.filter(v => v.pick_id === pickId)
          const bullish = pickVotes.filter(v => v.vote_type === 'bullish').length
          const bearish = pickVotes.filter(v => v.vote_type === 'bearish').length
          const total = bullish + bearish

          summaries[pickId] = {
            bullish,
            bearish,
            total,
            sentiment: total > 0 ? ((bullish - bearish) / total) * 100 : 0
          }

          // Track user's vote
          const userVote = pickVotes.find(v => v.user_id === userId)
          if (userVote) {
            userVoteMap[pickId] = userVote.vote_type as 'bullish' | 'bearish'
          }
        })

        setVotes(summaries)
        setUserVotes(userVoteMap)
      }
    }

    setLoading(false)
  }

  async function castVote(pickId: string, voteType: 'bullish' | 'bearish') {
    if (!userId) return

    // Remove previous vote if exists
    if (userVotes[pickId]) {
      await supabase
        .from('pick_votes')
        .delete()
        .eq('pick_id', pickId)
        .eq('user_id', userId)
    }

    // Cast new vote
    const { error } = await supabase
      .from('pick_votes')
      .insert([
        {
          pick_id: pickId,
          user_id: userId,
          vote_type: voteType,
          created_at: new Date().toISOString()
        }
      ])

    if (!error) {
      // Update local state
      setUserVotes(prev => ({ ...prev, [pickId]: voteType }))

      // Update vote summary
      const currentVotes = votes[pickId] || { bullish: 0, bearish: 0, total: 0, sentiment: 0 }
      const newVotes = {
        bullish: voteType === 'bullish' ? currentVotes.bullish + 1 : currentVotes.bullish,
        bearish: voteType === 'bearish' ? currentVotes.bearish + 1 : currentVotes.bearish,
        total: currentVotes.total + 1,
        sentiment: 0
      }
      newVotes.sentiment = ((newVotes.bullish - newVotes.bearish) / newVotes.total) * 100

      setVotes(prev => ({ ...prev, [pickId]: newVotes }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-2xl">Loading votes...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="text-4xl font-bold mb-2">🗳️ Vote on AI Picks</h1>
        <p className="text-slate-400 mb-8">
          Share your opinion on AI stock picks - Bullish or Bearish?
        </p>

        {/* Instructions */}
        <div className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 mb-8">
          <h3 className="font-bold text-lg mb-3">💡 How Voting Works</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-300">
            <div>
              <strong>🟢 Vote Bullish</strong>
              <p className="mt-1">You agree with the AI's pick and think the stock will go up</p>
            </div>
            <div>
              <strong>🔴 Vote Bearish</strong>
              <p className="mt-1">You disagree and think the stock will go down or stay flat</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Community sentiment helps identify consensus picks. Your vote is anonymous and you can change it anytime.
          </p>
        </div>

        {/* Voting Grid */}
        <div className="grid grid-cols-1 gap-6">
          {picks.map((pick) => {
            const voteSummary = votes[pick.id] || { bullish: 0, bearish: 0, total: 0, sentiment: 0 }
            const userVote = userVotes[pick.id]
            const bullishPercent = voteSummary.total > 0 ? (voteSummary.bullish / voteSummary.total) * 100 : 50

            return (
              <div
                key={pick.id}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-3xl font-bold">{pick.symbol}</div>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-semibold">
                        {pick.ai_name}
                      </span>
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-semibold">
                        {pick.confidence_score}% confidence
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-slate-400">Entry</div>
                        <div className="font-semibold">${pick.entry_price.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Target</div>
                        <div className="font-semibold text-green-400">${pick.target_price.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Potential</div>
                        <div className="font-semibold text-blue-400">
                          +{(((pick.target_price - pick.entry_price) / pick.entry_price) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vote Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => castVote(pick.id, 'bullish')}
                      className={`flex-1 md:w-32 px-6 py-3 rounded-lg font-semibold transition ${
                        userVote === 'bullish'
                          ? 'bg-green-500 text-white'
                          : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                      }`}
                    >
                      🟢 Bullish
                    </button>
                    <button
                      onClick={() => castVote(pick.id, 'bearish')}
                      className={`flex-1 md:w-32 px-6 py-3 rounded-lg font-semibold transition ${
                        userVote === 'bearish'
                          ? 'bg-red-500 text-white'
                          : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                      }`}
                    >
                      🔴 Bearish
                    </button>
                  </div>
                </div>

                {/* Vote Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-green-400">{voteSummary.bullish} Bullish</span>
                    <span className="text-slate-400">{voteSummary.total} total votes</span>
                    <span className="text-red-400">{voteSummary.bearish} Bearish</span>
                  </div>

                  <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
                      style={{ width: `${bullishPercent}%` }}
                    />
                  </div>

                  <div className="text-center mt-2">
                    <span className={`text-sm font-semibold ${
                      voteSummary.sentiment > 20 ? 'text-green-400' :
                      voteSummary.sentiment < -20 ? 'text-red-400' :
                      'text-slate-400'
                    }`}>
                      {voteSummary.sentiment > 0 ? '+' : ''}{voteSummary.sentiment.toFixed(0)}% sentiment
                    </span>
                  </div>
                </div>

                {/* AI Reasoning */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="text-xs text-slate-400 mb-1">AI Reasoning:</div>
                  <div className="text-sm text-slate-300">{pick.reasoning}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
