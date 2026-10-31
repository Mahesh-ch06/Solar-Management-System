import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, FileSpreadsheet, CheckCircle2, Sun, Package, Wrench,
  TrendingUp, RefreshCw, Plus, AlertTriangle, Zap, ArrowRight,
  Activity, Clock,
} from 'lucide-react';
import { dashboardService } from './services/dashboardService';
import { StatCard } from './components/StatCard';
import { InstallationTrendChart } from './components/InstallationTrendChart';
import { RevenueExpenseChart } from './components/RevenueExpenseChart';
import { TechnicianRosterWidget } from './components/TechnicianRosterWidget';
import { RecentActivitiesList } from './components/RecentActivitiesList';
import { PendingTasksWidget } from './components/PendingTasksWidget';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatCompactCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const {
    data: response,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['dashboardOverview'],
    queryFn: () => dashboardService.getDashboardData(),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5, // auto-refresh every 5 min
  });

  if (isError) {
    return (
      <div className="p-10 text-center bg-white rounded-2xl border border-rose-200 shadow-sm">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-900">Failed to load dashboard</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">There was an error communicating with the data service.</p>
        <Button onClick={() => refetch()} variant="primary" size="sm">Try Again</Button>
      </div>
    );
  }

  const data = response?.data;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-solar-900 via-solar-800 to-navy-900 px-6 py-5 text-white shadow-lg">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-amber-400/10 pointer-events-none" />
        <div className="absolute -bottom-12 -left-6 w-40 h-40 rounded-full bg-solar-600/20 pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Operations Control Room
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              SunPower Solutions ERP
            </h1>
            <p className="text-sm text-solar-200 mt-0.5">
              Live operations for rooftop solar — enquiries, installations, dispatch & warranty
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Badge variant="solar" className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[11px]">
              <Activity className="w-3 h-3 mr-1" />
              Live Mock Data
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetch();
                showToast('Refreshed', 'Dashboard metrics updated', 'info', 2000);
              }}
              isLoading={isFetching && !isLoading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Refresh
            </Button>
            <Button
              variant="amber"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => navigate('/customers')}
            >
              New Enquiry
            </Button>
          </div>
        </div>

        {/* Quick access links */}
        <div className="relative flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
          {[
            { label: '42 Active Enquiries', path: '/customers', color: 'sky' },
            { label: '14 Pending Surveys', path: '/surveys', color: 'amber' },
            { label: '9 Quotations Out', path: '/quotations', color: 'purple' },
            { label: '3 Low Stock Items', path: '/inventory', color: 'rose' },
            { label: '5 Open Tickets', path: '/service-tickets', color: 'rose' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 flex items-center gap-1.5 transition-colors"
            >
              {item.label}
              <ArrowRight className="w-3 h-3" />
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Total Enquiries"
            value={data.kpis.totalEnquiries.value}
            icon={Users}
            subtitle={`${data.kpis.totalEnquiries.newThisWeek} new this week`}
            trend={{ value: data.kpis.totalEnquiries.trend, label: 'growth' }}
            accentColor="sky"
            onClick={() => navigate('/customers')}
          />
          <StatCard
            title="Pending Quotations"
            value={data.kpis.pendingQuotations.value}
            icon={FileSpreadsheet}
            subtitle={`${formatCompactCurrency(data.kpis.pendingQuotations.totalAmount)} in pipeline`}
            accentColor="amber"
            onClick={() => navigate('/quotations')}
          />
          <StatCard
            title="Active Installations"
            value={data.kpis.activeInstallations.value}
            icon={Sun}
            subtitle={`${data.kpis.activeInstallations.inProgress} in progress today`}
            accentColor="solar"
            onClick={() => navigate('/installations')}
          />
          <StatCard
            title="Oct Completed"
            value={`${data.kpis.completedInstallations.value}/${data.kpis.completedInstallations.monthlyTarget}`}
            icon={CheckCircle2}
            subtitle={`${data.kpis.completedInstallations.onTimeRate}% on-time delivery`}
            trend={{ value: 5.2, label: 'vs Sep' }}
            accentColor="emerald"
          />
          <StatCard
            title="Monthly Revenue"
            value={formatCompactCurrency(data.kpis.financials.monthlyRevenue)}
            icon={TrendingUp}
            subtitle={`Profit: ${formatCompactCurrency(data.kpis.financials.estimatedProfit)}`}
            trend={{ value: 12.3, label: 'vs last month' }}
            accentColor="solar"
            onClick={() => navigate('/finance')}
          />
          <StatCard
            title="Warehouse Stock"
            value={`${data.kpis.availableInventory.solarPanelsCount} Panels`}
            icon={Package}
            subtitle={`⚠ ${data.kpis.availableInventory.lowStockAlerts} low-stock alerts`}
            accentColor="amber"
            onClick={() => navigate('/inventory')}
          />
          <StatCard
            title="Service Tickets"
            value={data.kpis.openServiceTickets.value}
            icon={Wrench}
            subtitle={`${data.kpis.openServiceTickets.criticalCount} critical faults open`}
            accentColor="rose"
            onClick={() => navigate('/service-tickets')}
          />
          <StatCard
            title="Profit Margin"
            value={`${data.kpis.financials.profitMargin}%`}
            icon={TrendingUp}
            subtitle={`OpEx: ${formatCompactCurrency(data.kpis.financials.monthlyExpenses)}`}
            accentColor="emerald"
            onClick={() => navigate('/finance')}
          />
        </div>
      ) : null}

      {/* Charts */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-[340px] rounded-xl" />
          <Skeleton className="h-[340px] rounded-xl" />
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <InstallationTrendChart data={data.monthlyTrends} />
          <RevenueExpenseChart data={data.monthlyTrends} />
        </div>
      ) : null}

      {/* Technician Roster */}
      {isLoading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : data ? (
        <TechnicianRosterWidget technicians={data.technicians} />
      ) : null}

      {/* Tasks + Activity */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PendingTasksWidget tasks={data.pendingTasks} />
          <RecentActivitiesList activities={data.recentActivities} />
        </div>
      ) : null}

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Avg Installation Time', value: '2.3 days', icon: Clock, color: 'text-solar-700 bg-solar-50' },
          { label: 'Customer Satisfaction', value: '96.8%', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50' },
          { label: 'Warranty Claims YTD', value: '12', icon: Wrench, color: 'text-amber-700 bg-amber-50' },
          { label: 'Total Solar kWp Installed', value: '487 kWp', icon: Zap, color: 'text-sky-700 bg-sky-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 leading-tight">{stat.value}</p>
              <p className="text-[11px] text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
