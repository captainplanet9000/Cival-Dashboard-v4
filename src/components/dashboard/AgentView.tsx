'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Bot, 
  Play, 
  Pause, 
  Settings, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Activity,
  Plus,
  RefreshCw
} from 'lucide-react'
import { useAgentStore } from '@/lib/store/agentStore'
import { useWalletStore } from '@/lib/store/walletStore'

export function AgentView() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const agentStore = useAgentStore()
  const walletStore = useWalletStore()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      case 'paused': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
      case 'error': return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return 'text-emerald-600 dark:text-emerald-400'
    if (pnl < 0) return 'text-rose-600 dark:text-rose-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const totalAgentValue = agentStore.agents.reduce((sum, agent) => sum + agent.balance, 0)
  const activeAgents = agentStore.agents.filter(agent => agent.status === 'active')
  const totalPnL = agentStore.agents.reduce((sum, agent) => sum + agent.totalPnL, 0)
  const avgWinRate = agentStore.agents.length > 0 
    ? agentStore.agents.reduce((sum, agent) => sum + agent.winRate, 0) / agentStore.agents.length 
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <Bot className="w-6 h-6 mr-3 text-violet-600" />
            Agent Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and monitor your autonomous trading agents
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => agentStore.initialize()}
            disabled={agentStore.loading}
            className="border-gray-300 dark:border-gray-600"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${agentStore.loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </div>
      </div>

      {/* Agent Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200 dark:from-violet-950 dark:to-violet-900 dark:border-violet-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-violet-600 dark:text-violet-400">Total Value</p>
                  <p className="text-xl font-bold text-violet-900 dark:text-violet-100">
                    ${totalAgentValue.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-violet-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-950 dark:to-emerald-900 dark:border-emerald-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Active Agents</p>
                  <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                    {activeAgents.length}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    of {agentStore.agents.length} total
                  </p>
                </div>
                <Bot className="h-8 w-8 text-emerald-500" />
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
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Total P&L</p>
                  <p className={`text-xl font-bold ${getPnLColor(totalPnL)}`}>
                    ${totalPnL.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-amber-500" />
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
                  <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400">Avg Win Rate</p>
                  <p className="text-xl font-bold text-cyan-900 dark:text-cyan-100">
                    {avgWinRate.toFixed(1)}%
                  </p>
                </div>
                <Activity className="h-8 w-8 text-cyan-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agentStore.agents.map((agent, index) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedAgent === agent.id 
                  ? 'ring-2 ring-violet-500 bg-violet-50 dark:bg-violet-950' 
                  : 'bg-white dark:bg-gray-900'
              } border-gray-200 dark:border-gray-800`}
              onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-violet-100 dark:bg-violet-900 rounded-lg flex items-center justify-center">
                      <Bot className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-gray-900 dark:text-gray-100">
                        {agent.name}
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400 capitalize">
                        {agent.type} • {agent.strategy}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(agent.status)}>
                    {agent.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Balance</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      ${agent.balance.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">24h P&L</p>
                    <p className={`text-sm font-bold ${getPnLColor(agent.pnl24h)}`}>
                      {agent.pnl24h >= 0 ? '+' : ''}${agent.pnl24h.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Total Trades</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {agent.totalTrades}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Win Rate</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {agent.winRate.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Win Rate Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Performance</span>
                    <span className="text-xs text-gray-900 dark:text-gray-100 font-medium">
                      {agent.winRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={agent.winRate} 
                    className="h-2"
                  />
                </div>

                {/* Agent Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    {agent.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          agentStore.stopAgent(agent.id)
                        }}
                        className="border-gray-300 dark:border-gray-600"
                      >
                        <Pause className="h-3 w-3 mr-1" />
                        Pause
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          agentStore.startAgent(agent.id)
                        }}
                        className="border-gray-300 dark:border-gray-600"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle settings
                      }}
                      className="border-gray-300 dark:border-gray-600"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(agent.lastActivity).toLocaleDateString()}
                  </span>
                </div>

                {/* Expanded Details */}
                {selectedAgent === agent.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3"
                  >
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Configuration
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Max Risk:</span>
                          <span className="ml-1 text-gray-900 dark:text-gray-100">
                            {agent.riskParameters?.maxRisk || 5}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Stop Loss:</span>
                          <span className="ml-1 text-gray-900 dark:text-gray-100">
                            {agent.riskParameters?.stopLoss || -2}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Take Profit:</span>
                          <span className="ml-1 text-gray-900 dark:text-gray-100">
                            {agent.riskParameters?.takeProfit || 3}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Timeframe:</span>
                          <span className="ml-1 text-gray-900 dark:text-gray-100">
                            {agent.configuration?.timeframe || '1h'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Performance Metrics
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total P&L:</span>
                          <span className={`font-medium ${getPnLColor(agent.totalPnL)}`}>
                            ${agent.totalPnL.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">P&L %:</span>
                          <span className={`font-medium ${getPnLColor(agent.pnlPercent)}`}>
                            {agent.pnlPercent >= 0 ? '+' : ''}{agent.pnlPercent.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Successful Trades:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {agent.successfulTrades}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-gray-300 dark:border-gray-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle fund agent
                      }}
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      Fund Agent
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Empty State */}
        {agentStore.agents.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full"
          >
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardContent className="text-center py-12">
                <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No agents created yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create your first autonomous trading agent to start trading
                </p>
                <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Agent
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default AgentView