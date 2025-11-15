'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface SectorData {
  name: string
  picks: number
  avgConfidence: number
  topStock: string
  description: string
  icon: string
}

const sectorDescriptions: Record<string, { description: string; icon: string; characteristics: string[] }> = {
  'Technology': {
    description: 'Companies developing software, hardware, semiconductors, and tech services',
    icon: '💻',
    characteristics: [
      'High growth potential',
      'Innovation-driven',
      'Volatile but can deliver outsized returns',
      'Examples: AAPL, MSFT, NVDA'
    ]
  },
  'Healthcare': {
    description: 'Pharmaceutical, biotech, medical devices, and healthcare services',
    icon: '🏥',
    characteristics: [
      'Defensive sector (stable in downturns)',
      'Long development cycles',
      'Regulatory risk',
      'Examples: JNJ, PFE, UNH'
    ]
  },
  'Finance': {
    description: 'Banks, insurance, investment firms, and financial services',
    icon: '💰',
    characteristics: [
      'Interest rate sensitive',
      'Economic cycle dependent',
      'Dividend-paying',
      'Examples: JPM, BAC, GS'
    ]
  },
  'Consumer': {
    description: 'Retail, e-commerce, consumer goods, and services',
    icon: '🛒',
    characteristics: [
      'Reflects consumer spending trends',
      'Brand value important',
      'Seasonal patterns',
      'Examples: AMZN, WMT, COST'
    ]
  },
  'Energy': {
    description: 'Oil, gas, renewable energy, and energy services',
    icon: '⚡',
    characteristics: [
      'Commodity price dependent',
      'Geopolitical risk',
      'Transition to renewables',
      'Examples: XOM, CVX, NEE'
    ]
  },
  'Industrial': {
    description: 'Manufacturing, aerospace, defense, and construction',
    icon: '🏭',
    characteristics: [
      'Economic growth indicator',
      'Capital intensive',
      'Long business cycles',
      'Examples: CAT, BA, GE'
    ]
  }
}

export default function SectorsPage() {
  const [sectors, setSectors] = useState<SectorData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSector, setSelectedSector] = useState<string | null>(null)

  useEffect(() => {
    loadSectorData()
  }, [])

  async function loadSectorData() {
    const { data: picks } = await supabase
      .from('stock_picks')
      .select('*')
      .eq('status', 'OPEN')

    if (picks) {
      // Group by sector
      const sectorMap: Record<string, any[]> = {}
      
      picks.forEach(pick => {
        const sector = pick.sector || 'Other'
        if (!sectorMap[sector]) {
          sectorMap[sector] = []
        }
        sectorMap[sector].push(pick)
      })

      // Calculate sector data
      const sectorData: SectorData[] = Object.entries(sectorMap).map(([name, sectorPicks]) => {
        const avgConfidence = sectorPicks.reduce((sum, p) => sum + p.confidence_score, 0) / sectorPicks.length
        const topPick = sectorPicks.sort((a, b) => b.confidence_score - a.confidence_score)[0]
        
        const info = sectorDescriptions[name] || {
          description: 'Other market sectors',
          icon: '📊',
          characteristics: []
        }

        return {
          name,
          picks: sectorPicks.length,
          avgConfidence,
          topStock: topPick.symbol,
          description: info.description,
          icon: info.icon
        }
      })

      setSectors(sectorData.sort((a, b) => b.picks - a.picks))
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-2xl">Loading sectors...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="text-4xl font-bold mb-2">🏭 Sector Analysis</h1>
        <p className="text-slate-400 mb-8">
          Understand which market sectors AI models are targeting
        </p>

        {/* Explanation */}
        <div className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 mb-8">
          <h3 className="font-bold text-lg mb-3">💡 What Are Market Sectors?</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p>
              <strong>Market sectors</strong> are categories that group similar companies together. Understanding sectors helps you:
            </p>
            <ul className="ml-6 space-y-1">
              <li>• <strong>Diversify:</strong> Spread risk across different industries</li>
              <li>• <strong>Spot Trends:</strong> See which sectors AI models favor</li>
              <li>• <strong>Manage Risk:</strong> Some sectors are riskier (Tech) vs safer (Healthcare)</li>
              <li>• <strong>Economic Insight:</strong> Sectors perform differently in various economic conditions</li>
            </ul>
          </div>
        </div>

        {/* Sector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {sectors.map((sector) => {
            const info = sectorDescriptions[sector.name] || { characteristics: [] }
            
            return (
              <button
                key={sector.name}
                onClick={() => setSelectedSector(selectedSector === sector.name ? null : sector.name)}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-blue-500/50 transition-all hover:scale-105 text-left group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">{sector.icon}</div>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-semibold">
                    {sector.picks} picks
                  </span>
                </div>

                <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-400 transition">
                  {sector.name}
                </h3>

                <p className="text-sm text-slate-400 mb-4">{sector.description}</p>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-slate-500 text-xs">Avg Confidence</div>
                    <div className="font-bold text-green-400">{sector.avgConfidence.toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs">Top Pick</div>
                    <div className="font-bold">{sector.topStock}</div>
                  </div>
                </div>

                {selectedSector === sector.name && info.characteristics.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="text-xs font-bold text-blue-400 mb-2">Key Characteristics:</div>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {info.characteristics.map((char, i) => (
                        <li key={i}>• {char}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-xs text-blue-400 mt-4 group-hover:text-blue-300 transition">
                  {selectedSector === sector.name ? 'Click to collapse' : 'Click for details'}
                </div>
              </button>
            )
          })}
        </div>

        {/* Sector Strategy Guide */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl p-8 border border-purple-500/30">
          <h2 className="text-2xl font-bold mb-6">📈 Sector Investment Strategies</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-3 text-green-400">✅ Diversification Strategy</h3>
              <p className="text-sm text-slate-300 mb-3">
                Don't put all eggs in one basket. Spread investments across 3-5 different sectors.
              </p>
              <div className="text-xs text-slate-400">
                <strong>Example:</strong> 30% Tech, 25% Healthcare, 20% Finance, 15% Consumer, 10% Energy
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-3 text-blue-400">🎯 Sector Rotation</h3>
              <p className="text-sm text-slate-300 mb-3">
                Different sectors perform better in different economic phases.
              </p>
              <div className="text-xs text-slate-400 space-y-1">
                <div><strong>Bull Market:</strong> Tech, Consumer Discretionary</div>
                <div><strong>Bear Market:</strong> Healthcare, Utilities</div>
                <div><strong>Recovery:</strong> Finance, Industrial</div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-3 text-yellow-400">⚠️ Sector Concentration Risk</h3>
              <p className="text-sm text-slate-300 mb-3">
                Having too many picks in one sector increases risk if that sector underperforms.
              </p>
              <div className="text-xs text-slate-400">
                <strong>Warning:</strong> If {'>'}40% of picks are in one sector, consider diversifying.
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-3 text-purple-400">💡 Following AI Sector Trends</h3>
              <p className="text-sm text-slate-300 mb-3">
                When multiple AIs heavily favor a sector, it may indicate strong momentum.
              </p>
              <div className="text-xs text-slate-400">
                <strong>Tip:</strong> Compare sector distribution week-over-week to spot trends.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
