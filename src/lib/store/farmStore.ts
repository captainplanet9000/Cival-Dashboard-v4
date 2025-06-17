import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { backendApi } from '@/lib/api/backend-client';

interface Farm {
  id: string;
  name: string;
  description: string;
  agents: string[];
  strategy: string;
  status: 'active' | 'inactive' | 'paused';
  totalValue: number;
  pnl24h: number;
  pnlPercent: number;
  performance: {
    totalTrades: number;
    winRate: number;
    avgReturn: number;
    maxDrawdown: number;
  };
  created: string;
  lastActive: string;
  settings: {
    maxRisk: number;
    targetReturn: number;
    rebalanceFrequency: string;
    emergencyStop: boolean;
  };
}

interface FarmStore {
  farms: Farm[];
  selectedFarm: Farm | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchFarms: () => Promise<void>;
  createFarm: (farmData: Partial<Farm>) => Promise<void>;
  updateFarm: (id: string, updates: Partial<Farm>) => Promise<void>;
  deleteFarm: (id: string) => Promise<void>;
  startFarm: (id: string) => Promise<void>;
  stopFarm: (id: string) => Promise<void>;
  pauseFarm: (id: string) => Promise<void>;
  addAgentToFarm: (farmId: string, agentId: string) => Promise<void>;
  removeAgentFromFarm: (farmId: string, agentId: string) => Promise<void>;
  setSelectedFarm: (farm: Farm | null) => void;
  refreshFarmData: (id: string) => Promise<void>;
}

export const useFarmStore = create<FarmStore>()(
  persist(
    (set, get) => ({
      farms: [],
      selectedFarm: null,
      loading: false,
      error: null,

      fetchFarms: async () => {
        set({ loading: true, error: null });
        try {
          // Use mock data for now, replace with real API call
          const mockFarms: Farm[] = [
            {
              id: 'farm-1',
              name: 'Momentum Traders',
              description: 'High-frequency momentum trading strategies',
              agents: ['agent-1', 'agent-2', 'agent-3'],
              strategy: 'momentum',
              status: 'active',
              totalValue: 25000,
              pnl24h: 1250,
              pnlPercent: 5.2,
              performance: {
                totalTrades: 1247,
                winRate: 68.5,
                avgReturn: 0.32,
                maxDrawdown: -8.4
              },
              created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              lastActive: new Date().toISOString(),
              settings: {
                maxRisk: 5,
                targetReturn: 15,
                rebalanceFrequency: 'hourly',
                emergencyStop: true
              }
            },
            {
              id: 'farm-2',
              name: 'Arbitrage Hunters',
              description: 'Cross-exchange arbitrage opportunities',
              agents: ['agent-4', 'agent-5'],
              strategy: 'arbitrage',
              status: 'active',
              totalValue: 18500,
              pnl24h: 740,
              pnlPercent: 4.1,
              performance: {
                totalTrades: 892,
                winRate: 74.2,
                avgReturn: 0.28,
                maxDrawdown: -5.2
              },
              created: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              lastActive: new Date().toISOString(),
              settings: {
                maxRisk: 3,
                targetReturn: 12,
                rebalanceFrequency: 'real-time',
                emergencyStop: true
              }
            },
            {
              id: 'farm-3',
              name: 'DeFi Yield Farm',
              description: 'Automated yield farming and liquidity provision',
              agents: ['agent-6'],
              strategy: 'defi-yield',
              status: 'paused',
              totalValue: 12000,
              pnl24h: -120,
              pnlPercent: -1.0,
              performance: {
                totalTrades: 234,
                winRate: 62.8,
                avgReturn: 0.15,
                maxDrawdown: -12.1
              },
              created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              settings: {
                maxRisk: 8,
                targetReturn: 20,
                rebalanceFrequency: 'daily',
                emergencyStop: false
              }
            }
          ];
          
          set({ farms: mockFarms, loading: false });
        } catch (error) {
          set({ error: 'Failed to fetch farms', loading: false });
          console.error('Fetch farms error:', error);
        }
      },

      createFarm: async (farmData) => {
        set({ loading: true, error: null });
        try {
          const newFarm: Farm = {
            id: `farm-${Date.now()}`,
            name: farmData.name || 'New Farm',
            description: farmData.description || '',
            agents: farmData.agents || [],
            strategy: farmData.strategy || 'custom',
            status: 'inactive',
            totalValue: 0,
            pnl24h: 0,
            pnlPercent: 0,
            performance: {
              totalTrades: 0,
              winRate: 0,
              avgReturn: 0,
              maxDrawdown: 0
            },
            created: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            settings: {
              maxRisk: farmData.settings?.maxRisk || 5,
              targetReturn: farmData.settings?.targetReturn || 15,
              rebalanceFrequency: farmData.settings?.rebalanceFrequency || 'hourly',
              emergencyStop: farmData.settings?.emergencyStop || true
            }
          };

          const { farms } = get();
          set({ farms: [...farms, newFarm], loading: false });
        } catch (error) {
          set({ error: 'Failed to create farm', loading: false });
          console.error('Create farm error:', error);
        }
      },

      updateFarm: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const { farms } = get();
          const updatedFarms = farms.map(farm => 
            farm.id === id ? { ...farm, ...updates } : farm
          );
          set({ farms: updatedFarms, loading: false });
        } catch (error) {
          set({ error: 'Failed to update farm', loading: false });
          console.error('Update farm error:', error);
        }
      },

      deleteFarm: async (id) => {
        set({ loading: true, error: null });
        try {
          const { farms } = get();
          const updatedFarms = farms.filter(farm => farm.id !== id);
          set({ farms: updatedFarms, loading: false });
        } catch (error) {
          set({ error: 'Failed to delete farm', loading: false });
          console.error('Delete farm error:', error);
        }
      },

      startFarm: async (id) => {
        try {
          await get().updateFarm(id, { status: 'active', lastActive: new Date().toISOString() });
        } catch (error) {
          console.error('Start farm error:', error);
        }
      },

      stopFarm: async (id) => {
        try {
          await get().updateFarm(id, { status: 'inactive' });
        } catch (error) {
          console.error('Stop farm error:', error);
        }
      },

      pauseFarm: async (id) => {
        try {
          await get().updateFarm(id, { status: 'paused' });
        } catch (error) {
          console.error('Pause farm error:', error);
        }
      },

      addAgentToFarm: async (farmId, agentId) => {
        try {
          const { farms } = get();
          const farm = farms.find(f => f.id === farmId);
          if (farm && !farm.agents.includes(agentId)) {
            await get().updateFarm(farmId, { 
              agents: [...farm.agents, agentId] 
            });
          }
        } catch (error) {
          console.error('Add agent to farm error:', error);
        }
      },

      removeAgentFromFarm: async (farmId, agentId) => {
        try {
          const { farms } = get();
          const farm = farms.find(f => f.id === farmId);
          if (farm) {
            await get().updateFarm(farmId, { 
              agents: farm.agents.filter(id => id !== agentId) 
            });
          }
        } catch (error) {
          console.error('Remove agent from farm error:', error);
        }
      },

      setSelectedFarm: (farm) => {
        set({ selectedFarm: farm });
      },

      refreshFarmData: async (id) => {
        try {
          // In a real implementation, this would fetch updated data from the API
          const { farms } = get();
          const farm = farms.find(f => f.id === id);
          if (farm) {
            // Simulate updated performance data
            const updatedFarm = {
              ...farm,
              lastActive: new Date().toISOString(),
              // Add some random variation to simulate live data
              pnl24h: farm.pnl24h + (Math.random() - 0.5) * 100,
              pnlPercent: farm.pnlPercent + (Math.random() - 0.5) * 0.5
            };
            await get().updateFarm(id, updatedFarm);
          }
        } catch (error) {
          console.error('Refresh farm data error:', error);
        }
      }
    }),
    {
      name: 'farm-store',
      partialize: (state) => ({ 
        farms: state.farms,
        selectedFarm: state.selectedFarm 
      })
    }
  )
);