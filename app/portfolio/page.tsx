'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, Target, Percent, Activity, Eye, EyeOff } from 'lucide-react';

interface Position {
  id: string;
  ticker: string;
  ai_name: string;
  shares: number;
  entry_price: number;
  current_price: number | null;
  target_price: number;
  entry_date: string;
  reasoning: string;
  confidence: number;
}

export default function PortfolioPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBox, setSelectedBox] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const [summary, setSummary] = useState({
    totalEntryValue: 0,
    totalCurrentValue: 0,
    totalTargetValue: 0,
    totalGainLoss: 0,
    totalGainLossPercent: 0,
    totalUnrealizedGain: 0,
    bestPosition: null as Position | null,
    worstPosition: null as Position | null,
  });

  useEffect(() => {
    loadPositions();
    const interval = setInterval(loadPositions, 300000);
    return () => clearInterval(interval);
  }, []);

  const loadPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('paper_trades')
        .select('*')
        .eq('status', 'open')
        .order('entry_date', { ascending: false });

      if (error) throw error;

      if (data) {
        setPositions(data as Position[]);
        calculateSummary(data as Position[]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading positions:', error);
      setLoading(false);
    }
  };

  const calculateSummary = (data: Position[]) => {
    const totalEntry = data.reduce((sum, p) => sum + (p.shares * p.entry_price), 0);
    const totalCurrent = data.reduce((sum, p) => sum + (p.shares * (p.current_price || p.entry_price)), 0);
    const totalTarget = data.reduce((sum, p) => sum + (p.shares * p.target_price), 0);
    const gainLoss = totalCurrent - totalEntry;
    const gainLossPercent = totalEntry > 0 ? (gainLoss / totalEntry) * 100 : 0;
    const unrealizedGain = totalTarget - totalCurrent;

    // Find best and worst positions
    const positionsWithGains = data
      .map(p => ({
        ...p,
        gain: p.current_price ? ((p.current_price - p.entry_price) / p.entry_price) * 100 : 0
      }))
      .sort((a, b) => b.gain - a.gain);

    setSummary({
      totalEntryValue: totalEntry,
      totalCurrentValue: totalCurrent,
      totalTargetValue: totalTarget,
      totalGainLoss: gainLoss,
      totalGainLossPercent: gainLossPercent,
      totalUnrealizedGain: unrealizedGain,
      bestPosition: positionsWithGains[0] || null,
      worstPosition: positionsWithGains[positionsWithGains.length - 1] || null,
    });
  };

  const toggleExpand = (positionId: string) => {
    setExpandedPosition(expandedPosition === positionId ? null : positionId);
  };

  const showBoxDetail = (boxType: string) => {
    setSelectedBox(selectedBox === boxType ? null : boxType);
  };

  const getPositionsForBox = (boxType: string) => {
    switch (boxType) {
      case 'entry':
        return positions.sort((a, b) => (b.shares * b.entry_price) - (a.shares * a.entry_price));
      case 'current':
        return positions.sort((a, b) => 
          (b.shares * (b.current_price || b.entry_price)) - (a.shares * (a.current_price || a.entry_price))
        );
      case 'target':
        return positions.sort((a, b) => (b.shares * b.target_price) - (a.shares * a.target_price));
      case 'gainers':
        return positions
          .filter(p => p.current_price && p.current_price > p.entry_price)
          .sort((a, b) => {
            const gainA = a.current_price ? ((a.current_price - a.entry_price) / a.entry_price) : 0;
            const gainB = b.current_price ? ((b.current_price - b.entry_price) / b.entry_price) : 0;
            return gainB - gainA;
          });
      case 'losers':
        return positions
          .filter(p => p.current_price && p.current_price < p.entry_price)
          .sort((a, b) => {
            const lossA = a.current_price ? ((a.current_price - a.entry_price) / a.entry_price) : 0;
            const lossB = b.current_price ? ((b.current_price - b.entry_price) / b.entry_price) : 0;
            return lossA - lossB;
          });
      default:
        return positions;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-pulse mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">💼 My Portfolio</h1>
        <p className="text-gray-600">Your paper trading positions with live performance tracking</p>
        <p className="text-sm text-gray-500 mt-1">Click any summary box for detailed breakdown</p>
      </div>

      {/* Summary Boxes - Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card 
          className="border-2 border-blue-200 hover:shadow-xl transition-all cursor-pointer"
          onClick={() => showBoxDetail('entry')}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Entry Value</CardTitle>
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">${summary.totalEntryValue.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Sum of all purchases</p>
            {selectedBox === 'entry' && <Eye className="w-4 h-4 text-blue-500 mt-2" />}
          </CardContent>
        </Card>

        <Card 
          className="border-2 border-green-200 hover:shadow-xl transition-all cursor-pointer"
          onClick={() => showBoxDetail('current')}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Current Value</CardTitle>
              <Activity className="w-5 h-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">${summary.totalCurrentValue.toFixed(2)}</p>
            <div className={`text-sm font-semibold mt-1 ${summary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.totalGainLoss >= 0 ? '+' : ''}${summary.totalGainLoss.toFixed(2)} 
              ({summary.totalGainLoss >= 0 ? '+' : ''}{summary.totalGainLossPercent.toFixed(2)}%)
            </div>
            {selectedBox === 'current' && <Eye className="w-4 h-4 text-green-500 mt-2" />}
          </CardContent>
        </Card>

        <Card 
          className="border-2 border-purple-200 hover:shadow-xl transition-all cursor-pointer"
          onClick={() => showBoxDetail('target')}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Target Value</CardTitle>
              <Target className="w-5 h-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">${summary.totalTargetValue.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Unrealized: ${summary.totalUnrealizedGain.toFixed(2)}</p>
            {selectedBox === 'target' && <Eye className="w-4 h-4 text-purple-500 mt-2" />}
          </CardContent>
        </Card>

        <Card 
          className="border-2 border-green-300 hover:shadow-xl transition-all cursor-pointer bg-green-50"
          onClick={() => showBoxDetail('gainers')}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-700">Best Position</CardTitle>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            {summary.bestPosition ? (
              <>
                <p className="text-xl font-bold text-green-700">{summary.bestPosition.ticker}</p>
                <p className="text-lg font-semibold text-green-600">
                  +{((summary.bestPosition.current_price! - summary.bestPosition.entry_price) / summary.bestPosition.entry_price * 100).toFixed(2)}%
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">No data</p>
            )}
            {selectedBox === 'gainers' && <Eye className="w-4 h-4 text-green-500 mt-2" />}
          </CardContent>
        </Card>

        <Card 
          className="border-2 border-red-300 hover:shadow-xl transition-all cursor-pointer bg-red-50"
          onClick={() => showBoxDetail('losers')}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-red-700">Worst Position</CardTitle>
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            {summary.worstPosition ? (
              <>
                <p className="text-xl font-bold text-red-700">{summary.worstPosition.ticker}</p>
                <p className="text-lg font-semibold text-red-600">
                  {((summary.worstPosition.current_price! - summary.worstPosition.entry_price) / summary.worstPosition.entry_price * 100).toFixed(2)}%
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">No data</p>
            )}
            {selectedBox === 'losers' && <Eye className="w-4 h-4 text-red-500 mt-2" />}
          </CardContent>
        </Card>
      </div>

      {/* Box Detail View */}
      {selectedBox && (
        <Card className="mb-8 border-2 border-blue-400">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {selectedBox === 'entry' && 'Entry Value Breakdown'}
                {selectedBox === 'current' && 'Current Value Breakdown'}
                {selectedBox === 'target' && 'Target Value Breakdown'}
                {selectedBox === 'gainers' && 'Top Gainers'}
                {selectedBox === 'losers' && 'Top Losers'}
              </CardTitle>
              <Button onClick={() => setSelectedBox(null)} variant="ghost" size="sm">
                <EyeOff className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getPositionsForBox(selectedBox).slice(0, 10).map(pos => {
                const entryValue = pos.shares * pos.entry_price;
                const currentValue = pos.shares * (pos.current_price || pos.entry_price);
                const targetValue = pos.shares * pos.target_price;
                const gain = pos.current_price ? ((pos.current_price - pos.entry_price) / pos.entry_price) * 100 : 0;

                return (
                  <div key={pos.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <span className="font-bold">{pos.ticker}</span>
                      <span className="text-sm text-gray-600 ml-2">({pos.shares} shares)</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {selectedBox === 'entry' && `$${entryValue.toFixed(2)}`}
                        {selectedBox === 'current' && `$${currentValue.toFixed(2)}`}
                        {selectedBox === 'target' && `$${targetValue.toFixed(2)}`}
                        {(selectedBox === 'gainers' || selectedBox === 'losers') && (
                          <span className={gain >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {gain >= 0 ? '+' : ''}{gain.toFixed(2)}%
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No open positions</p>
          ) : (
            <div className="space-y-4">
              {positions.map(position => {
                const entryValue = position.shares * position.entry_price;
                const currentValue = position.shares * (position.current_price || position.entry_price);
                const targetValue = position.shares * position.target_price;
                const gainLoss = currentValue - entryValue;
                const gainLossPercent = (gainLoss / entryValue) * 100;
                const isExpanded = expandedPosition === position.id;

                return (
                  <Card 
                    key={position.id}
                    className="hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => toggleExpand(position.id)}
                  >
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Ticker */}
                        <div className="md:col-span-2">
                          <h3 className="text-2xl font-bold">{position.ticker}</h3>
                          <p className="text-sm text-gray-600">{position.shares} shares</p>
                          <Badge className="mt-1 text-xs">{position.ai_name}</Badge>
                        </div>

                        {/* Entry Price */}
                        <div className="md:col-span-2 text-center">
                          <p className="text-xs text-gray-600 mb-1">Entry Price</p>
                          <p className="text-lg font-bold text-blue-600">${position.entry_price.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">${entryValue.toFixed(2)}</p>
                        </div>

                        {/* Current Price */}
                        <div className="md:col-span-2 text-center">
                          <p className="text-xs text-gray-600 mb-1">Current Price</p>
                          <p className="text-lg font-bold">
                            {position.current_price ? `$${position.current_price.toFixed(2)}` : 'Loading...'}
                          </p>
                          <p className="text-xs text-gray-500">${currentValue.toFixed(2)}</p>
                        </div>

                        {/* Target Price */}
                        <div className="md:col-span-2 text-center">
                          <p className="text-xs text-gray-600 mb-1">Target Price</p>
                          <p className="text-lg font-bold text-green-600">${position.target_price.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">${targetValue.toFixed(2)}</p>
                        </div>

                        {/* Gain/Loss */}
                        <div className="md:col-span-2 text-center">
                          <p className="text-xs text-gray-600 mb-1">Gain/Loss</p>
                          <p className={`text-lg font-bold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {gainLoss >= 0 ? '+' : ''}${gainLoss.toFixed(2)}
                          </p>
                          <p className={`text-sm font-semibold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
                          </p>
                        </div>

                        {/* Confidence */}
                        <div className="md:col-span-2 text-center">
                          <p className="text-xs text-gray-600 mb-1">AI Confidence</p>
                          <p className="text-lg font-bold">{position.confidence}%</p>
                          <p className="text-xs text-gray-500">
                            {new Date(position.entry_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">Position Details:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                              <span className="text-gray-600 block">Entry Date:</span>
                              <p className="font-semibold">{new Date(position.entry_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="text-gray-600 block">Entry Value:</span>
                              <p className="font-semibold">${entryValue.toFixed(2)}</p>
                            </div>
                            <div>
                              <span className="text-gray-600 block">Current Value:</span>
                              <p className="font-semibold">${currentValue.toFixed(2)}</p>
                            </div>
                            <div>
                              <span className="text-gray-600 block">Target Value:</span>
                              <p className="font-semibold">${targetValue.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <p className="text-xs font-semibold text-blue-900 mb-1">Why This Position:</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{position.reasoning}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
