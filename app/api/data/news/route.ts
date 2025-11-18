/**
 * News Feed API Endpoint
 * Powered by NewsAPI (100 calls/day free tier, 80,000+ sources)
 * Provides market news, sentiment analysis, and breaking news
 * 
 * @endpoint GET /api/data/news
 * @params query, category, pageSize, page (optional)
 * @returns News articles with sentiment in JSON format
 */

import { NextRequest, NextResponse } from 'next/server';

// NewsAPI configuration
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const NEWSAPI_BASE_URL = 'https://newsapi.org/v2';

// Types
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
  content: string;
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  relevance: number;
}

interface NewsResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
  cached: boolean;
  page: number;
  pageSize: number;
}

// Cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 180000; // 3 minutes cache

// Rate limiting (100 calls per day)
const rateLimitWindow = 86400000; // 24 hours
const maxCallsPerDay = 100;
const callTimestamps: number[] = [];

/**
 * Check rate limit
 */
function checkRateLimit(): boolean {
  const now = Date.now();
  // Remove timestamps older than 24 hours
  while (callTimestamps.length > 0 && callTimestamps[0] < now - rateLimitWindow) {
    callTimestamps.shift();
  }
  
  if (callTimestamps.length >= maxCallsPerDay) {
    return false;
  }
  
  callTimestamps.push(now);
  return true;
}

/**
 * Analyze sentiment of text using simple keyword analysis
 * In production, this would use an AI model or dedicated sentiment API
 */
function analyzeSentiment(text: string): { score: number; label: 'positive' | 'negative' | 'neutral'; confidence: number } {
  const lowerText = text.toLowerCase();
  
  // Positive keywords
  const positiveKeywords = [
    'surge', 'gain', 'growth', 'profit', 'success', 'win', 'breakthrough',
    'rally', 'soar', 'boom', 'rise', 'up', 'bullish', 'positive', 'strong',
    'beat', 'exceed', 'outperform', 'record', 'high', 'innovative'
  ];
  
  // Negative keywords
  const negativeKeywords = [
    'fall', 'drop', 'loss', 'crash', 'decline', 'fail', 'crisis',
    'plunge', 'sink', 'bearish', 'negative', 'weak', 'miss', 'below',
    'cut', 'slash', 'layoff', 'bankruptcy', 'scandal', 'fraud'
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) positiveCount += matches.length;
  });

  negativeKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) negativeCount += matches.length;
  });

  const totalMatches = positiveCount + negativeCount;
  const score = totalMatches > 0 
    ? (positiveCount - negativeCount) / totalMatches 
    : 0;

  let label: 'positive' | 'negative' | 'neutral';
  let confidence: number;

  if (score > 0.2) {
    label = 'positive';
    confidence = Math.min(Math.abs(score) * 100, 95);
  } else if (score < -0.2) {
    label = 'negative';
    confidence = Math.min(Math.abs(score) * 100, 95);
  } else {
    label = 'neutral';
    confidence = 60;
  }

  return {
    score: Math.round(score * 100) / 100,
    label,
    confidence: Math.round(confidence)
  };
}

/**
 * Calculate relevance score based on keywords and recency
 */
function calculateRelevance(article: any, query: string): number {
  const now = Date.now();
  const publishedTime = new Date(article.publishedAt).getTime();
  const hoursSincePublished = (now - publishedTime) / (1000 * 60 * 60);
  
  // Recency score (newer is better, up to 24 hours)
  const recencyScore = Math.max(0, 1 - (hoursSincePublished / 24));
  
  // Keyword match score
  const text = `${article.title} ${article.description}`.toLowerCase();
  const keywords = query.toLowerCase().split(' ');
  let keywordMatches = 0;
  
  keywords.forEach(keyword => {
    if (text.includes(keyword)) keywordMatches++;
  });
  
  const keywordScore = keywordMatches / keywords.length;
  
  // Combine scores (60% keyword relevance, 40% recency)
  return Math.round((keywordScore * 0.6 + recencyScore * 0.4) * 100);
}

/**
 * GET handler for news endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || 'stock market';
    const category = searchParams.get('category');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const sortBy = searchParams.get('sortBy') || 'publishedAt';

    if (!NEWSAPI_KEY) {
      return NextResponse.json(
        { error: 'NewsAPI key not configured' },
        { status: 500 }
      );
    }

    // Validate parameters
    if (pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: 'pageSize must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `${query}-${category}-${pageSize}-${page}-${sortBy}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    // Check rate limit
    if (!checkRateLimit()) {
      // If rate limit hit, try to return cached data even if expired
      if (cached) {
        return NextResponse.json({
          ...cached.data,
          cached: true,
          rateLimited: true,
          message: 'Serving cached data due to rate limit'
        });
      }
      
      return NextResponse.json(
        { error: 'Daily API rate limit exceeded. Please try again tomorrow.' },
        { status: 429 }
      );
    }

    // Build API URL
    let url: string;
    if (category) {
      // Top headlines by category
      url = `${NEWSAPI_BASE_URL}/top-headlines?category=${category}&pageSize=${pageSize}&page=${page}&apiKey=${NEWSAPI_KEY}`;
    } else {
      // Everything endpoint for search
      const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // Last 7 days
      url = `${NEWSAPI_BASE_URL}/everything?q=${encodeURIComponent(query)}&from=${fromDate}&sortBy=${sortBy}&pageSize=${pageSize}&page=${page}&apiKey=${NEWSAPI_KEY}`;
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'error') {
      throw new Error(data.message || 'NewsAPI returned an error');
    }

    // Process articles with sentiment and relevance
    const processedArticles: NewsArticle[] = data.articles.map((article: any) => {
      const textForSentiment = `${article.title} ${article.description || ''}`;
      const sentiment = analyzeSentiment(textForSentiment);
      const relevance = calculateRelevance(article, query);

      return {
        source: article.source,
        author: article.author,
        title: article.title,
        description: article.description,
        url: article.url,
        urlToImage: article.urlToImage,
        publishedAt: article.publishedAt,
        content: article.content,
        sentiment,
        relevance
      };
    });

    // Sort by relevance if using everything endpoint
    if (!category) {
      processedArticles.sort((a, b) => b.relevance - a.relevance);
    }

    const result: NewsResponse = {
      status: 'ok',
      totalResults: data.totalResults,
      articles: processedArticles,
      cached: false,
      page,
      pageSize
    };

    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    // Clean old cache entries
    if (cache.size > 50) {
      const oldestKey = Array.from(cache.keys())[0];
      cache.delete(oldestKey);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('News API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

/**
 * Get top headlines for specific categories
 */
export async function getTopHeadlinesByCategory(
  category: 'business' | 'technology' | 'general',
  pageSize: number = 5
) {
  const url = `${NEWSAPI_BASE_URL}/top-headlines?category=${category}&pageSize=${pageSize}&apiKey=${NEWSAPI_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`NewsAPI error: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.status === 'error') {
    throw new Error(data.message || 'NewsAPI returned an error');
  }

  return data.articles.map((article: any) => ({
    title: article.title,
    description: article.description,
    url: article.url,
    publishedAt: article.publishedAt,
    source: article.source.name
  }));
}

/**
 * Get breaking news (most recent articles)
 */
export async function getBreakingNews(count: number = 10) {
  const url = `${NEWSAPI_BASE_URL}/top-headlines?category=business&pageSize=${count}&apiKey=${NEWSAPI_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`NewsAPI error: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.status === 'error') {
    throw new Error(data.message || 'NewsAPI returned an error');
  }

  return data.articles;
}

/**
 * OPTIONS handler (for CORS)
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
