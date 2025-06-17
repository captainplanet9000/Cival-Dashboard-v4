'use client';

import React from 'react';
import { X, Play, Pause, Square, Settings } from 'lucide-react';
import { Farm } from '@/lib/store/farmStore';

interface FarmDetailsPanelProps {
  farm: Farm;
  isOpen: boolean;
  onClose: () => void;
}

const FarmDetailsPanel: React.FC<FarmDetailsPanelProps> = ({ farm, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">{farm.name}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-4">
            <p className="text-gray-600 mb-4">{farm.description}</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Current Value</p>
                  <p className="text-lg font-semibold">${farm.currentValue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total P&L</p>
                  <p className={`text-lg font-semibold ${farm.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {farm.totalPnL >= 0 ? '+' : ''}${farm.totalPnL.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Assigned Agents</p>
                <p className="text-base">{farm.assignedAgents.length} agents assigned</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Strategy</p>
                <p className="text-base capitalize">{farm.strategy}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Performance</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span>Win Rate: {farm.performanceMetrics.winRate?.toFixed(1) || '0.0'}%</span>
                  <span>Total Trades: {farm.performanceMetrics.totalTrades || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Close
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">
              <Settings className="w-4 h-4 mr-2 inline" />
              Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmDetailsPanel;