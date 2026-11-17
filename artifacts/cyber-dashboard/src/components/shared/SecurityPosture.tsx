import { LoadingSkeleton } from './LoadingSkeleton';

interface PostureData {
  activeThreats: number;
  criticalAlerts?: number;
  resolvedToday?: number;
  onlineDevices?: number;
  totalDevices: number;
}

export function SecurityPosture({ data, isLoading }: { data?: PostureData; isLoading: boolean }) {
  if (isLoading) return <LoadingSkeleton className="h-40 w-full" />;
  if (!data) return <p className="text-sm text-muted-foreground">Security posture data is unavailable.</p>;

  const metrics = [
    ['Open threats', data.activeThreats],
    ['Critical alerts', data.criticalAlerts ?? 'Unavailable'],
    ['Alerts resolved today (UTC)', data.resolvedToday ?? 'Unavailable'],
    ['Registered devices online', data.totalDevices ? `${data.onlineDevices ?? '—'} / ${data.totalDevices}` : 'No devices registered'],
  ];

  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {metrics.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-primary/10 bg-black/20 p-3">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="mt-1 font-mono font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
