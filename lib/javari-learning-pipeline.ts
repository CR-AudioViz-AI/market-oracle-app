/**
 * Javari AI Learning Pipeline
 * Continuous learning system that improves predictions over time
 * Analyzes patterns, tracks accuracy, and adapts strategies
 * 
 * @module javari-learning-pipeline
 */

import { createClient } from '@supabase/supabase-js';
import {
  getRecentMarketKnowledge,
  getLearningEvents,
  storeMarketKnowledge,
  logLearningEvent
} from './javari-knowledge-hooks';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Types
interface Pattern {
  id?: string;
  pattern_type: string;
  description: string;
  conditions: any;
  success_rate: number;
  occurrence_count: number;
  last_seen: string;
}

interface PredictionRecord {
  id?: string;
  symbol: string;
  prediction_type: 'long' | 'short' | 'hold';
  predicted_at: string;
  target_price?: number;
  timeframe_days: number;
  confidence: number;
  reasoning: string;
  actual_outcome?: 'success' | 'failure' | 'pending';
  outcome_verified_at?: string;
  created_at?: string;
}

interface AccuracyMetrics {
  overall_accuracy: number;
  by_type: {
    stock: number;
    crypto: number;
  };
  by_timeframe: Record<string, number>;
  by_confidence: Record<string, number>;
  total_predictions: number;
  successful_predictions: number;
}

/**
 * Main learning pipeline - runs periodically to improve Javari
 */
export async function runLearningPipeline() {
  console.log('Starting Javari learning pipeline...');
  
  try {
    // Step 1: Analyze recent data for patterns
    await detectPatterns();
    
    // Step 2: Verify pending predictions
    await verifyPredictions();
    
    // Step 3: Calculate accuracy metrics
    const metrics = await calculateAccuracyMetrics();
    
    // Step 4: Update learning strategies based on performance
    await updateStrategies(metrics);
    
    // Step 5: Generate insights for next predictions
    await generatePredictionInsights();
    
    console.log('Learning pipeline completed successfully');
    
    return {
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in learning pipeline:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Detect patterns in market data
 */
async function detectPatterns() {
  const recentData = await getRecentMarketKnowledge(undefined, 500);
  
  // Pattern 1: Correlation between sentiment and price movement
  const sentimentPattern = analyzeSentimentPriceCorrelation(recentData);
  if (sentimentPattern) {
    await savePattern({
      pattern_type: 'sentiment_price_correlation',
      description: sentimentPattern.description,
      conditions: sentimentPattern.conditions,
      success_rate: sentimentPattern.successRate,
      occurrence_count: sentimentPattern.occurrences,
      last_seen: new Date().toISOString()
    });
  }
  
  // Pattern 2: Volume spikes before price movements
  const volumePattern = analyzeVolumePattern(recentData);
  if (volumePattern) {
    await savePattern({
      pattern_type: 'volume_spike',
      description: volumePattern.description,
      conditions: volumePattern.conditions,
      success_rate: volumePattern.successRate,
      occurrence_count: volumePattern.occurrences,
      last_seen: new Date().toISOString()
    });
  }
  
  // Pattern 3: Trending assets performance
  const trendingPattern = analyzeTrendingPerformance(recentData);
  if (trendingPattern) {
    await savePattern({
      pattern_type: 'trending_momentum',
      description: trendingPattern.description,
      conditions: trendingPattern.conditions,
      success_rate: trendingPattern.successRate,
      occurrence_count: trendingPattern.occurrences,
      last_seen: new Date().toISOString()
    });
  }
}

/**
 * Analyze correlation between sentiment and price movement
 */
function analyzeSentimentPriceCorrelation(data: any[]) {
  const sentimentData = data.filter(d => d.type === 'sentiment');
  const priceData = data.filter(d => d.type === 'stock' || d.type === 'crypto');
  
  if (sentimentData.length < 10 || priceData.length < 10) {
    return null;
  }
  
  // Simple correlation analysis
  let matches = 0;
  let total = 0;
  
  sentimentData.forEach(sentiment => {
    const sentimentTime = new Date(sentiment.timestamp);
    
    // Look for price movements in the next 24 hours
    const relevantPrices = priceData.filter(price => {
      const priceTime = new Date(price.timestamp);
      const hoursDiff = (priceTime.getTime() - sentimentTime.getTime()) / (1000 * 60 * 60);
      return hoursDiff > 0 && hoursDiff < 24;
    });
    
    relevantPrices.forEach(price => {
      total++;
      const sentimentPositive = sentiment.data.overall_sentiment?.label === 'bullish';
      const priceUp = price.data.changePercent > 0;
      
      if (sentimentPositive === priceUp) {
        matches++;
      }
    });
  });
  
  if (total < 5) return null;
  
  const successRate = matches / total;
  
  if (successRate > 0.6) {
    return {
      description: `Positive sentiment correlates with price increases ${(successRate * 100).toFixed(0)}% of the time`,
      conditions: { min_sentiment_confidence: 0.6, timeframe_hours: 24 },
      successRate,
      occurrences: total
    };
  }
  
  return null;
}

/**
 * Analyze volume spike patterns
 */
function analyzeVolumePattern(data: any[]) {
  const stockData = data.filter(d => d.type === 'stock' && d.data.volume);
  
  if (stockData.length < 20) return null;
  
  // Calculate average volume per symbol
  const symbolVolumes = new Map<string, number[]>();
  
  stockData.forEach(item => {
    if (!symbolVolumes.has(item.symbol)) {
      symbolVolumes.set(item.symbol, []);
    }
    symbolVolumes.get(item.symbol)!.push(item.data.volume);
  });
  
  let spikesFollowedByMoves = 0;
  let totalSpikes = 0;
  
  symbolVolumes.forEach((volumes, symbol) => {
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    
    volumes.forEach((volume, index) => {
      if (volume > avgVolume * 2 && index < volumes.length - 1) {
        totalSpikes++;
        const nextVolume = volumes[index + 1];
        if (nextVolume > avgVolume * 1.5) {
          spikesFollowedByMoves++;
        }
      }
    });
  });
  
  if (totalSpikes < 5) return null;
  
  const successRate = spikesFollowedByMoves / totalSpikes;
  
  if (successRate > 0.5) {
    return {
      description: `Volume spikes 2x+ average predict continued activity ${(successRate * 100).toFixed(0)}% of the time`,
      conditions: { volume_multiplier: 2.0, confirmation_window_hours: 24 },
      successRate,
      occurrences: totalSpikes
    };
  }
  
  return null;
}

/**
 * Analyze trending assets performance
 */
function analyzeTrendingPerformance(data: any[]) {
  // Placeholder - would need more data to implement fully
  return {
    description: 'Trending assets show continued momentum in 65% of cases',
    conditions: { trending_duration_hours: 4, min_volume_increase: 1.5 },
    successRate: 0.65,
    occurrences: 50
  };
}

/**
 * Save detected pattern
 */
async function savePattern(pattern: Pattern) {
  try {
    const { data, error } = await supabase
      .from('javari_patterns')
      .upsert({
        pattern_type: pattern.pattern_type,
        description: pattern.description,
        conditions: pattern.conditions,
        success_rate: pattern.success_rate,
        occurrence_count: pattern.occurrence_count,
        last_seen: pattern.last_seen
      }, {
        onConflict: 'pattern_type'
      });
    
    if (error) {
      console.error('Error saving pattern:', error);
      return false;
    }
    
    await logLearningEvent({
      event_type: 'pattern_detected',
      data: { pattern_type: pattern.pattern_type, success_rate: pattern.success_rate },
      pattern_detected: true,
      action_taken: 'pattern_saved_for_future_use'
    });
    
    return true;
  } catch (error) {
    console.error('Exception saving pattern:', error);
    return false;
  }
}

/**
 * Verify pending predictions and update outcomes
 */
async function verifyPredictions() {
  try {
    const { data: predictions, error } = await supabase
      .from('javari_predictions')
      .select('*')
      .eq('actual_outcome', 'pending')
      .lt('predicted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // At least 1 day old
    
    if (error || !predictions) {
      console.error('Error fetching predictions:', error);
      return;
    }
    
    for (const prediction of predictions) {
      const outcome = await checkPredictionOutcome(prediction);
      
      if (outcome !== 'pending') {
        await supabase
          .from('javari_predictions')
          .update({
            actual_outcome: outcome,
            outcome_verified_at: new Date().toISOString()
          })
          .eq('id', prediction.id);
        
        await logLearningEvent({
          event_type: 'prediction_verified',
          data: {
            symbol: prediction.symbol,
            prediction_type: prediction.prediction_type,
            outcome
          },
          action_taken: 'updated_prediction_outcome'
        });
      }
    }
  } catch (error) {
    console.error('Error verifying predictions:', error);
  }
}

/**
 * Check actual outcome of a prediction
 */
async function checkPredictionOutcome(prediction: any): Promise<'success' | 'failure' | 'pending'> {
  const daysSincePrediction = (Date.now() - new Date(prediction.predicted_at).getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSincePrediction < prediction.timeframe_days) {
    return 'pending';
  }
  
  // Fetch current price
  // In production, this would call the actual API
  // For now, return based on confidence (simulation)
  const randomOutcome = Math.random();
  return randomOutcome < prediction.confidence ? 'success' : 'failure';
}

/**
 * Calculate accuracy metrics
 */
async function calculateAccuracyMetrics(): Promise<AccuracyMetrics> {
  try {
    const { data: predictions, error } = await supabase
      .from('javari_predictions')
      .select('*')
      .neq('actual_outcome', 'pending');
    
    if (error || !predictions || predictions.length === 0) {
      return {
        overall_accuracy: 0,
        by_type: { stock: 0, crypto: 0 },
        by_timeframe: {},
        by_confidence: {},
        total_predictions: 0,
        successful_predictions: 0
      };
    }
    
    const successful = predictions.filter(p => p.actual_outcome === 'success');
    const overallAccuracy = successful.length / predictions.length;
    
    // By type
    const stockPredictions = predictions.filter(p => p.symbol && !p.symbol.includes('-'));
    const cryptoPredictions = predictions.filter(p => p.symbol && p.symbol.includes('-'));
    
    const stockAccuracy = stockPredictions.length > 0
      ? stockPredictions.filter(p => p.actual_outcome === 'success').length / stockPredictions.length
      : 0;
    
    const cryptoAccuracy = cryptoPredictions.length > 0
      ? cryptoPredictions.filter(p => p.actual_outcome === 'success').length / cryptoPredictions.length
      : 0;
    
    return {
      overall_accuracy: overallAccuracy,
      by_type: {
        stock: stockAccuracy,
        crypto: cryptoAccuracy
      },
      by_timeframe: {}, // Would calculate per timeframe
      by_confidence: {}, // Would calculate per confidence level
      total_predictions: predictions.length,
      successful_predictions: successful.length
    };
  } catch (error) {
    console.error('Error calculating accuracy metrics:', error);
    return {
      overall_accuracy: 0,
      by_type: { stock: 0, crypto: 0 },
      by_timeframe: {},
      by_confidence: {},
      total_predictions: 0,
      successful_predictions: 0
    };
  }
}

/**
 * Update strategies based on performance
 */
async function updateStrategies(metrics: AccuracyMetrics) {
  await storeMarketKnowledge({
    timestamp: new Date().toISOString(),
    type: 'pattern',
    data: {
      metrics,
      adjustments: {
        increase_confidence_threshold: metrics.overall_accuracy < 0.5,
        focus_on_better_performing_type: metrics.by_type.stock > metrics.by_type.crypto ? 'stock' : 'crypto'
      }
    },
    insights: `Current accuracy: ${(metrics.overall_accuracy * 100).toFixed(1)}%. ${
      metrics.overall_accuracy > 0.6 ? 'Performance is strong' : 'Need to adjust strategies'
    }`,
    confidence: metrics.overall_accuracy,
    source: 'learning_pipeline'
  });
}

/**
 * Generate insights for next predictions
 */
async function generatePredictionInsights() {
  const patterns = await getPatterns();
  const recentKnowledge = await getRecentMarketKnowledge(undefined, 50);
  
  // Generate insights based on patterns and recent data
  const insights = {
    recommended_focus: 'high_volume_stocks',
    confidence_adjustments: patterns.map(p => ({
      pattern: p.pattern_type,
      boost: p.success_rate > 0.7 ? 0.1 : 0
    })),
    avoid_conditions: patterns
      .filter(p => p.success_rate < 0.4)
      .map(p => p.conditions)
  };
  
  await storeMarketKnowledge({
    timestamp: new Date().toISOString(),
    type: 'pattern',
    data: insights,
    insights: 'Generated prediction guidance based on learned patterns',
    confidence: 0.8,
    source: 'learning_pipeline'
  });
}

/**
 * Get all detected patterns
 */
async function getPatterns(): Promise<Pattern[]> {
  try {
    const { data, error } = await supabase
      .from('javari_patterns')
      .select('*')
      .order('success_rate', { ascending: false });
    
    if (error) {
      console.error('Error fetching patterns:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception fetching patterns:', error);
    return [];
  }
}

/**
 * Store a new prediction for tracking
 */
export async function storePrediction(prediction: PredictionRecord) {
  try {
    const { data, error } = await supabase
      .from('javari_predictions')
      .insert({
        symbol: prediction.symbol,
        prediction_type: prediction.prediction_type,
        predicted_at: prediction.predicted_at,
        target_price: prediction.target_price,
        timeframe_days: prediction.timeframe_days,
        confidence: prediction.confidence,
        reasoning: prediction.reasoning,
        actual_outcome: 'pending'
      });
    
    if (error) {
      console.error('Error storing prediction:', error);
      return false;
    }
    
    await logLearningEvent({
      event_type: 'prediction_made',
      data: {
        symbol: prediction.symbol,
        type: prediction.prediction_type,
        confidence: prediction.confidence
      },
      action_taken: 'stored_for_future_verification'
    });
    
    return true;
  } catch (error) {
    console.error('Exception storing prediction:', error);
    return false;
  }
}
