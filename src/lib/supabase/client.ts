/**
 * Supabase Client Configuration
 * Real-time database connection for Cival Trading Platform
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database service class for easy access
export class DatabaseService {
  private client = supabase;
  
  // Expose the client for direct access when needed
  get supabase() {
    return this.client;
  }

  // =============================================
  // USER OPERATIONS
  // =============================================
  
  async getUser(id: string) {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createUser(userData: any) {
    const { data, error } = await this.client
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // =============================================
  // AGENT OPERATIONS
  // =============================================
  
  async getAgents(userId: string) {
    const { data, error } = await this.client
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createAgent(agentData: any) {
    const { data, error } = await this.client
      .from('agents')
      .insert(agentData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateAgent(id: string, updates: any) {
    const { data, error } = await this.client
      .from('agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteAgent(id: string) {
    const { error } = await this.client
      .from('agents')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // =============================================
  // FARM OPERATIONS
  // =============================================
  
  async getFarms(userId: string) {
    const { data, error } = await this.client
      .from('farms')
      .select(`
        *,
        farm_agents (
          id,
          agent_id,
          allocation_percentage,
          role,
          agents (
            id,
            name,
            status,
            current_balance,
            total_pnl
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createFarm(farmData: any) {
    const { data, error } = await this.client
      .from('farms')
      .insert(farmData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateFarm(id: string, updates: any) {
    const { data, error } = await this.client
      .from('farms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // =============================================
  // PORTFOLIO OPERATIONS
  // =============================================
  
  async getPositions(userId: string) {
    const { data, error } = await this.client
      .from('positions')
      .select('*')
      .eq('user_id', userId)
      .gt('quantity', 0)
      .order('market_value', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getWallets(userId: string) {
    const { data, error } = await this.client
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getTransactions(userId: string, limit = 50) {
    const { data, error } = await this.client
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  }

  // =============================================
  // MARKET DATA OPERATIONS
  // =============================================
  
  async getMarketData(symbols?: string[]) {
    let query = this.client
      .from('market_data')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (symbols && symbols.length > 0) {
      query = query.in('symbol', symbols);
    }
    
    const { data, error } = await query.limit(100);
    
    if (error) throw error;
    return data || [];
  }

  async getDeFiProtocols() {
    const { data, error } = await this.client
      .from('defi_protocols')
      .select('*')
      .eq('is_active', true)
      .order('current_apy', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // =============================================
  // GOALS OPERATIONS
  // =============================================
  
  async getGoals(userId: string) {
    const { data, error } = await this.client
      .from('trading_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createGoal(goalData: any) {
    const { data, error } = await this.client
      .from('trading_goals')
      .insert(goalData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateGoal(id: string, updates: any) {
    const { data, error } = await this.client
      .from('trading_goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // =============================================
  // PERFORMANCE & ANALYTICS
  // =============================================
  
  async getPortfolioSummary(userId: string) {
    // Calculate portfolio metrics
    const positions = await this.getPositions(userId);
    const agents = await this.getAgents(userId);
    const farms = await this.getFarms(userId);
    
    const totalValue = positions.reduce((sum, pos) => sum + (pos.market_value || 0), 0);
    const totalPnL = positions.reduce((sum, pos) => sum + (pos.unrealized_pnl || 0) + (pos.realized_pnl || 0), 0);
    const agentsPnL = agents.reduce((sum, agent) => sum + (agent.total_pnl || 0), 0);
    
    return {
      totalValue,
      totalPnL,
      agentsPnL,
      positionsCount: positions.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      activeFarms: farms.filter(f => f.status === 'active').length,
      pnlPercentage: totalValue > 0 ? (totalPnL / totalValue) * 100 : 0
    };
  }

  async getAgentPerformance(agentId: string, days = 30) {
    const { data, error } = await this.client
      .from('agent_performance')
      .select('*')
      .eq('agent_id', agentId)
      .gte('snapshot_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('snapshot_date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  // =============================================
  // REAL-TIME SUBSCRIPTIONS
  // =============================================
  
  subscribeToAgents(userId: string, callback: (payload: any) => void) {
    return this.client
      .channel('agents-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'agents',
          filter: `user_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe();
  }

  subscribeToPositions(userId: string, callback: (payload: any) => void) {
    return this.client
      .channel('positions-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'positions',
          filter: `user_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe();
  }

  subscribeToMarketData(callback: (payload: any) => void) {
    return this.client
      .channel('market-data-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'market_data'
        }, 
        callback
      )
      .subscribe();
  }

  // =============================================
  // UTILITY METHODS
  // =============================================
  
  async executeRPC(functionName: string, params: any = {}) {
    const { data, error } = await this.client.rpc(functionName, params);
    if (error) throw error;
    return data;
  }

  async healthCheck() {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('id')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const db = new DatabaseService();

// Helper function to get demo user
export const getDemoUser = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'demo@cival.ai')
      .single();
    
    if (error || !data) {
      // Create demo user if doesn't exist
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: 'demo@cival.ai',
          display_name: 'Demo User',
          role: 'trader'
        })
        .select()
        .single();
      
      if (createError) throw createError;
      return newUser;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting demo user:', error);
    return null;
  }
};