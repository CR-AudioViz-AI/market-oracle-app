#!/usr/bin/env node

/**
 * Market Oracle API Test Script
 * Tests all data infrastructure endpoints
 * Run: node test-api-endpoints.js
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Test helper
 */
async function test(name, fn) {
  process.stdout.write(`${colors.cyan}Testing:${colors.reset} ${name}... `);
  
  try {
    await fn();
    console.log(`${colors.green}✓ PASS${colors.reset}`);
    results.passed++;
    results.tests.push({ name, status: 'pass' });
  } catch (error) {
    console.log(`${colors.red}✗ FAIL${colors.reset}`);
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    results.failed++;
    results.tests.push({ name, status: 'fail', error: error.message });
  }
}

/**
 * Fetch helper with timeout
 */
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Test Stock Data Endpoint
 */
async function testStockData() {
  await test('Stock Data - Get Quote (AAPL)', async () => {
    const res = await fetchWithTimeout(`${API_BASE}/api/data/stocks?symbol=AAPL&function=GLOBAL_QUOTE`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    if (!data.symbol || !data.price) {
      throw new Error('Missing required fields in response');
    }
    
    if (data.symbol !== 'AAPL') {
      throw new Error('Incorrect symbol returned');
    }
  });

  await test('Stock Data - Get Intraday (MSFT)', async () => {
    const res = await fetchWithTimeout(`${API_BASE}/api/data/stocks?symbol=MSFT&function=TIME_SERIES_INTRADAY&interval=5min`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Missing or invalid data array');
    }
  });

  await test('Stock Data - Get Company Overview (GOOGL)', async () => {
    const res = await fetchWithTimeout(`${API_BASE}/api/data/stocks?symbol=GOOGL&function=OVERVIEW`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    if (!data.name || !data.sector) {
      throw new Error('Missing company info');
    }
  });
}

/**
 * Test Crypto Data Endpoint
 */
async function testCryptoData() {
  await test('Crypto Data - Get Price (Bitcoin)', async () => {
    const res = await fetchWithTimeout(`${API_BASE}/api/data/crypto?id=bitcoin&function=price`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    if (!data.price || !data.symbol) {
      throw new Error('Missing required fields in response');
    }
  });

  await test('Crypto Data - Get Market Chart (Ethereum)', async () => {
    const res = await fetchWithTimeout(`${API_BASE}/api/data/crypto?id=ethereum&function=market_chart&days=7`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    if (!data.prices || !Array.isArray(data.prices)) {
      throw new Error('Missing or invalid prices array');
    }
  });

  await test('Crypto Data - Get Trending', async () => {
    const res = await fetchWithTimeout(`${API_BASE}/api/data/crypto?function=trending`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    if (!data.trending || !Array.isArray(data.trending)) {
      throw new Error('Missing or invalid trending array');
    }
  });

  await test('Crypto Data - Get Global Data', async () => {
    const res = await fetchWithTimeout(`${API_BASE}/api/data/crypto?function=global`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    if (typeof data.totalMarketCap !== 'number') {
      throw new Error('Missing global market data');
    }
  });
}

/**
 * Test Market Summary Endpoint
 */
async function testMarketSummary() {
  await test('Market Summary - Get Full Summary', async () => {
    const res = await fetchWithTimeout(`${API_BASE}/api/data/market-summary`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    if (!data.indices || !data.stocks || !data.crypto || !data.sentiment) {
      throw new Error('Missing required sections in summary');
    }
    
    if (!Array.isArray(data.indices) || data.indices.length === 0) {
      throw new Error('Invalid or empty indices array');
    }
    
    if (!data.sentiment.overall) {
      throw new Error('Missing sentiment data');
    }
  });
}

/**
 * Test News Endpoint
 */
async function testNews() {
  await test('News - Get Market News', async () => {
    const res = await fetchWithTimeout(`${API_BASE}/api/data/news?query=stock+market&pageSize=5`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    if (!data.articles || !Array.isArray(data.articles)) {
      throw new Error('Missing or invalid articles array');
    }
    
    if (data.articles.length > 0) {
      const article = data.articles[0];
      if (!article.title || !article.sentiment) {
        throw new Error('Article missing required fields');
      }
    }
  });

  await test('News - Get with Category', async () => {
    const res = await fetchWithTimeout(`${API_BASE}/api/data/news?category=business&pageSize=5`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    if (!Array.isArray(data.articles)) {
      throw new Error('Invalid response structure');
    }
  });
}

/**
 * Test Search Endpoint
 */
async function testSearch() {
  await test('Search - Find Stock (Apple)', async () => {
    const res = await fetchWithTimeout(`${API_BASE}/api/data/search?query=AAPL&type=stock`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error('Missing or invalid results array');
    }
    
    if (data.results.length > 0) {
      const result = data.results[0];
      if (!result.symbol || !result.type) {
        throw new Error('Result missing required fields');
      }
    }
  });

  await test('Search - Find Crypto (Bitcoin)', async () => {
    const res = await fetchWithTimeout(`${API_BASE}/api/data/search?query=bitcoin&type=crypto`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    if (!Array.isArray(data.results)) {
      throw new Error('Invalid response structure');
    }
  });

  await test('Search - Unified Search', async () => {
    const res = await fetchWithTimeout(`${API_BASE}/api/data/search?query=tesla&type=all`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    if (!Array.isArray(data.results)) {
      throw new Error('Invalid response structure');
    }
  });
}

/**
 * Test Javari Predictions Endpoint
 */
async function testPredictions() {
  await test('Predictions - Get All', async () => {
    const res = await fetchWithTimeout(`${API_BASE}/api/javari/predictions?limit=10`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    if (!data.predictions || !data.stats) {
      throw new Error('Missing required fields in response');
    }
  });

  await test('Predictions - Create New', async () => {
    const prediction = {
      symbol: 'TEST',
      prediction_type: 'long',
      confidence: 0.75,
      timeframe_days: 7,
      reasoning: 'API test prediction'
    };
    
    const res = await fetchWithTimeout(
      `${API_BASE}/api/javari/predictions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prediction)
      }
    );
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    if (!data.success) {
      throw new Error('Prediction creation failed');
    }
  });
}

/**
 * Run all tests
 */
async function runTests() {
  console.log(`\n${colors.bold}${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  Market Oracle API Endpoint Tests${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}========================================${colors.reset}\n`);
  console.log(`Testing API at: ${colors.yellow}${API_BASE}${colors.reset}\n`);

  try {
    console.log(`${colors.bold}📊 Stock Data Endpoints${colors.reset}`);
    await testStockData();
    console.log('');

    console.log(`${colors.bold}₿ Crypto Data Endpoints${colors.reset}`);
    await testCryptoData();
    console.log('');

    console.log(`${colors.bold}📈 Market Summary Endpoint${colors.reset}`);
    await testMarketSummary();
    console.log('');

    console.log(`${colors.bold}📰 News Endpoint${colors.reset}`);
    await testNews();
    console.log('');

    console.log(`${colors.bold}🔍 Search Endpoint${colors.reset}`);
    await testSearch();
    console.log('');

    console.log(`${colors.bold}🤖 Javari Predictions Endpoint${colors.reset}`);
    await testPredictions();
    console.log('');
  } catch (error) {
    console.error(`\n${colors.red}Fatal error during tests:${colors.reset}`, error);
  }

  // Print summary
  console.log(`\n${colors.bold}${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  Test Summary${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}========================================${colors.reset}\n`);
  
  const total = results.passed + results.failed;
  const passRate = total > 0 ? (results.passed / total * 100).toFixed(1) : 0;
  
  console.log(`Total Tests: ${colors.bold}${total}${colors.reset}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`Pass Rate: ${colors.bold}${passRate}%${colors.reset}\n`);

  if (results.failed > 0) {
    console.log(`${colors.red}${colors.bold}FAILED TESTS:${colors.reset}`);
    results.tests
      .filter(t => t.status === 'fail')
      .forEach(t => {
        console.log(`${colors.red}  ✗ ${t.name}${colors.reset}`);
        if (t.error) {
          console.log(`    ${colors.red}${t.error}${colors.reset}`);
        }
      });
    console.log('');
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bold}✓ ALL TESTS PASSED!${colors.reset}\n`);
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  console.error(`\n${colors.red}${colors.bold}Unexpected error:${colors.reset}`, error);
  process.exit(1);
});
