'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Bot, 
  Shield, 
  Zap,
  Target,
  BarChart3,
  RefreshCw,
  Bell,
  Users,
  Calendar,
  Wallet,
  PieChart,
  Plus,
  Menu,
  X
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Store imports
import { useWalletStore } from '@/lib/store/walletStore'
import { useAgentStore } from '@/lib/store/agentStore'
import { useFarmStore } from '@/lib/store/farmStore'

// Sub-components
import { CalendarView } from './CalendarView'
import { AgentView } from './AgentView'
import { PortfolioView } from './PortfolioView'
import { AnalyticsView } from './AnalyticsView'

interface DashboardTab {
  id: string
  label: string
  icon: React.ReactNode
  component: React.ReactNode
}

export function ModernDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Store integration
  const walletStore = useWalletStore()
  const agentStore = useAgentStore()
  const farmStore = useFarmStore()

  // Initialize stores
  useEffect(() => {
    const initializeStores = async () => {
      try {
        setIsLoading(true)
        await Promise.all([
          walletStore.initialize(),
          agentStore.initialize(),
          farmStore.initialize()
        ])
      } catch (error) {
        console.error('Failed to initialize stores:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    initializeStores()
  }, [])

  // Mock data for demonstration
  const performanceData = [
    { date: '2024-01-01', value: 10000, pnl: 0 },
    { date: '2024-01-02', value: 10250, pnl: 250 },
    { date: '2024-01-03', value: 10180, pnl: 180 },
    { date: '2024-01-04', value: 10420, pnl: 420 },
    { date: '2024-01-05', value: 10680, pnl: 680 },
    { date: '2024-01-06', value: 10840, pnl: 840 },
    { date: '2024-01-07', value: 11200, pnl: 1200 },
  ]

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
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
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Portfolio Value</p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    ${walletStore.totalBalance.toLocaleString()}
                  </p>
                </div>
                <div className="h-10 w-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs">
                <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
                <span className="text-emerald-600 dark:text-emerald-400">+2.4% today</span>
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
                  <p className="text-sm font-medium text-violet-600 dark:text-violet-400">Active Agents</p>
                  <p className="text-2xl font-bold text-violet-900 dark:text-violet-100">
                    {agentStore.agents.filter(a => a.status === 'active').length}
                  </p>
                </div>
                <div className="h-10 w-10 bg-violet-500 rounded-lg flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs">
                <Activity className="h-3 w-3 text-violet-500 mr-1" />
                <span className="text-violet-600 dark:text-violet-400">{agentStore.agents.length} total</span>
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
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">24h P&L</p>
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                    +$1,247
                  </p>
                </div>
                <div className="h-10 w-10 bg-amber-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs">
                <TrendingUp className="h-3 w-3 text-amber-500 mr-1" />
                <span className="text-amber-600 dark:text-amber-400">+3.2%</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200 dark:from-rose-950 dark:to-rose-900 dark:border-rose-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Risk Score</p>
                  <p className="text-2xl font-bold text-rose-900 dark:text-rose-100">7.2</p>
                </div>
                <div className="h-10 w-10 bg-rose-500 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-2">
                <Progress value={72} className="h-2 bg-rose-200" />
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-900 dark:text-gray-100">Portfolio Performance</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  7-day performance overview
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      color: '#374151'
                    }}
                    formatter={(value, name) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Quick Actions</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Essential trading operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                className="h-16 flex flex-col space-y-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => walletStore.connectWallet()}
                disabled={walletStore.loading}
              >
                <Wallet className="h-5 w-5" />
                <span className="text-sm">Connect Wallet</span>
              </Button>
              
              <Button className="h-16 flex flex-col space-y-2 bg-violet-600 hover:bg-violet-700 text-white">
                <Plus className="h-5 w-5" />
                <span className="text-sm">Create Agent</span>
              </Button>
              
              <Button className="h-16 flex flex-col space-y-2 bg-amber-600 hover:bg-amber-700 text-white">
                <Target className="h-5 w-5" />
                <span className="text-sm">New Strategy</span>
              </Button>
              
              <Button className="h-16 flex flex-col space-y-2 bg-gray-600 hover:bg-gray-700 text-white">
                <BarChart3 className="h-5 w-5" />
                <span className="text-sm">View Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )

  const tabs: DashboardTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <BarChart3 className="w-4 h-4" />,
      component: <OverviewTab />
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      icon: <PieChart className="w-4 h-4" />,
      component: <PortfolioView />
    },
    {
      id: 'agents',
      label: 'Agents',
      icon: <Bot className="w-4 h-4" />,
      component: <AgentView />
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: <Calendar className="w-4 h-4" />,
      component: <CalendarView />
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <Activity className="w-4 h-4" />,
      component: <AnalyticsView />
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="border-gray-300 dark:border-gray-600"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="hidden lg:block w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Cival AI
            </h2>
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 lg:hidden"
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                  Cival AI
                </h2>
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id)
                        setIsMobileMenuOpen(false)
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                      }`}
                    >
                      {tab.icon}
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          <div className="p-4 lg:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {tabs.find(tab => tab.id === activeTab)?.component}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}

export default ModernDashboard