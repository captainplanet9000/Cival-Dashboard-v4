/**
 * Real-Time Data Hook
 * React hook for managing real-time data subscriptions and updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { realTimeService } from '@/lib/websocket/real-time-service';
import { realDataService } from '@/lib/api/real-data-service';
import type { 
  MarketDataUpdate, 
  AgentStatusUpdate, 
  PortfolioUpdate, 
  TradeExecutionUpdate,
  SystemAlert
} from '@/lib/websocket/real-time-service';
import type { LiveMarketData } from '@/lib/api/real-data-service';

export interface UseRealTimeDataOptions {
  symbols?: string[];
  agentIds?: string[];
  autoConnect?: boolean;
  enableMarketData?: boolean;
  enableAgentStatus?: boolean;
  enablePortfolio?: boolean;
  enableTrades?: boolean;
  enableAlerts?: boolean;
  enableDeFi?: boolean;
}

export interface RealTimeDataState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  marketData: { [symbol: string]: MarketDataUpdate };
  agentStatus: { [agentId: string]: AgentStatusUpdate };
  portfolio: PortfolioUpdate | null;
  recentTrades: TradeExecutionUpdate[];
  systemAlerts: SystemAlert[];
  defiData: any;
}

export function useRealTimeData(options: UseRealTimeDataOptions = {}) {
  const {
    symbols = ['BTC/USD', 'ETH/USD'],
    agentIds = [],
    autoConnect = true,
    enableMarketData = true,
    enableAgentStatus = true,
    enablePortfolio = true,
    enableTrades = true,
    enableAlerts = true,
    enableDeFi = false
  } = options;

  const [state, setState] = useState<RealTimeDataState>({
    connected: false,
    connecting: false,
    error: null,
    marketData: {},
    agentStatus: {},
    portfolio: null,
    recentTrades: [],
    systemAlerts: [],
    defiData: null
  });

  const lastUpdateRef = useRef<{ [key: string]: number }>({});
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Connection management
  const connect = useCallback(async () => {
    if (state.connected || state.connecting) return;

    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      await realTimeService.connect();
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        connecting: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      }));
    }
  }, [state.connected, state.connecting]);

  const disconnect = useCallback(() => {
    realTimeService.disconnect();
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Subscription management
  const updateSubscriptions = useCallback(() => {
    if (!state.connected) return;

    // Subscribe to market data
    if (enableMarketData && symbols.length > 0) {
      realTimeService.subscribeToMarketData(symbols);
    }

    // Subscribe to agent status
    if (enableAgentStatus && agentIds.length > 0) {
      realTimeService.subscribeToAgentStatus(agentIds);
    }

    // Subscribe to portfolio updates
    if (enablePortfolio) {
      realTimeService.subscribeToPortfolio();
    }

    // Subscribe to trade executions
    if (enableTrades) {
      realTimeService.subscribeToTrades();
    }

    // Subscribe to system alerts
    if (enableAlerts) {
      realTimeService.subscribeToSystemAlerts();
    }

    // Subscribe to DeFi updates
    if (enableDeFi) {
      realTimeService.subscribeToDeFiUpdates();
    }
  }, [state.connected, symbols, agentIds, enableMarketData, enableAgentStatus, enablePortfolio, enableTrades, enableAlerts, enableDeFi]);

  // Event handlers
  useEffect(() => {
    const handleConnected = () => {
      setState(prev => ({ ...prev, connected: true, connecting: false, error: null }));
    };

    const handleDisconnected = (event: { code: number; reason: string }) => {
      setState(prev => ({ ...prev, connected: false, connecting: false }));
      
      // Auto-reconnect after a delay
      if (autoConnect && event.code !== 1000) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      }
    };

    const handleError = (error: any) => {
      setState(prev => ({ 
        ...prev, 
        error: error?.message || 'WebSocket error',
        connecting: false 
      }));
    };

    const handleMarketDataUpdate = (data: MarketDataUpdate) => {
      // Throttle updates to prevent excessive re-renders
      const key = `market_${data.symbol}`;
      const now = Date.now();
      if (now - (lastUpdateRef.current[key] || 0) < 500) return; // Max 2 updates per second
      lastUpdateRef.current[key] = now;

      setState(prev => ({
        ...prev,
        marketData: {
          ...prev.marketData,
          [data.symbol]: data
        }
      }));
    };

    const handleAgentStatusUpdate = (data: AgentStatusUpdate) => {
      setState(prev => ({
        ...prev,
        agentStatus: {
          ...prev.agentStatus,
          [data.agentId]: data
        }
      }));
    };

    const handlePortfolioUpdate = (data: PortfolioUpdate) => {
      setState(prev => ({ ...prev, portfolio: data }));
    };

    const handleTradeExecution = (data: TradeExecutionUpdate) => {
      setState(prev => ({
        ...prev,
        recentTrades: [data, ...prev.recentTrades.slice(0, 49)] // Keep last 50 trades
      }));
    };

    const handleSystemAlert = (data: SystemAlert) => {
      setState(prev => ({
        ...prev,
        systemAlerts: [data, ...prev.systemAlerts.slice(0, 19)] // Keep last 20 alerts
      }));
    };

    const handleDeFiUpdate = (data: any) => {
      setState(prev => ({ ...prev, defiData: data }));
    };

    // Attach event listeners
    realTimeService.on('connected', handleConnected);
    realTimeService.on('disconnected', handleDisconnected);
    realTimeService.on('error', handleError);
    realTimeService.on('market_data_update', handleMarketDataUpdate);
    realTimeService.on('agent_status_update', handleAgentStatusUpdate);
    realTimeService.on('portfolio_update', handlePortfolioUpdate);
    realTimeService.on('trade_execution', handleTradeExecution);
    realTimeService.on('system_alert', handleSystemAlert);
    realTimeService.on('defi_update', handleDeFiUpdate);

    return () => {
      realTimeService.off('connected', handleConnected);
      realTimeService.off('disconnected', handleDisconnected);
      realTimeService.off('error', handleError);
      realTimeService.off('market_data_update', handleMarketDataUpdate);
      realTimeService.off('agent_status_update', handleAgentStatusUpdate);
      realTimeService.off('portfolio_update', handlePortfolioUpdate);
      realTimeService.off('trade_execution', handleTradeExecution);
      realTimeService.off('system_alert', handleSystemAlert);
      realTimeService.off('defi_update', handleDeFiUpdate);
    };
  }, [autoConnect, connect]);

  // Auto-connect and subscribe
  useEffect(() => {
    if (autoConnect && !state.connected && !state.connecting) {
      connect();
    }
  }, [autoConnect, connect, state.connected, state.connecting]);

  useEffect(() => {
    updateSubscriptions();
  }, [updateSubscriptions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  // Helper functions
  const acknowledgeAlert = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      systemAlerts: prev.systemAlerts.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    }));
  }, []);

  const clearAlerts = useCallback(() => {
    setState(prev => ({ ...prev, systemAlerts: [] }));
  }, []);

  const getLatestPrice = useCallback((symbol: string): number | null => {
    return state.marketData[symbol]?.price || null;
  }, [state.marketData]);

  const getAgentPnL = useCallback((agentId: string): number | null => {
    return state.agentStatus[agentId]?.pnl || null;
  }, [state.agentStatus]);

  const getTotalPortfolioValue = useCallback((): number | null => {
    return state.portfolio?.totalValue || null;
  }, [state.portfolio]);

  return {
    // Connection state
    connected: state.connected,
    connecting: state.connecting,
    error: state.error,
    
    // Data
    marketData: state.marketData,
    agentStatus: state.agentStatus,
    portfolio: state.portfolio,
    recentTrades: state.recentTrades,
    systemAlerts: state.systemAlerts,
    defiData: state.defiData,
    
    // Actions
    connect,
    disconnect,
    acknowledgeAlert,
    clearAlerts,
    
    // Helpers
    getLatestPrice,
    getAgentPnL,
    getTotalPortfolioValue
  };
}

// Hook for market data only
export function useMarketData(symbols: string[]) {
  return useRealTimeData({
    symbols,
    enableMarketData: true,
    enableAgentStatus: false,
    enablePortfolio: false,
    enableTrades: false,
    enableAlerts: false,
    enableDeFi: false
  });
}

// Hook for agent status only
export function useAgentStatus(agentIds: string[]) {
  return useRealTimeData({
    agentIds,
    enableMarketData: false,
    enableAgentStatus: true,
    enablePortfolio: false,
    enableTrades: false,
    enableAlerts: false,
    enableDeFi: false
  });
}

// Hook for portfolio updates only
export function usePortfolioUpdates() {
  return useRealTimeData({
    enableMarketData: false,
    enableAgentStatus: false,
    enablePortfolio: true,
    enableTrades: false,
    enableAlerts: false,
    enableDeFi: false
  });
}

// Hook for live market data with REST API fallback
export function useLiveMarketData(symbols: string[]) {
  const [data, setData] = useState<{ [symbol: string]: LiveMarketData }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { marketData, connected } = useMarketData(symbols);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const initialData = await realDataService.getLiveMarketData(symbols);
        
        const dataMap = initialData.reduce((acc, item) => {
          acc[item.symbol] = item;
          return acc;
        }, {} as { [symbol: string]: LiveMarketData });
        
        setData(dataMap);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch market data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [symbols]);

  // Update with real-time data if available
  useEffect(() => {
    if (connected && Object.keys(marketData).length > 0) {
      setData(prev => {
        const updated = { ...prev };
        
        Object.entries(marketData).forEach(([symbol, update]) => {
          if (updated[symbol]) {
            updated[symbol] = {
              ...updated[symbol],
              price: update.price,
              change24h: update.change,
              volume24h: update.volume,
              timestamp: update.timestamp,
              source: 'WebSocket'
            };
          }
        });
        
        return updated;
      });
    }
  }, [marketData, connected]);

  return {
    data,
    loading,
    error,
    connected,
    symbols: Object.keys(data)
  };
}