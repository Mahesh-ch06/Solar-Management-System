import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  UserPlus,
  Users,
  Clock,
  PhoneCall,
  CalendarCheck,
  FileCheck,
  Award,
  ChevronLeft,
  ChevronRight,
  Edit2,
} from 'lucide-react';
import { Customer, EnquiryStatus } from '../../types/customer';
import { customerService } from './services/customerService';
import { CustomerFormDrawer } from './components/CustomerFormDrawer';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatCapacity } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import { cn } from '../../utils/cn';

const STATUS_BADGE_VARIANTS: Record<
  EnquiryStatus,
  'sky' | 'purple' | 'amber' | 'emerald' | 'rose'
> = {
  NEW: 'sky',
  CONTACTED: 'purple',
  SURVEY_SCHEDULED: 'amber',
  SURVEY_DONE: 'sky',
  QUOTATION_SENT: 'sky',
  CONVERTED: 'emerald',
  CLOSED_LOST: 'rose',
};

const STATUS_DISPLAY_LABELS: Record<EnquiryStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  SURVEY_SCHEDULED: 'Survey Scheduled',
  SURVEY_DONE: 'Survey Done',
  QUOTATION_SENT: 'Quotation Sent',
  CONVERTED: 'Converted',
  CLOSED_LOST: 'Closed Lost',
};

const FILTER_PILLS: Array<{ id: 'ALL' | EnquiryStatus; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'NEW', label: 'New' },
  { id: 'CONTACTED', label: 'Contacted' },
  { id: 'SURVEY_SCHEDULED', label: 'Survey Scheduled' },
  { id: 'QUOTATION_SENT', label: 'Quotation Sent' },
  { id: 'CONVERTED', label: 'Converted' },
  { id: 'CLOSED_LOST', label: 'Closed Lost' },
];

const ITEMS_PER_PAGE = 10;

export const CustomersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | EnquiryStatus>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  // Query customers
  const { data: customers = [], isLoading, isError } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers(),
  });

  // Mutation for inline quick status change
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: EnquiryStatus }) =>
      customerService.updateCustomerStatus(id, status),
    onSuccess: (updated) => {
      showToast(
        'Status Updated',
        `${updated.name}'s status changed to ${STATUS_DISPLAY_LABELS[updated.status]}`,
        'success'
      );
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      showToast('Error Updating Status', msg, 'error');
    },
  });

  // Filter and search logic
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cust.phone.includes(searchTerm.trim()) ||
        cust.city.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        selectedStatus === 'ALL' || cust.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, selectedStatus]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE) || 1;
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);

  // Reset page when filter changes
  const handleStatusFilterChange = (status: 'ALL' | EnquiryStatus) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Drawer openers
  const handleAddNew = () => {
    setCustomerToEdit(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setCustomerToEdit(customer);
    setIsDrawerOpen(true);
  };

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: customers.length,
      new: customers.filter((c) => c.status === 'NEW').length,
      contacted: customers.filter((c) => c.status === 'CONTACTED').length,
      surveyScheduled: customers.filter((c) => c.status === 'SURVEY_SCHEDULED').length,
      quotationSent: customers.filter((c) => c.status === 'QUOTATION_SENT').length,
      converted: customers.filter((c) => c.status === 'CONVERTED').length,
    };
  }, [customers]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-solar-800">
            <Users className="w-4 h-4" />
            <span>Sales & Pipeline</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Customer Enquiries & Pipeline
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage solar customer discovery, energy consumption bills, DISCOM subsidies, and deal progression.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={handleAddNew}
          >
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => handleStatusFilterChange('ALL')}
          className={cn(
            'p-3.5 rounded-xl border bg-white transition-all cursor-pointer select-none hover:shadow-xs',
            selectedStatus === 'ALL'
              ? 'border-solar-600 ring-2 ring-solar-500/20 shadow-xs'
              : 'border-slate-200'
          )}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Pipeline</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">All customer leads</div>
        </div>

        <div
          onClick={() => handleStatusFilterChange('NEW')}
          className={cn(
            'p-3.5 rounded-xl border bg-white transition-all cursor-pointer select-none hover:shadow-xs',
            selectedStatus === 'NEW'
              ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
              : 'border-slate-200'
          )}
        >
          <div className="flex items-center justify-between text-sky-700 mb-1">
            <span className="text-xs font-medium">New Leads</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl font-bold text-sky-900">{stats.new}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Needs first touch</div>
        </div>

        <div
          onClick={() => handleStatusFilterChange('CONTACTED')}
          className={cn(
            'p-3.5 rounded-xl border bg-white transition-all cursor-pointer select-none hover:shadow-xs',
            selectedStatus === 'CONTACTED'
              ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
              : 'border-slate-200'
          )}
        >
          <div className="flex items-center justify-between text-purple-700 mb-1">
            <span className="text-xs font-medium">Contacted</span>
            <PhoneCall className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-purple-900">{stats.contacted}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">In discussions</div>
        </div>

        <div
          onClick={() => handleStatusFilterChange('SURVEY_SCHEDULED')}
          className={cn(
            'p-3.5 rounded-xl border bg-white transition-all cursor-pointer select-none hover:shadow-xs',
            selectedStatus === 'SURVEY_SCHEDULED'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
              : 'border-slate-200'
          )}
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-medium">Survey Booked</span>
            <CalendarCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-900">{stats.surveyScheduled}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Site visit queued</div>
        </div>

        <div
          onClick={() => handleStatusFilterChange('QUOTATION_SENT')}
          className={cn(
            'p-3.5 rounded-xl border bg-white transition-all cursor-pointer select-none hover:shadow-xs',
            selectedStatus === 'QUOTATION_SENT'
              ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
              : 'border-slate-200'
          )}
        >
          <div className="flex items-center justify-between text-sky-700 mb-1">
            <span className="text-xs font-medium">Quoted</span>
            <FileCheck className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl font-bold text-sky-900">{stats.quotationSent}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Awaiting customer sign</div>
        </div>

        <div
          onClick={() => handleStatusFilterChange('CONVERTED')}
          className={cn(
            'p-3.5 rounded-xl border bg-white transition-all cursor-pointer select-none hover:shadow-xs',
            selectedStatus === 'CONVERTED'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
              : 'border-slate-200'
          )}
        >
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-medium">Converted</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-900">{stats.converted}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Advance paid</div>
        </div>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3.5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by customer name, mobile phone, or city..."
              className="w-full bg-slate-50 text-slate-900 placeholder:text-slate-400 text-sm rounded-lg border border-slate-200 pl-9 pr-4 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-solar-500/20 focus:border-solar-600 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-200/60 rounded px-1.5 py-0.5"
              >
                Clear
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 self-end md:self-center">
            Found <span className="font-semibold text-slate-800">{filteredCustomers.length}</span>{' '}
            {filteredCustomers.length === 1 ? 'customer' : 'customers'}
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-500 mr-1 shrink-0">
            Filter Status:
          </span>
          {FILTER_PILLS.map((pill) => {
            const isSelected = selectedStatus === pill.id;
            const count =
              pill.id === 'ALL'
                ? customers.length
                : customers.filter((c) => c.status === pill.id).length;

            return (
              <button
                key={pill.id}
                onClick={() => handleStatusFilterChange(pill.id)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full transition-all shrink-0 cursor-pointer flex items-center gap-1.5',
                  isSelected
                    ? 'bg-solar-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <span>{pill.label}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                    isSelected
                      ? 'bg-solar-900/60 text-white'
                      : 'bg-slate-200 text-slate-700'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-rose-600 font-medium">Failed to load customers from service.</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['customers'] })}
            >
              Retry
            </Button>
          </div>
        ) : paginatedCustomers.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No customer enquiries found"
              description={
                searchTerm || selectedStatus !== 'ALL'
                  ? 'No results match your active search and status filter. Try clearing filters.'
                  : 'Get started by creating your first solar customer enquiry.'
              }
              actionLabel={searchTerm || selectedStatus !== 'ALL' ? 'Reset Filters' : 'Add Customer'}
              onAction={() => {
                if (searchTerm || selectedStatus !== 'ALL') {
                  setSearchTerm('');
                  setSelectedStatus('ALL');
                  setCurrentPage(1);
                } else {
                  handleAddNew();
                }
              }}
            />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">Customer Name & Phone</TableHead>
                  <TableHead className="w-[140px]">City</TableHead>
                  <TableHead className="w-[180px]">System Profile</TableHead>
                  <TableHead className="w-[130px]">Monthly Bill</TableHead>
                  <TableHead className="w-[160px]">Status</TableHead>
                  <TableHead className="w-[160px]">Assigned To</TableHead>
                  <TableHead className="text-right w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.map((cust) => {
                  const badgeVariant = STATUS_BADGE_VARIANTS[cust.status] || 'slate';

                  return (
                    <TableRow key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Phone */}
                      <TableCell>
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{cust.name}</span>
                          {cust.subsidyRequired && (
                            <span
                              title="PM Surya Ghar Subsidy applicant"
                              className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-medium"
                            >
                              Subsidy
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                          <span>{cust.phone}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] text-slate-400 capitalize">
                            {cust.enquirySource.replace('_', ' ').toLowerCase()}
                          </span>
                        </div>
                      </TableCell>

                      {/* City */}
                      <TableCell>
                        <span className="text-slate-800 font-medium">{cust.city}</span>
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px]" title={cust.address}>
                          {cust.pincode}
                        </div>
                      </TableCell>

                      {/* System */}
                      <TableCell>
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <span>{formatCapacity(cust.requiredCapacityKW)}</span>
                          <span className="text-xs font-normal text-slate-500">
                            ({cust.systemType === 'ON_GRID' ? 'On-Grid' : 'Off-Grid'})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[170px]" title={cust.notes}>
                          {cust.notes || 'No remarks recorded'}
                        </div>
                      </TableCell>

                      {/* Monthly Bill */}
                      <TableCell>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(cust.monthlyBill)}
                        </span>
                        <div className="text-[11px] text-slate-400">per month</div>
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell>
                        <Badge variant={badgeVariant} dot>
                          {STATUS_DISPLAY_LABELS[cust.status]}
                        </Badge>
                      </TableCell>

                      {/* Assigned To */}
                      <TableCell>
                        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                          {cust.assignedTo}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Status Select */}
                          <div className="relative inline-block">
                            <select
                              value={cust.status}
                              onChange={(e) =>
                                statusMutation.mutate({
                                  id: cust.id,
                                  status: e.target.value as EnquiryStatus,
                                })
                              }
                              title="Change stage quickly"
                              className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md py-1 pl-2 pr-6 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-solar-500"
                            >
                              <option value="NEW">New</option>
                              <option value="CONTACTED">Contacted</option>
                              <option value="SURVEY_SCHEDULED">Survey Sched.</option>
                              <option value="SURVEY_DONE">Survey Done</option>
                              <option value="QUOTATION_SENT">Quotation Sent</option>
                              <option value="CONVERTED">Converted</option>
                              <option value="CLOSED_LOST">Closed Lost</option>
                            </select>
                            <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                              ▼
                            </span>
                          </div>

                          {/* Edit button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(cust)}
                            title="Edit customer details"
                            className="p-1.5 text-slate-600 hover:text-solar-800"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination Row */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                Showing{' '}
                <span className="font-semibold text-slate-800">
                  {Math.min(
                    (currentPage - 1) * ITEMS_PER_PAGE + 1,
                    filteredCustomers.length
                  )}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-800">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-800">
                  {filteredCustomers.length}
                </span>{' '}
                results
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                  className="px-2.5 py-1"
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        'w-7 h-7 text-xs font-medium rounded-md transition-colors cursor-pointer',
                        currentPage === page
                          ? 'bg-solar-800 text-white font-bold'
                          : 'text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  className="px-2.5 py-1"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Slide-over Customer Form Drawer */}
      <CustomerFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setCustomerToEdit(null);
        }}
        customerToEdit={customerToEdit}
      />
    </div>
  );
};
