'use client';

import React from 'react';
import { Users, TrendingUp, Activity, Play, Pause, Square } from 'lucide-react';
import { useFarmStore } from '@/lib/store/farmStore';
import { useAgentStore } from '@/lib/store/agentStore';

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
}

interface FarmCardProps {
  farm: Farm;
  onClick: () => void;
}

const FarmCard: React.FC<FarmCardProps> = ({ farm, onClick }) => {
  const { startFarm, stopFarm, pauseFarm } = useFarmStore();
  const { agents } = useAgentStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Activity className="w-3 h-3" />;
      case 'paused':
        return <Pause className="w-3 h-3" />;
      case 'inactive':
        return <Square className="w-3 h-3" />;
      default:
        return <Square className="w-3 h-3" />;
    }
  };

  const handleStatusToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    switch (farm.status) {
      case 'active':
        await pauseFarm(farm.id);
        break;
      case 'paused':
        await startFarm(farm.id);
        break;
      case 'inactive':
        await startFarm(farm.id);
        break;
    }
  };

  const farmAgents = agents.filter(agent => farm.agents.includes(agent.id));
  const activeAgents = farmAgents.filter(agent => agent.status === 'active').length;

  return (
    <div
      onClick={onClick}
      className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{farm.name}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{farm.description}</p>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(farm.status)}`}>
            {getStatusIcon(farm.status)}
            <span className="capitalize">{farm.status}</span>
          </span>
          
          <button
            onClick={handleStatusToggle}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title={farm.status === 'active' ? 'Pause farm' : 'Start farm'}
          >
            {farm.status === 'active' ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Strategy and Agents */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {farm.strategy}
          </span>
        </div>
        
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{activeAgents}/{farm.agents.length}</span>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Value</span>
          <span className="text-lg font-semibold text-gray-900">
            ${farm.totalValue.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">24h P&L</span>
          <div className="text-right">
            <div className={`text-sm font-medium ${farm.pnl24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {farm.pnl24h >= 0 ? '+' : ''}${farm.pnl24h.toLocaleString()}
            </div>
            <div className={`text-xs ${farm.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {farm.pnlPercent >= 0 ? '+' : ''}{farm.pnlPercent.toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Win Rate</span>
          <span className="text-sm font-medium text-gray-900">
            {farm.performance.winRate.toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Trades</span>
          <span className="text-sm font-medium text-gray-900">
            {farm.performance.totalTrades.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Created {new Date(farm.created).toLocaleDateString()}</span>
          <span>
            Last active {new Date(farm.lastActive).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FarmCard;