import React from 'react';
import { useGetThreatHeatmap, useGetThreatTrends, useGetAttackDistribution, useGetDeviceHealth, useGetAnalyticsOverview } from '@workspace/api-client-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThreatHeatmap } from '@/components/charts/ThreatHeatmap';
import { ThreatTrendsChart } from '@/components/charts/ThreatTrendsChart';
import { AttackDistributionChart } from '@/components/charts/AttackDistributionChart';
import { DeviceHealthChart } from '@/components/charts/DeviceHealthChart';
import { SecurityPosture } from '@/components/shared/SecurityPosture';
import { Activity, AlertTriangle, ShieldCheck, Target, Radio, Globe } from 'lucide-react';

export default function AnalyticsPage() {
  const { data: heatmapData, isLoading: heatmapLoading, isError: heatmapError } = useGetThreatHeatmap();
  const { data: threatTrends, isLoading: trendsLoading, isError: trendsError } = useGetThreatTrends({ period: '30d' });
  const { data: attackDistribution, isLoading: attackLoading, isError: attackError } = useGetAttackDistribution();
  const { data: deviceHealth, isLoading: healthLoading, isError: healthError } = useGetDeviceHealth();
  const { data: overview, isLoading: scoreLoading, isError: scoreError } = useGetSecurityScore();

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Intelligence & Analytics</h1>
            <p className="text-muted-foreground mt-1">Deep dive into security telemetry and risk patterns.</p>
          </div>

        </div>

        {(heatmapError || trendsError || attackError || healthError || scoreError) && (
          <p role="alert" className="text-sm text-amber-400">Some analytics could not load. Refresh to try again.</p>
        )}

        {/* Row 1: Heatmap */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center">
              <Target className="w-5 h-5 mr-2 text-cyan-400" />
              Temporal Threat Distribution (7 Days)
            </h3>
          </div>
          <ThreatHeatmap data={heatmapData} isLoading={heatmapLoading} />
        </div>

        {/* Row 2: Trends and Risk */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-red-400" />
              Threat Velocity
            </h3>
            <ThreatTrendsChart data={threatTrends} isLoading={trendsLoading} />
          </div>
          
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-400" />
              Attack Distribution
            </h3>
            <AttackDistributionChart data={attackDistribution} isLoading={attackLoading} />
          </div>
        </div>

        {/* Row 3: Network and Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center">
                <Globe className="w-5 h-5 mr-2 text-blue-400" />
                Network Throughput
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">No network collector connected. Traffic measurements are unavailable.</p>
          </div>
          
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center">
              <Radio className="w-5 h-5 mr-2 text-green-400" />
              Endpoint Fleet Health
            </h3>
            <DeviceHealthChart data={deviceHealth} isLoading={healthLoading} />
          </div>
        </div>

        {/* Row 4: Security Posture Deep Dive */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center border-b border-primary/10 pb-4">
            <ShieldCheck className="w-5 h-5 mr-2 text-primary" />
            Security Posture Breakdown
          </h3>
          
          <SecurityPosture data={overview} isLoading={scoreLoading} />
        </div>
      </div>
    </AppLayout>
  );
}