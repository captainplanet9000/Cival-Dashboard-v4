/**
 * Redis Client Configuration
 * High-performance caching and real-time features for trading platform
 */

import { createClient, RedisClientType } from 'redis';

export interface CacheConfig {
  defaultTTL: number;
  maxRetries: number;
  retryDelay: number;
  keyPrefix: string;
}

export interface RealTimeConfig {
  channels: string[];
  heartbeatInterval: number;
  reconnectInterval: number;
}

class RedisService {
  private client: RedisClientType | null = null;
  private subscriber: RedisClientType | null = null;
  private publisher: RedisClientType | null = null;
  private isConnected = false;
  private config: CacheConfig;
  private eventHandlers = new Map<string, Function[]>();

  constructor() {
    this.config = {
      defaultTTL: 300, // 5 minutes
      maxRetries: 3,
      retryDelay: 1000,
      keyPrefix: 'cival:'
    };
  }

  async connect(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      // Main client for general operations
      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
        }
      });

      // Separate clients for pub/sub
      this.subscriber = this.client.duplicate();
      this.publisher = this.client.duplicate();

      // Event handlers
      this.client.on('error', (err) => console.error('Redis Client Error:', err));
      this.client.on('connect', () => console.log('✅ Redis Client Connected'));
      this.client.on('ready', () => {
        console.log('✅ Redis Client Ready');
        this.isConnected = true;
      });
      this.client.on('end', () => {
        console.log('❌ Redis Client Disconnected');
        this.isConnected = false;
      });

      // Connect all clients
      await Promise.all([
        this.client.connect(),
        this.subscriber.connect(),
        this.publisher.connect()
      ]);

      console.log('🚀 Redis Service initialized');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      // Fallback to mock mode for development
      this.initializeMockMode();
    }
  }

  async disconnect(): Promise<void> {
    try {
      await Promise.all([
        this.client?.quit(),
        this.subscriber?.quit(),
        this.publisher?.quit()
      ]);
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
    }
  }

  private initializeMockMode(): void {
    console.log('📝 Redis Mock Mode Activated');
    this.isConnected = true;
    // Mock implementation for development
  }

  // =============================================
  // CACHING OPERATIONS
  // =============================================

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.client) return;

    try {
      const serializedValue = JSON.stringify(value);
      const fullKey = this.config.keyPrefix + key;
      const expiration = ttl || this.config.defaultTTL;

      await this.client.setEx(fullKey, expiration, serializedValue);
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;

    try {
      const fullKey = this.config.keyPrefix + key;
      const value = await this.client.get(fullKey);
      
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;

    try {
      const fullKey = this.config.keyPrefix + key;
      await this.client.del(fullKey);
    } catch (error) {
      console.error('Redis DEL error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      const fullKey = this.config.keyPrefix + key;
      const result = await this.client.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.client) return keys.map(() => null);

    try {
      const fullKeys = keys.map(key => this.config.keyPrefix + key);
      const values = await this.client.mGet(fullKeys);
      
      return values.map(value => {
        if (!value) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      console.error('Redis MGET error:', error);
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs: Array<{key: string, value: any, ttl?: number}>): Promise<void> {
    if (!this.client) return;

    try {
      const pipeline = this.client.multi();
      
      keyValuePairs.forEach(({key, value, ttl}) => {
        const fullKey = this.config.keyPrefix + key;
        const serializedValue = JSON.stringify(value);
        const expiration = ttl || this.config.defaultTTL;
        
        pipeline.setEx(fullKey, expiration, serializedValue);
      });

      await pipeline.exec();
    } catch (error) {
      console.error('Redis MSET error:', error);
    }
  }

  // =============================================
  // MARKET DATA CACHING
  // =============================================

  async cacheMarketData(symbol: string, data: any, ttl: number = 60): Promise<void> {
    await this.set(`market:${symbol}`, data, ttl);
  }

  async getMarketData<T>(symbol: string): Promise<T | null> {
    return await this.get<T>(`market:${symbol}`);
  }

  async cacheMultipleMarketData(marketData: Array<{symbol: string, data: any}>): Promise<void> {
    const keyValuePairs = marketData.map(({symbol, data}) => ({
      key: `market:${symbol}`,
      value: data,
      ttl: 60 // 1 minute TTL for market data
    }));

    await this.mset(keyValuePairs);
  }

  // =============================================
  // PORTFOLIO CACHING
  // =============================================

  async cachePortfolio(userId: string, portfolio: any): Promise<void> {
    await this.set(`portfolio:${userId}`, portfolio, 300); // 5 minutes
  }

  async getPortfolio<T>(userId: string): Promise<T | null> {
    return await this.get<T>(`portfolio:${userId}`);
  }

  async cacheAgentData(agentId: string, data: any): Promise<void> {
    await this.set(`agent:${agentId}`, data, 180); // 3 minutes
  }

  async getAgentData<T>(agentId: string): Promise<T | null> {
    return await this.get<T>(`agent:${agentId}`);
  }

  // =============================================
  // DEFI PROTOCOL CACHING
  // =============================================

  async cacheDeFiRates(protocol: string, rates: any): Promise<void> {
    await this.set(`defi:rates:${protocol}`, rates, 300); // 5 minutes
  }

  async getDeFiRates<T>(protocol: string): Promise<T | null> {
    return await this.get<T>(`defi:rates:${protocol}`);
  }

  async cacheYieldOpportunities(opportunities: any): Promise<void> {
    await this.set('defi:yield:opportunities', opportunities, 600); // 10 minutes
  }

  async getYieldOpportunities<T>(): Promise<T | null> {
    return await this.get<T>('defi:yield:opportunities');
  }

  // =============================================
  // SESSION MANAGEMENT
  // =============================================

  async setSession(sessionId: string, sessionData: any, ttl: number = 86400): Promise<void> {
    await this.set(`session:${sessionId}`, sessionData, ttl); // 24 hours default
  }

  async getSession<T>(sessionId: string): Promise<T | null> {
    return await this.get<T>(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.del(`session:${sessionId}`);
  }

  // =============================================
  // RATE LIMITING
  // =============================================

  async checkRateLimit(key: string, limit: number, window: number): Promise<{allowed: boolean, remaining: number}> {
    if (!this.client) return {allowed: true, remaining: limit};

    try {
      const fullKey = this.config.keyPrefix + `ratelimit:${key}`;
      const current = await this.client.get(fullKey);
      
      if (!current) {
        await this.client.setEx(fullKey, window, '1');
        return {allowed: true, remaining: limit - 1};
      }

      const count = parseInt(current);
      if (count >= limit) {
        return {allowed: false, remaining: 0};
      }

      await this.client.incr(fullKey);
      return {allowed: true, remaining: limit - count - 1};
    } catch (error) {
      console.error('Rate limit check error:', error);
      return {allowed: true, remaining: limit};
    }
  }

  // =============================================
  // PUB/SUB REAL-TIME FEATURES
  // =============================================

  async subscribe(channel: string, handler: Function): Promise<void> {
    if (!this.subscriber) return;

    try {
      if (!this.eventHandlers.has(channel)) {
        this.eventHandlers.set(channel, []);
        await this.subscriber.subscribe(channel, (message) => {
          const handlers = this.eventHandlers.get(channel) || [];
          handlers.forEach(h => {
            try {
              h(JSON.parse(message));
            } catch (error) {
              console.error('Message handler error:', error);
            }
          });
        });
      }

      this.eventHandlers.get(channel)?.push(handler);
    } catch (error) {
      console.error('Subscribe error:', error);
    }
  }

  async unsubscribe(channel: string, handler?: Function): Promise<void> {
    if (!this.subscriber) return;

    try {
      if (handler) {
        const handlers = this.eventHandlers.get(channel) || [];
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
        
        if (handlers.length === 0) {
          await this.subscriber.unsubscribe(channel);
          this.eventHandlers.delete(channel);
        }
      } else {
        await this.subscriber.unsubscribe(channel);
        this.eventHandlers.delete(channel);
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
    }
  }

  async publish(channel: string, data: any): Promise<void> {
    if (!this.publisher) return;

    try {
      await this.publisher.publish(channel, JSON.stringify(data));
    } catch (error) {
      console.error('Publish error:', error);
    }
  }

  // =============================================
  // REAL-TIME TRADING EVENTS
  // =============================================

  async publishMarketUpdate(symbol: string, data: any): Promise<void> {
    await this.publish(`market:${symbol}`, data);
    await this.publish('market:all', {symbol, ...data});
  }

  async publishAgentUpdate(agentId: string, data: any): Promise<void> {
    await this.publish(`agent:${agentId}`, data);
    await this.publish('agents:all', {agentId, ...data});
  }

  async publishPortfolioUpdate(userId: string, data: any): Promise<void> {
    await this.publish(`portfolio:${userId}`, data);
  }

  async publishTradeExecution(data: any): Promise<void> {
    await this.publish('trades:executions', data);
  }

  async publishSystemAlert(data: any): Promise<void> {
    await this.publish('system:alerts', data);
  }

  // =============================================
  // ANALYTICS & METRICS
  // =============================================

  async incrementCounter(key: string, value: number = 1): Promise<number> {
    if (!this.client) return value;

    try {
      const fullKey = this.config.keyPrefix + `counter:${key}`;
      return await this.client.incrBy(fullKey, value);
    } catch (error) {
      console.error('Counter increment error:', error);
      return value;
    }
  }

  async getCounter(key: string): Promise<number> {
    if (!this.client) return 0;

    try {
      const fullKey = this.config.keyPrefix + `counter:${key}`;
      const value = await this.client.get(fullKey);
      return value ? parseInt(value) : 0;
    } catch (error) {
      console.error('Counter get error:', error);
      return 0;
    }
  }

  async addToSortedSet(key: string, score: number, member: string): Promise<void> {
    if (!this.client) return;

    try {
      const fullKey = this.config.keyPrefix + `sorted:${key}`;
      await this.client.zAdd(fullKey, {score, value: member});
    } catch (error) {
      console.error('Sorted set add error:', error);
    }
  }

  async getTopFromSortedSet(key: string, count: number = 10): Promise<Array<{value: string, score: number}>> {
    if (!this.client) return [];

    try {
      const fullKey = this.config.keyPrefix + `sorted:${key}`;
      const results = await this.client.zRangeWithScores(fullKey, 0, count - 1, {REV: true});
      return results.map(item => ({value: item.value, score: item.score}));
    } catch (error) {
      console.error('Sorted set get error:', error);
      return [];
    }
  }

  // =============================================
  // HEALTH CHECK
  // =============================================

  async healthCheck(): Promise<{connected: boolean, latency: number}> {
    if (!this.client) return {connected: false, latency: -1};

    try {
      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;
      
      return {connected: this.isConnected, latency};
    } catch (error) {
      return {connected: false, latency: -1};
    }
  }

  // =============================================
  // CLEANUP OPERATIONS
  // =============================================

  async cleanupExpiredKeys(): Promise<number> {
    if (!this.client) return 0;

    try {
      // This would typically be handled by Redis automatically
      // But we can implement custom cleanup logic here
      const pattern = this.config.keyPrefix + '*';
      const keys = await this.client.keys(pattern);
      
      let deletedCount = 0;
      for (const key of keys) {
        const ttl = await this.client.ttl(key);
        if (ttl === -1) { // No expiration set
          // Optionally set a default expiration for keys without TTL
          await this.client.expire(key, this.config.defaultTTL);
        }
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Cleanup error:', error);
      return 0;
    }
  }

  // =============================================
  // PUBLIC API
  // =============================================

  isReady(): boolean {
    return this.isConnected;
  }

  getStats(): any {
    return {
      connected: this.isConnected,
      keyPrefix: this.config.keyPrefix,
      defaultTTL: this.config.defaultTTL,
      subscribedChannels: Array.from(this.eventHandlers.keys())
    };
  }
}

// Export singleton instance
export const redisService = new RedisService();

// Auto-connect on import
if (typeof window === 'undefined') { // Server-side only
  redisService.connect().catch(console.error);
}

export default redisService;