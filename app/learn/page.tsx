'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Tutorial {
  id: string
  title: string
  description: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  duration: string
  icon: string
  content: string[]
}

const tutorials: Tutorial[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with Market Oracle',
    description: 'Learn the basics of AI-powered stock picking',
    difficulty: 'Beginner',
    duration: '10 min',
    icon: '🚀',
    content: [
      '**What is Market Oracle?** Market Oracle is an AI stock battle platform where multiple AI models compete to make the best stock picks.',
      '**How It Works:** Each AI independently analyzes market data and makes picks with confidence scores.',
      '**Your Role:** Review AI picks, vote on predictions, and practice trading with virtual money.',
      '**Getting Started:** Browse the dashboard to see all active picks, click any stock for detailed analysis.',
      '**Key Features:** Hot Picks show stocks chosen by multiple AIs or with very high confidence (85%+).'
    ]
  },
  {
    id: 'understanding-ai-picks',
    title: 'Understanding AI Stock Picks',
    description: 'How to interpret AI recommendations',
    difficulty: 'Beginner',
    duration: '15 min',
    icon: '🤖',
    content: [
      '**Confidence Scores:** Each pick has a 0-100% confidence score. Higher = stronger conviction.',
      '**Entry Price:** The price where the AI recommends buying the stock.',
      '**Target Price:** The AI\'s predicted price target for the stock.',
      '**Reasoning:** Every pick includes the AI\'s analysis explaining why it chose this stock.',
      '**Multi-AI Consensus:** When 2+ AIs pick the same stock, it appears as a "Hot Pick" with stronger validation.',
      '**AI Specializations:** Each AI has different strengths - GPT-4 for patterns, Claude for risk, Perplexity for real-time data.'
    ]
  },
  {
    id: 'backtesting',
    title: 'Backtesting Strategies',
    description: 'Test strategies against historical data',
    difficulty: 'Intermediate',
    duration: '20 min',
    icon: '📊',
    content: [
      '**What is Backtesting?** Testing a strategy using historical data to see how it would have performed.',
      '**Available Strategies:** Test all picks, high-confidence only (85%+), multi-AI consensus, or single AI models.',
      '**Key Metrics:** Win rate (% of winning trades), total return (%), average gain per trade, max drawdown.',
      '**How to Use:** Select date range, choose strategy, set initial capital, run backtest.',
      '**Interpreting Results:** High win rate + positive returns = good strategy. But past performance ≠ future results.',
      '**Pro Tip:** Compare multiple strategies over same period to find what works best.'
    ]
  },
  {
    id: 'paper-trading',
    title: 'Paper Trading Guide',
    description: 'Practice trading risk-free',
    difficulty: 'Beginner',
    duration: '15 min',
    icon: '📝',
    content: [
      '**What is Paper Trading?** Practice trading with $100K virtual money. No real risk.',
      '**How to Buy:** Select stock from dropdown, enter quantity, click BUY button.',
      '**How to Sell:** Click "Sell" button on any position, or use the sell form.',
      '**Portfolio Tracking:** See real-time gains/losses on all positions.',
      '**Trade History:** Review all past trades to learn from successes and mistakes.',
      '**Best Practices:** Start small, diversify, don\'t chase losses, learn before using real money.'
    ]
  },
  {
    id: 'voting',
    title: 'Community Voting System',
    description: 'Vote bullish or bearish on AI picks',
    difficulty: 'Beginner',
    duration: '10 min',
    icon: '🗳️',
    content: [
      '**Purpose:** Share your opinion and see community sentiment on AI picks.',
      '**Bullish Vote:** You agree with the AI and think the stock will rise.',
      '**Bearish Vote:** You disagree or think the stock will fall/stay flat.',
      '**Sentiment Score:** -100 to +100 showing community consensus. +50 = strong bullish, -50 = strong bearish.',
      '**Why Vote?** Help identify which picks have community support. High consensus = validation.',
      '**Changing Votes:** You can change your vote anytime to reflect updated opinions.'
    ]
  },
  {
    id: 'risk-management',
    title: 'Risk Management Basics',
    description: 'Protect your capital',
    difficulty: 'Intermediate',
    duration: '25 min',
    icon: '🛡️',
    content: [
      '**Position Sizing:** Never risk more than 2-5% of portfolio on single trade.',
      '**Diversification:** Spread investments across multiple stocks and sectors.',
      '**Stop Losses:** Set maximum loss you\'ll accept before selling.',
      '**Take Profits:** Don\'t be greedy. Lock in gains when targets hit.',
      '**Don\'t Chase:** Missing a rally is better than buying at the top.',
      '**Emotional Control:** Stick to your strategy. Don\'t panic sell or FOMO buy.',
      '**Research:** Understand WHY the AI picked a stock before following.',
      '**Track Performance:** Review your trades monthly to identify patterns and improve.'
    ]
  },
  {
    id: 'advanced-strategies',
    title: 'Advanced Trading Strategies',
    description: 'Level up your trading game',
    difficulty: 'Advanced',
    duration: '30 min',
    icon: '🎯',
    content: [
      '**Consensus Trading:** Only trade stocks where 2+ AIs agree with 80%+ confidence.',
      '**Fade Strategy:** Trade against low-confidence picks (<70%) for contrarian plays.',
      '**AI Performance Weighting:** Give more weight to picks from AIs with best historical performance.',
      '**Sector Rotation:** Focus on sectors showing strongest momentum in AI picks.',
      '**Time-Based:** Trade picks made during specific market conditions (bull/bear markets).',
      '**Layering:** Build positions gradually rather than all at once.',
      '**Scaling Out:** Sell portions at different price targets to lock gains while staying in winners.',
      '**Correlation Analysis:** Avoid positions that move together to improve diversification.'
    ]
  }
]

export default function LearnPage() {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="text-4xl font-bold mb-2">🎓 Learning Center</h1>
        <p className="text-slate-400 mb-8">
          Master AI-powered trading with comprehensive tutorials and guides
        </p>

        {selectedTutorial ? (
          // Tutorial Detail View
          <div>
            <button
              onClick={() => setSelectedTutorial(null)}
              className="text-blue-400 hover:text-blue-300 mb-6 inline-block"
            >
              ← Back to All Tutorials
            </button>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
              <div className="flex items-start gap-4 mb-6">
                <div className="text-6xl">{selectedTutorial.icon}</div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">{selectedTutorial.title}</h2>
                  <p className="text-slate-400 mb-4">{selectedTutorial.description}</p>
                  <div className="flex gap-4 text-sm">
                    <span className={`px-3 py-1 rounded-full ${
                      selectedTutorial.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-300' :
                      selectedTutorial.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {selectedTutorial.difficulty}
                    </span>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                      ⏱️ {selectedTutorial.duration}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {selectedTutorial.content.map((section, index) => {
                  // Parse markdown-style bold text
                  const parts = section.split('**')
                  return (
                    <div key={index} className="text-slate-300 leading-relaxed">
                      {parts.map((part, i) => 
                        i % 2 === 1 ? <strong key={i} className="text-white">{part}</strong> : part
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          // Tutorial Grid View
          <div>
            {/* Filter by Difficulty */}
            <div className="flex gap-2 mb-6">
              <span className="text-slate-400">Filter:</span>
              <button className="px-4 py-1 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition">
                All
              </button>
              <button className="px-4 py-1 bg-green-500/20 text-green-300 rounded-lg text-sm hover:bg-green-500/30 transition">
                Beginner
              </button>
              <button className="px-4 py-1 bg-yellow-500/20 text-yellow-300 rounded-lg text-sm hover:bg-yellow-500/30 transition">
                Intermediate
              </button>
              <button className="px-4 py-1 bg-red-500/20 text-red-300 rounded-lg text-sm hover:bg-red-500/30 transition">
                Advanced
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tutorials.map((tutorial) => (
                <button
                  key={tutorial.id}
                  onClick={() => setSelectedTutorial(tutorial)}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-blue-500/50 transition-all hover:scale-105 text-left group"
                >
                  <div className="text-4xl mb-4">{tutorial.icon}</div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition">
                    {tutorial.title}
                  </h3>
                  <p className="text-sm text-slate-400 mb-4">{tutorial.description}</p>

                  <div className="flex gap-2 mb-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      tutorial.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-300' :
                      tutorial.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {tutorial.difficulty}
                    </span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-semibold">
                      {tutorial.duration}
                    </span>
                  </div>

                  <div className="text-blue-400 text-sm group-hover:text-blue-300 transition">
                    Start Learning →
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Tips */}
        <div className="mt-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
          <h3 className="font-bold text-lg mb-4">💡 Quick Tips for Success</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-300">
            <div>• Start with paper trading to practice risk-free</div>
            <div>• Focus on high-confidence picks (80%+) when learning</div>
            <div>• Review AI reasoning before following any pick</div>
            <div>• Use backtesting to validate strategies</div>
            <div>• Never invest more than you can afford to lose</div>
            <div>• Diversify across multiple stocks and sectors</div>
            <div>• Track your performance and learn from mistakes</div>
            <div>• Stay updated with market news and trends</div>
          </div>
        </div>
      </div>
    </div>
  )
}
