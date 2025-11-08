'use client'

import { useState } from 'react'

interface Module {
  id: number
  title: string
  level: string
  duration: string
  credits: number
  lessons: Lesson[]
}

interface Lesson {
  id: number
  title: string
  content: string
}

const modules: Module[] = [
  {
    id: 1,
    title: "Stock Market Basics",
    level: "Beginner",
    duration: "2 hours",
    credits: 0,
    lessons: [
      {
        id: 1,
        title: "What is the Stock Market?",
        content: `The stock market is where people buy and sell ownership in companies. When you buy a stock, you're buying a tiny piece of a company. If the company does well, your stock becomes more valuable. If it does poorly, your stock loses value.

Think of it like this: Imagine you and 99 friends start a lemonade stand together. You each own 1% of the business. If the business makes $100 profit, you each get $1. That's basically how stocks work, except with millions of people and big companies like Apple or Tesla.

The stock market exists so companies can raise money to grow, and investors can potentially make money by owning pieces of successful companies.`
      },
      {
        id: 2,
        title: "How Do Stock Prices Work?",
        content: `Stock prices go up and down based on supply and demand - just like anything else. If more people want to buy a stock than sell it, the price goes up. If more people want to sell than buy, the price goes down.

What makes people want to buy or sell? Many things:
• Company earnings (how much money they make)
• News about the company or industry
• Overall economy conditions
• Investor sentiment (how people feel)

This is why stock prices change every day, even every second. Millions of people are constantly deciding whether to buy or sell based on new information.`
      },
      {
        id: 3,
        title: "Reading Stock Quotes",
        content: `When you look at a stock, you'll see several numbers. Here's what they mean:

• Ticker Symbol: Short code for the company (like AAPL for Apple)
• Current Price: What one share costs right now
• Open: Price when market opened today
• High/Low: Highest and lowest prices today
• Volume: How many shares were traded
• Market Cap: Total value of all shares (price × number of shares)

Entry Price = What you paid
Current Price = What it's worth now  
Target Price = Where you think it will go

If Current is higher than Entry, you're making money. If it reaches Target, your prediction was right!`
      }
    ]
  },
  {
    id: 2,
    title: "AI-Powered Investing",
    level: "Intermediate",
    duration: "3 hours",
    credits: 10,
    lessons: [
      {
        id: 1,
        title: "How AI Picks Stocks",
        content: `Artificial Intelligence analyzes thousands of data points in seconds - something humans can't do. Here's what AI looks at:

1. Historical Patterns: AI studies how stocks behaved in the past under similar conditions
2. Financial Data: Revenue, profit, debt, growth rate - all the numbers
3. News & Sentiment: AI reads thousands of news articles and social media posts  
4. Market Correlations: How different stocks and sectors relate to each other
5. Technical Indicators: Chart patterns, volume, momentum

The AI then uses machine learning to predict which stocks are likely to go up. Different AI models use different strategies, which is why they don't all pick the same stocks.

In Market Oracle, 5 different AIs compete. Each has its own "style" of analyzing stocks, just like human investors have different strategies.`
      },
      {
        id: 2,
        title: "Understanding AI Confidence Scores",
        content: `Every AI pick comes with a confidence score (0-100%). This tells you how sure the AI is about the prediction.

• 80-100%: Very confident - AI sees strong signals
• 60-79%: Moderately confident - Good signals but some uncertainty
• 40-59%: Low confidence - Mixed signals
• Below 40%: Very uncertain - High risk

Important: High confidence doesn't guarantee success! The stock market is unpredictable. Even 95% confidence means 5% chance of being wrong.

Think of confidence like weather forecasting: "90% chance of rain" means it probably will rain, but there's still a 10% chance it won't.

Use confidence scores to:
• Decide how much to invest (more when AI is very confident)
• Understand the AI's reasoning
• Compare different AI predictions`
      },
      {
        id: 3,
        title: "AI vs Human Investors",
        content: `Both AI and humans have advantages:

AI Strengths:
• Process massive amounts of data instantly
• Never get emotional or tired
• Can spot complex patterns humans miss
• Analyze 24/7 without breaks

Human Strengths:
• Understand context and nuance
• Adapt to completely new situations
• Consider ethics and long-term impact
• Use common sense and intuition

Best Approach: Use AI as a powerful tool, but make final decisions yourself. AI gives you data-driven insights, but you understand your goals, risk tolerance, and personal situation.

In Market Oracle, you can see how different AIs think, learn from their reasoning, then decide what makes sense for you.`
      }
    ]
  },
  {
    id: 3,
    title: "Technical Analysis",
    level: "Intermediate",
    duration: "4 hours",
    credits: 15,
    lessons: [
      {
        id: 1,
        title: "Reading Stock Charts",
        content: `Charts show stock price history visually. The most common is the line chart showing price over time.

Candlestick Charts: Each "candle" represents one time period (day, hour, etc.)
• Green/White candle: Price went UP that period
• Red/Black candle: Price went DOWN that period
• Long body: Big price change
• Short body: Small price change

Support Level: Price where stock tends to stop falling (buyers step in)
Resistance Level: Price where stock tends to stop rising (sellers step in)

When you see a stock bounce between support and resistance repeatedly, that tells you where the "floor" and "ceiling" are. If it breaks through resistance, that's often bullish (good sign). If it breaks through support, that's bearish (bad sign).`
      },
      {
        id: 2,
        title: "Key Technical Indicators",
        content: `Technical indicators are mathematical calculations based on price and volume:

Moving Averages: Average price over X days
• 50-day MA: Short-term trend
• 200-day MA: Long-term trend
• When price crosses above MA = Bullish signal

RSI (Relative Strength Index): Measures if stock is overbought or oversold
• Above 70 = Overbought (might fall soon)
• Below 30 = Oversold (might rise soon)

Volume: How many shares traded
• High volume + price up = Strong buying
• High volume + price down = Strong selling
• Low volume = Weak move, might reverse

MACD: Shows momentum and trend direction
• MACD crosses above signal line = Buy signal
• MACD crosses below signal line = Sell signal`
      }
    ]
  },
  {
    id: 4,
    title: "Risk Management",
    level: "Advanced",
    duration: "3 hours",
    credits: 20,
    lessons: [
      {
        id: 1,
        title: "Understanding Risk",
        content: `All investing involves risk. The key is managing it intelligently.

Types of Risk:
• Market Risk: Overall market could crash
• Company Risk: Specific company could fail
• Liquidity Risk: Can't sell when you want to
• Timing Risk: Buying at wrong time

Risk Tolerance: How much loss can you handle emotionally and financially?
• High: Can handle 30-50% drops, longer time horizon
• Medium: Okay with 15-30% drops
• Low: Prefer stable investments, 5-15% max drop

Rule: Never invest money you'll need in the next 2-3 years. Stock market can be volatile short-term but historically grows long-term.`
      },
      {
        id: 2,
        title: "Stop Losses and Position Sizing",
        content: `Stop Loss: Automatic sell order if stock drops to certain price. This limits your maximum loss.

Example: You buy at $100 with 10% stop loss. If price drops to $90, it automatically sells. You lose $10 per share instead of potentially more.

Position Sizing: How much of your total money to put in one stock.

Conservative: 2-5% per stock (need 20-50 stocks for full portfolio)
Moderate: 5-10% per stock
Aggressive: 10-20% per stock (higher risk!)

Never put all money in one stock! If it fails, you lose everything. Diversification protects you.`
      },
      {
        id: 3,
        title: "The Risk/Reward Ratio",
        content: `Risk/Reward measures potential gain vs potential loss.

Formula: (Target Price - Entry Price) / (Entry Price - Stop Loss)

Example:
• Entry: $50
• Target: $60 (potential gain: $10)
• Stop Loss: $45 (potential loss: $5)
• Risk/Reward: $10/$5 = 2:1

Look for at least 2:1 ratio. This means even if you're wrong 50% of the time, you still make money overall.

In Market Oracle, you can see:
• Entry Price (where AI picked it)
• Current Price (what it is now)
• Target Price (AI's prediction)

Calculate your own Risk/Reward before following any AI pick!`
      }
    ]
  },
  {
    id: 5,
    title: "Paper Trading Mastery",
    level: "Intermediate",
    duration: "2 hours",
    credits: 10,
    lessons: [
      {
        id: 1,
        title: "Practice Before Risking Real Money",
        content: `Paper trading means trading with virtual money. It's like a video game where you practice investing without real risk.

Benefits:
• Learn by doing without losing real money
• Test different strategies
• Build confidence
• Understand your emotions when trading
• Track what works for you

In Market Oracle, you start with $100,000 virtual cash. Try following AI picks, making your own decisions, testing different approaches.

Track Everything:
• Why you bought
• Your expected target
• When you sold and why
• What you learned

After 3-6 months of successful paper trading, you might be ready for small real trades.`
      },
      {
        id: 2,
        title: "Building a Paper Trading Strategy",
        content: `Develop your own system:

1. Set Rules:
   • How much per trade (e.g., 5% of portfolio)
   • When to buy (e.g., AI confidence above 70%)
   • When to sell (e.g., 10% gain or 5% loss)

2. Follow Your Rules:
   • Don't break them because of emotions
   • Track every trade in a journal

3. Review Monthly:
   • What's working?
   • What's not?
   • Adjust rules based on results

4. Test Different Approaches:
   • Week 1-4: Follow AI picks exactly
   • Week 5-8: Mix AI picks with your research
   • Week 9-12: Your own strategy

Compare results to see what works best for you!`
      }
    ]
  },
  {
    id: 6,
    title: "Advanced Strategies",
    level: "Advanced",
    duration: "5 hours",
    credits: 25,
    lessons: [
      {
        id: 1,
        title: "Portfolio Diversification",
        content: `Don't put all eggs in one basket. Diversification reduces risk.

Diversify Across:
• Sectors: Tech, healthcare, finance, energy, etc.
• Company Sizes: Large cap, mid cap, small cap
• Geographies: US, international, emerging markets
• Asset Types: Stocks, bonds, real estate

Example Balanced Portfolio:
• 40% Large cap stocks (stable)
• 30% Mid/small cap stocks (growth)
• 20% International stocks
• 10% Bonds or cash (safety)

In Market Oracle, check the Sectors page to ensure you're not too concentrated in one industry. If tech crashes, you don't want 80% of portfolio in tech stocks!`
      },
      {
        id: 2,
        title: "Reading AI Consensus",
        content: `When multiple AIs agree on the same stock, that's consensus - and it's powerful.

Hot Picks page shows:
• 5 AI Agreement: ALL AIs picked it - strongest signal
• 4 AI Agreement: Very strong consensus
• 3 AI Agreement: Strong consensus
• 2 AI Agreement: Moderate agreement

Why Consensus Matters:
• Different AIs use different methods
• If they all reach same conclusion, more likely correct
• Reduces individual AI bias

Strategy: Focus on 3+ AI consensus picks for higher probability trades. These are the stocks where multiple independent analyses all point to the same opportunity.

But remember: Even strong consensus isn't guaranteed! Always do your own final check.`
      },
      {
        id: 3,
        title: "Long-term vs Short-term Investing",
        content: `Two main approaches:

Day Trading / Swing Trading (Short-term):
• Buy and sell within days or weeks
• Requires constant monitoring
• Higher stress, more trades
• Can make or lose money quickly
• Most people lose money day trading

Long-term Investing (Buy and Hold):
• Hold stocks for months or years
• Less time required
• Lower stress
• Historically more successful
• Compound gains over time

Market Oracle AI picks are generally short-to-medium term (weeks to months). The Target Price is where AI thinks stock will go within that timeframe.

Best for Beginners: Start with longer holding periods. Give your investments time to work. Most millionaire investors got rich slowly over decades, not overnight.`
      }
    ]
  }
]

export default function LearnPage() {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">📚 Learn</h1>
          <p className="text-gray-300">Master stock investing with AI-powered education</p>
        </div>

        {!selectedModule ? (
          /* Module Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map(module => (
              <div 
                key={module.id}
                onClick={() => {
                  setSelectedModule(module)
                  setSelectedLesson(module.lessons[0])
                }}
                className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-cyan-500/50 cursor-pointer transition-all hover:scale-105"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">{module.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    module.level === 'Beginner' ? 'bg-green-500/20 text-green-300' :
                    module.level === 'Intermediate' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-purple-500/20 text-purple-300'
                  }`}>
                    {module.level}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-300">
                  <div>⏱️ {module.duration}</div>
                  <div>📖 {module.lessons.length} lessons</div>
                  <div>{module.credits === 0 ? '🎉 FREE' : `💎 ${module.credits} credits`}</div>
                </div>
                <button className="mt-4 w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 rounded-lg">
                  Start Learning
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* Lesson Viewer */
          <div className="grid md:grid-cols-4 gap-6">
            {/* Lesson Sidebar */}
            <div className="md:col-span-1 bg-white/5 rounded-lg p-4 border border-white/10 h-fit">
              <button
                onClick={() => {
                  setSelectedModule(null)
                  setSelectedLesson(null)
                }}
                className="text-cyan-400 hover:text-cyan-300 mb-4"
              >
                ← Back to Modules
              </button>
              <h3 className="font-bold mb-2">{selectedModule.title}</h3>
              <div className="text-sm text-gray-400 mb-4">{selectedModule.lessons.length} Lessons</div>
              <div className="space-y-2">
                {selectedModule.lessons.map((lesson, idx) => (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={`w-full text-left p-2 rounded transition-all ${
                      selectedLesson?.id === lesson.id
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-xs text-gray-400">Lesson {idx + 1}</div>
                    <div className="text-sm">{lesson.title}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Lesson Content */}
            <div className="md:col-span-3 bg-white/5 rounded-lg p-8 border border-white/10">
              {selectedLesson && (
                <>
                  <h2 className="text-3xl font-bold mb-6">{selectedLesson.title}</h2>
                  <div className="prose prose-invert max-w-none">
                    {selectedLesson.content.split('\n\n').map((paragraph, idx) => (
                      <p key={idx} className="text-gray-300 leading-relaxed mb-4 whitespace-pre-line">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  <div className="mt-8 flex gap-4">
                    {selectedModule.lessons.indexOf(selectedLesson) > 0 && (
                      <button
                        onClick={() => {
                          const currentIdx = selectedModule.lessons.indexOf(selectedLesson)
                          setSelectedLesson(selectedModule.lessons[currentIdx - 1])
                        }}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg"
                      >
                        ← Previous Lesson
                      </button>
                    )}
                    {selectedModule.lessons.indexOf(selectedLesson) < selectedModule.lessons.length - 1 && (
                      <button
                        onClick={() => {
                          const currentIdx = selectedModule.lessons.indexOf(selectedLesson)
                          setSelectedLesson(selectedModule.lessons[currentIdx + 1])
                        }}
                        className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg"
                      >
                        Next Lesson →
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* What This Means */}
        {!selectedModule && (
          <div className="mt-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-6 border border-purple-500/30">
            <h2 className="text-2xl font-bold mb-4">💡 Why Learning Matters</h2>
            <div className="space-y-3 text-gray-300">
              <p>
                <strong className="text-white">Start with Basics (FREE)</strong> if you're new to stocks. This module teaches you everything needed to understand the stock market.
              </p>
              <p>
                <strong className="text-white">AI-Powered Investing</strong> explains how the 5 AIs in Market Oracle actually pick stocks. Learn to think like an AI investor!
              </p>
              <p>
                <strong className="text-white">Practice First</strong> with Paper Trading module before using real money. This saves you from expensive mistakes.
              </p>
              <p>
                Education is the best investment. Every hour spent learning can save you thousands of dollars in trading mistakes!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
