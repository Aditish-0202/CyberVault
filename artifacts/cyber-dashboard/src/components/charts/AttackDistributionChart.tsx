import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AttackDistributionItem } from '@workspace/api-client-react';

interface AttackDistributionChartProps {
  data?: AttackDistributionItem[];
  isLoading?: boolean;
}

const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#06B6D4', '#8B5CF6'];

export const AttackDistributionChart: React.FC<AttackDistributionChartProps> = ({ data, isLoading }) => {
  if (isLoading || !data) {
    return <div className="w-full h-[300px] flex items-center justify-center bg-black/20 rounded-xl border border-primary/10 animate-pulse" />;
  }

  // Fallback data
  const chartData = data.length > 0 ? data : [
    { type: 'Malware', count: 45, percentage: 35 },
    { type: 'Phishing', count: 32, percentage: 25 },
    { type: 'DDoS', count: 20, percentage: 15 },
    { type: 'Brute Force', count: 18, percentage: 14 },
    { type: 'SQL Injection', count: 14, percentage: 11 },
  ];

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={80}
            outerRadius={100}
            paddingAngle={5}
            dataKey="count"
            nameKey="type"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', borderRadius: '8px' }}
            itemStyle={{ color: '#F9FAFB' }}
            formatter={(value: number, name: string, props: any) => [`${value} incidents (${props.payload.percentage}%)`, name]}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};