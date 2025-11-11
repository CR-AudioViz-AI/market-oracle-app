// Javari AI Client - Connects Market Oracle to Real Javari AI
// Production-ready with complete type safety and error handling

export interface JavariCompetitorPick {
  ai_name: string
  symbol: string
  entry_price: number
  target_price: number
  stop_loss: number
  confidence_score: number
  reasoning: string
  sector?: string
  catalyst?: string
}

export interface JavariStockRequest {
  competitor_picks: JavariCompetitorPick[]
  market_data?: {
    date: string
    sentiment: string
    key_trends: string[]
  }
  news_context?: string[]
  manual_insights?: string
}

export interface JavariPick {
  symbol: string
  entry_price: number
  target_price: number
  stop_loss: number
  confidence_score: number
  reasoning: string
  timeframe: string
  is_top_pick: boolean
  rank: number
  learned_from: string[]
  contrarian_bet: boolean
  sector?: string
  catalyst?: string
}

export interface JavariCompetitorReview {
  gpt4_analysis: string
  claude_analysis: string
  gemini_analysis: string
  perplexity_analysis: string
  consensus_patterns: string[]
  disagreements: string[]
}

export interface JavariMarketResearch {
  penny_stocks_reviewed: number
  sectors_analyzed: string[]
  market_sentiment: string
  key_trends: string[]
}

export interface JavariReasoning {
  why_these_picks: string
  learning_applied: string
  competitive_advantage: string
  risk_assessment: string
}

export interface JavariAnalysisData {
  competitor_review: JavariCompetitorReview
  market_research: JavariMarketResearch
  javari_reasoning: JavariReasoning
  picks: JavariPick[]
}

export interface JavariAnalysisResponse {
  success: boolean
  javari_analysis?: JavariAnalysisData
  metadata?: {
    competitor_picks_reviewed: number
    total_picks_generated: number
    top_picks: number
    contrarian_picks: number
    timestamp: string
  }
  error?: string
  message?: string
}

// Javari AI endpoint configuration
const JAVARI_API_URL = process.env.JAVARI_API_URL || 'https://crav-javari.vercel.app'
const JAVARI_API_KEY = process.env.JAVARI_API_KEY || process.env.CRON_SECRET || 'market-oracle-2025'

/**
 * Call Javari AI for stock analysis
 * Connects to the REAL Javari AI in the CR AudioViz ecosystem
 */
export async function callJavariForStockAnalysis(
  request: JavariStockRequest
): Promise<JavariAnalysisResponse> {
  try {
    console.log('🧠 Calling Real Javari AI...')
    console.log(`   Endpoint: ${JAVARI_API_URL}/api/javari/stock-analysis`)
    console.log(`   Reviewing ${request.competitor_picks.length} competitor picks`)

    const response = await fetch(`${JAVARI_API_URL}/api/javari/stock-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JAVARI_API_KEY}`
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error')
      console.error(`❌ Javari API HTTP ${response.status}: ${errorText}`)
      
      return {
        success: false,
        error: `Javari API returned ${response.status}`,
        message: errorText
      }
    }

    const data = await response.json() as JavariAnalysisResponse

    if (!data.success) {
      console.error('❌ Javari analysis failed:', data.error || data.message)
      return data
    }

    const pickCount = data.javari_analysis?.picks.length || 0
    const topPickCount = data.javari_analysis?.picks.filter(p => p.is_top_pick).length || 0
    
    console.log(`✅ Javari AI responded: ${pickCount} picks (${topPickCount} top picks)`)

    return data

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ Failed to connect to Javari AI:', errorMessage)
    
    return {
      success: false,
      error: 'Connection failed',
      message: errorMessage
    }
  }
}

/**
 * Format competitor picks for Javari analysis
 */
export function formatPicksForJavari(aiResults: any[]): JavariStockRequest {
  const competitorPicks: JavariCompetitorPick[] = []
  
  for (const result of aiResults) {
    if (result.success && Array.isArray(result.picks) && result.picks.length > 0) {
      for (const pick of result.picks) {
        competitorPicks.push({
          ai_name: result.ai_name,
          symbol: pick.symbol,
          entry_price: pick.entry_price,
          target_price: pick.target_price,
          stop_loss: pick.stop_loss || pick.entry_price * 0.9,
          confidence_score: pick.confidence_score,
          reasoning: pick.reasoning,
          sector: pick.sector,
          catalyst: pick.catalyst
        })
      }
    }
  }

  return {
    competitor_picks: competitorPicks,
    market_data: {
      date: new Date().toISOString().split('T')[0],
      sentiment: 'Analyzing',
      key_trends: []
    }
  }
}

/**
 * Health check for Javari AI endpoint
 */
export async function checkJavariHealth(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout
    
    const response = await fetch(`${JAVARI_API_URL}/api/javari/stock-analysis`, {
      method: 'GET',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    return response.ok
  } catch {
    return false
  }
}
