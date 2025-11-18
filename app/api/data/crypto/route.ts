/**
 * Crypto Data API Endpoint
 * Powered by CoinGecko (30 calls/minute free tier, 21M+ tokens)
 * Provides real-time prices, market data, historical charts, and trending coins
 * 
 * @endpoint GET /api/data/crypto
 * @params id, function, vs_currency, days (optional)
 * @returns Crypto data in JSON format
 */

import { NextRequest, NextResponse } from 'next/server';

// CoinGecko API configuration
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Types
interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  totalSupply: number;
  high24h: number;
  low24h: number;
  ath: number;
  athDate: string;
  atl: number;
  atlDate: string;
  image: string;
}

interface CryptoMarketChart {
  id: string;
  prices: [number, number][];
  marketCaps: [number, number][];
  totalVolumes: [number, number][];
}

interface TrendingCoin {
  id: string;
  symbol: string;
  name: string;
  marketCapRank: number;
  priceChange24h: number;
  image: string;
}

// Cache for rate limiting and performance
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache

// Rate limiting (30 calls per minute)
const rateLimitWindow = 60000; // 1 minute
const maxCallsPerWindow = 30;
const callTimestamps: number[] = [];

/**
 * Check rate limit before making API call
 */
function checkRateLimit(): boolean {
  const now = Date.now();
  // Remove timestamps older than the window
  while (callTimestamps.length > 0 && callTimestamps[0] < now - rateLimitWindow) {
    callTimestamps.shift();
  }
  
  if (callTimestamps.length >= maxCallsPerWindow) {
    return false;
  }
  
  callTimestamps.push(now);
  return true;
}

/**
 * GET handler for crypto data endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const functionType = searchParams.get('function') || 'price';
    const vsCurrency = searchParams.get('vs_currency') || 'usd';
    const days = searchParams.get('days') || '7';

    // Validation
    if (!id && functionType !== 'trending' && functionType !== 'global') {
      return NextResponse.json(
        { error: 'Missing required parameter: id (crypto coin id)' },
        { status: 400 }
      );
    }

    if (!COINGECKO_API_KEY) {
      return NextResponse.json(
        { error: 'CoinGecko API key not configured' },
        { status: 500 }
      );
    }

    // Check rate limit
    if (!checkRateLimit()) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a minute.' },
        { status: 429 }
      );
    }

    // Check cache
    const cacheKey = `${functionType}-${id}-${vsCurrency}-${days}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    // Route to appropriate handler
    let data;
    switch (functionType) {
      case 'price':
        data = await getCryptoPrice(id!, vsCurrency);
        break;
      case 'market_chart':
        data = await getMarketChart(id!, vsCurrency, days);
        break;
      case 'trending':
        data = await getTrendingCoins();
        break;
      case 'global':
        data = await getGlobalData();
        break;
      case 'search':
        data = await searchCoins(id!);
        break;
      case 'ohlc':
        data = await getOHLC(id!, vsCurrency, days);
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported function: ${functionType}` },
          { status: 400 }
        );
    }

    // Cache the result
    cache.set(cacheKey, { data, timestamp: Date.now() });

    // Clean old cache entries
    if (cache.size > 100) {
      const oldestKey = Array.from(cache.keys())[0];
      cache.delete(oldestKey);
    }

    return NextResponse.json({ ...data, cached: false });
  } catch (error: any) {
    console.error('Crypto data API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch crypto data' },
      { status: 500 }
    );
  }
}

/**
 * Get current price and market data for a cryptocurrency
 */
async function getCryptoPrice(id: string, vsCurrency: string): Promise<CryptoPrice> {
  const url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=${vsCurrency}&ids=${id}&x_cg_demo_api_key=${COINGECKO_API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data || data.length === 0) {
    throw new Error('Cryptocurrency not found');
  }

  const coin = data[0];

  return {
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    price: coin.current_price,
    priceChange24h: coin.price_change_24h || 0,
    priceChangePercent24h: coin.price_change_percentage_24h || 0,
    marketCap: coin.market_cap,
    volume24h: coin.total_volume,
    circulatingSupply: coin.circulating_supply,
    totalSupply: coin.total_supply,
    high24h: coin.high_24h,
    low24h: coin.low_24h,
    ath: coin.ath,
    athDate: coin.ath_date,
    atl: coin.atl,
    atlDate: coin.atl_date,
    image: coin.image
  };
}

/**
 * Get market chart data (price, market cap, volume over time)
 */
async function getMarketChart(id: string, vsCurrency: string, days: string): Promise<CryptoMarketChart> {
  const url = `${COINGECKO_BASE_URL}/coins/${id}/market_chart?vs_currency=${vsCurrency}&days=${days}&x_cg_demo_api_key=${COINGECKO_API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.prices) {
    throw new Error('No chart data available');
  }

  return {
    id,
    prices: data.prices,
    marketCaps: data.market_caps,
    totalVolumes: data.total_volumes
  };
}

/**
 * Get OHLC (candlestick) data
 */
async function getOHLC(id: string, vsCurrency: string, days: string) {
  const url = `${COINGECKO_BASE_URL}/coins/${id}/ohlc?vs_currency=${vsCurrency}&days=${days}&x_cg_demo_api_key=${COINGECKO_API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data || data.length === 0) {
    throw new Error('No OHLC data available');
  }

  // Transform to more readable format
  const ohlcData = data.map((candle: number[]) => ({
    timestamp: candle[0],
    date: new Date(candle[0]).toISOString(),
    open: candle[1],
    high: candle[2],
    low: candle[3],
    close: candle[4]
  }));

  return {
    id,
    vsCurrency,
    days,
    data: ohlcData
  };
}

/**
 * Get trending cryptocurrencies
 */
async function getTrendingCoins() {
  const url = `${COINGECKO_BASE_URL}/search/trending?x_cg_demo_api_key=${COINGECKO_API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.coins) {
    throw new Error('No trending data available');
  }

  const trending: TrendingCoin[] = data.coins.map((item: any) => ({
    id: item.item.id,
    symbol: item.item.symbol,
    name: item.item.name,
    marketCapRank: item.item.market_cap_rank,
    priceChange24h: item.item.data?.price_change_percentage_24h?.usd || 0,
    image: item.item.small
  }));

  return { trending };
}

/**
 * Get global cryptocurrency market data
 */
async function getGlobalData() {
  const url = `${COINGECKO_BASE_URL}/global?x_cg_demo_api_key=${COINGECKO_API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.data) {
    throw new Error('No global data available');
  }

  const globalData = data.data;

  return {
    totalMarketCap: globalData.total_market_cap?.usd || 0,
    totalVolume24h: globalData.total_volume?.usd || 0,
    btcDominance: globalData.market_cap_percentage?.btc || 0,
    ethDominance: globalData.market_cap_percentage?.eth || 0,
    activeCoins: globalData.active_cryptocurrencies,
    markets: globalData.markets,
    marketCapChangePercentage24h: globalData.market_cap_change_percentage_24h_usd || 0
  };
}

/**
 * Search for cryptocurrencies
 */
async function searchCoins(query: string) {
  const url = `${COINGECKO_BASE_URL}/search?query=${encodeURIComponent(query)}&x_cg_demo_api_key=${COINGECKO_API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.coins) {
    throw new Error('No search results');
  }

  // Return top 10 results
  const results = data.coins.slice(0, 10).map((coin: any) => ({
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol,
    marketCapRank: coin.market_cap_rank,
    image: coin.large
  }));

  return { results };
}

/**
 * Get top N cryptocurrencies by market cap
 */
export async function getTopCryptos(vsCurrency: string = 'usd', limit: number = 10) {
  const url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=${vsCurrency}&order=market_cap_desc&per_page=${limit}&page=1&x_cg_demo_api_key=${COINGECKO_API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = await response.json();
  
  return data.map((coin: any) => ({
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    price: coin.current_price,
    priceChangePercent24h: coin.price_change_percentage_24h || 0,
    marketCap: coin.market_cap,
    volume24h: coin.total_volume,
    image: coin.image
  }));
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
