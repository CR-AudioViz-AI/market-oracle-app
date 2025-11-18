/**
 * Unified Search API Endpoint
 * Searches across stocks (Alpha Vantage) and crypto (CoinGecko)
 * Provides autocomplete and detailed search results
 * 
 * @endpoint GET /api/data/search
 * @params query, type (optional: 'stock', 'crypto', 'all')
 * @returns Unified search results in JSON format
 */

import { NextRequest, NextResponse } from 'next/server';

// API configuration
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Types
interface SearchResult {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'crypto';
  description?: string;
  exchange?: string;
  region?: string;
  currency?: string;
  marketCapRank?: number;
  image?: string;
  relevance: number;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalResults: number;
  cached: boolean;
}

// Cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour cache for search (results don't change frequently)

/**
 * GET handler for search endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validation
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters long' },
        { status: 400 }
      );
    }

    if (!['stock', 'crypto', 'all'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be "stock", "crypto", or "all"' },
        { status: 400 }
      );
    }

    if (!ALPHA_VANTAGE_API_KEY || !COINGECKO_API_KEY) {
      return NextResponse.json(
        { error: 'API keys not configured' },
        { status: 500 }
      );
    }

    // Check cache
    const cacheKey = `${query.toLowerCase()}-${type}-${limit}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    // Perform search based on type
    let results: SearchResult[] = [];

    if (type === 'stock' || type === 'all') {
      const stockResults = await searchStocks(query);
      results = [...results, ...stockResults];
    }

    if (type === 'crypto' || type === 'all') {
      const cryptoResults = await searchCrypto(query);
      results = [...results, ...cryptoResults];
    }

    // Sort by relevance and limit
    results.sort((a, b) => b.relevance - a.relevance);
    results = results.slice(0, limit);

    const response: SearchResponse = {
      query,
      results,
      totalResults: results.length,
      cached: false
    };

    // Cache the result
    cache.set(cacheKey, { data: response, timestamp: Date.now() });

    // Clean old cache entries
    if (cache.size > 100) {
      const oldestKey = Array.from(cache.keys())[0];
      cache.delete(oldestKey);
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}

/**
 * Search for stocks using Alpha Vantage
 */
async function searchStocks(query: string): Promise<SearchResult[]> {
  try {
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();

    if (data['Note'] || data['Information']) {
      // Rate limit hit, return empty results
      return [];
    }

    if (!data['bestMatches']) {
      return [];
    }

    // Calculate relevance based on match quality
    const results: SearchResult[] = data['bestMatches'].map((match: any, index: number) => {
      // Higher relevance for exact symbol matches
      const symbolMatch = match['1. symbol'].toLowerCase() === query.toLowerCase();
      const nameMatch = match['2. name'].toLowerCase().includes(query.toLowerCase());
      
      let relevance = 50; // Base relevance
      if (symbolMatch) relevance += 40;
      else if (nameMatch) relevance += 20;
      
      // Prefer US exchanges
      if (match['4. region'] === 'United States') relevance += 10;
      
      // Decrease relevance for lower matches
      relevance -= index * 2;

      return {
        id: match['1. symbol'],
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: 'stock' as const,
        exchange: match['4. region'],
        region: match['4. region'],
        currency: match['8. currency'],
        relevance: Math.max(0, Math.min(100, relevance))
      };
    });

    return results;
  } catch (error) {
    console.error('Stock search error:', error);
    return [];
  }
}

/**
 * Search for cryptocurrencies using CoinGecko
 */
async function searchCrypto(query: string): Promise<SearchResult[]> {
  try {
    const url = `${COINGECKO_BASE_URL}/search?query=${encodeURIComponent(query)}&x_cg_demo_api_key=${COINGECKO_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.coins) {
      return [];
    }

    // Calculate relevance based on match quality and market cap rank
    const results: SearchResult[] = data.coins.slice(0, 20).map((coin: any) => {
      const symbolMatch = coin.symbol.toLowerCase() === query.toLowerCase();
      const nameMatch = coin.name.toLowerCase() === query.toLowerCase();
      const partialMatch = coin.name.toLowerCase().includes(query.toLowerCase());
      
      let relevance = 50; // Base relevance
      
      // Exact matches get highest priority
      if (symbolMatch) relevance += 40;
      else if (nameMatch) relevance += 35;
      else if (partialMatch) relevance += 15;
      
      // Higher relevance for top market cap coins
      if (coin.market_cap_rank) {
        if (coin.market_cap_rank <= 10) relevance += 20;
        else if (coin.market_cap_rank <= 50) relevance += 15;
        else if (coin.market_cap_rank <= 100) relevance += 10;
        else if (coin.market_cap_rank <= 500) relevance += 5;
      }

      return {
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        type: 'crypto' as const,
        marketCapRank: coin.market_cap_rank,
        image: coin.large || coin.thumb,
        relevance: Math.max(0, Math.min(100, relevance))
      };
    });

    return results;
  } catch (error) {
    console.error('Crypto search error:', error);
    return [];
  }
}

/**
 * Get autocomplete suggestions (faster, limited results)
 */
export async function getAutocomplete(query: string, limit: number = 5): Promise<SearchResult[]> {
  if (query.length < 2) return [];

  try {
    // Check if it looks like a stock ticker (short uppercase)
    const looksLikeStock = /^[A-Z]{1,5}$/.test(query.toUpperCase());
    
    if (looksLikeStock) {
      // Only search stocks for ticker-like queries
      const results = await searchStocks(query);
      return results.slice(0, limit);
    }

    // Search both for longer queries
    const [stockResults, cryptoResults] = await Promise.all([
      searchStocks(query),
      searchCrypto(query)
    ]);

    const combined = [...stockResults, ...cryptoResults];
    combined.sort((a, b) => b.relevance - a.relevance);
    
    return combined.slice(0, limit);
  } catch (error) {
    console.error('Autocomplete error:', error);
    return [];
  }
}

/**
 * Get detailed information for a specific symbol
 */
export async function getSymbolDetails(symbol: string, type: 'stock' | 'crypto') {
  if (type === 'stock') {
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch stock details');
    return await response.json();
  } else {
    const url = `${COINGECKO_BASE_URL}/coins/${symbol}?x_cg_demo_api_key=${COINGECKO_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch crypto details');
    return await response.json();
  }
}

/**
 * Get popular/trending symbols (for quick access)
 */
export async function getPopularSymbols() {
  try {
    // Popular stocks
    const popularStocks = [
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' as const },
      { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock' as const },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' as const },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock' as const },
      { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock' as const }
    ];

    // Get trending crypto
    const cryptoUrl = `${COINGECKO_BASE_URL}/search/trending?x_cg_demo_api_key=${COINGECKO_API_KEY}`;
    const cryptoResponse = await fetch(cryptoUrl);
    const cryptoData = await cryptoResponse.json();

    const trendingCrypto = cryptoData.coins?.slice(0, 5).map((item: any) => ({
      id: item.item.id,
      symbol: item.item.symbol.toUpperCase(),
      name: item.item.name,
      type: 'crypto' as const,
      marketCapRank: item.item.market_cap_rank
    })) || [];

    return {
      popularStocks,
      trendingCrypto
    };
  } catch (error) {
    console.error('Error fetching popular symbols:', error);
    return {
      popularStocks: [],
      trendingCrypto: []
    };
  }
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
