import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, QuickStat } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import { Quotation, QuotationStatus } from '../../types/quotation';
import { quotationService } from './services/quotationService';
import { QuotationBuilderDrawer } from './components/QuotationBuilderDrawer';
import { QuotationDetailModal } from './components/QuotationDetailModal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import {
  Plus,
  Search,
  Eye,
  ShoppingCart,
  Send,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';

type TabStatus = 'ALL' | 'DRAFT' | 'SENT' | 'APPROVED' | 'CONVERTED';

const statusConfig: Record<
  QuotationStatus,
  { variant: 'slate' | 'sky' | 'emerald' | 'rose' | 'purple'; label: string }
> = {
  DRAFT: { variant: 'slate', label: 'Draft' },
  SENT: { variant: 'sky', label: 'Sent' },
  APPROVED: { variant: 'emerald', label: 'Approved' },
  REJECTED: { variant: 'rose', label: 'Rejected' },
  CONVERTED_TO_ORDER: { variant: 'purple', label: 'Converted' },
  EXPIRED: { variant: 'rose', label: 'Expired' },
};

export const QuotationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Conversion Confirmation State
  const [quoteToConvert, setQuoteToConvert] = useState<Quotation | null>(null);

  // Fetch Quotations
  const { data: quotations = [], isLoading, isError } = useQuery({
    queryKey: ['quotations'],
    queryFn: quotationService.getQuotations,
  });

  // Convert to Order Mutation
  const convertMutation = useMutation({
    mutationFn: (quotationId: string) => quotationService.convertToOrder(quotationId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      showToast(
        'Order Created Successfully',
        `Quotation ${result.quotation.quotationNumber} has been converted to Order ${result.order.orderNumber}.`,
        'success'
      );
      setQuoteToConvert(null);
      if (selectedQuotation && selectedQuotation.id === result.quotation.id) {
        setSelectedQuotation(result.quotation);
      }
    },
    onError: (err: Error) => {
      showToast('Conversion Failed', err.message || 'Could not convert quotation to order.', 'error');
    },
  });

  // Quick Status Update Mutation (e.g. Draft -> Sent)
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: QuotationStatus }) =>
      quotationService.updateQuotationStatus(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      showToast('Status Updated', `Quotation ${updated.quotationNumber} marked as ${updated.status}.`, 'info');
    },
  });

  // Counts for pipeline tabs
  const tabCounts = useMemo(() => {
    return {
      ALL: quotations.length,
      DRAFT: quotations.filter((q) => q.status === 'DRAFT').length,
      SENT: quotations.filter((q) => q.status === 'SENT').length,
      APPROVED: quotations.filter((q) => q.status === 'APPROVED').length,
      CONVERTED: quotations.filter((q) => q.status === 'CONVERTED_TO_ORDER').length,
    };
  }, [quotations]);

  // Filtered quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      // Tab filter
      if (activeTab === 'DRAFT' && q.status !== 'DRAFT') return false;
      if (activeTab === 'SENT' && q.status !== 'SENT') return false;
      if (activeTab === 'APPROVED' && q.status !== 'APPROVED') return false;
      if (activeTab === 'CONVERTED' && q.status !== 'CONVERTED_TO_ORDER') return false;

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesNumber = q.quotationNumber.toLowerCase().includes(term);
        const matchesCustomer = q.customerName.toLowerCase().includes(term);
        if (!matchesNumber && !matchesCustomer) return false;
      }

      return true;
    });
  }, [quotations, activeTab, searchTerm]);


  const handleOpenDetail = (quote: Quotation) => {
    setSelectedQuotation(quote);
    setIsDetailModalOpen(true);
  };

  const handleTriggerConvert = (quote: Quotation) => {
    setQuoteToConvert(quote);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Quotations & Orders Pipeline"
        subtitle="Manage customer proposals, calculate system bills of material, and convert approved quotes to orders"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsBuilderOpen(true)}
            >
              New Quotation
            </Button>
          </div>
        }
      />

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickStat
          label="Total Quotations"
          value={quotations.length}
          color="slate"
          onClick={() => setActiveTab('ALL')}
        />
        <QuickStat
          label="Awaiting Approval"
          value={tabCounts.SENT}
          color="sky"
          onClick={() => setActiveTab('SENT')}
        />
        <QuickStat
          label="Ready for Order"
          value={tabCounts.APPROVED}
          color="emerald"
          onClick={() => setActiveTab('APPROVED')}
        />
        <QuickStat
          label="Converted to Orders"
          value={tabCounts.CONVERTED}
          color="purple"
          onClick={() => setActiveTab('CONVERTED')}
        />
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Pipeline Controls & Tabs */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(
              [
                { id: 'ALL', label: 'All Quotations', count: tabCounts.ALL },
                { id: 'DRAFT', label: 'Draft', count: tabCounts.DRAFT },
                { id: 'SENT', label: 'Sent', count: tabCounts.SENT },
                { id: 'APPROVED', label: 'Approved', count: tabCounts.APPROVED },
                { id: 'CONVERTED', label: 'Converted', count: tabCounts.CONVERTED },
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-amber-600/80 text-slate-950 font-extrabold' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="w-full md:w-72">
            <Input
              placeholder="Search quotation # or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
        </div>

        {/* Content Table */}
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : isError ? (
          <div className="p-8">
            <EmptyState
              icon={AlertCircle}
              title="Failed to Load Quotations"
              description="Could not fetch quotes from the service. Please try again."
              actionLabel="Retry"
              onAction={() => queryClient.invalidateQueries({ queryKey: ['quotations'] })}
            />
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={FileSpreadsheet}
              title="No Quotations Found"
              description={
                searchTerm
                  ? `No quotation matches "${searchTerm}" in the current filter.`
                  : 'Get started by creating your first solar installation proposal.'
              }
              actionLabel="Create Quotation"
              onAction={() => setIsBuilderOpen(true)}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quotation #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>System Type</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotations.map((quote) => {
                const conf = statusConfig[quote.status] || {
                  variant: 'slate',
                  label: quote.status,
                };

                return (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono font-bold text-slate-900">
                      <button
                        onClick={() => handleOpenDetail(quote)}
                        className="hover:text-solar-800 hover:underline text-left"
                      >
                        {quote.quotationNumber}
                      </button>
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold text-slate-800">{quote.customerName}</div>
                      <div className="text-xs text-slate-400">ID: {quote.customerId}</div>
                    </TableCell>

                    <TableCell>
                      <span className="font-bold text-slate-800">{quote.capacityKW} kW</span>
                    </TableCell>

                    <TableCell>
                      <Badge variant={quote.systemType === 'ON_GRID' ? 'solar' : 'amber'} size="sm">
                        {quote.systemType === 'ON_GRID' ? 'On-Grid' : 'Off-Grid'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right font-mono">
                      <div className="font-bold text-slate-900">
                        {formatCurrency(quote.totalAmount)}
                      </div>
                      {quote.advancePaid > 0 && (
                        <div className="text-[11px] text-emerald-600 font-medium">
                          Adv: {formatCurrency(quote.advancePaid)}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge variant={conf.variant} dot size="sm">
                        {conf.label}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-slate-500">
                      {formatDate(quote.validUntil)}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetail(quote)}
                          title="View Quotation & BOM Details"
                          className="px-2"
                        >
                          <Eye className="w-4 h-4 text-slate-600" />
                        </Button>

                        {/* Convert to Order (Only for APPROVED) */}
                        {quote.status === 'APPROVED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-2.5 py-1"
                            leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                            onClick={() => handleTriggerConvert(quote)}
                          >
                            Convert to Order
                          </Button>
                        )}

                        {/* Send Quote shortcut (For DRAFT) */}
                        {quote.status === 'DRAFT' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs text-sky-700 border-sky-300 hover:bg-sky-50 px-2 py-1"
                            leftIcon={<Send className="w-3 h-3 text-sky-600" />}
                            onClick={() =>
                              statusMutation.mutate({ id: quote.id, status: 'SENT' })
                            }
                            title="Mark as Sent to Customer"
                          >
                            Send
                          </Button>
                        )}

                        {/* Mark Approved shortcut (For SENT) */}
                        {quote.status === 'SENT' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 px-2 py-1"
                            leftIcon={<CheckCircle className="w-3 h-3 text-emerald-600" />}
                            onClick={() =>
                              statusMutation.mutate({ id: quote.id, status: 'APPROVED' })
                            }
                            title="Mark as Approved by Customer"
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Quotation Builder Drawer */}
      <QuotationBuilderDrawer
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
      />

      {/* Quotation Detail Modal */}
      <QuotationDetailModal
        quotation={selectedQuotation}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onConvertToOrder={(quoteId) => {
          setIsDetailModalOpen(false);
          const q = quotations.find((x) => x.id === quoteId);
          if (q) handleTriggerConvert(q);
        }}
      />

      {/* Convert to Order Confirmation Modal */}
      <Modal
        isOpen={!!quoteToConvert}
        onClose={() => setQuoteToConvert(null)}
        title="Confirm Order Conversion"
        description="Convert approved quotation into an active solar installation order"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuoteToConvert(null)}
              disabled={convertMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
              isLoading={convertMutation.isPending}
              onClick={() => {
                if (quoteToConvert) {
                  convertMutation.mutate(quoteToConvert.id);
                }
              }}
            >
              Confirm & Generate Order
            </Button>
          </div>
        }
      >
        {quoteToConvert && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Quotation Reference:</span>
                <span className="font-mono font-bold text-slate-800">
                  {quoteToConvert.quotationNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Customer Name:</span>
                <span className="font-semibold text-slate-800">
                  {quoteToConvert.customerName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Solar Capacity & Type:</span>
                <span className="font-semibold text-slate-800">
                  {quoteToConvert.capacityKW} kW • {quoteToConvert.systemType}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Total Net Amount:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatCurrency(quoteToConvert.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Advance Paid:</span>
                <span className="font-mono font-semibold text-emerald-600">
                  {formatCurrency(quoteToConvert.advancePaid)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 leading-relaxed">
              Converting will lock this quotation as{' '}
              <strong className="font-bold">CONVERTED_TO_ORDER</strong> and spawn a new
              confirmed order in the operations workflow for dispatch and technician assignment.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
