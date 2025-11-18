/**
 * Unified Stock/Crypto Search Component
 * Provides autocomplete search across stocks and cryptocurrencies
 * Features instant results and type-ahead suggestions
 * 
 * @component UnifiedSearch
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'crypto';
  marketCapRank?: number;
  image?: string;
  relevance: number;
}

export default function UnifiedSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Debounce search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/data/search?query=${encodeURIComponent(query)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setFocused(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'stock') {
      router.push(`/stock/${result.symbol}`);
    } else {
      router.push(`/crypto/${result.id}`);
    }
    setQuery('');
    setResults([]);
    setFocused(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search stocks or crypto... (e.g., AAPL, Bitcoin)"
          className="w-full pl-12 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />

        {/* Clear Button */}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {focused && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.symbol}-${index}`}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-500/20'
                      : 'hover:bg-slate-700/50'
                  }`}
                >
                  {/* Icon/Image */}
                  {result.type === 'crypto' && result.image ? (
                    <img
                      src={result.image}
                      alt={result.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      result.type === 'stock'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      <span className="text-xs font-bold">
                        {result.symbol.slice(0, 2)}
                      </span>
                    </div>
                  )}

                  {/* Symbol and Name */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">
                        {result.symbol}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        result.type === 'stock'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {result.type.toUpperCase()}
                      </span>
                      {result.marketCapRank && result.marketCapRank <= 100 && (
                        <span className="text-xs text-slate-400">
                          #{result.marketCapRank}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 truncate">
                      {result.name}
                    </p>
                  </div>

                  {/* Relevance Indicator */}
                  <div className="flex items-center gap-1">
                    <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ width: `${result.relevance}%` }}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-slate-900/50 border-t border-slate-700">
              <p className="text-xs text-slate-400 text-center">
                Press <span className="text-white font-mono">Enter</span> to select • <span className="text-white font-mono">↑↓</span> to navigate
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Results */}
      <AnimatePresence>
        {focused && query.length >= 2 && !loading && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-8 z-50"
          >
            <div className="text-center">
              <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-1">No results found</p>
              <p className="text-sm text-slate-500">
                Try searching for a stock symbol (e.g., AAPL) or cryptocurrency name
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
