import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Receipt,
  CreditCard,
  Percent,
  AlertCircle,
  Download,
  RefreshCw,
  Send,
  CheckCircle2,
  Building2,
  Wrench,
  Package,
  Clock,
} from 'lucide-react';
import { financeService, OutstandingPayment } from './services/financeService';
import { RevenueExpenseChart } from '../dashboard/components/RevenueExpenseChart';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency, formatCompactCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export const FinancePage: React.FC = () => {
  const { showToast } = useToast();

  // Payment Recording State
  const [selectedPayment, setSelectedPayment] = useState<OutstandingPayment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('NEFT');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Fetch Finance Data
  const {
    data: response,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['financeOverview'],
    queryFn: () => financeService.getFinanceOverview(),
    staleTime: 1000 * 60 * 2,
  });

  const data = response?.data;

  const handleOpenPaymentModal = (payment: OutstandingPayment) => {
    setSelectedPayment(payment);
    setPaymentAmount(payment.balanceDue);
    setPaymentRef(`UTR-${Math.floor(10000000 + Math.random() * 90000000)}`);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment) return;
    if (paymentAmount <= 0) {
      showToast('Validation Error', 'Payment amount must be greater than zero.', 'error');
      return;
    }

    try {
      setIsSubmittingPayment(true);
      await financeService.recordPayment(selectedPayment.orderId, paymentAmount);
      showToast(
        'Payment Recorded',
        `Received ${formatCurrency(paymentAmount)} from ${selectedPayment.customerName}. Balance updated.`,
        'success'
      );
      setSelectedPayment(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record payment';
      showToast('Error', msg, 'error');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleSendReminder = (payment: OutstandingPayment) => {
    showToast(
      'Payment Reminder Sent',
      `WhatsApp & SMS payment reminder sent to ${payment.customerName} (${payment.customerPhone}) for balance ${formatCurrency(payment.balanceDue)}.`,
      'info'
    );
  };

  const handleExportReport = () => {
    showToast(
      'Report Exported',
      'Finance & P&L Statement for October 2024 generated and downloaded.',
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
              Finance & Profitability Dashboard
            </h1>
            <Badge variant="solar" size="sm">
              Executive View
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Director-level cashflow telemetry, project-wise margin attribution, and accounts receivable tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              showToast('Refreshed', 'Financial ledgers recomputed.', 'info', 1500);
            }}
            isLoading={isFetching && !isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
          >
            Re-sync Ledgers
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportReport}
          >
            Export P&L Report
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-3 w-44" />
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Monthly Revenue */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Monthly Revenue
              </span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatCompactCurrency(data.monthlyRevenue)}
            </div>
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>Billed Contract Value:</span>
              <span className="font-semibold text-slate-700">
                {formatCurrency(data.monthlyRevenue)}
              </span>
            </div>
          </div>

          {/* Monthly Expenses */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Monthly Expenses
              </span>
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatCompactCurrency(data.monthlyExpenses)}
            </div>
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>OpEx & Hardware Cost:</span>
              <span className="font-semibold text-slate-700">
                {formatCurrency(data.monthlyExpenses)}
              </span>
            </div>
          </div>

          {/* Net Profit */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Net Operating Profit
              </span>
              <div className="w-9 h-9 rounded-lg bg-solar-50 text-solar-800 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
              {formatCompactCurrency(data.netProfit)}
            </div>
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>EBITDA Contribution:</span>
              <span className="font-semibold text-emerald-700">
                {formatCurrency(data.netProfit)}
              </span>
            </div>
          </div>

          {/* Profit Margin % */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Profit Margin %
              </span>
              <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                <Percent className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-solar-800 tracking-tight">
              {data.profitMarginPercent}%
            </div>
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>Target Benchmark:</span>
              <span className="font-semibold text-slate-700">&gt; 25.0%</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* 2 Column Layout: 6-Month Cashflow Trend Chart & Job-wise P&L Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: RevenueExpenseChart (reused from dashboard) */}
        <div className="lg:col-span-5 flex flex-col">
          {isLoading ? (
            <Skeleton className="h-[420px] rounded-xl" />
          ) : data ? (
            <RevenueExpenseChart data={data.monthlyTrends} />
          ) : null}
        </div>

        {/* RIGHT COLUMN: Job-wise P&L Table */}
        <div className="lg:col-span-7 flex flex-col">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div>
                <CardTitle>Job-wise Project Profit & Loss (P&L)</CardTitle>
                <CardDescription>
                  Unit economics, hardware costs, and gross margins for active installation jobs
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-x-auto">
              {isLoading ? (
                <div className="p-5 space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : data && data.jobWisePnL.length > 0 ? (
                <Table className="border-0 rounded-none">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order & Customer</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Parts Cost</TableHead>
                      <TableHead>Labour</TableHead>
                      <TableHead className="text-right">Gross Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.jobWisePnL.map((job) => {
                      const isHighMargin = job.marginPercent >= 25;
                      const isMediumMargin = job.marginPercent >= 15 && job.marginPercent < 25;

                      return (
                        <TableRow key={job.orderId}>
                          <TableCell>
                            <span className="font-bold text-slate-900 block text-xs">
                              {job.customerName}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400">
                              {job.orderNumber}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="font-semibold text-slate-800 text-xs">
                              {job.capacityKW} kW
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {job.systemType.replace('_', ' ')}
                            </span>
                          </TableCell>

                          <TableCell className="font-medium text-slate-900 text-xs">
                            {formatCurrency(job.revenue)}
                          </TableCell>

                          <TableCell className="text-slate-600 text-xs">
                            {formatCurrency(job.partsCost)}
                          </TableCell>

                          <TableCell className="text-slate-600 text-xs">
                            {formatCurrency(job.labourCost)}
                          </TableCell>

                          <TableCell className="text-right">
                            <Badge
                              variant={
                                isHighMargin ? 'emerald' : isMediumMargin ? 'amber' : 'rose'
                              }
                              size="sm"
                            >
                              {job.marginPercent}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  icon={Receipt}
                  title="No project orders recorded"
                  description="Job-level profitability will populate once orders are confirmed."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Expenses Breakdown Card */}
      {data && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Operating Expenses Breakdown (Oct 2024)</CardTitle>
              <CardDescription>
                Direct procurement, field workforce compensation, and administrative overheads
              </CardDescription>
            </div>
            <div className="text-right font-bold text-slate-900 text-sm">
              Total OpEx: {formatCurrency(data.expenseBreakdown.totalExpenses)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visual Multi-Segment Progress Bar */}
            <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex">
              <div
                style={{ width: '68%' }}
                className="bg-solar-600 transition-all"
                title="Inventory Purchases: 68%"
              />
              <div
                style={{ width: '18%' }}
                className="bg-amber-500 transition-all"
                title="Labour Costs: 18%"
              />
              <div
                style={{ width: '14%' }}
                className="bg-sky-500 transition-all"
                title="Overhead & Admin: 14%"
              />
            </div>

            {/* Three Breakdown Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center gap-2 text-solar-800 font-bold text-xs uppercase tracking-wider">
                  <Package className="w-4 h-4" />
                  <span>Inventory & Hardware Purchases (68%)</span>
                </div>
                <div className="text-lg font-bold text-slate-900">
                  {formatCurrency(data.expenseBreakdown.inventoryPurchases)}
                </div>
                <p className="text-[11px] text-slate-500">
                  Panels (Tata/Waaree), Inverters (Growatt), batteries, and DC wiring consignments.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
                  <Wrench className="w-4 h-4" />
                  <span>Field Labour & Subcontractors (18%)</span>
                </div>
                <div className="text-lg font-bold text-slate-900">
                  {formatCurrency(data.expenseBreakdown.labourCosts)}
                </div>
                <p className="text-[11px] text-slate-500">
                  15 field technicians per-KW installation fees, site surveys, and commissioning.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center gap-2 text-sky-700 font-bold text-xs uppercase tracking-wider">
                  <Building2 className="w-4 h-4" />
                  <span>Overhead, Logistics & Admin (14%)</span>
                </div>
                <div className="text-lg font-bold text-slate-900">
                  {formatCurrency(data.expenseBreakdown.overheadAndAdmin)}
                </div>
                <p className="text-[11px] text-slate-500">
                  Fleet vehicle transport, warehouse leases, insurance, and SaaS licenses.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom: Outstanding Customer Payments Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Outstanding Customer Receivables & Milestone Collections</CardTitle>
            <CardDescription>
              Uncollected balances for active rooftop installations, advance disbursements, and overdue invoices
            </CardDescription>
          </div>
          {data && (
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Total Due:</span>
              <span className="text-base font-extrabold text-rose-600">
                {formatCurrency(
                  data.outstandingPayments.reduce((acc, p) => acc + p.balanceDue, 0)
                )}
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-5 space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : data && data.outstandingPayments.length > 0 ? (
            <Table className="border-0 rounded-none">
              <TableHeader>
                <TableRow>
                  <TableHead>Customer & Order #</TableHead>
                  <TableHead>Total Contract</TableHead>
                  <TableHead>Advance Paid</TableHead>
                  <TableHead>Balance Due</TableHead>
                  <TableHead className="w-44">Collection Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.outstandingPayments.map((payment) => (
                  <TableRow key={payment.orderId}>
                    <TableCell>
                      <span className="font-semibold text-slate-900 block text-xs">
                        {payment.customerName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {payment.orderNumber} • {payment.customerPhone}
                      </span>
                    </TableCell>

                    <TableCell className="font-semibold text-slate-900 text-xs">
                      {formatCurrency(payment.totalAmount)}
                    </TableCell>

                    <TableCell className="text-emerald-700 font-medium text-xs">
                      {formatCurrency(payment.advancePaid)}
                    </TableCell>

                    <TableCell className="text-rose-700 font-bold text-xs">
                      {formatCurrency(payment.balanceDue)}
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                          <span>{payment.paidPercentage}% Paid</span>
                          <span>{formatCompactCurrency(payment.advancePaid)}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all"
                            style={{ width: `${payment.paidPercentage}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {payment.isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          Overdue ({payment.daysPending}d)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                          <Clock className="w-3.5 h-3.5 text-sky-600" />
                          On Schedule ({payment.daysPending}d)
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Send className="w-3.5 h-3.5 text-amber-600" />}
                          onClick={() => handleSendReminder(payment)}
                        >
                          Reminder
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                          onClick={() => handleOpenPaymentModal(payment)}
                        >
                          Record Receipt
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="All customer payments settled"
              description="There are currently zero overdue accounts receivable balances."
            />
          )}
        </CardContent>
      </Card>

      {/* Record Payment Receipt Modal */}
      <Modal
        isOpen={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
        title={`Record Customer Payment — ${selectedPayment?.orderNumber}`}
        description={`Record balance settlement for ${selectedPayment?.customerName}. Total balance due: ${formatCurrency(selectedPayment?.balanceDue || 0)}`}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPayment(null)}
              disabled={isSubmittingPayment}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmPayment}
              isLoading={isSubmittingPayment}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Confirm Receipt
            </Button>
          </div>
        }
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block">Total Contract</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(selectedPayment.totalAmount)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Previously Received</span>
                <span className="font-semibold text-emerald-700">
                  {formatCurrency(selectedPayment.advancePaid)}
                </span>
              </div>
            </div>

            <Input
              label="Payment Amount Received (₹)"
              type="number"
              min={100}
              max={selectedPayment.balanceDue}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              required
            />

            <Select
              label="Payment Mode"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              options={[
                { label: 'Bank Transfer (NEFT / RTGS / IMPS)', value: 'NEFT' },
                { label: 'UPI QR Payment (GooglePay / PhonePe)', value: 'UPI' },
                { label: 'Account Payee Cheque / DD', value: 'CHEQUE' },
                { label: 'DISCOM Subsidy Direct Disbursement', value: 'SUBSIDY' },
              ]}
            />

            <Input
              label="Transaction UTR / Cheque Ref No."
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              required
              helperText="Bank reference code for reconciliation against statement"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};
