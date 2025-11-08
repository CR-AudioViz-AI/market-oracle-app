'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Alert {
  id: string
  symbol: string
  type: 'price' | 'target' | 'confidence'
  condition: string
  value: number
  isActive: boolean
  triggered: boolean
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: '1', symbol: 'NVDA', type: 'price', condition: 'above', value: 470, isActive: true, triggered: false },
    { id: '2', symbol: 'TSLA', type: 'target', condition: 'reached', value: 250, isActive: true, triggered: true }
  ])
  const [newSymbol, setNewSymbol] = useState('')
  const [newValue, setNewValue] = useState(0)
  const [loading, setLoading] = useState(false)

  function createAlert() {
    if (!newSymbol || newValue <= 0) return

    const newAlert: Alert = {
      id: Date.now().toString(),
      symbol: newSymbol,
      type: 'price',
      condition: 'above',
      value: newValue,
      isActive: true,
      triggered: false
    }

    setAlerts(prev => [...prev, newAlert])
    setNewSymbol('')
    setNewValue(0)
  }

  function deleteAlert(id: string) {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  function toggleAlert(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Price Alerts</h1>
          <p className="text-gray-300">Get notified when stocks hit your target prices</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Active Alerts</div>
            <div className="text-3xl font-bold text-white">{alerts.filter(a => a.isActive).length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Triggered Today</div>
            <div className="text-3xl font-bold text-green-400">{alerts.filter(a => a.triggered).length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Total Alerts</div>
            <div className="text-3xl font-bold text-blue-400">{alerts.length}</div>
          </div>
        </div>

        {/* Create New Alert */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Create New Alert</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              placeholder="Symbol (e.g., NVDA)"
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400"
            />
            <select className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white">
              <option>Price Above</option>
              <option>Price Below</option>
              <option>Target Reached</option>
            </select>
            <input
              type="number"
              value={newValue}
              onChange={(e) => setNewValue(parseFloat(e.target.value))}
              placeholder="Price"
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400"
            />
            <button
              onClick={createAlert}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Create Alert
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Your Alerts</h2>
          <div className="space-y-4">
            {alerts.map(alert => (
              <div key={alert.id} className={`p-6 rounded-xl border ${
                alert.triggered 
                  ? 'bg-green-500/10 border-green-400' 
                  : alert.isActive
                  ? 'bg-white/5 border-white/10'
                  : 'bg-gray-500/10 border-gray-600'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-white">{alert.symbol}</div>
                    <div className="text-gray-300">
                      {alert.type === 'price' && `Price ${alert.condition} $${alert.value}`}
                      {alert.type === 'target' && `Target $${alert.value} reached`}
                    </div>
                    {alert.triggered && (
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-500/20 text-green-300">
                        ✓ Triggered
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleAlert(alert.id)}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${
                        alert.isActive
                          ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                      }`}
                    >
                      {alert.isActive ? 'Active' : 'Paused'}
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What This Means */}
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">💡 What This Means</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              <strong className="text-white">Price Alerts:</strong> Automated notifications when stocks hit your target prices. Never miss an opportunity again.
            </p>
            <p>
              <strong className="text-white">Smart Monitoring:</strong> Set alerts for entry points, exit targets, or stop-losses. The system watches 24/7 so you don't have to.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
