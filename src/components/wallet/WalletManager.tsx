'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  Plus,
  Send,
  Download,
  RefreshCw,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  Copy,
  Activity,
  Users,
  DollarSign,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from 'react-hot-toast';
import { useWalletStore } from '@/lib/store/walletStore';
import { useAgentStore } from '@/lib/store/agentStore';
import { useFarmStore } from '@/lib/store/farmStore';
import { formatPrice } from '@/lib/utils';

const WalletManager: React.FC = () => {
  const [showBalances, setShowBalances] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositToken, setDepositToken] = useState('USDC');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferToken, setTransferToken] = useState('USDC');
  const [transferTarget, setTransferTarget] = useState('');
  const [transferType, setTransferType] = useState<'agent' | 'farm'>('agent');

  const {
    totalBalance,
    balances,
    transactions,
    isConnected,
    address,
    loading,
    connectWallet,
    disconnectWallet,
    deposit,
    transferToAgent,
    transferToFarm,
    loadBalance,
    refreshPrices
  } = useWalletStore();

  const { agents } = useAgentStore();
  const { farms } = useFarmStore();

  useEffect(() => {
    if (isConnected) {
      loadBalance();
      // Refresh data every 30 seconds
      const interval = setInterval(() => {
        refreshPrices();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isConnected, loadBalance, refreshPrices]);

  const handleDeposit = async () => {
    if (!depositAmount || isNaN(Number(depositAmount))) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await deposit(Number(depositAmount), depositToken);
      setDepositAmount('');
      toast.success(`Successfully deposited ${depositAmount} ${depositToken}`);
    } catch (error) {
      toast.error('Failed to deposit funds');
    }
  };

  const handleQuickDeposit = async (amount: number) => {
    try {
      await deposit(amount, 'USDC');
      toast.success(`Successfully deposited $${amount} USDC`);
    } catch (error) {
      toast.error('Failed to deposit funds');
    }
  };

  const handleTransfer = async () => {
    if (!transferAmount || isNaN(Number(transferAmount))) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!transferTarget) {
      toast.error('Please select a target');
      return;
    }

    try {
      if (transferType === 'agent') {
        await transferToAgent(transferTarget, Number(transferAmount), transferToken);
        toast.success(`Successfully transferred ${transferAmount} ${transferToken} to agent`);
      } else {
        await transferToFarm(transferTarget, Number(transferAmount), transferToken);
        toast.success(`Successfully transferred ${transferAmount} ${transferToken} to farm`);
      }
      
      setTransferAmount('');
      setTransferTarget('');
    } catch (error) {
      toast.error('Failed to transfer funds');
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'transfer':
        return <Send className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Wallet className="h-16 w-16 mx-auto text-blue-500 mb-4" />
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Connect your wallet to start funding agents and managing your trading portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={connectWallet} className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Start with $50 USDC to begin autonomous trading
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Wallet className="w-7 h-7 text-blue-600 mr-3" />
            Wallet Manager
          </h1>
          <p className="text-gray-600 mt-1">
            Manage funds and fuel your autonomous trading agents
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={refreshPrices} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={disconnectWallet}>
            Disconnect
          </Button>
        </div>
      </div>

      {/* Wallet Overview */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Total Portfolio Value</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-600">Address:</span>
                  <code className="text-sm bg-white px-2 py-1 rounded">
                    {truncateAddress(address || '')}
                  </code>
                  <Button variant="ghost" size="sm" onClick={copyAddress}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBalances(!showBalances)}
            >
              {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Total Balance</p>
              <p className="text-3xl font-bold text-gray-900">
                {showBalances ? formatPrice(totalBalance) : '••••••'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Active Agents</p>
              <p className="text-2xl font-semibold text-blue-600">
                {agents.filter(agent => agent.status === 'active').length}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Active Farms</p>
              <p className="text-2xl font-semibold text-green-600">
                {farms.filter(farm => farm.status === 'active').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          onClick={() => handleQuickDeposit(50)}
          className="h-20 flex-col space-y-2"
          variant="outline"
        >
          <Plus className="h-6 w-6" />
          <span>Add $50</span>
        </Button>
        
        <Button
          onClick={() => handleQuickDeposit(100)}
          className="h-20 flex-col space-y-2"
          variant="outline"
        >
          <Plus className="h-6 w-6" />
          <span>Add $100</span>
        </Button>
        
        <Button
          onClick={() => handleQuickDeposit(500)}
          className="h-20 flex-col space-y-2"
          variant="outline"
        >
          <Plus className="h-6 w-6" />
          <span>Add $500</span>
        </Button>
        
        <Button
          onClick={() => handleQuickDeposit(1000)}
          className="h-20 flex-col space-y-2"
          variant="outline"
        >
          <Plus className="h-6 w-6" />
          <span>Add $1000</span>
        </Button>
      </div>

      <Tabs defaultValue="balances" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="transfer">Transfer</TabsTrigger>
        </TabsList>

        <TabsContent value="balances" className="space-y-4">
          <div className="grid gap-4">
            {balances.map((balance) => (
              <Card key={balance.token}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold">{balance.symbol}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{balance.token}</p>
                        <p className="text-sm text-gray-600">
                          {formatPrice(balance.price)} per {balance.symbol}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold">
                        {showBalances ? balance.amount.toFixed(4) : '••••'} {balance.symbol}
                      </p>
                      <p className="text-sm text-gray-600">
                        {showBalances ? formatPrice(balance.value) : '••••••'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deposit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deposit Funds</CardTitle>
              <CardDescription>
                Add funds to your wallet to fuel trading operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token
                  </label>
                  <Select value={depositToken} onValueChange={setDepositToken}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="BTC">BTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button onClick={handleDeposit} className="w-full" disabled={loading}>
                <Download className="mr-2 h-4 w-4" />
                Deposit Funds
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transfer to Agents & Farms</CardTitle>
              <CardDescription>
                Fund your trading agents and farms directly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transfer Type
                </label>
                <Tabs value={transferType} onValueChange={(value) => setTransferType(value as 'agent' | 'farm')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="agent">
                      <Users className="mr-2 h-4 w-4" />
                      Agent
                    </TabsTrigger>
                    <TabsTrigger value="farm">
                      <Activity className="mr-2 h-4 w-4" />
                      Farm
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token
                  </label>
                  <Select value={transferToken} onValueChange={setTransferToken}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="BTC">BTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {transferType === 'agent' ? 'Select Agent' : 'Select Farm'}
                </label>
                <Select value={transferTarget} onValueChange={setTransferTarget}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Choose ${transferType}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {transferType === 'agent'
                      ? agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name} - {formatPrice(agent.balance)}
                          </SelectItem>
                        ))
                      : farms.map((farm) => (
                          <SelectItem key={farm.id} value={farm.id}>
                            {farm.name} - {formatPrice(farm.currentValue)}
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleTransfer} className="w-full" disabled={loading}>
                <Send className="mr-2 h-4 w-4" />
                Transfer Funds
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Your latest wallet activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400">Make your first deposit to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(tx.type)}
                    <div>
                      <p className="font-medium capitalize">{tx.type}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(tx.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold">
                      {tx.type === 'withdrawal' ? '-' : '+'}
                      {tx.amount} {tx.token}
                    </p>
                    <Badge variant={tx.status === 'confirmed' ? 'default' : tx.status === 'pending' ? 'secondary' : 'destructive'}>
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletManager;