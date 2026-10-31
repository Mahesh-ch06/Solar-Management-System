import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Compass,
  CalendarPlus,
  Search,
  HardHat,
  Ruler,
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  AlertTriangle,
  Zap,
  Cable,
  Check,
  X,
  Clock,
} from 'lucide-react';
import { SurveyStatus } from '../../types/survey';
import { surveyService } from './services/surveyService';
import { SurveyFormDrawer } from './components/SurveyFormDrawer';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatCapacity } from '../../utils/formatters';
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

const STATUS_VARIANTS: Record<SurveyStatus, 'amber' | 'sky' | 'purple' | 'emerald' | 'rose'> = {
  PENDING: 'amber',
  SCHEDULED: 'sky',
  COMPLETED: 'purple',
  APPROVED: 'emerald',
  REJECTED: 'rose',
};

const STATUS_LABELS: Record<SurveyStatus, string> = {
  PENDING: 'Pending',
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const ROOF_TYPE_LABELS: Record<string, string> = {
  RCC_FLAT: 'RCC Flat',
  RCC_SLOPED: 'RCC Sloped',
  TIN_SHED: 'Tin Shed',
  TILE: 'Tiled',
  OTHER: 'Other',
};

const FILTER_STATUSES: Array<{ id: 'ALL' | SurveyStatus; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'SCHEDULED', label: 'Scheduled' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
];

export const SurveysPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | SurveyStatus>('ALL');

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Expanded rows state (survey IDs)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Inline approval / rejection modal / popover state
  const [activeApprovalId, setActiveApprovalId] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('Technical feasibility confirmed. Approved for final quotation.');
  const [activeRejectionId, setActiveRejectionId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch surveys
  const { data: surveys = [], isLoading, isError } = useQuery({
    queryKey: ['surveys'],
    queryFn: () => surveyService.getSurveys(),
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      surveyService.updateSurveyStatus(id, 'APPROVED', notes),
    onSuccess: (updated) => {
      showToast(
        'Survey Approved',
        `Site survey for ${updated.customerName} has been approved. Status transitioned to SURVEY_DONE.`,
        'success'
      );
      setActiveApprovalId(null);
      setApprovalNotes('');
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Approval failed';
      showToast('Action Failed', msg, 'error');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      surveyService.updateSurveyStatus(id, 'REJECTED', reason),
    onSuccess: (updated) => {
      showToast(
        'Survey Rejected',
        `Survey for ${updated.customerName} was marked as rejected.`,
        'warning'
      );
      setActiveRejectionId(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Rejection failed';
      showToast('Action Failed', msg, 'error');
    },
  });

  // Toggle row expansion
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filtered surveys
  const filteredSurveys = useMemo(() => {
    return surveys.filter((s) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.assignedTechnicianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.address.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        selectedStatus === 'ALL' || s.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [surveys, searchTerm, selectedStatus]);

  // Status counts for stats
  const stats = useMemo(() => {
    return {
      total: surveys.length,
      pending: surveys.filter((s) => s.status === 'PENDING').length,
      scheduled: surveys.filter((s) => s.status === 'SCHEDULED').length,
      completed: surveys.filter((s) => s.status === 'COMPLETED').length,
      approved: surveys.filter((s) => s.status === 'APPROVED').length,
      rejected: surveys.filter((s) => s.status === 'REJECTED').length,
    };
  }, [surveys]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-solar-800">
            <Compass className="w-4 h-4" />
            <span>Field Engineering</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Site Surveys</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Coordinate technician rooftop inspections, shadow-free area measurements, and DISCOM feasibility approvals.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            leftIcon={<CalendarPlus className="w-4 h-4" />}
            onClick={() => setIsDrawerOpen(true)}
          >
            Schedule New Survey
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setSelectedStatus('ALL')}
          className={cn(
            'p-3.5 rounded-xl border bg-white transition-all cursor-pointer select-none hover:shadow-xs',
            selectedStatus === 'ALL'
              ? 'border-solar-600 ring-2 ring-solar-500/20 shadow-xs'
              : 'border-slate-200'
          )}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">All Surveys</span>
            <Compass className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Total booked</div>
        </div>

        <div
          onClick={() => setSelectedStatus('PENDING')}
          className={cn(
            'p-3.5 rounded-xl border bg-white transition-all cursor-pointer select-none hover:shadow-xs',
            selectedStatus === 'PENDING'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
              : 'border-slate-200'
          )}
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-medium">Pending</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-900">{stats.pending}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Awaiting customer slot</div>
        </div>

        <div
          onClick={() => setSelectedStatus('SCHEDULED')}
          className={cn(
            'p-3.5 rounded-xl border bg-white transition-all cursor-pointer select-none hover:shadow-xs',
            selectedStatus === 'SCHEDULED'
              ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
              : 'border-slate-200'
          )}
        >
          <div className="flex items-center justify-between text-sky-700 mb-1">
            <span className="text-xs font-medium">Scheduled</span>
            <Calendar className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl font-bold text-sky-900">{stats.scheduled}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Technician dispatched</div>
        </div>

        <div
          onClick={() => setSelectedStatus('COMPLETED')}
          className={cn(
            'p-3.5 rounded-xl border bg-white transition-all cursor-pointer select-none hover:shadow-xs',
            selectedStatus === 'COMPLETED'
              ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
              : 'border-slate-200'
          )}
        >
          <div className="flex items-center justify-between text-purple-700 mb-1">
            <span className="text-xs font-medium">Completed</span>
            <FileCheck2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-purple-900">{stats.completed}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Ready for review</div>
        </div>

        <div
          onClick={() => setSelectedStatus('APPROVED')}
          className={cn(
            'p-3.5 rounded-xl border bg-white transition-all cursor-pointer select-none hover:shadow-xs',
            selectedStatus === 'APPROVED'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
              : 'border-slate-200'
          )}
        >
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-medium">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-900">{stats.approved}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Ready for quote</div>
        </div>

        <div
          onClick={() => setSelectedStatus('REJECTED')}
          className={cn(
            'p-3.5 rounded-xl border bg-white transition-all cursor-pointer select-none hover:shadow-xs',
            selectedStatus === 'REJECTED'
              ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
              : 'border-slate-200'
          )}
        >
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-xs font-medium">Rejected</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-900">{stats.rejected}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Unfeasible site</div>
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
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, technician, address..."
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

          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-800">{filteredSurveys.length}</span>{' '}
            {filteredSurveys.length === 1 ? 'survey' : 'surveys'}
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-500 mr-1 shrink-0">
            Filter Status:
          </span>
          {FILTER_STATUSES.map((pill) => {
            const isSelected = selectedStatus === pill.id;
            const count =
              pill.id === 'ALL'
                ? surveys.length
                : surveys.filter((s) => s.status === pill.id).length;

            return (
              <button
                key={pill.id}
                onClick={() => setSelectedStatus(pill.id)}
                className={cn(
                  'px-3 py-1 text-xs font-semibold rounded-full transition-all shrink-0 cursor-pointer flex items-center gap-1.5',
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <span>{pill.label}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                    isSelected
                      ? 'bg-amber-600/80 text-slate-950 font-extrabold'
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

      {/* Surveys Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-rose-600 font-medium">Failed to load surveys data.</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['surveys'] })}
            >
              Retry
            </Button>
          </div>
        ) : filteredSurveys.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No surveys found"
              description={
                searchTerm || selectedStatus !== 'ALL'
                  ? 'No surveys match your active filters. Try adjusting your search query.'
                  : 'No site surveys scheduled yet. Dispatch a technician to begin.'
              }
              actionLabel={searchTerm || selectedStatus !== 'ALL' ? 'Reset Filters' : 'Schedule Survey'}
              onAction={() => {
                if (searchTerm || selectedStatus !== 'ALL') {
                  setSearchTerm('');
                  setSelectedStatus('ALL');
                } else {
                  setIsDrawerOpen(true);
                }
              }}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[32px]"></TableHead>
                <TableHead className="w-[220px]">Customer & Address</TableHead>
                <TableHead className="w-[180px]">Technician</TableHead>
                <TableHead className="w-[130px]">Scheduled Date</TableHead>
                <TableHead className="w-[160px]">Roof Area (Sq Ft)</TableHead>
                <TableHead className="w-[130px]">Status</TableHead>
                <TableHead className="w-[130px]">Recommended</TableHead>
                <TableHead className="text-right w-[190px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSurveys.map((survey) => {
                const isExpanded = expandedRows.has(survey.id);
                const badgeVariant = STATUS_VARIANTS[survey.status] || 'slate';
                const isApproving = activeApprovalId === survey.id;
                const isRejecting = activeRejectionId === survey.id;

                return (
                  <React.Fragment key={survey.id}>
                    <TableRow
                      className={cn(
                        'transition-colors',
                        isExpanded ? 'bg-slate-50/70' : 'hover:bg-slate-50/50'
                      )}
                    >
                      {/* Expand/Collapse Toggle */}
                      <TableCell className="w-[32px] pl-3 pr-0">
                        <button
                          type="button"
                          onClick={() => toggleRow(survey.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                          title={isExpanded ? 'Collapse row details' : 'Expand row details'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-solar-800" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </TableCell>

                      {/* Customer */}
                      <TableCell>
                        <div className="font-semibold text-slate-900">
                          {survey.customerName}
                        </div>
                        <div
                          className="text-xs text-slate-500 truncate max-w-[200px]"
                          title={survey.address}
                        >
                          {survey.address}
                        </div>
                      </TableCell>

                      {/* Technician */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                            <HardHat className="w-3.5 h-3.5 text-solar-800" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-800">
                              {survey.assignedTechnicianName}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {survey.assignedTechnicianId}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Scheduled Date */}
                      <TableCell>
                        <div className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(survey.scheduledDate)}</span>
                        </div>
                        {survey.completedDate && (
                          <div className="text-[11px] text-emerald-600">
                            Done: {formatDate(survey.completedDate)}
                          </div>
                        )}
                      </TableCell>

                      {/* Roof Area */}
                      <TableCell>
                        <div className="text-xs font-semibold text-slate-800">
                          {survey.shadowFreeAreaSqFt} / {survey.totalRoofAreaSqFt} sq ft
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {ROOF_TYPE_LABELS[survey.roofType] || survey.roofType} • {survey.roofDirection}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge variant={badgeVariant} dot>
                          {STATUS_LABELS[survey.status]}
                        </Badge>
                      </TableCell>

                      {/* Recommended kW */}
                      <TableCell>
                        <span className="font-bold text-slate-900 text-sm">
                          {formatCapacity(survey.recommendedCapacityKW)}
                        </span>
                        <div className="text-[11px] text-slate-400">
                          {survey.structureFeasible ? 'Feasible' : 'Infeasible'}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* If status is COMPLETED or SCHEDULED, show Approve / Reject */}
                          {survey.status === 'COMPLETED' && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                className="px-2.5 py-1 text-xs"
                                leftIcon={<Check className="w-3 h-3" />}
                                onClick={() => {
                                  setActiveApprovalId(survey.id);
                                  setActiveRejectionId(null);
                                  setApprovalNotes(
                                    'Roof structural integrity & shadow-free area verified. Approved for quote generation.'
                                  );
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="px-2 py-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                                leftIcon={<X className="w-3 h-3" />}
                                onClick={() => {
                                  setActiveRejectionId(survey.id);
                                  setActiveApprovalId(null);
                                  setRejectionReason('Structural constraints / shadow obstruction.');
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          {survey.status === 'SCHEDULED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="px-2.5 py-1 text-xs text-purple-700 hover:bg-purple-50 border-purple-200"
                              onClick={() => {
                                surveyService
                                  .updateSurveyStatus(
                                    survey.id,
                                    'COMPLETED',
                                    'Site survey inspection completed on rooftop.'
                                  )
                                  .then(() => {
                                    showToast(
                                      'Survey Completed',
                                      'Survey marked as completed and ready for engineering signoff.',
                                      'info'
                                    );
                                    queryClient.invalidateQueries({ queryKey: ['surveys'] });
                                  });
                              }}
                            >
                              Mark Completed
                            </Button>
                          )}

                          {/* Expand Details button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleRow(survey.id)}
                            className="px-2 py-1 text-xs text-slate-600"
                          >
                            {isExpanded ? 'Hide' : 'Details'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Inline Approval Confirmation Row */}
                    {isApproving && (
                      <TableRow className="bg-emerald-50/70 border-b border-emerald-200">
                        <TableCell colSpan={8} className="p-4">
                          <div className="max-w-2xl bg-white p-4 rounded-xl border border-emerald-200 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Confirm Site Survey Approval for {survey.customerName}</span>
                              </div>
                              <button
                                onClick={() => setActiveApprovalId(null)}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="text-xs text-slate-600">
                              Approving will sign off on{' '}
                              <span className="font-semibold text-slate-900">
                                {survey.recommendedCapacityKW} kW
                              </span>{' '}
                              installation and transition customer to{' '}
                              <span className="font-semibold text-slate-900">SURVEY_DONE</span> for quotation drafting.
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-700 block mb-1">
                                Engineering Approval Notes
                              </label>
                              <input
                                type="text"
                                value={approvalNotes}
                                onChange={(e) => setApprovalNotes(e.target.value)}
                                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                placeholder="Add confirmation remarks..."
                              />
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setActiveApprovalId(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                variant="primary"
                                isLoading={approveMutation.isPending}
                                onClick={() =>
                                  approveMutation.mutate({
                                    id: survey.id,
                                    notes: approvalNotes,
                                  })
                                }
                              >
                                Confirm & Approve
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Inline Rejection Confirmation Row */}
                    {isRejecting && (
                      <TableRow className="bg-rose-50/70 border-b border-rose-200">
                        <TableCell colSpan={8} className="p-4">
                          <div className="max-w-2xl bg-white p-4 rounded-xl border border-rose-200 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-rose-800 font-semibold text-sm">
                                <AlertTriangle className="w-4 h-4 text-rose-600" />
                                <span>Reject Site Survey Feasibility</span>
                              </div>
                              <button
                                onClick={() => setActiveRejectionId(null)}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="text-xs text-slate-600">
                              Please specify the engineering or DISCOM constraint that renders this site unfeasible.
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-700 block mb-1">
                                Rejection Reason *
                              </label>
                              <input
                                type="text"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                                placeholder="e.g. Roof unable to support structure weight / heavy shading"
                              />
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setActiveRejectionId(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                isLoading={rejectMutation.isPending}
                                disabled={!rejectionReason.trim()}
                                onClick={() =>
                                  rejectMutation.mutate({
                                    id: survey.id,
                                    reason: rejectionReason,
                                  })
                                }
                              >
                                Confirm Rejection
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Expanded Details Row */}
                    {isExpanded && (
                      <TableRow className="bg-slate-50/80">
                        <TableCell colSpan={8} className="p-4">
                          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              {/* Physical Rooftop Metrics */}
                              <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-[11px] text-solar-800">
                                  <Ruler className="w-3.5 h-3.5" />
                                  <span>Roof Dimensions & Tilt</span>
                                </div>
                                <div className="space-y-1 text-slate-600">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Roof Slab:</span>
                                    <span className="font-semibold text-slate-800">
                                      {ROOF_TYPE_LABELS[survey.roofType] || survey.roofType}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Total Area:</span>
                                    <span className="font-semibold text-slate-800">
                                      {survey.totalRoofAreaSqFt} sq ft
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Shadow-Free Area:</span>
                                    <span className="font-semibold text-emerald-700">
                                      {survey.shadowFreeAreaSqFt} sq ft
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Azimuth / Direction:</span>
                                    <span className="font-semibold text-slate-800">
                                      {survey.roofDirection}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Tilt Angle:</span>
                                    <span className="font-semibold text-slate-800">
                                      {survey.tiltAngleDeg}° from horizontal
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Electrical & Cabling */}
                              <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-[11px] text-solar-800">
                                  <Cable className="w-3.5 h-3.5" />
                                  <span>Cabling & Interconnection</span>
                                </div>
                                <div className="space-y-1 text-slate-600">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">DC Cable Run:</span>
                                    <span className="font-semibold text-slate-800">
                                      {survey.dcCableDistanceMeters} meters
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">AC Cable Run:</span>
                                    <span className="font-semibold text-slate-800">
                                      {survey.acCableDistanceMeters} meters
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Grid Connection:</span>
                                    <span
                                      className={cn(
                                        'font-semibold',
                                        survey.gridConnectionSuitable
                                          ? 'text-emerald-700'
                                          : 'text-rose-700'
                                      )}
                                    >
                                      {survey.gridConnectionSuitable ? 'Suitable' : 'Unsuitable'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Structure Feasibility:</span>
                                    <span
                                      className={cn(
                                        'font-semibold',
                                        survey.structureFeasible
                                          ? 'text-emerald-700'
                                          : 'text-rose-700'
                                      )}
                                    >
                                      {survey.structureFeasible ? 'Feasible' : 'Infeasible'}
                                    </span>
                                  </div>
                                  {survey.gridConnectionNotes && (
                                    <div className="pt-1 text-[11px] text-slate-500 italic">
                                      &ldquo;{survey.gridConnectionNotes}&rdquo;
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Sizing & Engineering Status */}
                              <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-[11px] text-solar-800">
                                  <Zap className="w-3.5 h-3.5" />
                                  <span>Engineering Signoff</span>
                                </div>
                                <div className="space-y-1 text-slate-600">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Recommended kW:</span>
                                    <span className="font-bold text-slate-900 text-sm">
                                      {formatCapacity(survey.recommendedCapacityKW)}
                                    </span>
                                  </div>
                                  {survey.approvedBy && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Approved By:</span>
                                      <span className="font-semibold text-emerald-800">
                                        {survey.approvedBy}
                                      </span>
                                    </div>
                                  )}
                                  {survey.approvalNotes && (
                                    <div className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                                      <span className="font-semibold">Approval Remarks:</span>{' '}
                                      {survey.approvalNotes}
                                    </div>
                                  )}
                                  {survey.rejectionReason && (
                                    <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                                      <span className="font-semibold">Rejection Reason:</span>{' '}
                                      {survey.rejectionReason}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Technician Notes Bar */}
                            {survey.surveyNotes && (
                              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                                <span className="font-bold text-slate-900 mr-1">
                                  Surveyor Notes:
                                </span>
                                {survey.surveyNotes}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Survey Form Drawer */}
      <SurveyFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};
