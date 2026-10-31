import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  FileSpreadsheet,
  CheckCircle2,
  Sun,
  Package,
  Wrench,
  TrendingUp,
  RefreshCw,
  Plus,
  AlertTriangle,
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
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { formatCompactCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export const DashboardPage: React.FC = () => {
  const { showToast } = useToast();
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [newEnquiryName, setNewEnquiryName] = useState('');
  const [newEnquiryPhone, setNewEnquiryPhone] = useState('');
  const [newEnquiryCapacity, setNewEnquiryCapacity] = useState('3');

  const {
    data: response,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['dashboardOverview'],
    queryFn: () => dashboardService.getDashboardData(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnquiryName || !newEnquiryPhone) {
      showToast('Validation Error', 'Please enter customer name and phone number', 'error');
      return;
    }
    showToast(
      'Enquiry Registered',
      `New enquiry for ${newEnquiryName} (${newEnquiryCapacity} kW) logged successfully.`,
      'success'
    );
    setIsQuickAddModalOpen(false);
    setNewEnquiryName('');
    setNewEnquiryPhone('');
  };

  if (isError) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 shadow-sm">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-900">Failed to load dashboard metrics</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          There was an error communicating with the data service.
        </p>
        <Button onClick={() => refetch()} variant="primary" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  const data = response?.data;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Operations & Performance Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time telemetry for rooftop solar projects, field technicians, and supply chain.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              showToast('Refreshed', 'Dashboard metrics updated to latest state', 'info', 2000);
            }}
            isLoading={isFetching && !isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
          >
            Refresh Data
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsQuickAddModalOpen(true)}
          >
            New Lead / Enquiry
          </Button>
        </div>
      </div>

      {/* Top Metric Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Enquiries"
            value={data.kpis.totalEnquiries.value}
            icon={Users}
            subtitle={`${data.kpis.totalEnquiries.newThisWeek} new this week`}
            trend={{ value: data.kpis.totalEnquiries.trend, label: 'growth' }}
            accentColor="sky"
          />
          <StatCard
            title="Pending Quotations"
            value={data.kpis.pendingQuotations.value}
            icon={FileSpreadsheet}
            subtitle={`Valued at ${formatCompactCurrency(data.kpis.pendingQuotations.totalAmount)}`}
            accentColor="amber"
          />
          <StatCard
            title="Active Installations"
            value={data.kpis.activeInstallations.value}
            icon={Sun}
            subtitle={`${data.kpis.activeInstallations.inProgress} in progress today`}
            accentColor="solar"
          />
          <StatCard
            title="Completed (Oct)"
            value={`${data.kpis.completedInstallations.value}/${data.kpis.completedInstallations.monthlyTarget}`}
            icon={CheckCircle2}
            subtitle={`${data.kpis.completedInstallations.onTimeRate}% on-time rate`}
            trend={{ value: 94.7, label: 'on-time' }}
            accentColor="emerald"
          />
          <StatCard
            title="Monthly Revenue"
            value={formatCompactCurrency(data.kpis.financials.monthlyRevenue)}
            icon={TrendingUp}
            subtitle={`Est. Profit: ${formatCompactCurrency(data.kpis.financials.estimatedProfit)}`}
            trend={{ value: 12.3, label: 'margin' }}
            accentColor="solar"
          />
          <StatCard
            title="Warehouse Inventory"
            value={`${data.kpis.availableInventory.solarPanelsCount} Panels`}
            icon={Package}
            subtitle={`${data.kpis.availableInventory.lowStockAlerts} low-stock warnings`}
            accentColor="amber"
          />
          <StatCard
            title="Open Service Tickets"
            value={data.kpis.openServiceTickets.value}
            icon={Wrench}
            subtitle={`${data.kpis.openServiceTickets.criticalCount} critical faults`}
            accentColor="rose"
          />
          <StatCard
            title="Profit Margin"
            value={`${data.kpis.financials.profitMargin}%`}
            icon={TrendingUp}
            subtitle={`OpEx: ${formatCompactCurrency(data.kpis.financials.monthlyExpenses)}`}
            accentColor="emerald"
          />
        </div>
      ) : null}

      {/* Analytics Charts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[360px] rounded-xl" />
          <Skeleton className="h-[360px] rounded-xl" />
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InstallationTrendChart data={data.monthlyTrends} />
          <RevenueExpenseChart data={data.monthlyTrends} />
        </div>
      ) : null}

      {/* Field Technicians Roster (15 Technicians Tracking) */}
      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : data ? (
        <TechnicianRosterWidget technicians={data.technicians} />
      ) : null}

      {/* Operational Bottom Grid: Tasks and Recent Activity Stream */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PendingTasksWidget tasks={data.pendingTasks} />
          <RecentActivitiesList activities={data.recentActivities} />
        </div>
      ) : null}

      {/* Quick Add Enquiry Modal */}
      <Modal
        isOpen={isQuickAddModalOpen}
        onClose={() => setIsQuickAddModalOpen(false)}
        title="Quick Customer Enquiry Registration"
        description="Log an initial rooftop solar enquiry to dispatch a surveyor or generate preliminary proposal."
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsQuickAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleQuickSubmit}
            >
              Register Lead
            </Button>
          </>
        }
      >
        <form onSubmit={handleQuickSubmit} className="space-y-4">
          <Input
            label="Customer Full Name"
            placeholder="e.g. Anand Murthy"
            value={newEnquiryName}
            onChange={(e) => setNewEnquiryName(e.target.value)}
            required
          />
          <Input
            label="Mobile Number"
            type="tel"
            placeholder="e.g. +91 98765 43210"
            value={newEnquiryPhone}
            onChange={(e) => setNewEnquiryPhone(e.target.value)}
            required
          />
          <Select
            label="Required Solar Capacity"
            value={newEnquiryCapacity}
            onChange={(e) => setNewEnquiryCapacity(e.target.value)}
            options={[
              { label: '1 kW (1-2 BHK / Small Residential)', value: '1' },
              { label: '2 kW (2-3 BHK Residential)', value: '2' },
              { label: '3 kW (Standard Villa / Independent House)', value: '3' },
              { label: '4 kW (High Consumption Residential)', value: '4' },
              { label: '5 kW (Large Bungalow / Commercial)', value: '5' },
              { label: '10 kW+ (Commercial & Institutional)', value: '10' },
            ]}
          />
        </form>
      </Modal>
    </div>
  );
};
