/**
 * Market Summary API Endpoint
 * Provides comprehensive market overview combining stocks and crypto
 * Uses Alpha Vantage (stocks) and CoinGecko (crypto)
 * 
 * @endpoint GET /api/data/market-summary
 * @returns Comprehensive market summary in JSON format
 */

import { NextRequest, NextResponse } from 'next/server';

// API configuration
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Types
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

interface MarketSummary {
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

// Cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 300000; // 5 minutes cache for summary (less frequent updates needed)

/**
 * GET handler for market summary endpoint
 */
export async function GET(request: NextRequest) {
  try {
    // Check cache first
    const cacheKey = 'market-summary';
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    if (!ALPHA_VANTAGE_API_KEY || !COINGECKO_API_KEY) {
      return NextResponse.json(
        { error: 'API keys not configured' },
        { status: 500 }
      );
    }

    // Fetch all data in parallel
    const [indices, stockMovers, cryptoData, cryptoTop] = await Promise.all([
      getMarketIndices(),
      getStockMovers(),
      getCryptoGlobalData(),
      getTopCryptoMovers()
    ]);

    // Calculate market sentiment
    const sentiment = calculateMarketSentiment(indices, stockMovers, cryptoData);

    const summary: MarketSummary = {
      timestamp: new Date().toISOString(),
      indices,
      stocks: stockMovers,
      crypto: {
        ...cryptoData,
        ...cryptoTop
      },
      sentiment
    };

    // Cache the result
    cache.set(cacheKey, { data: summary, timestamp: Date.now() });

    return NextResponse.json({ ...summary, cached: false });
  } catch (error: any) {
    console.error('Market summary API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch market summary' },
      { status: 500 }
    );
  }
}

/**
 * Get major market indices (S&P 500, Dow, Nasdaq)
 */
async function getMarketIndices(): Promise<MarketIndex[]> {
  const symbols = ['SPY', 'DIA', 'QQQ']; // ETFs tracking major indices
  const names = ['S&P 500', 'Dow Jones', 'Nasdaq'];
  
  const promises = symbols.map(symbol =>
    fetch(`${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`)
      .then(res => res.json())
  );

  const results = await Promise.all(promises);
  
  return results.map((data, index) => {
    const quote = data['Global Quote'];
    if (!quote) {
      return {
        symbol: symbols[index],
        name: names[index],
        price: 0,
        change: 0,
        changePercent: 0
      };
    }

    return {
      symbol: symbols[index],
      name: names[index],
      price: parseFloat(quote['05. price']) || 0,
      change: parseFloat(quote['09. change']) || 0,
      changePercent: parseFloat(quote['10. change percent']?.replace('%', '') || '0')
    };
  });
}

/**
 * Get top stock movers (gainers, losers, most active)
 */
async function getStockMovers() {
  try {
    const response = await fetch(
      `${ALPHA_VANTAGE_BASE_URL}?function=TOP_GAINERS_LOSERS&apikey=${ALPHA_VANTAGE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch stock movers');
    }

    const data = await response.json();

    if (data['Note'] || data['Information']) {
      // Rate limit hit, return empty data
      return {
        topGainers: [],
        topLosers: [],
        mostActive: []
      };
    }

    const formatMover = (item: any): TopMover => ({
      symbol: item.ticker,
      name: item.ticker,
      price: parseFloat(item.price),
      changePercent: parseFloat(item.change_percentage?.replace('%', '') || '0'),
      volume: parseInt(item.volume) || 0,
      type: 'stock'
    });

    return {
      topGainers: (data.top_gainers || []).slice(0, 5).map(formatMover),
      topLosers: (data.top_losers || []).slice(0, 5).map(formatMover),
      mostActive: (data.most_actively_traded || []).slice(0, 5).map(formatMover)
    };
  } catch (error) {
    console.error('Error fetching stock movers:', error);
    return {
      topGainers: [],
      topLosers: [],
      mostActive: []
    };
  }
}

/**
 * Get global cryptocurrency market data
 */
async function getCryptoGlobalData() {
  try {
    const response = await fetch(
      `${COINGECKO_BASE_URL}/global?x_cg_demo_api_key=${COINGECKO_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch crypto global data');
    }

    const data = await response.json();
    const globalData = data.data;

    return {
      totalMarketCap: globalData.total_market_cap?.usd || 0,
      btcDominance: globalData.market_cap_percentage?.btc || 0,
      ethDominance: globalData.market_cap_percentage?.eth || 0,
      trending: []
    };
  } catch (error) {
    console.error('Error fetching crypto global data:', error);
    return {
      totalMarketCap: 0,
      btcDominance: 0,
      ethDominance: 0,
      trending: []
    };
  }
}

/**
 * Get top crypto movers and trending
 */
async function getTopCryptoMovers() {
  try {
    // Fetch top 100 cryptos by market cap
    const response = await fetch(
      `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&x_cg_demo_api_key=${COINGECKO_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch crypto data');
    }

    const coins = await response.json();

    // Sort by 24h change to get gainers and losers
    const sorted = coins.filter((c: any) => c.price_change_percentage_24h !== null);
    const gainers = [...sorted].sort((a: any, b: any) => 
      b.price_change_percentage_24h - a.price_change_percentage_24h
    );
    const losers = [...sorted].sort((a: any, b: any) => 
      a.price_change_percentage_24h - b.price_change_percentage_24h
    );

    const formatCrypto = (coin: any): TopMover => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      changePercent: coin.price_change_percentage_24h || 0,
      volume: coin.total_volume || 0,
      type: 'crypto'
    });

    // Fetch trending
    const trendingResponse = await fetch(
      `${COINGECKO_BASE_URL}/search/trending?x_cg_demo_api_key=${COINGECKO_API_KEY}`
    );
    const trendingData = await trendingResponse.json();

    return {
      topGainers: gainers.slice(0, 5).map(formatCrypto),
      topLosers: losers.slice(0, 5).map(formatCrypto),
      trending: (trendingData.coins || []).slice(0, 5).map((item: any) => ({
        id: item.item.id,
        symbol: item.item.symbol,
        name: item.item.name,
        marketCapRank: item.item.market_cap_rank
      }))
    };
  } catch (error) {
    console.error('Error fetching crypto movers:', error);
    return {
      topGainers: [],
      topLosers: [],
      trending: []
    };
  }
}

/**
 * Calculate overall market sentiment
 */
function calculateMarketSentiment(
  indices: MarketIndex[],
  stockMovers: any,
  cryptoData: any
): { overall: 'bullish' | 'bearish' | 'neutral'; score: number; description: string } {
  let score = 0;
  let factors = 0;

  // Analyze indices
  indices.forEach(index => {
    if (index.changePercent > 0) score += index.changePercent;
    else score += index.changePercent;
    factors++;
  });

  // Analyze stock movers
  if (stockMovers.topGainers.length > 0) {
    const avgGainerChange = stockMovers.topGainers.reduce((sum: number, m: TopMover) => 
      sum + m.changePercent, 0) / stockMovers.topGainers.length;
    score += avgGainerChange * 0.5;
    factors++;
  }

  if (stockMovers.topLosers.length > 0) {
    const avgLoserChange = stockMovers.topLosers.reduce((sum: number, m: TopMover) => 
      sum + m.changePercent, 0) / stockMovers.topLosers.length;
    score += avgLoserChange * 0.5;
    factors++;
  }

  // Normalize score
  const normalizedScore = factors > 0 ? score / factors : 0;

  let overall: 'bullish' | 'bearish' | 'neutral';
  let description: string;

  if (normalizedScore > 0.5) {
    overall = 'bullish';
    description = 'Markets are showing strong positive momentum across stocks and crypto.';
  } else if (normalizedScore < -0.5) {
    overall = 'bearish';
    description = 'Markets are experiencing downward pressure with negative sentiment.';
  } else {
    overall = 'neutral';
    description = 'Markets are trading in a mixed range with balanced sentiment.';
  }

  return {
    overall,
    score: Math.round(normalizedScore * 100) / 100,
    description
  };
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
