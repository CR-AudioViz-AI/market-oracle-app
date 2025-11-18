/**
 * Prediction Tracking API Endpoint
 * Tracks Javari's predictions and performance over time
 * 
 * @endpoint GET/POST /api/javari/predictions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { storePrediction } from '../../lib/javari-learning-pipeline';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET - Retrieve predictions
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const outcome = searchParams.get('outcome');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('javari_predictions')
      .select('*')
      .order('predicted_at', { ascending: false })
      .limit(limit);

    if (symbol) {
      query = query.eq('symbol', symbol);
    }

    if (outcome) {
      query = query.eq('actual_outcome', outcome);
    }

    const { data: predictions, error } = await query;

    if (error) {
      throw new Error('Failed to fetch predictions');
    }

    // Calculate stats
    const stats = calculatePredictionStats(predictions || []);

    return NextResponse.json({
      predictions: predictions || [],
      stats,
      total: predictions?.length || 0
    });
  } catch (error: any) {
    console.error('Predictions GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch predictions' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new prediction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    if (!body.symbol || !body.prediction_type || !body.confidence) {
      return NextResponse.json(
        { error: 'Missing required fields: symbol, prediction_type, confidence' },
        { status: 400 }
      );
    }

    if (body.confidence < 0 || body.confidence > 1) {
      return NextResponse.json(
        { error: 'Confidence must be between 0 and 1' },
        { status: 400 }
      );
    }

    const prediction = {
      symbol: body.symbol,
      prediction_type: body.prediction_type,
      predicted_at: new Date().toISOString(),
      target_price: body.target_price,
      timeframe_days: body.timeframe_days || 7,
      confidence: body.confidence,
      reasoning: body.reasoning || 'Based on market analysis'
    };

    const success = await storePrediction(prediction);

    if (!success) {
      throw new Error('Failed to store prediction');
    }

    return NextResponse.json({
      success: true,
      prediction,
      message: 'Prediction stored successfully'
    });
  } catch (error: any) {
    console.error('Predictions POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create prediction' },
      { status: 500 }
    );
  }
}

/**
 * Calculate prediction statistics
 */
function calculatePredictionStats(predictions: any[]) {
  if (predictions.length === 0) {
    return {
      total: 0,
      pending: 0,
      success: 0,
      failure: 0,
      accuracy: 0,
      average_confidence: 0,
      by_type: {
        long: { total: 0, success: 0, accuracy: 0 },
        short: { total: 0, success: 0, accuracy: 0 },
        hold: { total: 0, success: 0, accuracy: 0 }
      }
    };
  }

  const pending = predictions.filter(p => p.actual_outcome === 'pending').length;
  const success = predictions.filter(p => p.actual_outcome === 'success').length;
  const failure = predictions.filter(p => p.actual_outcome === 'failure').length;
  const resolved = success + failure;
  const accuracy = resolved > 0 ? success / resolved : 0;
  const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

  // By prediction type
  const byType = {
    long: calculateTypeStats(predictions, 'long'),
    short: calculateTypeStats(predictions, 'short'),
    hold: calculateTypeStats(predictions, 'hold')
  };

  return {
    total: predictions.length,
    pending,
    success,
    failure,
    accuracy: Math.round(accuracy * 100) / 100,
    average_confidence: Math.round(avgConfidence * 100) / 100,
    by_type: byType
  };
}

/**
 * Calculate stats for specific prediction type
 */
function calculateTypeStats(predictions: any[], type: string) {
  const filtered = predictions.filter(p => p.prediction_type === type);
  if (filtered.length === 0) {
    return { total: 0, success: 0, accuracy: 0 };
  }

  const success = filtered.filter(p => p.actual_outcome === 'success').length;
  const resolved = filtered.filter(p => p.actual_outcome !== 'pending').length;
  const accuracy = resolved > 0 ? success / resolved : 0;

  return {
    total: filtered.length,
    success,
    accuracy: Math.round(accuracy * 100) / 100
  };
}

/**
 * OPTIONS handler (for CORS)
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
