"use client"

export default function ExportPage() {
  const formats = [
    { name: 'CSV', icon: '📊', desc: 'Open in Excel or Google Sheets' },
    { name: 'JSON', icon: '🔧', desc: 'For developers and custom apps' },
    { name: 'PDF', icon: '📄', desc: 'Printable reports with charts' }
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">
          📥 Export Data
        </h1>
        <p className="text-xl text-gray-300 mb-2">Download your data. Own your analysis</p>
        <p className="text-gray-400">Take your picks anywhere. Full transparency 💎</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-8">
        {formats.map((format) => (
          <div key={format.name} className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20 text-center hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">{format.icon}</div>
            <h3 className="text-2xl font-bold text-white mb-2">{format.name}</h3>
            <p className="text-sm text-gray-400 mb-6">{format.desc}</p>
            <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-lg transition-all">
              Download {format.name}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20">
        <h2 className="text-2xl font-bold mb-6">⚙️ Export Options</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Date Range</label>
            <select className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-4 py-3 text-white">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>All Time</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Include</label>
            <select className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-4 py-3 text-white">
              <option>All Picks</option>
              <option>Only Wins</option>
              <option>Only Losses</option>
              <option>High Confidence (80%+)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
