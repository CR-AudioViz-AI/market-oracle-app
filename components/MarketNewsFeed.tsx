/**
 * Market News Feed Component
 * Displays news articles with sentiment analysis
 * Powered by NewsAPI
 * 
 * @component MarketNewsFeed
 */

'use client';

import { useEffect, useState } from 'react';
import { Newspaper, TrendingUp, TrendingDown, Minus, ExternalLink, RefreshCw, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  relevance: number;
}

export default function MarketNewsFeed() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchNews = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/data/news?query=stock market&pageSize=20');
      if (!res.ok) throw new Error('Failed to fetch news');
      
      const data = await res.json();
      setArticles(data.articles || []);
      setError(null);
    } catch (err: any) {
      console.error('News fetch error:', err);
      setError(err.message || 'Failed to load news');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
    
    // Auto-refresh every 10 minutes
    const interval = setInterval(() => fetchNews(true), 600000);
    
    return () => clearInterval(interval);
  }, []);

  const filteredArticles = articles.filter(article => {
    if (filter === 'all') return true;
    return article.sentiment.label === filter;
  });

  const getSentimentIcon = (label: string) => {
    switch (label) {
      case 'positive':
        return <TrendingUp className="w-4 h-4" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'positive':
        return 'text-green-400 bg-green-500/20 border-green-700';
      case 'negative':
        return 'text-red-400 bg-red-500/20 border-red-700';
      default:
        return 'text-slate-400 bg-slate-500/20 border-slate-700';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 animate-pulse">
            <div className="flex gap-4">
              <div className="w-32 h-20 bg-slate-700 rounded"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                <div className="h-3 bg-slate-700 rounded w-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-xl p-8 text-center">
        <Newspaper className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => fetchNews()}
          className="px-6 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Newspaper className="w-6 h-6" />
            Market News
          </h2>
          
          {/* Sentiment Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            {(['all', 'positive', 'negative', 'neutral'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => fetchNews(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Sentiment Overview */}
      <div className="grid grid-cols-3 gap-4">
        {['positive', 'neutral', 'negative'].map((sentiment) => {
          const count = articles.filter(a => a.sentiment.label === sentiment).length;
          const percentage = articles.length > 0 ? (count / articles.length * 100).toFixed(0) : '0';
          
          return (
            <motion.div
              key={sentiment}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-xl border ${getSentimentColor(sentiment)}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {getSentimentIcon(sentiment)}
                <span className="text-sm font-medium capitalize">{sentiment}</span>
              </div>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs opacity-75">{percentage}% of articles</p>
            </motion.div>
          );
        })}
      </div>

      {/* News Articles */}
      <div className="space-y-4">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No {filter !== 'all' ? filter : ''} articles found</p>
          </div>
        ) : (
          filteredArticles.map((article, index) => (
            <motion.a
              key={article.url}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="block bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-all group"
            >
              <div className="flex gap-4">
                {/* Image */}
                {article.urlToImage ? (
                  <div className="flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden bg-slate-700">
                    <img
                      src={article.urlToImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-32 h-20 rounded-lg bg-slate-700 flex items-center justify-center">
                    <Newspaper className="w-8 h-8 text-slate-600" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <ExternalLink className="flex-shrink-0 w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  </div>

                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                    {article.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs">
                    {/* Source */}
                    <span className="text-slate-500">
                      {article.source.name}
                    </span>

                    {/* Time */}
                    <span className="text-slate-500">
                      {formatDate(article.publishedAt)}
                    </span>

                    {/* Sentiment Badge */}
                    <div className={`flex items-center gap-1 px-2 py-1 rounded border ${getSentimentColor(article.sentiment.label)}`}>
                      {getSentimentIcon(article.sentiment.label)}
                      <span className="capitalize">{article.sentiment.label}</span>
                      <span className="opacity-75">
                        ({article.sentiment.confidence}%)
                      </span>
                    </div>

                    {/* Relevance */}
                    {article.relevance > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${article.relevance}%` }}
                          />
                        </div>
                        <span className="text-slate-500">{article.relevance}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.a>
          ))
        )}
      </div>
    </div>
  );
}
