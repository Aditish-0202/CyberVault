import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'warning' | 'critical' | 'operational' | 'degraded' | 'down' | 'maintenance' | string;
  className?: string;
}

const statusConfig: Record<string, { color: string; text: string; bg: string }> = {
  online: { color: 'bg-green-500', text: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' },
  operational: { color: 'bg-green-500', text: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' },
  warning: { color: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  degraded: { color: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  critical: { color: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
  down: { color: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
  offline: { color: 'bg-gray-500', text: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' },
  maintenance: { color: 'bg-blue-500', text: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status.toLowerCase()] || statusConfig.offline;
  
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border", config.bg, config.text, className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]", config.color)}></span>
      <span className="capitalize">{status}</span>
    </span>
  );
};