import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Wrench,
  Plus,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Search,
  RefreshCw,
  User,
  Phone,
  Trash2,
} from 'lucide-react';
import { serviceService } from './services/serviceService';
import { ServiceTicket, TicketPriority, TicketStatus } from '../../types/operations';
import { ServiceTicketFormDrawer } from './components/ServiceTicketFormDrawer';
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
import { formatDate, formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export const ServiceTicketsPage: React.FC = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSerialParam = searchParams.get('serial') || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Drawer / Modals
  const [isNewDrawerOpen, setIsNewDrawerOpen] = useState(Boolean(initialSerialParam));
  const [resolvingTicket, setResolvingTicket] = useState<ServiceTicket | null>(null);

  // Resolve Ticket Form State
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [labourCost, setLabourCost] = useState(0);
  const [partsList, setPartsList] = useState<{ name: string; cost: number }[]>([]);
  const [newPartName, setNewPartName] = useState('');
  const [newPartCost, setNewPartCost] = useState('');
  const [isSubmittingResolve, setIsSubmittingResolve] = useState(false);

  // Fetch tickets
  const {
    data: response,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['serviceTickets'],
    queryFn: () => serviceService.getServiceTickets(),
    staleTime: 1000 * 30,
  });

  const tickets = response?.data || [];

  // Summary KPIs
  const stats = useMemo(() => {
    const openCount = tickets.filter(
      (t) => t.status === 'OPEN' || t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS'
    ).length;
    const criticalCount = tickets.filter(
      (t) => t.priority === 'CRITICAL' && t.status !== 'CLOSED' && t.status !== 'RESOLVED'
    ).length;
    const resolvedTodayCount = tickets.filter((t) => t.status === 'RESOLVED').length;

    return {
      open: openCount,
      critical: criticalCount,
      resolvedToday: resolvedTodayCount,
      avgResolution: '18.5 hrs',
    };
  }, [tickets]);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesPriority = priorityFilter === 'ALL' || ticket.priority === priorityFilter;
      const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        ticket.ticketNumber.toLowerCase().includes(q) ||
        ticket.customerName.toLowerCase().includes(q) ||
        ticket.faultDescription.toLowerCase().includes(q) ||
        (ticket.serialNumber && ticket.serialNumber.toLowerCase().includes(q)) ||
        (ticket.assignedTechnicianName &&
          ticket.assignedTechnicianName.toLowerCase().includes(q));

      return matchesPriority && matchesStatus && matchesSearch;
    });
  }, [tickets, priorityFilter, statusFilter, searchQuery]);

  const handleOpenResolveModal = (ticket: ServiceTicket) => {
    setResolvingTicket(ticket);
    setResolutionNotes('');
    setLabourCost(ticket.isUnderWarranty ? 0 : 850);
    setPartsList([]);
    setNewPartName('');
    setNewPartCost('');
  };

  const handleAddPart = () => {
    if (!newPartName.trim()) return;
    const cost = parseFloat(newPartCost) || 0;
    setPartsList((prev) => [...prev, { name: newPartName.trim(), cost }]);
    setNewPartName('');
    setNewPartCost('');
  };

  const handleRemovePart = (index: number) => {
    setPartsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmResolve = async () => {
    if (!resolvingTicket) return;
    if (!resolutionNotes.trim()) {
      showToast('Validation Error', 'Please enter resolution diagnosis notes.', 'error');
      return;
    }

    try {
      setIsSubmittingResolve(true);
      await serviceService.resolveTicket(resolvingTicket.id, {
        resolutionNotes,
        partsUsed: partsList,
        labourCost: resolvingTicket.isUnderWarranty ? 0 : labourCost,
      });

      showToast(
        'Ticket Resolved',
        `${resolvingTicket.ticketNumber} marked as RESOLVED and customer notification dispatched.`,
        'success'
      );
      setResolvingTicket(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resolve ticket';
      showToast('Error', msg, 'error');
    } finally {
      setIsSubmittingResolve(false);
    }
  };

  const getPriorityBadgeVariant = (priority: TicketPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'rose';
      case 'HIGH':
        return 'amber';
      case 'MEDIUM':
        return 'sky';
      case 'LOW':
        return 'slate';
    }
  };

  const getStatusBadgeVariant = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN':
        return 'sky';
      case 'ASSIGNED':
        return 'amber';
      case 'IN_PROGRESS':
        return 'purple';
      case 'RESOLVED':
        return 'emerald';
      case 'CLOSED':
        return 'slate';
    }
  };

  const totalCalculatedBill = useMemo(() => {
    if (!resolvingTicket) return 0;
    if (resolvingTicket.isUnderWarranty) return 0;
    const partsSum = partsList.reduce((acc, p) => acc + (p.cost || 0), 0);
    return partsSum + labourCost;
  }, [resolvingTicket, partsList, labourCost]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Service & Maintenance Tickets
            </h1>
            <Badge variant="rose" size="sm">
              Customer Support
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage rooftop solar maintenance requests, inverter error codes, warranty claims, and technician dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              showToast('Refreshed', 'Service tickets updated.', 'info', 1500);
            }}
            isLoading={isFetching && !isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsNewDrawerOpen(true)}
          >
            New Ticket
          </Button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Open Tickets
          </span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
            {isLoading ? <Skeleton className="h-7 w-12" /> : stats.open}
          </span>
          <span className="text-[11px] text-sky-600 font-medium">Pending or In-Progress</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Critical Faults
          </span>
          <span className="text-2xl font-extrabold text-rose-600 mt-1 block">
            {isLoading ? <Skeleton className="h-7 w-12" /> : stats.critical}
          </span>
          <span className="text-[11px] text-rose-600 font-medium">Immediate site response</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Resolved Today
          </span>
          <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
            {isLoading ? <Skeleton className="h-7 w-12" /> : stats.resolvedToday}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium">Customer OTP verified</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Avg Resolution
          </span>
          <span className="text-2xl font-extrabold text-solar-800 mt-1 block">
            {stats.avgResolution}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Target: &lt; 24 hrs SLA</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search ticket #, customer, fault, serial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-3.5 h-3.5" />}
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Priority Filter */}
          <div className="w-36">
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { label: 'All Priorities', value: 'ALL' },
                { label: 'Critical', value: 'CRITICAL' },
                { label: 'High', value: 'HIGH' },
                { label: 'Medium', value: 'MEDIUM' },
                { label: 'Low', value: 'LOW' },
              ]}
            />
          </div>

          {/* Status Filter */}
          <div className="w-36">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Open', value: 'OPEN' },
                { label: 'Assigned', value: 'ASSIGNED' },
                { label: 'In Progress', value: 'IN_PROGRESS' },
                { label: 'Resolved', value: 'RESOLVED' },
                { label: 'Closed', value: 'CLOSED' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No service tickets found"
          description={
            searchQuery
              ? `No tickets match the search query "${searchQuery}".`
              : 'There are currently no maintenance tickets matching your filters.'
          }
          actionLabel="Log New Ticket"
          onAction={() => setIsNewDrawerOpen(true)}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Fault Description</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Warranty Covered</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-mono text-xs font-bold text-slate-900">
                  <div className="flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ticket.ticketNumber}</span>
                  </div>
                  {ticket.serialNumber && (
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      SN: {ticket.serialNumber}
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  <div className="font-semibold text-slate-900 text-xs">{ticket.customerName}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-2.5 h-2.5" />
                    <span>{ticket.customerPhone}</span>
                  </div>
                </TableCell>

                <TableCell className="max-w-xs">
                  {ticket.faultCode && (
                    <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700 mr-1.5">
                      {ticket.faultCode}
                    </span>
                  )}
                  <span className="text-xs text-slate-700 line-clamp-2">
                    {ticket.faultDescription}
                  </span>
                </TableCell>

                <TableCell>
                  <Badge variant={getPriorityBadgeVariant(ticket.priority)} size="sm">
                    {ticket.priority}
                  </Badge>
                </TableCell>

                <TableCell>
                  <Badge variant={getStatusBadgeVariant(ticket.status)} size="sm" dot>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                </TableCell>

                <TableCell>
                  {ticket.isUnderWarranty ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Under Warranty
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      Not Covered
                    </span>
                  )}
                </TableCell>

                <TableCell className="text-xs">
                  {ticket.assignedTechnicianName ? (
                    <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{ticket.assignedTechnicianName}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Unassigned</span>
                  )}
                </TableCell>

                <TableCell className="text-xs text-slate-600">
                  {formatDate(ticket.createdAt)}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {(ticket.status === 'IN_PROGRESS' ||
                      ticket.status === 'ASSIGNED' ||
                      ticket.status === 'OPEN') && (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenResolveModal(ticket)}
                      >
                        Resolve
                      </Button>
                    )}

                    {ticket.status === 'RESOLVED' && (
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 justify-end">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                      </span>
                    )}

                    {ticket.status === 'CLOSED' && (
                      <span className="text-xs text-slate-500 font-medium">Closed</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* New Ticket Form Drawer */}
      <ServiceTicketFormDrawer
        isOpen={isNewDrawerOpen}
        onClose={() => {
          setIsNewDrawerOpen(false);
          setSearchParams({});
        }}
        onSuccess={() => refetch()}
        initialSerial={initialSerialParam}
      />

      {/* Resolve Ticket Modal */}
      <Modal
        isOpen={Boolean(resolvingTicket)}
        onClose={() => setResolvingTicket(null)}
        title={`Resolve Ticket — ${resolvingTicket?.ticketNumber}`}
        description={`Record site diagnostic resolution for ${resolvingTicket?.customerName}.`}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-slate-600">
              {resolvingTicket?.isUnderWarranty ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Covered by Warranty: Customer Charge ₹0
                </span>
              ) : (
                <span className="font-semibold text-slate-900">
                  Total Billable: {formatCurrency(totalCalculatedBill)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResolvingTicket(null)}
                disabled={isSubmittingResolve}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmResolve}
                isLoading={isSubmittingResolve}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirm Resolution & Close
              </Button>
            </div>
          </div>
        }
      >
        {resolvingTicket && (
          <div className="space-y-4">
            {/* Warranty Status Banner */}
            {resolvingTicket.isUnderWarranty ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  This repair is covered under warranty. All labor and parts are billed to OEM.
                </span>
                <Badge variant="emerald" size="sm">
                  ₹0 Invoice
                </Badge>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  This ticket is out of warranty. Enter parts and technician labour charges.
                </span>
                <Badge variant="rose" size="sm">
                  Customer Billable
                </Badge>
              </div>
            )}

            {/* Resolution Notes */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Resolution Notes & Corrective Actions <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Cleared E04 isolation fault. Re-crimped loose DC connector on String 2. System re-synchronized to grid."
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-sm rounded-lg border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-solar-500/20 focus:border-solar-600"
              />
            </div>

            {/* Parts Used Section */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Replacement Parts Replaced / Consumed
                </h4>
                <span className="text-[11px] text-slate-500">{partsList.length} parts listed</span>
              </div>

              {/* Add Part Row */}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    label="Part Description"
                    placeholder="e.g. 1000V DC Fuse 15A"
                    value={newPartName}
                    onChange={(e) => setNewPartName(e.target.value)}
                  />
                </div>
                <div className="w-28">
                  <Input
                    label="Unit Cost (₹)"
                    type="number"
                    placeholder="e.g. 450"
                    value={newPartCost}
                    onChange={(e) => setNewPartCost(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPart}
                  className="mb-0.5"
                >
                  Add
                </Button>
              </div>

              {/* Parts Listing */}
              {partsList.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {partsList.map((part, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                    >
                      <span className="font-medium text-slate-800">{part.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-700">
                          {formatCurrency(part.cost)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePart(idx)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Labour Charges (only billable if not warranty) */}
            {!resolvingTicket.isUnderWarranty && (
              <Input
                label="Technician Labour Charge (₹)"
                type="number"
                value={labourCost}
                onChange={(e) => setLabourCost(Number(e.target.value))}
                helperText="Standard technician site inspection fee"
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
