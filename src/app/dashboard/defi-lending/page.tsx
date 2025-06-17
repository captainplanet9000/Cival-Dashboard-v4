'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Layers,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  PieChart,
  BarChart3,
  Zap,
  Target,
  Wallet,
  Plus,
  Minus,
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';
import { formatPrice, formatPercentage } from '@/lib/utils';
import { useWalletStore } from '@/lib/store/walletStore';
import { toast } from 'react-hot-toast';

// DeFi Protocol Configurations
const defiProtocols = [
  {
    id: 'aave',
    name: 'Aave',
    description: 'Leading DeFi lending protocol with variable rates',
    logo: '🌊',
    tvl: 8420000000,
    markets: [
      {
        asset: 'USDC',
        supplyAPY: 4.23,
        borrowAPY: 5.67,
        totalSupplied: 2500000,
        totalBorrowed: 1800000,
        liquidationThreshold: 85,
        collateralFactor: 80
      },
      {
        asset: 'ETH',
        supplyAPY: 2.89,
        borrowAPY: 3.45,
        totalSupplied: 450000,
        totalBorrowed: 320000,
        liquidationThreshold: 80,
        collateralFactor: 75
      },
      {
        asset: 'WBTC',
        supplyAPY: 1.56,
        borrowAPY: 2.12,
        totalSupplied: 8900,
        totalBorrowed: 6200,
        liquidationThreshold: 70,
        collateralFactor: 65
      }
    ],
    features: ['Flash Loans', 'Credit Delegation', 'Rate Switching'],
    riskLevel: 'Low',
    auditScore: 95
  },
  {
    id: 'compound',
    name: 'Compound',
    description: 'Autonomous interest rate protocol on Ethereum',
    logo: '🏛️',
    tvl: 3200000000,
    markets: [
      {
        asset: 'USDC',
        supplyAPY: 3.89,
        borrowAPY: 5.23,
        totalSupplied: 1800000,
        totalBorrowed: 1200000,
        liquidationThreshold: 75,
        collateralFactor: 70
      },
      {
        asset: 'ETH',
        supplyAPY: 2.34,
        borrowAPY: 3.12,
        totalSupplied: 280000,
        totalBorrowed: 190000,
        liquidationThreshold: 75,
        collateralFactor: 70
      }
    ],
    features: ['Governance Token', 'Auto-compounding', 'Liquidation Protection'],
    riskLevel: 'Low',
    auditScore: 92
  },
  {
    id: 'yearn',
    name: 'Yearn Finance',
    description: 'Yield aggregation protocol for maximum returns',
    logo: '💰',
    tvl: 1800000000,
    markets: [
      {
        asset: 'USDC',
        supplyAPY: 6.45,
        borrowAPY: 0, // Yearn is supply-only
        totalSupplied: 890000,
        totalBorrowed: 0,
        liquidationThreshold: 0,
        collateralFactor: 0
      },
      {
        asset: 'ETH',
        supplyAPY: 4.12,
        borrowAPY: 0,
        totalSupplied: 150000,
        totalBorrowed: 0,
        liquidationThreshold: 0,
        collateralFactor: 0
      }
    ],
    features: ['Auto-optimization', 'Strategy Vaults', 'Gas Optimization'],
    riskLevel: 'Medium',
    auditScore: 88
  },
  {
    id: 'maker',
    name: 'MakerDAO',
    description: 'Decentralized stablecoin protocol with DAI',
    logo: '🏦',
    tvl: 5600000000,
    markets: [
      {
        asset: 'ETH',
        supplyAPY: 0, // Maker is borrow-only for DAI
        borrowAPY: 3.75,
        totalSupplied: 0,
        totalBorrowed: 890000, // DAI borrowed
        liquidationThreshold: 150,
        collateralFactor: 67
      },
      {
        asset: 'WBTC',
        supplyAPY: 0,
        borrowAPY: 4.25,
        totalSupplied: 0,
        totalBorrowed: 320000,
        liquidationThreshold: 130,
        collateralFactor: 77
      }
    ],
    features: ['DAI Stablecoin', 'Vaults', 'Governance'],
    riskLevel: 'Low',
    auditScore: 96
  }
];

interface Position {
  id: string;
  protocol: string;
  asset: string;
  type: 'supply' | 'borrow' | 'withdraw' | 'repay';
  amount: number;
  value: number;
  apy: number;
  earned: number;
  healthFactor: number | null;
  startDate: string;
  collateral?: string;
  collateralAmount?: number;
}

// Mock user positions
const mockPositions: Position[] = [
  {
    id: 'pos-1',
    protocol: 'aave',
    asset: 'USDC',
    type: 'supply',
    amount: 5000,
    value: 5000,
    apy: 4.23,
    earned: 47.85,
    healthFactor: null,
    startDate: '2024-01-10'
  },
  {
    id: 'pos-2',
    protocol: 'compound',
    asset: 'ETH',
    type: 'supply',
    amount: 2.5,
    value: 8100,
    apy: 2.34,
    earned: 23.67,
    healthFactor: null,
    startDate: '2024-01-08'
  },
  {
    id: 'pos-3',
    protocol: 'aave',
    asset: 'USDC',
    type: 'borrow',
    amount: 2000,
    value: 2000,
    apy: 5.67,
    earned: -18.92, // Interest paid
    healthFactor: 2.45,
    collateral: 'ETH',
    collateralAmount: 1.2,
    startDate: '2024-01-12'
  }
];

export default function DeFiLendingPage() {
  const [selectedProtocol, setSelectedProtocol] = useState('aave');
  const [selectedAsset, setSelectedAsset] = useState('USDC');
  const [actionType, setActionType] = useState<'supply' | 'borrow' | 'withdraw' | 'repay'>('supply');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState<Position[]>(mockPositions);

  const { totalBalance, isConnected, connectWallet } = useWalletStore();

  const selectedProtocolData = defiProtocols.find(p => p.id === selectedProtocol);
  const selectedMarket = selectedProtocolData?.markets.find(m => m.asset === selectedAsset);

  // Calculate portfolio metrics
  const totalSupplied = positions
    .filter(p => p.type === 'supply')
    .reduce((sum, p) => sum + p.value, 0);

  const totalBorrowed = positions
    .filter(p => p.type === 'borrow')
    .reduce((sum, p) => sum + p.value, 0);

  const totalEarned = positions.reduce((sum, p) => sum + p.earned, 0);

  const netWorth = totalSupplied - totalBorrowed;
  const borrowUtilization = totalSupplied > 0 ? (totalBorrowed / totalSupplied) * 100 : 0;

  const handleTransaction = async () => {
    if (!amount || !selectedProtocolData || !selectedMarket) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newPosition: Position = {
        id: `pos-${Date.now()}`,
        protocol: selectedProtocol,
        asset: selectedAsset,
        type: actionType,
        amount: Number(amount),
        value: Number(amount) * (selectedAsset === 'ETH' ? 3240 : selectedAsset === 'WBTC' ? 97500 : 1),
        apy: actionType === 'supply' ? selectedMarket.supplyAPY : selectedMarket.borrowAPY,
        earned: 0,
        healthFactor: actionType === 'borrow' ? 2.8 : null,
        startDate: new Date().toISOString().split('T')[0],
        ...(actionType === 'borrow' && {
          collateral: 'ETH',
          collateralAmount: Number(amount) * 0.5
        })
      };

      setPositions(prev => [...prev, newPosition]);
      setAmount('');
      toast.success(`Successfully ${actionType === 'supply' ? 'supplied' : actionType === 'borrow' ? 'borrowed' : actionType === 'withdraw' ? 'withdrew' : 'repaid'} ${amount} ${selectedAsset}`);
    } catch (error) {
      toast.error(`Failed to ${actionType} ${selectedAsset}`);
    }
    setLoading(false);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'High': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthFactorColor = (factor: number | null) => {
    if (!factor) return 'text-gray-500';
    if (factor >= 2) return 'text-green-600';
    if (factor >= 1.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Layers className="h-16 w-16 mx-auto text-blue-500 mb-4" />
            <CardTitle>Connect to DeFi</CardTitle>
            <CardDescription>
              Connect your wallet to access DeFi lending and borrowing protocols
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={connectWallet} className="w-full">
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">Access to:</p>
              <div className="flex justify-center space-x-4 mt-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Lending</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Borrowing</span>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Yield Farming</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DeFi Lending</h1>
          <p className="text-muted-foreground">
            Lend, borrow, and earn yield across multiple DeFi protocols
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Rates
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Position
          </Button>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Supplied</p>
                <p className="text-2xl font-bold text-green-600">{formatPrice(totalSupplied)}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Borrowed</p>
                <p className="text-2xl font-bold text-red-600">{formatPrice(totalBorrowed)}</p>
              </div>
              <ArrowDownLeft className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Worth</p>
                <p className={`text-2xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPrice(netWorth)}
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
                <p className="text-sm font-medium text-muted-foreground">Total Earned</p>
                <p className={`text-2xl font-bold ${totalEarned >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalEarned >= 0 ? '+' : ''}{formatPrice(totalEarned)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="protocols" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="protocols">Protocols</TabsTrigger>
          <TabsTrigger value="trade">Trade</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="protocols" className="space-y-6">
          {/* Protocol Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {defiProtocols.map((protocol) => (
              <Card key={protocol.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{protocol.logo}</span>
                      <div>
                        <CardTitle className="text-lg">{protocol.name}</CardTitle>
                        <CardDescription>{protocol.description}</CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">TVL</p>
                      <p className="font-semibold">{formatPrice(protocol.tvl)}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Risk Level</p>
                      <Badge variant="outline" className={getRiskColor(protocol.riskLevel)}>
                        {protocol.riskLevel}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Audit Score</p>
                      <p className="font-semibold">{protocol.auditScore}%</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Top Markets</p>
                    <div className="space-y-2">
                      {protocol.markets.slice(0, 2).map((market, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="font-medium">{market.asset}</span>
                          <div className="text-right">
                            <p className="text-sm text-green-600">Supply: {market.supplyAPY}%</p>
                            {market.borrowAPY > 0 && (
                              <p className="text-sm text-red-600">Borrow: {market.borrowAPY}%</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Features</p>
                    <div className="flex flex-wrap gap-1">
                      {protocol.features.map((feature, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setSelectedProtocol(protocol.id)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Use Protocol
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trade" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Trading Interface */}
            <Card>
              <CardHeader>
                <CardTitle>Trade DeFi Position</CardTitle>
                <CardDescription>
                  Supply, borrow, withdraw, or repay across DeFi protocols
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Protocol</label>
                    <Select value={selectedProtocol} onValueChange={setSelectedProtocol}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {defiProtocols.map((protocol) => (
                          <SelectItem key={protocol.id} value={protocol.id}>
                            {protocol.logo} {protocol.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Asset</label>
                    <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProtocolData?.markets.map((market) => (
                          <SelectItem key={market.asset} value={market.asset}>
                            {market.asset}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Action</label>
                  <Select value={actionType} onValueChange={(value: any) => setActionType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supply">Supply</SelectItem>
                      <SelectItem value="borrow">Borrow</SelectItem>
                      <SelectItem value="withdraw">Withdraw</SelectItem>
                      <SelectItem value="repay">Repay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                {selectedMarket && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Supply APY:</span>
                          <span className="text-green-600 font-medium">{selectedMarket.supplyAPY}%</span>
                        </div>
                        {selectedMarket.borrowAPY > 0 && (
                          <div className="flex justify-between">
                            <span>Borrow APY:</span>
                            <span className="text-red-600 font-medium">{selectedMarket.borrowAPY}%</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Liquidation Threshold:</span>
                          <span>{selectedMarket.liquidationThreshold}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button onClick={handleTransaction} className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {actionType === 'supply' && <Plus className="mr-2 h-4 w-4" />}
                      {actionType === 'borrow' && <ArrowDownLeft className="mr-2 h-4 w-4" />}
                      {actionType === 'withdraw' && <Minus className="mr-2 h-4 w-4" />}
                      {actionType === 'repay' && <ArrowUpRight className="mr-2 h-4 w-4" />}
                      {actionType.charAt(0).toUpperCase() + actionType.slice(1)} {selectedAsset}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Market Information */}
            <Card>
              <CardHeader>
                <CardTitle>Market Information</CardTitle>
                <CardDescription>
                  {selectedProtocolData?.name} - {selectedAsset} Market
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedMarket && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Supply APY</p>
                        <p className="text-2xl font-bold text-green-600">{selectedMarket.supplyAPY}%</p>
                      </div>
                      {selectedMarket.borrowAPY > 0 && (
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <p className="text-sm text-muted-foreground">Borrow APY</p>
                          <p className="text-2xl font-bold text-red-600">{selectedMarket.borrowAPY}%</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Supplied</span>
                        <span className="font-medium">{formatPrice(selectedMarket.totalSupplied)}</span>
                      </div>
                      {selectedMarket.totalBorrowed > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Borrowed</span>
                          <span className="font-medium">{formatPrice(selectedMarket.totalBorrowed)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Utilization Rate</span>
                        <span className="font-medium">
                          {selectedMarket.totalBorrowed > 0 
                            ? formatPercentage(selectedMarket.totalBorrowed / selectedMarket.totalSupplied)
                            : '0%'
                          }
                        </span>
                      </div>
                      {selectedMarket.liquidationThreshold > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Liquidation Threshold</span>
                          <span className="font-medium">{selectedMarket.liquidationThreshold}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="positions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your DeFi Positions</CardTitle>
              <CardDescription>
                Active lending and borrowing positions across protocols
              </CardDescription>
            </CardHeader>
            <CardContent>
              {positions.length === 0 ? (
                <div className="text-center py-12">
                  <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No positions yet</h3>
                  <p className="text-gray-500 mb-4">Start by supplying or borrowing assets</p>
                  <Button onClick={() => setSelectedProtocol('aave')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Position
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {positions.map((position) => (
                    <div key={position.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">
                              {defiProtocols.find(p => p.id === position.protocol)?.logo}
                            </span>
                            <div>
                              <p className="font-medium">
                                {defiProtocols.find(p => p.id === position.protocol)?.name}
                              </p>
                              <p className="text-sm text-gray-600 capitalize">
                                {position.type} {position.asset}
                              </p>
                            </div>
                          </div>
                          <Badge variant={position.type === 'supply' ? 'default' : 'destructive'}>
                            {position.type}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(position.value)}</p>
                          <p className={`text-sm ${position.earned >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {position.earned >= 0 ? '+' : ''}{formatPrice(position.earned)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-medium">{position.amount} {position.asset}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">APY</p>
                          <p className={`font-medium ${position.type === 'supply' ? 'text-green-600' : 'text-red-600'}`}>
                            {position.apy}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Start Date</p>
                          <p className="font-medium">{position.startDate}</p>
                        </div>
                        {position.healthFactor && (
                          <div>
                            <p className="text-muted-foreground">Health Factor</p>
                            <p className={`font-medium ${getHealthFactorColor(position.healthFactor)}`}>
                              {position.healthFactor.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>

                      {position.collateral && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                          <p className="text-sm">
                            <Shield className="inline h-4 w-4 mr-1" />
                            Collateral: {position.collateralAmount} {position.collateral}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Portfolio Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Performance</CardTitle>
                <CardDescription>Your DeFi lending performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Borrow Utilization</p>
                      <p className="text-2xl font-bold text-blue-600">{borrowUtilization.toFixed(1)}%</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Avg APY</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {positions.length > 0 
                          ? (positions.reduce((sum, p) => sum + p.apy, 0) / positions.length).toFixed(2)
                          : '0.00'
                        }%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Active Positions</span>
                      <span className="font-medium">{positions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Protocols Used</span>
                      <span className="font-medium">
                        {new Set(positions.map(p => p.protocol)).size}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Risk Level</span>
                      <Badge variant="outline" className="text-green-600">
                        Conservative
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Management */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Management</CardTitle>
                <CardDescription>Monitor your position risks and health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 p-3 bg-green-50 rounded border-l-4 border-green-400">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Portfolio Healthy</p>
                      <p className="text-sm text-green-600">All positions within safe parameters</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Liquidation Risk</span>
                      <Badge variant="outline" className="text-green-600">Low</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Min Health Factor</span>
                      <span className="font-medium text-green-600">
                        {Math.min(...positions.filter(p => p.healthFactor).map(p => p.healthFactor!), 999).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Diversification</span>
                      <span className="font-medium">Good</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Consider diversifying across more protocols</li>
                      <li>• Monitor ETH price for collateral positions</li>
                      <li>• Set up liquidation alerts</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}