'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Target,
  Shield,
  Zap,
  Clock,
  Play,
  Pause,
  RefreshCw,
  Download,
  Settings,
  AlertTriangle,
  CheckCircle,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
  LineChart
} from 'lucide-react';
import { formatPrice, formatPercentage } from '@/lib/utils';
import { 
  pythonTradingService, 
  TRADING_STRATEGIES, 
  TECHNICAL_INDICATORS,
  type StrategyParameters,
  type BacktestResult,
  type TechnicalIndicator
} from '@/lib/python-trading/trading-libraries';
import { toast } from 'react-hot-toast';

const SYMBOLS = ['BTC/USD', 'ETH/USD', 'AAPL', 'GOOGL', 'TSLA', 'SPY', 'QQQ', 'NVDA'];
const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

export default function PythonAnalysisPage() {
  const [activeTab, setActiveTab] = useState('indicators');
  const [selectedSymbols, setSelectedSymbols] = useState(['BTC/USD', 'ETH/USD']);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [selectedStrategy, setSelectedStrategy] = useState(TRADING_STRATEGIES[0]);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [indicators, setIndicators] = useState<TechnicalIndicator[]>([]);
  const [backtestResults, setBacktestResults] = useState<BacktestResult | null>(null);
  const [marketAnalysis, setMarketAnalysis] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any>(null);
  const [riskMetrics, setRiskMetrics] = useState<any>(null);
  const [portfolioOptimization, setPortfolioOptimization] = useState<any>(null);

  // Strategy parameters
  const [strategyParams, setStrategyParams] = useState(selectedStrategy.parameters);
  const [backtestConfig, setBacktestConfig] = useState({
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    initial_capital: 100000
  });

  const handleRunIndicators = async () => {
    setLoading(true);
    try {
      const indicatorNames = ['RSI', 'MACD', 'SMA_20', 'BB'];
      const results = await pythonTradingService.calculateIndicators(
        selectedSymbols[0], 
        selectedTimeframe, 
        indicatorNames
      );
      setIndicators(results);
      toast.success('Technical indicators calculated successfully');
    } catch (error) {
      toast.error('Failed to calculate indicators');
    }
    setLoading(false);
  };

  const handleRunBacktest = async () => {
    setLoading(true);
    try {
      const strategy: StrategyParameters = {
        ...selectedStrategy,
        parameters: strategyParams
      };
      
      const results = await pythonTradingService.backtestStrategy(
        strategy,
        selectedSymbols,
        backtestConfig.start_date,
        backtestConfig.end_date,
        backtestConfig.initial_capital
      );
      
      setBacktestResults(results);
      toast.success('Backtest completed successfully');
    } catch (error) {
      toast.error('Backtest failed');
    }
    setLoading(false);
  };

  const handleMarketAnalysis = async () => {
    setLoading(true);
    try {
      const results = await pythonTradingService.analyzeMarket(selectedSymbols);
      setMarketAnalysis(results);
      toast.success('Market analysis completed');
    } catch (error) {
      toast.error('Market analysis failed');
    }
    setLoading(false);
  };

  const handlePricePredicition = async () => {
    setLoading(true);
    try {
      const results = await pythonTradingService.predictPrice(
        selectedSymbols[0],
        'lstm',
        selectedTimeframe,
        24 // 24 periods ahead
      );
      setPredictions(results);
      toast.success('Price prediction completed');
    } catch (error) {
      toast.error('Price prediction failed');
    }
    setLoading(false);
  };

  const handlePortfolioOptimization = async () => {
    setLoading(true);
    try {
      const results = await pythonTradingService.optimizePortfolio(
        selectedSymbols,
        selectedTimeframe,
        'maximum_sharpe'
      );
      setPortfolioOptimization(results);
      toast.success('Portfolio optimization completed');
    } catch (error) {
      toast.error('Portfolio optimization failed');
    }
    setLoading(false);
  };

  const handleRiskAnalysis = async () => {
    setLoading(true);
    try {
      const mockPortfolio = selectedSymbols.map(symbol => ({
        symbol,
        quantity: Math.random() * 100 + 10,
        price: Math.random() * 1000 + 50
      }));
      
      const results = await pythonTradingService.calculateRiskMetrics(
        mockPortfolio
      );
      setRiskMetrics(results);
      toast.success('Risk analysis completed');
    } catch (error) {
      toast.error('Risk analysis failed');
    }
    setLoading(false);
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'buy': return 'text-green-600';
      case 'sell': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSignalBadge = (signal: string) => {
    switch (signal) {
      case 'bullish': return <Badge className="bg-green-100 text-green-800">Bullish</Badge>;
      case 'bearish': return <Badge className="bg-red-100 text-red-800">Bearish</Badge>;
      default: return <Badge variant="secondary">Neutral</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Python Trading Analysis</h1>
          <p className="text-muted-foreground">
            Advanced trading analysis powered by Python libraries and machine learning
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Configure
          </Button>
          <Button size="sm">
            <Play className="mr-2 h-4 w-4" />
            Run Analysis
          </Button>
        </div>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Configuration</CardTitle>
          <CardDescription>Configure symbols, timeframes, and analysis parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Symbols</label>
              <Select value={selectedSymbols[0]} onValueChange={(value) => setSelectedSymbols([value])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SYMBOLS.map(symbol => (
                    <SelectItem key={symbol} value={symbol}>
                      {symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Timeframe</label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map(tf => (
                    <SelectItem key={tf} value={tf}>
                      {tf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Strategy</label>
              <Select 
                value={selectedStrategy.name} 
                onValueChange={(value) => {
                  const strategy = TRADING_STRATEGIES.find(s => s.name === value);
                  if (strategy) {
                    setSelectedStrategy(strategy);
                    setStrategyParams(strategy.parameters);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRADING_STRATEGIES.map(strategy => (
                    <SelectItem key={strategy.name} value={strategy.name}>
                      {strategy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="indicators">Indicators</TabsTrigger>
          <TabsTrigger value="backtest">Backtest</TabsTrigger>
          <TabsTrigger value="market">Market Analysis</TabsTrigger>
          <TabsTrigger value="prediction">ML Prediction</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="indicators" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Technical Indicators</CardTitle>
                  <CardDescription>
                    Calculate technical indicators using TA-Lib and pandas
                  </CardDescription>
                </div>
                <Button onClick={handleRunIndicators} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  Calculate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {indicators.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Run indicator analysis to see results</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {indicators.map((indicator, idx) => (
                    <Card key={idx} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{indicator.name}</h4>
                          <Badge variant="outline" className={indicator.type === 'momentum' ? 'text-blue-600' : 'text-green-600'}>
                            {indicator.type}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Signal:</span>
                            <span className={`font-medium capitalize ${getSignalColor(indicator.signal)}`}>
                              {indicator.signal}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Confidence:</span>
                            <span className="font-medium">{(indicator.confidence * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Current Value:</span>
                            <span className="font-medium">
                              {indicator.values[indicator.values.length - 1]?.toFixed(2) || 'N/A'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                          Parameters: {Object.entries(indicator.parameters).map(([key, value]) => 
                            `${key}: ${value}`
                          ).join(', ')}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backtest" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Strategy Backtesting</CardTitle>
                  <CardDescription>
                    Backtest trading strategies using historical data
                  </CardDescription>
                </div>
                <Button onClick={handleRunBacktest} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  Run Backtest
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={backtestConfig.start_date}
                    onChange={(e) => setBacktestConfig(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={backtestConfig.end_date}
                    onChange={(e) => setBacktestConfig(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Initial Capital</label>
                  <Input
                    type="number"
                    value={backtestConfig.initial_capital}
                    onChange={(e) => setBacktestConfig(prev => ({ ...prev, initial_capital: Number(e.target.value) }))}
                  />
                </div>
              </div>

              {backtestResults ? (
                <div className="space-y-6">
                  {/* Performance Summary */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Total Return</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatPrice(backtestResults.total_return)}
                          </p>
                          <p className="text-sm text-green-600">
                            {backtestResults.annualized_return.toFixed(2)}% Annual
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {backtestResults.sharpe_ratio.toFixed(2)}
                          </p>
                          <p className="text-sm text-blue-600">Risk-Adjusted</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Win Rate</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {backtestResults.win_rate.toFixed(1)}%
                          </p>
                          <p className="text-sm text-purple-600">
                            {backtestResults.winning_trades}/{backtestResults.total_trades}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-red-50 border-red-200">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Max Drawdown</p>
                          <p className="text-2xl font-bold text-red-600">
                            {(backtestResults.max_drawdown * 100).toFixed(2)}%
                          </p>
                          <p className="text-sm text-red-600">Maximum Loss</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detailed Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Detailed Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Initial Capital:</span>
                            <span className="font-medium">{formatPrice(backtestResults.initial_capital)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Final Value:</span>
                            <span className="font-medium">{formatPrice(backtestResults.final_portfolio_value)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Volatility:</span>
                            <span className="font-medium">{(backtestResults.volatility * 100).toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Profit Factor:</span>
                            <span className="font-medium">{backtestResults.profit_factor.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Trades:</span>
                            <span className="font-medium">{backtestResults.total_trades}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Winning Trades:</span>
                            <span className="font-medium text-green-600">{backtestResults.winning_trades}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Losing Trades:</span>
                            <span className="font-medium text-red-600">{backtestResults.losing_trades}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Avg Trade Return:</span>
                            <span className="font-medium">{formatPrice(backtestResults.avg_trade_return)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Run a backtest to see performance results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Real-time Market Analysis</CardTitle>
                  <CardDescription>
                    AI-powered market analysis across multiple timeframes
                  </CardDescription>
                </div>
                <Button onClick={handleMarketAnalysis} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Activity className="mr-2 h-4 w-4" />
                  )}
                  Analyze
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {marketAnalysis.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Run market analysis to see insights</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {marketAnalysis.map((analysis, idx) => (
                    <Card key={idx} className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg">{analysis.symbol}</h4>
                            <p className="text-sm text-muted-foreground">
                              Current Price: {formatPrice(analysis.price)}
                            </p>
                          </div>
                          <div className="text-right">
                            {getSignalBadge(analysis.signals.overall)}
                            <p className="text-sm text-muted-foreground mt-1">
                              Strength: {(analysis.signals.strength * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <p className="text-sm text-muted-foreground">1 Hour</p>
                            {getSignalBadge(analysis.signals.timeframes['1h'])}
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <p className="text-sm text-muted-foreground">4 Hours</p>
                            {getSignalBadge(analysis.signals.timeframes['4h'])}
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <p className="text-sm text-muted-foreground">1 Day</p>
                            {getSignalBadge(analysis.signals.timeframes['1d'])}
                          </div>
                        </div>

                        {analysis.indicators.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h5 className="font-medium mb-2">Key Indicators</h5>
                            <div className="grid gap-2 md:grid-cols-2">
                              {analysis.indicators.map((indicator: any, indicatorIdx: number) => (
                                <div key={indicatorIdx} className="flex justify-between text-sm">
                                  <span>{indicator.name}:</span>
                                  <span className={getSignalColor(indicator.signal)}>
                                    {indicator.signal} ({(indicator.confidence * 100).toFixed(0)}%)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prediction" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ML Price Prediction</CardTitle>
                  <CardDescription>
                    Machine learning models for price forecasting
                  </CardDescription>
                </div>
                <Button onClick={handlePricePredicition} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Brain className="mr-2 h-4 w-4" />
                  )}
                  Predict
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!predictions ? (
                <div className="text-center py-12">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Run ML prediction to see forecasts</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Current Price</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {formatPrice(predictions.current_price)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">24h Prediction</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatPrice(predictions.predicted_prices[23])}
                          </p>
                          <p className="text-sm text-green-600">
                            {(((predictions.predicted_prices[23] / predictions.current_price) - 1) * 100).toFixed(2)}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Model Accuracy</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {(predictions.model_accuracy * 100).toFixed(1)}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Feature Importance</CardTitle>
                      <CardDescription>
                        Which factors most influence the prediction
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(predictions.feature_importance)
                          .sort(([,a], [,b]) => (b as number) - (a as number))
                          .map(([feature, importance], idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="capitalize text-sm">{feature.replace('_', ' ')}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${(importance as number) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium w-12">
                                {((importance as number) * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Portfolio Optimization</CardTitle>
                  <CardDescription>
                    Modern portfolio theory optimization
                  </CardDescription>
                </div>
                <Button onClick={handlePortfolioOptimization} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PieChart className="mr-2 h-4 w-4" />
                  )}
                  Optimize
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!portfolioOptimization ? (
                <div className="text-center py-12">
                  <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Run portfolio optimization to see allocations</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Expected Return</p>
                          <p className="text-2xl font-bold text-green-600">
                            {(portfolioOptimization.expected_return * 100).toFixed(2)}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Expected Vol</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {(portfolioOptimization.expected_volatility * 100).toFixed(2)}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {portfolioOptimization.sharpe_ratio.toFixed(2)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Optimal Allocation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(portfolioOptimization.weights).map(([symbol, weight], idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="font-medium">{symbol}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-32 bg-gray-200 rounded-full h-3">
                                <div 
                                  className="bg-blue-600 h-3 rounded-full" 
                                  style={{ width: `${(weight as number) * 100}%` }}
                                />
                              </div>
                              <span className="font-medium w-16">
                                {((weight as number) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Risk Analysis</CardTitle>
                  <CardDescription>
                    Comprehensive portfolio risk assessment
                  </CardDescription>
                </div>
                <Button onClick={handleRiskAnalysis} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="mr-2 h-4 w-4" />
                  )}
                  Analyze Risk
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!riskMetrics ? (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Run risk analysis to see metrics</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card className="bg-red-50 border-red-200">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">VaR (1 Day)</p>
                          <p className="text-2xl font-bold text-red-600">
                            {formatPrice(riskMetrics.var_1d)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-orange-50 border-orange-200">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">VaR (1 Week)</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {formatPrice(riskMetrics.var_1w)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Expected Shortfall</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {formatPrice(riskMetrics.expected_shortfall)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Portfolio Beta</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {riskMetrics.beta.toFixed(2)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Stress Test Scenarios</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {riskMetrics.stress_test_scenarios.map((scenario: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 border rounded">
                            <div>
                              <p className="font-medium">{scenario.scenario}</p>
                              <p className="text-sm text-muted-foreground">
                                Probability: {(scenario.probability * 100).toFixed(1)}%
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${scenario.portfolio_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPrice(scenario.portfolio_change)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {((scenario.portfolio_change / 100000) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}