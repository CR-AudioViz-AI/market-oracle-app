/**
 * Stock Data API Endpoint
 * Powered by Alpha Vantage (500 calls/day free tier)
 * Provides real-time quotes, historical data, technical indicators, and fundamentals
 * 
 * @endpoint GET /api/data/stocks
 * @params symbol, function, interval (optional)
 * @returns Stock data in JSON format
 */

import { NextRequest, NextResponse } from 'next/server';

// Alpha Vantage API configuration
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Types
interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  timestamp: string;
}

interface TechnicalIndicator {
  date: string;
  value: number;
  signal?: string;
}

interface CompanyOverview {
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  beta: number;
  weekHigh52: number;
  weekLow52: number;
}

// Cache for rate limiting and performance
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache

/**
 * GET handler for stock data endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const functionType = searchParams.get('function') || 'GLOBAL_QUOTE';
    const interval = searchParams.get('interval') || '5min';

    // Validation
    if (!symbol) {
      return NextResponse.json(
        { error: 'Missing required parameter: symbol' },
        { status: 400 }
      );
    }

    if (!ALPHA_VANTAGE_API_KEY) {
      return NextResponse.json(
        { error: 'Alpha Vantage API key not configured' },
        { status: 500 }
      );
    }

    // Check cache
    const cacheKey = `${functionType}-${symbol}-${interval}`;
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
      case 'GLOBAL_QUOTE':
        data = await getGlobalQuote(symbol);
        break;
      case 'TIME_SERIES_INTRADAY':
        data = await getIntradayData(symbol, interval);
        break;
      case 'TIME_SERIES_DAILY':
        data = await getDailyData(symbol);
        break;
      case 'OVERVIEW':
        data = await getCompanyOverview(symbol);
        break;
      case 'RSI':
      case 'MACD':
      case 'SMA':
      case 'EMA':
        data = await getTechnicalIndicator(symbol, functionType, interval);
        break;
      case 'NEWS_SENTIMENT':
        data = await getNewsSentiment(symbol);
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
    console.error('Stock data API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}

/**
 * Get real-time quote for a stock
 */
async function getGlobalQuote(symbol: string): Promise<StockQuote> {
  const url = `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (data['Note'] || data['Information']) {
    throw new Error('API rate limit exceeded. Please try again later.');
  }

  if (data['Error Message']) {
    throw new Error('Invalid stock symbol');
  }

  const quote = data['Global Quote'];
  if (!quote || !quote['05. price']) {
    throw new Error('No data available for this symbol');
  }

  return {
    symbol: quote['01. symbol'],
    price: parseFloat(quote['05. price']),
    change: parseFloat(quote['09. change']),
    changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
    volume: parseInt(quote['06. volume']),
    open: parseFloat(quote['02. open']),
    high: parseFloat(quote['03. high']),
    low: parseFloat(quote['04. low']),
    previousClose: parseFloat(quote['08. previous close']),
    timestamp: quote['07. latest trading day']
  };
}

/**
 * Get intraday time series data
 */
async function getIntradayData(symbol: string, interval: string) {
  const url = `${ALPHA_VANTAGE_BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&apikey=${ALPHA_VANTAGE_API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (data['Note'] || data['Information']) {
    throw new Error('API rate limit exceeded. Please try again later.');
  }

  if (data['Error Message']) {
    throw new Error('Invalid stock symbol or interval');
  }

  const timeSeriesKey = `Time Series (${interval})`;
  const timeSeries = data[timeSeriesKey];
  
  if (!timeSeries) {
    throw new Error('No intraday data available');
  }

  // Convert to array format
  const chartData = Object.entries(timeSeries).map(([timestamp, values]: [string, any]) => ({
    timestamp,
    open: parseFloat(values['1. open']),
    high: parseFloat(values['2. high']),
    low: parseFloat(values['3. low']),
    close: parseFloat(values['4. close']),
    volume: parseInt(values['5. volume'])
  }));

  return {
    symbol,
    interval,
    data: chartData.reverse() // Oldest to newest
  };
}

/**
 * Get daily time series data
 */
async function getDailyData(symbol: string) {
  const url = `${ALPHA_VANTAGE_BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (data['Note'] || data['Information']) {
    throw new Error('API rate limit exceeded. Please try again later.');
  }

  if (data['Error Message']) {
    throw new Error('Invalid stock symbol');
  }

  const timeSeries = data['Time Series (Daily)'];
  
  if (!timeSeries) {
    throw new Error('No daily data available');
  }

  // Convert to array format (last 100 days)
  const chartData = Object.entries(timeSeries)
    .slice(0, 100)
    .map(([date, values]: [string, any]) => ({
      date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'])
    }));

  return {
    symbol,
    data: chartData.reverse() // Oldest to newest
  };
}

/**
 * Get company overview and fundamentals
 */
async function getCompanyOverview(symbol: string): Promise<CompanyOverview> {
  const url = `${ALPHA_VANTAGE_BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (data['Note'] || data['Information']) {
    throw new Error('API rate limit exceeded. Please try again later.');
  }

  if (data['Error Message'] || !data['Symbol']) {
    throw new Error('Invalid stock symbol or no data available');
  }

  return {
    symbol: data['Symbol'],
    name: data['Name'],
    description: data['Description'],
    sector: data['Sector'],
    industry: data['Industry'],
    marketCap: parseInt(data['MarketCapitalization']) || 0,
    peRatio: parseFloat(data['PERatio']) || 0,
    dividendYield: parseFloat(data['DividendYield']) || 0,
    beta: parseFloat(data['Beta']) || 0,
    weekHigh52: parseFloat(data['52WeekHigh']) || 0,
    weekLow52: parseFloat(data['52WeekLow']) || 0
  };
}

/**
 * Get technical indicators
 */
async function getTechnicalIndicator(symbol: string, indicator: string, interval: string) {
  const url = `${ALPHA_VANTAGE_BASE_URL}?function=${indicator}&symbol=${symbol}&interval=${interval}&time_period=14&series_type=close&apikey=${ALPHA_VANTAGE_API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (data['Note'] || data['Information']) {
    throw new Error('API rate limit exceeded. Please try again later.');
  }

  if (data['Error Message']) {
    throw new Error('Invalid parameters');
  }

  const technicalKey = `Technical Analysis: ${indicator}`;
  const technicalData = data[technicalKey];
  
  if (!technicalData) {
    throw new Error('No technical indicator data available');
  }

  // Convert to array format
  const indicatorData = Object.entries(technicalData)
    .slice(0, 50)
    .map(([date, values]: [string, any]) => ({
      date,
      value: parseFloat(values[indicator])
    }));

  return {
    symbol,
    indicator,
    interval,
    data: indicatorData.reverse()
  };
}

/**
 * Get news sentiment for a stock
 */
async function getNewsSentiment(symbol: string) {
  const url = `${ALPHA_VANTAGE_BASE_URL}?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (data['Note'] || data['Information']) {
    throw new Error('API rate limit exceeded. Please try again later.');
  }

  if (!data['feed']) {
    throw new Error('No news sentiment data available');
  }

  // Process and return top 10 most relevant articles
  const articles = data['feed'].slice(0, 10).map((article: any) => {
    const tickerSentiment = article['ticker_sentiment']?.find((t: any) => t['ticker'] === symbol);
    
    return {
      title: article['title'],
      url: article['url'],
      source: article['source'],
      publishedAt: article['time_published'],
      summary: article['summary'],
      sentiment: {
        score: tickerSentiment ? parseFloat(tickerSentiment['ticker_sentiment_score']) : 0,
        label: tickerSentiment ? tickerSentiment['ticker_sentiment_label'] : 'Neutral'
      },
      relevance: tickerSentiment ? parseFloat(tickerSentiment['relevance_score']) : 0
    };
  });

  return {
    symbol,
    articles
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
