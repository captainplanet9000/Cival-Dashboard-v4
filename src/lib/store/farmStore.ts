import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, getDemoUser } from '@/lib/supabase/client';

export interface Farm {
  id: string;
  name: string;
  description: string;
  type: 'yield' | 'arbitrage' | 'momentum' | 'balanced' | 'conservative' | 'aggressive';
  strategy: string;
  status: 'active' | 'inactive' | 'paused' | 'optimizing';
  totalAllocated: number;
  currentValue: number;
  totalPnL: number;
  performanceTarget: number;
  riskTolerance: 'low' | 'medium' | 'high';
  configuration: any;
  performanceMetrics: any;
  assignedAgents: FarmAgent[];
  createdAt: string;
  updatedAt: string;
}

export interface FarmAgent {
  id: string;
  farmId: string;
  agentId: string;
  agentName: string;
  allocationPercentage: number;
  role: 'trader' | 'scout' | 'risk_manager' | 'coordinator';
  assignedAt: string;
  agentStatus?: string;
  agentBalance?: number;
  agentPnL?: number;
}

interface FarmStore {
  farms: Farm[];
  selectedFarm: Farm | null;
  loading: boolean;
  error: string | null;
  userId: string | null;

  // Actions
  initialize: () => Promise<void>;
  loadFarms: () => Promise<void>;
  createFarm: (farmData: Partial<Farm>) => Promise<Farm>;
  updateFarm: (id: string, updates: Partial<Farm>) => Promise<void>;
  deleteFarm: (id: string) => Promise<void>;
  assignAgentToFarm: (farmId: string, agentId: string, allocation: number, role: string) => Promise<void>;
  removeAgentFromFarm: (farmId: string, agentId: string) => Promise<void>;
  optimizeFarm: (id: string) => Promise<void>;
  selectFarm: (farm: Farm | null) => void;
  getFarmPerformance: (farmId: string) => Promise<any>;
  createSampleFarm: () => Promise<void>;
}

export const useFarmStore = create<FarmStore>()(
  persist(
    (set, get) => ({
      farms: [],
      selectedFarm: null,
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
          await get().loadFarms();
          
        } catch (error) {
          console.error('Farm store initialization error:', error);
          set({ error: 'Failed to initialize farms', loading: false });
        }
      },

      loadFarms: async () => {
        try {
          set({ loading: true, error: null });
          const { userId } = get();
          
          if (!userId) {
            throw new Error('User not initialized');
          }

          // Load farms from database with assigned agents
          const farmsData = await db.getFarms(userId);
          
          // Convert database format to store format
          const farms: Farm[] = farmsData.map(farm => ({
            id: farm.id,
            name: farm.name,
            description: farm.description || '',
            type: farm.farm_type as any,
            strategy: farm.strategy,
            status: farm.status as any,
            totalAllocated: farm.total_allocated || 0,
            currentValue: farm.current_value || 0,
            totalPnL: farm.total_pnl || 0,
            performanceTarget: farm.performance_target || 0,
            riskTolerance: farm.risk_tolerance as any,
            configuration: farm.configuration || {},
            performanceMetrics: farm.performance_metrics || {},
            assignedAgents: (farm.farm_agents || []).map((fa: any) => ({
              id: fa.id,
              farmId: farm.id,
              agentId: fa.agent_id,
              agentName: fa.agents?.name || 'Unknown Agent',
              allocationPercentage: fa.allocation_percentage || 0,
              role: fa.role,
              assignedAt: fa.assigned_at,
              agentStatus: fa.agents?.status,
              agentBalance: fa.agents?.current_balance,
              agentPnL: fa.agents?.total_pnl
            })),
            createdAt: farm.created_at,
            updatedAt: farm.updated_at
          }));

          // If no farms exist, create sample farm for demo
          if (farms.length === 0) {
            await get().createSampleFarm();
            // Reload after creating sample farm
            return get().loadFarms();
          }

          set({ farms, loading: false });

        } catch (error) {
          console.error('Load farms error:', error);
          set({ error: 'Failed to load farms', loading: false });
        }
      },

      createFarm: async (farmData: Partial<Farm>) => {
        try {
          set({ loading: true, error: null });
          const { userId } = get();
          
          if (!userId) {
            throw new Error('User not initialized');
          }

          const newFarmData = {
            user_id: userId,
            name: farmData.name || 'New Farm',
            description: farmData.description || '',
            farm_type: farmData.type || 'balanced',
            strategy: farmData.strategy || 'diversified',
            status: 'inactive',
            total_allocated: 0,
            current_value: 0,
            total_pnl: 0,
            performance_target: farmData.performanceTarget || 10,
            risk_tolerance: farmData.riskTolerance || 'medium',
            configuration: farmData.configuration || {},
            performance_metrics: {}
          };

          const createdFarm = await db.createFarm(newFarmData);

          const farm: Farm = {
            id: createdFarm.id,
            name: createdFarm.name,
            description: createdFarm.description || '',
            type: createdFarm.farm_type as any,
            strategy: createdFarm.strategy,
            status: createdFarm.status as any,
            totalAllocated: createdFarm.total_allocated,
            currentValue: createdFarm.current_value,
            totalPnL: createdFarm.total_pnl,
            performanceTarget: createdFarm.performance_target || 0,
            riskTolerance: createdFarm.risk_tolerance as any,
            configuration: createdFarm.configuration,
            performanceMetrics: createdFarm.performance_metrics,
            assignedAgents: [],
            createdAt: createdFarm.created_at,
            updatedAt: createdFarm.updated_at
          };

          set(state => ({
            farms: [...state.farms, farm],
            loading: false
          }));

          return farm;

        } catch (error) {
          console.error('Create farm error:', error);
          set({ error: 'Failed to create farm', loading: false });
          throw error;
        }
      },

      updateFarm: async (id: string, updates: Partial<Farm>) => {
        try {
          set({ loading: true, error: null });

          // Convert store format to database format
          const dbUpdates: any = {};
          if (updates.name) dbUpdates.name = updates.name;
          if (updates.description) dbUpdates.description = updates.description;
          if (updates.strategy) dbUpdates.strategy = updates.strategy;
          if (updates.status) dbUpdates.status = updates.status;
          if (updates.totalAllocated !== undefined) dbUpdates.total_allocated = updates.totalAllocated;
          if (updates.currentValue !== undefined) dbUpdates.current_value = updates.currentValue;
          if (updates.totalPnL !== undefined) dbUpdates.total_pnl = updates.totalPnL;
          if (updates.performanceTarget !== undefined) dbUpdates.performance_target = updates.performanceTarget;
          if (updates.riskTolerance) dbUpdates.risk_tolerance = updates.riskTolerance;
          if (updates.configuration) dbUpdates.configuration = updates.configuration;
          if (updates.performanceMetrics) dbUpdates.performance_metrics = updates.performanceMetrics;

          await db.updateFarm(id, dbUpdates);

          set(state => ({
            farms: state.farms.map(farm =>
              farm.id === id ? { ...farm, ...updates } : farm
            ),
            selectedFarm: state.selectedFarm?.id === id 
              ? { ...state.selectedFarm, ...updates } 
              : state.selectedFarm,
            loading: false
          }));

        } catch (error) {
          console.error('Update farm error:', error);
          set({ error: 'Failed to update farm', loading: false });
        }
      },

      deleteFarm: async (id: string) => {
        try {
          set({ loading: true, error: null });

          // Delete farm from database (this will cascade delete farm_agents)
          await db.supabase
            .from('farms')
            .delete()
            .eq('id', id);

          set(state => ({
            farms: state.farms.filter(farm => farm.id !== id),
            selectedFarm: state.selectedFarm?.id === id ? null : state.selectedFarm,
            loading: false
          }));

        } catch (error) {
          console.error('Delete farm error:', error);
          set({ error: 'Failed to delete farm', loading: false });
        }
      },

      assignAgentToFarm: async (farmId: string, agentId: string, allocation: number, role: string) => {
        try {
          set({ loading: true, error: null });

          // Check if agent is already assigned to this farm
          const existingAssignment = await db.supabase
            .from('farm_agents')
            .select('id')
            .eq('farm_id', farmId)
            .eq('agent_id', agentId)
            .single();

          if (!existingAssignment.error) {
            // Update existing assignment
            await db.supabase
              .from('farm_agents')
              .update({
                allocation_percentage: allocation,
                role: role
              })
              .eq('farm_id', farmId)
              .eq('agent_id', agentId);
          } else {
            // Create new assignment
            await db.supabase
              .from('farm_agents')
              .insert({
                farm_id: farmId,
                agent_id: agentId,
                allocation_percentage: allocation,
                role: role
              });
          }

          // Reload farms to get updated assignments
          await get().loadFarms();

        } catch (error) {
          console.error('Assign agent to farm error:', error);
          set({ error: 'Failed to assign agent to farm', loading: false });
        }
      },

      removeAgentFromFarm: async (farmId: string, agentId: string) => {
        try {
          set({ loading: true, error: null });

          await db.supabase
            .from('farm_agents')
            .delete()
            .eq('farm_id', farmId)
            .eq('agent_id', agentId);

          // Update local state
          set(state => ({
            farms: state.farms.map(farm =>
              farm.id === farmId
                ? {
                    ...farm,
                    assignedAgents: farm.assignedAgents.filter(
                      agent => agent.agentId !== agentId
                    )
                  }
                : farm
            ),
            selectedFarm: state.selectedFarm?.id === farmId
              ? {
                  ...state.selectedFarm,
                  assignedAgents: state.selectedFarm.assignedAgents.filter(
                    agent => agent.agentId !== agentId
                  )
                }
              : state.selectedFarm,
            loading: false
          }));

        } catch (error) {
          console.error('Remove agent from farm error:', error);
          set({ error: 'Failed to remove agent from farm', loading: false });
        }
      },

      optimizeFarm: async (id: string) => {
        try {
          set({ loading: true, error: null });

          // Get farm data
          const farm = get().farms.find(f => f.id === id);
          if (!farm) throw new Error('Farm not found');

          // Mock optimization logic - in real implementation this would use AI/ML
          const optimizedAllocations = farm.assignedAgents.map(agent => {
            // Adjust allocation based on agent performance
            const performanceMultiplier = agent.agentPnL && agent.agentPnL > 0 ? 1.1 : 0.9;
            const newAllocation = Math.min(50, Math.max(10, agent.allocationPercentage * performanceMultiplier));
            
            return {
              ...agent,
              allocationPercentage: newAllocation
            };
          });

          // Update allocations in database
          for (const agent of optimizedAllocations) {
            await db.supabase
              .from('farm_agents')
              .update({ allocation_percentage: agent.allocationPercentage })
              .eq('farm_id', id)
              .eq('agent_id', agent.agentId);
          }

          // Update farm status
          await db.updateFarm(id, { 
            status: 'active',
            performance_metrics: {
              ...farm.performanceMetrics,
              lastOptimization: new Date().toISOString(),
              optimizationCount: (farm.performanceMetrics.optimizationCount || 0) + 1
            }
          });

          // Reload farms
          await get().loadFarms();

        } catch (error) {
          console.error('Optimize farm error:', error);
          set({ error: 'Failed to optimize farm', loading: false });
        }
      },

      selectFarm: (farm: Farm | null) => {
        set({ selectedFarm: farm });
      },

      getFarmPerformance: async (farmId: string) => {
        try {
          // Get farm performance metrics
          const { data, error } = await db.supabase
            .from('farms')
            .select(`
              *,
              farm_agents (
                *,
                agents (
                  current_balance,
                  total_pnl,
                  win_rate,
                  total_trades
                )
              )
            `)
            .eq('id', farmId)
            .single();

          if (error) throw error;

          // Calculate aggregate performance metrics
          const totalValue = data.farm_agents.reduce((sum: number, fa: any) => 
            sum + (fa.agents?.current_balance || 0), 0);
          
          const totalPnL = data.farm_agents.reduce((sum: number, fa: any) => 
            sum + (fa.agents?.total_pnl || 0), 0);
          
          const avgWinRate = data.farm_agents.length > 0 
            ? data.farm_agents.reduce((sum: number, fa: any) => 
                sum + (fa.agents?.win_rate || 0), 0) / data.farm_agents.length
            : 0;

          const totalTrades = data.farm_agents.reduce((sum: number, fa: any) => 
            sum + (fa.agents?.total_trades || 0), 0);

          return {
            totalValue,
            totalPnL,
            pnlPercentage: totalValue > 0 ? (totalPnL / totalValue) * 100 : 0,
            avgWinRate,
            totalTrades,
            agentCount: data.farm_agents.length,
            lastUpdated: new Date().toISOString()
          };

        } catch (error) {
          console.error('Get farm performance error:', error);
          return null;
        }
      },

      // Helper method to create sample farm for demo
      createSampleFarm: async () => {
        const { userId } = get();
        if (!userId) return;

        try {
          const sampleFarm = {
            user_id: userId,
            name: 'DeFi Yield Farm',
            description: 'Conservative yield farming across multiple protocols',
            farm_type: 'yield',
            strategy: 'diversified_yield',
            status: 'active',
            total_allocated: 50000,
            current_value: 52150,
            total_pnl: 2150,
            performance_target: 12,
            risk_tolerance: 'medium',
            configuration: {
              protocols: ['aave', 'compound', 'yearn'],
              riskLevel: 'low',
              autoCompound: true
            },
            performance_metrics: {
              monthlyReturn: 12.3,
              sharpeRatio: 1.8,
              maxDrawdown: -3.2
            }
          };

          await db.supabase
            .from('farms')
            .insert(sampleFarm);

        } catch (error) {
          console.error('Error creating sample farm:', error);
        }
      }
    }),
    {
      name: 'farm-store',
      partialize: (state) => ({
        farms: state.farms,
        selectedFarm: state.selectedFarm,
        userId: state.userId
      })
    }
  )
);