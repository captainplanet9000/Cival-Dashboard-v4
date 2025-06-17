import React from 'react';
import FarmsManager from '@/components/farms/FarmsManager';

export default function FarmsPage() {
  return (
    <div className="w-full h-full">
      <FarmsManager />
    </div>
  );
}

export const metadata = {
  title: 'Agent Farms - Cival Dashboard',
  description: 'Manage and organize trading agent groups for coordinated strategies',
};