"use client"

export default function LearnPage() {
  const topics = [
    {
      emoji: '🎓',
      title: 'Trading Basics',
      lessons: [
        'What are stocks?',
        'How to read stock prices',
        'Buy vs Sell orders',
        'Market vs Limit orders'
      ],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      emoji: '🤖',
      title: 'Understanding AI Picks',
      lessons: [
        'How AIs analyze stocks',
        'What confidence scores mean',
        'Why AIs disagree',
        'When to trust AI predictions'
      ],
      color: 'from-purple-500 to-pink-500'
    },
    {
      emoji: '📊',
      title: 'Reading the Charts',
      lessons: [
        'Support and resistance levels',
        'Volume indicators',
        'Moving averages explained',
        'Candlestick patterns'
      ],
      color: 'from-green-500 to-emerald-500'
    },
    {
      emoji: '💰',
      title: 'Risk Management',
      lessons: [
        'Never invest more than you can lose',
        'Diversification strategies',
        'Setting stop losses',
        'Position sizing rules'
      ],
      color: 'from-orange-500 to-red-500'
    }
  ]

  const tips = [
    { emoji: '🎯', text: 'Start small - even $100 can teach you a lot', color: 'green' },
    { emoji: '📚', text: 'Read for 15 minutes daily - knowledge compounds', color: 'blue' },
    { emoji: '🧘', text: 'Stay calm - emotions kill profits', color: 'purple' },
    { emoji: '📊', text: 'Track your trades - learn from mistakes', color: 'orange' }
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          📚 Trading Academy
        </h1>
        <p className="text-xl text-gray-300 mb-2">
          From zero to hero - Learn trading the easy way
        </p>
        <p className="text-gray-400">
          No boring textbooks. Just simple lessons that actually make sense 🎓
        </p>
      </div>

      {/* Quick Tips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {tips.map((tip, idx) => (
          <div key={idx} className={`bg-${tip.color}-500/20 rounded-xl p-6 border border-${tip.color}-500/30`}>
            <div className="text-4xl mb-3">{tip.emoji}</div>
            <p className="text-sm text-gray-300">{tip.text}</p>
          </div>
        ))}
      </div>

      {/* Learning Topics */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {topics.map((topic, idx) => (
          <div key={idx} className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20 hover:scale-105 transition-transform">
            <div className="text-5xl mb-4">{topic.emoji}</div>
            <h2 className={`text-3xl font-bold bg-gradient-to-r ${topic.color} bg-clip-text text-transparent mb-6`}>
              {topic.title}
            </h2>
            <ul className="space-y-3">
              {topic.lessons.map((lesson, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span className="text-gray-300">{lesson}</span>
                </li>
              ))}
            </ul>
            <button className={`w-full mt-6 bg-gradient-to-r ${topic.color} hover:opacity-90 text-white font-bold py-3 rounded-lg transition-all`}>
              Start Learning →
            </button>
          </div>
        ))}
      </div>

      {/* Beginner Guide */}
      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-8 border border-purple-500/30">
        <h2 className="text-3xl font-bold mb-6">🚀 Complete Beginner? Start Here!</h2>
        <div className="space-y-6">
          <div className="bg-slate-900/50 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">1️⃣</div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Learn the Basics (Week 1)</h3>
                <p className="text-gray-300 mb-3">Understand what stocks are, how prices work, and basic terminology. Think of it like learning a new video game - start with the controls!</p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full">15 mins/day</span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-300 text-sm rounded-full">Super easy</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">2️⃣</div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Watch AI Picks (Week 2-3)</h3>
                <p className="text-gray-300 mb-3">Don&apos;t trade yet! Just observe. See which AI picks work out. Notice patterns. It&apos;s like watching pro gamers before you play ranked.</p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full">10 mins/day</span>
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-sm rounded-full">Build intuition</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">3️⃣</div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Paper Trade (Week 4-8)</h3>
                <p className="text-gray-300 mb-3">Use our Paper Trading feature with $10K virtual money. Make mistakes here, not with real cash. Practice until you&apos;re consistently profitable.</p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-green-500/20 text-green-300 text-sm rounded-full">Daily practice</span>
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-300 text-sm rounded-full">Build confidence</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">4️⃣</div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Start Small (Month 3+)</h3>
                <p className="text-gray-300 mb-3">Ready for real money? Start with $100-500 max. Follow AI picks with 80%+ confidence. Scale up as you win. Rome wasn&apos;t built in a day!</p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-red-500/20 text-red-300 text-sm rounded-full">Real money</span>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full">Slow & steady</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
