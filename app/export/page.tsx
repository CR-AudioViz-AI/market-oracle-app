'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ExportPage() {
  const [loading, setLoading] = useState(false)
  const [exportType, setExportType] = useState<'picks' | 'performance' | 'portfolio'>('picks')
  const [format, setFormat] = useState<'csv' | 'json'>('csv')

  async function exportData() {
    setLoading(true)

    try {
      let data: any[] = []
      let filename = ''

      if (exportType === 'picks') {
        const { data: picks } = await supabase
          .from('stock_picks')
          .select('*')
          .order('pick_date', { ascending: false })

        data = picks || []
        filename = `market-oracle-picks-${new Date().toISOString().split('T')[0]}`

      } else if (exportType === 'performance') {
        const { data: picks } = await supabase
          .from('stock_picks')
          .select('*')
          .eq('status', 'CLOSED')

        // Calculate performance metrics
        data = (picks || []).map(pick => ({
          symbol: pick.symbol,
          ai_name: pick.ai_name,
          entry_price: pick.entry_price,
          exit_price: pick.exit_price,
          gain_loss: pick.exit_price ? pick.exit_price - pick.entry_price : 0,
          gain_loss_percent: pick.exit_price 
            ? ((pick.exit_price - pick.entry_price) / pick.entry_price) * 100 
            : 0,
          pick_date: pick.pick_date,
          exit_date: pick.exit_date,
          confidence_score: pick.confidence_score
        }))

        filename = `market-oracle-performance-${new Date().toISOString().split('T')[0]}`

      } else if (exportType === 'portfolio') {
        const savedPortfolio = localStorage.getItem('paper_trading_portfolio')
        if (savedPortfolio) {
          const portfolio = JSON.parse(savedPortfolio)
          data = portfolio.positions || []
          filename = `market-oracle-portfolio-${new Date().toISOString().split('T')[0]}`
        }
      }

      if (data.length === 0) {
        alert('No data to export')
        setLoading(false)
        return
      }

      // Export based on format
      if (format === 'csv') {
        exportToCSV(data, filename)
      } else {
        exportToJSON(data, filename)
      }

    } catch (error) {
      console.error('Export error:', error)
      alert('Error exporting data')
    } finally {
      setLoading(false)
    }
  }

  function exportToCSV(data: any[], filename: string) {
    if (data.length === 0) return

    // Get all keys from first object
    const keys = Object.keys(data[0])
    
    // Create CSV header
    let csv = keys.join(',') + '\n'

    // Add data rows
    data.forEach(row => {
      const values = keys.map(key => {
        const value = row[key]
        // Handle values with commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ''
      })
      csv += values.join(',') + '\n'
    })

    // Download
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  function exportToJSON(data: any[], filename: string) {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="text-4xl font-bold mb-2">💾 Export Data</h1>
        <p className="text-slate-400 mb-8">
          Download your data in CSV or JSON format
        </p>

        {/* Export Configuration */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
          <h2 className="text-2xl font-bold mb-6">Export Configuration</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                What to Export
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setExportType('picks')}
                  className={`p-4 rounded-xl border-2 transition ${
                    exportType === 'picks'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-3xl mb-2">📊</div>
                  <div className="font-semibold">All AI Picks</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Export all stock picks with AI analysis
                  </div>
                </button>

                <button
                  onClick={() => setExportType('performance')}
                  className={`p-4 rounded-xl border-2 transition ${
                    exportType === 'performance'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-3xl mb-2">📈</div>
                  <div className="font-semibold">Performance</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Export closed picks with gains/losses
                  </div>
                </button>

                <button
                  onClick={() => setExportType('portfolio')}
                  className={`p-4 rounded-xl border-2 transition ${
                    exportType === 'portfolio'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-3xl mb-2">💼</div>
                  <div className="font-semibold">Portfolio</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Export your paper trading positions
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Export Format
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setFormat('csv')}
                  className={`p-4 rounded-xl border-2 transition ${
                    format === 'csv'
                      ? 'border-green-500 bg-green-500/20'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-2xl mb-2">📋</div>
                  <div className="font-semibold">CSV</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Compatible with Excel, Google Sheets
                  </div>
                </button>

                <button
                  onClick={() => setFormat('json')}
                  className={`p-4 rounded-xl border-2 transition ${
                    format === 'json'
                      ? 'border-green-500 bg-green-500/20'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-2xl mb-2">⚙️</div>
                  <div className="font-semibold">JSON</div>
                  <div className="text-xs text-slate-400 mt-1">
                    For developers and APIs
                  </div>
                </button>
              </div>
            </div>

            <button
              onClick={exportData}
              disabled={loading}
              className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white font-bold rounded-xl transition text-lg"
            >
              {loading ? 'Exporting...' : `Export ${exportType.charAt(0).toUpperCase() + exportType.slice(1)} as ${format.toUpperCase()}`}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
          <h3 className="font-bold text-lg mb-3">💡 How to Use Exports</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p><strong>CSV Files:</strong></p>
            <ul className="ml-6 space-y-1">
              <li>• Open in Excel, Google Sheets, or any spreadsheet software</li>
              <li>• Perfect for creating custom charts and analysis</li>
              <li>• Easy to import into other tools</li>
            </ul>

            <p className="mt-3"><strong>JSON Files:</strong></p>
            <ul className="ml-6 space-y-1">
              <li>• Machine-readable format for developers</li>
              <li>• Use in custom scripts and applications</li>
              <li>• Integrates with APIs and automation tools</li>
            </ul>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="mt-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
          <h3 className="font-bold text-lg mb-3">🚀 Coming Soon</h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm text-slate-300">
            <div>✨ Excel (.xlsx) format</div>
            <div>✨ PDF reports with charts</div>
            <div>✨ Scheduled exports</div>
            <div>✨ Email delivery</div>
            <div>✨ Custom date ranges</div>
            <div>✨ Advanced filters</div>
          </div>
        </div>
      </div>
    </div>
  )
}
