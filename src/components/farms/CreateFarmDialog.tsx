'use client';

import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const farmSchema = z.object({
  name: z.string().min(1, 'Farm name is required').max(50, 'Name too long'),
  description: z.string().max(200, 'Description too long'),
  strategy: z.string().min(1, 'Strategy is required'),
  agents: z.array(z.string()).min(1, 'At least one agent is required'),
  maxRisk: z.number().min(1).max(20),
  targetReturn: z.number().min(5).max(100),
  rebalanceFrequency: z.string(),
  emergencyStop: z.boolean()
});

type FormData = z.infer<typeof farmSchema>;

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  balance: number;
}

interface CreateFarmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  availableAgents: Agent[];
}

const CreateFarmDialog: React.FC<CreateFarmDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableAgents
}) => {
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      name: '',
      description: '',
      strategy: 'momentum',
      agents: [],
      maxRisk: 5,
      targetReturn: 15,
      rebalanceFrequency: 'hourly',
      emergencyStop: true
    }
  });

  const strategies = [
    { value: 'momentum', label: 'Momentum Trading' },
    { value: 'arbitrage', label: 'Arbitrage' },
    { value: 'market-making', label: 'Market Making' },
    { value: 'grid', label: 'Grid Trading' },
    { value: 'scalping', label: 'Scalping' },
    { value: 'yield-farming', label: 'DeFi Yield Farming' },
    { value: 'cross-chain', label: 'Cross-Chain Arbitrage' },
    { value: 'custom', label: 'Custom Strategy' }
  ];

  const rebalanceOptions = [
    { value: 'real-time', label: 'Real-time' },
    { value: 'minute', label: 'Every Minute' },
    { value: 'hourly', label: 'Hourly' },
    { value: 'daily', label: 'Daily' },
    { value: 'manual', label: 'Manual Only' }
  ];

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const onFormSubmit = (data: FormData) => {
    const farmData = {
      ...data,
      agents: selectedAgents,
      settings: {
        maxRisk: data.maxRisk,
        targetReturn: data.targetReturn,
        rebalanceFrequency: data.rebalanceFrequency,
        emergencyStop: data.emergencyStop
      }
    };
    
    onSubmit(farmData);
    reset();
    setSelectedAgents([]);
  };

  const handleClose = () => {
    reset();
    setSelectedAgents([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle">
          <form onSubmit={handleSubmit(onFormSubmit)}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Create New Farm</h3>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-6 max-h-96 overflow-y-auto">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Basic Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Farm Name</label>
                  <input
                    {...register('name')}
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., High Frequency Traders"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Describe the farm's purpose and strategy..."
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Strategy</label>
                  <select
                    {...register('strategy')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {strategies.map(strategy => (
                      <option key={strategy.value} value={strategy.value}>
                        {strategy.label}
                      </option>
                    ))}
                  </select>
                  {errors.strategy && <p className="mt-1 text-sm text-red-600">{errors.strategy.message}</p>}
                </div>
              </div>

              {/* Agent Selection */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Select Agents</h4>
                <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
                  {availableAgents.map(agent => (
                    <div
                      key={agent.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedAgents.includes(agent.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleAgentToggle(agent.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedAgents.includes(agent.id)}
                          onChange={() => handleAgentToggle(agent.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{agent.type} • ${agent.balance.toLocaleString()}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        agent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                  ))}
                </div>
                {selectedAgents.length === 0 && (
                  <p className="text-sm text-red-600">Please select at least one agent</p>
                )}
              </div>

              {/* Risk Management */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Risk Management</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Risk (%)</label>
                    <input
                      {...register('maxRisk', { valueAsNumber: true })}
                      type="number"
                      min="1"
                      max="20"
                      step="0.1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.maxRisk && <p className="mt-1 text-sm text-red-600">{errors.maxRisk.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Target Return (%)</label>
                    <input
                      {...register('targetReturn', { valueAsNumber: true })}
                      type="number"
                      min="5"
                      max="100"
                      step="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.targetReturn && <p className="mt-1 text-sm text-red-600">{errors.targetReturn.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Rebalance Frequency</label>
                  <select
                    {...register('rebalanceFrequency')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {rebalanceOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.rebalanceFrequency && <p className="mt-1 text-sm text-red-600">{errors.rebalanceFrequency.message}</p>}
                </div>

                <div className="flex items-center">
                  <input
                    {...register('emergencyStop')}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Enable emergency stop (recommended)
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedAgents.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Farm
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateFarmDialog;