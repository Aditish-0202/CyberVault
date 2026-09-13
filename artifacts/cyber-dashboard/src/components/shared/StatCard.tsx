import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowDownIcon, ArrowUpIcon, LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  className?: string;
  alert?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, trendLabel, className, alert }) => {
  return (
    <div className={cn("glass-card p-6 relative overflow-hidden group", className, alert && "border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]")}>
      {alert && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl -z-10 rounded-full" />
      )}
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <h3 className={cn("text-3xl font-bold mt-2 font-mono tracking-tight", alert ? "text-red-400" : "text-foreground")}>{value}</h3>
        </div>
        <div className={cn("p-3 rounded-xl bg-primary/10 border border-primary/20 transition-transform group-hover:scale-110", alert && "bg-red-500/10 border-red-500/20 text-red-500")}>
          <Icon className={cn("w-6 h-6", alert ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]")} />
        </div>
      </div>
      
      {trend !== undefined && (
        <div className="mt-4 flex items-center text-sm relative z-10">
          <span className={cn("flex items-center font-bold px-2 py-0.5 rounded", trend >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400")}>
            {trend >= 0 ? <ArrowUpIcon className="w-3.5 h-3.5 mr-1" /> : <ArrowDownIcon className="w-3.5 h-3.5 mr-1" />}
            {Math.abs(trend)}%
          </span>
          {trendLabel && <span className="text-muted-foreground ml-3 text-xs">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
};