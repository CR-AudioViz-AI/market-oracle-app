"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function VotingPage() {
  const [votes, setVotes] = useState<{[key: string]: string}>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [communityVotes, setCommunityVotes] = useState<any>({})
  const [loading, setLoading] = useState(true)

  const polls = [
    {
      id: 'ai_winner',
      question: 'Which AI will have the highest win rate this month?',
      options: ['Javari AI', 'Claude', 'GPT-4', 'Gemini', 'Perplexity']
    },
    {
      id: 'market_direction',
      question: 'Will the market go up or down next week?',
      options: ['🚀 Bull (Up)', '📉 Bear (Down)', '➡️ Sideways']
    },
    {
      id: 'best_sector',
      question: 'Best sector for penny stocks right now?',
      options: ['Tech', 'Healthcare', 'Energy', 'Finance', 'Consumer']
    }
  ]

  useEffect(() => {
    fetchCommunityVotes()
  }, [])

  async function fetchCommunityVotes() {
    try {
      const { data } = await supabase
        .from('community_votes')
        .select('poll_id, option, COUNT(*) as count')
        
      if (data) {
        // Aggregate votes by poll and option
        const aggregated: any = {}
        data.forEach((row: any) => {
          if (!aggregated[row.poll_id]) {
            aggregated[row.poll_id] = {}
          }
          aggregated[row.poll_id][row.option] = parseInt(row.count)
        })
        setCommunityVotes(aggregated)
      }
    } catch (error) {
      console.error('Error fetching community votes:', error)
    }
    setLoading(false)
  }

  function getVotePercentage(pollId: string, option: string): number {
    if (!communityVotes[pollId]) return 0
    
    const pollVotes = communityVotes[pollId]
    const optionVotes = pollVotes[option] || 0
    const totalVotes = Object.values(pollVotes).reduce((sum: any, count: any) => sum + count, 0) as number
    
    if (totalVotes === 0) return 0
    return Math.round((optionVotes / totalVotes) * 100)
  }

  function getTotalVotes(pollId: string): number {
    if (!communityVotes[pollId]) return 0
    return Object.values(communityVotes[pollId]).reduce((sum: any, count: any) => sum + count, 0) as number
  }

  async function submitVotes() {
    if (Object.keys(votes).length === 0) {
      alert('Please select at least one option before submitting!')
      return
    }

    setSubmitting(true)

    try {
      // Insert votes into database
      const voteRecords = Object.entries(votes).map(([pollId, option]) => ({
        poll_id: pollId,
        option: option,
        user_id: 'anonymous', // In production, use actual user ID
        created_at: new Date().toISOString()
      }))

      const { error } = await supabase
        .from('community_votes')
        .insert(voteRecords)

      if (error) throw error

      // Refresh community votes
      await fetchCommunityVotes()
      
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
      
    } catch (error) {
      console.error('Error submitting votes:', error)
      alert('Failed to submit votes. Please try again.')
    }

    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-400 mx-auto mb-4"></div>
          <div className="text-2xl text-purple-400 font-bold">Loading Polls...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent mb-4">
          🗳️ Community Voting
        </h1>
        <p className="text-xl text-gray-300 mb-2">Predict the future. Compete with the community</p>
        <p className="text-gray-400">Make your picks. See if you&apos;re better than the crowd 🎯</p>
      </div>

      {submitted && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-8 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✅</span>
            <div>
              <div className="text-green-400 font-bold text-lg">Votes Submitted!</div>
              <div className="text-green-300 text-sm">Your predictions have been recorded.</div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {polls.map((poll) => {
          const totalVotes = getTotalVotes(poll.id)
          
          return (
            <div key={poll.id} className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">{poll.question}</h2>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Community Votes</div>
                  <div className="text-2xl font-bold text-purple-400">{totalVotes}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                {poll.options.map((option) => {
                  const isSelected = votes[poll.id] === option
                  const percentage = getVotePercentage(poll.id, option)
                  const isLeading = percentage > 0 && percentage === Math.max(...poll.options.map(opt => getVotePercentage(poll.id, opt)))
                  
                  return (
                    <button
                      key={option}
                      onClick={() => setVotes({...votes, [poll.id]: option})}
                      className={`w-full p-4 rounded-lg text-left transition-all relative overflow-hidden ${
                        isSelected
                          ? 'bg-purple-500/30 border-2 border-purple-400'
                          : 'bg-slate-900/50 border-2 border-transparent hover:border-purple-500/30'
                      }`}
                    >
                      {/* Vote percentage background bar */}
                      {totalVotes > 0 && (
                        <div 
                          className={`absolute top-0 left-0 h-full ${isLeading ? 'bg-purple-500/20' : 'bg-slate-700/20'} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      )}
                      
                      <div className="relative flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-white">{option}</span>
                          {isLeading && totalVotes > 0 && (
                            <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-1 rounded-full border border-purple-500/50">
                              🏆 Leading
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          {totalVotes > 0 && (
                            <span className="text-sm font-bold text-purple-300">{percentage}%</span>
                          )}
                          {isSelected && <span className="text-purple-400 text-xl">✓</span>}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Submit Button */}
      <div className="mt-8 sticky bottom-8">
        <button
          onClick={submitVotes}
          disabled={submitting || Object.keys(votes).length === 0}
          className={`w-full py-6 rounded-xl font-bold text-xl transition-all ${
            Object.keys(votes).length === 0
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : submitting
              ? 'bg-purple-500/50 cursor-wait'
              : 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white shadow-lg shadow-purple-500/50'
          }`}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              Submitting Votes...
            </span>
          ) : Object.keys(votes).length === 0 ? (
            'Select Your Predictions Above'
          ) : (
            `Submit ${Object.keys(votes).length} Vote${Object.keys(votes).length !== 1 ? 's' : ''} 🚀`
          )}
        </button>
        
        {Object.keys(votes).length > 0 && !submitting && (
          <div className="text-center mt-4">
            <button
              onClick={() => setVotes({})}
              className="text-gray-400 hover:text-white text-sm underline"
            >
              Clear All Selections
            </button>
          </div>
        )}
      </div>

      {/* How Voting Works */}
      <div className="mt-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-8 border border-blue-500/30">
        <h2 className="text-2xl font-bold mb-6">💡 How Community Voting Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="text-4xl mb-3">1️⃣</div>
            <h3 className="font-bold text-white mb-2">Make Your Predictions</h3>
            <p className="text-sm text-gray-300">
              Select your answers for each question. You can change your mind before submitting!
            </p>
          </div>
          <div>
            <div className="text-4xl mb-3">2️⃣</div>
            <h3 className="font-bold text-white mb-2">Submit Your Votes</h3>
            <p className="text-sm text-gray-300">
              Click the big submit button. Your predictions are recorded instantly.
            </p>
          </div>
          <div>
            <div className="text-4xl mb-3">3️⃣</div>
            <h3 className="font-bold text-white mb-2">See the Results</h3>
            <p className="text-sm text-gray-300">
              Watch live percentages update as the community votes. Are you with the crowd or going against it?
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
