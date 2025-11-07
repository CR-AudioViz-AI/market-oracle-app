"use client"

import { useState } from 'react'

export default function AlertsPage() {
  const [email, setEmail] = useState('')
  const [alerts, setAlerts] = useState([
    { type: 'Price Target', stock: 'AAPL', condition: 'Reaches $200', enabled: true },
    { type: 'AI Pick', stock: 'Any', condition: '90%+ confidence', enabled: true }
  ])

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent mb-4">
          🔔 Price Alerts
        </h1>
        <p className="text-xl text-gray-300 mb-2">Never miss a move. Get notified instantly</p>
        <p className="text-gray-400">Set alerts. We&apos;ll email you when conditions hit 📧</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20">
          <h2 className="text-2xl font-bold mb-6">📧 Email Setup</h2>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-4 py-3 text-white mb-4"
          />
          <button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 rounded-lg transition-all">
            Save Email
          </button>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20">
          <h2 className="text-2xl font-bold mb-6">⚡ Active Alerts</h2>
          <div className="space-y-4">
            {alerts.map((alert, idx) => (
              <div key={idx} className="bg-slate-900/50 rounded-lg p-4 border border-purple-500/20">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-white mb-1">{alert.type}</div>
                    <div className="text-sm text-gray-400">{alert.stock} - {alert.condition}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs ${alert.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {alert.enabled ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
