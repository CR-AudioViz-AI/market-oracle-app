"use client"

import { useState } from 'react'

export default function VotingPage() {
  const [votes, setVotes] = useState<{[key: string]: string}>({})

  const polls = [
    {
      id: 1,
      question: 'Which AI will have the highest win rate this month?',
      options: ['Javari AI', 'Claude', 'GPT-4', 'Gemini', 'Perplexity']
    },
    {
      id: 2,
      question: 'Will the market go up or down next week?',
      options: ['🚀 Bull (Up)', '📉 Bear (Down)', '➡️ Sideways']
    },
    {
      id: 3,
      question: 'Best sector for penny stocks right now?',
      options: ['Tech', 'Healthcare', 'Energy', 'Finance', 'Consumer']
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent mb-4">
          🗳️ Community Voting
        </h1>
        <p className="text-xl text-gray-300 mb-2">Predict the future. Compete with the community</p>
        <p className="text-gray-400">Make your picks. See if you&apos;re better than the crowd 🎯</p>
      </div>

      <div className="space-y-8">
        {polls.map((poll) => (
          <div key={poll.id} className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20">
            <h2 className="text-2xl font-bold mb-6">{poll.question}</h2>
            <div className="space-y-3">
              {poll.options.map((option) => {
                const isSelected = votes[poll.id] === option
                return (
                  <button
                    key={option}
                    onClick={() => setVotes({...votes, [poll.id]: option})}
                    className={`w-full p-4 rounded-lg text-left transition-all ${
                      isSelected
                        ? 'bg-purple-500/30 border-2 border-purple-400'
                        : 'bg-slate-900/50 border-2 border-transparent hover:border-purple-500/30'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-white">{option}</span>
                      {isSelected && <span className="text-purple-400">✓</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
