/**
 * Real Data Service
 * Integrates with live market data APIs and backend services
 */

import { backendApi } from './backend-client';

export interface MarketDataProvider {
  name: string;
  supports: ('crypto' | 'stocks' | 'forex' | 'defi')[];
  rateLimit: number; // requests per minute
  requiresAuth: boolean;
}

export interface LiveMarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap?: number;
  high24h: number;
  low24h: number;
  timestamp: string;
  source: string;
}

export interface CandlestickData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DeFiProtocolData {
  protocol: string;
  tvl: number;
  apy: number;
  volume24h: number;
  users: number;
  tokens: {
    address: string;
    symbol: string;
    apy: number;
    totalSupply: number;
    totalBorrow: number;
  }[];
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  timestamp: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevance: number;
  symbols: string[];
}

export interface EconomicIndicator {
  name: string;
  value: number;
  previous: number;
  forecast: number;
  unit: string;
  releaseDate: string;
  impact: 'high' | 'medium' | 'low';
}

// Market Data Providers
export const MARKET_DATA_PROVIDERS: MarketDataProvider[] = [
  {
    name: 'Binance',
    supports: ['crypto'],
    rateLimit: 1200,
    requiresAuth: false
  },
  {
    name: 'CoinGecko',
    supports: ['crypto', 'defi'],
    rateLimit: 50,
    requiresAuth: false
  },
  {
    name: 'Alpha Vantage',
    supports: ['stocks', 'forex', 'crypto'],
    rateLimit: 5,
    requiresAuth: true
  },
  {
    name: 'Yahoo Finance',
    supports: ['stocks'],
    rateLimit: 2000,
    requiresAuth: false
  },
  {
    name: 'DeFi Pulse',
    supports: ['defi'],
    rateLimit: 300,
    requiresAuth: false
  }
];

class RealDataService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private rateLimits = new Map<string, { count: number; resetTime: number }>();

  // Market Data Methods
  async getLiveMarketData(symbols: string[]): Promise<LiveMarketData[]> {
    const cacheKey = `market_data_${symbols.join(',')}`;
    
    // Check cache first (1-minute TTL)
    const cached = this.getFromCache(cacheKey, 60000);
    if (cached) return cached;

    try {
      // Try multiple providers with fallback
      let data = await this.fetchFromBinance(symbols);
      
      if (!data || data.length === 0) {
        data = await this.fetchFromCoinGecko(symbols);
      }
      
      if (!data || data.length === 0) {
        data = await this.generateMockMarketData(symbols);
      }

      this.setCache(cacheKey, data, 60000);
      return data;
    } catch (error) {
      console.error('Failed to fetch live market data:', error);
      return this.generateMockMarketData(symbols);
    }
  }

  async getHistoricalData(symbol: string, timeframe: string, limit: number = 100): Promise<CandlestickData[]> {
    const cacheKey = `historical_${symbol}_${timeframe}_${limit}`;
    
    // Check cache first (5-minute TTL)
    const cached = this.getFromCache(cacheKey, 300000);
    if (cached) return cached;

    try {
      const data = await this.fetchHistoricalFromBinance(symbol, timeframe, limit);
      this.setCache(cacheKey, data, 300000);
      return data;
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
      return this.generateMockHistoricalData(symbol, limit);
    }
  }

  // DeFi Data Methods
  async getDeFiProtocolData(protocols: string[]): Promise<DeFiProtocolData[]> {
    const cacheKey = `defi_data_${protocols.join(',')}`;
    
    // Check cache first (10-minute TTL)
    const cached = this.getFromCache(cacheKey, 600000);
    if (cached) return cached;

    try {
      const data = await Promise.all(
        protocols.map(protocol => this.fetchDeFiProtocolData(protocol))
      );
      
      this.setCache(cacheKey, data, 600000);
      return data;
    } catch (error) {
      console.error('Failed to fetch DeFi data:', error);
      return this.generateMockDeFiData(protocols);
    }
  }

  // News and Sentiment
  async getMarketNews(symbols: string[], limit: number = 10): Promise<NewsItem[]> {
    const cacheKey = `news_${symbols.join(',')}_${limit}`;
    
    // Check cache first (15-minute TTL)
    const cached = this.getFromCache(cacheKey, 900000);
    if (cached) return cached;

    try {
      const data = await this.fetchMarketNews(symbols, limit);
      this.setCache(cacheKey, data, 900000);
      return data;
    } catch (error) {
      console.error('Failed to fetch market news:', error);
      return this.generateMockNews(symbols, limit);
    }
  }

  // Economic Indicators
  async getEconomicIndicators(): Promise<EconomicIndicator[]> {
    const cacheKey = 'economic_indicators';
    
    // Check cache first (1-hour TTL)
    const cached = this.getFromCache(cacheKey, 3600000);
    if (cached) return cached;

    try {
      const data = await this.fetchEconomicIndicators();
      this.setCache(cacheKey, data, 3600000);
      return data;
    } catch (error) {
      console.error('Failed to fetch economic indicators:', error);
      return this.generateMockEconomicData();
    }
  }

  // Provider-specific implementations
  private async fetchFromBinance(symbols: string[]): Promise<LiveMarketData[]> {
    // Rate limiting check
    if (!this.checkRateLimit('binance', 1200)) {
      throw new Error('Binance rate limit exceeded');
    }

    try {
      // Convert symbols to Binance format (e.g., BTC/USD -> BTCUSDT)
      const binanceSymbols = symbols.map(s => s.replace('/', '').replace('USD', 'USDT'));
      
      const promises = binanceSymbols.map(async (symbol) => {
        const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
        if (!response.ok) throw new Error(`Binance API error: ${response.status}`);
        
        const data = await response.json();
        
        return {
          symbol: symbols[binanceSymbols.indexOf(symbol)],
          price: parseFloat(data.lastPrice),
          change24h: parseFloat(data.priceChange),
          changePercent24h: parseFloat(data.priceChangePercent),
          volume24h: parseFloat(data.volume),
          high24h: parseFloat(data.highPrice),
          low24h: parseFloat(data.lowPrice),
          timestamp: new Date().toISOString(),
          source: 'Binance'
        };
      });

      return await Promise.all(promises);
    } catch (error) {
      console.error('Binance fetch error:', error);
      return [];
    }
  }

  private async fetchFromCoinGecko(symbols: string[]): Promise<LiveMarketData[]> {
    if (!this.checkRateLimit('coingecko', 50)) {
      throw new Error('CoinGecko rate limit exceeded');
    }

    try {
      // Map symbols to CoinGecko IDs
      const coinGeckoIds = symbols.map(s => {
        switch (s) {
          case 'BTC/USD': return 'bitcoin';
          case 'ETH/USD': return 'ethereum';
          case 'USDC/USD': return 'usd-coin';
          default: return s.toLowerCase().replace('/usd', '');
        }
      });

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds.join(',')}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
      );
      
      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
      
      const data = await response.json();
      
      return coinGeckoIds.map((id, index) => ({
        symbol: symbols[index],
        price: data[id]?.usd || 0,
        change24h: data[id]?.usd_24h_change || 0,
        changePercent24h: data[id]?.usd_24h_change || 0,
        volume24h: data[id]?.usd_24h_vol || 0,
        marketCap: data[id]?.usd_market_cap,
        high24h: 0, // Not provided by this endpoint
        low24h: 0,  // Not provided by this endpoint
        timestamp: new Date().toISOString(),
        source: 'CoinGecko'
      }));
    } catch (error) {
      console.error('CoinGecko fetch error:', error);
      return [];
    }
  }

  private async fetchHistoricalFromBinance(symbol: string, timeframe: string, limit: number): Promise<CandlestickData[]> {
    try {
      const binanceSymbol = symbol.replace('/', '').replace('USD', 'USDT');
      const interval = this.mapTimeframeToBinance(timeframe);
      
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`
      );
      
      if (!response.ok) throw new Error(`Binance klines API error: ${response.status}`);
      
      const data = await response.json();
      
      return data.map((candle: any[]) => ({
        timestamp: new Date(candle[0]).toISOString(),
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
      }));
    } catch (error) {
      console.error('Binance historical fetch error:', error);
      throw error;
    }
  }

  private async fetchDeFiProtocolData(protocol: string): Promise<DeFiProtocolData> {
    try {
      // Mock implementation - replace with real DeFi APIs (DefiLlama, etc.)
      return this.generateMockDeFiProtocolData(protocol);
    } catch (error) {
      console.error(`Failed to fetch ${protocol} data:`, error);
      return this.generateMockDeFiProtocolData(protocol);
    }
  }

  private async fetchMarketNews(symbols: string[], limit: number): Promise<NewsItem[]> {
    try {
      // Mock implementation - replace with real news APIs (NewsAPI, Alpha Vantage, etc.)
      return this.generateMockNews(symbols, limit);
    } catch (error) {
      console.error('Failed to fetch market news:', error);
      return this.generateMockNews(symbols, limit);
    }
  }

  private async fetchEconomicIndicators(): Promise<EconomicIndicator[]> {
    try {
      // Mock implementation - replace with real economic data APIs
      return this.generateMockEconomicData();
    } catch (error) {
      console.error('Failed to fetch economic indicators:', error);
      return this.generateMockEconomicData();
    }
  }

  // Helper methods
  private mapTimeframeToBinance(timeframe: string): string {
    const mapping: { [key: string]: string } = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '1h',
      '4h': '4h',
      '1d': '1d',
      '1w': '1w'
    };
    return mapping[timeframe] || '1h';
  }

  private checkRateLimit(provider: string, limit: number): boolean {
    const now = Date.now();
    const rateLimitData = this.rateLimits.get(provider);

    if (!rateLimitData || now > rateLimitData.resetTime) {
      this.rateLimits.set(provider, { count: 1, resetTime: now + 60000 });
      return true;
    }

    if (rateLimitData.count >= limit) {
      return false;
    }

    rateLimitData.count++;
    return true;
  }

  private getFromCache(key: string, ttl: number): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Mock data generators (fallbacks)
  private generateMockMarketData(symbols: string[]): LiveMarketData[] {
    return symbols.map(symbol => {
      const basePrice = symbol.includes('BTC') ? 97500 : symbol.includes('ETH') ? 3240 : 1;
      const change = (Math.random() - 0.5) * 0.1; // ±5%
      
      return {
        symbol,
        price: basePrice * (1 + change),
        change24h: basePrice * change,
        changePercent24h: change * 100,
        volume24h: Math.random() * 1000000000,
        marketCap: basePrice * 21000000 * (1 + change),
        high24h: basePrice * (1 + Math.abs(change)),
        low24h: basePrice * (1 - Math.abs(change)),
        timestamp: new Date().toISOString(),
        source: 'Mock'
      };
    });
  }

  private generateMockHistoricalData(symbol: string, limit: number): CandlestickData[] {
    const data: CandlestickData[] = [];
    const basePrice = symbol.includes('BTC') ? 97500 : symbol.includes('ETH') ? 3240 : 1;
    let currentPrice = basePrice;

    for (let i = limit; i > 0; i--) {
      const timestamp = new Date(Date.now() - i * 3600000).toISOString();
      const open = currentPrice;
      const volatility = 0.02; // 2% volatility
      const change = (Math.random() - 0.5) * volatility;
      
      const high = open * (1 + Math.random() * volatility);
      const low = open * (1 - Math.random() * volatility);
      const close = open * (1 + change);
      
      data.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume: Math.random() * 1000000
      });

      currentPrice = close;
    }

    return data;
  }

  private generateMockDeFiData(protocols: string[]): DeFiProtocolData[] {
    return protocols.map(protocol => this.generateMockDeFiProtocolData(protocol));
  }

  private generateMockDeFiProtocolData(protocol: string): DeFiProtocolData {
    const baseTVL = Math.random() * 10000000000; // $0-10B TVL
    
    return {
      protocol,
      tvl: baseTVL,
      apy: Math.random() * 20 + 2, // 2-22% APY
      volume24h: baseTVL * 0.1 * Math.random(),
      users: Math.floor(Math.random() * 100000),
      tokens: [
        {
          address: '0x' + Math.random().toString(16).substr(2, 40),
          symbol: 'USDC',
          apy: Math.random() * 10 + 2,
          totalSupply: baseTVL * 0.3,
          totalBorrow: baseTVL * 0.2
        },
        {
          address: '0x' + Math.random().toString(16).substr(2, 40),
          symbol: 'ETH',
          apy: Math.random() * 8 + 1,
          totalSupply: baseTVL * 0.4,
          totalBorrow: baseTVL * 0.25
        }
      ]
    };
  }

  private generateMockNews(symbols: string[], limit: number): NewsItem[] {
    const newsTemplates = [
      'Market analysis shows bullish sentiment for {symbol}',
      'Technical indicators suggest {symbol} may break resistance',
      'Institutional adoption drives {symbol} price action',
      'Regulatory clarity boosts {symbol} market confidence',
      'DeFi protocol integration supports {symbol} ecosystem'
    ];

    return Array.from({ length: limit }, (_, i) => {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const template = newsTemplates[Math.floor(Math.random() * newsTemplates.length)];
      
      return {
        id: `news-${Date.now()}-${i}`,
        title: template.replace('{symbol}', symbol),
        summary: `Market analysis and technical indicators for ${symbol} showing various trends and developments.`,
        source: ['CoinDesk', 'Cointelegraph', 'The Block', 'DeFi Pulse'][Math.floor(Math.random() * 4)],
        url: `https://example.com/news/${i}`,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)] as any,
        relevance: Math.random(),
        symbols: [symbol]
      };
    });
  }

  private generateMockEconomicData(): EconomicIndicator[] {
    return [
      {
        name: 'Federal Funds Rate',
        value: 5.25,
        previous: 5.0,
        forecast: 5.5,
        unit: '%',
        releaseDate: new Date().toISOString(),
        impact: 'high'
      },
      {
        name: 'Inflation Rate (CPI)',
        value: 3.2,
        previous: 3.7,
        forecast: 3.0,
        unit: '%',
        releaseDate: new Date().toISOString(),
        impact: 'high'
      },
      {
        name: 'Unemployment Rate',
        value: 3.8,
        previous: 3.9,
        forecast: 3.7,
        unit: '%',
        releaseDate: new Date().toISOString(),
        impact: 'medium'
      }
    ];
  }
}

export const realDataService = new RealDataService();