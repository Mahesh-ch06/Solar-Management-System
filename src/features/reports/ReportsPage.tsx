import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import {
  BarChart3,
  Download,
  Printer,
  TrendingUp,
  FileText,
  Users,
  AlertCircle,
  CheckCircle2,
  Building,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { showToast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<'OCT' | 'SEP' | 'Q3' | 'YTD'>('OCT');

  // Subsidy tracking records (PM Surya Ghar Muft Bijli Yojana)
  const subsidyRecords = [
    {
      appNo: 'PSG-DL-2026-8812',
      customer: 'Rajesh Malhotra',
      capacity: '5 kW',
      subsidyAmount: 78000,
      discom: 'BSES Rajdhani Power Ltd',
      stage: 'SUBSIDY_RELEASED',
      stageLabel: 'Subsidy Disbursed via DBT',
      appliedDate: '2026-09-12',
      releaseDate: '2026-10-24',
    },
    {
      appNo: 'PSG-HR-2026-9041',
      customer: 'Sunita Sharma',
      capacity: '4 kW',
      subsidyAmount: 78000,
      discom: 'DHBVN Gurugram',
      stage: 'NET_METER_INSPECTED',
      stageLabel: 'Joint Inspection Approved',
      appliedDate: '2026-09-22',
    },
    {
      appNo: 'PSG-UP-2026-9214',
      customer: 'Amitabh Sen',
      capacity: '3 kW',
      subsidyAmount: 78000,
      discom: 'NPCL Greater Noida',
      stage: 'DOCS_UPLOADED',
      stageLabel: 'Net Metering Approval Pending',
      appliedDate: '2026-10-15',
    },
    {
      appNo: 'PSG-DL-2026-9430',
      customer: 'Vikramaditya Roy',
      capacity: '3 kW',
      subsidyAmount: 78000,
      discom: 'Tata Power DDL',
      stage: 'APPLICATION_FILED',
      stageLabel: 'Technical Feasibility Awaited',
      appliedDate: '2026-10-25',
    },
  ];

  // Job-wise Profitability Breakdown
  const jobProfits = [
    {
      job: 'JOB-2026-001',
      customer: 'Rajesh Malhotra',
      system: '5 kW On-Grid',
      revenue: 385000,
      hardwareCost: 242000,
      labourCost: 24000,
      overhead: 18000,
      netProfit: 101000,
      margin: 26.2,
    },
    {
      job: 'JOB-2026-002',
      customer: 'Sunita Sharma',
      system: '4 kW On-Grid',
      revenue: 310000,
      hardwareCost: 198000,
      labourCost: 20000,
      overhead: 15000,
      netProfit: 77000,
      margin: 24.8,
    },
    {
      job: 'JOB-2026-003',
      customer: 'Amitabh Sen',
      system: '3 kW Hybrid Off-Grid',
      revenue: 345000,
      hardwareCost: 235000,
      labourCost: 18000,
      overhead: 16000,
      netProfit: 76000,
      margin: 22.0,
    },
    {
      job: 'JOB-2026-004',
      customer: 'Meenakshi Iyer',
      system: '3 kW On-Grid',
      revenue: 235000,
      hardwareCost: 152000,
      labourCost: 16000,
      overhead: 12000,
      netProfit: 55000,
      margin: 23.4,
    },
    {
      job: 'JOB-2026-005',
      customer: 'Anand Murthy',
      system: '5 kW On-Grid',
      revenue: 390000,
      hardwareCost: 245000,
      labourCost: 24000,
      overhead: 18000,
      netProfit: 103000,
      margin: 26.4,
    },
  ];

  // Technician Productivity Leaderboard (15 technicians)
  const technicianLeaderboard = [
    { name: 'Manoj Kumar', role: 'Lead Rooftop Engineer', sitesDone: 6, avgHours: 14.2, rating: 4.9, onTime: '98%' },
    { name: 'Deepak Joshi', role: 'Senior Solar Electrician', sitesDone: 5, avgHours: 15.1, rating: 4.8, onTime: '96%' },
    { name: 'Amit Rawat', role: 'Site Surveyor & Engineer', sitesDone: 14, avgHours: 3.5, rating: 4.9, onTime: '100%' },
    { name: 'Rohit Verma', role: 'Rooftop Structural Tech', sitesDone: 4, avgHours: 16.0, rating: 4.7, onTime: '92%' },
    { name: 'Sandeep Chauhan', role: 'Commercial Inverter Specialist', sitesDone: 4, avgHours: 15.5, rating: 4.8, onTime: '95%' },
  ];

  // Root cause tracker for unfinished installations
  const bottleneckIssues = [
    {
      issue: 'DISCOM Bi-Directional Net Meter Shortage',
      count: 3,
      avgDelay: '9 days',
      impact: 'Customers waiting for final energization & export crediting',
      mitigation: 'Escalated with DHBVN Executive Engineer; temporary testing done',
    },
    {
      issue: 'Customer Civil Rooftop Waterproofing / Parapet',
      count: 2,
      avgDelay: '5 days',
      impact: 'Stands anchor bolting paused until masonry cures',
      mitigation: 'Technician site visit rescheduled for next Tuesday',
    },
    {
      issue: '4 sq mm DC Solar Cable Bulk Consignment Transit',
      count: 1,
      avgDelay: '2 days',
      impact: 'Warehouse dispatch held for Polycab consignment',
      mitigation: 'Procured 200m from local Havells authorised distributor',
    },
  ];

  const handleExportCSV = () => {
    showToast(
      'Export Generated',
      'SunPower_Solutions_October_2026_Report.csv downloaded to device',
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
            Job-wise profitability, PM Surya Ghar subsidy tracking, technician productivity & bottleneck analysis.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Period selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 text-xs font-medium">
            {[
              { key: 'OCT', label: 'Oct 2026' },
              { key: 'SEP', label: 'Sep 2026' },
              { key: 'Q3', label: 'Q3 FY26' },
              { key: 'YTD', label: 'FY 2026 YTD' },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => setSelectedPeriod(p.key as typeof selectedPeriod)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedPeriod === p.key
                    ? 'bg-solar-800 text-white font-semibold'
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
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print
          </Button>
        </div>
      </div>

      {/* 4 Director Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-l-solar-700">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Gross Revenue</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">₹48.5 Lakhs</p>
          <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            +14.2% vs target (38 installations)
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-emerald-600">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Operating Profit</p>
          <p className="text-2xl font-bold text-emerald-800 mt-1">₹12.7 Lakhs</p>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            Gross Margin: <strong className="text-slate-800">26.2%</strong> across jobs
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-amber-500">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Subsidies In Pipeline</p>
          <p className="text-2xl font-bold text-amber-900 mt-1">₹18.4 Lakhs</p>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            24 rooftop applications on PM Surya portal
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-sky-600">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Technician Payroll & Wages</p>
          <p className="text-2xl font-bold text-sky-900 mt-1">₹6.45 Lakhs</p>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            15 field technicians + safety incentives
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
                MNRE Certified
              </Badge>
            </div>
            <CardDescription>
              Real-time paperwork audit trail tracking national portal approval to customer DBT credit
            </CardDescription>
          </div>
          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
            Avg Disbursal: 34 days
          </span>
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
              {subsidyRecords.map((item) => (
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
                    {item.stage === 'SUBSIDY_RELEASED' && (
                      <Badge variant="emerald" size="sm" dot>
                        Credited to Bank
                      </Badge>
                    )}
                    {item.stage === 'NET_METER_INSPECTED' && (
                      <Badge variant="sky" size="sm" dot>
                        Inspection Passed
                      </Badge>
                    )}
                    {item.stage === 'DOCS_UPLOADED' && (
                      <Badge variant="amber" size="sm" dot>
                        DISCOM Review
                      </Badge>
                    )}
                    {item.stage === 'APPLICATION_FILED' && (
                      <Badge variant="slate" size="sm">
                        Filed
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
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
                <TableHead>Job Code</TableHead>
                <TableHead>Customer & System</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">BOM Hardware</TableHead>
                <TableHead className="text-right">Crew Labour</TableHead>
                <TableHead className="text-right">Overhead</TableHead>
                <TableHead className="text-right">Net Profit</TableHead>
                <TableHead className="text-right">Margin %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobProfits.map((job) => (
                <TableRow key={job.job}>
                  <TableCell className="font-mono text-xs font-semibold text-slate-600">
                    {job.job}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-slate-900 block">{job.customer}</span>
                    <span className="text-[11px] text-slate-500">{job.system}</span>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-slate-900">
                    {formatCurrency(job.revenue)}
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {formatCurrency(job.hardwareCost)}
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {formatCurrency(job.labourCost)}
                  </TableCell>
                  <TableCell className="text-right text-slate-500">
                    {formatCurrency(job.overhead)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-700">
                    {formatCurrency(job.netProfit)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {job.margin}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section 3: Technician Leaderboard & Bottlenecks 2-Col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technician Productivity */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              <CardTitle>Field Crew Productivity Leaderboard</CardTitle>
            </div>
            <CardDescription>Installations, speed, quality score & on-time compliance</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {technicianLeaderboard.map((tech, idx) => (
                <div key={tech.name} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{tech.name}</p>
                      <p className="text-[11px] text-slate-400">{tech.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{tech.sitesDone}</span>
                      <span className="text-[10px] text-slate-400 block">Sites Done</span>
                    </div>
                    <div>
                      <span className="font-semibold text-amber-600">★ {tech.rating}</span>
                      <span className="text-[10px] text-slate-400 block">Rating</span>
                    </div>
                    <div>
                      <span className="font-semibold text-emerald-700">{tech.onTime}</span>
                      <span className="text-[10px] text-slate-400 block">On-Time</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bottlenecks & Delayed Installations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <CardTitle>Unfinished Installations Bottleneck Analysis</CardTitle>
            </div>
            <CardDescription>Root causes of field project delays and corrective actions</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {bottleneckIssues.map((item, i) => (
              <div key={i} className="p-3 rounded-xl border border-rose-100 bg-rose-50/30 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">{item.issue}</span>
                  <Badge variant="rose" size="sm">
                    {item.count} Sites Delayed ({item.avgDelay})
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{item.impact}</p>
                <div className="pt-1 border-t border-rose-100 flex items-center gap-1.5 text-[11px] text-solar-900 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-solar-700 shrink-0" />
                  <span>Action: {item.mitigation}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
