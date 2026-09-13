import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGetAnalyticsOverview, useGetNetworkTraffic, useGetAttackDistribution, useGetThreatTrends, useGetSecurityScore, useListAlerts, useListActivities, useGetSystemStatus } from '@workspace/api-client-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/shared/StatCard';
import { LoadingSkeleton, CardSkeleton } from '@/components/shared/LoadingSkeleton';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { NetworkTrafficChart } from '@/components/charts/NetworkTrafficChart';
import { AttackDistributionChart } from '@/components/charts/AttackDistributionChart';
import { ThreatTrendsChart } from '@/components/charts/ThreatTrendsChart';
import { SecurityScoreGauge } from '@/components/charts/SecurityScoreGauge';
import { Monitor, ShieldAlert, Users, Activity, Clock, Server, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { data: overview, isLoading: overviewLoading } = useGetAnalyticsOverview();
  const { data: networkTraffic, isLoading: networkLoading } = useGetNetworkTraffic({ period: '24h' });
  const { data: attackDist, isLoading: attackLoading } = useGetAttackDistribution();
  const { data: threatTrends, isLoading: threatsLoading } = useGetThreatTrends({ period: '30d' });
  const { data: securityScore, isLoading: scoreLoading } = useGetSecurityScore();
  const { data: recentAlerts, isLoading: alertsLoading } = useListAlerts({ limit: 5 });
  const { data: recentActivities, isLoading: activitiesLoading } = useListActivities({ limit: 8 });
  const { data: systemStatus, isLoading: systemLoading } = useGetSystemStatus();

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Command Center</h1>
            <p className="text-muted-foreground mt-1">Real-time threat monitoring and system status.</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {overviewLoading ? (
            Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          ) : (
            <>
              <StatCard 
                title="Total Devices" 
                value={overview?.totalDevices || 0} 
                icon={Monitor} 
                trend={overview?.devicesChange || 0} 
                trendLabel="vs last week"
              />
              <StatCard 
                title="Active Threats" 
                value={overview?.activeThreats || 0} 
                icon={ShieldAlert} 
                trend={overview?.threatsChange || 0}
                alert={(overview?.activeThreats || 0) > 0}
              />
              <StatCard 
                title="Security Score" 
                value={`${overview?.securityScore || 0}/100`} 
                icon={Activity} 
                trend={overview?.scoreChange || 0}
              />
              <StatCard 
                title="Active Users" 
                value={overview?.activeUsers || 0} 
                icon={Users} 
                trend={overview?.usersChange || 0}
              />
            </>
          )}
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-primary" />
                Network Traffic (24h)
              </h3>
              <NetworkTrafficChart data={networkTraffic} isLoading={networkLoading} />
            </div>
            
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-primary" />
                Attack Vector Distribution
              </h3>
              <AttackDistributionChart data={attackDist} isLoading={attackLoading} />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center">
                <ShieldAlert className="w-5 h-5 mr-2 text-primary" />
                Threat Trends (30d)
              </h3>
              <ThreatTrendsChart data={threatTrends} isLoading={threatsLoading} />
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center">
                <ShieldAlert className="w-5 h-5 mr-2 text-primary" />
                Overall Security Posture
              </h3>
              <SecurityScoreGauge data={securityScore} isLoading={scoreLoading} />
            </div>
          </div>
        </div>

        {/* Bottom Data Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Alerts */}
          <div className="glass-card p-6 flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Recent Alerts</h3>
              <span className="text-xs text-primary font-mono cursor-pointer hover:underline">View All</span>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {alertsLoading ? (
                Array.from({ length: 5 }).map((_, i) => <LoadingSkeleton key={i} className="h-16 w-full" />)
              ) : recentAlerts?.data && recentAlerts.data.length > 0 ? (
                recentAlerts.data.map(alert => (
                  <div key={alert.id} className="flex flex-col p-3 rounded-lg bg-black/20 border border-primary/5 hover:border-primary/20 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <SeverityBadge severity={alert.severity} />
                      <span className="text-xs text-muted-foreground flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-white truncate">{alert.title}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-1 truncate">{alert.sourceIp} → {alert.targetIp || alert.deviceName}</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ShieldAlert className="w-8 h-8 opacity-20 mb-2" />
                  <p className="text-sm">No recent alerts</p>
                </div>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="glass-card p-6 flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Activity Feed</h3>
            </div>
            <div className="flex-1 overflow-y-auto pr-2">
              {activitiesLoading ? (
                Array.from({ length: 5 }).map((_, i) => <LoadingSkeleton key={i} className="h-12 w-full mb-4" />)
              ) : recentActivities && recentActivities.length > 0 ? (
                <div className="relative border-l border-primary/20 ml-3 pl-4 space-y-6">
                  {recentActivities.map(activity => (
                    <div key={activity.id} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-[#111827]"></div>
                      <p className="text-sm text-white">{activity.message}</p>
                      <div className="flex items-center mt-1 text-xs text-muted-foreground">
                        <span className="font-mono">{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                        {activity.userName && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{activity.userName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Activity className="w-8 h-8 opacity-20 mb-2" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* System Status */}
          <div className="glass-card p-6 flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">System Status</h3>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {systemLoading ? (
                Array.from({ length: 5 }).map((_, i) => <LoadingSkeleton key={i} className="h-14 w-full" />)
              ) : systemStatus && systemStatus.length > 0 ? (
                systemStatus.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-primary/5">
                    <div className="flex items-center">
                      <Server className="w-4 h-4 text-muted-foreground mr-3" />
                      <div>
                        <p className="text-sm font-medium text-white">{service.name}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">Uptime: {service.uptime}%</p>
                      </div>
                    </div>
                    <StatusBadge status={service.status} />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Server className="w-8 h-8 opacity-20 mb-2" />
                  <p className="text-sm">Status unknown</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}