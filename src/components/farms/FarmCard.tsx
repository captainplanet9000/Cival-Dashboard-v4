'use client';

import React from 'react';
import { Users, TrendingUp, Activity, Play, Pause, Square } from 'lucide-react';
import { useFarmStore } from '@/lib/store/farmStore';
import { useAgentStore } from '@/lib/store/agentStore';

interface Farm {
  id: string;
  name: string;
  description: string;
  assignedAgents: Array<{
    id: string;
    agentId: string;
    agentName: string;
    allocationPercentage: number;
    role: string;
    assignedAt: string;
    agentStatus?: string;
  }>;
  strategy: string;
  status: 'active' | 'inactive' | 'paused' | 'optimizing';
  currentValue: number;
  totalPnL: number;
  performanceMetrics: {
    totalTrades?: number;
    winRate?: number;
    avgReturn?: number;
    maxDrawdown?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface FarmCardProps {
  farm: Farm;
  onClick: () => void;
}

const FarmCard: React.FC<FarmCardProps> = ({ farm, onClick }) => {
  const { updateFarm } = useFarmStore();
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
        await updateFarm(farm.id, { status: 'paused' });
        break;
      case 'paused':
        await updateFarm(farm.id, { status: 'active' });
        break;
      case 'inactive':
        await updateFarm(farm.id, { status: 'active' });
        break;
    }
  };

  const farmAgents = agents.filter(agent => 
    farm.assignedAgents.some(fa => fa.agentId === agent.id)
  );
  const activeAgents = farm.assignedAgents.filter(fa => fa.agentStatus === 'active').length;

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
          <span>{activeAgents}/{farm.assignedAgents.length}</span>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Current Value</span>
          <span className="text-lg font-semibold text-gray-900">
            ${farm.currentValue.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total P&L</span>
          <div className="text-right">
            <div className={`text-sm font-medium ${farm.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {farm.totalPnL >= 0 ? '+' : ''}${farm.totalPnL.toLocaleString()}
            </div>
            <div className={`text-xs ${farm.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {farm.currentValue > 0 ? `${((farm.totalPnL / farm.currentValue) * 100).toFixed(2)}%` : '0.00%'}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Win Rate</span>
          <span className="text-sm font-medium text-gray-900">
            {farm.performanceMetrics.winRate?.toFixed(1) || '0.0'}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Trades</span>
          <span className="text-sm font-medium text-gray-900">
            {farm.performanceMetrics.totalTrades?.toLocaleString() || '0'}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Created {new Date(farm.createdAt).toLocaleDateString()}</span>
          <span>
            Updated {new Date(farm.updatedAt).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FarmCard;