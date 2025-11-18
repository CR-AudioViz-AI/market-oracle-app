/**
 * Javari AI Knowledge Update Hooks
 * Automatically feeds market data to Javari for learning
 * Updates knowledge base with real-time market insights
 * 
 * @module javari-knowledge-hooks
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Types
interface MarketKnowledge {
  id?: string;
  timestamp: string;
  type: 'stock' | 'crypto' | 'news' | 'sentiment' | 'pattern';
  symbol?: string;
  data: any;
  insights?: string;
  confidence?: number;
  source: string;
  created_at?: string;
}

interface LearningEvent {
  id?: string;
  event_type: string;
  data: any;
  pattern_detected?: boolean;
  action_taken?: string;
  outcome?: string;
  created_at?: string;
}

/**
 * Store market knowledge in Supabase for Javari to learn from
 */
export async function storeMarketKnowledge(knowledge: MarketKnowledge): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('javari_market_knowledge')
      .insert({
        timestamp: knowledge.timestamp,
        type: knowledge.type,
        symbol: knowledge.symbol,
        data: knowledge.data,
        insights: knowledge.insights,
        confidence: knowledge.confidence || 0.5,
        source: knowledge.source
      });

    if (error) {
      console.error('Error storing market knowledge:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception storing market knowledge:', error);
    return false;
  }
}

/**
 * Log learning events for analysis and improvement
 */
export async function logLearningEvent(event: LearningEvent): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('javari_learning_events')
      .insert({
        event_type: event.event_type,
        data: event.data,
        pattern_detected: event.pattern_detected || false,
        action_taken: event.action_taken,
        outcome: event.outcome
      });

    if (error) {
      console.error('Error logging learning event:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception logging learning event:', error);
    return false;
  }
}

/**
 * Hook: When new stock data is fetched
 */
export async function onStockDataFetch(symbol: string, data: any) {
  try {
    // Store the stock data
    await storeMarketKnowledge({
      timestamp: new Date().toISOString(),
      type: 'stock',
      symbol,
      data: {
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        volume: data.volume,
        high: data.high,
        low: data.low
      },
      source: 'alpha_vantage',
      confidence: 0.9
    });

    // Log the event
    await logLearningEvent({
      event_type: 'stock_data_fetch',
      data: { symbol, price: data.price },
      action_taken: 'stored_in_knowledge_base'
    });

    // Detect patterns (simple example - Javari would do more sophisticated analysis)
    const insights = generateStockInsights(data);
    if (insights) {
      await storeMarketKnowledge({
        timestamp: new Date().toISOString(),
        type: 'pattern',
        symbol,
        data: { pattern: 'price_movement' },
        insights,
        confidence: 0.7,
        source: 'javari_analysis'
      });
    }
  } catch (error) {
    console.error('Error in stock data fetch hook:', error);
  }
}

/**
 * Hook: When new crypto data is fetched
 */
export async function onCryptoDataFetch(id: string, symbol: string, data: any) {
  try {
    await storeMarketKnowledge({
      timestamp: new Date().toISOString(),
      type: 'crypto',
      symbol,
      data: {
        id,
        price: data.price,
        change24h: data.priceChange24h,
        changePercent24h: data.priceChangePercent24h,
        marketCap: data.marketCap,
        volume24h: data.volume24h
      },
      source: 'coingecko',
      confidence: 0.9
    });

    await logLearningEvent({
      event_type: 'crypto_data_fetch',
      data: { id, symbol, price: data.price },
      action_taken: 'stored_in_knowledge_base'
    });

    const insights = generateCryptoInsights(data);
    if (insights) {
      await storeMarketKnowledge({
        timestamp: new Date().toISOString(),
        type: 'pattern',
        symbol,
        data: { pattern: 'crypto_movement' },
        insights,
        confidence: 0.7,
        source: 'javari_analysis'
      });
    }
  } catch (error) {
    console.error('Error in crypto data fetch hook:', error);
  }
}

/**
 * Hook: When news is fetched with sentiment
 */
export async function onNewsFetch(articles: any[]) {
  try {
    // Store aggregate sentiment
    const sentimentCounts = articles.reduce((acc, article) => {
      acc[article.sentiment.label] = (acc[article.sentiment.label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const overallSentiment = calculateOverallSentiment(sentimentCounts);

    await storeMarketKnowledge({
      timestamp: new Date().toISOString(),
      type: 'sentiment',
      data: {
        total_articles: articles.length,
        sentiment_distribution: sentimentCounts,
        overall_sentiment: overallSentiment,
        sample_headlines: articles.slice(0, 5).map(a => a.title)
      },
      insights: `Market sentiment is ${overallSentiment.label} with ${overallSentiment.score.toFixed(2)} confidence`,
      confidence: overallSentiment.score,
      source: 'newsapi'
    });

    await logLearningEvent({
      event_type: 'news_fetch',
      data: { article_count: articles.length, sentiment: overallSentiment },
      pattern_detected: overallSentiment.label !== 'neutral',
      action_taken: 'sentiment_analysis_complete'
    });
  } catch (error) {
    console.error('Error in news fetch hook:', error);
  }
}

/**
 * Hook: When market summary is generated
 */
export async function onMarketSummaryGenerate(summary: any) {
  try {
    await storeMarketKnowledge({
      timestamp: new Date().toISOString(),
      type: 'sentiment',
      data: {
        indices: summary.indices,
        market_sentiment: summary.sentiment,
        top_stocks: {
          gainers: summary.stocks.topGainers.slice(0, 3),
          losers: summary.stocks.topLosers.slice(0, 3)
        },
        top_crypto: {
          gainers: summary.crypto.topGainers.slice(0, 3),
          losers: summary.crypto.topLosers.slice(0, 3)
        }
      },
      insights: summary.sentiment.description,
      confidence: Math.abs(summary.sentiment.score),
      source: 'market_oracle_summary'
    });

    await logLearningEvent({
      event_type: 'market_summary_generate',
      data: { sentiment: summary.sentiment },
      pattern_detected: summary.sentiment.overall !== 'neutral',
      action_taken: 'comprehensive_market_analysis'
    });
  } catch (error) {
    console.error('Error in market summary hook:', error);
  }
}

/**
 * Generate insights from stock data
 */
function generateStockInsights(data: any): string | null {
  const changePercent = data.changePercent;
  
  if (Math.abs(changePercent) > 5) {
    return `Significant ${changePercent > 0 ? 'upward' : 'downward'} movement detected: ${changePercent.toFixed(2)}%`;
  }
  
  if (data.volume > 100000000) {
    return `Unusually high trading volume detected: ${data.volume.toLocaleString()} shares`;
  }
  
  return null;
}

/**
 * Generate insights from crypto data
 */
function generateCryptoInsights(data: any): string | null {
  const changePercent = data.priceChangePercent24h;
  
  if (Math.abs(changePercent) > 10) {
    return `Major ${changePercent > 0 ? 'pump' : 'dump'} detected: ${changePercent.toFixed(2)}% in 24h`;
  }
  
  if (data.volume24h > data.marketCap * 0.5) {
    return `Volume spike detected: 24h volume is ${((data.volume24h / data.marketCap) * 100).toFixed(0)}% of market cap`;
  }
  
  return null;
}

/**
 * Calculate overall sentiment from distribution
 */
function calculateOverallSentiment(sentimentCounts: Record<string, number>) {
  const positive = sentimentCounts.positive || 0;
  const negative = sentimentCounts.negative || 0;
  const neutral = sentimentCounts.neutral || 0;
  const total = positive + negative + neutral;

  if (total === 0) {
    return { label: 'neutral', score: 0.5 };
  }

  const positiveRatio = positive / total;
  const negativeRatio = negative / total;

  if (positiveRatio > 0.6) {
    return { label: 'bullish', score: positiveRatio };
  } else if (negativeRatio > 0.6) {
    return { label: 'bearish', score: negativeRatio };
  } else {
    return { label: 'neutral', score: 0.5 };
  }
}

/**
 * Retrieve recent market knowledge for Javari to reference
 */
export async function getRecentMarketKnowledge(
  type?: string,
  limit: number = 100
): Promise<MarketKnowledge[]> {
  try {
    let query = supabase
      .from('javari_market_knowledge')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error retrieving market knowledge:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception retrieving market knowledge:', error);
    return [];
  }
}

/**
 * Get learning events for analysis
 */
export async function getLearningEvents(
  eventType?: string,
  limit: number = 100
): Promise<LearningEvent[]> {
  try {
    let query = supabase
      .from('javari_learning_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error retrieving learning events:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception retrieving learning events:', error);
    return [];
  }
}

/**
 * Clean up old knowledge (keep last 30 days)
 */
export async function cleanupOldKnowledge(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await supabase
      .from('javari_market_knowledge')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString());

    await supabase
      .from('javari_learning_events')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString());

    console.log('Cleaned up market knowledge older than 30 days');
  } catch (error) {
    console.error('Error cleaning up old knowledge:', error);
  }
}
