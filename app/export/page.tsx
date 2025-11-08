'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  FileText,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  Filter,
  TrendingUp,
  Calendar,
  Database,
  BarChart3,
  AlertCircle
} from 'lucide-react';

interface ExportData {
  ticker: string;
  ai_model: string;
  entry_price: number;
  current_price: number;
  target_price: number;
  performance: number;
  reasoning: string;
  picked_at: string;
  status: string;
}

interface ExportOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  formats: string[];
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: 'all-picks',
    title: 'All AI Stock Picks',
    description: 'Complete list of all AI recommendations with performance data',
    icon: <Database className="w-6 h-6" />,
    color: 'from-blue-500 to-cyan-500',
    formats: ['CSV', 'PDF']
  },
  {
    id: 'winning-picks',
    title: 'Winning Picks Only',
    description: 'Export only successful picks (positive returns)',
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'from-green-500 to-emerald-500',
    formats: ['CSV', 'PDF']
  },
  {
    id: 'portfolio',
    title: 'My Portfolio',
    description: 'Your current positions and performance',
    icon: <CheckCircle className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-500',
    formats: ['CSV', 'PDF']
  },
  {
    id: 'backtesting',
    title: 'Backtesting Results',
    description: 'Historical performance analysis and metrics',
    icon: <Clock className="w-6 h-6" />,
    color: 'from-yellow-500 to-orange-500',
    formats: ['CSV', 'PDF']
  },
  {
    id: 'paper-trades',
    title: 'Paper Trading History',
    description: 'All your paper trading transactions and results',
    icon: <FileText className="w-6 h-6" />,
    color: 'from-indigo-500 to-purple-500',
    formats: ['CSV', 'PDF']
  },
  {
    id: 'ai-performance',
    title: 'AI Performance Report',
    description: 'Detailed analytics on each AI model\'s track record',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'from-red-500 to-pink-500',
    formats: ['CSV', 'PDF']
  }
];

export default function ExportPage() {
  const [data, setData] = useState<ExportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Filters
  const [selectedAI, setSelectedAI] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [performanceFilter, setPerformanceFilter] = useState<string>('all');
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadData();
  }, [selectedAI, selectedStatus, dateRange, performanceFilter]);

  const loadData = async () => {
    try {
      let query = supabase
        .from('ai_stock_picks')
        .select('*')
        .not('current_price', 'is', null);

      // Apply AI filter
      if (selectedAI !== 'all') {
        query = query.eq('ai_name', selectedAI);
      }

      // Apply date range filter
      if (dateRange !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (dateRange) {
          case '7d':
            startDate.setDate(now.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(now.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(now.getDate() - 90);
            break;
        }
        
        query = query.gte('picked_at', startDate.toISOString());
      }

      const { data: picks, error } = await query.order('picked_at', { ascending: false });

      if (error) throw error;

      if (picks) {
        let filteredData = picks.map(pick => ({
          ticker: pick.ticker,
          ai_model: pick.ai_name,
          entry_price: pick.price,
          current_price: pick.current_price,
          target_price: pick.target_price,
          performance: ((pick.current_price - pick.price) / pick.price) * 100,
          reasoning: pick.reasoning,
          picked_at: pick.picked_at,
          status: pick.current_price >= pick.price ? 'winning' : 'losing'
        }));

        // Apply performance filter
        if (performanceFilter === 'positive') {
          filteredData = filteredData.filter(d => d.performance > 0);
        } else if (performanceFilter === 'negative') {
          filteredData = filteredData.filter(d => d.performance < 0);
        }

        // Apply status filter
        if (selectedStatus === 'winning') {
          filteredData = filteredData.filter(d => d.status === 'winning');
        } else if (selectedStatus === 'losing') {
          filteredData = filteredData.filter(d => d.status === 'losing');
        }

        setData(filteredData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const exportToCSV = (option: ExportOption) => {
    setExporting(true);
    
    try {
      let exportData = data;
      
      // Apply specific filters based on export option
      if (option.id === 'winning-picks') {
        exportData = data.filter(d => d.performance > 0);
      }

      // Create CSV content
      const headers = [
        'Ticker',
        'AI Model',
        'Entry Price',
        'Current Price',
        'Target Price',
        'Performance (%)',
        'Status',
        'Picked Date',
        'Reasoning'
      ];

      const rows = exportData.map(item => [
        item.ticker,
        item.ai_model,
        item.entry_price.toFixed(2),
        item.current_price.toFixed(2),
        item.target_price.toFixed(2),
        item.performance.toFixed(2),
        item.status,
        new Date(item.picked_at).toLocaleDateString(),
        `"${item.reasoning.replace(/"/g, '""')}"`
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `market-oracle-${option.id}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert(`✅ Exported ${exportData.length} records to CSV!`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('❌ Error exporting data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = (option: ExportOption) => {
    setExporting(true);
    
    try {
      let exportData = data;
      
      if (option.id === 'winning-picks') {
        exportData = data.filter(d => d.performance > 0);
      }

      // Create simple HTML report
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>${option.title} - Market Oracle Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #8b5cf6; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #8b5cf6; color: white; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    .positive { color: green; font-weight: bold; }
    .negative { color: red; font-weight: bold; }
    .footer { margin-top: 40px; text-align: center; color: #666; }
  </style>
</head>
<body>
  <h1>${option.title}</h1>
  <p>${option.description}</p>
  <p><strong>Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
  <p><strong>Total Records:</strong> ${exportData.length}</p>
  
  <table>
    <thead>
      <tr>
        <th>Ticker</th>
        <th>AI Model</th>
        <th>Entry</th>
        <th>Current</th>
        <th>Target</th>
        <th>Performance</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      ${exportData.map(item => `
        <tr>
          <td><strong>${item.ticker}</strong></td>
          <td>${item.ai_model}</td>
          <td>$${item.entry_price.toFixed(2)}</td>
          <td>$${item.current_price.toFixed(2)}</td>
          <td>$${item.target_price.toFixed(2)}</td>
          <td class="${item.performance >= 0 ? 'positive' : 'negative'}">
            ${item.performance >= 0 ? '+' : ''}${item.performance.toFixed(2)}%
          </td>
          <td>${new Date(item.picked_at).toLocaleDateString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <p>Market Oracle AI - Your AI-Powered Stock Picking Platform</p>
    <p>Report generated from https://crav-market-oracle.vercel.app</p>
  </div>
</body>
</html>
      `;

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `market-oracle-${option.id}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert(`✅ Exported ${exportData.length} records to HTML/PDF! Open the file and print to PDF.`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('❌ Error exporting data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Download className="w-12 h-12 animate-pulse mx-auto mb-4 text-blue-400" />
          <p className="text-gray-300">Loading export data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
          📥 Export & Downloads
        </h1>
        <p className="text-xl text-gray-300 mb-2">Download your data anytime, anywhere</p>
        <p className="text-gray-400">Export to CSV or PDF with full filtering options</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-slate-800/50 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-400">{data.length}</div>
            <div className="text-sm text-gray-400">Records Available</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-green-500/20">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-400">
              {data.filter(d => d.performance > 0).length}
            </div>
            <div className="text-sm text-gray-400">Winning Picks</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-400">
              {new Set(data.map(d => d.ai_model)).size}
            </div>
            <div className="text-sm text-gray-400">AI Models</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-yellow-400">
              {data.length > 0 
                ? (data.reduce((sum, d) => sum + d.performance, 0) / data.length).toFixed(1)
                : 0}%
            </div>
            <div className="text-sm text-gray-400">Avg Performance</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-purple-500/20 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Filter className="w-5 h-5" />
            Filter Data
          </CardTitle>
          <CardDescription>Customize what data to export</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-gray-300">AI Model</Label>
              <Select value={selectedAI} onValueChange={setSelectedAI}>
                <SelectTrigger className="bg-slate-900/50 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All AIs</SelectItem>
                  <SelectItem value="GPT-4">GPT-4</SelectItem>
                  <SelectItem value="Claude">Claude</SelectItem>
                  <SelectItem value="Gemini">Gemini</SelectItem>
                  <SelectItem value="Perplexity">Perplexity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="bg-slate-900/50 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="winning">Winning Only</SelectItem>
                  <SelectItem value="losing">Losing Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="bg-slate-900/50 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300">Performance</Label>
              <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                <SelectTrigger className="bg-slate-900/50 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Performance</SelectItem>
                  <SelectItem value="positive">Positive Only</SelectItem>
                  <SelectItem value="negative">Negative Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {EXPORT_OPTIONS.map((option) => (
          <Card key={option.id} className="bg-slate-800/50 border-purple-500/20 hover:border-purple-500/50 transition-all">
            <CardContent className="pt-6">
              <div className={`p-4 rounded-xl bg-gradient-to-r ${option.color} mb-4 inline-block`}>
                {option.icon}
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">{option.title}</h3>
              <p className="text-sm text-gray-400 mb-4">{option.description}</p>

              <div className="space-y-2">
                {option.formats.includes('CSV') && (
                  <Button
                    onClick={() => exportToCSV(option)}
                    disabled={exporting}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                )}
                {option.formats.includes('PDF') && (
                  <Button
                    onClick={() => exportToPDF(option)}
                    disabled={exporting}
                    className="w-full bg-red-500 hover:bg-red-600"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Box */}
      <Card className="bg-blue-500/10 border-blue-500/30 mt-8">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-white mb-2">Export Tips</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• CSV files can be opened in Excel, Google Sheets, or any spreadsheet software</li>
                <li>• PDF exports are great for reports and sharing with others</li>
                <li>• Use filters to export only the data you need</li>
                <li>• All exports include Entry | Current | Target prices</li>
                <li>• Exports are generated in real-time with latest data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
