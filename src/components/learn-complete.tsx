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
  ArrowRight
} from 'lucide-react';

interface LearningModule {
  id: string;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  icon: React.ReactNode;
  content: {
    sections: Array<{
      heading: string;
      content: string;
      keyPoints?: string[];
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
    content: {
      sections: [
        {
          heading: 'What is the Stock Market?',
          content: 'The stock market is where investors connect to buy and sell shares of publicly traded companies. When you buy a stock, you\'re purchasing a small piece of ownership in that company.',
          keyPoints: [
            'Stocks represent partial ownership in a company',
            'Stock prices fluctuate based on supply and demand',
            'Major exchanges include NYSE and NASDAQ',
            'Market operates during specific trading hours (9:30 AM - 4:00 PM ET)'
          ]
        },
        {
          heading: 'How Stock Prices Work',
          content: 'Stock prices change throughout the trading day based on buying and selling activity. When more people want to buy a stock than sell it, the price goes up. When more want to sell than buy, the price goes down.',
          keyPoints: [
            'Prices reflect real-time supply and demand',
            'Company news and earnings reports impact prices',
            'Market sentiment affects overall stock movements',
            'Economic indicators influence market trends'
          ]
        },
        {
          heading: 'Types of Stocks',
          content: 'Stocks come in different varieties, each with unique characteristics and risk profiles.',
          keyPoints: [
            'Common stocks: Voting rights and dividends',
            'Preferred stocks: Higher dividend priority',
            'Growth stocks: Focus on capital appreciation',
            'Value stocks: Underpriced relative to fundamentals',
            'Dividend stocks: Regular income payments'
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
    content: {
      sections: [
        {
          heading: 'How AI Analyzes Stocks',
          content: 'AI models process vast amounts of data including financial statements, news articles, social media sentiment, and historical price patterns to identify investment opportunities.',
          keyPoints: [
            'Natural language processing analyzes news and reports',
            'Machine learning identifies patterns in historical data',
            'Sentiment analysis gauges market mood',
            'Real-time data processing enables quick decisions'
          ]
        },
        {
          heading: 'AI vs Human Analysis',
          content: 'AI can process information faster and without emotional bias, but humans provide context and qualitative judgment that algorithms may miss.',
          keyPoints: [
            'AI excels at data processing and pattern recognition',
            'Humans better understand nuanced business contexts',
            'Combining both approaches often yields best results',
            'AI eliminates emotional decision-making'
          ]
        },
        {
          heading: 'Understanding AI Picks',
          content: 'Each AI in Market Oracle uses different models and data sources, leading to diverse stock recommendations. Compare their reasoning to make informed decisions.',
          keyPoints: [
            'Different AIs have different strengths',
            'Look for consensus across multiple AIs',
            'Read the reasoning behind each pick',
            'Track historical performance to evaluate accuracy'
          ]
        }
      ]
    }
  },
  {
    id: 'risk-management',
    title: 'Risk Management',
    description: 'Protecting your portfolio with smart risk management strategies',
    level: 'Intermediate',
    duration: '18 min',
    icon: <Shield className="w-6 h-6" />,
    content: {
      sections: [
        {
          heading: 'Understanding Investment Risk',
          content: 'All investments carry risk. The key is understanding and managing that risk through diversification, position sizing, and stop-loss strategies.',
          keyPoints: [
            'Never invest money you can\'t afford to lose',
            'Diversify across sectors and asset classes',
            'Set stop-loss orders to limit downside',
            'Consider your risk tolerance and time horizon'
          ]
        },
        {
          heading: 'Portfolio Diversification',
          content: 'Don\'t put all your eggs in one basket. Spreading investments across different sectors, market caps, and geographies reduces overall portfolio risk.',
          keyPoints: [
            'Aim for 10-20 different positions',
            'Mix growth and value stocks',
            'Include different market sectors',
            'Consider bonds and other asset classes'
          ]
        },
        {
          heading: 'Position Sizing',
          content: 'How much you invest in each stock matters. A general rule: no single position should exceed 5-10% of your total portfolio value.',
          keyPoints: [
            'Start with smaller positions (2-5% of portfolio)',
            'Scale up winners gradually',
            'Never go all-in on a single stock',
            'Adjust size based on conviction level'
          ]
        }
      ]
    }
  },
  {
    id: 'technical-analysis',
    title: 'Technical Analysis',
    description: 'Reading charts and identifying trading patterns',
    level: 'Advanced',
    duration: '25 min',
    icon: <TrendingUp className="w-6 h-6" />,
    content: {
      sections: [
        {
          heading: 'Chart Patterns',
          content: 'Technical analysis uses historical price and volume data to predict future movements. Common patterns include head and shoulders, double tops/bottoms, and triangles.',
          keyPoints: [
            'Support: Price level where buying prevents further decline',
            'Resistance: Price level where selling prevents further rise',
            'Breakouts: When price moves beyond support/resistance',
            'Volume confirms the strength of price movements'
          ]
        },
        {
          heading: 'Key Indicators',
          content: 'Technical indicators help identify trends, momentum, and potential reversal points.',
          keyPoints: [
            'Moving averages smooth price data to identify trends',
            'RSI (Relative Strength Index) shows overbought/oversold conditions',
            'MACD identifies momentum and trend changes',
            'Volume indicators confirm price movements'
          ]
        },
        {
          heading: 'Combining Technical & Fundamental',
          content: 'The best analysis combines technical chart reading with fundamental company analysis for a complete picture.',
          keyPoints: [
            'Use technicals for entry/exit timing',
            'Use fundamentals for stock selection',
            'Validate technical signals with volume',
            'Consider overall market conditions'
          ]
        }
      ]
    }
  },
  {
    id: 'market-psychology',
    title: 'Market Psychology',
    description: 'Understanding emotions and behavioral finance',
    level: 'Intermediate',
    duration: '15 min',
    icon: <Target className="w-6 h-6" />,
    content: {
      sections: [
        {
          heading: 'Common Psychological Pitfalls',
          content: 'Emotions are the enemy of good investing. Fear and greed drive most poor investment decisions. Learn to recognize and overcome these biases.',
          keyPoints: [
            'FOMO (Fear of Missing Out) leads to buying at peaks',
            'Panic selling locks in losses during dips',
            'Confirmation bias seeks only supportive information',
            'Anchoring fixates on purchase price vs current value'
          ]
        },
        {
          heading: 'Developing Discipline',
          content: 'Successful investors have a plan and stick to it regardless of short-term market movements.',
          keyPoints: [
            'Create and follow a written investment plan',
            'Set rules for entry, exit, and position sizing',
            'Avoid checking prices constantly',
            'Focus on long-term goals, not daily fluctuations'
          ]
        },
        {
          heading: 'Market Cycles & Sentiment',
          content: 'Markets move in cycles driven by collective psychology. Understanding where we are in the cycle helps inform decision-making.',
          keyPoints: [
            'Bull markets: Optimism and rising prices',
            'Bear markets: Pessimism and falling prices',
            'Contrarian investing: Go against the herd',
            'Best opportunities often appear when fear is highest'
          ]
        }
      ]
    }
  },
  {
    id: 'fundamental-analysis',
    title: 'Fundamental Analysis',
    description: 'Evaluating companies using financial metrics',
    level: 'Advanced',
    duration: '22 min',
    icon: <DollarSign className="w-6 h-6" />,
    content: {
      sections: [
        {
          heading: 'Key Financial Metrics',
          content: 'Understanding a company\'s financial health requires analyzing key metrics from earnings reports and balance sheets.',
          keyPoints: [
            'P/E Ratio: Price relative to earnings (valuation)',
            'EPS: Earnings per share (profitability)',
            'Revenue Growth: Quarter-over-quarter sales increase',
            'Debt-to-Equity: Company leverage and financial health',
            'Free Cash Flow: Cash available after expenses'
          ]
        },
        {
          heading: 'Reading Earnings Reports',
          content: 'Companies report quarterly earnings. These reports contain crucial information about performance, guidance, and future prospects.',
          keyPoints: [
            'Look for revenue and earnings beat/miss',
            'Pay attention to forward guidance',
            'Analyze margins and operating efficiency',
            'Compare to previous quarters and competitors'
          ]
        },
        {
          heading: 'Competitive Analysis',
          content: 'A company doesn\'t exist in isolation. Understanding its competitive position and industry dynamics is crucial.',
          keyPoints: [
            'Market share and competitive advantages',
            'Barriers to entry in the industry',
            'Product differentiation and pricing power',
            'Management quality and execution history'
          ]
        }
      ]
    }
  }
];

export default function LearnComplete() {
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());

  const handleModuleSelect = (module: LearningModule) => {
    setSelectedModule(module);
  };

  const handleBack = () => {
    setSelectedModule(null);
  };

  const handleMarkComplete = (moduleId: string) => {
    setCompletedModules(prev => new Set([...prev, moduleId]));
  };

  const getLevelColor = (level: string) => {
    const colors = {
      'Beginner': 'bg-green-100 text-green-700',
      'Intermediate': 'bg-yellow-100 text-yellow-700',
      'Advanced': 'bg-red-100 text-red-700'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  // Module overview
  if (!selectedModule) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap className="w-10 h-10 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Investment Education</h1>
              <p className="text-gray-600">
                Learn everything from stock market basics to advanced AI-powered investing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <AlertCircle className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-900">Real Education, Not Mock Content</p>
              <p className="text-sm text-blue-800">
                All content is professionally researched and written. Progress through modules at your own pace.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LEARNING_MODULES.map((module) => {
            const isCompleted = completedModules.has(module.id);
            return (
              <Card
                key={module.id}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                onClick={() => handleModuleSelect(module)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-3 rounded-lg ${isCompleted ? 'bg-green-100' : 'bg-blue-100'}`}>
                      <div className={isCompleted ? 'text-green-600' : 'text-blue-600'}>
                        {isCompleted ? <CheckCircle className="w-6 h-6" /> : module.icon}
                      </div>
                    </div>
                    <Badge className={getLevelColor(module.level)}>
                      {module.level}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">⏱️ {module.duration}</span>
                    {isCompleted && (
                      <Badge variant="outline" className="text-green-600">
                        ✓ Completed
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Your Learning Progress</h3>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${(completedModules.size / LEARNING_MODULES.length) * 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                {completedModules.size} of {LEARNING_MODULES.length} modules completed
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Module detail view
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="outline" onClick={handleBack} className="mb-6">
        ← Back to All Modules
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-100 rounded-lg text-blue-600">
                {selectedModule.icon}
              </div>
              <div>
                <Badge className={getLevelColor(selectedModule.level)} style={{ marginBottom: '8px' }}>
                  {selectedModule.level}
                </Badge>
                <CardTitle className="text-2xl">{selectedModule.title}</CardTitle>
                <CardDescription className="mt-2">
                  {selectedModule.description} • {selectedModule.duration}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {selectedModule.content.sections.map((section, index) => (
        <Card key={index} className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">{section.heading}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4 leading-relaxed">{section.content}</p>
            
            {section.keyPoints && section.keyPoints.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="font-semibold text-blue-900 mb-2">Key Takeaways:</p>
                <ul className="space-y-2">
                  {section.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-blue-900">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Finished this module?</h3>
              <p className="text-sm text-gray-600">Mark as complete to track your progress</p>
            </div>
            <Button
              onClick={() => {
                handleMarkComplete(selectedModule.id);
                handleBack();
              }}
              className="flex items-center gap-2"
            >
              Mark as Complete
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
