'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  BarChart3,
  Eye,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

interface StockPick {
  id: string;
  ticker: string;
  ai_name: string;
  price: number;
  current_price: number;
  target_price: number;
  confidence_score: number;
  reasoning: string;
  picked_at: string;
}

interface Indicator {
  name: string;
  value: string;
  status: 'bullish' | 'bearish' | 'neutral';
  description: string;
}

export default function InsightsPage() {
  const [picks, setPicks] = useState<StockPick[]>([]);
  const [selectedPick, setSelectedPick] = useState<StockPick | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAI, setSelectedAI] = useState<string>('all');
  const [showIndicators, setShowIndicators] = useState(false);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchPicks();
  }, [selectedAI]);

  async function fetchPicks() {
    try {
      let query = supabase
        .from('ai_stock_picks')
        .select('*')
        .not('current_price', 'is', null)
        .order('confidence_score', { ascending: false })
        .limit(20);

      if (selectedAI !== 'all') {
        query = query.eq('ai_name', selectedAI);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        const mappedData = data.map(pick => ({
          id: pick.id,
          ticker: pick.ticker.toUpperCase(),
          ai_name: pick.ai_name,
          price: pick.price,
          current_price: pick.current_price,
          target_price: pick.target_price,
          confidence_score: pick.confidence_score || 75,
          reasoning: pick.reasoning,
          picked_at: pick.picked_at
        }));
        setPicks(mappedData);
        setSelectedPick(mappedData[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching picks:', error);
      setLoading(false);
    }
  }

  const getIndicators = (pick: StockPick): Indicator[] => {
    const performance = ((pick.current_price - pick.price) / pick.price) * 100;
    const toTarget = ((pick.target_price - pick.current_price) / pick.current_price) * 100;
    
    return [
      {
        name: 'Current Performance',
        value: `${performance >= 0 ? '+' : ''}${performance.toFixed(2)}%`,
        status: performance > 5 ? 'bullish' : performance < -5 ? 'bearish' : 'neutral',
        description: performance > 0 ? 'Pick is currently profitable' : 'Pick is currently in the red'
      },
      {
        name: 'Distance to Target',
        value: `${toTarget.toFixed(2)}%`,
        status: toTarget > 10 ? 'bullish' : toTarget < 0 ? 'bearish' : 'neutral',
        description: `${toTarget.toFixed(2)}% away from AI target price`
      },
      {
        name: 'AI Confidence',
        value: `${pick.confidence_score}%`,
        status: pick.confidence_score >= 80 ? 'bullish' : pick.confidence_score >= 60 ? 'neutral' : 'bearish',
        description: pick.confidence_score >= 80 ? 'Very high confidence' : pick.confidence_score >= 60 ? 'Moderate confidence' : 'Lower confidence - higher risk'
      },
      {
        name: 'Risk/Reward Ratio',
        value: (toTarget / Math.abs(performance || 10)).toFixed(2),
        status: toTarget / Math.abs(performance || 10) > 2 ? 'bullish' : 'neutral',
        description: 'Potential reward vs current risk'
      },
      {
        name: 'Entry vs Current',
        value: `$${pick.price.toFixed(2)} → $${pick.current_price.toFixed(2)}`,
        status: pick.current_price > pick.price ? 'bullish' : 'bearish',
        description: 'Price movement since AI picked'
      },
      {
        name: 'Target Potential',
        value: `$${pick.current_price.toFixed(2)} → $${pick.target_price.toFixed(2)}`,
        status: 'bullish',
        description: 'Expected price movement to target'
      }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Brain className="w-12 h-12 animate-pulse mx-auto mb-4 text-purple-400" />
          <p className="text-gray-300">Loading AI insights...</p>
        </div>
      </div>
    );
  }

  if (!selectedPick) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
          <p className="text-xl text-gray-300">No picks available</p>
        </div>
      </div>
    );
  }

  const performance = ((selectedPick.current_price - selectedPick.price) / selectedPick.price) * 100;
  const toTarget = ((selectedPick.target_price - selectedPick.current_price) / selectedPick.current_price) * 100;
  const indicators = getIndicators(selectedPick);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
          💡 AI Insights
        </h1>
        <p className="text-xl text-gray-300 mb-2">
          See exactly how AIs think - Full transparency, zero black boxes
        </p>
        <p className="text-gray-400">
          Understanding WHY an AI picked a stock is just as important as the pick itself 🔍
        </p>
      </div>

      {/* Why Transparency Matters */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30 mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-6 text-white">🔒 Why AI Transparency Matters</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-bold text-white mb-2">Build Trust</h3>
              <p className="text-sm text-gray-300">
                See the logic behind every pick. No mysterious "trust us" vibes. You decide if it makes sense!
              </p>
            </div>
            <div>
              <div className="text-4xl mb-3">📚</div>
              <h3 className="font-bold text-white mb-2">Learn Faster</h3>
              <p className="text-sm text-gray-300">
                Understanding AI reasoning helps you learn professional investment strategies.
              </p>
            </div>
            <div>
              <div className="text-4xl mb-3">⚖️</div>
              <h3 className="font-bold text-white mb-2">Make Better Calls</h3>
              <p className="text-sm text-gray-300">
                When you know WHY, you can combine AI insights with your own research.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Filter */}
      <div className="mb-6">
        <Label className="text-gray-300 mb-2 block">Filter by AI Model</Label>
        <Select value={selectedAI} onValueChange={setSelectedAI}>
          <SelectTrigger className="w-64 bg-slate-800/50 border-gray-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All AI Models</SelectItem>
            <SelectItem value="GPT-4">GPT-4</SelectItem>
            <SelectItem value="Claude">Claude</SelectItem>
            <SelectItem value="Gemini">Gemini</SelectItem>
            <SelectItem value="Perplexity">Perplexity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Pick Selection */}
        <div className="md:col-span-1">
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white">Select a Pick</CardTitle>
              <CardDescription>Click to view detailed insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
              {picks.map((pick) => {
                const pickPerf = ((pick.current_price - pick.price) / pick.price) * 100;
                return (
                  <div
                    key={pick.id}
                    onClick={() => setSelectedPick(pick)}
                    className={`cursor-pointer p-4 rounded-lg transition-all ${
                      selectedPick?.id === pick.id
                        ? 'bg-purple-500/30 border-2 border-purple-400'
                        : 'bg-slate-900/50 border-2 border-transparent hover:border-purple-500/30'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-bold text-white">{pick.ticker}</span>
                      <Badge variant="outline" className={`${pickPerf >= 0 ? 'text-green-400 border-green-500/30' : 'text-red-400 border-red-500/30'}`}>
                        {pickPerf >= 0 ? '+' : ''}{pickPerf.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{pick.ai_name}</span>
                      <span className="text-purple-300">{pick.confidence_score}% confidence</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Insights */}
        <div className="md:col-span-2 space-y-6">
          {/* Summary Card */}
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-4xl font-bold text-white mb-2">{selectedPick.ticker}</div>
                  <Badge variant="outline" className="text-purple-300 border-purple-500/30">
                    {selectedPick.ai_name}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${performance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {performance >= 0 ? '+' : ''}{performance.toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-400">Current Performance</div>
                </div>
              </div>

              {/* Entry | Current | Target */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900/50 rounded-lg p-4 border border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">Entry Price</div>
                  <div className="text-2xl font-bold text-gray-300">${selectedPick.price.toFixed(2)}</div>
                  <div className="text-xs text-gray-500 mt-1">When AI picked</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-blue-500/30">
                  <div className="text-xs text-gray-400 mb-1">Current Price</div>
                  <div className="text-2xl font-bold text-blue-400">${selectedPick.current_price.toFixed(2)}</div>
                  <div className="text-xs text-gray-500 mt-1">Live (15min delay)</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-green-500/30">
                  <div className="text-xs text-gray-400 mb-1">Target Price</div>
                  <div className="text-2xl font-bold text-green-400">${selectedPick.target_price.toFixed(2)}</div>
                  <div className="text-xs text-gray-500 mt-1">AI expects: +{toTarget.toFixed(1)}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Indicators */}
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <BarChart3 className="w-5 h-5" />
                    Available Indicators
                  </CardTitle>
                  <CardDescription>Technical and AI-specific metrics</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowIndicators(!showIndicators)}
                  className="border-purple-500/30"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showIndicators ? 'Hide' : 'Show All'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showIndicators ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {indicators.map((indicator, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        indicator.status === 'bullish'
                          ? 'bg-green-500/10 border-green-500/30'
                          : indicator.status === 'bearish'
                          ? 'bg-red-500/10 border-red-500/30'
                          : 'bg-blue-500/10 border-blue-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white">{indicator.name}</span>
                        {indicator.status === 'bullish' ? (
                          <TrendingUp className="w-5 h-5 text-green-400" />
                        ) : indicator.status === 'bearish' ? (
                          <TrendingDown className="w-5 h-5 text-red-400" />
                        ) : (
                          <Target className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <div className={`text-2xl font-bold mb-2 ${
                        indicator.status === 'bullish' ? 'text-green-400' : 
                        indicator.status === 'bearish' ? 'text-red-400' : 
                        'text-blue-400'
                      }`}>
                        {indicator.value}
                      </div>
                      <div className="text-sm text-gray-400">{indicator.description}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Eye className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">Click "Show All" to view {indicators.length} indicators</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Reasoning */}
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Brain className="w-5 h-5" />
                AI Reasoning
              </CardTitle>
              <CardDescription>Why {selectedPick.ai_name} picked {selectedPick.ticker}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-900/50 rounded-lg p-6 border-l-4 border-purple-500">
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedPick.reasoning}</p>
              </div>
            </CardContent>
          </Card>

          {/* Plain English Explanation */}
          <Card className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Lightbulb className="w-5 h-5" />
                What This Means (Plain English)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-bold text-white mb-2 flex items-center gap-2">
                  🎯 The Play:
                </div>
                <p className="text-gray-300">
                  {selectedPick.ai_name} thinks {selectedPick.ticker} is {performance >= 0 ? 'performing well and' : 'undervalued right now and'} expects the price to {performance >= 0 ? 'continue rising' : 'jump'} from ${selectedPick.price.toFixed(2)} to ${selectedPick.target_price.toFixed(2)} (a {toTarget.toFixed(1)}% gain from current price).
                </p>
              </div>
              <div>
                <div className="font-bold text-white mb-2 flex items-center gap-2">
                  💪 Confidence Level:
                </div>
                <p className="text-gray-300">
                  {selectedPick.confidence_score >= 80
                    ? '🔥 VERY HIGH - This is a strong conviction pick. The AI really believes in this one!'
                    : selectedPick.confidence_score >= 60
                    ? '✅ MODERATE - Good pick, but not the AI\'s highest confidence. Proceed with caution.'
                    : '⚠️ LOWER - This is more speculative. Higher risk, higher reward potential.'}
                </p>
              </div>
              <div>
                <div className="font-bold text-white mb-2 flex items-center gap-2">
                  ⚠️ Should You Follow It?
                </div>
                <p className="text-gray-300">
                  {selectedPick.confidence_score >= 80
                    ? '✅ This is worth serious consideration! High confidence + solid reasoning = strong play. Still do your own research.'
                    : selectedPick.confidence_score >= 60
                    ? '🤔 Maybe! Use this as a starting point and do your own research. Don\'t blindly follow any AI.'
                    : '❌ Probably not unless you really understand the sector and agree with the reasoning. This is a riskier play.'}
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="font-bold text-white mb-2 flex items-center gap-2">
                  📊 Current Status:
                </div>
                <p className="text-gray-300">
                  {performance > 5
                    ? `✅ This pick is UP ${performance.toFixed(2)}% since the AI picked it. The AI got this one right so far!`
                    : performance > 0
                    ? `📈 This pick is slightly UP ${performance.toFixed(2)}%. Early days, but looking good.`
                    : performance > -5
                    ? `📉 This pick is slightly DOWN ${Math.abs(performance).toFixed(2)}%. Could recover - time will tell.`
                    : `❌ This pick is DOWN ${Math.abs(performance).toFixed(2)}%. The AI missed this one (so far).`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
