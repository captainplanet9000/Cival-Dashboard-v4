import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, getDemoUser } from '@/lib/supabase/client';

export interface Agent {
  id: string;
  name: string;
  type: 'trading' | 'arbitrage' | 'market_maker' | 'yield_farmer' | 'scout' | 'risk_manager';
  strategy: string;
  status: 'active' | 'inactive' | 'paused' | 'error' | 'stopped';
  balance: number;
  allocatedBalance: number;
  pnl24h: number;
  totalPnL: number;
  pnlPercent: number;
  winRate: number;
  totalTrades: number;
  successfulTrades: number;
  lastActivity: string;
  configuration: any;
  riskParameters: any;
  performanceMetrics: any;
  createdAt: string;
}

export interface AgentTrade {
  id: string;
  agentId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  pnl?: number;
  pnlPercentage?: number;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string;
  reason?: string;
}

interface AgentStore {
  agents: Agent[];
  selectedAgent: Agent | null;
  agentTrades: Record<string, AgentTrade[]>;
  loading: boolean;
  error: string | null;
  userId: string | null;

  // Actions
  initialize: () => Promise<void>;
  loadAgents: () => Promise<void>;
  createAgent: (agentData: Partial<Agent>) => Promise<Agent>;
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  startAgent: (id: string) => Promise<void>;
  stopAgent: (id: string) => Promise<void>;
  fundAgent: (id: string, amount: number) => Promise<void>;
  getAgentTrades: (agentId: string) => Promise<AgentTrade[]>;
  selectAgent: (agent: Agent | null) => void;
  refreshAgentPerformance: (agentId: string) => Promise<void>;
  createSampleAgents: () => Promise<void>;
}

export const useAgentStore = create<AgentStore>()(
  persist(
    (set, get) => ({
      agents: [],
      selectedAgent: null,
      agentTrades: {},
      loading: false,
      error: null,
      userId: null,

      initialize: async () => {
        try {
          set({ loading: true });
          
          // Get demo user
          const user = await getDemoUser();
          if (!user) {
            throw new Error('Failed to initialize user');
          }

          set({ userId: user.id });
          await get().loadAgents();
          
        } catch (error) {
          console.error('Agent store initialization error:', error);
          set({ error: 'Failed to initialize agents', loading: false });
        }
      },

      loadAgents: async () => {
        try {
          set({ loading: true, error: null });
          const { userId } = get();
          
          if (!userId) {
            throw new Error('User not initialized');
          }

          // Load agents from database
          const agentsData = await db.getAgents(userId);
          
          // Convert database format to store format
          const agents: Agent[] = agentsData.map(agent => ({
            id: agent.id,
            name: agent.name,
            type: agent.agent_type as any,
            strategy: agent.strategy,
            status: agent.status as any,
            balance: agent.current_balance || 0,
            allocatedBalance: agent.allocated_balance || 0,
            pnl24h: agent.daily_pnl || 0,
            totalPnL: agent.total_pnl || 0,
            pnlPercent: agent.current_balance > 0 ? ((agent.total_pnl || 0) / agent.current_balance) * 100 : 0,
            winRate: agent.win_rate || 0,
            totalTrades: agent.total_trades || 0,
            successfulTrades: agent.successful_trades || 0,
            lastActivity: agent.last_activity || agent.updated_at,
            configuration: agent.configuration || {},
            riskParameters: agent.risk_parameters || {},
            performanceMetrics: agent.performance_metrics || {},
            createdAt: agent.created_at
          }));

          // If no agents exist, create sample agents for demo
          if (agents.length === 0) {
            await get().createSampleAgents();
            // Reload after creating sample agents
            return get().loadAgents();
          }

          set({ agents, loading: false });

        } catch (error) {
          console.error('Load agents error:', error);
          set({ error: 'Failed to load agents', loading: false });
        }
      },

      createAgent: async (agentData: Partial<Agent>) => {
        try {
          set({ loading: true, error: null });
          const { userId } = get();
          
          if (!userId) {
            throw new Error('User not initialized');
          }

          const newAgentData = {
            user_id: userId,
            name: agentData.name || 'New Agent',
            agent_type: agentData.type || 'trading',
            strategy: agentData.strategy || 'balanced',
            status: 'inactive',
            allocated_balance: 0,
            current_balance: 0,
            total_pnl: 0,
            daily_pnl: 0,
            win_rate: 0,
            total_trades: 0,
            successful_trades: 0,
            configuration: agentData.configuration || {},
            risk_parameters: agentData.riskParameters || {},
            performance_metrics: {}
          };

          const createdAgent = await db.createAgent(newAgentData);

          const agent: Agent = {
            id: createdAgent.id,
            name: createdAgent.name,
            type: createdAgent.agent_type as any,
            strategy: createdAgent.strategy,
            status: createdAgent.status as any,
            balance: createdAgent.current_balance,
            allocatedBalance: createdAgent.allocated_balance,
            pnl24h: createdAgent.daily_pnl,
            totalPnL: createdAgent.total_pnl,
            pnlPercent: 0,
            winRate: createdAgent.win_rate,
            totalTrades: createdAgent.total_trades,
            successfulTrades: createdAgent.successful_trades,
            lastActivity: createdAgent.created_at,
            configuration: createdAgent.configuration,
            riskParameters: createdAgent.risk_parameters,
            performanceMetrics: createdAgent.performance_metrics,
            createdAt: createdAgent.created_at
          };

          set(state => ({
            agents: [...state.agents, agent],
            loading: false
          }));

          return agent;

        } catch (error) {
          console.error('Create agent error:', error);
          set({ error: 'Failed to create agent', loading: false });
          throw error;
        }
      },

      updateAgent: async (id: string, updates: Partial<Agent>) => {
        try {
          set({ loading: true, error: null });

          // Convert store format to database format
          const dbUpdates: any = {};
          if (updates.name) dbUpdates.name = updates.name;
          if (updates.strategy) dbUpdates.strategy = updates.strategy;
          if (updates.status) dbUpdates.status = updates.status;
          if (updates.balance !== undefined) dbUpdates.current_balance = updates.balance;
          if (updates.allocatedBalance !== undefined) dbUpdates.allocated_balance = updates.allocatedBalance;
          if (updates.configuration) dbUpdates.configuration = updates.configuration;
          if (updates.riskParameters) dbUpdates.risk_parameters = updates.riskParameters;

          await db.updateAgent(id, dbUpdates);

          set(state => ({
            agents: state.agents.map(agent =>
              agent.id === id ? { ...agent, ...updates } : agent
            ),
            selectedAgent: state.selectedAgent?.id === id 
              ? { ...state.selectedAgent, ...updates } 
              : state.selectedAgent,
            loading: false
          }));

        } catch (error) {
          console.error('Update agent error:', error);
          set({ error: 'Failed to update agent', loading: false });
        }
      },

      deleteAgent: async (id: string) => {
        try {
          set({ loading: true, error: null });

          await db.deleteAgent(id);

          set(state => ({
            agents: state.agents.filter(agent => agent.id !== id),
            selectedAgent: state.selectedAgent?.id === id ? null : state.selectedAgent,
            loading: false
          }));

        } catch (error) {
          console.error('Delete agent error:', error);
          set({ error: 'Failed to delete agent', loading: false });
        }
      },

      startAgent: async (id: string) => {
        try {
          await db.updateAgent(id, { status: 'active', last_activity: new Date().toISOString() });
          
          set(state => ({
            agents: state.agents.map(agent =>
              agent.id === id 
                ? { ...agent, status: 'active', lastActivity: new Date().toISOString() }
                : agent
            ),
            selectedAgent: state.selectedAgent?.id === id
              ? { ...state.selectedAgent, status: 'active', lastActivity: new Date().toISOString() }
              : state.selectedAgent
          }));

        } catch (error) {
          console.error('Start agent error:', error);
          set({ error: 'Failed to start agent' });
        }
      },

      stopAgent: async (id: string) => {
        try {
          await db.updateAgent(id, { status: 'stopped' });
          
          set(state => ({
            agents: state.agents.map(agent =>
              agent.id === id ? { ...agent, status: 'stopped' } : agent
            ),
            selectedAgent: state.selectedAgent?.id === id
              ? { ...state.selectedAgent, status: 'stopped' }
              : state.selectedAgent
          }));

        } catch (error) {
          console.error('Stop agent error:', error);
          set({ error: 'Failed to stop agent' });
        }
      },

      fundAgent: async (id: string, amount: number) => {
        try {
          const agent = get().agents.find(a => a.id === id);
          if (!agent) throw new Error('Agent not found');

          const newBalance = agent.balance + amount;
          const newAllocatedBalance = agent.allocatedBalance + amount;

          await db.updateAgent(id, { 
            current_balance: newBalance,
            allocated_balance: newAllocatedBalance
          });

          set(state => ({
            agents: state.agents.map(a =>
              a.id === id 
                ? { ...a, balance: newBalance, allocatedBalance: newAllocatedBalance }
                : a
            ),
            selectedAgent: state.selectedAgent?.id === id
              ? { ...state.selectedAgent, balance: newBalance, allocatedBalance: newAllocatedBalance }
              : state.selectedAgent
          }));

        } catch (error) {
          console.error('Fund agent error:', error);
          set({ error: 'Failed to fund agent' });
        }
      },

      getAgentTrades: async (agentId: string) => {
        try {
          const { data, error } = await db.supabase
            .from('agent_trades')
            .select('*')
            .eq('agent_id', agentId)
            .order('opened_at', { ascending: false })
            .limit(50);

          if (error) throw error;

          const trades: AgentTrade[] = (data || []).map(trade => ({
            id: trade.id,
            agentId: trade.agent_id,
            symbol: trade.symbol,
            side: trade.side as any,
            quantity: trade.quantity,
            entryPrice: trade.entry_price || 0,
            exitPrice: trade.exit_price || undefined,
            pnl: trade.pnl || undefined,
            pnlPercentage: trade.pnl_percentage || undefined,
            status: trade.closed_at ? 'closed' : 'open',
            openedAt: trade.opened_at,
            closedAt: trade.closed_at || undefined,
            reason: trade.reason || undefined
          }));

          set(state => ({
            agentTrades: {
              ...state.agentTrades,
              [agentId]: trades
            }
          }));

          return trades;

        } catch (error) {
          console.error('Get agent trades error:', error);
          return [];
        }
      },

      selectAgent: (agent: Agent | null) => {
        set({ selectedAgent: agent });
      },

      refreshAgentPerformance: async (agentId: string) => {
        try {
          // Get recent performance data
          const performanceData = await db.getAgentPerformance(agentId, 30);
          
          // Update agent performance metrics
          const agent = get().agents.find(a => a.id === agentId);
          if (agent && performanceData.length > 0) {
            const latestPerformance = performanceData[performanceData.length - 1];
            
            const updates = {
              balance: latestPerformance.balance,
              totalPnL: latestPerformance.pnl,
              winRate: latestPerformance.win_rate || 0,
              performanceMetrics: {
                ...agent.performanceMetrics,
                sharpeRatio: latestPerformance.sharpe_ratio,
                maxDrawdown: latestPerformance.max_drawdown,
                volatility: latestPerformance.volatility,
                recentPerformance: performanceData
              }
            };

            await get().updateAgent(agentId, updates);
          }

        } catch (error) {
          console.error('Refresh agent performance error:', error);
        }
      },

      // Helper method to create sample agents for demo
      createSampleAgents: async () => {
        const { userId } = get();
        if (!userId) return;

        const sampleAgents = [
          {
            name: 'Marcus - Momentum',
            agent_type: 'trading',
            strategy: 'momentum',
            status: 'active',
            allocated_balance: 25000,
            current_balance: 26247,
            total_pnl: 1247,
            daily_pnl: 425,
            win_rate: 68.5,
            total_trades: 47,
            successful_trades: 32,
            configuration: {
              symbols: ['BTC/USD', 'ETH/USD'],
              timeframe: '1h',
              lookback: 24
            },
            risk_parameters: {
              maxRisk: 5,
              stopLoss: -2,
              takeProfit: 3
            }
          },
          {
            name: 'Alex - Arbitrage',
            agent_type: 'arbitrage',
            strategy: 'cross_exchange',
            status: 'active',
            allocated_balance: 15000,
            current_balance: 15750,
            total_pnl: 750,
            daily_pnl: 125,
            win_rate: 85.2,
            total_trades: 23,
            successful_trades: 20,
            configuration: {
              exchanges: ['binance', 'coinbase'],
              minSpread: 0.5
            },
            risk_parameters: {
              maxRisk: 3,
              stopLoss: -1.5,
              takeProfit: 2
            }
          },
          {
            name: 'Sophia - Mean Reversion',
            agent_type: 'trading',
            strategy: 'mean_reversion',
            status: 'paused',
            allocated_balance: 20000,
            current_balance: 19650,
            total_pnl: -350,
            daily_pnl: -125,
            win_rate: 62.1,
            total_trades: 29,
            successful_trades: 18,
            configuration: {
              symbols: ['ETH/USD'],
              rsiPeriod: 14,
              oversold: 30,
              overbought: 70
            },
            risk_parameters: {
              maxRisk: 4,
              stopLoss: -2.5,
              takeProfit: 3.5
            }
          }
        ];

        for (const agentData of sampleAgents) {
          try {
            await db.supabase
              .from('agents')
              .insert({
                user_id: userId,
                ...agentData
              });
          } catch (error) {
            console.error('Error creating sample agent:', error);
          }
        }
      }
    }),
    {
      name: 'agent-store',
      partialize: (state) => ({
        agents: state.agents,
        selectedAgent: state.selectedAgent,
        userId: state.userId
      })
    }
  )
);