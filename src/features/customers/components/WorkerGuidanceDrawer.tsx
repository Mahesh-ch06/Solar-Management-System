import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer, EnquiryStatus } from '../../../types/customer';
import { Drawer } from '../../../components/ui/Drawer';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../context/ToastContext';
import {
  Compass,
  Lock,
  Mail,
  Send,
  ExternalLink,
  ShieldCheck,
  IndianRupee,
  Check,
} from 'lucide-react';

export interface MilestoneStepGuide {
  index: number;
  title: string;
  desc: string;
  status: EnquiryStatus;
  pageRoute: string;
  pageLabel: string;
  guidanceText: string;
}

const WORKER_MILESTONE_STEPS: MilestoneStepGuide[] = [
  {
    index: 1,
    title: 'Inquiry Registered',
    desc: 'Rooftop consultation booked & site engineer assigned',
    status: 'NEW',
    pageRoute: '/customers',
    pageLabel: 'Customers & CRM',
    guidanceText:
      'Review preliminary rooftop load requirements, assign lead field engineer, and initiate contact with customer.',
  },
  {
    index: 2,
    title: 'Site Survey Completed',
    desc: 'Shadow analysis & 3D rooftop measurements recorded',
    status: 'SURVEY_DONE',
    pageRoute: '/surveys',
    pageLabel: 'Site Surveys',
    guidanceText:
      'Perform on-site drone/LIDAR shadow analysis, record usable roof area (sq.ft), structural load capacity, and upload site photos.',
  },
  {
    index: 3,
    title: 'Quotation & BOM Approved',
    desc: 'System sized, quotation finalized & subsidy calculated',
    status: 'QUOTATION_SENT',
    pageRoute: '/quotations',
    pageLabel: 'Quotations & BOM',
    guidanceText:
      'Size solar PV module array & inverter, apply central PM Surya Ghar DBT subsidy (up to ₹78,000), and get customer quotation approval.',
  },
  {
    index: 4,
    title: 'DISCOM Feasibility Approval',
    desc: 'National portal paperwork filed & net meter sanction received',
    status: 'CONVERTED',
    pageRoute: '/finance',
    pageLabel: 'Orders & Finance',
    guidanceText:
      'File application on National Rooftop Solar Portal, secure DISCOM feasibility sanction, and collect booking advance payment from customer.',
  },
  {
    index: 5,
    title: 'Rooftop Installation',
    desc: 'Module mounting, inverter electrical wiring & safety earthing',
    status: 'CONVERTED',
    pageRoute: '/installations',
    pageLabel: 'Installations & Dispatch',
    guidanceText:
      'Dispatch Tier-1 modules and solar inverter from warehouse (/dispatch), complete roof mounting structures, AC/DC wiring, and safety copper earthing.',
  },
  {
    index: 6,
    title: 'Commissioned & Subsidy DBT',
    desc: 'Net meter energized, grid synchronized & central subsidy released',
    status: 'CONVERTED',
    pageRoute: '/warranties',
    pageLabel: 'Warranties & Handover',
    guidanceText:
      'DISCOM bi-directional net-meter energization, plant synchronized with power grid. Admin issues official 25-year panel and 10-year inverter digital warranty certificates!',
  },
];

interface WorkerGuidanceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onAdvanceMilestone: (customer: Customer, newStepIdx: number) => Promise<void>;
  onSendMilestoneEmail: (customer: Customer, step: MilestoneStepGuide) => Promise<void>;
  onOpenAdvanceModal: (customer: Customer) => void;
  onIssueWarranty: (customer: Customer) => Promise<void>;
}

export const WorkerGuidanceDrawer: React.FC<WorkerGuidanceDrawerProps> = ({
  isOpen,
  onClose,
  customer,
  onAdvanceMilestone,
  onSendMilestoneEmail,
  onOpenAdvanceModal,
  onIssueWarranty,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isProcessingStep, setIsProcessingStep] = useState<number | null>(null);
  const [isIssuingWarranty, setIsIssuingWarranty] = useState(false);

  if (!customer) return null;

  // Derive current active milestone index (0 to 5)
  const calculateCurrentStep = (): number => {
    if (customer.milestoneStep !== undefined && customer.milestoneStep >= 0 && customer.milestoneStep <= 5) {
      return customer.milestoneStep;
    }
    switch (customer.status) {
      case 'QUEUED':
      case 'NEW':
      case 'CONTACTED':
        return 0;
      case 'SURVEY_SCHEDULED':
      case 'SURVEY_DONE':
        return 1;
      case 'QUOTATION_SENT':
        return 2;
      case 'CONVERTED':
        return 3;
      case 'CLOSED_LOST':
        return 0;
      default:
        return 0;
    }
  };

  const currentStep = calculateCurrentStep();
  const progressPercent = Math.round(((currentStep + 1) / WORKER_MILESTONE_STEPS.length) * 100);

  const handleStepAction = async (step: MilestoneStepGuide, idx: number) => {
    // Sequential validation
    if (idx > currentStep + 1) {
      showToast(
        'Sequential Step Required',
        `Milestones must be completed in order. Please finish Step ${currentStep + 1} before proceeding to Step ${idx + 1}.`,
        'warning'
      );
      return;
    }

    try {
      setIsProcessingStep(idx);
      if (idx === currentStep + 1) {
        await onAdvanceMilestone(customer, idx);
      }
      await onSendMilestoneEmail(customer, step);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      showToast('Error', msg, 'error');
    } finally {
      setIsProcessingStep(null);
    }
  };

  const handleAdminIssueWarranty = async () => {
    try {
      setIsIssuingWarranty(true);
      await onIssueWarranty(customer);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to issue warranty';
      showToast('Warranty Issuance Error', msg, 'error');
    } finally {
      setIsIssuingWarranty(false);
    }
  };

  const handleNavigateToPage = (route: string) => {
    onClose();
    navigate(route);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Worker Project Execution Guidance"
      description="Step-by-step workflow tracking & direct department navigation"
      width="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Compass className="w-3.5 h-3.5 text-amber-600" />
            <span>Strict sequential milestone workflow enforced.</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="border-slate-300 text-slate-700">
            Close Guidance
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pb-6 text-slate-900">
        {/* Project Header Overview Card */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-md space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">{customer.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  {customer.requiredCapacityKW || 3} kW {customer.systemType === 'ON_GRID' ? 'On-Grid' : 'Off-Grid'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {customer.phone} • {customer.city}, {customer.pincode}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Assigned Staff</span>
              <p className="text-xs font-bold text-amber-400">{customer.assignedTo || 'Unassigned'}</p>
            </div>
          </div>

          {/* Sequential Progress Bar */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">
                Milestone Progress: Step {currentStep + 1} of {WORKER_MILESTONE_STEPS.length}
              </span>
              <span className="font-mono text-amber-400 font-bold">{progressPercent}% Completed</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Action Bar for Workers */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <button
            type="button"
            onClick={() => onOpenAdvanceModal(customer)}
            className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-950 font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
          >
            <IndianRupee className="w-4 h-4 text-emerald-700" />
            <span>Send Advance Payment Mail (EmailJS)</span>
          </button>

          <button
            type="button"
            onClick={handleAdminIssueWarranty}
            disabled={isIssuingWarranty}
            className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-amber-950 font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>{isIssuingWarranty ? 'Issuing Certificate...' : 'Admin: Issue Warranty Mail (EmailJS)'}</span>
          </button>
        </div>

        {/* 6 Sequential Milestones with Worker Guidance & Dedicated Pages */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sequential Milestone Execution Plan
            </h3>
            <span className="text-[11px] text-slate-400">Strict step-by-step handoff</span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {WORKER_MILESTONE_STEPS.map((step, idx) => {
              const isDone = idx < currentStep;
              const isCurrent = idx === currentStep;
              const isNext = idx === currentStep + 1;
              const isLocked = idx > currentStep + 1;
              const isProcessing = isProcessingStep === idx;

              return (
                <div key={step.index} className="relative">
                  {/* Step Status Node Indicator */}
                  <div
                    className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shadow-xs transition-colors ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-100 font-extrabold'
                        : isNext
                        ? 'bg-sky-100 text-sky-800 border-2 border-sky-400'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : isLocked ? (
                      <Lock className="w-3 h-3 text-slate-400" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Step Card */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-amber-50/40 border-amber-300 shadow-sm'
                        : isDone
                        ? 'bg-white border-slate-200'
                        : isNext
                        ? 'bg-sky-50/30 border-sky-300'
                        : 'bg-slate-50/70 border-slate-200 opacity-60'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Step {idx + 1}: {step.title}
                        </span>
                        {isDone && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Mail className="w-2.5 h-2.5 text-emerald-600" />
                            Notified through mail
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                            Current Active Stage
                          </span>
                        )}
                        {isNext && (
                          <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200">
                            Next Milestone
                          </span>
                        )}
                        {isLocked && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">
                            <Lock className="w-2.5 h-2.5" />
                            Locked
                          </span>
                        )}
                      </div>

                      {/* Link to Dedicated Work Page */}
                      <button
                        type="button"
                        onClick={() => handleNavigateToPage(step.pageRoute)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                        title={`Navigate to ${step.pageLabel} page`}
                      >
                        <span>Open {step.pageLabel}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 font-medium">{step.desc}</p>

                    {/* Worker Instructions & Guidance */}
                    <div className="mt-2.5 p-2.5 rounded-lg bg-white/80 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                      <span className="font-bold text-slate-900">Worker Guidance: </span>
                      {step.guidanceText}
                    </div>

                    {/* Actions Row */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                      <div>
                        {/* Step-specific helper buttons */}
                        {idx === 3 && (
                          <button
                            type="button"
                            onClick={() => onOpenAdvanceModal(customer)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                          >
                            <IndianRupee className="w-3 h-3 text-emerald-600" />
                            Send Advance Receipt Mail
                          </button>
                        )}

                        {idx === 5 && (
                          <button
                            type="button"
                            onClick={handleAdminIssueWarranty}
                            disabled={isIssuingWarranty}
                            className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer disabled:opacity-50"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                            {isIssuingWarranty ? 'Issuing Warranty...' : 'Admin: Issue Official Warranty Certificate'}
                          </button>
                        )}
                      </div>

                      {/* Primary Email / Advance Button */}
                      <div>
                        {isDone || isCurrent ? (
                          <Button
                            size="sm"
                            variant="outline"
                            isLoading={isProcessing}
                            leftIcon={<Mail className="w-3 h-3 text-amber-600" />}
                            onClick={() => handleStepAction(step, idx)}
                            className="border-amber-300 text-slate-800 text-xs font-semibold hover:bg-amber-50"
                          >
                            Resend Step Email (EmailJS)
                          </Button>
                        ) : isNext ? (
                          <Button
                            size="sm"
                            variant="primary"
                            isLoading={isProcessing}
                            leftIcon={<Send className="w-3 h-3" />}
                            onClick={() => handleStepAction(step, idx)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                          >
                            Advance to Step {idx + 1} & Send Email (EmailJS)
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium inline-flex items-center gap-1 select-none cursor-not-allowed">
                            <Lock className="w-3 h-3 text-slate-300" />
                            Locked (Complete Step {idx} first)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Drawer>
  );
};
