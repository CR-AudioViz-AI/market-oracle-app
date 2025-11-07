'use client';

import { useState, useEffect } from 'react';
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
import { TrendingUp, TrendingDown, Clock, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

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
  last_updated: string | null;
  upvotes: number;
  downvotes: number;
  ai_count?: number;
}

export default function HotPicksPage() {
  const [picks, setPicks] = useState<StockPick[]>([]);
  const [filteredPicks, setFilteredPicks] = useState<StockPick[]>([]);
  const [aiFilter, setAiFilter] = useState('all');
  const [sortBy, setSortBy] = useState('consensus'); // NEW: Default to consensus
  const [aiOptions, setAiOptions] = useState<string[]>(['all']);
  const [loading, setLoading] = useState(true);
  const [expandedPick, setExpandedPick] = useState<string | null>(null);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadPicks();
    // Refresh prices every 5 minutes
    const interval = setInterval(loadPicks, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterAndSortPicks();
  }, [picks, aiFilter, sortBy]);

  const loadPicks = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_stock_picks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Calculate AI consensus count for each ticker
        const tickerCounts: { [key: string]: number } = {};
        data.forEach(pick => {
          tickerCounts[pick.ticker] = (tickerCounts[pick.ticker] || 0) + 1;
        });

        // Add ai_count to each pick
        const picksWithConsensus = data.map(pick => ({
          ...pick,
          ai_count: tickerCounts[pick.ticker] || 1
        }));

        setPicks(picksWithConsensus);
        
        // Extract unique AI names
        const unique = Array.from(new Set(data.map((d: any) => d.ai_name))) as string[];
        setAiOptions(['all', ...unique]);
        
        // Get most recent price update time
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

  const filterAndSortPicks = () => {
    let filtered = [...picks];

    // Filter by AI
    if (aiFilter !== 'all') {
      filtered = filtered.filter(p => p.ai_name === aiFilter);
    }

    // Sort
    switch (sortBy) {
      case 'consensus':
        // Sort by AI count (most AIs picking it first)
        filtered.sort((a, b) => (b.ai_count || 0) - (a.ai_count || 0));
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'performance':
        filtered.sort((a, b) => {
          const perfA = a.current_price && a.price ? ((a.current_price - a.price) / a.price) * 100 : -999;
          const perfB = b.current_price && b.price ? ((b.current_price - b.price) / b.price) * 100 : -999;
          return perfB - perfA;
        });
        break;
      case 'confidence':
        filtered.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
        break;
    }

    setFilteredPicks(filtered);
  };

  const calculatePerformance = (pick: StockPick) => {
    if (!pick.current_price || !pick.price) return null;
    return ((pick.current_price - pick.price) / pick.price) * 100;
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🔥 Hot Picks</h1>
        <p className="text-gray-600">
          AI-powered stock recommendations with live price tracking
        </p>
        {lastPriceUpdate && (
          <p className="text-sm text-gray-500 mt-1">
            <Clock className="w-4 h-4 inline mr-1" />
            Prices updated: {formatTime(lastPriceUpdate.toISOString())}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
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

        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Sort by</label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consensus">AI Consensus (5 AIs, 4 AIs, etc)</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="performance">Best Performance</SelectItem>
              <SelectItem value="confidence">Highest Confidence</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button onClick={loadPicks} variant="outline" className="w-full sm:w-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Prices
          </Button>
        </div>
      </div>

      {/* Stock Picks */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPicks.map((pick) => {
          const performance = calculatePerformance(pick);
          const isExpanded = expandedPick === pick.id;

          return (
            <Card 
              key={pick.id} 
              className="hover:shadow-lg transition-all cursor-pointer"
              onClick={() => toggleExpand(pick.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold">{pick.ticker}</h3>
                      <Badge className={getAIColor(pick.ai_name)}>
                        {pick.ai_name}
                      </Badge>
                      {pick.ai_count && pick.ai_count > 1 && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          {pick.ai_count} AIs picked this
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatTime(pick.created_at)} • {pick.timeframe || 'Medium-term'}
                    </p>
                  </div>

                  <div className="text-right">
                    {pick.current_price ? (
                      <>
                        <p className="text-2xl font-bold">${pick.current_price.toFixed(2)}</p>
                        {performance !== null && (
                          <div className={`flex items-center justify-end gap-1 ${performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {performance >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            <span className="font-semibold">
                              {performance >= 0 ? '+' : ''}{performance.toFixed(2)}%
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xl font-bold text-gray-400">Price loading...</p>
                    )}
                  </div>
                </div>

                {/* Expandable Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Entry:</span>
                        <span className="font-semibold ml-1">${pick.price.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Target:</span>
                        <span className="font-semibold ml-1">${pick.target_price.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Confidence:</span>
                        <span className="font-semibold ml-1">{pick.confidence}%</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <h4 className="font-semibold mb-2">AI Reasoning:</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">{pick.reasoning}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Pick Date:</span>
                          <p className="font-semibold">{new Date(pick.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Timeframe:</span>
                          <p className="font-semibold">{pick.timeframe || 'Medium-term'}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-green-600">
                          👍 {pick.upvotes || 0} upvotes
                        </Badge>
                        <Badge variant="outline" className="text-red-600">
                          👎 {pick.downvotes || 0} downvotes
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPicks.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No picks found with current filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
