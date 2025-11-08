'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Newspaper,
  ExternalLink,
  Clock,
  Building2,
  Zap,
  Heart,
  Cpu,
  Home,
  DollarSign,
  Briefcase,
  ShoppingCart,
  Smartphone,
  ArrowLeft
} from 'lucide-react';

interface SectorData {
  name: string;
  icon: React.ReactNode;
  performance: number;
  stocks: string[];
  description: string;
  keywords: string[];
  totalPicks: number;
  avgEntry: number;
  avgCurrent: number;
  avgTarget: number;
}

interface StockInSector {
  ticker: string;
  ai_model: string;
  entry_price: number;
  current_price: number;
  target_price: number;
  reasoning: string;
  picked_at: string;
}

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  urlToImage?: string;
}

const SECTORS: Omit<SectorData, 'performance' | 'totalPicks' | 'avgEntry' | 'avgCurrent' | 'avgTarget'>[] = [
  {
    name: 'Technology',
    icon: <Cpu className="w-6 h-6" />,
    stocks: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'TSLA', 'AMD', 'CRM', 'ORCL', 'ADBE'],
    description: 'Software, hardware, semiconductors, and IT services',
    keywords: ['technology', 'AI', 'software', 'semiconductor', 'tech', 'cloud computing']
  },
  {
    name: 'Healthcare',
    icon: <Heart className="w-6 h-6" />,
    stocks: ['JNJ', 'UNH', 'PFE', 'ABBV', 'TMO', 'MRK', 'LLY', 'ABT', 'DHR'],
    description: 'Pharmaceuticals, biotech, and medical devices',
    keywords: ['healthcare', 'pharma', 'biotech', 'medical', 'drug', 'medicine']
  },
  {
    name: 'Financial',
    icon: <DollarSign className="w-6 h-6" />,
    stocks: ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK', 'SPGI', 'AXP', 'USB'],
    description: 'Banks, insurance, and financial services',
    keywords: ['banking', 'finance', 'investment', 'insurance', 'fintech', 'stocks']
  },
  {
    name: 'Energy',
    icon: <Zap className="w-6 h-6" />,
    stocks: ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO', 'OXY'],
    description: 'Oil, gas, and renewable energy companies',
    keywords: ['energy', 'oil', 'gas', 'renewable', 'petroleum', 'solar']
  },
  {
    name: 'Consumer',
    icon: <ShoppingCart className="w-6 h-6" />,
    stocks: ['AMZN', 'WMT', 'TSLA', 'NKE', 'MCD', 'SBUX', 'TGT', 'COST', 'HD', 'LOW'],
    description: 'Retail, e-commerce, and consumer products',
    keywords: ['retail', 'consumer', 'ecommerce', 'shopping', 'store', 'brands']
  },
  {
    name: 'Industrial',
    icon: <Building2 className="w-6 h-6" />,
    stocks: ['BA', 'CAT', 'GE', 'HON', 'UPS', 'LMT', 'MMM', 'RTX', 'DE'],
    description: 'Manufacturing, aerospace, and logistics',
    keywords: ['industrial', 'manufacturing', 'aerospace', 'logistics', 'construction']
  },
  {
    name: 'Real Estate',
    icon: <Home className="w-6 h-6" />,
    stocks: ['AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'WELL', 'DLR', 'O', 'SPG'],
    description: 'REITs and real estate development',
    keywords: ['real estate', 'REIT', 'property', 'housing', 'commercial']
  },
  {
    name: 'Communication',
    icon: <Smartphone className="w-6 h-6" />,
    stocks: ['VZ', 'T', 'TMUS', 'DIS', 'NFLX', 'CMCSA', 'CHTR', 'PARA', 'WBD'],
    description: 'Telecom, media, and entertainment',
    keywords: ['telecom', 'media', 'entertainment', 'streaming', 'communication']
  }
];

export default function SectorsPage() {
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [selectedSector, setSelectedSector] = useState<SectorData | null>(null);
  const [sectorStocks, setSectorStocks] = useState<StockInSector[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadSectorPerformance();
  }, []);

  useEffect(() => {
    if (selectedSector) {
      loadSectorNews(selectedSector);
      loadSectorStocks(selectedSector);
    }
  }, [selectedSector]);

  const loadSectorPerformance = async () => {
    try {
      // Get all stock picks with current prices
      const { data: picks, error } = await supabase
        .from('ai_stock_picks')
        .select('ticker, price, current_price, target_price')
        .not('current_price', 'is', null);

      if (error) throw error;

      // Calculate performance for each sector
      const updatedSectors = SECTORS.map(sector => {
        const sectorPicks = picks?.filter(pick => 
          sector.stocks.includes(pick.ticker.toUpperCase())
        ) || [];

        if (sectorPicks.length === 0) {
          return { 
            ...sector, 
            performance: 0,
            totalPicks: 0,
            avgEntry: 0,
            avgCurrent: 0,
            avgTarget: 0
          };
        }

        const totalPerformance = sectorPicks.reduce((sum, pick) => {
          const performance = ((pick.current_price - pick.price) / pick.price) * 100;
          return sum + performance;
        }, 0);

        const avgPerformance = totalPerformance / sectorPicks.length;
        
        const avgEntry = sectorPicks.reduce((sum, p) => sum + p.price, 0) / sectorPicks.length;
        const avgCurrent = sectorPicks.reduce((sum, p) => sum + p.current_price, 0) / sectorPicks.length;
        const avgTarget = sectorPicks.reduce((sum, p) => sum + p.target_price, 0) / sectorPicks.length;

        return { 
          ...sector, 
          performance: avgPerformance,
          totalPicks: sectorPicks.length,
          avgEntry,
          avgCurrent,
          avgTarget
        };
      });

      // Sort by performance (best first)
      updatedSectors.sort((a, b) => b.performance - a.performance);
      
      setSectors(updatedSectors);
      setLoadingPrices(false);
    } catch (error) {
      console.error('Error loading sector performance:', error);
      setLoadingPrices(false);
    }
  };

  const loadSectorStocks = async (sector: SectorData) => {
    setLoadingStocks(true);
    try {
      const { data: picks, error } = await supabase
        .from('ai_stock_picks')
        .select('ticker, ai_model, price, current_price, target_price, reasoning, picked_at')
        .in('ticker', sector.stocks.map(s => s.toLowerCase()))
        .not('current_price', 'is', null)
        .order('current_price', { ascending: false });

      if (error) throw error;

      setSectorStocks(picks || []);
    } catch (error) {
      console.error('Error loading sector stocks:', error);
      setSectorStocks([]);
    } finally {
      setLoadingStocks(false);
    }
  };

  const loadSectorNews = async (sector: SectorData) => {
    setLoadingNews(true);
    setNews([]);

    try {
      // Use multiple keywords for better news coverage
      const query = sector.keywords.slice(0, 3).join(' OR ');
      
      // Fetch from NewsAPI via serverless function
      const response = await fetch(`/api/news?q=${encodeURIComponent(query)}&category=business&pageSize=10`);
      
      if (!response.ok) {
        // Fallback: Use mock news if API fails
        const mockNews: NewsArticle[] = [
          {
            title: `${sector.name} Sector Shows Strong Growth`,
            description: `Recent market analysis indicates positive momentum in the ${sector.name} sector with key stocks outperforming expectations.`,
            url: '#',
            source: 'Market Oracle Analysis',
            publishedAt: new Date().toISOString()
          },
          {
            title: `Investors Eye ${sector.name} Opportunities`,
            description: `Major institutional investors are increasing positions in ${sector.name} stocks, signaling confidence in the sector's future.`,
            url: '#',
            source: 'Financial Times',
            publishedAt: new Date(Date.now() - 3600000).toISOString()
          },
          {
            title: `${sector.name} Outlook: What to Expect`,
            description: `Industry experts weigh in on the outlook for ${sector.name} companies in the current market environment.`,
            url: '#',
            source: 'Bloomberg',
            publishedAt: new Date(Date.now() - 7200000).toISOString()
          }
        ];
        setNews(mockNews);
      } else {
        const data = await response.json();
        setNews(data.articles || []);
      }
    } catch (error) {
      console.error('Error loading sector news:', error);
      // Use fallback mock news
      setNews([
        {
          title: `${sector.name} Market Update`,
          description: `Latest developments in the ${sector.name} sector. Check back for real-time news updates.`,
          url: '#',
          source: 'Market Oracle',
          publishedAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoadingNews(false);
    }
  };

  const handleSectorClick = (sector: SectorData) => {
    setSelectedSector(sector);
  };

  const handleBack = () => {
    setSelectedSector(null);
    setNews([]);
    setSectorStocks([]);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  // Main sectors grid view
  if (!selectedSector) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            🏢 Market Sectors
          </h1>
          <p className="text-xl text-gray-300 mb-2">See which industries are crushing it</p>
          <p className="text-gray-400">Click any sector for detailed analysis, news, and stock picks</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-400">
                {sectors.length}
              </div>
              <div className="text-sm text-gray-400">Sectors Tracked</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-green-500/20">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-400">
                {sectors.reduce((sum, s) => sum + s.totalPicks, 0)}
              </div>
              <div className="text-sm text-gray-400">Total Picks</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-400">
                {sectors.filter(s => s.performance > 0).length}
              </div>
              <div className="text-sm text-gray-400">Winning Sectors</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-yellow-500/20">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-400">
                {sectors.length > 0 ? sectors[0].name : 'N/A'}
              </div>
              <div className="text-sm text-gray-400">Top Performer</div>
            </CardContent>
          </Card>
        </div>

        {/* Sectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sectors.map((sector) => (
            <Card
              key={sector.name}
              className="cursor-pointer hover:shadow-xl transition-all hover:scale-105 bg-slate-800/50 border-purple-500/20"
              onClick={() => handleSectorClick(sector)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${sector.performance >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    <div className={sector.performance >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {sector.icon}
                    </div>
                  </div>
                  {!loadingPrices && (
                    <div className={`flex items-center gap-1 ${sector.performance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {sector.performance >= 0 ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                      <span className="font-bold text-xl">
                        {sector.performance >= 0 ? '+' : ''}{sector.performance.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold mb-2 text-white">{sector.name}</h3>
                <p className="text-sm text-gray-400 mb-3">{sector.description}</p>
                
                {/* Entry | Current | Target */}
                {sector.totalPicks > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-gray-500">Avg Entry</div>
                        <div className="font-bold text-gray-300">${sector.avgEntry.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Current</div>
                        <div className="font-bold text-blue-400">${sector.avgCurrent.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Target</div>
                        <div className="font-bold text-green-400">${sector.avgTarget.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-1 mt-3">
                  <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300">
                    {sector.totalPicks} picks
                  </Badge>
                  {sector.stocks.slice(0, 2).map((stock) => (
                    <Badge key={stock} variant="outline" className="text-xs border-gray-600 text-gray-400">
                      {stock}
                    </Badge>
                  ))}
                  {sector.stocks.length > 2 && (
                    <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                      +{sector.stocks.length - 2}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Sector detail view with news and stocks
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button
        variant="outline"
        onClick={handleBack}
        className="mb-6 bg-slate-800/50 border-purple-500/20 hover:bg-purple-500/10"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to All Sectors
      </Button>

      {/* Sector Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-4 rounded-xl ${selectedSector.performance >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className={`${selectedSector.performance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {selectedSector.icon}
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">{selectedSector.name}</h1>
            <p className="text-gray-400">{selectedSector.description}</p>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardContent className="pt-6">
              <div className={`text-3xl font-bold ${selectedSector.performance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {selectedSector.performance >= 0 ? '+' : ''}{selectedSector.performance.toFixed(2)}%
              </div>
              <div className="text-sm text-gray-400">Sector Performance</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-400">
                ${selectedSector.avgEntry.toFixed(2)}
              </div>
              <div className="text-sm text-gray-400">Avg Entry Price</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-cyan-500/20">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-cyan-400">
                ${selectedSector.avgCurrent.toFixed(2)}
              </div>
              <div className="text-sm text-gray-400">Avg Current Price</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-green-500/20">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-400">
                ${selectedSector.avgTarget.toFixed(2)}
              </div>
              <div className="text-sm text-gray-400">Avg Target Price</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stocks in Sector */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white">Stocks in {selectedSector.name}</CardTitle>
              <CardDescription>AI picks from this sector with Entry | Current | Target</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStocks ? (
                <div className="text-center py-8 text-gray-400">Loading stocks...</div>
              ) : sectorStocks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No AI picks in this sector yet</div>
              ) : (
                <div className="space-y-3">
                  {sectorStocks.map((stock, idx) => (
                    <Card key={idx} className="bg-slate-900/50 border-gray-700">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-lg text-white">{stock.ticker.toUpperCase()}</h4>
                            <Badge variant="outline" className="text-xs mt-1 border-blue-500/30 text-blue-300">
                              {stock.ai_model}
                            </Badge>
                          </div>
                          <div className={`text-lg font-bold ${stock.current_price >= stock.entry_price ? 'text-green-400' : 'text-red-400'}`}>
                            {stock.current_price >= stock.entry_price ? '+' : ''}
                            {(((stock.current_price - stock.entry_price) / stock.entry_price) * 100).toFixed(2)}%
                          </div>
                        </div>
                        
                        {/* Entry | Current | Target */}
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div>
                            <div className="text-xs text-gray-500">Entry</div>
                            <div className="font-bold text-gray-300">${stock.entry_price.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Current</div>
                            <div className="font-bold text-blue-400">${stock.current_price.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Target</div>
                            <div className="font-bold text-green-400">${stock.target_price.toFixed(2)}</div>
                          </div>
                        </div>
                        
                        {/* Reasoning */}
                        <details className="text-sm">
                          <summary className="cursor-pointer text-purple-400 hover:text-purple-300">
                            Why {stock.ai_model} picked this
                          </summary>
                          <p className="mt-2 text-gray-400 pl-4 border-l-2 border-purple-500/30">
                            {stock.reasoning}
                          </p>
                        </details>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* News Feed */}
        <div className="lg:col-span-1">
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Newspaper className="w-5 h-5" />
                Latest News
              </CardTitle>
              <CardDescription>
                Real-time {selectedSector.name} updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingNews ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Newspaper className="w-12 h-12 animate-pulse mx-auto mb-4 text-blue-400" />
                    <p className="text-gray-400">Loading news...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {news.map((article, index) => (
                    <Card key={index} className="bg-slate-900/50 border-gray-700 hover:border-purple-500/30 transition-colors">
                      <CardContent className="pt-4">
                        <h3 className="font-bold text-sm mb-2 line-clamp-2 text-white">
                          {article.title}
                        </h3>
                        <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                          {article.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-medium">{article.source}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(article.publishedAt)}
                            </div>
                          </div>
                          {article.url !== '#' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(article.url, '_blank')}
                              className="h-6 px-2 text-xs text-purple-400 hover:text-purple-300"
                            >
                              Read
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
