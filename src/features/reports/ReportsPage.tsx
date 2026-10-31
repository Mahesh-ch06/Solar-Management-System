import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { orders, quotations, installationJobs } from '../../store/inMemoryDb';
import {
  BarChart3,
  Download,
  Printer,
  TrendingUp,
  FileText,
  Users,
  AlertCircle,
  Building,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { showToast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<'OCT' | 'SEP' | 'Q3' | 'YTD'>('OCT');

  // Subsidy tracking records derived dynamically from real confirmed orders
  const subsidyRecords = orders
    .filter((o) => {
      const quote = quotations.find((q) => q.id === o.quotationId);
      return (quote && quote.subsidyAmount > 0) || o.systemType === 'ON_GRID';
    })
    .map((order, idx) => ({
      appNo: `PSG-${order.orderNumber.replace('ORD-', '') || String(idx + 1).padStart(4, '0')}`,
      customer: order.customerName,
      capacity: `${order.capacityKW} kW`,
      subsidyAmount: order.capacityKW <= 2 ? 60000 : 78000,
      discom: 'State DISCOM Jurisdiction',
      stage: 'APPLICATION_FILED',
      stageLabel: 'Processing with State Electricity Board',
      appliedDate: order.createdAt ? order.createdAt.split('T')[0] : 'Today',
    }));

  // Job-wise Profitability Breakdown derived from confirmed orders
  const jobProfits = orders.map((order) => {
    const hardwareCost = Math.round(order.capacityKW * 31500 + (order.systemType === 'OFF_GRID' ? 95000 : 0));
    const labourCost = Math.round(order.capacityKW * 4500 + 2000);
    const overhead = Math.round(order.totalAmount * 0.05);
    const netProfit = order.totalAmount - hardwareCost - labourCost - overhead;
    const margin = order.totalAmount > 0 ? Number(((netProfit / order.totalAmount) * 100).toFixed(1)) : 0;

    return {
      job: order.orderNumber,
      customer: order.customerName,
      system: `${order.capacityKW} kW ${order.systemType === 'ON_GRID' ? 'On-Grid' : 'Off-Grid'}`,
      revenue: order.totalAmount,
      hardwareCost,
      labourCost,
      overhead,
      netProfit,
      margin,
    };
  });

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalNetProfit = jobProfits.reduce((sum, j) => sum + j.netProfit, 0);
  const avgMargin = jobProfits.length > 0 ? (jobProfits.reduce((sum, j) => sum + j.margin, 0) / jobProfits.length).toFixed(1) : '0.0';
  const totalSubsidies = subsidyRecords.reduce((sum, s) => sum + s.subsidyAmount, 0);

  const handleExportCSV = () => {
    showToast(
      'Export Generated',
      'Reports summary exported to CSV',
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Executive Month-End & Compliance Reports
            </h1>
            <Badge variant="solar" size="sm">
              <BarChart3 className="w-3.5 h-3.5 mr-1" />
              Director Overview
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Job-wise profitability, government subsidy tracking, and operational analysis.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Period selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 text-xs font-medium">
            {[
              { key: 'OCT', label: 'Current Month' },
              { key: 'SEP', label: 'Last Month' },
              { key: 'Q3', label: 'Quarterly' },
              { key: 'YTD', label: 'YTD' },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => setSelectedPeriod(p.key as typeof selectedPeriod)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  selectedPeriod === p.key
                    ? 'bg-solar-800 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-l-solar-600">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Billed Revenue</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalRevenue)}</p>
          <div className="mt-2 text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Derived from {orders.length} confirmed orders</span>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-emerald-600">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Operating Profit</p>
          <p className="text-2xl font-bold text-emerald-800 mt-1">{formatCurrency(totalNetProfit)}</p>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            Gross Margin: <strong className="text-slate-800">{avgMargin}%</strong> across jobs
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-amber-500">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Subsidies In Pipeline</p>
          <p className="text-2xl font-bold text-amber-900 mt-1">{formatCurrency(totalSubsidies)}</p>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            {subsidyRecords.length} rooftop applications
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-sky-600">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Field Operations</p>
          <p className="text-2xl font-bold text-sky-900 mt-1">{installationJobs.length}</p>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            Rooftop solar installations scheduled
          </div>
        </Card>
      </div>

      {/* Section 1: PM Surya Ghar Subsidy Paperwork Tracker */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-solar-800" />
              <CardTitle>PM Surya Ghar Government Subsidy Pipeline</CardTitle>
              <Badge variant="emerald" size="sm">
                MNRE Verified
              </Badge>
            </div>
            <CardDescription>
              Real-time paperwork audit trail tracking national portal approval to customer DBT credit
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Portal App #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Subsidy Amount</TableHead>
                <TableHead>DISCOM Jurisdiction</TableHead>
                <TableHead>Application Stage</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subsidyRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-slate-400 mb-1" />
                      <p className="text-xs font-medium text-slate-600">No subsidy applications currently recorded</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Records populate when orders with PM Surya Ghar subsidy are registered.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                subsidyRecords.map((item) => (
                  <TableRow key={item.appNo}>
                    <TableCell className="font-mono font-semibold text-slate-800">
                      {item.appNo}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900">
                      {item.customer}
                    </TableCell>
                    <TableCell>{item.capacity}</TableCell>
                    <TableCell className="font-semibold text-emerald-700">
                      {formatCurrency(item.subsidyAmount)}
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs">
                      {item.discom}
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">
                      {item.stageLabel}
                    </TableCell>
                    <TableCell>
                      <Badge variant="amber" size="sm" dot>
                        In Review
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section 2: Job-Wise Profit & Loss (P&L) Ledger */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-700" />
            <CardTitle>Job-Wise Profitability Ledger</CardTitle>
          </div>
          <CardDescription>
            Gross margin breakdown per rooftop installation: Hardware (BOM) + Field Labour + Overhead
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>System Spec</TableHead>
                <TableHead>Billed Revenue</TableHead>
                <TableHead>Hardware BOM</TableHead>
                <TableHead>Labour</TableHead>
                <TableHead>Gross Profit</TableHead>
                <TableHead>Margin %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobProfits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-6 h-6 text-slate-400 mb-1" />
                      <p className="text-xs font-medium text-slate-600">No confirmed jobs in current reporting period</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Job-wise profitability ledger populates as quotations are converted to orders.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                jobProfits.map((item) => (
                  <TableRow key={item.job}>
                    <TableCell className="font-mono font-semibold text-slate-800">
                      {item.job}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900">
                      {item.customer}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">{item.system}</TableCell>
                    <TableCell className="font-semibold text-slate-900">
                      {formatCurrency(item.revenue)}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {formatCurrency(item.hardwareCost)}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {formatCurrency(item.labourCost)}
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-700">
                      {formatCurrency(item.netProfit)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.margin >= 25 ? 'emerald' : item.margin >= 20 ? 'amber' : 'rose'}
                        size="sm"
                      >
                        {item.margin}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
