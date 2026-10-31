import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { MonthlyTrendData } from '../../../types/dashboard';

interface InstallationTrendChartProps {
  data: MonthlyTrendData[];
}

export const InstallationTrendChart: React.FC<InstallationTrendChartProps> = ({ data }) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>Rooftop Installation Velocity</CardTitle>
          <CardDescription>
            Target vs Completed Installations across residential and commercial sites
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-[300px] pt-4">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fontSize: 12, fill: '#64748b' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
              domain={[0, 45]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-navy-950 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-navy-800">
                      <p className="font-bold text-amber-400">{label} Performance</p>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-300">Planned:</span>
                        <span className="font-semibold">{payload[0]?.value} sites</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-300">Completed:</span>
                        <span className="font-semibold text-solar-400">{payload[1]?.value} sites</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', paddingBottom: '16px' }}
            />
            <Bar
              dataKey="planned"
              name="Planned Installations"
              fill="#94a3b8"
              radius={[4, 4, 0, 0]}
              barSize={18}
            />
            <Bar
              dataKey="completed"
              name="Completed Sites"
              fill="#166534"
              radius={[4, 4, 0, 0]}
              barSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
