'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  PieChart, 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Send
} from 'lucide-react'
import { useWalletStore } from '@/lib/store/walletStore'
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

export function PortfolioView() {
  const [activeTimeframe, setActiveTimeframe] = useState('7d')
  const walletStore = useWalletStore()

  // Prepare pie chart data
  const pieChartData = walletStore.balances.map((balance, index) => ({
    name: balance.symbol,
    value: balance.value,
    color: COLORS[index % COLORS.length]
  }))

  const totalValue = walletStore.totalBalance
  const todayChange = 1247 // Mock data
  const todayChangePercent = 3.2 // Mock data

  const timeframes = [
    { id: '1d', label: '1D' },
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: '90d', label: '90D' },
    { id: '1y', label: '1Y' }
  ]

  const recentTransactions = walletStore.transactions.slice(0, 5)

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
      case 'withdrawal': return <ArrowUpRight className="h-4 w-4 text-rose-600" />
      case 'transfer': return <Send className="h-4 w-4 text-violet-600" />
      default: return <DollarSign className="h-4 w-4 text-gray-600" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'text-emerald-600 dark:text-emerald-400'
      case 'withdrawal': return 'text-rose-600 dark:text-rose-400'
      case 'transfer': return 'text-violet-600 dark:text-violet-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <PieChart className="w-6 h-6 mr-3 text-emerald-600" />
            Portfolio Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your assets and portfolio performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => walletStore.refreshPrices()}
            disabled={walletStore.loading}
            className="border-gray-300 dark:border-gray-600"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${walletStore.loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Funds
          </Button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2"
        >
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-950 dark:to-emerald-900 dark:border-emerald-800">
            <CardHeader>
              <CardDescription className="text-emerald-600 dark:text-emerald-400">
                Total Portfolio Value
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                ${totalValue.toLocaleString()}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="font-medium">
                    +${todayChange.toLocaleString()} ({todayChangePercent}%)
                  </span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 text-sm">today</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                {timeframes.map((timeframe) => (
                  <Button
                    key={timeframe.id}
                    variant={activeTimeframe === timeframe.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTimeframe(timeframe.id)}
                    className={
                      activeTimeframe === timeframe.id
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300"
                    }
                  >
                    {timeframe.label}
                  </Button>
                ))}
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
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Portfolio Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Value']}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Holdings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Holdings</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Your current token balances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {walletStore.balances.map((balance, index) => (
                  <div 
                    key={balance.token} 
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      >
                        {balance.symbol.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {balance.token}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ${balance.price.toFixed(2)} per token
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        {balance.amount.toFixed(4)} {balance.symbol}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ${balance.value.toLocaleString()}
                      </p>
                      <div className="mt-1">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">
                          {((balance.value / totalValue) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {walletStore.balances.length === 0 && (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No holdings yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Connect your wallet to start trading
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Recent Transactions</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Latest portfolio activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                          {transaction.type}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(transaction.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'withdrawal' ? '-' : '+'}
                        {transaction.amount} {transaction.token}
                      </p>
                      <Badge 
                        variant={
                          transaction.status === 'confirmed' ? 'default' : 
                          transaction.status === 'pending' ? 'secondary' : 'destructive'
                        }
                        className="text-xs"
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}

                {recentTransactions.length === 0 && (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No transactions yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Start trading to see activity here
                    </p>
                  </div>
                )}
              </div>

              {recentTransactions.length > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-300 dark:border-gray-600"
                  >
                    View All Transactions
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Quick Actions</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Manage your portfolio with one click
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                className="h-20 flex flex-col space-y-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  // Handle deposit
                }}
              >
                <ArrowDownLeft className="h-6 w-6" />
                <span>Deposit</span>
              </Button>
              
              <Button 
                className="h-20 flex flex-col space-y-2 bg-rose-600 hover:bg-rose-700 text-white"
                onClick={() => {
                  // Handle withdrawal
                }}
              >
                <ArrowUpRight className="h-6 w-6" />
                <span>Withdraw</span>
              </Button>
              
              <Button 
                className="h-20 flex flex-col space-y-2 bg-violet-600 hover:bg-violet-700 text-white"
                onClick={() => {
                  // Handle transfer
                }}
              >
                <Send className="h-6 w-6" />
                <span>Transfer</span>
              </Button>
              
              <Button 
                className="h-20 flex flex-col space-y-2 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => {
                  // Handle rebalance
                }}
              >
                <PieChart className="h-6 w-6" />
                <span>Rebalance</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default PortfolioView