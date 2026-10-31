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
                    <div className="bg-white text-slate-900 p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-200 ring-1 ring-slate-900/5">
                      <p className="font-bold text-amber-600">{label} Performance</p>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Planned:</span>
                        <span className="font-semibold text-slate-800">{payload[0]?.value} sites</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Completed:</span>
                        <span className="font-semibold text-amber-600">{payload[1]?.value} sites</span>
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
              fill="#cbd5e1"
              radius={[4, 4, 0, 0]}
              barSize={18}
            />
            <Bar
              dataKey="completed"
              name="Completed Sites"
              fill="#f59e0b"
              radius={[4, 4, 0, 0]}
              barSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
