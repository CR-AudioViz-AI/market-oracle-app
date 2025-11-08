'use client'

import { useState } from 'react'
import { Bell, Plus, X } from 'lucide-react'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([
    { id: 1, symbol: 'AAPL', type: 'Price Above', value: 180, active: true },
    { id: 2, symbol: 'TSLA', type: 'Price Below', value: 150, active: true }
  ])
  const [newAlert, setNewAlert] = useState({ symbol: '', type: 'Price Above', value: 0 })

  function addAlert() {
    if (newAlert.symbol && newAlert.value > 0) {
      setAlerts([...alerts, { ...newAlert, id: Date.now(), active: true }])
      setNewAlert({ symbol: '', type: 'Price Above', value: 0 })
    }
  }

  function removeAlert(id: number) {
    setAlerts(alerts.filter(a => a.id !== id))
  }

  function toggleAlert(id: number) {
    setAlerts(alerts.map(a => a.id === id ? { ...a, active: !a.active } : a))
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 flex items-center justify-center gap-4">
          <Bell className="w-12 h-12 text-brand-cyan" />
          <span className="gradient-text">Alerts</span>
        </h1>
        <p className="text-xl text-slate-300">Set up price alerts for your favorite stocks</p>
      </div>

      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
        <h3 className="text-xl font-bold mb-4">Create New Alert</h3>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Symbol (e.g., AAPL)"
            value={newAlert.symbol}
            onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value.toUpperCase() })}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white flex-1"
          />
          <select
            value={newAlert.type}
            onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value })}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
          >
            <option>Price Above</option>
            <option>Price Below</option>
            <option>Confidence Change</option>
            <option>AI Consensus</option>
          </select>
          <input
            type="number"
            placeholder="Value"
            value={newAlert.value || ''}
            onChange={(e) => setNewAlert({ ...newAlert, value: parseFloat(e.target.value) })}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white w-32"
          />
          <button
            onClick={addAlert}
            className="px-6 py-2 bg-gradient-to-r from-brand-cyan to-blue-500 hover:from-brand-cyan/80 hover:to-blue-500/80 rounded-lg font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Alert
          </button>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
        <h3 className="text-xl font-bold mb-4">Your Alerts ({alerts.length})</h3>
        {alerts.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No alerts set up yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.id} className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleAlert(alert.id)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      alert.active ? 'bg-green-500' : 'bg-slate-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      alert.active ? 'translate-x-6' : 'translate-x-1'
                    }`}></div>
                  </button>
                  <div>
                    <p className="font-bold">{alert.symbol}</p>
                    <p className="text-sm text-slate-400">{alert.type}: ${alert.value}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeAlert(alert.id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
