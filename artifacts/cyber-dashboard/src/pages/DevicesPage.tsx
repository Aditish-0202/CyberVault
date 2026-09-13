import React, { useState } from 'react';
import { useListDevices, Device } from '@workspace/api-client-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Monitor, Server, Smartphone, Laptop, Cpu, HardDrive } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function DevicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('lastSeen');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading } = useListDevices({
    search: debouncedSearch,
    page,
    limit: 15,
    sortBy,
    sortOrder: sortOrder as any,
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'server': return <Server className="w-5 h-5 text-cyan-500" />;
      case 'workstation': return <Monitor className="w-5 h-5 text-blue-500" />;
      case 'laptop': return <Laptop className="w-5 h-5 text-indigo-500" />;
      case 'mobile': return <Smartphone className="w-5 h-5 text-purple-500" />;
      default: return <Monitor className="w-5 h-5 text-gray-500" />;
    }
  };

  const ProgressBar = ({ value, label }: { value?: number, label: string }) => {
    if (value === undefined) return <span className="text-muted-foreground">-</span>;
    const colorClass = value > 90 ? 'bg-red-500' : value > 75 ? 'bg-amber-500' : 'bg-green-500';
    return (
      <div className="w-full flex items-center gap-2">
        <div className="w-16 text-right text-xs font-mono">{value}%</div>
        <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
          <div className={`h-full ${colorClass}`} style={{ width: `${value}%` }} />
        </div>
      </div>
    );
  };

  const columns = [
    {
      header: 'Device',
      sortKey: 'name',
      sortable: true,
      className: 'w-[250px]',
      accessor: (row: Device) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-black/20 border border-primary/10">
            {getDeviceIcon(row.type)}
          </div>
          <div>
            <p className="font-bold text-white">{row.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{row.ipAddress}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      sortKey: 'status',
      sortable: true,
      accessor: (row: Device) => <StatusBadge status={row.status} />
    },
    {
      header: 'OS',
      accessor: (row: Device) => <span className="text-muted-foreground">{row.os || 'Unknown'}</span>
    },
    {
      header: 'Resources',
      className: 'w-[200px]',
      accessor: (row: Device) => (
        <div className="space-y-1 w-full max-w-[150px]">
          <ProgressBar value={row.cpuUsage} label="CPU" />
          <ProgressBar value={row.memoryUsage} label="MEM" />
        </div>
      )
    },
    {
      header: 'Risk Score',
      sortKey: 'riskScore',
      sortable: true,
      accessor: (row: Device) => {
        const score = row.riskScore || 0;
        const colorClass = score > 80 ? 'text-red-500' : score > 50 ? 'text-amber-500' : 'text-green-500';
        return (
          <div className="flex items-center gap-2">
            <span className={`font-mono font-bold ${colorClass}`}>{score}</span>
            {row.openAlerts ? (
              <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 text-[10px] font-bold border border-red-500/20">
                {row.openAlerts} ALERTS
              </span>
            ) : null}
          </div>
        );
      }
    },
    {
      header: 'Last Seen',
      sortKey: 'lastSeen',
      sortable: true,
      accessor: (row: Device) => (
        <span className="text-muted-foreground font-mono text-xs">
          {formatDistanceToNow(new Date(row.lastSeen), { addSuffix: true })}
        </span>
      )
    }
  ];

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Endpoint Fleet</h1>
            <p className="text-muted-foreground mt-1">Manage and monitor all connected devices.</p>
          </div>
          <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            Register Device
          </button>
        </div>

        <div className="flex-1 min-h-0">
          <DataTable
            data={data?.data || []}
            columns={columns}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search IP, hostname, or OS..."
            page={page}
            totalPages={data?.totalPages || 1}
            onPageChange={setPage}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onRowClick={(row) => console.log('Row clicked', row)}
          />
        </div>
      </div>
    </AppLayout>
  );
}
