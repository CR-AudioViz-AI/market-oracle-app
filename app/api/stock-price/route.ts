// API Route: Get Real-Time Stock Prices from Yahoo Finance
// GET /api/stock-price?symbols=AAPL,MSFT,TSLA

import { NextRequest, NextResponse } from 'next/server'

interface YahooQuoteResponse {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number
        previousClose: number
        regularMarketDayHigh?: number
        regularMarketDayLow?: number
        regularMarketVolume?: number
        symbol: string
      }
      timestamp: number[]
      indicators: {
        quote: Array<{
          close: number[]
          high?: number[]
          low?: number[]
          volume?: number[]
        }>
      }
    }>
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbolsParam = searchParams.get('symbols')
    
    if (!symbolsParam) {
      return NextResponse.json({ error: 'Symbols parameter required' }, { status: 400 })
    }

    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase())
    // FIX: Added high, low, volume to type definition
    const priceData: Record<string, { 
      price: number
      change: number
      changePercent: number
      high: number
      low: number
      volume: number
    }> = {}

    // Fetch prices in batches (Yahoo Finance allows multiple symbols)
    for (const symbol of symbols) {
      try {
        const response = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0'
            }
          }
        )

        if (!response.ok) {
          console.warn(`Failed to fetch ${symbol}: ${response.status}`)
          continue
        }

        const data = await response.json() as YahooQuoteResponse
        
        if (data.chart?.result?.[0]?.meta) {
          const meta = data.chart.result[0].meta
          const quote = data.chart.result[0].indicators?.quote?.[0]
          
          const currentPrice = meta.regularMarketPrice
          const previousClose = meta.previousClose
          const change = currentPrice - previousClose
          const changePercent = (change / previousClose) * 100

          // Get high/low/volume from meta (current day) or from quote array (last value)
          const high = meta.regularMarketDayHigh || (quote?.high ? quote.high[quote.high.length - 1] : null)
          const low = meta.regularMarketDayLow || (quote?.low ? quote.low[quote.low.length - 1] : null)
          const volume = meta.regularMarketVolume || (quote?.volume ? quote.volume[quote.volume.length - 1] : null)

          priceData[symbol] = {
            price: currentPrice,
            change: change,
            changePercent: changePercent,
            high: high || currentPrice,
            low: low || currentPrice,
            volume: volume || 0
          }
        }
      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error)
        continue
      }
    }

    return NextResponse.json({
      success: true,
      prices: priceData,
      timestamp: new Date().toISOString(),
      count: Object.keys(priceData).length
    })

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Stock price API error:', errorMsg)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch stock prices',
      message: errorMsg
    }, { status: 500 })
  }
}

// Helper function to get historical price for a specific date
async function getHistoricalPrice(symbol: string, date: string): Promise<number | null> {
  try {
    // Convert date to Unix timestamp
    const targetDate = new Date(date)
    const period1 = Math.floor(targetDate.getTime() / 1000) - (86400 * 7) // 1 week before
    const period2 = Math.floor(targetDate.getTime() / 1000) + 86400 // 1 day after

    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      }
    )

    if (!response.ok) return null

    const data = await response.json() as YahooQuoteResponse
    const quotes = data.chart?.result?.[0]?.indicators?.quote?.[0]
    
    if (quotes?.close) {
      // Find the closest date match
      const closePrices = quotes.close.filter(p => p !== null)
      return closePrices.length > 0 ? closePrices[Math.floor(closePrices.length / 2)] : null
    }

    return null
  } catch (error) {
    console.error(`Failed to get historical price for ${symbol}:`, error)
    return null
  }
}

