'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Settings, TrendingUp, Activity, Zap, RefreshCw, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useFarmStore } from '@/lib/store/farmStore';
import { useAgentStore } from '@/lib/store/agentStore';
import FarmCard from './FarmCard';
import CreateFarmDialog from './CreateFarmDialog';
import FarmDetailsPanel from './FarmDetailsPanel';

import { Farm } from '@/lib/store/farmStore';

const FarmsManager: React.FC = () => {
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'paused'>('all');
  
  const { farms, loading, initialize: initializeFarms, createFarm } = useFarmStore();
  const { agents, initialize: initializeAgents } = useAgentStore();

  useEffect(() => {
    const initializeStores = async () => {
      try {
        await Promise.all([
          initializeFarms(),
          initializeAgents()
        ]);
      } catch (error) {
        console.error('Failed to initialize farm stores:', error);
        toast.error('Failed to load farm data');
      }
    };
    
    initializeStores();
  }, [initializeFarms, initializeAgents]);

  const filteredFarms = farms.filter(farm => {
    const matchesSearch = farm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         farm.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || farm.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateFarm = async (farmData: Partial<Farm>) => {
    try {
      await createFarm(farmData);
      setShowCreateDialog(false);
      toast.success('Farm created successfully!');
    } catch (error) {
      toast.error('Failed to create farm');
      console.error('Create farm error:', error);
    }
  };

  const totalValue = farms.reduce((sum, farm) => sum + farm.currentValue, 0);
  const activeFarms = farms.filter(farm => farm.status === 'active').length;
  const totalAgents = farms.reduce((sum, farm) => sum + farm.assignedAgents.length, 0);
  const avgPnl = farms.length > 0 ? farms.reduce((sum, farm) => sum + (farm.currentValue > 0 ? (farm.totalPnL / farm.currentValue) * 100 : 0), 0) / farms.length : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading farms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="w-7 h-7 text-blue-600 mr-3" />
            Agent Farms
          </h1>
          <p className="text-gray-600 mt-1">
            Organize and manage groups of trading agents for coordinated strategies
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Farm</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalValue.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Farms</p>
              <p className="text-2xl font-bold text-gray-900">{activeFarms}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Agents</p>
              <p className="text-2xl font-bold text-gray-900">{totalAgents}</p>
            </div>
            <Zap className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg P&L</p>
              <p className={`text-2xl font-bold ${avgPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {avgPnl >= 0 ? '+' : ''}{avgPnl.toFixed(2)}%
              </p>
            </div>
            <TrendingUp className={`w-8 h-8 ${avgPnl >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search farms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        <button
          onClick={() => {
            initializeFarms();
            initializeAgents();
          }}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Farms Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredFarms.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No farms found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first farm to start organizing your trading agents'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => setShowCreateDialog(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Farm
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFarms.map((farm) => (
              <FarmCard
                key={farm.id}
                farm={farm}
                onClick={() => setSelectedFarm(farm)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Farm Dialog */}
      {showCreateDialog && (
        <CreateFarmDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSubmit={handleCreateFarm}
          availableAgents={agents}
        />
      )}

      {/* Farm Details Panel */}
      {selectedFarm && (
        <FarmDetailsPanel
          farm={selectedFarm}
          isOpen={!!selectedFarm}
          onClose={() => setSelectedFarm(null)}
        />
      )}
    </div>
  );
};

export default FarmsManager;