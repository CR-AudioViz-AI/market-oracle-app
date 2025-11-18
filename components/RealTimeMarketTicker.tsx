/**
 * Real-Time Market Ticker Component
 * Displays scrolling ticker of stocks and crypto prices
 * Updates every 60 seconds
 * 
 * @component RealTimeMarketTicker
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'stock' | 'crypto';
}

export default function RealTimeMarketTicker() {
  const [tickerData, setTickerData] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Popular symbols to track
  const symbols = {
    stocks: ['SPY', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA'],
    crypto: ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'cardano']
  };

  const fetchTickerData = async () => {
    try {
      // Fetch stock data
      const stockPromises = symbols.stocks.map(async (symbol) => {
        try {
          const res = await fetch(`/api/data/stocks?symbol=${symbol}&function=GLOBAL_QUOTE`);
          if (!res.ok) throw new Error('Failed to fetch');
          const data = await res.json();
          return {
            symbol: data.symbol,
            name: symbol,
            price: data.price,
            change: data.change,
            changePercent: data.changePercent,
            type: 'stock' as const
          };
        } catch (err) {
          console.error(`Error fetching ${symbol}:`, err);
          return null;
        }
      });

      // Fetch crypto data
      const cryptoPromises = symbols.crypto.map(async (id) => {
        try {
          const res = await fetch(`/api/data/crypto?id=${id}&function=price`);
          if (!res.ok) throw new Error('Failed to fetch');
          const data = await res.json();
          return {
            symbol: data.symbol,
            name: data.name,
            price: data.price,
            change: data.priceChange24h,
            changePercent: data.priceChangePercent24h,
            type: 'crypto' as const
          };
        } catch (err) {
          console.error(`Error fetching ${id}:`, err);
          return null;
        }
      });

      const results = await Promise.all([...stockPromises, ...cryptoPromises]);
      const validResults = results.filter((item): item is TickerItem => item !== null);
      
      setTickerData(validResults);
      setLoading(false);
      setError(null);
    } catch (err: any) {
      console.error('Ticker fetch error:', err);
      setError('Failed to load ticker data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickerData();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchTickerData, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number, type: string): string => {
    if (type === 'crypto' && price < 1) {
      return price.toFixed(6);
    }
    return price.toFixed(2);
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 border-b border-slate-700 overflow-hidden">
        <div className="flex items-center h-12 px-4">
          <div className="flex gap-8 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-4 w-16 bg-slate-700 rounded"></div>
                <div className="h-4 w-20 bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border-b border-red-700 overflow-hidden">
        <div className="flex items-center justify-center h-12 px-4 text-red-400 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border-b border-slate-700 overflow-hidden">
      <div className="relative h-12">
        {/* Scrolling ticker */}
        <motion.div
          className="flex items-center absolute whitespace-nowrap h-full gap-8 px-4"
          animate={{
            x: [0, -1920], // Adjust based on content width
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 60,
              ease: "linear",
            },
          }}
        >
          {/* Duplicate items for seamless loop */}
          {[...tickerData, ...tickerData].map((item, index) => (
            <motion.div
              key={`${item.symbol}-${index}`}
              className="flex items-center gap-3 py-2"
              whileHover={{ scale: 1.05 }}
            >
              {/* Symbol and Type Badge */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  {item.symbol}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  item.type === 'stock' 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {item.type === 'stock' ? 'STK' : 'CRY'}
                </span>
              </div>

              {/* Price */}
              <span className="text-slate-300 text-sm font-medium">
                ${formatPrice(item.price, item.type)}
              </span>

              {/* Change */}
              <div className={`flex items-center gap-1 ${
                item.changePercent >= 0 
                  ? 'text-green-400' 
                  : 'text-red-400'
              }`}>
                {item.changePercent >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span className="text-xs font-medium">
                  {item.changePercent >= 0 ? '+' : ''}
                  {item.changePercent.toFixed(2)}%
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
