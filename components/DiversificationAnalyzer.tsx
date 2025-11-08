'use client'

import { useState, useEffect } from 'react'
import { PieChart, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react'

export function DiversificationAnalyzer({ portfolio }: { portfolio: any[] }) {
  const [analysis, setAnalysis] = useState<any>(null)

  useEffect(() => {
    analyzePortfolio()
  }, [portfolio])

  function analyzePortfolio() {
    if (!portfolio || portfolio.length === 0) {
      setAnalysis(null)
      return
    }

    // Calculate sector exposure
    const sectorMap = new Map()
    const totalValue = portfolio.reduce((sum, p) => sum + (p.shares * p.currentPrice), 0)

    portfolio.forEach(position => {
      const sector = position.sector || 'Technology' // Default sector
      const value = position.shares * position.currentPrice
      const percentage = (value / totalValue) * 100

      if (!sectorMap.has(sector)) {
        sectorMap.set(sector, { value: 0, percentage: 0, count: 0 })
      }
      const sectorData = sectorMap.get(sector)
      sectorData.value += value
      sectorData.percentage += percentage
      sectorData.count += 1
    })

    const sectors = Array.from(sectorMap.entries()).map(([name, data]) => ({
      name,
      ...data
    })).sort((a, b) => b.percentage - a.percentage)

    // Calculate diversification score (0-100)
    const largestSector = sectors[0]?.percentage || 0
    const topThreeSectors = sectors.slice(0, 3).reduce((sum, s) => sum + s.percentage, 0)
    
    let score = 100
    if (largestSector > 40) score -= 30
    else if (largestSector > 30) score -= 20
    else if (largestSector > 25) score -= 10

    if (topThreeSectors > 70) score -= 20
    else if (topThreeSectors > 60) score -= 10

    if (portfolio.length < 5) score -= 20
    else if (portfolio.length < 10) score -= 10

    setAnalysis({
      sectors,
      score: Math.max(0, score),
      totalValue,
      positionCount: portfolio.length,
      largestSector: largestSector
    })
  }

  if (!analysis) {
    return (
      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
        <p className="text-slate-400 text-center">Add stocks to your portfolio to see diversification analysis</p>
      </div>
    )
  }

  const scoreColor = analysis.score >= 80 ? 'text-green-400' :
                     analysis.score >= 60 ? 'text-yellow-400' : 'text-red-400'
  const scoreLabel = analysis.score >= 80 ? 'Excellent' :
                     analysis.score >= 60 ? 'Good' : 'Needs Improvement'

  return (
    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
      <div className="flex items-center gap-3 mb-6">
        <PieChart className="w-6 h-6 text-brand-cyan" />
        <h3 className="text-xl font-bold">Portfolio Diversification</h3>
      </div>

      {/* Score */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 mb-1">Diversification Score</p>
            <p className={`text-5xl font-bold ${scoreColor}`}>{analysis.score}/100</p>
            <p className="text-sm text-slate-300 mt-1">{scoreLabel}</p>
          </div>
          {analysis.score >= 80 ? (
            <CheckCircle className="w-16 h-16 text-green-400" />
          ) : (
            <AlertCircle className="w-16 h-16 text-yellow-400" />
          )}
        </div>
      </div>

      {/* Sector Breakdown */}
      <div className="space-y-3 mb-6">
        <h4 className="font-semibold mb-3">Sector Allocation</h4>
        {analysis.sectors.map((sector: any) => (
          <div key={sector.name}>
            <div className="flex justify-between text-sm mb-1">
              <span>{sector.name}</span>
              <span className="font-semibold">{sector.percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  sector.percentage > 30 ? 'bg-red-500' :
                  sector.percentage > 20 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${sector.percentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400 mt-1">{sector.count} position(s)</p>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-sm font-semibold text-blue-400 mb-2">💡 Recommendations:</p>
        <ul className="text-sm text-slate-300 space-y-1">
          {analysis.largestSector > 30 && (
            <li>• Your largest sector is {analysis.largestSector.toFixed(1)}%. Consider reducing exposure.</li>
          )}
          {analysis.positionCount < 10 && (
            <li>• You have {analysis.positionCount} positions. Consider adding more for better diversification.</li>
          )}
          {analysis.score >= 80 && (
            <li>• Excellent diversification! Your portfolio is well-balanced.</li>
          )}
          <li>• Aim for 10-15 positions across 5+ sectors for optimal diversification</li>
        </ul>
      </div>
    </div>
  )
}
