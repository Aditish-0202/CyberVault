import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { RiskItem } from '@workspace/api-client-react';

interface RiskAnalysisChartProps {
  data?: RiskItem[];
  isLoading?: boolean;
}

export const RiskAnalysisChart: React.FC<RiskAnalysisChartProps> = ({ data, isLoading }) => {
  if (isLoading || !data) {
    return <div className="w-full h-[300px] flex items-center justify-center bg-black/20 rounded-xl border border-primary/10 animate-pulse" />;
  }

  // Fallback data
  const chartData = data.length > 0 ? data : [
    { category: 'External Threats', score: 85, impact: 'High', likelihood: 'High' },
    { category: 'Data Exfiltration', score: 72, impact: 'Critical', likelihood: 'Medium' },
    { category: 'Insider Threat', score: 45, impact: 'High', likelihood: 'Low' },
    { category: 'Compliance', score: 30, impact: 'Medium', likelihood: 'Low' },
    { category: 'Physical Sec', score: 15, impact: 'Low', likelihood: 'Low' },
  ].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={true} vertical={false} />
          <XAxis type="number" domain={[0, 100]} stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis dataKey="category" type="category" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} width={100} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', borderRadius: '8px' }}
            itemStyle={{ color: '#F9FAFB' }}
            cursor={{ fill: '#1E293B', opacity: 0.4 }}
            formatter={(value: number, name: string, props: any) => [
              `${value}/100 (Impact: ${props.payload.impact})`, 
              'Risk Score'
            ]}
          />
          <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
            {chartData.map((entry, index) => {
              let fill = '#22C55E';
              if (entry.score >= 75) fill = '#EF4444';
              else if (entry.score >= 50) fill = '#F59E0B';
              else if (entry.score >= 25) fill = '#EAB308';
              return <Cell key={`cell-${index}`} fill={fill} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};