'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Challenge {
  id: string
  user_id: string
  start_date: string
  end_date: string
  initial_capital: number
  current_value: number
  status: 'active' | 'completed' | 'failed'
  goal_percent: number
  trades_count: number
  wins: number
  losses: number
  best_trade_symbol: string
  best_trade_percent: number
  worst_trade_symbol: string
  worst_trade_percent: number
  day_number: number
}

interface LeaderboardEntry {
  user_id: string
  username: string
  return_percent: number
  win_rate: number
  trades_count: number
  rank: number
}

interface DailyProgress {
  day: number
  date: string
  portfolio_value: number
  change_percent: number
  trades_today: number
}

export default function NinetyDayChallengePageComponent() {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [startingCapital, setStartingCapital] = useState(10000)
  const [goalPercent, setGoalPercent] = useState(50)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [dailyProgress, setDailyProgress] = useState<DailyProgress[]>([])

  useEffect(() => {
    // Initialize user ID
    let uid = localStorage.getItem('market_oracle_user_id')
    if (!uid) {
      uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('market_oracle_user_id', uid)
    }
    setUserId(uid)

    loadChallenge(uid)
    loadLeaderboard()
  }, [])

  async function loadChallenge(uid: string) {
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('challenges_90day')
        .select('*')
        .eq('user_id', uid)
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setChallenge(data as Challenge)
        loadDailyProgress(data.id)
      }
    } catch (error) {
      console.error('Error loading challenge:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadLeaderboard() {
    try {
      const { data } = await supabase
        .from('challenges_90day')
        .select('*')
        .eq('status', 'active')
        .order('current_value', { ascending: false })
        .limit(100)

      if (data) {
        const entries: LeaderboardEntry[] = data.map((c, idx) => ({
          user_id: c.user_id,
          username: `Player ${c.user_id.slice(-4)}`,
          return_percent: ((c.current_value - c.initial_capital) / c.initial_capital) * 100,
          win_rate: c.trades_count > 0 ? (c.wins / c.trades_count) * 100 : 0,
          trades_count: c.trades_count,
          rank: idx + 1
        }))

        setLeaderboard(entries)
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    }
  }

  async function loadDailyProgress(challengeId: string) {
    try {
      const { data } = await supabase
        .from('challenge_daily_snapshots')
        .select('*')
        .eq('challenge_id', challengeId)
        .order('day_number', { ascending: true })

      if (data) {
        setDailyProgress(data as DailyProgress[])
      }
    } catch (error) {
      console.error('Error loading daily progress:', error)
    }
  }

  async function startChallenge() {
    if (startingCapital < 100) {
      alert('Minimum capital is $100')
      return
    }

    if (goalPercent < 10 || goalPercent > 1000) {
      alert('Goal must be between 10% and 1000%')
      return
    }

    try {
      const startDate = new Date()
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 90)

      const { data, error } = await supabase
        .from('challenges_90day')
        .insert({
          user_id: userId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          initial_capital: startingCapital,
          current_value: startingCapital,
          status: 'active',
          goal_percent: goalPercent,
          trades_count: 0,
          wins: 0,
          losses: 0,
          best_trade_symbol: '',
          best_trade_percent: 0,
          worst_trade_symbol: '',
          worst_trade_percent: 0,
          day_number: 1
        })
        .select()
        .single()

      if (error) throw error

      setChallenge(data as Challenge)
      alert('90-Day Challenge Started! Good luck! 🚀')
    } catch (error) {
      console.error('Error starting challenge:', error)
      alert('Failed to start challenge. Please try again.')
    }
  }

  async function endChallenge() {
    if (!challenge) return
    if (!confirm('Are you sure you want to end your challenge early?')) return

    try {
      await supabase
        .from('challenges_90day')
        .update({ status: 'completed' })
        .eq('id', challenge.id)

      setChallenge(null)
      alert('Challenge ended. You can start a new one anytime!')
    } catch (error) {
      console.error('Error ending challenge:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-2xl font-bold">Loading Challenge...</div>
        </div>
      </div>
    )
  }

  // Calculate progress
  const daysRemaining = challenge ? 90 - challenge.day_number : 0
  const progress = challenge ? (challenge.day_number / 90) * 100 : 0
  const currentReturn = challenge 
    ? ((challenge.current_value - challenge.initial_capital) / challenge.initial_capital) * 100
    : 0
  const goalReached = challenge && currentReturn >= challenge.goal_percent

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-600">
            🏆 90-Day Challenge
          </h1>
          <p className="text-xl text-slate-300">
            Compete against other traders. Can you beat the AI picks in 90 days?
          </p>
        </div>

        {!challenge ? (
          /* Start New Challenge */
          <>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
              <h2 className="text-3xl font-bold mb-6">Start Your 90-Day Journey</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Starting Capital ($)
                  </label>
                  <input
                    type="number"
                    value={startingCapital}
                    onChange={(e) => setStartingCapital(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-lg"
                    placeholder="10000"
                  />
                  <div className="text-xs text-slate-400 mt-1">Minimum: $100</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Your Goal (% Return)
                  </label>
                  <input
                    type="number"
                    value={goalPercent}
                    onChange={(e) => setGoalPercent(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-lg"
                    placeholder="50"
                  />
                  <div className="text-xs text-slate-400 mt-1">Target return in 90 days</div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 mb-6">
                <div className="text-lg font-bold mb-3">Challenge Preview:</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-400 mb-1">Starting with:</div>
                    <div className="text-2xl font-bold text-white">
                      ${startingCapital.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 mb-1">Goal to reach:</div>
                    <div className="text-2xl font-bold text-green-400">
                      ${(startingCapital * (1 + goalPercent / 100)).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 mb-1">Target gain:</div>
                    <div className="text-xl font-bold text-yellow-400">
                      +${(startingCapital * (goalPercent / 100)).toLocaleString()} (+{goalPercent}%)
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 mb-1">Duration:</div>
                    <div className="text-xl font-bold text-purple-400">
                      90 Days
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={startChallenge}
                className="w-full py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-lg font-bold text-xl transition"
              >
                🚀 Start 90-Day Challenge
              </button>
            </div>

            {/* Challenge Rules */}
            <div className="bg-white/5 rounded-xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold mb-6">📜 Challenge Rules</h2>
              
              <div className="space-y-4 text-slate-300">
                <div className="flex">
                  <div className="text-2xl mr-4">1️⃣</div>
                  <div>
                    <strong className="text-white">90 Days to Prove Yourself:</strong> You have exactly 90 days to reach your goal. Track progress daily and compete on the leaderboard.
                  </div>
                </div>

                <div className="flex">
                  <div className="text-2xl mr-4">2️⃣</div>
                  <div>
                    <strong className="text-white">Follow AI Picks or Create Your Own:</strong> Trade any stocks from the platform. You can follow AI recommendations or pick your own!
                  </div>
                </div>

                <div className="flex">
                  <div className="text-2xl mr-4">3️⃣</div>
                  <div>
                    <strong className="text-white">Win Badges & Achievements:</strong> Unlock achievements for milestones like first trade, 10-win streak, 50% return, and more!
                  </div>
                </div>

                <div className="flex">
                  <div className="text-2xl mr-4">4️⃣</div>
                  <div>
                    <strong className="text-white">Real Money Optional:</strong> Start with virtual money to practice. When ready, switch to real trading with same tracking!
                  </div>
                </div>

                <div className="flex">
                  <div className="text-2xl mr-4">5️⃣</div>
                  <div>
                    <strong className="text-white">Leaderboard Fame:</strong> Top performers get featured on the leaderboard. Prove you're better than the AIs!
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Active Challenge */
          <>
            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className={`rounded-xl p-6 border ${goalReached ? 'bg-green-500/20 border-green-500/50' : 'bg-white/5 border-white/10'}`}>
                <div className="text-sm text-slate-400 mb-2">Current Value</div>
                <div className="text-3xl font-bold">${challenge.current_value.toLocaleString()}</div>
                <div className={`text-sm font-semibold mt-2 ${currentReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {currentReturn >= 0 ? '+' : ''}{currentReturn.toFixed(2)}%
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="text-sm text-slate-400 mb-2">Goal Progress</div>
                <div className="text-3xl font-bold">{((currentReturn / challenge.goal_percent) * 100).toFixed(0)}%</div>
                <div className="text-sm text-slate-400 mt-2">
                  Target: +{challenge.goal_percent}%
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="text-sm text-slate-400 mb-2">Days Remaining</div>
                <div className="text-3xl font-bold text-yellow-400">{daysRemaining}</div>
                <div className="text-sm text-slate-400 mt-2">
                  Day {challenge.day_number}/90
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="text-sm text-slate-400 mb-2">Win Rate</div>
                <div className="text-3xl font-bold text-blue-400">
                  {challenge.trades_count > 0 ? ((challenge.wins / challenge.trades_count) * 100).toFixed(0) : 0}%
                </div>
                <div className="text-sm text-slate-400 mt-2">
                  {challenge.wins}W / {challenge.losses}L
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-bold">Challenge Progress</div>
                <div className="text-sm text-slate-400">{progress.toFixed(0)}% Complete</div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Best/Worst Trades */}
            {challenge.trades_count > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-xl p-6 border border-green-500/30">
                  <div className="text-lg font-bold mb-3 text-green-300">🏆 Best Trade</div>
                  <div className="text-3xl font-bold mb-2">{challenge.best_trade_symbol || 'N/A'}</div>
                  <div className="text-2xl font-bold text-green-400">
                    +{challenge.best_trade_percent.toFixed(2)}%
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-500/10 to-rose-600/10 rounded-xl p-6 border border-red-500/30">
                  <div className="text-lg font-bold mb-3 text-red-300">⚠️ Worst Trade</div>
                  <div className="text-3xl font-bold mb-2">{challenge.worst_trade_symbol || 'N/A'}</div>
                  <div className="text-2xl font-bold text-red-400">
                    {challenge.worst_trade_percent.toFixed(2)}%
                  </div>
                </div>
              </div>
            )}

            {/* Daily Progress Chart */}
            {dailyProgress.length > 0 && (
              <div className="bg-white/5 rounded-xl p-8 border border-white/10 mb-8">
                <h2 className="text-2xl font-bold mb-6">Daily Performance</h2>
                <div className="h-64 flex items-end gap-1">
                  {dailyProgress.slice(-30).map((day, idx) => {
                    const height = Math.max(5, ((day.portfolio_value - challenge.initial_capital) / challenge.initial_capital) * 100 + 50)
                    const isPositive = day.portfolio_value >= challenge.initial_capital
                    
                    return (
                      <div key={idx} className="flex-1 relative group">
                        <div
                          className={`w-full rounded-t transition-all ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ height: `${height}%` }}
                        />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                          Day {day.day}: ${day.portfolio_value.toLocaleString()}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="text-center text-slate-400 text-sm mt-4">Last 30 Days</div>
              </div>
            )}

            {/* End Challenge Button */}
            <div className="text-center mb-8">
              <button
                onClick={endChallenge}
                className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
              >
                End Challenge Early
              </button>
            </div>
          </>
        )}

        {/* Leaderboard */}
        <div className="bg-white/5 rounded-xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold mb-6">🏅 Global Leaderboard</h2>
          
          {leaderboard.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="text-6xl mb-4">👥</div>
              <div className="text-xl">No active challenges yet</div>
              <div className="text-sm mt-2">Be the first to start the 90-day challenge!</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="pb-3 px-4">Rank</th>
                    <th className="pb-3 px-4">Player</th>
                    <th className="pb-3 px-4">Return</th>
                    <th className="pb-3 px-4">Win Rate</th>
                    <th className="pb-3 px-4">Trades</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.slice(0, 20).map((entry) => {
                    const isCurrentUser = entry.user_id === userId
                    
                    return (
                      <tr 
                        key={entry.user_id} 
                        className={`border-b border-white/5 ${isCurrentUser ? 'bg-blue-500/20' : 'hover:bg-white/5'} transition`}
                      >
                        <td className="py-3 px-4">
                          {entry.rank <= 3 ? (
                            <span className="text-2xl">
                              {entry.rank === 1 && '🥇'}
                              {entry.rank === 2 && '🥈'}
                              {entry.rank === 3 && '🥉'}
                            </span>
                          ) : (
                            <span className="text-slate-400">#{entry.rank}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          {entry.username} {isCurrentUser && '(You)'}
                        </td>
                        <td className={`py-3 px-4 font-bold ${entry.return_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {entry.return_percent >= 0 ? '+' : ''}{entry.return_percent.toFixed(2)}%
                        </td>
                        <td className="py-3 px-4">{entry.win_rate.toFixed(0)}%</td>
                        <td className="py-3 px-4 text-slate-400">{entry.trades_count}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
