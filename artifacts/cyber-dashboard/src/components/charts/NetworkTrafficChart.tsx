import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TimeSeriesPoint } from '@workspace/api-client-react';

interface NetworkTrafficChartProps {
  data?: TimeSeriesPoint[];
  isLoading?: boolean;
}

export const NetworkTrafficChart: React.FC<NetworkTrafficChartProps> = ({ data, isLoading }) => {
  if (isLoading || !data) {
    return <div className="w-full h-[300px] flex items-center justify-center bg-black/20 rounded-xl border border-primary/10 animate-pulse" />;
  }

  // Fallback data if none provided
  const chartData = data.length > 0 ? data : Array.from({ length: 24 }).map((_, i) => ({
    time: `${i}:00`,
    inbound: Math.floor(Math.random() * 500) + 100,
    outbound: Math.floor(Math.random() * 300) + 50,
  }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="#64748B" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => {
              if (val.includes('T')) {
                const date = new Date(val);
                return `${date.getHours()}:00`;
              }
              return val;
            }}
          />
          <YAxis 
            stroke="#64748B" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}mb`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', borderRadius: '8px' }}
            itemStyle={{ color: '#F9FAFB' }}
            labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
          />
          <Area 
            type="monotone" 
            dataKey="inbound" 
            name="Inbound Traffic"
            stroke="#3B82F6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorInbound)" 
          />
          <Area 
            type="monotone" 
            dataKey="outbound" 
            name="Outbound Traffic"
            stroke="#06B6D4" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorOutbound)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};