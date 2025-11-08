'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Trophy, Target, DollarSign, Percent } from 'lucide-react';

interface StockPick {
  id: string;
  ticker: string;
  ai_name: string;
  reasoning: string;
  confidence: number;
  price: number;
  current_price: number | null;
  target_price: number;
  timeframe: string;
  created_at: string;
  actual_gain?: number;
  expected_gain?: number;
}

interface AIStats {
  ai_name: string;
  total_picks: number;
  total_entry_value: number;
  total_current_value: number;
  total_target_value: number;
  avg_confidence: number;
  total_expected_gain: number;
  total_actual_gain: number;
  percent_off_target: number;
  picks: StockPick[];
}

export default function DashboardPage() {
  const [picks, setPicks] = useState<StockPick[]>([]);
  const [aiStats, setAiStats] = useState<AIStats[]>([]);
  const [expandedAI, setExpandedAI] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_stock_picks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const picksWithMetrics = data.map(pick => {
          const actualGain = pick.current_price && pick.price 
            ? ((pick.current_price - pick.price) / pick.price) * 100 
            : 0;
          const expectedGain = pick.target_price && pick.price
            ? ((pick.target_price - pick.price) / pick.price) * 100
            : 0;
          
          return {
            ...pick,
            actual_gain: actualGain,
            expected_gain: expectedGain
          };
        });

        setPicks(picksWithMetrics);
        calculateAIStats(picksWithMetrics);
        setLastUpdate(new Date());
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const calculateAIStats = (allPicks: StockPick[]) => {
    const aiMap = new Map<string, StockPick[]>();
    
    allPicks.forEach(pick => {
      if (!aiMap.has(pick.ai_name)) {
        aiMap.set(pick.ai_name, []);
      }
      aiMap.get(pick.ai_name)?.push(pick);
    });

    const stats: AIStats[] = [];
    
    aiMap.forEach((aiPicks, aiName) => {
      const totalEntry = aiPicks.reduce((sum, p) => sum + (p.price || 0), 0);
      const totalCurrent = aiPicks.reduce((sum, p) => sum + (p.current_price || p.price || 0), 0);
      const totalTarget = aiPicks.reduce((sum, p) => sum + (p.target_price || 0), 0);
      const avgConfidence = aiPicks.reduce((sum, p) => sum + (p.confidence || 0), 0) / aiPicks.length;
      const totalExpectedGain = ((totalTarget - totalEntry) / totalEntry) * 100;
      const totalActualGain = ((totalCurrent - totalEntry) / totalEntry) * 100;
      const percentOffTarget = totalTarget > 0 ? ((totalCurrent - totalTarget) / totalTarget) * 100 : 0;

      stats.push({
        ai_name: aiName,
        total_picks: aiPicks.length,
        total_entry_value: totalEntry,
        total_current_value: totalCurrent,
        total_target_value: totalTarget,
        avg_confidence: avgConfidence,
        total_expected_gain: totalExpectedGain,
        total_actual_gain: totalActualGain,
        percent_off_target: percentOffTarget,
        picks: aiPicks.sort((a, b) => (b.actual_gain || 0) - (a.actual_gain || 0))
      });
    });

    // Sort by total actual gain
    stats.sort((a, b) => b.total_actual_gain - a.total_actual_gain);
    setAiStats(stats);
  };

  const toggleAIExpand = (aiName: string) => {
    setExpandedAI(expandedAI === aiName ? null : aiName);
  };

  const getAIColor = (aiName: string) => {
    const colors: { [key: string]: string } = {
      'Perplexity': 'from-teal-500 to-teal-600',
      'ChatGPT': 'from-green-500 to-green-600',
      'Claude': 'from-orange-500 to-orange-600',
      'Gemini': 'from-blue-500 to-blue-600',
      'Grok': 'from-purple-500 to-purple-600',
      'Javari AI': 'from-yellow-500 to-yellow-600',
      'GPT-4': 'from-emerald-500 to-emerald-600'
    };
    return colors[aiName] || 'from-gray-500 to-gray-600';
  };

  const getAIIcon = (aiName: string) => {
    const icons: { [key: string]: string } = {
      'Perplexity': '⭐',
      'ChatGPT': '🤖',
      'Claude': '🔶',
      'Gemini': '⭐',
      'Grok': '⚡',
      'Javari AI': '🍊',
      'GPT-4': '🔵'
    };
    return icons[aiName] || '🤖';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🏆 AI Leaderboard</h1>
        <p className="text-gray-600">
          Real-time performance tracking of all AI stock pickers
        </p>
        {lastUpdate && (
          <p className="text-sm text-gray-500 mt-2">
            Updated {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* AI Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {aiStats.map((ai, index) => {
          const isExpanded = expandedAI === ai.ai_name;
          const isTop3 = index < 3;

          return (
            <Card 
              key={ai.ai_name}
              className={`relative overflow-hidden cursor-pointer transition-all hover:shadow-xl ${
                isExpanded ? 'col-span-full' : ''
              } ${isTop3 ? 'border-2 border-yellow-400' : ''}`}
              onClick={() => toggleAIExpand(ai.ai_name)}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${getAIColor(ai.ai_name)} opacity-10`}></div>
              
              {/* Top 3 Badge */}
              {isTop3 && (
                <div className="absolute top-2 right-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>
              )}

              <CardContent className="relative pt-6">
                {/* AI Header */}
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{getAIIcon(ai.ai_name)}</div>
                  <h3 className="text-xl font-bold mb-1">{ai.ai_name}</h3>
                  <Badge variant="secondary">Rank #{index + 1}</Badge>
                </div>

                {/* Main Performance Metric */}
                <div className="text-center mb-6 py-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Total Expected</p>
                  <div className={`text-3xl font-bold ${
                    ai.total_expected_gain >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {ai.total_expected_gain >= 0 ? '+' : ''}{ai.total_expected_gain.toFixed(1)}%
                  </div>
                </div>

                {/* Detailed Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-gray-600">Total Picks</p>
                    </div>
                    <p className="text-lg font-bold">{ai.total_picks}</p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <Percent className="w-4 h-4 text-purple-600" />
                      <p className="text-xs text-gray-600">Confidence</p>
                    </div>
                    <p className="text-lg font-bold">{ai.avg_confidence.toFixed(0)}%</p>
                  </div>

                  <div className="bg-blue-50 p-3 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-gray-600">Entry Value</p>
                    </div>
                    <p className="text-sm font-bold">{formatCurrency(ai.total_entry_value)}</p>
                  </div>

                  <div className="bg-green-50 p-3 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <p className="text-xs text-gray-600">Current Value</p>
                    </div>
                    <p className="text-sm font-bold">{formatCurrency(ai.total_current_value)}</p>
                  </div>

                  <div className="bg-purple-50 p-3 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-purple-600" />
                      <p className="text-xs text-gray-600">Target Value</p>
                    </div>
                    <p className="text-sm font-bold">{formatCurrency(ai.total_target_value)}</p>
                  </div>

                  <div className={`p-3 rounded ${
                    ai.percent_off_target >= 0 ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Percent className="w-4 h-4" />
                      <p className="text-xs text-gray-600">Off Target</p>
                    </div>
                    <p className={`text-sm font-bold ${
                      ai.percent_off_target >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {ai.percent_off_target.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Expand/Collapse Button */}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAIExpand(ai.ai_name);
                  }}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Hide Stock Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      View All {ai.total_picks} Stocks
                    </>
                  )}
                </Button>

                {/* Expanded Stock Details */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-bold text-lg mb-4">All Stock Picks by {ai.ai_name}</h4>
                    <div className="space-y-4">
                      {ai.picks.map((pick) => (
                        <Card key={pick.id} className="bg-gray-50">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h5 className="text-xl font-bold">{pick.ticker}</h5>
                                <p className="text-sm text-gray-600">
                                  {new Date(pick.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className={`text-lg font-bold ${
                                  (pick.actual_gain || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {(pick.actual_gain || 0) >= 0 ? '+' : ''}
                                  {pick.actual_gain?.toFixed(2)}%
                                </div>
                                <p className="text-xs text-gray-500">Current Performance</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                              <div>
                                <p className="text-gray-600">Entry</p>
                                <p className="font-semibold">{formatCurrency(pick.price)}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Current</p>
                                <p className="font-semibold">
                                  {pick.current_price ? formatCurrency(pick.current_price) : 'Loading...'}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Target</p>
                                <p className="font-semibold">{formatCurrency(pick.target_price)}</p>
                              </div>
                            </div>

                            <div className="bg-white p-3 rounded mb-3">
                              <p className="text-xs text-gray-600 mb-1">Why this was picked:</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{pick.reasoning}</p>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <div>
                                <span className="font-semibold">Confidence:</span> {pick.confidence}%
                              </div>
                              <div>
                                <span className="font-semibold">Timeframe:</span> {pick.timeframe || 'Medium-term'}
                              </div>
                              <div>
                                <span className="font-semibold">Expected:</span> +{pick.expected_gain?.toFixed(1)}%
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats Footer */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total AIs Tracking</p>
              <p className="text-2xl font-bold text-blue-600">{aiStats.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Stock Picks</p>
              <p className="text-2xl font-bold text-purple-600">{picks.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Best Performer</p>
              <p className="text-xl font-bold text-green-600">
                {aiStats[0]?.ai_name || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Confidence</p>
              <p className="text-2xl font-bold text-orange-600">
                {(aiStats.reduce((sum, ai) => sum + ai.avg_confidence, 0) / aiStats.length).toFixed(0)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
