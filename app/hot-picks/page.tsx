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
import { TrendingUp, TrendingDown, Clock, ChevronDown, ChevronUp, RefreshCw, Filter, Eye } from 'lucide-react';

interface StockPick {
  id: string;
  ticker: string;
  ai_name: string;
  reasoning: string;
  confidence: number;
  price: number; // Entry price
  current_price: number | null;
  target_price: number;
  timeframe: string;
  created_at: string;
  last_updated: string | null;
  upvotes: number;
  downvotes: number;
  ai_count?: number;
  actual_gain?: number;
  expected_gain?: number;
}

export default function HotPicksPage() {
  const [allPicks, setAllPicks] = useState<StockPick[]>([]);
  const [filteredPicks, setFilteredPicks] = useState<StockPick[]>([]);
  const [displayedPicks, setDisplayedPicks] = useState<StockPick[]>([]);
  const [aiFilter, setAiFilter] = useState('all');
  const [successFilter, setSuccessFilter] = useState('all'); // NEW: Success/Failure filter
  const [consensusFilter, setConsensusFilter] = useState('all'); // NEW: Filter by # of AIs
  const [sortBy, setSortBy] = useState('consensus');
  const [aiOptions, setAiOptions] = useState<string[]>(['all']);
  const [loading, setLoading] = useState(true);
  const [expandedPick, setExpandedPick] = useState<string | null>(null);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);
  const [showAll, setShowAll] = useState(false); // NEW: Show all or just 20
  const [limit] = useState(20);
  const supabase = createClientComponentClient();

  // Summary stats for top boxes
  const [stats, setStats] = useState({
    totalEntryValue: 0,
    totalCurrentValue: 0,
    totalTargetValue: 0,
    bestPick: null as StockPick | null,
    worstPick: null as StockPick | null
  });

  useEffect(() => {
    loadPicks();
    const interval = setInterval(loadPicks, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterAndSortPicks();
  }, [allPicks, aiFilter, successFilter, consensusFilter, sortBy]);

  useEffect(() => {
    // Update displayed picks based on showAll
    if (showAll) {
      setDisplayedPicks(filteredPicks);
    } else {
      setDisplayedPicks(filteredPicks.slice(0, limit));
    }
  }, [filteredPicks, showAll, limit]);

  useEffect(() => {
    // Calculate summary stats
    calculateStats();
  }, [allPicks]);

  const loadPicks = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_stock_picks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Calculate AI consensus count and gains for each ticker
        const tickerCounts: { [key: string]: number } = {};
        data.forEach(pick => {
          tickerCounts[pick.ticker] = (tickerCounts[pick.ticker] || 0) + 1;
        });

        const picksWithMetrics = data.map(pick => {
          const actualGain = pick.current_price && pick.price 
            ? ((pick.current_price - pick.price) / pick.price) * 100 
            : 0;
          const expectedGain = pick.target_price && pick.price
            ? ((pick.target_price - pick.price) / pick.price) * 100
            : 0;
          
          return {
            ...pick,
            ai_count: tickerCounts[pick.ticker] || 1,
            actual_gain: actualGain,
            expected_gain: expectedGain
          };
        });

        setAllPicks(picksWithMetrics);
        
        const unique = Array.from(new Set(data.map((d: any) => d.ai_name))) as string[];
        setAiOptions(['all', ...unique]);
        
        const recentUpdate = data
          .filter((p: any) => p.last_updated)
          .sort((a: any, b: any) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime())[0];
        
        if (recentUpdate?.last_updated) {
          setLastPriceUpdate(new Date(recentUpdate.last_updated));
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading picks:', error);
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (allPicks.length === 0) return;

    const totalEntry = allPicks.reduce((sum, pick) => sum + (pick.price || 0), 0);
    const totalCurrent = allPicks.reduce((sum, pick) => sum + (pick.current_price || pick.price || 0), 0);
    const totalTarget = allPicks.reduce((sum, pick) => sum + (pick.target_price || 0), 0);

    // Find best and worst performing picks
    const picksWithGains = allPicks
      .filter(p => p.current_price && p.price)
      .sort((a, b) => (b.actual_gain || 0) - (a.actual_gain || 0));

    setStats({
      totalEntryValue: totalEntry,
      totalCurrentValue: totalCurrent,
      totalTargetValue: totalTarget,
      bestPick: picksWithGains[0] || null,
      worstPick: picksWithGains[picksWithGains.length - 1] || null
    });
  };

  const filterAndSortPicks = () => {
    let filtered = [...allPicks];

    // Filter by AI
    if (aiFilter !== 'all') {
      filtered = filtered.filter(p => p.ai_name === aiFilter);
    }

    // Filter by Success/Failure
    if (successFilter === 'success') {
      filtered = filtered.filter(p => (p.actual_gain || 0) > 0);
    } else if (successFilter === 'failure') {
      filtered = filtered.filter(p => (p.actual_gain || 0) < 0);
    }

    // Filter by AI consensus
    if (consensusFilter !== 'all') {
      const count = parseInt(consensusFilter);
      filtered = filtered.filter(p => p.ai_count === count);
    }

    // Sort
    switch (sortBy) {
      case 'consensus':
        filtered.sort((a, b) => (b.ai_count || 0) - (a.ai_count || 0));
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'performance':
        filtered.sort((a, b) => (b.actual_gain || -999) - (a.actual_gain || -999));
        break;
      case 'confidence':
        filtered.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
        break;
      case 'expected':
        filtered.sort((a, b) => (b.expected_gain || 0) - (a.expected_gain || 0));
        break;
    }

    setFilteredPicks(filtered);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const toggleExpand = (pickId: string) => {
    setExpandedPick(expandedPick === pickId ? null : pickId);
  };

  const getAIColor = (aiName: string) => {
    const colors: { [key: string]: string } = {
      'Perplexity': 'bg-teal-100 text-teal-800 border-teal-200',
      'ChatGPT': 'bg-green-100 text-green-800 border-green-200',
      'Claude': 'bg-orange-100 text-orange-800 border-orange-200',
      'Gemini': 'bg-blue-100 text-blue-800 border-blue-200',
      'Grok': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[aiName] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getConsensusOptions = () => {
    const counts = new Set(allPicks.map(p => p.ai_count || 1));
    return ['all', ...Array.from(counts).sort((a, b) => b - a).map(String)];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading hot picks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🔥 Hot Picks</h1>
        <p className="text-gray-600">
          AI-powered stock recommendations with live 15-minute delayed pricing
        </p>
        {lastPriceUpdate && (
          <p className="text-sm text-gray-500 mt-1">
            <Clock className="w-4 h-4 inline mr-1" />
            Prices updated: {formatTime(lastPriceUpdate.toISOString())}
          </p>
        )}
      </div>

      {/* Summary Stats Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Entry Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${stats.totalEntryValue.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Sum of all entry prices</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Current Value (15min)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${stats.totalCurrentValue.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Current total value</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Target Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${stats.totalTargetValue.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">If all targets hit</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Best Pick</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.bestPick ? (
              <>
                <p className="text-xl font-bold text-green-700">{stats.bestPick.ticker}</p>
                <p className="text-lg font-semibold text-green-600">
                  +{stats.bestPick.actual_gain?.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-600 mt-1">Actual gain so far</p>
              </>
            ) : (
              <p className="text-sm text-gray-500">No data</p>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Worst Pick</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.worstPick ? (
              <>
                <p className="text-xl font-bold text-red-700">{stats.worstPick.ticker}</p>
                <p className="text-lg font-semibold text-red-600">
                  {stats.worstPick.actual_gain?.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-600 mt-1">Actual change so far</p>
              </>
            ) : (
              <p className="text-sm text-gray-500">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold">Filters & Sorting</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <label className="block text-sm font-medium mb-2">Success/Failure</label>
              <Select value={successFilter} onValueChange={setSuccessFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Picks</SelectItem>
                  <SelectItem value="success">✅ Successes (Gains)</SelectItem>
                  <SelectItem value="failure">❌ Failures (Losses)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">AI Consensus</label>
              <Select value={consensusFilter} onValueChange={setConsensusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getConsensusOptions().map(opt => (
                    <SelectItem key={opt} value={opt}>
                      {opt === 'all' ? 'All Consensus' : `${opt} AIs`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sort by</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consensus">AI Consensus</SelectItem>
                  <SelectItem value="performance">Actual Performance</SelectItem>
                  <SelectItem value="expected">Expected Gain</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="confidence">Highest Confidence</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={loadPicks} variant="outline" className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Prices
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count & Show All Button */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          Showing {displayedPicks.length} of {filteredPicks.length} picks
        </p>
        {filteredPicks.length > limit && (
          <Button 
            onClick={() => setShowAll(!showAll)}
            variant="outline"
            size="sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            {showAll ? 'Show First 20' : `See All ${filteredPicks.length}`}
          </Button>
        )}
      </div>

      {/* Stock Picks */}
      <div className="grid grid-cols-1 gap-4">
        {displayedPicks.map((pick) => {
          const isExpanded = expandedPick === pick.id;

          return (
            <Card 
              key={pick.id} 
              className="hover:shadow-lg transition-all cursor-pointer"
              onClick={() => toggleExpand(pick.id)}
            >
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                  {/* Ticker & AI Info */}
                  <div className="md:col-span-3">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-2xl font-bold">{pick.ticker}</h3>
                      {pick.ai_count && pick.ai_count > 1 && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          {pick.ai_count} AIs
                        </Badge>
                      )}
                    </div>
                    <Badge className={getAIColor(pick.ai_name)}>
                      {pick.ai_name}
                    </Badge>
                    <p className="text-xs text-gray-600 mt-2">
                      {formatTime(pick.created_at)}
                    </p>
                  </div>

                  {/* Entry Price */}
                  <div className="md:col-span-2 text-center">
                    <p className="text-xs text-gray-600 mb-1">Entry Price</p>
                    <p className="text-xl font-bold text-blue-600">${pick.price.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{new Date(pick.created_at).toLocaleDateString()}</p>
                  </div>

                  {/* Current Price */}
                  <div className="md:col-span-2 text-center">
                    <p className="text-xs text-gray-600 mb-1">Current Price</p>
                    {pick.current_price ? (
                      <>
                        <p className="text-xl font-bold">${pick.current_price.toFixed(2)}</p>
                        <div className={`flex items-center justify-center gap-1 ${(pick.actual_gain || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(pick.actual_gain || 0) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span className="text-sm font-semibold">
                            {(pick.actual_gain || 0) >= 0 ? '+' : ''}{pick.actual_gain?.toFixed(2)}%
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400">Loading...</p>
                    )}
                  </div>

                  {/* Target Price */}
                  <div className="md:col-span-2 text-center">
                    <p className="text-xs text-gray-600 mb-1">Target Price</p>
                    <p className="text-xl font-bold text-green-600">${pick.target_price.toFixed(2)}</p>
                    <p className="text-xs text-green-600">
                      +{pick.expected_gain?.toFixed(2)}% expected
                    </p>
                  </div>

                  {/* Confidence & Timeframe */}
                  <div className="md:col-span-2 text-center">
                    <p className="text-xs text-gray-600 mb-1">Confidence</p>
                    <p className="text-xl font-bold">{pick.confidence}%</p>
                    <p className="text-xs text-gray-500">{pick.timeframe || 'Medium-term'}</p>
                  </div>

                  {/* Expand Button */}
                  <div className="md:col-span-1 flex items-center justify-center">
                    <Button variant="ghost" size="sm">
                      {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                    </Button>
                  </div>
                </div>

                {/* Expandable Section */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t space-y-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <h4 className="font-semibold mb-2 text-lg">Why This Stock Was Picked:</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">{pick.reasoning}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 block mb-1">Pick Date:</span>
                        <p className="font-semibold">{new Date(pick.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1">Timeframe:</span>
                        <p className="font-semibold">{pick.timeframe || 'Medium-term'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1">Upvotes:</span>
                        <p className="font-semibold text-green-600">👍 {pick.upvotes || 0}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1">Downvotes:</span>
                        <p className="font-semibold text-red-600">👎 {pick.downvotes || 0}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm bg-white p-4 rounded">
                      <div className="text-center">
                        <p className="text-gray-600 mb-1">Entry → Current</p>
                        <p className={`text-lg font-bold ${(pick.actual_gain || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(pick.actual_gain || 0) >= 0 ? '+' : ''}{pick.actual_gain?.toFixed(2)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600 mb-1">Entry → Target</p>
                        <p className="text-lg font-bold text-blue-600">
                          +{pick.expected_gain?.toFixed(2)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600 mb-1">Current → Target</p>
                        <p className="text-lg font-bold text-purple-600">
                          +{(pick.current_price && pick.target_price 
                            ? ((pick.target_price - pick.current_price) / pick.current_price * 100)
                            : 0
                          ).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPicks.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No picks found with current filters</p>
            <Button 
              onClick={() => {
                setAiFilter('all');
                setSuccessFilter('all');
                setConsensusFilter('all');
              }}
              variant="outline"
              className="mt-4"
            >
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
