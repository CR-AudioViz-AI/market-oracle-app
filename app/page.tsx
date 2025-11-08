'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Target, DollarSign, Percent, Activity } from 'lucide-react';
import Link from 'next/link';

interface StockPick {
  id: string;
  ticker: string;
  ai_name: string;
  reasoning: string;
  confidence: number;
  price: number;
  current_price: number | null;
  target_price: number;
  created_at: string;
}

interface AIStats {
  ai_name: string;
  total_picks: number;
  avg_confidence: number;
  total_expected_return: number;
  total_entry_value: number;
  total_current_value: number;
  total_target_value: number;
  percent_to_target: number;
  picks: StockPick[];
}

export default function DashboardPage() {
  const [picks, setPicks] = useState<StockPick[]>([]);
  const [aiStats, setAiStats] = useState<AIStats[]>([]);
  const [expandedAI, setExpandedAI] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [portfolioStats, setPortfolioStats] = useState({
    totalEntryValue: 0,
    totalCurrentValue: 0,
    totalTargetValue: 0,
    totalExpectedReturn: 0
  });
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 300000);
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
        setPicks(data);
        calculateAIStats(data);
        calculatePortfolioStats(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const calculatePortfolioStats = (data: StockPick[]) => {
    const totalEntry = data.reduce((sum, pick) => sum + (pick.price || 0), 0);
    const totalCurrent = data.reduce((sum, pick) => sum + (pick.current_price || pick.price || 0), 0);
    const totalTarget = data.reduce((sum, pick) => sum + (pick.target_price || 0), 0);
    const expectedReturn = totalTarget > 0 ? ((totalTarget - totalEntry) / totalEntry) * 100 : 0;

    setPortfolioStats({
      totalEntryValue: totalEntry,
      totalCurrentValue: totalCurrent,
      totalTargetValue: totalTarget,
      totalExpectedReturn: expectedReturn
    });
  };

  const calculateAIStats = (data: StockPick[]) => {
    const aiGroups: { [key: string]: StockPick[] } = {};

    data.forEach(pick => {
      if (!aiGroups[pick.ai_name]) {
        aiGroups[pick.ai_name] = [];
      }
      aiGroups[pick.ai_name].push(pick);
    });

    const stats: AIStats[] = Object.keys(aiGroups).map(aiName => {
      const aiPicks = aiGroups[aiName];
      const totalPicks = aiPicks.length;
      const avgConfidence = aiPicks.reduce((sum, p) => sum + (p.confidence || 0), 0) / totalPicks;
      
      const totalEntry = aiPicks.reduce((sum, p) => sum + (p.price || 0), 0);
      const totalCurrent = aiPicks.reduce((sum, p) => sum + (p.current_price || p.price || 0), 0);
      const totalTarget = aiPicks.reduce((sum, p) => sum + (p.target_price || 0), 0);
      
      const expectedReturn = totalEntry > 0 ? ((totalTarget - totalEntry) / totalEntry) * 100 : 0;
      const percentToTarget = totalCurrent > 0 ? ((totalCurrent - totalEntry) / (totalTarget - totalEntry)) * 100 : 0;

      return {
        ai_name: aiName,
        total_picks: totalPicks,
        avg_confidence: avgConfidence,
        total_expected_return: expectedReturn,
        total_entry_value: totalEntry,
        total_current_value: totalCurrent,
        total_target_value: totalTarget,
        percent_to_target: percentToTarget,
        picks: aiPicks
      };
    });

    stats.sort((a, b) => b.total_expected_return - a.total_expected_return);
    setAiStats(stats);
  };

  const toggleAIExpand = (aiName: string) => {
    setExpandedAI(expandedAI === aiName ? null : aiName);
  };

  const getAIColor = (aiName: string) => {
    const colors: { [key: string]: string } = {
      'Javari AI': 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50',
      'GPT-4': 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50',
      'Claude': 'border-red-400 bg-gradient-to-br from-red-50 to-pink-50',
      'Perplexity': 'border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50',
      'Gemini': 'border-cyan-400 bg-gradient-to-br from-cyan-50 to-blue-50'
    };
    return colors[aiName] || 'border-gray-400 bg-gray-50';
  };

  const getAIEmoji = (aiName: string) => {
    const emojis: { [key: string]: string } = {
      'Javari AI': '🥇',
      'GPT-4': '🥈',
      'Claude': '🥉',
      'Perplexity': '⭐',
      'Gemini': '⭐'
    };
    return emojis[aiName] || '🤖';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-pulse mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-20">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">📊 Market Oracle Dashboard</h1>
        <p className="text-gray-600">AI-powered stock picks performance overview</p>
        <p className="text-sm text-gray-500 mt-1">Updated 30s ago</p>
      </div>

      {/* Portfolio Summary Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-2 border-blue-200 hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Entry Value</CardTitle>
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              ${portfolioStats.totalEntryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-gray-500 mt-2">Sum of all entry prices</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Current Value</CardTitle>
              <Activity className="w-5 h-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              ${portfolioStats.totalCurrentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-gray-500 mt-2">15-minute delayed pricing</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Target Value</CardTitle>
              <Target className="w-5 h-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">
              ${portfolioStats.totalTargetValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-gray-500 mt-2">If all targets hit</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Expected Return</CardTitle>
              <Percent className="w-5 h-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              +{portfolioStats.totalExpectedReturn.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-2">Portfolio-wide target</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Leaderboard */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              🏆 AI Leaderboard
            </h2>
            <p className="text-sm text-gray-600 mt-1">Click any AI to see all their stock picks</p>
          </div>
          <p className="text-sm text-gray-500">Sorted by expected return</p>
        </div>

        {/* AI Cards Grid - 4 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {aiStats.map((ai, index) => {
            const isExpanded = expandedAI === ai.ai_name;
            
            return (
              <div key={ai.ai_name}>
                <Card 
                  className={`${getAIColor(ai.ai_name)} border-2 hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-1`}
                  onClick={() => toggleAIExpand(ai.ai_name)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">{getAIEmoji(ai.ai_name)}</span>
                      <Badge variant="secondary" className="text-xs">
                        Rank #{index + 1}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-bold">{ai.ai_name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-4">
                      <div className="text-center py-3 bg-white rounded-lg">
                        <p className="text-3xl font-bold text-green-600">
                          +{ai.total_expected_return.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-600 mt-1">Total Expected</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-white p-2 rounded">
                          <p className="text-xs text-gray-600">Picks</p>
                          <p className="font-bold">{ai.total_picks}</p>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <p className="text-xs text-gray-600">Confidence</p>
                          <p className="font-bold">{ai.avg_confidence.toFixed(0)}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="text-gray-600">Total Purchased:</span>
                        <span className="font-semibold">${ai.total_entry_value.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="text-gray-600">Worth Now:</span>
                        <span className="font-semibold">${ai.total_current_value.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="text-gray-600">Target Worth:</span>
                        <span className="font-semibold">${ai.total_target_value.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                        <span className="text-gray-600">% to Target:</span>
                        <span className="font-bold text-green-700">{ai.percent_to_target.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="mt-4 text-center">
                      <Button variant="ghost" size="sm" className="w-full">
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-2" />
                            Hide Stocks
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            See All {ai.total_picks} Stocks
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {isExpanded && (
                  <Card className="mt-4 border-2 border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg">All {ai.ai_name} Picks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {ai.picks.map(pick => {
                          const actualGain = pick.current_price && pick.price 
                            ? ((pick.current_price - pick.price) / pick.price) * 100 
                            : 0;
                          const expectedGain = pick.target_price && pick.price
                            ? ((pick.target_price - pick.price) / pick.price) * 100
                            : 0;

                          return (
                            <div key={pick.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="text-lg font-bold">{pick.ticker}</h4>
                                  <p className="text-xs text-gray-500">
                                    {new Date(pick.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge variant="outline">
                                  {pick.confidence}% confident
                                </Badge>
                              </div>

                              <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                                <div className="text-center p-2 bg-white rounded">
                                  <p className="text-xs text-gray-600 mb-1">Entry</p>
                                  <p className="font-bold">${pick.price.toFixed(2)}</p>
                                </div>
                                <div className="text-center p-2 bg-white rounded">
                                  <p className="text-xs text-gray-600 mb-1">Current</p>
                                  <p className="font-bold">
                                    {pick.current_price ? `$${pick.current_price.toFixed(2)}` : 'Loading...'}
                                  </p>
                                  {pick.current_price && (
                                    <p className={`text-xs font-semibold ${actualGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {actualGain >= 0 ? '+' : ''}{actualGain.toFixed(1)}%
                                    </p>
                                  )}
                                </div>
                                <div className="text-center p-2 bg-white rounded">
                                  <p className="text-xs text-gray-600 mb-1">Target</p>
                                  <p className="font-bold text-green-600">${pick.target_price.toFixed(2)}</p>
                                  <p className="text-xs font-semibold text-green-600">
                                    +{expectedGain.toFixed(1)}%
                                  </p>
                                </div>
                              </div>

                              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                <p className="text-xs font-semibold text-blue-900 mb-1">Why Picked:</p>
                                <p className="text-xs text-gray-700 leading-relaxed">{pick.reasoning}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions - removed duplicate header buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/hot-picks">
          <Card className="hover:shadow-xl transition-all cursor-pointer border-2 border-orange-200">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl mb-3">🔥</div>
              <h3 className="text-xl font-bold mb-2">Hot Picks</h3>
              <p className="text-sm text-gray-600">View all AI recommendations</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/paper-trading">
          <Card className="hover:shadow-xl transition-all cursor-pointer border-2 border-blue-200">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl mb-3">📈</div>
              <h3 className="text-xl font-bold mb-2">Paper Trading</h3>
              <p className="text-sm text-gray-600">Test strategies risk-free</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/backtesting">
          <Card className="hover:shadow-xl transition-all cursor-pointer border-2 border-purple-200">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-xl font-bold mb-2">Backtesting</h3>
              <p className="text-sm text-gray-600">Analyze historical performance</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
