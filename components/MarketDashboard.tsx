/**
 * Market Dashboard Component
 * Comprehensive overview of stocks, crypto, and market sentiment
 * Real-time data from Alpha Vantage and CoinGecko
 * 
 * @component MarketDashboard
 */

'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, Bitcoin, BarChart3, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface TopMover {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  type: 'stock' | 'crypto';
}

interface MarketData {
  timestamp: string;
  indices: MarketIndex[];
  stocks: {
    topGainers: TopMover[];
    topLosers: TopMover[];
    mostActive: TopMover[];
  };
  crypto: {
    totalMarketCap: number;
    btcDominance: number;
    ethDominance: number;
    topGainers: TopMover[];
    topLosers: TopMover[];
    trending: any[];
  };
  sentiment: {
    overall: 'bullish' | 'bearish' | 'neutral';
    score: number;
    description: string;
  };
}

export default function MarketDashboard() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMarketData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/data/market-summary');
      if (!res.ok) throw new Error('Failed to fetch market data');
      
      const data = await res.json();
      setMarketData(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err: any) {
      console.error('Market data fetch error:', err);
      setError(err.message || 'Failed to load market data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => fetchMarketData(true), 300000);
    
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number): string => {
    if (price >= 1000) return `$${(price / 1000).toFixed(2)}k`;
    return `$${price.toFixed(2)}`;
  };

  const formatLargeNumber = (num: number): string => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toFixed(0)}`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
            <div className="h-10 bg-slate-700 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !marketData) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-xl p-8 text-center">
        <Activity className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-400 mb-4">{error || 'Failed to load market data'}</p>
        <button
          onClick={() => fetchMarketData()}
          className="px-6 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { indices, stocks, crypto, sentiment } = marketData;

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Market Overview</h2>
          {lastUpdate && (
            <p className="text-sm text-slate-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={() => fetchMarketData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Market Sentiment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-xl border ${
          sentiment.overall === 'bullish'
            ? 'bg-green-900/20 border-green-700'
            : sentiment.overall === 'bearish'
            ? 'bg-red-900/20 border-red-700'
            : 'bg-slate-800/50 border-slate-700'
        }`}
      >
        <div className="flex items-center gap-4 mb-3">
          <div className={`p-3 rounded-lg ${
            sentiment.overall === 'bullish'
              ? 'bg-green-500/20'
              : sentiment.overall === 'bearish'
              ? 'bg-red-500/20'
              : 'bg-slate-700'
          }`}>
            {sentiment.overall === 'bullish' ? (
              <TrendingUp className="w-6 h-6 text-green-400" />
            ) : sentiment.overall === 'bearish' ? (
              <TrendingDown className="w-6 h-6 text-red-400" />
            ) : (
              <Activity className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white capitalize">
              {sentiment.overall} Market
            </h3>
            <p className="text-sm text-slate-400">Sentiment Score: {sentiment.score.toFixed(2)}</p>
          </div>
        </div>
        <p className="text-slate-300">{sentiment.description}</p>
      </motion.div>

      {/* Market Indices */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {indices.map((index, i) => (
          <motion.div
            key={index.symbol}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-slate-400 text-sm font-medium">{index.name}</h4>
              <BarChart3 className="w-5 h-5 text-slate-500" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-white mb-1">
                  {formatPrice(index.price)}
                </p>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  index.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {index.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>
                    {index.changePercent >= 0 ? '+' : ''}
                    {index.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Crypto Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-700/50 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-slate-400 text-sm font-medium">Total Crypto Market Cap</h4>
            <Bitcoin className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {formatLargeNumber(crypto.totalMarketCap)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-slate-400 text-sm font-medium">BTC Dominance</h4>
            <Bitcoin className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {crypto.btcDominance.toFixed(2)}%
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-slate-400 text-sm font-medium">ETH Dominance</h4>
            <DollarSign className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {crypto.ethDominance.toFixed(2)}%
          </p>
        </motion.div>
      </div>

      {/* Top Movers - Stocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Top Stock Gainers
          </h3>
          <div className="space-y-3">
            {stocks.topGainers.slice(0, 5).map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                <div>
                  <p className="font-bold text-white">{stock.symbol}</p>
                  <p className="text-sm text-slate-400">{formatPrice(stock.price)}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold">
                    +{stock.changePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            Top Stock Losers
          </h3>
          <div className="space-y-3">
            {stocks.topLosers.slice(0, 5).map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                <div>
                  <p className="font-bold text-white">{stock.symbol}</p>
                  <p className="text-sm text-slate-400">{formatPrice(stock.price)}</p>
                </div>
                <div className="text-right">
                  <p className="text-red-400 font-bold">
                    {stock.changePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Movers - Crypto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-900/10 to-emerald-900/10 border border-green-700/50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Bitcoin className="w-5 h-5 text-green-400" />
            Top Crypto Gainers
          </h3>
          <div className="space-y-3">
            {crypto.topGainers.slice(0, 5).map((coin) => (
              <div key={coin.symbol} className="flex items-center justify-between py-2 border-b border-green-900/20 last:border-0">
                <div>
                  <p className="font-bold text-white">{coin.symbol}</p>
                  <p className="text-sm text-slate-400">{coin.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold">
                    +{coin.changePercent.toFixed(2)}%
                  </p>
                  <p className="text-xs text-slate-500">{formatPrice(coin.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-900/10 to-rose-900/10 border border-red-700/50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Bitcoin className="w-5 h-5 text-red-400" />
            Top Crypto Losers
          </h3>
          <div className="space-y-3">
            {crypto.topLosers.slice(0, 5).map((coin) => (
              <div key={coin.symbol} className="flex items-center justify-between py-2 border-b border-red-900/20 last:border-0">
                <div>
                  <p className="font-bold text-white">{coin.symbol}</p>
                  <p className="text-sm text-slate-400">{coin.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-red-400 font-bold">
                    {coin.changePercent.toFixed(2)}%
                  </p>
                  <p className="text-xs text-slate-500">{formatPrice(coin.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
