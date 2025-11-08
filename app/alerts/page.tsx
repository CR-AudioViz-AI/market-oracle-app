'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Bell,
  TrendingUp,
  TrendingDown,
  Target,
  AlertCircle,
  Plus,
  Trash2,
  Check,
  X,
  BarChart3,
  Clock,
  DollarSign
} from 'lucide-react';

interface Alert {
  id: string;
  user_id: string;
  ticker: string;
  alert_type: 'price_above' | 'price_below' | '52_week_high' | '52_week_low' | 'percent_change' | 'volume_spike' | 'target_reached' | 'stop_loss';
  target_value?: number;
  is_active: boolean;
  triggered_at?: string;
  created_at: string;
  current_price?: number;
  price_at_creation?: number;
}

interface StockOption {
  ticker: string;
  ai_name: string;
  current_price: number;
  target_price: number;
  entry_price: number;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stockOptions, setStockOptions] = useState<StockOption[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>('demo-user'); // Demo mode for now
  
  // Form state
  const [selectedTicker, setSelectedTicker] = useState('');
  const [alertType, setAlertType] = useState<Alert['alert_type']>('price_above');
  const [targetValue, setTargetValue] = useState('');

  // Filter state
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'triggered'>('all');

  const supabase = createClientComponentClient();

  useEffect(() => {
    initializeAlerts();
  }, []);

  const initializeAlerts = async () => {
    try {
      // Load available stocks from AI picks
      const { data: picks } = await supabase
        .from('ai_stock_picks')
        .select('ticker, ai_name, current_price, price, target_price')
        .not('current_price', 'is', null)
        .order('ticker');

      if (picks) {
        const uniqueStocks = picks.reduce((acc: StockOption[], pick) => {
          if (!acc.find(s => s.ticker === pick.ticker)) {
            acc.push({
              ticker: pick.ticker.toUpperCase(),
              ai_name: pick.ai_name,
              current_price: pick.current_price || pick.price,
              target_price: pick.target_price || pick.price * 1.15,
              entry_price: pick.price
            });
          }
          return acc;
        }, []);
        setStockOptions(uniqueStocks.sort((a, b) => a.ticker.localeCompare(b.ticker)));
      }

      // For demo purposes, create some sample alerts
      if (userId) {
        await loadUserAlerts(userId);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error initializing alerts:', error);
      setLoading(false);
    }
  };

  const loadUserAlerts = async (uid: string) => {
    try {
      // Try to load from database
      const { data, error } = await supabase
        .from('user_alerts')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setAlerts(data);
      } else {
        // Create demo alerts for showcase
        const demoAlerts: Alert[] = [
          {
            id: '1',
            user_id: uid,
            ticker: 'NVDA',
            alert_type: 'price_above',
            target_value: 500,
            is_active: true,
            created_at: new Date().toISOString(),
            price_at_creation: 485.20,
            current_price: 489.50
          },
          {
            id: '2',
            user_id: uid,
            ticker: 'AAPL',
            alert_type: 'price_below',
            target_value: 170,
            is_active: true,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            price_at_creation: 175.30,
            current_price: 174.20
          },
          {
            id: '3',
            user_id: uid,
            ticker: 'TSLA',
            alert_type: 'target_reached',
            target_value: 250,
            is_active: true,
            created_at: new Date(Date.now() - 7200000).toISOString(),
            price_at_creation: 242.10,
            current_price: 248.90
          },
          {
            id: '4',
            user_id: uid,
            ticker: 'MSFT',
            alert_type: 'percent_change',
            target_value: 5,
            is_active: false,
            triggered_at: new Date(Date.now() - 86400000).toISOString(),
            created_at: new Date(Date.now() - 172800000).toISOString(),
            price_at_creation: 380.00,
            current_price: 399.00
          },
          {
            id: '5',
            user_id: uid,
            ticker: 'AMD',
            alert_type: '52_week_high',
            is_active: true,
            created_at: new Date(Date.now() - 259200000).toISOString(),
            price_at_creation: 145.00,
            current_price: 152.30
          },
          {
            id: '6',
            user_id: uid,
            ticker: 'GOOGL',
            alert_type: 'stop_loss',
            target_value: 130,
            is_active: true,
            created_at: new Date(Date.now() - 345600000).toISOString(),
            price_at_creation: 142.50,
            current_price: 138.20
          }
        ];
        setAlerts(demoAlerts);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const createAlert = async () => {
    if (!userId || !selectedTicker || !alertType) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate target value for relevant alert types
    if (shouldTargetValueShow(alertType) && !targetValue) {
      alert('Please enter a target value');
      return;
    }

    try {
      const stock = stockOptions.find(s => s.ticker === selectedTicker);
      
      const newAlert: Alert = {
        id: Date.now().toString(),
        user_id: userId,
        ticker: selectedTicker,
        alert_type: alertType,
        is_active: true,
        created_at: new Date().toISOString(),
        price_at_creation: stock?.current_price || 0,
        current_price: stock?.current_price || 0,
        target_value: shouldTargetValueShow(alertType) ? parseFloat(targetValue) : undefined
      };

      // Add to database (with error handling for demo mode)
      try {
        const { data, error } = await supabase
          .from('user_alerts')
          .insert([{
            user_id: userId,
            ticker: selectedTicker,
            alert_type: alertType,
            target_value: newAlert.target_value,
            is_active: true,
            price_at_creation: newAlert.price_at_creation
          }])
          .select()
          .single();

        if (!error && data) {
          setAlerts([data, ...alerts]);
        } else {
          // Fallback to local state
          setAlerts([newAlert, ...alerts]);
        }
      } catch (dbError) {
        // Demo mode - just add locally
        setAlerts([newAlert, ...alerts]);
      }

      setShowCreateForm(false);
      setSelectedTicker('');
      setAlertType('price_above');
      setTargetValue('');
    } catch (error) {
      console.error('Error creating alert:', error);
      alert('Error creating alert. Please try again.');
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      await supabase
        .from('user_alerts')
        .delete()
        .eq('id', alertId);

      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (error) {
      // Demo mode fallback
      setAlerts(alerts.filter(a => a.id !== alertId));
    }
  };

  const toggleAlert = async (alertId: string, isActive: boolean) => {
    try {
      await supabase
        .from('user_alerts')
        .update({ is_active: !isActive })
        .eq('id', alertId);

      setAlerts(alerts.map(a => 
        a.id === alertId ? { ...a, is_active: !isActive } : a
      ));
    } catch (error) {
      // Demo mode fallback
      setAlerts(alerts.map(a => 
        a.id === alertId ? { ...a, is_active: !isActive } : a
      ));
    }
  };

  const getAlertTypeLabel = (type: Alert['alert_type']) => {
    const labels = {
      'price_above': 'Price Above',
      'price_below': 'Price Below',
      '52_week_high': '52-Week High',
      '52_week_low': '52-Week Low',
      'percent_change': 'Percent Change',
      'volume_spike': 'Volume Spike',
      'target_reached': 'Target Reached',
      'stop_loss': 'Stop Loss'
    };
    return labels[type] || type;
  };

  const getAlertTypeIcon = (type: Alert['alert_type']) => {
    const icons = {
      'price_above': <TrendingUp className="w-4 h-4" />,
      'price_below': <TrendingDown className="w-4 h-4" />,
      '52_week_high': <TrendingUp className="w-4 h-4" />,
      '52_week_low': <TrendingDown className="w-4 h-4" />,
      'percent_change': <Target className="w-4 h-4" />,
      'volume_spike': <AlertTriangle className="w-4 h-4" />,
      'target_reached': <Target className="w-4 h-4" />,
      'stop_loss': <AlertCircle className="w-4 h-4" />
    };
    return icons[type] || <Bell className="w-4 h-4" />;
  };

  const getAlertDescription = (alert: Alert) => {
    const stock = stockOptions.find(s => s.ticker === alert.ticker);
    const currentPrice = alert.current_price || stock?.current_price || 0;

    switch (alert.alert_type) {
      case 'price_above':
        return `Alert when ${alert.ticker} rises above $${alert.target_value?.toFixed(2)} (Current: $${currentPrice.toFixed(2)})`;
      case 'price_below':
        return `Alert when ${alert.ticker} falls below $${alert.target_value?.toFixed(2)} (Current: $${currentPrice.toFixed(2)})`;
      case '52_week_high':
        return `Alert when ${alert.ticker} reaches a new 52-week high (Current: $${currentPrice.toFixed(2)})`;
      case '52_week_low':
        return `Alert when ${alert.ticker} reaches a new 52-week low (Current: $${currentPrice.toFixed(2)})`;
      case 'percent_change':
        return `Alert when ${alert.ticker} changes by ${alert.target_value}% in a day`;
      case 'volume_spike':
        return `Alert when ${alert.ticker} has unusual trading volume (3x+ average)`;
      case 'target_reached':
        return `Alert when ${alert.ticker} reaches target price of $${alert.target_value?.toFixed(2)} (Current: $${currentPrice.toFixed(2)})`;
      case 'stop_loss':
        return `Alert when ${alert.ticker} falls to stop-loss at $${alert.target_value?.toFixed(2)} (Current: $${currentPrice.toFixed(2)})`;
      default:
        return `Alert for ${alert.ticker}`;
    }
  };

  const shouldTargetValueShow = (type: Alert['alert_type']) => {
    return ['price_above', 'price_below', 'percent_change', 'target_reached', 'stop_loss'].includes(type);
  };

  const getTargetValueLabel = (type: Alert['alert_type']) => {
    if (type === 'percent_change') return 'Percentage (%)';
    return 'Target Price ($)';
  };

  const getTargetValuePlaceholder = (type: Alert['alert_type']) => {
    if (type === 'percent_change') return '5';
    return '150.00';
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filterStatus === 'active') return alert.is_active && !alert.triggered_at;
    if (filterStatus === 'triggered') return alert.triggered_at !== undefined;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Bell className="w-12 h-12 animate-pulse mx-auto mb-4 text-blue-400" />
          <p className="text-gray-300">Loading your alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              🔔 Stock Alerts
            </h1>
            <p className="text-xl text-gray-300">Never miss a trading opportunity</p>
            <p className="text-gray-400">Get notified when stocks hit your target prices or conditions</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Alert
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-slate-800/50 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-400">
              {alerts.length}
            </div>
            <div className="text-sm text-gray-400">Total Alerts</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-green-500/20">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-400">
              {alerts.filter(a => a.is_active && !a.triggered_at).length}
            </div>
            <div className="text-sm text-gray-400">Active Alerts</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-yellow-400">
              {alerts.filter(a => a.triggered_at).length}
            </div>
            <div className="text-sm text-gray-400">Triggered</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-400">
              {stockOptions.length}
            </div>
            <div className="text-sm text-gray-400">Stocks Available</div>
          </CardContent>
        </Card>
      </div>

      {/* Create Alert Form */}
      {showCreateForm && (
        <Card className="mb-6 bg-slate-800/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white">Create New Alert</CardTitle>
            <CardDescription>
              Set up price alerts and notifications for your watched stocks (8 alert types available)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label className="text-gray-300">Stock Symbol</Label>
                <Select value={selectedTicker} onValueChange={setSelectedTicker}>
                  <SelectTrigger className="bg-slate-900/50 border-gray-700">
                    <SelectValue placeholder="Select stock" />
                  </SelectTrigger>
                  <SelectContent>
                    {stockOptions.map((stock) => (
                      <SelectItem key={stock.ticker} value={stock.ticker}>
                        {stock.ticker} - ${stock.current_price.toFixed(2)} ({stock.ai_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">Alert Type</Label>
                <Select value={alertType} onValueChange={(value) => setAlertType(value as Alert['alert_type'])}>
                  <SelectTrigger className="bg-slate-900/50 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price_above">Price Above</SelectItem>
                    <SelectItem value="price_below">Price Below</SelectItem>
                    <SelectItem value="target_reached">Target Reached</SelectItem>
                    <SelectItem value="stop_loss">Stop Loss</SelectItem>
                    <SelectItem value="52_week_high">52-Week High</SelectItem>
                    <SelectItem value="52_week_low">52-Week Low</SelectItem>
                    <SelectItem value="percent_change">Percent Change</SelectItem>
                    <SelectItem value="volume_spike">Volume Spike</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {shouldTargetValueShow(alertType) && (
                <div>
                  <Label className="text-gray-300">{getTargetValueLabel(alertType)}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder={getTargetValuePlaceholder(alertType)}
                    className="bg-slate-900/50 border-gray-700"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={createAlert}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <Check className="w-4 h-4 mr-2" />
                Create Alert
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                className="border-gray-700"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('all')}
          className={filterStatus === 'all' ? 'bg-purple-500' : 'border-gray-700'}
        >
          All ({alerts.length})
        </Button>
        <Button
          variant={filterStatus === 'active' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('active')}
          className={filterStatus === 'active' ? 'bg-green-500' : 'border-gray-700'}
        >
          Active ({alerts.filter(a => a.is_active && !a.triggered_at).length})
        </Button>
        <Button
          variant={filterStatus === 'triggered' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('triggered')}
          className={filterStatus === 'triggered' ? 'bg-yellow-500' : 'border-gray-700'}
        >
          Triggered ({alerts.filter(a => a.triggered_at).length})
        </Button>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <Card className="bg-slate-800/50 border-purple-500/20">
          <CardContent className="pt-12 pb-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-bold mb-2 text-gray-300">No Alerts Yet</h3>
            <p className="text-gray-400 mb-4">
              Create your first alert to get notified about price movements
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Alert
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAlerts.map((alert) => (
            <Card
              key={alert.id}
              className={`bg-slate-800/50 border-l-4 ${
                alert.triggered_at
                  ? 'border-l-yellow-500 border-yellow-500/20'
                  : alert.is_active
                  ? 'border-l-green-500 border-green-500/20'
                  : 'border-l-gray-500 border-gray-700'
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${
                        alert.triggered_at
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : alert.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {getAlertTypeIcon(alert.alert_type)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {alert.ticker}
                        </h3>
                        <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300">
                          {getAlertTypeLabel(alert.alert_type)}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-gray-300 mb-3">
                      {getAlertDescription(alert)}
                    </p>

                    {/* Price Info */}
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-gray-500">Created At</div>
                        <div className="font-bold text-gray-300">
                          ${alert.price_at_creation?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Current Price</div>
                        <div className="font-bold text-blue-400">
                          ${alert.current_price?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                      {alert.target_value && (
                        <div>
                          <div className="text-xs text-gray-500">Target</div>
                          <div className="font-bold text-green-400">
                            {alert.alert_type === 'percent_change' 
                              ? `${alert.target_value}%` 
                              : `$${alert.target_value.toFixed(2)}`}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      Created {new Date(alert.created_at).toLocaleDateString()}
                      {alert.triggered_at && (
                        <>
                          <span className="text-yellow-400">•</span>
                          <span className="text-yellow-400">
                            Triggered {new Date(alert.triggered_at).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAlert(alert.id, alert.is_active)}
                      className={alert.is_active ? 'border-green-500/30' : 'border-gray-700'}
                    >
                      {alert.is_active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteAlert(alert.id)}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
