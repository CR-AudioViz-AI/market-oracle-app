'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  GraduationCap,
  TrendingUp,
  DollarSign,
  Brain,
  Target,
  Shield,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Lock,
  Star,
  Clock,
  Award
} from 'lucide-react';

interface LearningModule {
  id: string;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  icon: React.ReactNode;
  color: string;
  locked: boolean;
  completed: boolean;
  credits: number;
  content: {
    sections: Array<{
      heading: string;
      content: string;
      keyPoints: string[];
    }>;
  };
}

const LEARNING_MODULES: LearningModule[] = [
  {
    id: 'basics',
    title: 'Stock Market Basics',
    description: 'Understanding the fundamentals of stock market investing',
    level: 'Beginner',
    duration: '15 min',
    icon: <BookOpen className="w-6 h-6" />,
    color: 'from-blue-500 to-cyan-500',
    locked: false,
    completed: false,
    credits: 0, // Free
    content: {
      sections: [
        {
          heading: 'What is the Stock Market?',
          content: 'The stock market is where investors connect to buy and sell shares of publicly traded companies. When you buy a stock, you\'re purchasing a small piece of ownership in that company.',
          keyPoints: [
            'Stocks represent partial ownership in a company',
            'Stock prices fluctuate based on supply and demand',
            'Major exchanges include NYSE and NASDAQ',
            'Market operates during specific trading hours (9:30 AM - 4:00 PM ET)',
            'Understanding market capitalization (Small, Mid, Large cap)'
          ]
        },
        {
          heading: 'How Stock Prices Work',
          content: 'Stock prices change throughout the trading day based on buying and selling activity. When more people want to buy a stock than sell it, the price goes up. When more want to sell than buy, the price goes down.',
          keyPoints: [
            'Prices reflect real-time supply and demand',
            'Company news and earnings reports impact prices',
            'Market sentiment affects overall stock movements',
            'Economic indicators influence market trends',
            'After-hours trading can affect next-day opening prices'
          ]
        },
        {
          heading: 'Types of Stocks',
          content: 'Stocks come in different varieties, each with unique characteristics and risk profiles. Understanding these categories helps you build a diversified portfolio.',
          keyPoints: [
            'Common stocks: Voting rights and potential dividends',
            'Preferred stocks: Higher dividend priority, less volatility',
            'Growth stocks: Focus on capital appreciation, higher risk',
            'Value stocks: Underpriced relative to fundamentals',
            'Dividend stocks: Regular income payments, more stable',
            'Blue-chip stocks: Established companies with solid track records'
          ]
        }
      ]
    }
  },
  {
    id: 'ai-investing',
    title: 'AI-Powered Stock Picking',
    description: 'How artificial intelligence analyzes stocks and makes predictions',
    level: 'Intermediate',
    duration: '20 min',
    icon: <Brain className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-500',
    locked: false,
    completed: false,
    credits: 10,
    content: {
      sections: [
        {
          heading: 'How AI Analyzes Stocks',
          content: 'AI models process vast amounts of data including financial statements, news articles, social media sentiment, and historical price patterns to identify investment opportunities.',
          keyPoints: [
            'Natural language processing analyzes news and reports',
            'Machine learning identifies patterns in historical data',
            'Sentiment analysis gauges market mood from social media',
            'Real-time data processing enables quick decisions',
            'Technical indicators are processed simultaneously',
            'AI can analyze thousands of stocks in seconds'
          ]
        },
        {
          heading: 'Understanding AI Confidence Levels',
          content: 'Each AI pick comes with a confidence score. Higher confidence doesn\'t guarantee success, but indicates stronger conviction based on the model\'s analysis.',
          keyPoints: [
            'Confidence scores range from 0-100%',
            'Multiple AIs agreeing increases overall confidence',
            'AI Consensus picks (3+ AIs) have higher success rates',
            'Low confidence picks can still be valuable with proper risk management',
            'Consider confidence alongside your own research'
          ]
        },
        {
          heading: 'Different AI Models',
          content: 'Market Oracle uses 5 different AI models, each with unique strengths. Understanding their differences helps you make informed decisions.',
          keyPoints: [
            'GPT-4: Strong fundamental analysis, good at earnings interpretation',
            'Claude: Balanced approach, excels at risk assessment',
            'Gemini: Technical analysis focus, pattern recognition',
            'Perplexity: Real-time news integration, market sentiment',
            'All models use different training data and methodologies',
            'Diversity in AI opinions reduces systemic bias'
          ]
        }
      ]
    }
  },
  {
    id: 'technical-analysis',
    title: 'Technical Analysis Fundamentals',
    description: 'Reading charts, patterns, and indicators like a pro',
    level: 'Intermediate',
    duration: '25 min',
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'from-green-500 to-emerald-500',
    locked: true,
    completed: false,
    credits: 15,
    content: {
      sections: [
        {
          heading: 'Chart Patterns',
          content: 'Technical analysts identify recurring patterns in price charts that suggest future price movements.',
          keyPoints: [
            'Head and shoulders: Reversal pattern',
            'Double top/bottom: Trend reversal signals',
            'Triangles: Continuation or reversal patterns',
            'Cup and handle: Bullish continuation pattern',
            'Flags and pennants: Short-term continuation patterns'
          ]
        },
        {
          heading: 'Key Technical Indicators',
          content: 'Indicators are mathematical calculations based on price and volume that help identify trends and potential entry/exit points.',
          keyPoints: [
            'Moving Averages (MA): Identify trend direction',
            'Relative Strength Index (RSI): Overbought/oversold conditions',
            'MACD: Momentum and trend strength',
            'Bollinger Bands: Volatility and price levels',
            'Volume: Confirms price movements'
          ]
        },
        {
          heading: 'Support and Resistance',
          content: 'Support and resistance levels are price points where stocks tend to reverse direction, creating trading opportunities.',
          keyPoints: [
            'Support: Price floor where buying interest emerges',
            'Resistance: Price ceiling where selling pressure increases',
            'Previous highs/lows often become support/resistance',
            'Breakouts above resistance can signal strong uptrends',
            'Breaking support levels may indicate further declines'
          ]
        }
      ]
    }
  },
  {
    id: 'risk-management',
    title: 'Risk Management Strategies',
    description: 'Protecting your capital while maximizing returns',
    level: 'Advanced',
    duration: '30 min',
    icon: <Shield className="w-6 h-6" />,
    color: 'from-yellow-500 to-orange-500',
    locked: true,
    completed: false,
    credits: 20,
    content: {
      sections: [
        {
          heading: 'Position Sizing',
          content: 'Never risk more than you can afford to lose. Proper position sizing is the foundation of risk management.',
          keyPoints: [
            'Risk 1-2% of portfolio per trade',
            'Larger accounts can risk smaller percentages',
            'Adjust position size based on volatility',
            'Consider correlation between positions',
            'Don\'t over-concentrate in one stock or sector'
          ]
        },
        {
          heading: 'Stop Loss Strategies',
          content: 'Stop losses automatically exit positions when prices move against you, limiting potential losses.',
          keyPoints: [
            'Set stops at technical levels (support/resistance)',
            'Percentage-based stops (e.g., -8% from entry)',
            'Trailing stops lock in profits as prices rise',
            'Mental stops require discipline to execute',
            'Avoid setting stops at obvious levels (round numbers)'
          ]
        },
        {
          heading: 'Portfolio Diversification',
          content: 'Don\'t put all your eggs in one basket. Diversification reduces risk by spreading investments across different assets.',
          keyPoints: [
            'Invest across multiple sectors',
            'Mix of growth and value stocks',
            'Different market capitalizations',
            'Consider international exposure',
            'Balance with bonds or other assets',
            'Rebalance periodically to maintain targets'
          ]
        }
      ]
    }
  },
  {
    id: 'paper-trading',
    title: 'Master Paper Trading',
    description: 'Practice trading without risking real money',
    level: 'Beginner',
    duration: '20 min',
    icon: <Target className="w-6 h-6" />,
    color: 'from-indigo-500 to-purple-500',
    locked: true,
    completed: false,
    credits: 10,
    content: {
      sections: [
        {
          heading: 'Why Paper Trade?',
          content: 'Paper trading lets you test strategies and learn market mechanics without financial risk. It\'s essential for developing your skills.',
          keyPoints: [
            'Practice with virtual money ($100,000 starting balance)',
            'Test different trading strategies risk-free',
            'Build confidence before using real money',
            'Track your performance over time',
            'Learn from mistakes without consequences',
            'Develop discipline and emotional control'
          ]
        },
        {
          heading: 'Setting Up Your Strategy',
          content: 'Successful paper trading requires treating it like real money. Set clear rules and stick to them.',
          keyPoints: [
            'Define entry and exit criteria',
            'Set position size limits',
            'Establish stop loss and take profit levels',
            'Keep a trading journal',
            'Review trades regularly',
            'Adjust strategy based on results'
          ]
        },
        {
          heading: 'Transitioning to Real Money',
          content: 'Once you\'re consistently profitable in paper trading, you can consider moving to real money trading with small amounts.',
          keyPoints: [
            'Achieve 3+ months of profitable paper trading',
            'Start with small real money positions',
            'Expect psychology to differ with real money',
            'Continue paper trading new strategies',
            'Scale up gradually as confidence grows',
            'Never invest more than you can afford to lose'
          ]
        }
      ]
    }
  },
  {
    id: 'advanced-strategies',
    title: 'Advanced Trading Strategies',
    description: 'Professional techniques for experienced traders',
    level: 'Advanced',
    duration: '35 min',
    icon: <GraduationCap className="w-6 h-6" />,
    color: 'from-red-500 to-pink-500',
    locked: true,
    completed: false,
    credits: 25,
    content: {
      sections: [
        {
          heading: 'Swing Trading',
          content: 'Swing trading involves holding positions for several days to weeks, capitalizing on short to medium-term price movements.',
          keyPoints: [
            'Hold positions for 2-14 days typically',
            'Focus on technical analysis and chart patterns',
            'Requires less time than day trading',
            'Look for momentum and trend continuation',
            'Set clear entry, stop loss, and profit targets',
            'Works well with AI picks showing strong momentum'
          ]
        },
        {
          heading: 'Options Strategies',
          content: 'Options provide leverage and flexibility but require understanding of complex mechanics and risks.',
          keyPoints: [
            'Covered calls: Generate income on existing positions',
            'Cash-secured puts: Acquire stocks at discount',
            'Protective puts: Insurance against downside',
            'Spreads: Defined risk and reward',
            'Options decay over time (theta)',
            'Understand implied volatility before trading'
          ]
        },
        {
          heading: 'AI-Enhanced Strategies',
          content: 'Combine AI insights with traditional strategies for potentially superior results.',
          keyPoints: [
            'Follow AI Consensus picks for higher probability',
            'Use AI as confirmation for technical setups',
            'Weight positions by AI confidence levels',
            'Combine multiple AI opinions for diversification',
            'Monitor AI performance across different market conditions',
            'Adjust strategy based on which AIs perform best'
          ]
        }
      ]
    }
  }
];

export default function LearnPage() {
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [userCredits, setUserCredits] = useState(50); // Demo credits
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  const handleUnlockModule = (module: LearningModule) => {
    if (module.credits === 0 || !module.locked) {
      setSelectedModule(module);
      return;
    }

    if (userCredits >= module.credits) {
      if (confirm(`Unlock "${module.title}" for ${module.credits} credits?`)) {
        setUserCredits(userCredits - module.credits);
        module.locked = false;
        setSelectedModule(module);
      }
    } else {
      alert(`You need ${module.credits - userCredits} more credits to unlock this module.`);
    }
  };

  const handleCompleteModule = () => {
    if (selectedModule) {
      selectedModule.completed = true;
      alert('Congratulations! Module completed! 🎉');
      setSelectedModule(null);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'text-green-400 border-green-500/30';
      case 'Intermediate': return 'text-yellow-400 border-yellow-500/30';
      case 'Advanced': return 'text-red-400 border-red-500/30';
      default: return 'text-gray-400 border-gray-500/30';
    }
  };

  if (selectedModule) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="outline"
          onClick={() => setSelectedModule(null)}
          className="mb-6 border-gray-700"
        >
          ← Back to Modules
        </Button>

        <Card className="bg-slate-800/50 border-purple-500/20 mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-xl bg-gradient-to-r ${selectedModule.color}`}>
                  {selectedModule.icon}
                </div>
                <div>
                  <CardTitle className="text-3xl text-white mb-2">{selectedModule.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getLevelColor(selectedModule.level)}>
                      {selectedModule.level}
                    </Badge>
                    <Badge variant="outline" className="text-gray-400 border-gray-600">
                      <Clock className="w-3 h-3 mr-1" />
                      {selectedModule.duration}
                    </Badge>
                  </div>
                </div>
              </div>
              {selectedModule.completed && (
                <Badge variant="outline" className="text-green-400 border-green-500/30">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Content Sections */}
        <div className="space-y-4">
          {selectedModule.content.sections.map((section, idx) => (
            <Card key={idx} className="bg-slate-800/50 border-purple-500/20">
              <CardHeader
                className="cursor-pointer hover:bg-slate-700/30 transition-colors"
                onClick={() => setExpandedSection(expandedSection === idx ? null : idx)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-white">{section.heading}</CardTitle>
                  <ArrowRight className={`w-5 h-5 transition-transform ${expandedSection === idx ? 'rotate-90' : ''}`} />
                </div>
              </CardHeader>
              {expandedSection === idx && (
                <CardContent>
                  <p className="text-gray-300 mb-4">{section.content}</p>
                  <div className="space-y-2">
                    <h4 className="font-bold text-white mb-2">Key Points:</h4>
                    {section.keyPoints.map((point, pointIdx) => (
                      <div key={pointIdx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <p className="text-gray-300">{point}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {!selectedModule.completed && (
          <div className="mt-8">
            <Button
              onClick={handleCompleteModule}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 py-6 text-lg"
            >
              <Award className="w-5 h-5 mr-2" />
              Mark as Complete
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          📚 Learning Center
        </h1>
        <p className="text-xl text-gray-300 mb-2">Master the art of stock investing</p>
        <p className="text-gray-400">From basics to advanced strategies - everything you need to succeed</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-slate-800/50 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-400">{LEARNING_MODULES.length}</div>
            <div className="text-sm text-gray-400">Total Modules</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-green-500/20">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-400">
              {LEARNING_MODULES.filter(m => m.completed).length}
            </div>
            <div className="text-sm text-gray-400">Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-400">
              {LEARNING_MODULES.reduce((sum, m) => sum + m.content.sections.length, 0)}
            </div>
            <div className="text-sm text-gray-400">Lessons</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-yellow-400" />
              <div className="text-3xl font-bold text-yellow-400">{userCredits}</div>
            </div>
            <div className="text-sm text-gray-400">Your Credits</div>
          </CardContent>
        </Card>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {LEARNING_MODULES.map((module) => (
          <Card
            key={module.id}
            className={`bg-slate-800/50 border-purple-500/20 hover:border-purple-500/50 transition-all ${
              !module.locked ? 'cursor-pointer hover:scale-105' : 'opacity-75'
            }`}
            onClick={() => !module.locked && handleUnlockModule(module)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${module.color}`}>
                  {module.icon}
                </div>
                {module.locked ? (
                  <Lock className="w-5 h-5 text-gray-500" />
                ) : module.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : null}
              </div>

              <h3 className="text-xl font-bold mb-2 text-white">{module.title}</h3>
              <p className="text-sm text-gray-400 mb-4">{module.description}</p>

              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className={getLevelColor(module.level)}>
                  {module.level}
                </Badge>
                <Badge variant="outline" className="text-gray-400 border-gray-600">
                  <Clock className="w-3 h-3 mr-1" />
                  {module.duration}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                {module.locked ? (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnlockModule(module);
                    }}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  >
                    <DollarSign className="w-4 h-4 mr-1" />
                    Unlock ({module.credits} credits)
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {module.completed ? 'Review' : 'Start Learning'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Get More Credits CTA */}
      <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 mt-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Need More Credits?</h3>
              <p className="text-gray-300">
                Earn credits by completing paper trades, voting on picks, or upgrade your account
              </p>
            </div>
            <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
              Get Credits
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
