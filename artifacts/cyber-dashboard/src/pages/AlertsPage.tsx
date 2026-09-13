import React, { useState } from 'react';
import { useListAlerts, useResolveAlert, Alert } from '@workspace/api-client-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ShieldAlert, Crosshair, MapPin, Clock, Search, Filter, CheckCircle2, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AlertsPage() {
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const { toast } = useToast();

  const { data, isLoading, refetch } = useListAlerts({
    status: statusFilter as any || undefined,
    severity: severityFilter as any || undefined,
    limit: 50,
  });

  const resolveMutation = useResolveAlert({
    mutation: {
      onSuccess: () => {
        toast({ title: "Threat Neutralized", description: "Alert has been marked as resolved." });
        refetch();
      }
    }
  });

  const handleResolve = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    resolveMutation.mutate({ id });
  };

  const getBorderColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'border-red-500/50 shadow-[inset_4px_0_0_rgba(239,68,68,1)]';
      case 'high': return 'border-amber-500/50 shadow-[inset_4px_0_0_rgba(245,158,11,1)]';
      case 'medium': return 'border-yellow-500/50 shadow-[inset_4px_0_0_rgba(234,179,8,1)]';
      default: return 'border-blue-500/50 shadow-[inset_4px_0_0_rgba(59,130,246,1)]';
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Active Threats</h1>
            <p className="text-muted-foreground mt-1">Investigate and remediate security alerts.</p>
          </div>
        </div>

        {/* Severity Count Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Critical', count: data?.criticalCount || 0, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
            { label: 'High', count: data?.highCount || 0, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'Medium', count: data?.mediumCount || 0, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20' },
            { label: 'Low', count: data?.lowCount || 0, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
          ].map((stat, i) => (
            <div key={i} className={`glass-card p-4 flex items-center justify-between border ${stat.bg} cursor-pointer hover:-translate-y-1 transition-transform`} onClick={() => setSeverityFilter(severityFilter === stat.label.toLowerCase() ? '' : stat.label.toLowerCase())}>
              <span className="font-bold uppercase tracking-wider text-sm">{stat.label}</span>
              <span className={`text-2xl font-black font-mono ${stat.color}`}>{stat.count}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center bg-black/20 p-4 rounded-xl border border-primary/10">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Filters:</span>
          </div>
          
          <div className="flex gap-2">
            {['open', 'acknowledged', 'resolved'].map(status => (
              <button 
                key={status}
                onClick={() => setStatusFilter(status === statusFilter ? '' : status)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-bold uppercase transition-colors border",
                  statusFilter === status 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-black/40 text-muted-foreground border-primary/20 hover:border-primary/50"
                )}
              >
                {status}
              </button>
            ))}
          </div>
          
          {severityFilter && (
            <div className="ml-auto">
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded border border-primary/30 flex items-center">
                Severity: {severityFilter}
                <button onClick={() => setSeverityFilter('')} className="ml-2 hover:text-white">&times;</button>
              </span>
            </div>
          )}
        </div>

        {/* Alerts Grid */}
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <LoadingSkeleton key={i} className="h-32 w-full" />)
          ) : data?.data && data.data.length > 0 ? (
            data.data.map((alert) => (
              <div 
                key={alert.id} 
                className={cn(
                  "glass-card p-0 overflow-hidden flex flex-col md:flex-row group hover:border-primary/30 transition-colors",
                  getBorderColor(alert.severity)
                )}
              >
                <div className="flex-1 p-5 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <SeverityBadge severity={alert.severity} />
                    <span className="text-xs font-mono text-muted-foreground flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                    </span>
                    {alert.status === 'resolved' && (
                      <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> RESOLVED
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">{alert.title}</h3>
                  {alert.description && <p className="text-sm text-muted-foreground line-clamp-1 mb-3">{alert.description}</p>}
                  
                  <div className="flex flex-wrap gap-x-6 gap-y-2 mt-auto">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                      <span className="font-mono">{alert.sourceIp || 'Unknown'} <span className="text-primary mx-1">→</span> {alert.targetIp || alert.deviceName || 'Network'}</span>
                    </div>
                    {alert.attackType && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <ShieldAlert className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                        <span>{alert.attackType}</span>
                      </div>
                    )}
                    {alert.mitreTactic && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Crosshair className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                        <span className="font-mono bg-black/40 px-1.5 rounded">{alert.mitreTactic}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="md:w-48 bg-black/20 p-5 border-t md:border-t-0 md:border-l border-primary/10 flex flex-row md:flex-col justify-end md:justify-center items-center gap-3">
                  {alert.status !== 'resolved' && (
                    <button 
                      onClick={(e) => handleResolve(alert.id, e)}
                      disabled={resolveMutation.isPending}
                      className="w-full py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 rounded-lg text-xs font-bold transition-colors flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      RESOLVE
                    </button>
                  )}
                  <button className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg text-xs font-bold transition-colors flex items-center justify-center">
                    DETAILS
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
              <ShieldAlert className="w-16 h-16 text-muted-foreground opacity-20 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Threats Detected</h3>
              <p className="text-muted-foreground">The current filter criteria yielded zero results.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}