/**
 * Real-Time WebSocket Service
 * Handles live data streaming for market data, agent status, and system events
 */

import { EventEmitter } from 'events';

export interface RealTimeEvent {
  type: 'market_data' | 'agent_status' | 'portfolio_update' | 'trade_execution' | 'system_alert' | 'defi_update';
  data: any;
  timestamp: string;
  source: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  subscriptions: string[];
}

export interface MarketDataUpdate {
  symbol: string;
  price: number;
  change: number;
  volume: number;
  timestamp: string;
}

export interface AgentStatusUpdate {
  agentId: string;
  status: 'active' | 'inactive' | 'error' | 'paused';
  balance: number;
  pnl: number;
  lastAction: string;
  timestamp: string;
}

export interface PortfolioUpdate {
  totalValue: number;
  totalPnL: number;
  positions: {
    symbol: string;
    quantity: number;
    value: number;
    pnl: number;
  }[];
  timestamp: string;
}

export interface TradeExecutionUpdate {
  tradeId: string;
  agentId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  status: 'pending' | 'filled' | 'cancelled' | 'failed';
  timestamp: string;
}

export interface SystemAlert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  component: string;
  timestamp: string;
  acknowledged: boolean;
}

class RealTimeService extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private subscriptions = new Set<string>();

  constructor(config: Partial<WebSocketConfig> = {}) {
    super();
    
    this.config = {
      url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      subscriptions: ['market_data', 'agent_status', 'portfolio_updates'],
      ...config
    };
  }

  async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected()) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.config.url);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

      // Wait for connection or timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 10000);

        this.ws!.onopen = () => {
          clearTimeout(timeout);
          this.handleOpen();
          resolve(void 0);
        };

        this.ws!.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
      });

    } catch (error) {
      this.isConnecting = false;
      console.error('WebSocket connection failed:', error);
      this.scheduleReconnect();
      throw error;
    }
  }

  disconnect(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.subscriptions.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Subscription Management
  subscribe(channel: string): void {
    this.subscriptions.add(channel);
    
    if (this.isConnected()) {
      this.send({
        type: 'subscribe',
        channel,
        timestamp: new Date().toISOString()
      });
    }
  }

  unsubscribe(channel: string): void {
    this.subscriptions.delete(channel);
    
    if (this.isConnected()) {
      this.send({
        type: 'unsubscribe',
        channel,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Message Sending
  send(message: any): void {
    if (!this.isConnected()) {
      console.warn('Cannot send message: WebSocket not connected');
      return;
    }

    try {
      this.ws!.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
    }
  }

  // Specific subscription methods
  subscribeToMarketData(symbols: string[]): void {
    symbols.forEach(symbol => {
      this.subscribe(`market_data:${symbol}`);
    });
  }

  subscribeToAgentStatus(agentIds: string[]): void {
    agentIds.forEach(agentId => {
      this.subscribe(`agent_status:${agentId}`);
    });
  }

  subscribeToPortfolio(): void {
    this.subscribe('portfolio_updates');
  }

  subscribeToTrades(): void {
    this.subscribe('trade_executions');
  }

  subscribeToSystemAlerts(): void {
    this.subscribe('system_alerts');
  }

  subscribeToDeFiUpdates(): void {
    this.subscribe('defi_updates');
  }

  // Event Handlers
  private handleOpen(): void {
    console.log('✅ WebSocket connected');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Re-subscribe to channels
    this.subscriptions.forEach(channel => {
      this.send({
        type: 'subscribe',
        channel,
        timestamp: new Date().toISOString()
      });
    });

    this.emit('connected');
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'market_data':
          this.handleMarketDataUpdate(message.data);
          break;
        case 'agent_status':
          this.handleAgentStatusUpdate(message.data);
          break;
        case 'portfolio_update':
          this.handlePortfolioUpdate(message.data);
          break;
        case 'trade_execution':
          this.handleTradeExecution(message.data);
          break;
        case 'system_alert':
          this.handleSystemAlert(message.data);
          break;
        case 'defi_update':
          this.handleDeFiUpdate(message.data);
          break;
        case 'pong':
          // Heartbeat response
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }

      this.emit('message', message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('❌ WebSocket disconnected:', event.code, event.reason);
    this.isConnecting = false;
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    this.emit('disconnected', { code: event.code, reason: event.reason });

    // Attempt to reconnect unless explicitly closed
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  private handleError(error: Event): void {
    console.error('❌ WebSocket error:', error);
    this.emit('error', error);
  }

  // Specific data handlers
  private handleMarketDataUpdate(data: MarketDataUpdate): void {
    this.emit('market_data_update', data);
  }

  private handleAgentStatusUpdate(data: AgentStatusUpdate): void {
    this.emit('agent_status_update', data);
  }

  private handlePortfolioUpdate(data: PortfolioUpdate): void {
    this.emit('portfolio_update', data);
  }

  private handleTradeExecution(data: TradeExecutionUpdate): void {
    this.emit('trade_execution', data);
  }

  private handleSystemAlert(data: SystemAlert): void {
    this.emit('system_alert', data);
  }

  private handleDeFiUpdate(data: any): void {
    this.emit('defi_update', data);
  }

  // Heartbeat
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({
          type: 'ping',
          timestamp: new Date().toISOString()
        });
      }
    }, this.config.heartbeatInterval);
  }

  // Reconnection
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('max_reconnect_attempts');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`⏰ Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      console.log(`🔄 Reconnect attempt ${this.reconnectAttempts}`);
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }
}

// Real-time data mock simulator for development
class MockRealTimeService extends RealTimeService {
  private mockTimer: NodeJS.Timeout | null = null;
  private mockSubscriptions = new Set<string>();

  async connect(): Promise<void> {
    console.log('🔄 Starting mock real-time service');
    this.startMockDataGeneration();
    this.emit('connected');
  }

  disconnect(): void {
    if (this.mockTimer) {
      clearInterval(this.mockTimer);
      this.mockTimer = null;
    }
    this.mockSubscriptions.clear();
    this.emit('disconnected', { code: 1000, reason: 'Mock service stopped' });
  }

  isConnected(): boolean {
    return this.mockTimer !== null;
  }

  subscribe(channel: string): void {
    this.mockSubscriptions.add(channel);
    console.log(`📡 Subscribed to mock channel: ${channel}`);
  }

  unsubscribe(channel: string): void {
    this.mockSubscriptions.delete(channel);
    console.log(`📡 Unsubscribed from mock channel: ${channel}`);
  }

  private startMockDataGeneration(): void {
    this.mockTimer = setInterval(() => {
      this.generateMockUpdates();
    }, 2000); // Update every 2 seconds
  }

  private generateMockUpdates(): void {
    // Mock market data updates
    if (this.mockSubscriptions.has('market_data') || 
        Array.from(this.mockSubscriptions).some(s => s.startsWith('market_data:'))) {
      
      const symbols = ['BTC/USD', 'ETH/USD', 'USDC/USD'];
      symbols.forEach(symbol => {
        const basePrice = symbol.includes('BTC') ? 97500 : symbol.includes('ETH') ? 3240 : 1;
        const change = (Math.random() - 0.5) * 0.01; // ±0.5% change
        
        this.emit('market_data_update', {
          symbol,
          price: basePrice * (1 + change),
          change: basePrice * change,
          volume: Math.random() * 1000000,
          timestamp: new Date().toISOString()
        });
      });
    }

    // Mock agent status updates
    if (this.mockSubscriptions.has('agent_status') ||
        Array.from(this.mockSubscriptions).some(s => s.startsWith('agent_status:'))) {
      
      const agentIds = ['agent-1', 'agent-2', 'agent-3'];
      agentIds.forEach(agentId => {
        this.emit('agent_status_update', {
          agentId,
          status: Math.random() > 0.9 ? 'error' : 'active',
          balance: 8000 + Math.random() * 4000,
          pnl: (Math.random() - 0.5) * 1000,
          lastAction: 'position_update',
          timestamp: new Date().toISOString()
        });
      });
    }

    // Mock portfolio updates
    if (this.mockSubscriptions.has('portfolio_updates')) {
      this.emit('portfolio_update', {
        totalValue: 125000 + (Math.random() - 0.5) * 10000,
        totalPnL: (Math.random() - 0.3) * 5000, // Slight positive bias
        positions: [
          {
            symbol: 'BTC/USD',
            quantity: 1.2,
            value: 117000,
            pnl: (Math.random() - 0.5) * 2000
          },
          {
            symbol: 'ETH/USD',
            quantity: 5.8,
            value: 18800,
            pnl: (Math.random() - 0.5) * 1000
          }
        ],
        timestamp: new Date().toISOString()
      });
    }

    // Mock system alerts (occasionally)
    if (this.mockSubscriptions.has('system_alerts') && Math.random() > 0.95) {
      const alerts = [
        { level: 'info', message: 'Agent performance update completed', component: 'agent-manager' },
        { level: 'warning', message: 'High market volatility detected', component: 'risk-manager' },
        { level: 'error', message: 'API rate limit approaching', component: 'data-service' }
      ];
      
      const alert = alerts[Math.floor(Math.random() * alerts.length)];
      this.emit('system_alert', {
        id: `alert-${Date.now()}`,
        ...alert,
        timestamp: new Date().toISOString(),
        acknowledged: false
      } as SystemAlert);
    }
  }
}

// Export appropriate service based on environment
export const realTimeService = process.env.NODE_ENV === 'development' 
  ? new MockRealTimeService()
  : new RealTimeService();

export { RealTimeService, MockRealTimeService };