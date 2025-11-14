'use client'

import { useState, useEffect } from 'react'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  progress?: number
  target?: number
}

const achievements: Achievement[] = [
  { id: 'first_vote', name: 'First Vote', description: 'Cast your first vote on an AI pick', icon: '🗳️', unlocked: false },
  { id: 'first_trade', name: 'Paper Trader', description: 'Execute your first paper trade', icon: '📝', unlocked: false },
  { id: 'watchlist_5', name: 'Researcher', description: 'Add 5 stocks to your watchlist', icon: '⭐', unlocked: false, progress: 0, target: 5 },
  { id: 'backtest_run', name: 'Analyst', description: 'Run your first backtest', icon: '📊', unlocked: false },
  { id: 'profit_1000', name: 'Profitable Trader', description: 'Make $1,000 profit in paper trading', icon: '💰', unlocked: false, progress: 0, target: 1000 },
  { id: 'community_post', name: 'Community Member', description: 'Create your first community post', icon: '💬', unlocked: false },
  { id: 'alert_created', name: 'Alert Setter', description: 'Create your first price alert', icon: '🔔', unlocked: false },
  { id: 'streak_7', name: 'Dedicated', description: 'Visit Market Oracle 7 days in a row', icon: '🔥', unlocked: false, progress: 0, target: 7 },
]

export default function Achievements() {
  const [userAchievements, setUserAchievements] = useState<Achievement[]>(achievements)
  const [showAchievements, setShowAchievements] = useState(false)

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('market_oracle_achievements')
    if (saved) {
      setUserAchievements(JSON.parse(saved))
    }
  }, [])

  const unlockedCount = userAchievements.filter(a => a.unlocked).length
  const totalCount = userAchievements.length

  return (
    <>
      {/* Achievement Button */}
      <button
        onClick={() => setShowAchievements(true)}
        className="fixed top-20 right-6 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg shadow-lg hover:scale-105 transition-transform z-40"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <span className="font-semibold">{unlockedCount}/{totalCount}</span>
        </div>
      </button>

      {/* Achievement Modal */}
      {showAchievements && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-yellow-500/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white">🏆 Achievements</h2>
              <button
                onClick={() => setShowAchievements(false)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="text-slate-400 mb-6">
              Unlocked: {unlockedCount} / {totalCount} ({((unlockedCount / totalCount) * 100).toFixed(0)}%)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-xl border-2 transition ${
                    achievement.unlocked
                      ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/50'
                      : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`text-4xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <div className={`font-bold ${achievement.unlocked ? 'text-yellow-400' : 'text-slate-400'}`}>
                        {achievement.name}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        {achievement.description}
                      </div>
                      {achievement.target && achievement.progress !== undefined && !achievement.unlocked && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>Progress</span>
                            <span>{achievement.progress}/{achievement.target}</span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all"
                              style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
