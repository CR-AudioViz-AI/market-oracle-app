'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SectorsPage() {
  const [loading, setLoading] = useState(true)

  const sectors = [
    { name: 'Technology', picks: 35, avgGain: 12.5, color: '#3b82f6' },
    { name: 'Healthcare', picks: 18, avgGain: 8.3, color: '#10b981' },
    { name: 'Finance', picks: 22, avgGain: 6.7, color: '#f59e0b' },
    { name: 'Energy', picks: 15, avgGain: 15.2, color: '#ef4444' },
    { name: 'Consumer', picks: 12, avgGain: 9.1, color: '#8b5cf6' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Sector Analysis</h1>
          <p className="text-gray-300">Industry breakdown of AI picks and performance</p>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Picks by Sector</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sectors}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, picks }) => `${name}: ${picks}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="picks"
                >
                  {sectors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Average Gain by Sector</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sectors}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="name" stroke="#ffffff80" />
                <YAxis stroke="#ffffff80" />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="avgGain" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Details */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Sector Performance</h2>
          <div className="space-y-4">
            {sectors.map(sector => (
              <div key={sector.name} className="p-6 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: sector.color }}
                    />
                    <div className="text-2xl font-bold text-white">{sector.name}</div>
                  </div>
                  <div className="flex gap-8">
                    <div>
                      <div className="text-gray-400 text-sm">Total Picks</div>
                      <div className="text-white font-bold text-xl">{sector.picks}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Avg Gain</div>
                      <div className="text-green-400 font-bold text-xl">+{sector.avgGain}%</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What This Means */}
        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">💡 What This Means</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              <strong className="text-white">Sector Analysis:</strong> Understanding which industries AI models favor helps diversify your portfolio and identify market trends.
            </p>
            <p>
              <strong className="text-white">Diversification:</strong> Don't put all eggs in one basket. Spread investments across multiple sectors to reduce risk.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
