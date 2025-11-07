"use client"

export default function CommunityPage() {
  const posts = [
    { user: 'TradeMaster99', content: 'Just made 50% on AAPL following Javari AI! 🚀', likes: 24 },
    { user: 'StockGuru', content: 'Anyone else think tech stocks are overvalued?', likes: 12 },
    { user: 'NewbieTra der', content: 'First week paper trading and up 5%! This platform rocks!', likes: 31 }
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent mb-4">
          👥 Community
        </h1>
        <p className="text-xl text-gray-300 mb-2">Connect with traders. Share wins. Learn together</p>
        <p className="text-gray-400">Your tribe is here. Let&apos;s grow rich together 💪</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {posts.map((post, idx) => (
            <div key={idx} className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white mb-2">@{post.user}</div>
                  <p className="text-gray-300 mb-4">{post.content}</p>
                  <button className="text-purple-400 hover:text-purple-300 transition">
                    ❤️ {post.likes} likes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20">
            <h3 className="font-bold text-white mb-4">🏆 Top Contributors</h3>
            <div className="space-y-3">
              {['TradeMaster99', 'StockGuru', 'NewbieTrader'].map((user, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                  <span className="text-gray-300">{user}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
