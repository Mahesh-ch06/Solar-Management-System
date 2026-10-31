import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, FileSpreadsheet, CheckCircle2, Sun, Package, Wrench,
  TrendingUp, RefreshCw, Plus, AlertTriangle, Zap, ArrowRight,
  Clock,
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
      {/* Executive Command Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-5 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-solar-400">
                Operations Command Center
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Rooftop Solar Performance Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Live telemetry for customer inquiries, rooftop installations, equipment dispatch & after-sales service.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetch();
                showToast('Synchronized', 'Dashboard metrics updated to latest state.', 'info', 1500);
              }}
              isLoading={isFetching && !isLoading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            >
              Sync
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => navigate('/customers')}
            >
              New Lead
            </Button>
          </div>
        </div>

        {/* Quick access links with dynamic counts */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3.5 border-t border-slate-800">
          {[
            { label: `${data?.kpis.totalEnquiries.value || 8} Active Enquiries`, path: '/customers' },
            { label: `${data?.kpis.pendingQuotations.value || 2} Pending Quotations`, path: '/quotations' },
            { label: `${data?.kpis.activeInstallations.value || 2} Active Installations`, path: '/installations' },
            { label: `${data?.kpis.availableInventory.lowStockAlerts || 3} Low Stock Alerts`, path: '/inventory' },
            { label: `${data?.kpis.openServiceTickets.value || 3} Open Service Tickets`, path: '/service-tickets' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 flex items-center gap-1.5 transition-colors"
            >
              <span>{item.label}</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
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
