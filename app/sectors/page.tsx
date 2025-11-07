"use client"

export default function SectorsPage() {
  const sectors = [
    { name: 'Technology', gain: 12.5, picks: 23, color: 'from-blue-500 to-cyan-500' },
    { name: 'Healthcare', gain: 8.3, picks: 18, color: 'from-green-500 to-emerald-500' },
    { name: 'Energy', gain: -2.1, picks: 12, color: 'from-yellow-500 to-orange-500' },
    { name: 'Finance', gain: 5.7, picks: 15, color: 'from-purple-500 to-pink-500' },
    { name: 'Consumer', gain: 3.2, picks: 20, color: 'from-red-500 to-pink-500' }
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          🏢 Sector Analysis
        </h1>
        <p className="text-xl text-gray-300 mb-2">See which industries are crushing it</p>
        <p className="text-gray-400">Diversify smart. Know where the money flows 💵</p>
      </div>

      <div className="grid gap-6">
        {sectors.map((sector) => (
          <div key={sector.name} className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20 hover:scale-102 transition-transform">
            <div className="flex justify-between items-center">
              <div>
                <h2 className={`text-3xl font-bold bg-gradient-to-r ${sector.color} bg-clip-text text-transparent mb-2`}>
                  {sector.name}
                </h2>
                <p className="text-gray-400">{sector.picks} AI picks in this sector</p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${sector.gain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {sector.gain >= 0 ? '+' : ''}{sector.gain}%
                </div>
                <div className="text-sm text-gray-400">Avg performance</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
