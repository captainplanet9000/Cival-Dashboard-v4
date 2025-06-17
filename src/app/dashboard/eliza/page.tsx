'use client';

import { ElizaTerminal } from '@/components/eliza/ElizaTerminal';

export default function ElizaPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Eliza AI Assistant</h1>
        <p className="text-muted-foreground">
          Natural language interface for trading platform control and automation
        </p>
      </div>

      {/* Terminal Interface */}
      <div className="h-[calc(100vh-200px)]">
        <ElizaTerminal />
      </div>
    </div>
  );
}