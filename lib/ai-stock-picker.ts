// AI Stock Picker Service - All 4 Base AIs with 5-20 picks each
// Market Oracle - CR AudioViz AI

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Types
export interface AIStockPick {
  symbol: string
  entry_price: number
  target_price: number
  stop_loss: number
  confidence_score: number
  reasoning: string
  timeframe: string
  is_top_pick: boolean
  rank: number
  sector?: string
  catalyst?: string
}

export interface AIPickResponse {
  success: boolean
  picks: AIStockPick[]
  ai_name: string
  error?: string
}

export interface AllAIPicksResponse {
  success: boolean
  results: AIPickResponse[]
  successful_ais: number
  total_picks: number
}

// Stock picking prompt - Updated for 5-20 picks
const STOCK_PICK_PROMPT = `You are an expert penny stock analyst for Market Oracle's AI Battle. Pick 5-20 high-potential penny stocks (under $10/share) for the next 7 days.

🎯 CRITICAL REQUIREMENTS:
1. Pick MINIMUM 5, MAXIMUM 20 stocks (more picks = better analysis)
2. Only stocks under $10/share with real liquidity
3. Rank ALL picks 1-20 (1 = highest confidence)
4. Mark your TOP 5 picks with is_top_pick: true
5. Provide entry price, target, stop loss for each
6. Confidence score 1-100 for each pick
7. 2-4 sentence reasoning per stock
8. Include sector and catalyst

Current date: ${new Date().toISOString().split('T')[0]}

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "market_analysis": {
    "stocks_reviewed": 100,
    "sectors_analyzed": ["Tech", "Healthcare", "Energy"],
    "market_sentiment": "Bullish",
    "key_trends": ["AI adoption", "Biotech innovation"]
  },
  "picks": [
    {
      "symbol": "TICKER",
      "entry_price": 2.50,
      "target_price": 3.25,
      "stop_loss": 2.10,
      "confidence_score": 85,
      "reasoning": "Strong technical setup with upcoming catalyst",
      "timeframe": "7 days",
      "is_top_pick": true,
      "rank": 1,
      "sector": "Technology",
      "catalyst": "Earnings report"
    }
  ]
}

Your TOP 5 compete head-to-head. Full portfolio shows complete analysis.`

// 1. OPENAI GPT-4
export async function getOpenAIPicks(): Promise<AIPickResponse> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    console.log('🤖 Calling GPT-4...')

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a penny stock expert. Respond ONLY with valid JSON.'
        },
        {
          role: 'user',
          content: STOCK_PICK_PROMPT
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const content = response.choices[0].message.content || ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : content

    const data = JSON.parse(jsonStr)
    const picks = data.picks || []

    console.log(`   ✅ GPT-4: ${picks.length} picks`)

    return {
      success: true,
      picks: picks.map((p: any) => ({
        ...p,
        ai_name: 'GPT-4'
      })),
      ai_name: 'GPT-4'
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`   ❌ GPT-4 error: ${errorMsg}`)
    return { success: false, picks: [], ai_name: 'GPT-4', error: errorMsg }
  }
}

// 2. ANTHROPIC CLAUDE
export async function getAnthropicPicks(): Promise<AIPickResponse> {
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })

    console.log('🤖 Calling Claude...')

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: STOCK_PICK_PROMPT
        }
      ]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Invalid response type')
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : content.text

    const data = JSON.parse(jsonStr)
    const picks = data.picks || []

    console.log(`   ✅ Claude: ${picks.length} picks`)

    return {
      success: true,
      picks: picks.map((p: any) => ({
        ...p,
        ai_name: 'Claude'
      })),
      ai_name: 'Claude'
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`   ❌ Claude error: ${errorMsg}`)
    return { success: false, picks: [], ai_name: 'Claude', error: errorMsg }
  }
}

// 3. GOOGLE GEMINI
export async function getGeminiPicks(): Promise<AIPickResponse> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    console.log('🤖 Calling Gemini...')

    const result = await model.generateContent(STOCK_PICK_PROMPT)
    const response = await result.response
    const content = response.text()

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : content

    const data = JSON.parse(jsonStr)
    const picks = data.picks || []

    console.log(`   ✅ Gemini: ${picks.length} picks`)

    return {
      success: true,
      picks: picks.map((p: any) => ({
        ...p,
        ai_name: 'Gemini'
      })),
      ai_name: 'Gemini'
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`   ❌ Gemini error: ${errorMsg}`)
    return { success: false, picks: [], ai_name: 'Gemini', error: errorMsg }
  }
}

// 4. PERPLEXITY
export async function getPerplexityPicks(): Promise<AIPickResponse> {
  try {
    console.log('🤖 Calling Perplexity...')

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a penny stock expert. Respond ONLY with valid JSON.'
          },
          {
            role: 'user',
            content: STOCK_PICK_PROMPT
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : content

    const parsed = JSON.parse(jsonStr)
    const picks = parsed.picks || []

    console.log(`   ✅ Perplexity: ${picks.length} picks`)

    return {
      success: true,
      picks: picks.map((p: any) => ({
        ...p,
        ai_name: 'Perplexity'
      })),
      ai_name: 'Perplexity'
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`   ❌ Perplexity error: ${errorMsg}`)
    return { success: false, picks: [], ai_name: 'Perplexity', error: errorMsg }
  }
}

// GET ALL 4 BASE AI PICKS
export async function getAllAIPicks(): Promise<AllAIPicksResponse> {
  console.log('🎯 Starting AI Battle - Calling all 4 base AIs...')
  
  const results = await Promise.allSettled([
    getOpenAIPicks(),
    getAnthropicPicks(),
    getGeminiPicks(),
    getPerplexityPicks()
  ])

  const aiResults: AIPickResponse[] = results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      return {
        success: false,
        picks: [],
        ai_name: 'Unknown',
        error: result.reason?.message || 'Unknown error'
      }
    }
  })

  const successfulAIs = aiResults.filter(r => r.success).length
  const totalPicks = aiResults.reduce((sum, r) => sum + r.picks.length, 0)

  console.log(`✅ Battle complete: ${successfulAIs}/4 AIs responded with ${totalPicks} total picks`)

  return {
    success: successfulAIs > 0,
    results: aiResults,
    successful_ais: successfulAIs,
    total_picks: totalPicks
  }
}
