/**
 * Trending Stocks & Cryptos Widget
 * Displays hot picks and trending assets
 * Combines data from Alpha Vantage and CoinGecko
 * 
 * @component TrendingWidget
 */

'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Flame, Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface TrendingStock {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  type: 'stock';
}

interface TrendingCrypto {
  id: string;
  symbol: string;
  name: string;
  marketCapRank: number;
  priceChange24h: number;
  image?: string;
  type: 'crypto';
}

export default function TrendingWidget() {
  const [trendingStocks, setTrendingStocks] = useState<TrendingStock[]>([]);
  const [trendingCrypto, setTrendingCrypto] = useState<TrendingCrypto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stocks' | 'crypto'>('stocks');

  const fetchTrending = async () => {
    setLoading(true);
    try {
      // Fetch market summary which includes top movers
      const summaryRes = await fetch('/api/data/market-summary');
      if (summaryRes.ok) {
        const summary = await summaryRes.json();
        
        // Get top gainers as trending
        setTrendingStocks(summary.stocks.topGainers.slice(0, 10));
      }

      // Fetch trending crypto
      const cryptoRes = await fetch('/api/data/crypto?function=trending');
      if (cryptoRes.ok) {
        const cryptoData = await cryptoRes.json();
        setTrendingCrypto(cryptoData.trending.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching trending:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchTrending, 300000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700 rounded w-1/2 mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentTrending = activeTab === 'stocks' ? trendingStocks : trendingCrypto;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Trending Now
          </h3>
          <Star className="w-5 h-5 text-yellow-500" />
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('stocks')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'stocks'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            📈 Stocks
          </button>
          <button
            onClick={() => setActiveTab('crypto')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'crypto'
                ? 'bg-purple-500 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            ₿ Crypto
          </button>
        </div>
      </div>

      {/* Trending List */}
      <div className="divide-y divide-slate-700">
        {currentTrending.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            No trending data available
          </div>
        ) : (
          currentTrending.map((item, index) => (
            <motion.div
              key={activeTab === 'stocks' ? item.symbol : item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 hover:bg-slate-700/30 transition-colors group cursor-pointer"
            >
              <Link
                href={activeTab === 'stocks' ? `/stock/${item.symbol}` : `/crypto/${item.id}`}
                className="flex items-center gap-3"
              >
                {/* Rank */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index < 3
                    ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {index + 1}
                </div>

                {/* Icon/Image */}
                {activeTab === 'crypto' && (item as TrendingCrypto).image ? (
                  <img
                    src={(item as TrendingCrypto).image}
                    alt={item.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activeTab === 'stocks'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    <span className="font-bold text-sm">
                      {item.symbol.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white group-hover:text-blue-400 transition-colors">
                      {item.symbol.toUpperCase()}
                    </p>
                    {activeTab === 'crypto' && (item as TrendingCrypto).marketCapRank && (
                      <span className="text-xs text-slate-500">
                        #{(item as TrendingCrypto).marketCapRank}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 truncate">{item.name}</p>
                </div>

                {/* Change */}
                <div className="flex-shrink-0 text-right">
                  {activeTab === 'stocks' ? (
                    <>
                      <div className={`flex items-center gap-1 font-bold text-sm ${
                        (item as TrendingStock).changePercent >= 0
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}>
                        {(item as TrendingStock).changePercent >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>
                          {(item as TrendingStock).changePercent >= 0 ? '+' : ''}
                          {(item as TrendingStock).changePercent.toFixed(2)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        ${(item as TrendingStock).price.toFixed(2)}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className={`flex items-center gap-1 font-bold text-sm ${
                        (item as TrendingCrypto).priceChange24h >= 0
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}>
                        {(item as TrendingCrypto).priceChange24h >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>
                          {(item as TrendingCrypto).priceChange24h >= 0 ? '+' : ''}
                          {(item as TrendingCrypto).priceChange24h.toFixed(2)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">24h change</p>
                    </>
                  )}
                </div>

                {/* Arrow */}
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </Link>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 bg-slate-900/50">
        <Link
          href={activeTab === 'stocks' ? '/hot-picks' : '/crypto'}
          className="flex items-center justify-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          <span>View all {activeTab}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
