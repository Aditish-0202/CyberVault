import React from 'react';
import { cn } from '@/lib/utils';

interface SeverityBadgeProps {
  severity: 'critical' | 'high' | 'medium' | 'low' | string;
  className?: string;
}

const severityConfig: Record<string, { color: string; text: string; border: string; bg: string }> = {
  critical: { color: 'bg-red-500', text: 'text-red-500', border: 'border-red-500/30', bg: 'bg-red-500/10' },
  high: { color: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
  medium: { color: 'bg-yellow-500', text: 'text-yellow-500', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10' },
  low: { color: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
};

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className }) => {
  const config = severityConfig[severity.toLowerCase()] || severityConfig.low;
  
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border", config.bg, config.text, config.border, className)}>
      <span className="uppercase tracking-wider">{severity}</span>
    </span>
  );
};