'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, TrendingDown, DollarSign, Percent, Activity, ChevronDown, ChevronUp, Filter } from 'lucide-react';

interface BacktestResult {
  id: string;
  ticker: string;
  ai_name: string;
  entry_price: number;
  current_price: number | null;
  target_price: number;
  entry_date: string;
  exit_date: string | null;
  actual_return: number;
  expected_return: number;
  days_held: number;
  confidence: number;
  reasoning: string;
  status: 'open' | 'closed' | 'target_hit';
}

export default function BacktestingPage() {
  const [results, setResults] = useState<BacktestResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<BacktestResult[]>([]);
  const [aiFilter, setAiFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const [aiOptions, setAiOptions] = useState<string[]>(['all']);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  const [metrics, setMetrics] = useState({
    totalTrades: 0,
    winRate: 0,
    avgReturn: 0,
    totalProfit: 0,
    bestTrade: null as BacktestResult | null,
    worstTrade: null as BacktestResult | null,
    avgDaysHeld: 0,
    totalEntryValue: 0,
    totalCurrentValue: 0,
    totalTargetValue: 0,
  });

  useEffect(() => {
    loadBacktestResults();
  }, []);

  useEffect(() => {
    filterResults();
  }, [results, aiFilter, statusFilter, performanceFilter]);

  const loadBacktestResults = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_stock_picks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const processedResults = data.map((pick: any) => {
          const actualReturn = pick.current_price && pick.price
            ? ((pick.current_price - pick.price) / pick.price) * 100
            : 0;
          const expectedReturn = pick.target_price && pick.price
            ? ((pick.target_price - pick.price) / pick.price) * 100
            : 0;
          
          const entryDate = new Date(pick.created_at);
          const exitDate = pick.exit_date ? new Date(pick.exit_date) : new Date();
          const daysHeld = Math.floor((exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

          let status: 'open' | 'closed' | 'target_hit' = 'open';
          if (pick.current_price && pick.target_price && pick.current_price >= pick.target_price) {
            status = 'target_hit';
          } else if (pick.exit_date) {
            status = 'closed';
          }

          return {
            id: pick.id,
            ticker: pick.ticker,
            ai_name: pick.ai_name,
            entry_price: pick.price,
            current_price: pick.current_price,
            target_price: pick.target_price,
            entry_date: pick.created_at,
            exit_date: pick.exit_date,
            actual_return: actualReturn,
            expected_return: expectedReturn,
            days_held: daysHeld,
            confidence: pick.confidence,
            reasoning: pick.reasoning,
            status
          };
        });

        setResults(processedResults);
        calculateMetrics(processedResults);

        const unique = Array.from(new Set(data.map((d: any) => d.ai_name))) as string[];
        setAiOptions(['all', ...unique]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading backtest results:', error);
      setLoading(false);
    }
  };

  const calculateMetrics = (data: BacktestResult[]) => {
    const totalTrades = data.length;
    const winners = data.filter(r => r.actual_return > 0);
    const winRate = totalTrades > 0 ? (winners.length / totalTrades) * 100 : 0;
    const avgReturn = totalTrades > 0 
      ? data.reduce((sum, r) => sum + r.actual_return, 0) / totalTrades 
      : 0;
    
    const totalEntry = data.reduce((sum, r) => sum + r.entry_price, 0);
    const totalCurrent = data.reduce((sum, r) => sum + (r.current_price || r.entry_price), 0);
    const totalTarget = data.reduce((sum, r) => sum + r.target_price, 0);
    const totalProfit = totalCurrent - totalEntry;

    const avgDays = totalTrades > 0
      ? data.reduce((sum, r) => sum + r.days_held, 0) / totalTrades
      : 0;

    const sorted = [...data].sort((a, b) => b.actual_return - a.actual_return);

    setMetrics({
      totalTrades,
      winRate,
      avgReturn,
      totalProfit,
      bestTrade: sorted[0] || null,
      worstTrade: sorted[sorted.length - 1] || null,
      avgDaysHeld: avgDays,
      totalEntryValue: totalEntry,
      totalCurrentValue: totalCurrent,
      totalTargetValue: totalTarget,
    });
  };

  const filterResults = () => {
    let filtered = [...results];

    if (aiFilter !== 'all') {
      filtered = filtered.filter(r => r.ai_name === aiFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    if (performanceFilter === 'winners') {
      filtered = filtered.filter(r => r.actual_return > 0);
    } else if (performanceFilter === 'losers') {
      filtered = filtered.filter(r => r.actual_return < 0);
    } else if (performanceFilter === 'target_hit') {
      filtered = filtered.filter(r => r.status === 'target_hit');
    }

    setFilteredResults(filtered);
  };

  const toggleExpand = (resultId: string) => {
    setExpandedResult(expandedResult === resultId ? null : resultId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-pulse mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading backtest results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔍 Backtesting Analysis</h1>
        <p className="text-gray-600">Historical performance analysis of AI stock picks</p>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-2 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{metrics.totalTrades}</p>
            <p className="text-xs text-gray-500 mt-1">All AI picks analyzed</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{metrics.winRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">Profitable trades</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Return</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${metrics.avgReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.avgReturn >= 0 ? '+' : ''}{metrics.avgReturn.toFixed(2)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Across all trades</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${metrics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.totalProfit >= 0 ? '+' : ''}${metrics.totalProfit.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Net profit/loss</p>
          </CardContent>
        </Card>
      </div>

      {/* Profit Analysis */}
      <Card className="mb-8 border-2 border-blue-300">
        <CardHeader>
          <CardTitle>💰 Profit Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Entry Value</p>
              <p className="text-2xl font-bold text-blue-600">${metrics.totalEntryValue.toFixed(2)}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Current Value</p>
              <p className="text-2xl font-bold text-green-600">${metrics.totalCurrentValue.toFixed(2)}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Target Value</p>
              <p className="text-2xl font-bold text-purple-600">${metrics.totalTargetValue.toFixed(2)}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Avg Days Held</p>
              <p className="text-2xl font-bold text-orange-600">{metrics.avgDaysHeld.toFixed(0)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-green-100 rounded-lg border-2 border-green-300">
              <h4 className="font-semibold text-green-800 mb-2">🏆 Best Trade</h4>
              {metrics.bestTrade && (
                <>
                  <p className="text-xl font-bold">{metrics.bestTrade.ticker}</p>
                  <p className="text-lg text-green-700 font-semibold">
                    +{metrics.bestTrade.actual_return.toFixed(2)}%
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    ${metrics.bestTrade.entry_price.toFixed(2)} → ${metrics.bestTrade.current_price?.toFixed(2)}
                  </p>
                </>
              )}
            </div>

            <div className="p-4 bg-red-100 rounded-lg border-2 border-red-300">
              <h4 className="font-semibold text-red-800 mb-2">📉 Worst Trade</h4>
              {metrics.worstTrade && (
                <>
                  <p className="text-xl font-bold">{metrics.worstTrade.ticker}</p>
                  <p className="text-lg text-red-700 font-semibold">
                    {metrics.worstTrade.actual_return.toFixed(2)}%
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    ${metrics.worstTrade.entry_price.toFixed(2)} → ${metrics.worstTrade.current_price?.toFixed(2)}
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Filter by AI</label>
              <Select value={aiFilter} onValueChange={setAiFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aiOptions.map((ai: any) => (
                    <SelectItem key={ai} value={ai}>
                      {ai === 'all' ? 'All AIs' : ai}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open Positions</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="target_hit">Target Hit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Performance</label>
              <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Performance</SelectItem>
                  <SelectItem value="winners">Winners Only</SelectItem>
                  <SelectItem value="losers">Losers Only</SelectItem>
                  <SelectItem value="target_hit">Target Hit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Showing {filteredResults.length} of {results.length} trades
        </p>

        {filteredResults.map((result) => {
          const isExpanded = expandedResult === result.id;

          return (
            <Card 
              key={result.id}
              className="hover:shadow-lg transition-all cursor-pointer"
              onClick={() => toggleExpand(result.id)}
            >
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Ticker & Status */}
                  <div className="md:col-span-2">
                    <h3 className="text-2xl font-bold">{result.ticker}</h3>
                    <Badge className="mt-1">{result.ai_name}</Badge>
                    <Badge 
                      className="mt-1 ml-2"
                      variant={result.status === 'target_hit' ? 'default' : 'secondary'}
                    >
                      {result.status}
                    </Badge>
                  </div>

                  {/* Entry */}
                  <div className="md:col-span-2 text-center">
                    <p className="text-xs text-gray-600 mb-1">Entry Price</p>
                    <p className="text-lg font-bold text-blue-600">${result.entry_price.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(result.entry_date).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Current */}
                  <div className="md:col-span-2 text-center">
                    <p className="text-xs text-gray-600 mb-1">Current Price</p>
                    <p className="text-lg font-bold">
                      ${result.current_price?.toFixed(2) || 'N/A'}
                    </p>
                    <p className={`text-xs font-semibold ${result.actual_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {result.actual_return >= 0 ? '+' : ''}{result.actual_return.toFixed(2)}%
                    </p>
                  </div>

                  {/* Target */}
                  <div className="md:col-span-2 text-center">
                    <p className="text-xs text-gray-600 mb-1">Target Price</p>
                    <p className="text-lg font-bold text-green-600">${result.target_price.toFixed(2)}</p>
                    <p className="text-xs text-green-600">
                      +{result.expected_return.toFixed(2)}% expected
                    </p>
                  </div>

                  {/* Performance */}
                  <div className="md:col-span-2 text-center">
                    <p className="text-xs text-gray-600 mb-1">Performance</p>
                    <div className={`flex items-center justify-center gap-1 ${result.actual_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {result.actual_return >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      <span className="text-lg font-bold">
                        {result.actual_return >= 0 ? '+' : ''}{result.actual_return.toFixed(2)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{result.days_held} days</p>
                  </div>

                  {/* Expand */}
                  <div className="md:col-span-2 flex items-center justify-center">
                    <Button variant="ghost" size="sm">
                      {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t space-y-4 bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 bg-white rounded">
                        <p className="text-xs text-gray-600 mb-1">Entry → Current</p>
                        <p className={`text-lg font-bold ${result.actual_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {result.actual_return >= 0 ? '+' : ''}{result.actual_return.toFixed(2)}%
                        </p>
                      </div>
                      <div className="text-center p-3 bg-white rounded">
                        <p className="text-xs text-gray-600 mb-1">Entry → Target</p>
                        <p className="text-lg font-bold text-blue-600">
                          +{result.expected_return.toFixed(2)}%
                        </p>
                      </div>
                      <div className="text-center p-3 bg-white rounded">
                        <p className="text-xs text-gray-600 mb-1">Current → Target</p>
                        <p className="text-lg font-bold text-purple-600">
                          +{result.current_price && result.target_price 
                            ? ((result.target_price - result.current_price) / result.current_price * 100).toFixed(2)
                            : '0.00'
                          }%
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <p className="text-xs font-semibold text-blue-900 mb-1">AI Reasoning:</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{result.reasoning}</p>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-600">Confidence:</p>
                        <p className="font-semibold">{result.confidence}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Days Held:</p>
                        <p className="font-semibold">{result.days_held}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Status:</p>
                        <p className="font-semibold capitalize">{result.status.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">AI:</p>
                        <p className="font-semibold">{result.ai_name}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredResults.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No results found with current filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
