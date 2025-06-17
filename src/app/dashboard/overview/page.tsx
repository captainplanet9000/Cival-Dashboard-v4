'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  Target,
  Shield,
  Zap,
  BarChart3,
  LineChart,
  ExternalLink,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Bot,
  Users,
  Wallet,
  Plus
} from "lucide-react";
import { formatPrice, formatPercentage } from "@/lib/utils";
import { useWalletStore } from '@/lib/store/walletStore';
import { useAgentStore } from '@/lib/store/agentStore';
import { useFarmStore } from '@/lib/store/farmStore';
import { useRealTimeData, useLiveMarketData } from '@/lib/hooks/useRealTimeData';
import { toast } from 'react-hot-toast';
import Link from "next/link";

export default function OverviewPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { 
    totalBalance, 
    balances, 
    isConnected, 
    connectWallet, 
    refreshPrices,
    loading: walletLoading 
  } = useWalletStore();
  
  const { 
    agents, 
    fetchAgents, 
    refreshAgentData,
    loading: agentLoading 
  } = useAgentStore();

  // Real-time data integration
  const { 
    connected: wsConnected, 
    marketData, 
    agentStatus, 
    portfolio,
    systemAlerts 
  } = useRealTimeData({
    symbols: ['BTC/USD', 'ETH/USD', 'USDC/USD'],
    agentIds: agents.map(a => a.id),
    enableMarketData: true,
    enableAgentStatus: true,
    enablePortfolio: true,
    enableAlerts: true
  });

  const { data: liveMarketData, loading: marketLoading } = useLiveMarketData(['BTC/USD', 'ETH/USD', 'USDC/USD']);
  
  const { 
    farms, 
    fetchFarms,
    loading: farmLoading 
  } = useFarmStore();

  useEffect(() => {
    // Initial data fetch
    fetchAgents();
    fetchFarms();
    if (isConnected) {
      refreshPrices();
    }
  }, [fetchAgents, fetchFarms, isConnected, refreshPrices]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        if (isConnected) {
          refreshPrices();
        }
        agents.forEach(agent => refreshAgentData(agent.id));
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isConnected, refreshPrices, agents, refreshAgentData]);

  // Calculate metrics
  const totalAgentValue = agents.reduce((sum, agent) => sum + agent.balance, 0);
  const totalFarmValue = farms.reduce((sum, farm) => sum + farm.totalValue, 0);
  const activeAgents = agents.filter(agent => agent.status === 'active').length;
  const activeFarms = farms.filter(farm => farm.status === 'active').length;
  const totalPnl24h = agents.reduce((sum, agent) => sum + agent.pnl24h, 0) + 
                     farms.reduce((sum, farm) => sum + farm.pnl24h, 0);
  const totalTrades24h = agents.reduce((sum, agent) => sum + agent.trades24h, 0);
  const avgWinRate = agents.length > 0 ? agents.reduce((sum, agent) => sum + agent.winRate, 0) / agents.length : 0;

  const portfolioTotal = totalBalance + totalAgentValue + totalFarmValue;
  const pnlPercent = portfolioTotal > 0 ? (totalPnl24h / portfolioTotal) * 100 : 0;

  const isLoading = walletLoading || agentLoading || farmLoading;

  const handleRefreshAll = async () => {
    try {
      if (isConnected) {
        await refreshPrices();
      }
      await Promise.all([
        fetchAgents(),
        fetchFarms(),
        ...agents.map(agent => refreshAgentData(agent.id))
      ]);
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trading Overview</h1>
          <p className="text-muted-foreground">
            Monitor your autonomous trading portfolio and agent performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Clock className={`mr-2 h-4 w-4 ${autoRefresh ? 'text-green-500' : 'text-gray-400'}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" onClick={handleRefreshAll} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Wallet Not Connected</p>
                <p className="text-sm text-yellow-600">Connect your wallet to start trading with real funds</p>
              </div>
            </div>
            <Button onClick={connectWallet}>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Portfolio</p>
                <p className="text-3xl font-bold">{formatPrice(portfolioTotal)}</p>
                <p className={`text-xs ${totalPnl24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPnl24h >= 0 ? '+' : ''}{formatPrice(totalPnl24h)} ({pnlPercent.toFixed(2)}%)
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Agents</p>
                <p className="text-3xl font-bold">{activeAgents}</p>
                <p className="text-xs text-muted-foreground">of {agents.length} total</p>
              </div>
              <Bot className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Farms</p>
                <p className="text-3xl font-bold">{activeFarms}</p>
                <p className="text-xs text-muted-foreground">of {farms.length} total</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">24h Trades</p>
                <p className="text-3xl font-bold">{totalTrades24h}</p>
                <p className="text-xs text-muted-foreground">Avg win: {avgWinRate.toFixed(1)}%</p>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link href="/dashboard/vault">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Wallet className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Wallet</h3>
                  <p className="text-sm text-muted-foreground">
                    Deposit funds and transfer to agents
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatPrice(totalBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link href="/dashboard/agents">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Bot className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Agents</h3>
                  <p className="text-sm text-muted-foreground">
                    Create and fund trading agents
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    {formatPrice(totalAgentValue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link href="/dashboard/farms">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Farms</h3>
                  <p className="text-sm text-muted-foreground">
                    Organize agent groups
                  </p>
                  <p className="text-lg font-bold text-purple-600">
                    {formatPrice(totalFarmValue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Agent Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Agents</CardTitle>
            <CardDescription>
              Best performing agents in the last 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            {agents.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No agents created yet</p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard/agents">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Agent
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {agents
                  .sort((a, b) => b.pnlPercent - a.pnlPercent)
                  .slice(0, 5)
                  .map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`h-3 w-3 rounded-full ${
                          agent.status === 'active' ? 'bg-green-500' : 
                          agent.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`} />
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-sm text-gray-600 capitalize">{agent.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatPrice(agent.balance)}</p>
                        <p className={`text-sm ${agent.pnl24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {agent.pnl24h >= 0 ? '+' : ''}{formatPrice(agent.pnl24h)} ({agent.pnlPercent.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio Allocation</CardTitle>
            <CardDescription>
              Distribution of funds across wallets, agents, and farms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Wallet className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Wallet Balance</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(totalBalance)}</p>
                  <p className="text-sm text-gray-600">
                    {portfolioTotal > 0 ? ((totalBalance / portfolioTotal) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Bot className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Agent Balances</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(totalAgentValue)}</p>
                  <p className="text-sm text-gray-600">
                    {portfolioTotal > 0 ? ((totalAgentValue / portfolioTotal) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">Farm Values</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(totalFarmValue)}</p>
                  <p className="text-sm text-gray-600">
                    {portfolioTotal > 0 ? ((totalFarmValue / portfolioTotal) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Overview of trading system health and connectivity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Trading Engine</p>
                <p className="text-sm text-gray-600">Operational</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              {isConnected ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="font-medium">Wallet Connection</p>
                <p className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Data Services</p>
                <p className="text-sm text-gray-600">Online</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest agent actions and performance updates
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/analytics">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Analytics
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent activity</p>
              <p className="text-sm text-gray-400">Create agents to start seeing trading activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agents
                .filter(agent => agent.trades24h > 0)
                .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())
                .slice(0, 10)
                .map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center space-x-3">
                      <Bot className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-gray-600">
                          {agent.trades24h} trades • Win rate: {agent.winRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${agent.pnl24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {agent.pnl24h >= 0 ? '+' : ''}{formatPrice(agent.pnl24h)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(agent.lastActive).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}