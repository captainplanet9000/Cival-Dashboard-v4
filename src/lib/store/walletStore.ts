import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { backendApi } from '@/lib/api/backend-client';
import agUIProtocol from '@/lib/ag-ui-protocol-v2';

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

  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  loadBalance: () => Promise<void>;
  deposit: (amount: number, token: string) => Promise<void>;
  withdraw: (amount: number, token: string, address: string) => Promise<void>;
  transferToAgent: (agentId: string, amount: number, token: string) => Promise<void>;
  transferToFarm: (farmId: string, amount: number, token: string) => Promise<void>;
  getTransactionHistory: () => Promise<void>;
  refreshPrices: () => Promise<void>;
  
  // AG-UI Integration
  initializeAGUI: () => void;
  broadcastWalletUpdate: () => void;
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

      connectWallet: async () => {
        set({ loading: true, error: null });
        try {
          // Simulate wallet connection - replace with actual wallet integration
          const mockAddress = '0x742d35cc4bf78d7362c6b07a67dc15c3c1b47a99';
          
          // Initialize with some mock balances
          const mockBalances: WalletBalance[] = [
            {
              token: 'USDC',
              symbol: 'USDC',
              amount: 50.0, // Start with $50 as requested
              value: 50.0,
              price: 1.0
            },
            {
              token: 'ETH',
              symbol: 'ETH',
              amount: 0.02,
              value: 64.8,
              price: 3240.0
            },
            {
              token: 'BTC',
              symbol: 'BTC',
              amount: 0.001,
              value: 97.5,
              price: 97500.0
            }
          ];

          const totalBalance = mockBalances.reduce((sum, balance) => sum + balance.value, 0);

          set({
            isConnected: true,
            address: mockAddress,
            balances: mockBalances,
            totalBalance,
            loading: false
          });

          // Initialize AG-UI Protocol
          get().initializeAGUI();
          get().broadcastWalletUpdate();

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
        if (!get().isConnected) return;
        
        set({ loading: true, error: null });
        try {
          // In a real implementation, this would fetch from blockchain/API
          await get().refreshPrices();
          get().broadcastWalletUpdate();
        } catch (error) {
          set({ error: 'Failed to load balance', loading: false });
          console.error('Load balance error:', error);
        }
      },

      deposit: async (amount: number, token: string) => {
        set({ loading: true, error: null });
        try {
          const { balances } = get();
          const existingBalance = balances.find(b => b.token === token);
          
          if (existingBalance) {
            const updatedBalances = balances.map(balance =>
              balance.token === token
                ? { 
                    ...balance, 
                    amount: balance.amount + amount,
                    value: (balance.amount + amount) * balance.price
                  }
                : balance
            );
            
            const totalBalance = updatedBalances.reduce((sum, balance) => sum + balance.value, 0);
            set({ balances: updatedBalances, totalBalance });
          } else {
            // Add new token balance
            const price = token === 'USDC' ? 1.0 : token === 'ETH' ? 3240.0 : 97500.0;
            const newBalance: WalletBalance = {
              token,
              symbol: token,
              amount,
              value: amount * price,
              price
            };
            
            const updatedBalances = [...balances, newBalance];
            const totalBalance = updatedBalances.reduce((sum, balance) => sum + balance.value, 0);
            set({ balances: updatedBalances, totalBalance });
          }

          // Record transaction
          const transaction: Transaction = {
            id: `tx-${Date.now()}`,
            type: 'deposit',
            amount,
            token,
            status: 'confirmed',
            timestamp: new Date().toISOString(),
            to: get().address
          };

          set(state => ({
            transactions: [transaction, ...state.transactions],
            loading: false
          }));

          get().broadcastWalletUpdate();

        } catch (error) {
          set({ error: 'Failed to deposit funds', loading: false });
          console.error('Deposit error:', error);
        }
      },

      withdraw: async (amount: number, token: string, address: string) => {
        set({ loading: true, error: null });
        try {
          const { balances } = get();
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
          set({ balances: updatedBalances, totalBalance });

          // Record transaction
          const transaction: Transaction = {
            id: `tx-${Date.now()}`,
            type: 'withdrawal',
            amount,
            token,
            status: 'pending',
            timestamp: new Date().toISOString(),
            from: get().address,
            to: address
          };

          set(state => ({
            transactions: [transaction, ...state.transactions],
            loading: false
          }));

          get().broadcastWalletUpdate();

        } catch (error) {
          set({ error: 'Failed to withdraw funds', loading: false });
          console.error('Withdraw error:', error);
        }
      },

      transferToAgent: async (agentId: string, amount: number, token: string) => {
        try {
          const { balances } = get();
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
          set({ balances: updatedBalances, totalBalance });

          // Record transaction
          const transaction: Transaction = {
            id: `tx-${Date.now()}`,
            type: 'transfer',
            amount,
            token,
            status: 'confirmed',
            timestamp: new Date().toISOString(),
            from: get().address,
            agentId
          };

          set(state => ({
            transactions: [transaction, ...state.transactions]
          }));

          // Update agent balance through AG-UI
          try {
            await agUIProtocol.emit('agent_funding', {
              agentId,
              amount,
              token,
              transactionId: transaction.id
            });
          } catch (error) {
            console.error('AG-UI agent funding event error:', error);
          }

          get().broadcastWalletUpdate();

        } catch (error) {
          console.error('Transfer to agent error:', error);
          throw error;
        }
      },

      transferToFarm: async (farmId: string, amount: number, token: string) => {
        try {
          const { balances } = get();
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
          set({ balances: updatedBalances, totalBalance });

          // Record transaction
          const transaction: Transaction = {
            id: `tx-${Date.now()}`,
            type: 'transfer',
            amount,
            token,
            status: 'confirmed',
            timestamp: new Date().toISOString(),
            from: get().address,
            farmId
          };

          set(state => ({
            transactions: [transaction, ...state.transactions]
          }));

          // Update farm balance through AG-UI
          try {
            await agUIProtocol.emit('farm_funding', {
              farmId,
              amount,
              token,
              transactionId: transaction.id
            });
          } catch (error) {
            console.error('AG-UI farm funding event error:', error);
          }

          get().broadcastWalletUpdate();

        } catch (error) {
          console.error('Transfer to farm error:', error);
          throw error;
        }
      },

      getTransactionHistory: async () => {
        // Mock implementation - in real app, fetch from API/blockchain
        set({ loading: false });
      },

      refreshPrices: async () => {
        try {
          const { balances } = get();
          // Mock price updates - in real app, fetch from price API
          const priceUpdates = {
            USDC: 1.0,
            ETH: 3240.0 + (Math.random() - 0.5) * 100, // Simulate price movement
            BTC: 97500.0 + (Math.random() - 0.5) * 1000
          };

          const updatedBalances = balances.map(balance => ({
            ...balance,
            price: priceUpdates[balance.token as keyof typeof priceUpdates] || balance.price,
            value: balance.amount * (priceUpdates[balance.token as keyof typeof priceUpdates] || balance.price)
          }));

          const totalBalance = updatedBalances.reduce((sum, balance) => sum + balance.value, 0);
          set({ balances: updatedBalances, totalBalance, loading: false });

        } catch (error) {
          console.error('Refresh prices error:', error);
        }
      },

      initializeAGUI: () => {
        try {
          agUIProtocol.initializeAGUI();
        } catch (error) {
          console.error('AG-UI initialization error:', error);
        }
      },

      broadcastWalletUpdate: () => {
        try {
          const { totalBalance, balances, isConnected, address } = get();
          
          agUIProtocol.emit('wallet_update', {
            totalBalance,
            balances,
            isConnected,
            address,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Wallet broadcast error:', error);
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
        address: state.address
      })
    }
  )
);