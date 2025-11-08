'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ExportPage() {
  const [format, setFormat] = useState('csv')
  const [dateRange, setDateRange] = useState('all')

  function handleExport() {
    alert(`Exporting data as ${format.toUpperCase()} for ${dateRange} time range...`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Export Data</h1>
          <p className="text-gray-300">Download your data for external analysis</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Export Options</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-white font-semibold mb-3">Format</label>
              <div className="grid grid-cols-3 gap-4">
                {['csv', 'json', 'excel'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`p-4 rounded-lg border-2 transition ${
                      format === f
                        ? 'bg-blue-500/30 border-blue-400 text-white'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-semibold">{f.toUpperCase()}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-semibold mb-3">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-semibold mb-3">Data Type</label>
              <div className="space-y-2">
                {['All Picks', 'Portfolio', 'Performance History', 'Trading History'].map(type => (
                  <label key={type} className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition">
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                    <span className="text-white">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleExport}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-lg font-bold text-lg transition"
            >
              Export Data
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500/20 to-green-500/20 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">💡 What This Means</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              <strong className="text-white">Data Ownership:</strong> Your data belongs to you. Export anytime for external analysis, tax reporting, or backup purposes.
            </p>
            <p>
              <strong className="text-white">Multiple Formats:</strong> CSV for Excel, JSON for developers, Excel for advanced spreadsheet analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
