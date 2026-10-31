import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { MonthlyTrendData } from '../../../types/dashboard';

interface RevenueExpenseChartProps {
  data: MonthlyTrendData[];
}

export const RevenueExpenseChart: React.FC<RevenueExpenseChartProps> = ({ data }) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>Cashflow & Profitability</CardTitle>
          <CardDescription>
            Gross Revenue vs Operating Expenses (in ₹ Lakhs)
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-[300px] pt-4">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#15803d" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#15803d" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
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
              tickFormatter={(v) => `₹${v}L`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const rev = Number(payload[0]?.value || 0);
                  const exp = Number(payload[1]?.value || 0);
                  const margin = rev > 0 ? (((rev - exp) / rev) * 100).toFixed(1) : '0';

                  return (
                    <div className="bg-navy-950 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-navy-800">
                      <p className="font-bold text-amber-400">{label} Financials</p>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-300">Revenue:</span>
                        <span className="font-semibold text-emerald-400">₹{rev.toFixed(1)} Lakhs</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-300">Expenses:</span>
                        <span className="font-semibold text-amber-400">₹{exp.toFixed(1)} Lakhs</span>
                      </div>
                      <div className="pt-1 border-t border-navy-800 flex items-center justify-between gap-4 text-solar-300 font-bold">
                        <span>Est. Margin:</span>
                        <span>{margin}%</span>
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
            <Area
              type="monotone"
              dataKey="revenueLakhs"
              name="Revenue (₹ Lakhs)"
              stroke="#15803d"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
            <Area
              type="monotone"
              dataKey="expensesLakhs"
              name="Expenses (₹ Lakhs)"
              stroke="#f59e0b"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorExpenses)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
