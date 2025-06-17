'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Target,
  Shield,
  Zap,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

// Mock data for analytics
const performanceData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
  portfolio: 10000 + Math.random() * 2000,
  benchmark: 10000 + Math.random() * 1000,
  agents: 5000 + Math.random() * 1000,
}))

const riskMetrics = {
  var95: 2.3,
  var99: 4.1,
  maxDrawdown: 8.5,
  sharpeRatio: 1.8,
  volatility: 12.4,
  beta: 0.95
}

const sectorAllocation = [
  { name: 'Tech', value: 35, color: '#8b5cf6' },
  { name: 'DeFi', value: 28, color: '#10b981' },
  { name: 'Traditional', value: 20, color: '#f59e0b' },
  { name: 'Crypto', value: 17, color: '#ef4444' }
]

const agentPerformance = [
  { name: 'Marcus - Momentum', returns: 12.5, volatility: 8.2, sharpe: 1.9, maxDD: -3.1 },
  { name: 'Alex - Arbitrage', returns: 8.3, volatility: 4.1, sharpe: 2.4, maxDD: -1.5 },
  { name: 'Sophia - Mean Rev', returns: -2.1, volatility: 6.8, sharpe: -0.3, maxDD: -5.2 },
  { name: 'Emma - Grid Bot', returns: 15.2, volatility: 12.1, sharpe: 1.6, maxDD: -7.8 }
]

export function AnalyticsView() {
  const [activeMetric, setActiveMetric] = useState('returns')
  const [timeframe, setTimeframe] = useState('30d')

  const metrics = [
    { id: 'returns', label: 'Returns', icon: TrendingUp },
    { id: 'risk', label: 'Risk', icon: Shield },
    { id: 'allocation', label: 'Allocation', icon: Target },
    { id: 'agents', label: 'Agents', icon: Activity }
  ]

  const timeframes = [
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: '90d', label: '90D' },
    { id: '1y', label: '1Y' }
  ]

  const getPerformanceColor = (value: number) => {
    if (value > 0) return 'text-emerald-600 dark:text-emerald-400'
    if (value < 0) return 'text-rose-600 dark:text-rose-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const getRiskColor = (value: number, type: 'var' | 'drawdown' | 'volatility') => {
    if (type === 'var' || type === 'volatility') {
      if (value > 10) return 'text-rose-600 dark:text-rose-400'
      if (value > 5) return 'text-amber-600 dark:text-amber-400'
      return 'text-emerald-600 dark:text-emerald-400'
    }
    if (type === 'drawdown') {
      if (value > 10) return 'text-rose-600 dark:text-rose-400'
      if (value > 5) return 'text-amber-600 dark:text-amber-400'
      return 'text-emerald-600 dark:text-emerald-400'
    }
    return 'text-gray-600 dark:text-gray-400'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <BarChart3 className="w-6 h-6 mr-3 text-violet-600" />
            Advanced Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Deep insights into your trading performance and risk metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 dark:border-gray-600"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 dark:border-gray-600"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 dark:border-gray-600"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metric Navigation */}
      <div className="flex flex-wrap gap-2">
        {metrics.map((metric) => (
          <Button
            key={metric.id}
            variant={activeMetric === metric.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveMetric(metric.id)}
            className={
              activeMetric === metric.id
                ? "bg-violet-600 hover:bg-violet-700 text-white"
                : "border-gray-300 dark:border-gray-600"
            }
          >
            <metric.icon className="h-4 w-4 mr-2" />
            {metric.label}
          </Button>
        ))}
      </div>

      {/* Timeframe Selection */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Timeframe:</span>
        {timeframes.map((tf) => (
          <Button
            key={tf.id}
            variant={timeframe === tf.id ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe(tf.id)}
            className={
              timeframe === tf.id
                ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                : "border-gray-300 dark:border-gray-600"
            }
          >
            {tf.label}
          </Button>
        ))}
      </div>

      {/* Returns Analysis */}
      {activeMetric === 'returns' && (
        <div className="space-y-6">
          {/* Key Performance Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-950 dark:to-emerald-900 dark:border-emerald-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Total Return</p>
                      <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100">+18.5%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200 dark:from-violet-950 dark:to-violet-900 dark:border-violet-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-violet-600 dark:text-violet-400">Annualized</p>
                      <p className="text-xl font-bold text-violet-900 dark:text-violet-100">+22.3%</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-violet-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 dark:from-amber-950 dark:to-amber-900 dark:border-amber-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Sharpe Ratio</p>
                      <p className="text-xl font-bold text-amber-900 dark:text-amber-100">{riskMetrics.sharpeRatio}</p>
                    </div>
                    <Target className="h-8 w-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 dark:from-cyan-950 dark:to-cyan-900 dark:border-cyan-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400">vs Benchmark</p>
                      <p className="text-xl font-bold text-cyan-900 dark:text-cyan-100">+8.2%</p>
                    </div>
                    <Zap className="h-8 w-8 text-cyan-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Performance Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">
                  Portfolio Performance vs Benchmark
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  30-day performance comparison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          color: '#374151'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="portfolio"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        name="Portfolio"
                      />
                      <Line
                        type="monotone"
                        dataKey="benchmark"
                        stroke="#6b7280"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Benchmark"
                      />
                      <Line
                        type="monotone"
                        dataKey="agents"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Agents Only"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Risk Analysis */}
      {activeMetric === 'risk' && (
        <div className="space-y-6">
          {/* Risk Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">VaR 95%</p>
                      <p className={`text-xl font-bold ${getRiskColor(riskMetrics.var95, 'var')}`}>
                        {riskMetrics.var95}%
                      </p>
                    </div>
                    <Shield className="h-8 w-8 text-emerald-500" />
                  </div>
                  <div className="mt-2">
                    <Progress value={riskMetrics.var95 * 10} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Max Drawdown</p>
                      <p className={`text-xl font-bold ${getRiskColor(riskMetrics.maxDrawdown, 'drawdown')}`}>
                        -{riskMetrics.maxDrawdown}%
                      </p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-rose-500" />
                  </div>
                  <div className="mt-2">
                    <Progress value={riskMetrics.maxDrawdown} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Volatility</p>
                      <p className={`text-xl font-bold ${getRiskColor(riskMetrics.volatility, 'volatility')}`}>
                        {riskMetrics.volatility}%
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-amber-500" />
                  </div>
                  <div className="mt-2">
                    <Progress value={riskMetrics.volatility * 5} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Risk Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Risk Analysis</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Detailed risk metrics and analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Risk Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">VaR 95%</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {riskMetrics.var95}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">VaR 99%</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {riskMetrics.var99}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Beta</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {riskMetrics.beta}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Sharpe Ratio</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {riskMetrics.sharpeRatio}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Risk Assessment</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Overall Risk</span>
                          <span className="text-amber-600 dark:text-amber-400">Medium</span>
                        </div>
                        <Progress value={60} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Concentration Risk</span>
                          <span className="text-emerald-600 dark:text-emerald-400">Low</span>
                        </div>
                        <Progress value={25} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Market Risk</span>
                          <span className="text-amber-600 dark:text-amber-400">Medium</span>
                        </div>
                        <Progress value={55} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Agent Performance Analysis */}
      {activeMetric === 'agents' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Agent Performance Analysis</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Detailed performance metrics for each trading agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentPerformance.map((agent, index) => (
                  <motion.div
                    key={agent.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{agent.name}</h4>
                      <Badge 
                        className={
                          agent.returns > 0 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                        }
                      >
                        {agent.returns > 0 ? '+' : ''}{agent.returns}%
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Returns</span>
                        <p className={`font-bold ${getPerformanceColor(agent.returns)}`}>
                          {agent.returns > 0 ? '+' : ''}{agent.returns}%
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Volatility</span>
                        <p className="font-bold text-gray-900 dark:text-gray-100">{agent.volatility}%</p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Sharpe</span>
                        <p className="font-bold text-gray-900 dark:text-gray-100">{agent.sharpe}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Max DD</span>
                        <p className="font-bold text-rose-600 dark:text-rose-400">{agent.maxDD}%</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

export default AnalyticsView