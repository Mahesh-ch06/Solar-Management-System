import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { installationService } from './services/installationService';
import { InstallationJob, InstallationStage } from '../../types/installation';
import { CommissioningDrawer } from './components/CommissioningDrawer';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchInput } from '../../components/ui/FormControls';
import { useToast } from '../../context/ToastContext';
import {
  Sun,
  MapPin,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Play,
  FileCheck,
  Star,
} from 'lucide-react';

const stageConfig: Record<InstallationStage, { label: string; variant: 'sky' | 'amber' | 'purple' | 'emerald' | 'slate' }> = {
  SCHEDULED: { label: 'Scheduled', variant: 'sky' },
  MATERIAL_STAGED: { label: 'Material Staged', variant: 'amber' },
  IN_PROGRESS: { label: 'In Progress', variant: 'amber' },
  TESTING: { label: 'Testing & Sync', variant: 'purple' },
  COMMISSIONED: { label: 'Commissioned', variant: 'emerald' },
};

export const InstallationsPage: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobForCommissioning, setSelectedJobForCommissioning] = useState<InstallationJob | null>(null);
  const [selectedJobForReport, setSelectedJobForReport] = useState<InstallationJob | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['installationJobs'],
    queryFn: () => installationService.getInstallationJobs(),
  });

  const jobs = response?.data || [];

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: InstallationStage }) =>
      installationService.updateJobStage(id, stage),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['installationJobs'] });
      showToast('Stage Updated', `Job moved to ${stageConfig[variables.stage].label}`, 'info');
    },
  });

  const filteredJobs = jobs.filter((job) => {
    const matchesFilter = activeFilter === 'ALL' || job.stage === activeFilter;
    const matchesSearch =
      job.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.jobCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.leadTechnicianName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.siteAddress.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const scheduledCount = jobs.filter((j) => j.stage === 'SCHEDULED').length;
  const inProgressCount = jobs.filter((j) => j.stage === 'IN_PROGRESS' || j.stage === 'MATERIAL_STAGED' || j.stage === 'TESTING').length;
  const commissionedCount = jobs.filter((j) => j.stage === 'COMMISSIONED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Rooftop Installation & Commissioning
            </h1>
            <Badge variant="emerald" size="sm">
              <Sun className="w-3.5 h-3.5 mr-1" />
              Field Execution
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch verification, on-roof assembly, electrical tests, customer digital signature & ICR generation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              showToast('Technician Alert', 'Broadcast notification sent to on-field crews', 'info');
            }}
          >
            Crew Dispatch Map
          </Button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Active Jobs</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{jobs.length}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Total projects on roster</span>
        </div>
        <div className="bg-white rounded-xl border border-amber-200/80 bg-amber-50/20 p-4">
          <p className="text-xs font-semibold text-amber-800 uppercase">In Progress On Roof</p>
          <p className="text-2xl font-bold text-amber-900 mt-1">{inProgressCount}</p>
          <span className="text-[11px] text-amber-700 mt-0.5 block">Currently undergoing assembly</span>
        </div>
        <div className="bg-white rounded-xl border border-sky-200/80 bg-sky-50/20 p-4">
          <p className="text-xs font-semibold text-sky-800 uppercase">Scheduled</p>
          <p className="text-2xl font-bold text-sky-900 mt-1">{scheduledCount}</p>
          <span className="text-[11px] text-sky-700 mt-0.5 block">Materials dispatched</span>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200/80 bg-emerald-50/20 p-4">
          <p className="text-xs font-semibold text-emerald-800 uppercase">Commissioned (Oct)</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{commissionedCount}</p>
          <span className="text-[11px] text-emerald-700 mt-0.5 block">Signed by customer & energized</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: 'ALL', label: 'All Jobs', count: jobs.length },
            { key: 'SCHEDULED', label: 'Scheduled', count: scheduledCount },
            { key: 'IN_PROGRESS', label: 'In Progress', count: inProgressCount },
            { key: 'COMMISSIONED', label: 'Commissioned', count: commissionedCount },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                activeFilter === tab.key
                  ? 'bg-solar-800 text-white border-solar-800 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search customer, job #, technician..."
          />
        </div>
      </div>

      {/* Jobs Listing */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          icon={Sun}
          title="No installation jobs found"
          description="Try clearing your search query or switching the stage filter tab."
          actionLabel="View All Jobs"
          onAction={() => {
            setActiveFilter('ALL');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const stage = stageConfig[job.stage] || { label: job.stage, variant: 'slate' };
            const isCommissioned = job.stage === 'COMMISSIONED';

            return (
              <Card key={job.id} hoverable className="p-5 transition-all">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Job Info */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {job.jobCode}
                      </span>
                      <Badge variant={stage.variant} size="sm" dot>
                        {stage.label}
                      </Badge>
                      <Badge variant="solar" size="sm">
                        {job.capacityKW} kW {job.systemType}
                      </Badge>
                      {isCommissioned && (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Report: {job.completionReportNumber}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900">{job.customerName}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {job.siteAddress}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          Dates: {job.scheduledStartDate} to {job.scheduledEndDate}
                        </span>
                      </div>
                    </div>

                    {/* Technical Telemetry Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        Lead: {job.leadTechnicianName}
                      </span>
                      {job.checklist.dcStringVocVolts > 0 && (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-600" />
                          Voc: {job.checklist.dcStringVocVolts}V
                        </span>
                      )}
                      {job.checklist.earthResistanceOhms > 0 && (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                          Earth: {job.checklist.earthResistanceOhms}Ω
                        </span>
                      )}
                      {job.checklist.generationTestWatts > 0 && (
                        <span className="bg-solar-50 text-solar-900 border border-solar-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                          <Sun className="w-3 h-3 text-solar-700" />
                          Gen: {(job.checklist.generationTestWatts / 1000).toFixed(2)} kW
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {job.customerRating && (
                      <div className="flex items-center gap-1">
                        <div className="flex text-amber-400">
                          {Array.from({ length: job.customerRating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-slate-700">Verified Signoff</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {job.stage === 'SCHEDULED' && (
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Play className="w-3.5 h-3.5" />}
                          onClick={() =>
                            updateStageMutation.mutate({ id: job.id, stage: 'IN_PROGRESS' })
                          }
                        >
                          Start On-Site Work
                        </Button>
                      )}

                      {job.stage === 'IN_PROGRESS' && (
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                          onClick={() => setSelectedJobForCommissioning(job)}
                        >
                          Complete & Signoff
                        </Button>
                      )}

                      {isCommissioned && (
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<FileCheck className="w-3.5 h-3.5 text-emerald-600" />}
                          onClick={() => setSelectedJobForReport(job)}
                        >
                          View ICR Report
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Commissioning Drawer */}
      <CommissioningDrawer
        job={selectedJobForCommissioning}
        isOpen={Boolean(selectedJobForCommissioning)}
        onClose={() => setSelectedJobForCommissioning(null)}
        onSubmitCommissioning={async (jobId, checklist, signature, rating, feedback) => {
          await installationService.submitCommissioning(jobId, checklist, signature, rating, feedback);
          queryClient.invalidateQueries({ queryKey: ['installationJobs'] });
        }}
      />

      {/* Printable Installation Completion Report (ICR) Modal */}
      {selectedJobForReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-fade-in max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-solar-800 text-amber-400 flex items-center justify-center">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">SunPower Solutions</h3>
                  <p className="text-[10px] text-slate-400">Installation Completion Report (ICR)</p>
                </div>
              </div>
              <Badge variant="emerald" size="sm">
                ENERGIZED & VERIFIED
              </Badge>
            </div>

            {/* ICR Details */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Report Number:</span>
                <span className="font-mono font-bold text-slate-800">{selectedJobForReport.completionReportNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Name:</span>
                <span className="font-semibold text-slate-800">{selectedJobForReport.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Installed Capacity:</span>
                <span className="font-semibold text-solar-800">{selectedJobForReport.capacityKW} kW ({selectedJobForReport.systemType})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lead Field Engineer:</span>
                <span className="text-slate-800">{selectedJobForReport.leadTechnicianName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Commissioning Timestamp:</span>
                <span className="text-slate-800">{selectedJobForReport.commissionedAt || '2026-10-29 17:00'}</span>
              </div>
            </div>

            {/* Checklist summary */}
            <div className="space-y-1.5 text-xs">
              <h4 className="font-bold text-slate-700 uppercase text-[10px]">Electrical Test Verification</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <p className="text-[10px] text-slate-400">DC String Voc</p>
                  <p className="font-bold text-slate-800">{selectedJobForReport.checklist.dcStringVocVolts} V</p>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <p className="text-[10px] text-slate-400">Earth Resistance</p>
                  <p className="font-bold text-emerald-700">{selectedJobForReport.checklist.earthResistanceOhms} Ω (&lt; 5Ω)</p>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <p className="text-[10px] text-slate-400">Power Generated</p>
                  <p className="font-bold text-solar-800">{(selectedJobForReport.checklist.generationTestWatts / 1000).toFixed(2)} kW</p>
                </div>
              </div>
            </div>

            {/* Signature Block */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Customer Acceptance:</span>
                <span className="text-xs font-semibold text-slate-800">{selectedJobForReport.customerSignature || 'Digitally Signed'}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Customer Rating:</span>
                <span className="text-xs font-bold text-amber-500">★★★★★ ({selectedJobForReport.customerRating}/5)</span>
              </div>
            </div>

            {/* Close actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                Print ICR Report
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedJobForReport(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
