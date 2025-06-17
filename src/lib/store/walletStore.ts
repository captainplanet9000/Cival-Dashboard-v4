import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, getDemoUser } from '@/lib/supabase/client';

interface WalletBalance {
  token: string;
  symbol: string;
  amount: number;
  value: number; // USD value
  price: number; // USD price per token
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'trade' | 'transfer';
  amount: number;
  token: string;
  hash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  from?: string;
  to?: string;
  agentId?: string;
  farmId?: string;
}

interface WalletStore {
  // State
  totalBalance: number;
  balances: WalletBalance[];
  transactions: Transaction[];
  isConnected: boolean;
  address?: string;
  loading: boolean;
  error: string | null;
  userId: string | null;

  // Actions
  initialize: () => Promise<void>;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  loadBalance: () => Promise<void>;
  deposit: (amount: number, token: string) => Promise<void>;
  withdraw: (amount: number, token: string, address: string) => Promise<void>;
  transferToAgent: (agentId: string, amount: number, token: string) => Promise<void>;
  transferToFarm: (farmId: string, amount: number, token: string) => Promise<void>;
  getTransactionHistory: () => Promise<void>;
  refreshPrices: () => Promise<void>;
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      totalBalance: 0,
      balances: [],
      transactions: [],
      isConnected: false,
      address: undefined,
      loading: false,
      error: null,
      userId: null,

      initialize: async () => {
        try {
          set({ loading: true });
          
          // Get or create demo user
          const user = await getDemoUser();
          if (!user) {
            throw new Error('Failed to initialize user');
          }

          set({ userId: user.id });

          // Load user's wallets and balances from database
          const wallets = await db.getWallets(user.id);
          const positions = await db.getPositions(user.id);
          const transactions = await db.getTransactions(user.id, 50);

          if (wallets.length > 0) {
            const primaryWallet = wallets.find(w => w.is_primary) || wallets[0];
            
            // Convert positions to wallet balances
            const balances: WalletBalance[] = [];
            const balanceMap = new Map<string, number>();
            
            // Parse balance cache from wallet
            if (primaryWallet.balance_cache) {
              Object.entries(primaryWallet.balance_cache as Record<string, number>).forEach(([symbol, amount]) => {
                balanceMap.set(symbol, amount);
              });
            }

            // Add positions
            positions.forEach(pos => {
              const symbol = pos.symbol.split('/')[0]; // Extract base symbol from pair
              const existing = balanceMap.get(symbol) || 0;
              balanceMap.set(symbol, existing + pos.quantity);
            });

            // Get current market prices
            const marketData = await db.getMarketData();
            const priceMap = new Map<string, number>();
            marketData.forEach(data => {
              const symbol = data.symbol.split('/')[0];
              priceMap.set(symbol, data.price);
            });

            // Convert to balance format
            balanceMap.forEach((amount, symbol) => {
              if (amount > 0) {
                const price = priceMap.get(symbol) || (symbol === 'USDC' ? 1 : 0);
                balances.push({
                  token: symbol,
                  symbol,
                  amount,
                  price,
                  value: amount * price
                });
              }
            });

            const totalBalance = balances.reduce((sum, balance) => sum + balance.value, 0);

            // Convert database transactions to store format
            const formattedTransactions: Transaction[] = transactions.map(tx => ({
              id: tx.id,
              type: tx.transaction_type as any,
              amount: tx.quantity,
              token: tx.symbol.split('/')[0],
              hash: tx.transaction_hash || undefined,
              status: tx.status === 'confirmed' ? 'confirmed' : tx.status === 'failed' ? 'failed' : 'pending',
              timestamp: tx.created_at,
              agentId: tx.agent_id || undefined,
              farmId: tx.farm_id || undefined
            }));

            set({
              isConnected: true,
              address: primaryWallet.address,
              balances,
              totalBalance,
              transactions: formattedTransactions,
              loading: false
            });
          } else {
            // Create initial wallet for demo user
            await get().connectWallet();
          }

        } catch (error) {
          console.error('Wallet initialization error:', error);
          set({ error: 'Failed to initialize wallet', loading: false });
        }
      },

      connectWallet: async () => {
        set({ loading: true, error: null });
        try {
          const { userId, isConnected } = get();
          
          // If already connected, just return
          if (isConnected) {
            set({ loading: false });
            return;
          }

          let currentUserId = userId;

          // Get or create demo user if no userId
          if (!currentUserId) {
            const user = await getDemoUser();
            if (!user) throw new Error('Failed to get user');
            currentUserId = user.id;
            set({ userId: currentUserId });
          }

          if (!currentUserId) {
            throw new Error('Failed to establish user ID');
          }

          const mockAddress = '0x742d35cc4bf78d7362c6b07a67dc15c3c1b47a99';
          
          // Check if wallet exists, if not create one
          const existingWallets = await db.getWallets(currentUserId);
          let walletData;

          if (existingWallets.length === 0) {
            // Create new wallet in database
            walletData = await db.supabase
              .from('wallets')
              .insert({
                user_id: currentUserId,
                name: 'Main Wallet',
                address: mockAddress,
                wallet_type: 'internal',
                is_primary: true,
                balance_cache: {
                  USDC: 50.0, // Start with $50 as requested
                  ETH: 0.02,
                  BTC: 0.001
                }
              })
              .select()
              .single();

            if (walletData.error) throw walletData.error;
          } else {
            walletData = { data: existingWallets[0] };
          }

          // Initialize balances from wallet cache
          const balanceCache = walletData.data.balance_cache as Record<string, number>;
          const balances: WalletBalance[] = [];

          // Get current market prices
          const marketData = await db.getMarketData(['BTC/USD', 'ETH/USD', 'USDC/USD']);
          const priceMap = new Map<string, number>();
          marketData.forEach(data => {
            const symbol = data.symbol.split('/')[0];
            priceMap.set(symbol, data.price);
          });

          // Set default prices if not found
          priceMap.set('USDC', 1.0);
          if (!priceMap.has('ETH')) priceMap.set('ETH', 3240.0);
          if (!priceMap.has('BTC')) priceMap.set('BTC', 97500.0);

          Object.entries(balanceCache).forEach(([symbol, amount]) => {
            const price = priceMap.get(symbol) || 1;
            balances.push({
              token: symbol,
              symbol,
              amount,
              price,
              value: amount * price
            });
          });

          const totalBalance = balances.reduce((sum, balance) => sum + balance.value, 0);

          set({
            isConnected: true,
            address: mockAddress,
            balances,
            totalBalance,
            loading: false
          });

        } catch (error) {
          set({ error: 'Failed to connect wallet', loading: false });
          console.error('Wallet connection error:', error);
        }
      },

      disconnectWallet: () => {
        set({
          isConnected: false,
          address: undefined,
          balances: [],
          totalBalance: 0,
          transactions: []
        });
      },

      loadBalance: async () => {
        if (!get().isConnected || !get().userId) return;
        
        set({ loading: true, error: null });
        try {
          // Refresh balances from database
          const { userId } = get();
          const wallets = await db.getWallets(userId!);
          const positions = await db.getPositions(userId!);

          if (wallets.length > 0) {
            const primaryWallet = wallets.find(w => w.is_primary) || wallets[0];
            
            // Update balance cache and recalculate
            const balanceCache = primaryWallet.balance_cache as Record<string, number>;
            const balances: WalletBalance[] = [];

            // Get current market prices
            const marketData = await db.getMarketData();
            const priceMap = new Map<string, number>();
            marketData.forEach(data => {
              const symbol = data.symbol.split('/')[0];
              priceMap.set(symbol, data.price);
            });

            Object.entries(balanceCache).forEach(([symbol, amount]) => {
              const price = priceMap.get(symbol) || 1;
              balances.push({
                token: symbol,
                symbol,
                amount,
                price,
                value: amount * price
              });
            });

            const totalBalance = balances.reduce((sum, balance) => sum + balance.value, 0);
            set({ balances, totalBalance, loading: false });
          }
        } catch (error) {
          set({ error: 'Failed to load balance', loading: false });
          console.error('Load balance error:', error);
        }
      },

      deposit: async (amount: number, token: string) => {
        set({ loading: true, error: null });
        try {
          const { balances, userId, address } = get();
          
          if (!userId) throw new Error('User not connected');

          const existingBalance = balances.find(b => b.token === token);
          
          let updatedBalances;
          if (existingBalance) {
            updatedBalances = balances.map(balance =>
              balance.token === token
                ? { 
                    ...balance, 
                    amount: balance.amount + amount,
                    value: (balance.amount + amount) * balance.price
                  }
                : balance
            );
          } else {
            // Get current price for new token
            const marketData = await db.getMarketData([`${token}/USD`]);
            const price = marketData.length > 0 ? marketData[0].price : 
                         (token === 'USDC' ? 1.0 : token === 'ETH' ? 3240.0 : 97500.0);
            
            const newBalance: WalletBalance = {
              token,
              symbol: token,
              amount,
              value: amount * price,
              price
            };
            updatedBalances = [...balances, newBalance];
          }

          const totalBalance = updatedBalances.reduce((sum, balance) => sum + balance.value, 0);

          // Update wallet balance cache in database
          const wallets = await db.getWallets(userId);
          if (wallets.length > 0) {
            const primaryWallet = wallets.find(w => w.is_primary) || wallets[0];
            const newBalanceCache = { ...primaryWallet.balance_cache as Record<string, number> };
            newBalanceCache[token] = (newBalanceCache[token] || 0) + amount;

            await db.supabase
              .from('wallets')
              .update({ balance_cache: newBalanceCache })
              .eq('id', primaryWallet.id);

            // Record transaction in database
            await db.supabase
              .from('transactions')
              .insert({
                user_id: userId,
                wallet_id: primaryWallet.id,
                transaction_type: 'deposit',
                symbol: token,
                quantity: amount,
                total_amount: amount * (updatedBalances.find(b => b.token === token)?.price || 1),
                status: 'confirmed'
              });
          }

          set({ 
            balances: updatedBalances, 
            totalBalance,
            loading: false 
          });

          // Refresh transaction history
          await get().getTransactionHistory();

        } catch (error) {
          set({ error: 'Failed to deposit funds', loading: false });
          console.error('Deposit error:', error);
        }
      },

      withdraw: async (amount: number, token: string, address: string) => {
        set({ loading: true, error: null });
        try {
          const { balances, userId } = get();
          const balance = balances.find(b => b.token === token);
          
          if (!balance || balance.amount < amount) {
            throw new Error('Insufficient balance');
          }

          const updatedBalances = balances.map(b =>
            b.token === token
              ? { 
                  ...b, 
                  amount: b.amount - amount,
                  value: (b.amount - amount) * b.price
                }
              : b
          );

          const totalBalance = updatedBalances.reduce((sum, balance) => sum + balance.value, 0);
          
          // Update database
          if (userId) {
            const wallets = await db.getWallets(userId);
            if (wallets.length > 0) {
              const primaryWallet = wallets.find(w => w.is_primary) || wallets[0];
              const newBalanceCache = { ...primaryWallet.balance_cache as Record<string, number> };
              newBalanceCache[token] = Math.max(0, newBalanceCache[token] - amount);

              await db.supabase
                .from('wallets')
                .update({ balance_cache: newBalanceCache })
                .eq('id', primaryWallet.id);

              // Record transaction
              await db.supabase
                .from('transactions')
                .insert({
                  user_id: userId,
                  wallet_id: primaryWallet.id,
                  transaction_type: 'withdrawal',
                  symbol: token,
                  quantity: amount,
                  total_amount: amount * balance.price,
                  status: 'pending'
                });
            }
          }

          set({ balances: updatedBalances, totalBalance, loading: false });
          await get().getTransactionHistory();

        } catch (error) {
          set({ error: 'Failed to withdraw funds', loading: false });
          console.error('Withdraw error:', error);
        }
      },

      transferToAgent: async (agentId: string, amount: number, token: string) => {
        try {
          const { balances, userId } = get();
          const balance = balances.find(b => b.token === token);
          
          if (!balance || balance.amount < amount) {
            throw new Error('Insufficient balance');
          }

          // Update wallet balance
          const updatedBalances = balances.map(b =>
            b.token === token
              ? { 
                  ...b, 
                  amount: b.amount - amount,
                  value: (b.amount - amount) * b.price
                }
              : b
          );

          const totalBalance = updatedBalances.reduce((sum, balance) => sum + balance.value, 0);
          
          // Update database
          if (userId) {
            const wallets = await db.getWallets(userId);
            if (wallets.length > 0) {
              const primaryWallet = wallets.find(w => w.is_primary) || wallets[0];
              
              // Update wallet balance cache
              const newBalanceCache = { ...primaryWallet.balance_cache as Record<string, number> };
              newBalanceCache[token] = Math.max(0, newBalanceCache[token] - amount);

              await db.supabase
                .from('wallets')
                .update({ balance_cache: newBalanceCache })
                .eq('id', primaryWallet.id);

              // Update agent balance
              const agent = await db.supabase
                .from('agents')
                .select('current_balance')
                .eq('id', agentId)
                .single();

              if (agent.data) {
                await db.supabase
                  .from('agents')
                  .update({ 
                    current_balance: (agent.data.current_balance || 0) + (amount * balance.price),
                    allocated_balance: (agent.data.current_balance || 0) + (amount * balance.price)
                  })
                  .eq('id', agentId);
              }

              // Record transaction
              await db.supabase
                .from('transactions')
                .insert({
                  user_id: userId,
                  wallet_id: primaryWallet.id,
                  transaction_type: 'transfer',
                  symbol: token,
                  quantity: amount,
                  total_amount: amount * balance.price,
                  status: 'confirmed',
                  agent_id: agentId
                });
            }
          }

          set({ balances: updatedBalances, totalBalance });
          await get().getTransactionHistory();

        } catch (error) {
          console.error('Transfer to agent error:', error);
          throw error;
        }
      },

      transferToFarm: async (farmId: string, amount: number, token: string) => {
        try {
          const { balances, userId } = get();
          const balance = balances.find(b => b.token === token);
          
          if (!balance || balance.amount < amount) {
            throw new Error('Insufficient balance');
          }

          // Similar to transferToAgent but for farms
          const updatedBalances = balances.map(b =>
            b.token === token
              ? { 
                  ...b, 
                  amount: b.amount - amount,
                  value: (b.amount - amount) * b.price
                }
              : b
          );

          const totalBalance = updatedBalances.reduce((sum, balance) => sum + balance.value, 0);
          
          if (userId) {
            const wallets = await db.getWallets(userId);
            if (wallets.length > 0) {
              const primaryWallet = wallets.find(w => w.is_primary) || wallets[0];
              
              // Update wallet and farm balances in database
              const newBalanceCache = { ...primaryWallet.balance_cache as Record<string, number> };
              newBalanceCache[token] = Math.max(0, newBalanceCache[token] - amount);

              await db.supabase
                .from('wallets')
                .update({ balance_cache: newBalanceCache })
                .eq('id', primaryWallet.id);

              // Update farm balance
              const farm = await db.supabase
                .from('farms')
                .select('total_allocated, current_value')
                .eq('id', farmId)
                .single();

              if (farm.data) {
                await db.supabase
                  .from('farms')
                  .update({ 
                    total_allocated: (farm.data.total_allocated || 0) + (amount * balance.price),
                    current_value: (farm.data.current_value || 0) + (amount * balance.price)
                  })
                  .eq('id', farmId);
              }

              // Record transaction
              await db.supabase
                .from('transactions')
                .insert({
                  user_id: userId,
                  wallet_id: primaryWallet.id,
                  transaction_type: 'transfer',
                  symbol: token,
                  quantity: amount,
                  total_amount: amount * balance.price,
                  status: 'confirmed',
                  farm_id: farmId
                });
            }
          }

          set({ balances: updatedBalances, totalBalance });
          await get().getTransactionHistory();

        } catch (error) {
          console.error('Transfer to farm error:', error);
          throw error;
        }
      },

      getTransactionHistory: async () => {
        try {
          const { userId } = get();
          if (!userId) return;

          const transactions = await db.getTransactions(userId, 50);
          
          const formattedTransactions: Transaction[] = transactions.map(tx => ({
            id: tx.id,
            type: tx.transaction_type as any,
            amount: tx.quantity,
            token: tx.symbol.split('/')[0],
            hash: tx.transaction_hash || undefined,
            status: tx.status === 'confirmed' ? 'confirmed' : tx.status === 'failed' ? 'failed' : 'pending',
            timestamp: tx.created_at,
            agentId: tx.agent_id || undefined,
            farmId: tx.farm_id || undefined
          }));

          set({ transactions: formattedTransactions });
        } catch (error) {
          console.error('Get transaction history error:', error);
        }
      },

      refreshPrices: async () => {
        try {
          const { balances } = get();
          
          // Get current market prices from database
          const marketData = await db.getMarketData();
          const priceMap = new Map<string, number>();
          marketData.forEach(data => {
            const symbol = data.symbol.split('/')[0];
            priceMap.set(symbol, data.price);
          });

          const updatedBalances = balances.map(balance => {
            const newPrice = priceMap.get(balance.token) || balance.price;
            return {
              ...balance,
              price: newPrice,
              value: balance.amount * newPrice
            };
          });

          const totalBalance = updatedBalances.reduce((sum, balance) => sum + balance.value, 0);
          set({ balances: updatedBalances, totalBalance, loading: false });

        } catch (error) {
          console.error('Refresh prices error:', error);
        }
      }
    }),
    {
      name: 'wallet-store',
      partialize: (state) => ({
        totalBalance: state.totalBalance,
        balances: state.balances,
        transactions: state.transactions,
        isConnected: state.isConnected,
        address: state.address,
        userId: state.userId
      })
    }
  )
);