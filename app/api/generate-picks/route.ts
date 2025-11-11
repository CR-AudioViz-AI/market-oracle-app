// API Route: Generate AI Stock Picks - 5 AI Battle with Javari Learning
// POST /api/generate-picks

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAllAIPicks } from '@/lib/ai-stock-picker'
import { 
  callJavariForStockAnalysis, 
  formatPicksForJavari, 
  checkJavariHealth 
} from '@/lib/javari-client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'market-oracle-2025'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🎯 MARKET ORACLE - 5 AI BATTLE ROYALE')
    console.log('=' .repeat(70))

    // PHASE 1: Get picks from 4 base AIs
    console.log('\n📊 PHASE 1: Base AI Analysis')
    console.log('   Calling GPT-4, Claude, Gemini, Perplexity...\n')
    
    const baseAIResults = await getAllAIPicks()

    if (!baseAIResults.success) {
      return NextResponse.json({ 
        error: 'No AI successfully generated picks' 
      }, { status: 500 })
    }

    // PHASE 2: Javari learns and makes picks
    console.log('\n🧠 PHASE 2: Javari AI Learning & Analysis')
    console.log('   Calling REAL Javari AI from ecosystem...')
    
    const javariHealthy = await checkJavariHealth()
    if (!javariHealthy) {
      console.warn('⚠️  Javari AI not responding - continuing with 4 AIs')
    }
    
    const javariRequest = formatPicksForJavari(baseAIResults.results)
    const javariResult = javariHealthy 
      ? await callJavariForStockAnalysis(javariRequest)
      : { success: false, error: 'Javari unavailable' }

    // PHASE 3: Create battle record
    console.log('\n💾 PHASE 3: Storing Battle Data')
    
    const battleDate = new Date().toISOString().split('T')[0]
    const totalPicks = baseAIResults.total_picks + (javariResult.javari_analysis?.picks.length || 0)
    
    const { data: battle, error: battleError } = await supabase
      .from('daily_battles')
      .insert({
        battle_date: battleDate,
        status: 'active',
        total_picks: totalPicks,
        stocks_count: 0
      })
      .select()
      .single()

    if (battleError) {
      console.error('❌ Battle creation error:', battleError)
      return NextResponse.json({ 
        error: 'Failed to create battle', 
        details: battleError 
      }, { status: 500 })
    }

    console.log(`   ✅ Battle created: ${battle.id}`)

    // PHASE 4: Store all picks
    console.log('\n📈 PHASE 4: Storing AI Picks')
    
    const allPicks = []
    const aiModels: Record<string, string> = {}

    // Get AI model IDs
    const { data: models } = await supabase
      .from('ai_models')
      .select('id, ai_name')
    
    models?.forEach(m => {
      aiModels[m.ai_name.toLowerCase()] = m.id
    })

    // Store base AI picks (GPT-4, Claude, Gemini, Perplexity)
    for (const result of baseAIResults.results) {
      if (result.success && result.picks.length > 0) {
        const aiModelId = aiModels[result.ai_name.toLowerCase()]
        
        if (!aiModelId) {
          console.warn(`   ⚠️  No model ID for ${result.ai_name}`)
          continue
        }

        for (const pick of result.picks) {
          allPicks.push({
            battle_id: battle.id,
            ai_model_id: aiModelId,
            ai_name: result.ai_name,
            symbol: pick.symbol.toUpperCase(),
            entry_price: pick.entry_price,
            target_price: pick.target_price,
            stop_loss: pick.stop_loss || pick.entry_price * 0.9,
            confidence_score: pick.confidence_score,
            reasoning: pick.reasoning,
            status: 'OPEN',
            pick_date: battleDate,
            action: 'BUY',
            is_top_pick: pick.is_top_pick || false,
            pick_rank: pick.rank || 999,
            sector: pick.sector || null,
            catalyst: pick.catalyst || null
          })
        }
        
        const topPickCount = result.picks.filter(p => p.is_top_pick).length
        console.log(`   ✅ ${result.ai_name}: ${result.picks.length} picks (${topPickCount} top)`)
      }
    }

    // Store Javari picks (5th AI)
    if (javariResult.success && javariResult.javari_analysis?.picks) {
      let javariModelId = aiModels['javari'] || aiModels['javari ai']
      
      if (!javariModelId) {
        console.log('   Creating Javari AI model...')
        const { data: newJavari } = await supabase
          .from('ai_models')
          .insert({
            ai_name: 'Javari AI',
            display_name: 'Javari AI',
            provider: 'CR AudioViz AI',
            model_version: 'learning-v1',
            is_active: true,
            description: 'Learning AI that reviews competitors and makes superior picks'
          })
          .select()
          .single()
        
        if (newJavari) {
          javariModelId = newJavari.id
          aiModels['javari ai'] = newJavari.id
        }
      }

      if (javariModelId) {
        for (const pick of javariResult.javari_analysis.picks) {
          allPicks.push({
            battle_id: battle.id,
            ai_model_id: javariModelId,
            ai_name: 'Javari AI',
            symbol: pick.symbol.toUpperCase(),
            entry_price: pick.entry_price,
            target_price: pick.target_price,
            stop_loss: pick.stop_loss,
            confidence_score: pick.confidence_score,
            reasoning: pick.reasoning,
            status: 'OPEN',
            pick_date: battleDate,
            action: 'BUY',
            is_top_pick: pick.is_top_pick,
            pick_rank: pick.rank,
            learned_from: pick.learned_from.join(', '),
            is_contrarian: pick.contrarian_bet,
            sector: pick.sector || null,
            catalyst: pick.catalyst || null
          })
        }
        
        const topPickCount = javariResult.javari_analysis.picks.filter(p => p.is_top_pick).length
        console.log(`   ✅ Javari AI: ${javariResult.javari_analysis.picks.length} picks (${topPickCount} top) 🧠`)
        
        // Store Javari's analysis
        const { error: analysisError } = await supabase
          .from('javari_analysis')
          .insert({
            battle_id: battle.id,
            competitor_review: javariResult.javari_analysis.competitor_review,
            market_research: javariResult.javari_analysis.market_research,
            javari_reasoning: javariResult.javari_analysis.javari_reasoning,
            created_at: new Date().toISOString()
          })
        
        if (analysisError) {
          console.warn('⚠️  Could not store Javari analysis:', analysisError.message)
        }
      }
    }

    // Insert all picks
    const { data: savedPicks, error: picksError } = await supabase
      .from('stock_picks')
      .insert(allPicks)
      .select()

    if (picksError) {
      console.error('❌ Picks storage error:', picksError)
      return NextResponse.json({ 
        error: 'Failed to store picks', 
        details: picksError 
      }, { status: 500 })
    }

    // PHASE 5: Summary
    const totalAIs = baseAIResults.successful_ais + (javariResult.success ? 1 : 0)
    const topPicksCount = allPicks.filter(p => p.is_top_pick).length
    const portfolioCount = allPicks.filter(p => !p.is_top_pick).length

    console.log('\n' + '='.repeat(70))
    console.log('✅ 5 AI BATTLE COMPLETE!')
    console.log('='.repeat(70))
    console.log(`📊 Battle ID: ${battle.id}`)
    console.log(`📅 Date: ${battleDate}`)
    console.log(`🤖 AIs Participated: ${totalAIs}/5`)
    console.log(`📈 Total Picks: ${savedPicks?.length || 0}`)
    console.log(`🏆 Top 5 Picks per AI: ${topPicksCount}`)
    console.log(`📚 Portfolio Picks: ${portfolioCount}`)
    console.log('='.repeat(70))

    return NextResponse.json({
      success: true,
      battle_id: battle.id,
      battle_date: battleDate,
      summary: {
        total_ais: totalAIs,
        total_picks: savedPicks?.length || 0,
        top_picks: topPicksCount,
        portfolio_picks: portfolioCount
      },
      ai_results: [
        ...baseAIResults.results.map(r => ({
          ai_name: r.ai_name,
          success: r.success,
          picks_count: r.picks.length,
          top_picks_count: r.picks.filter(p => p.is_top_pick).length,
          error: r.error || null
        })),
        {
          ai_name: 'Javari AI',
          success: javariResult.success,
          picks_count: javariResult.javari_analysis?.picks.length || 0,
          top_picks_count: javariResult.javari_analysis?.picks.filter(p => p.is_top_pick).length || 0,
          learned_from: javariResult.success 
            ? Object.keys(javariResult.javari_analysis?.competitor_review || {}).length 
            : 0,
          error: javariResult.error || null
        }
      ],
      javari_insights: javariResult.success ? {
        consensus_patterns: javariResult.javari_analysis?.competitor_review.consensus_patterns || [],
        market_sentiment: javariResult.javari_analysis?.market_research.market_sentiment || '',
        competitive_advantage: javariResult.javari_analysis?.javari_reasoning.competitive_advantage || ''
      } : null
    })

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('❌ Generate picks error:', errorMsg)
    return NextResponse.json({ 
      error: 'Failed to generate picks',
      message: errorMsg
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Market Oracle - 5 AI Battle',
    status: 'online',
    ai_providers: [
      'GPT-4 (OpenAI)',
      'Claude (Anthropic)',
      'Gemini (Google)',
      'Perplexity',
      'Javari AI (CR AudioViz - Learning AI)'
    ],
    picks_per_ai: '5-20 (top 5 compete, full portfolio tracked)',
    javari_advantage: 'Reviews all 4 competitors before making picks',
    endpoint: 'POST /api/generate-picks',
    auth_required: 'Bearer token in Authorization header'
  })
}
