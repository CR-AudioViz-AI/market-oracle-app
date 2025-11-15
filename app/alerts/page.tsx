'use client'

import { useState, useEffect, useCallback } from 'react'
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
  triggered_at?: string
}

interface StockPrice {
  price: number
  change: number
  changePercent: number
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [prices, setPrices] = useState<Record<string, StockPrice>>({})
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [monitoringActive, setMonitoringActive] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  // Create alert form
  const [newAlertSymbol, setNewAlertSymbol] = useState('')
  const [newAlertType, setNewAlertType] = useState<'price_above' | 'price_below' | 'percent_change'>('price_above')
  const [newAlertThreshold, setNewAlertThreshold] = useState(0)
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([])

  useEffect(() => {
    // Initialize user ID
    let uid = localStorage.getItem('market_oracle_user_id')
    if (!uid) {
      uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('market_oracle_user_id', uid)
    }
    setUserId(uid)

    loadAlerts()
    loadAvailableSymbols()
  }, [])

  // CRITICAL: Start price monitoring when alerts exist
  useEffect(() => {
    if (alerts.length > 0) {
      startMonitoring()
    } else {
      stopMonitoring()
    }

    return () => stopMonitoring()
  }, [alerts])

  async function loadAvailableSymbols() {
    try {
      const { data } = await supabase
        .from('stock_picks')
        .select('symbol')
        .eq('status', 'OPEN')

      if (data) {
        const uniqueSymbols = Array.from(new Set(data.map(p => p.symbol)))
        setAvailableSymbols(uniqueSymbols.sort())
      }
    } catch (error) {
      console.error('Error loading symbols:', error)
    }
  }

  async function loadAlerts() {
    setLoading(true)
    
    try {
      const uid = localStorage.getItem('market_oracle_user_id')
      if (!uid) return

      const { data, error } = await supabase
        .from('user_alerts')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        setAlerts(data as Alert[])
      }
    } catch (error) {
      console.error('Error loading alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  // CRITICAL: Actual price monitoring function
  const checkAlerts = useCallback(async () => {
    if (alerts.length === 0) return

    try {
      // Get unique symbols from alerts
      const symbols = Array.from(new Set(alerts.map(a => a.symbol)))
      
      // Fetch current prices
      const response = await fetch(`/api/stock-price?symbols=${symbols.join(',')}`)
      
      if (!response.ok) {
        console.error('Failed to fetch prices for monitoring')
        return
      }

      const data = await response.json()
      
      if (!data.success || !data.prices) {
        return
      }

      setPrices(data.prices)
      setLastCheck(new Date())

      // Check each alert
      for (const alert of alerts) {
        if (alert.triggered) continue  // Skip already triggered alerts

        const currentPrice = data.prices[alert.symbol]
        if (!currentPrice) continue

        let shouldTrigger = false

        switch (alert.alert_type) {
          case 'price_above':
            shouldTrigger = currentPrice.price > alert.threshold
            break
          case 'price_below':
            shouldTrigger = currentPrice.price < alert.threshold
            break
          case 'percent_change':
            shouldTrigger = Math.abs(currentPrice.changePercent) >= alert.threshold
            break
        }

        if (shouldTrigger) {
          await triggerAlert(alert.id, currentPrice.price)
          
          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Market Oracle Alert! 🔔', {
              body: `${alert.symbol}: ${getAlertMessage(alert, currentPrice.price)}`,
              icon: '/logo.png'
            })
          }
        }
      }
    } catch (error) {
      console.error('Error checking alerts:', error)
    }
  }, [alerts])

  function getAlertMessage(alert: Alert, currentPrice: number): string {
    switch (alert.alert_type) {
      case 'price_above':
        return `Price is now $${currentPrice.toFixed(2)} (above $${alert.threshold.toFixed(2)})`
      case 'price_below':
        return `Price is now $${currentPrice.toFixed(2)} (below $${alert.threshold.toFixed(2)})`
      case 'percent_change':
        return `Large price movement detected`
      default:
        return 'Alert triggered'
    }
  }

  async function triggerAlert(alertId: string, currentValue: number) {
    try {
      await supabase
        .from('user_alerts')
        .update({ 
          triggered: true,
          triggered_at: new Date().toISOString(),
          current_value: currentValue
        })
        .eq('id', alertId)

      // Reload alerts to show updated state
      loadAlerts()
    } catch (error) {
      console.error('Error triggering alert:', error)
    }
  }

  function startMonitoring() {
    if (monitoringActive) return

    setMonitoringActive(true)

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Check immediately
    checkAlerts()

    // Then check every 5 minutes
    const intervalId = setInterval(checkAlerts, 5 * 60 * 1000)

    // Store interval ID for cleanup
    ;(window as any).__alertMonitoringInterval = intervalId
  }

  function stopMonitoring() {
    setMonitoringActive(false)

    const intervalId = (window as any).__alertMonitoringInterval
    if (intervalId) {
      clearInterval(intervalId)
      delete (window as any).__alertMonitoringInterval
    }
  }

  async function createAlert() {
    if (!newAlertSymbol || newAlertThreshold <= 0) {
      alert('Please select a symbol and enter a valid threshold')
      return
    }

    try {
      const { error } = await supabase
        .from('user_alerts')
        .insert({
          user_id: userId,
          symbol: newAlertSymbol,
          alert_type: newAlertType,
          threshold: newAlertThreshold,
          current_value: 0,
          triggered: false
        })

      if (error) throw error

      // Reset form
      setNewAlertSymbol('')
      setNewAlertThreshold(0)

      // Reload alerts
      loadAlerts()
      
      alert('Alert created successfully!')
    } catch (error) {
      console.error('Error creating alert:', error)
      alert('Failed to create alert')
    }
  }

  async function deleteAlert(alertId: string) {
    if (!confirm('Delete this alert?')) return

    try {
      const { error } = await supabase
        .from('user_alerts')
        .delete()
        .eq('id', alertId)

      if (error) throw error

      loadAlerts()
    } catch (error) {
      console.error('Error deleting alert:', error)
    }
  }

  async function resetAlert(alertId: string) {
    try {
      await supabase
        .from('user_alerts')
        .update({ 
          triggered: false,
          triggered_at: null
        })
        .eq('id', alertId)

      loadAlerts()
    } catch (error) {
      console.error('Error resetting alert:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-2xl font-bold">Loading Alerts...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-600">
            🔔 Price Alerts
          </h1>
          <p className="text-xl text-slate-300">
            Get notified when stocks hit your target prices
          </p>
        </div>

        {/* Monitoring Status */}
        <div className={`mb-8 p-6 rounded-xl border ${monitoringActive ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-500/10 border-slate-500/30'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold mb-1">
                {monitoringActive ? '✅ Monitoring Active' : '⏸️ Monitoring Paused'}
              </div>
              <div className="text-sm text-slate-400">
                {monitoringActive && lastCheck ? (
                  `Last checked: ${lastCheck.toLocaleTimeString()} | Checking every 5 minutes`
                ) : (
                  'Create alerts to start automatic monitoring'
                )}
              </div>
            </div>
            {monitoringActive && (
              <button
                onClick={checkAlerts}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
              >
                Check Now
              </button>
            )}
          </div>
        </div>

        {/* Create New Alert */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
          <h2 className="text-2xl font-bold mb-6">Create New Alert</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Symbol */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Stock Symbol
              </label>
              <select
                value={newAlertSymbol}
                onChange={(e) => setNewAlertSymbol(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="">Select Symbol...</option>
                {availableSymbols.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
            </div>

            {/* Alert Type */}
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

            {/* Threshold */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Threshold {newAlertType === 'percent_change' ? '(%)' : '($)'}
              </label>
              <input
                type="number"
                step="0.01"
                value={newAlertThreshold}
                onChange={(e) => setNewAlertThreshold(Number(e.target.value))}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                placeholder={newAlertType === 'percent_change' ? '5.0' : '10.50'}
              />
            </div>

            {/* Create Button */}
            <div className="flex items-end">
              <button
                onClick={createAlert}
                className="w-full px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-lg font-bold transition"
              >
                Create Alert
              </button>
            </div>
          </div>

          {/* Helper Text */}
          <div className="text-sm text-slate-400">
            {newAlertType === 'price_above' && 'Alert when price rises above threshold'}
            {newAlertType === 'price_below' && 'Alert when price falls below threshold'}
            {newAlertType === 'percent_change' && 'Alert when price changes by % (up or down)'}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold mb-6">Your Alerts ({alerts.length})</h2>

          {alerts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="text-6xl mb-4">🔕</div>
              <div className="text-xl mb-2">No alerts yet</div>
              <div className="text-sm">Create your first alert above to get started</div>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map(alert => {
                const currentPrice = prices[alert.symbol]?.price
                
                return (
                  <div
                    key={alert.id}
                    className={`p-6 rounded-xl border ${
                      alert.triggered 
                        ? 'bg-orange-500/20 border-orange-500/50' 
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-2xl font-bold mb-1">{alert.symbol}</div>
                        <div className="text-sm text-slate-400">
                          Created {new Date(alert.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {alert.triggered && (
                          <button
                            onClick={() => resetAlert(alert.id)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition"
                          >
                            Reset
                          </button>
                        )}
                        <button
                          onClick={() => deleteAlert(alert.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-slate-400 mb-1">Alert Type</div>
                        <div className="font-semibold">
                          {alert.alert_type === 'price_above' && '📈 Price Above'}
                          {alert.alert_type === 'price_below' && '📉 Price Below'}
                          {alert.alert_type === 'percent_change' && '⚡ % Change'}
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-400 mb-1">Threshold</div>
                        <div className="font-semibold">
                          {alert.alert_type === 'percent_change' 
                            ? `${alert.threshold}%`
                            : `$${alert.threshold.toFixed(2)}`
                          }
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-400 mb-1">Current Price</div>
                        <div className="font-semibold">
                          {currentPrice 
                            ? `$${currentPrice.toFixed(2)}`
                            : 'Loading...'
                          }
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-400 mb-1">Status</div>
                        <div>
                          {alert.triggered ? (
                            <span className="px-3 py-1 bg-orange-500 rounded-full text-sm font-bold">
                              🔔 TRIGGERED
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-bold">
                              ⏰ Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {alert.triggered && alert.triggered_at && (
                      <div className="mt-4 p-4 bg-orange-500/10 rounded-lg">
                        <div className="text-sm">
                          <strong>Triggered:</strong> {new Date(alert.triggered_at).toLocaleString()}
                          {alert.current_value > 0 && ` at $${alert.current_value.toFixed(2)}`}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* What This Means */}
        <div className="bg-blue-500/10 rounded-xl p-8 border border-blue-500/30 mt-8">
          <h2 className="text-2xl font-bold mb-4">🎓 How Alerts Work</h2>
          
          <div className="space-y-4 text-slate-300">
            <div>
              <strong className="text-white">Automatic Monitoring:</strong> Once you create an alert, our system checks prices every 5 minutes automatically. You don't need to keep the page open!
            </div>

            <div>
              <strong className="text-white">Browser Notifications:</strong> When an alert triggers, you'll get a browser notification (if you've granted permission). This works even if you're on another tab.
            </div>

            <div>
              <strong className="text-white">Alert Types:</strong>
              <ul className="ml-6 mt-2 space-y-1">
                <li>• <strong>Price Above:</strong> Triggers when stock price rises above your threshold</li>
                <li>• <strong>Price Below:</strong> Triggers when stock price falls below your threshold</li>
                <li>• <strong>% Change:</strong> Triggers on large price movements (up or down)</li>
              </ul>
            </div>

            <div>
              <strong className="text-white">Managing Alerts:</strong> Once triggered, alerts turn orange. You can reset them to monitor again, or delete them if no longer needed.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
