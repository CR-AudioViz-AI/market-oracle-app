'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Alert {
  id: string
  symbol: string
  alert_type: 'price_above' | 'price_below' | 'percent_change' | 'new_pick'
  threshold: number
  current_value: number
  triggered: boolean
  created_at: string
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')

  // Create alert form
  const [newAlertSymbol, setNewAlertSymbol] = useState('')
  const [newAlertType, setNewAlertType] = useState<'price_above' | 'price_below' | 'percent_change'>('price_above')
  const [newAlertThreshold, setNewAlertThreshold] = useState(0)
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([])

  useEffect(() => {
    let uid = localStorage.getItem('market_oracle_user_id')
    if (!uid) {
      uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('market_oracle_user_id', uid)
    }
    setUserId(uid)

    loadAlerts()
    loadAvailableSymbols()
  }, [])

  async function loadAvailableSymbols() {
    const { data } = await supabase
      .from('stock_picks')
      .select('symbol')
      .eq('status', 'OPEN')

    if (data) {
      const symbols = Array.from(new Set(data.map(p => p.symbol)))
      setAvailableSymbols(symbols)
    }
  }

  async function loadAlerts() {
    const savedAlerts = localStorage.getItem('market_oracle_alerts')
    if (savedAlerts) {
      setAlerts(JSON.parse(savedAlerts))
    }
    setLoading(false)
  }

  function createAlert() {
    if (!newAlertSymbol || newAlertThreshold <= 0) {
      alert('Please fill in all fields')
      return
    }

    const newAlert: Alert = {
      id: `alert_${Date.now()}`,
      symbol: newAlertSymbol,
      alert_type: newAlertType,
      threshold: newAlertThreshold,
      current_value: 0,
      triggered: false,
      created_at: new Date().toISOString()
    }

    const updatedAlerts = [newAlert, ...alerts]
    setAlerts(updatedAlerts)
    localStorage.setItem('market_oracle_alerts', JSON.stringify(updatedAlerts))

    // Reset form
    setNewAlertSymbol('')
    setNewAlertThreshold(0)

    alert('Alert created successfully!')
  }

  function deleteAlert(id: string) {
    const updatedAlerts = alerts.filter(a => a.id !== id)
    setAlerts(updatedAlerts)
    localStorage.setItem('market_oracle_alerts', JSON.stringify(updatedAlerts))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-2xl">Loading alerts...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="text-4xl font-bold mb-2">🔔 Price Alerts</h1>
        <p className="text-slate-400 mb-8">
          Get notified when stocks hit your target prices
        </p>

        {/* Instructions */}
        <div className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 mb-8">
          <h3 className="font-bold text-lg mb-3">💡 How to Use Alerts</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p><strong>1.</strong> Select a stock symbol from AI picks</p>
            <p><strong>2.</strong> Choose alert type:
              <ul className="ml-6 mt-1">
                <li>• <strong>Price Above:</strong> Alert when price goes above threshold</li>
                <li>• <strong>Price Below:</strong> Alert when price drops below threshold</li>
                <li>• <strong>Percent Change:</strong> Alert on % change from current price</li>
              </ul>
            </p>
            <p><strong>3.</strong> Set your threshold value</p>
            <p><strong>4.</strong> Create alert and we'll monitor it for you</p>
          </div>
        </div>

        {/* Create Alert Form */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
          <h2 className="text-2xl font-bold mb-6">Create New Alert</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Stock Symbol
              </label>
              <select
                value={newAlertSymbol}
                onChange={(e) => setNewAlertSymbol(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="">Select stock...</option>
                {availableSymbols.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Alert Type
              </label>
              <select
                value={newAlertType}
                onChange={(e) => setNewAlertType(e.target.value as any)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="price_above">Price Above</option>
                <option value="price_below">Price Below</option>
                <option value="percent_change">% Change</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Threshold {newAlertType === 'percent_change' ? '(%)' : '($)'}
              </label>
              <input
                type="number"
                step="0.01"
                value={newAlertThreshold || ''}
                onChange={(e) => setNewAlertThreshold(Number(e.target.value))}
                placeholder={newAlertType === 'percent_change' ? '5.0' : '100.00'}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={createAlert}
                disabled={!newAlertSymbol || newAlertThreshold <= 0}
                className="w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white font-semibold rounded-lg transition"
              >
                Create Alert
              </button>
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Active Alerts ({alerts.length})</h2>

          {alerts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 border transition ${
                    alert.triggered
                      ? 'border-green-500/50 bg-green-500/5'
                      : 'border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-2xl font-bold">{alert.symbol}</div>
                        {alert.triggered && (
                          <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-semibold">
                            🔔 TRIGGERED!
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-slate-300">
                        <strong>Type:</strong>{' '}
                        {alert.alert_type === 'price_above' && `Alert when price goes above $${alert.threshold.toFixed(2)}`}
                        {alert.alert_type === 'price_below' && `Alert when price drops below $${alert.threshold.toFixed(2)}`}
                        {alert.alert_type === 'percent_change' && `Alert on ${alert.threshold}% change`}
                      </div>

                      <div className="text-xs text-slate-500 mt-2">
                        Created: {new Date(alert.created_at).toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-12 border border-white/10 text-center">
              <div className="text-6xl mb-4">🔔</div>
              <div className="text-2xl font-bold mb-2">No Active Alerts</div>
              <div className="text-slate-400">Create your first alert above to get started</div>
            </div>
          )}
        </div>

        {/* Coming Soon Features */}
        <div className="mt-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
          <h3 className="font-bold text-lg mb-3">🚀 Coming Soon</h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm text-slate-300">
            <div>✨ Email notifications</div>
            <div>✨ SMS alerts</div>
            <div>✨ Push notifications</div>
            <div>✨ AI pick alerts</div>
            <div>✨ Custom alert conditions</div>
            <div>✨ Alert history</div>
          </div>
        </div>
      </div>
    </div>
  )
}
