import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { backendApi } from '@/lib/api/backend-client';

interface Agent {
  id: string;
  name: string;
  type: 'trading' | 'arbitrage' | 'market-maker' | 'yield-farmer' | 'scout';
  status: 'active' | 'inactive' | 'error' | 'paused';
  balance: number;
  pnl24h: number;
  pnlPercent: number;
  trades24h: number;
  winRate: number;
  lastActive: string;
  strategy: string;
  settings: {
    maxRisk: number;
    targetReturn: number;
    stopLoss: number;
    takeProfit: number;
  };
  performance: {
    totalTrades: number;
    totalVolume: number;
    avgReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
  farmId?: string;
  walletAddress?: string;
  created: string;
}

interface AgentStore {
  agents: Agent[];
  selectedAgent: Agent | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchAgents: () => Promise<void>;
  createAgent: (agentData: Partial<Agent>) => Promise<void>;
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  startAgent: (id: string) => Promise<void>;
  stopAgent: (id: string) => Promise<void>;
  pauseAgent: (id: string) => Promise<void>;
  setSelectedAgent: (agent: Agent | null) => void;
  refreshAgentData: (id: string) => Promise<void>;
  fundAgent: (id: string, amount: number) => Promise<void>;
  withdrawFromAgent: (id: string, amount: number) => Promise<void>;
}

export const useAgentStore = create<AgentStore>()(
  persist(
    (set, get) => ({
      agents: [],
      selectedAgent: null,
      loading: false,
      error: null,

      fetchAgents: async () => {
        set({ loading: true, error: null });
        try {
          // Mock data for now - replace with real API call
          const mockAgents: Agent[] = [
            {
              id: 'agent-1',
              name: 'Alpha Momentum',
              type: 'trading',
              status: 'active',
              balance: 8500,
              pnl24h: 425,
              pnlPercent: 5.3,
              trades24h: 47,
              winRate: 72.4,
              lastActive: new Date().toISOString(),
              strategy: 'momentum',
              settings: {
                maxRisk: 5,
                targetReturn: 15,
                stopLoss: -2,
                takeProfit: 3
              },
              performance: {
                totalTrades: 1247,
                totalVolume: 125000,
                avgReturn: 0.32,
                maxDrawdown: -8.4,
                sharpeRatio: 1.8
              },
              walletAddress: '0x742d35cc4bf78d7362c6b07a67dc15c3c1b47a99',
              created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 'agent-2',
              name: 'Beta Scalper',
              type: 'trading',
              status: 'active',
              balance: 6200,
              pnl24h: 186,
              pnlPercent: 3.1,
              trades24h: 89,
              winRate: 65.8,
              lastActive: new Date().toISOString(),
              strategy: 'scalping',
              settings: {
                maxRisk: 3,
                targetReturn: 12,
                stopLoss: -1,
                takeProfit: 1.5
              },
              performance: {
                totalTrades: 2341,
                totalVolume: 89000,
                avgReturn: 0.18,
                maxDrawdown: -5.2,
                sharpeRatio: 2.1
              },
              walletAddress: '0x8ba1f109551bd432803012645hf6b51e7b826db',
              created: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 'agent-3',
              name: 'Gamma Grid',
              type: 'market-maker',
              status: 'active',
              balance: 10300,
              pnl24h: 515,
              pnlPercent: 5.2,
              trades24h: 156,
              winRate: 78.2,
              lastActive: new Date().toISOString(),
              strategy: 'grid',
              settings: {
                maxRisk: 4,
                targetReturn: 18,
                stopLoss: -2.5,
                takeProfit: 2
              },
              performance: {
                totalTrades: 3456,
                totalVolume: 234000,
                avgReturn: 0.28,
                maxDrawdown: -6.8,
                sharpeRatio: 2.3
              },
              walletAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
              created: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 'agent-4',
              name: 'Delta Arbitrage',
              type: 'arbitrage',
              status: 'active',
              balance: 7800,
              pnl24h: 312,
              pnlPercent: 4.2,
              trades24h: 23,
              winRate: 86.4,
              lastActive: new Date().toISOString(),
              strategy: 'arbitrage',
              settings: {
                maxRisk: 2,
                targetReturn: 10,
                stopLoss: -1.5,
                takeProfit: 2.5
              },
              performance: {
                totalTrades: 567,
                totalVolume: 156000,
                avgReturn: 0.45,
                maxDrawdown: -3.2,
                sharpeRatio: 3.1
              },
              walletAddress: '0xa0b86a33e6cb3b6b4b50a2c29c8e24c10d3f7d85',
              created: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 'agent-5',
              name: 'Epsilon Cross-Chain',
              type: 'arbitrage',
              status: 'active',
              balance: 9100,
              pnl24h: 364,
              pnlPercent: 4.1,
              trades24h: 18,
              winRate: 83.7,
              lastActive: new Date().toISOString(),
              strategy: 'cross-chain',
              settings: {
                maxRisk: 3,
                targetReturn: 14,
                stopLoss: -2,
                takeProfit: 3
              },
              performance: {
                totalTrades: 423,
                totalVolume: 198000,
                avgReturn: 0.52,
                maxDrawdown: -4.1,
                sharpeRatio: 2.8
              },
              walletAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
              created: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 'agent-6',
              name: 'Zeta Yield',
              type: 'yield-farmer',
              status: 'paused',
              balance: 12000,
              pnl24h: -120,
              pnlPercent: -1.0,
              trades24h: 8,
              winRate: 62.5,
              lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              strategy: 'yield-farming',
              settings: {
                maxRisk: 8,
                targetReturn: 25,
                stopLoss: -5,
                takeProfit: 5
              },
              performance: {
                totalTrades: 234,
                totalVolume: 67000,
                avgReturn: 0.15,
                maxDrawdown: -12.1,
                sharpeRatio: 1.2
              },
              walletAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
              created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            }
          ];
          
          set({ agents: mockAgents, loading: false });
        } catch (error) {
          set({ error: 'Failed to fetch agents', loading: false });
          console.error('Fetch agents error:', error);
        }
      },

      createAgent: async (agentData) => {
        set({ loading: true, error: null });
        try {
          const newAgent: Agent = {
            id: `agent-${Date.now()}`,
            name: agentData.name || 'New Agent',
            type: agentData.type || 'trading',
            status: 'inactive',
            balance: 0,
            pnl24h: 0,
            pnlPercent: 0,
            trades24h: 0,
            winRate: 0,
            lastActive: new Date().toISOString(),
            strategy: agentData.strategy || 'custom',
            settings: {
              maxRisk: agentData.settings?.maxRisk || 5,
              targetReturn: agentData.settings?.targetReturn || 15,
              stopLoss: agentData.settings?.stopLoss || -2,
              takeProfit: agentData.settings?.takeProfit || 3
            },
            performance: {
              totalTrades: 0,
              totalVolume: 0,
              avgReturn: 0,
              maxDrawdown: 0,
              sharpeRatio: 0
            },
            created: new Date().toISOString()
          };

          const { agents } = get();
          set({ agents: [...agents, newAgent], loading: false });
        } catch (error) {
          set({ error: 'Failed to create agent', loading: false });
          console.error('Create agent error:', error);
        }
      },

      updateAgent: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const { agents } = get();
          const updatedAgents = agents.map(agent => 
            agent.id === id ? { ...agent, ...updates } : agent
          );
          set({ agents: updatedAgents, loading: false });
        } catch (error) {
          set({ error: 'Failed to update agent', loading: false });
          console.error('Update agent error:', error);
        }
      },

      deleteAgent: async (id) => {
        set({ loading: true, error: null });
        try {
          const { agents } = get();
          const updatedAgents = agents.filter(agent => agent.id !== id);
          set({ agents: updatedAgents, loading: false });
        } catch (error) {
          set({ error: 'Failed to delete agent', loading: false });
          console.error('Delete agent error:', error);
        }
      },

      startAgent: async (id) => {
        try {
          await get().updateAgent(id, { status: 'active', lastActive: new Date().toISOString() });
        } catch (error) {
          console.error('Start agent error:', error);
        }
      },

      stopAgent: async (id) => {
        try {
          await get().updateAgent(id, { status: 'inactive' });
        } catch (error) {
          console.error('Stop agent error:', error);
        }
      },

      pauseAgent: async (id) => {
        try {
          await get().updateAgent(id, { status: 'paused' });
        } catch (error) {
          console.error('Pause agent error:', error);
        }
      },

      setSelectedAgent: (agent) => {
        set({ selectedAgent: agent });
      },

      refreshAgentData: async (id) => {
        try {
          // In a real implementation, this would fetch updated data from the API
          const { agents } = get();
          const agent = agents.find(a => a.id === id);
          if (agent) {
            // Simulate updated performance data
            const updatedAgent = {
              ...agent,
              lastActive: new Date().toISOString(),
              // Add some random variation to simulate live data
              pnl24h: agent.pnl24h + (Math.random() - 0.5) * 50,
              pnlPercent: agent.pnlPercent + (Math.random() - 0.5) * 0.3,
              trades24h: agent.trades24h + Math.floor(Math.random() * 5)
            };
            await get().updateAgent(id, updatedAgent);
          }
        } catch (error) {
          console.error('Refresh agent data error:', error);
        }
      },

      fundAgent: async (id, amount) => {
        try {
          const { agents } = get();
          const agent = agents.find(a => a.id === id);
          if (agent) {
            await get().updateAgent(id, { balance: agent.balance + amount });
          }
        } catch (error) {
          console.error('Fund agent error:', error);
        }
      },

      withdrawFromAgent: async (id, amount) => {
        try {
          const { agents } = get();
          const agent = agents.find(a => a.id === id);
          if (agent && agent.balance >= amount) {
            await get().updateAgent(id, { balance: agent.balance - amount });
          }
        } catch (error) {
          console.error('Withdraw from agent error:', error);
        }
      }
    }),
    {
      name: 'agent-store',
      partialize: (state) => ({ 
        agents: state.agents,
        selectedAgent: state.selectedAgent 
      })
    }
  )
);