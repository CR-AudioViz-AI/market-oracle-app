'use client'
import Link from 'next/link'

export default function ExportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">Export</h1>
        <p className="text-gray-300 mb-8">CSV/JSON data downloads</p>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-12 border border-white/20 text-center">
          <div className="text-6xl mb-4">📥</div>
          <div className="text-2xl font-bold text-white mb-4">Export System</div>
          <div className="text-gray-300">Full implementation coming soon...</div>
        </div>
        
        <div className="mt-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">🚀 Coming Soon</h2>
          <div className="text-gray-300">
            <p>This feature is currently in development and will be available in the next update.</p>
            <p className="mt-4">Stay tuned for powerful Export capabilities!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
