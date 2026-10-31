import React, { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer } from '../../../components/ui/Drawer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { quotationSchema, QuotationFormData } from '../../../utils/validators';
import { calculateBOM, calculateQuotationTotals } from '../../../utils/bomCalculator';
import { formatCurrency } from '../../../utils/formatters';
import { quotationService } from '../services/quotationService';
import { useToast } from '../../../context/ToastContext';
import {
  AlertTriangle,
  CheckCircle2,
  Zap,
  Calculator,
  Calendar,
  Layers,
  FileText,
} from 'lucide-react';

export interface QuotationBuilderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCustomerId?: string;
}

const getDefaultValidUntil = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
};

export const QuotationBuilderDrawer: React.FC<QuotationBuilderDrawerProps> = ({
  isOpen,
  onClose,
  defaultCustomerId,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: quotationService.getCustomers,
    enabled: isOpen,
  });

  const { data: surveys = [] } = useQuery({
    queryKey: ['surveys'],
    queryFn: quotationService.getSurveys,
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      customerId: defaultCustomerId || '',
      surveyId: '',
      capacityKW: 3,
      systemType: 'ON_GRID',
      subsidyAmount: 78000,
      discountAmount: 0,
      advancePaid: 25000,
      validUntil: getDefaultValidUntil(),
      notes: '',
      gstPercent: 12,
    },
  });

  // Watch form fields for dynamic calculations
  const selectedCustomerId = watch('customerId');
  const capacityKW = watch('capacityKW') || 3;
  const systemType = watch('systemType') || 'ON_GRID';
  const subsidyAmount = Number(watch('subsidyAmount')) || 0;
  const discountAmount = Number(watch('discountAmount')) || 0;
  const advancePaid = Number(watch('advancePaid')) || 0;
  const gstPercent = watch('gstPercent') ?? 12;

  const approvedSurvey = useMemo(
    () => surveys.find((s) => s.customerId === selectedCustomerId && s.status === 'APPROVED'),
    [surveys, selectedCustomerId]
  );

  // Sync survey ID and recommended values when customer changes
  useEffect(() => {
    if (approvedSurvey) {
      setValue('surveyId', approvedSurvey.id);
      if (approvedSurvey.recommendedCapacityKW) {
        setValue('capacityKW', Math.min(5, Math.max(1, approvedSurvey.recommendedCapacityKW)));
      }
    } else {
      setValue('surveyId', '');
    }
  }, [approvedSurvey, setValue]);

  // Adjust default subsidy when capacity or system type changes
  const handleSystemOrCapacityChange = (newCapacity: number, newType: 'ON_GRID' | 'OFF_GRID') => {
    setValue('capacityKW', newCapacity);
    setValue('systemType', newType);
    if (newType === 'OFF_GRID') {
      setValue('subsidyAmount', 0);
    } else {
      if (newCapacity === 1) setValue('subsidyAmount', 30000);
      else if (newCapacity === 2) setValue('subsidyAmount', 60000);
      else setValue('subsidyAmount', 78000);
    }
  };

  // Automated BOM Calculation
  const bomItems = useMemo(() => {
    return calculateBOM(capacityKW, systemType);
  }, [capacityKW, systemType]);

  // Financial Ledger Calculation
  const { subtotal, gstAmount, totalAmount } = useMemo(() => {
    return calculateQuotationTotals(bomItems, gstPercent, subsidyAmount, discountAmount);
  }, [bomItems, gstPercent, subsidyAmount, discountAmount]);

  const balanceAmount = Math.max(0, totalAmount - advancePaid);

  const createMutation = useMutation({
    mutationFn: (data: QuotationFormData) => quotationService.addQuotation(data),
    onSuccess: (newQuote) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      showToast(
        'Quotation Created',
        `Quotation ${newQuote.quotationNumber} for ${newQuote.customerName} generated successfully.`,
        'success'
      );
      reset();
      onClose();
    },
    onError: (err: Error) => {
      showToast('Creation Failed', err.message || 'Could not generate quotation.', 'error');
    },
  });

  const onSubmit = (data: QuotationFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Quotation"
      description="Configure solar system sizing, automated BOM, pricing and customer subsidies"
      width="lg"
      className="max-w-[620px]"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs">
            <span className="text-slate-500">Net Payable: </span>
            <span className="font-bold text-solar-900 text-sm">
              {formatCurrency(totalAmount)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              form="quotation-builder-form"
              isLoading={createMutation.isPending}
            >
              Generate Quotation
            </Button>
          </div>
        </div>
      }
    >
      <form
        id="quotation-builder-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* Step 1: Customer & Survey Verification */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
            <Layers className="w-4 h-4 text-solar-700" />
            <span>Step 1: Customer & Site Assessment</span>
          </div>

          <div className="space-y-1">
            <Select
              label="Select Customer *"
              error={errors.customerId?.message}
              options={[
                { label: '-- Select customer from directory --', value: '' },
                ...customers.map((c) => ({
                  label: `${c.name} (${c.city} • ${c.phone})`,
                  value: c.id,
                })),
              ]}
              {...register('customerId')}
            />
          </div>

          {/* Survey Verification Banner */}
          {selectedCustomerId && (
            <div>
              {approvedSurvey ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Site Survey Approved (#{approvedSurvey.id})</p>
                    <p className="text-emerald-700 mt-0.5">
                      Recommended: {approvedSurvey.recommendedCapacityKW} kW • Roof:{' '}
                      {approvedSurvey.roofType.replace('_', ' ')} • Unshaded Area:{' '}
                      {approvedSurvey.shadowFreeAreaSqFt} sq ft.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start gap-2.5 animate-fade-in">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Notice: No Approved Site Survey</p>
                    <p className="text-amber-700 mt-0.5 leading-relaxed">
                      This customer does not have an approved site survey on file yet. You may still
                      proceed with generating this draft estimate.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: System Sizing & Architecture */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
            <Zap className="w-4 h-4 text-solar-700" />
            <span>Step 2: Capacity & System Architecture</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Capacity Selector (1-5 kW) */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                System Capacity (kW) *
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((kw) => {
                  const isSelected = capacityKW === kw;
                  return (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => handleSystemOrCapacityChange(kw, systemType)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all text-center ${
                        isSelected
                          ? 'bg-solar-800 text-white border-solar-800 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {kw} kW
                    </button>
                  );
                })}
              </div>
              {errors.capacityKW && (
                <p className="text-xs text-rose-600 mt-1">{errors.capacityKW.message}</p>
              )}
            </div>

            {/* System Type Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                System Architecture *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSystemOrCapacityChange(capacityKW, 'ON_GRID')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                    systemType === 'ON_GRID'
                      ? 'bg-solar-50 border-solar-600 text-solar-900 ring-1 ring-solar-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  On-Grid (Net Meter)
                </button>
                <button
                  type="button"
                  onClick={() => handleSystemOrCapacityChange(capacityKW, 'OFF_GRID')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                    systemType === 'OFF_GRID'
                      ? 'bg-solar-50 border-solar-600 text-solar-900 ring-1 ring-solar-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Off-Grid (Battery)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Automated Bill of Materials (BOM) Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Calculator className="w-4 h-4 text-solar-700" />
              <span>Generated Bill of Materials (BOM)</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Read-Only • Auto Computed ({bomItems.length} Items)
            </span>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-56 overflow-y-auto bg-slate-50/50">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100/90 text-slate-600 sticky top-0 border-b border-slate-200 z-10">
                <tr>
                  <th className="py-2 px-2.5 font-semibold">Item Name</th>
                  <th className="py-2 px-2 font-semibold">Category</th>
                  <th className="py-2 px-2 font-semibold text-center">Qty</th>
                  <th className="py-2 px-2 font-semibold text-center">Unit</th>
                  <th className="py-2 px-2 font-semibold text-right">Unit Price</th>
                  <th className="py-2 px-2.5 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 bg-white">
                {bomItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="py-1.5 px-2.5 font-medium text-slate-800 max-w-[170px] truncate">
                      {item.name}
                    </td>
                    <td className="py-1.5 px-2 text-slate-500 text-[11px] whitespace-nowrap">
                      {item.category}
                    </td>
                    <td className="py-1.5 px-2 text-center font-bold text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="py-1.5 px-2 text-center text-slate-400 text-[11px]">
                      {item.unit}
                    </td>
                    <td className="py-1.5 px-2 text-right text-slate-600 font-mono text-[11px]">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-semibold text-slate-900 font-mono text-[11px]">
                      {formatCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Step 4: Financial Ledger & Deductions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
            <FileText className="w-4 h-4 text-solar-700" />
            <span>Step 3: Pricing, Subsidy & Payment Terms</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="PM Surya Ghar Subsidy Deduction (₹)"
              type="number"
              error={errors.subsidyAmount?.message}
              helperText={
                systemType === 'ON_GRID'
                  ? 'Central subsidy credited to customer bank'
                  : 'Off-grid setups are not subsidy eligible'
              }
              {...register('subsidyAmount', { valueAsNumber: true })}
            />

            <Input
              label="Special Discount Amount (₹)"
              type="number"
              error={errors.discountAmount?.message}
              helperText="Optional commercial concession"
              {...register('discountAmount', { valueAsNumber: true })}
            />
          </div>

          {/* Detailed Financial Calculation Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>BOM Subtotal:</span>
              <span className="font-mono font-medium">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>Applicable GST ({gstPercent}%):</span>
              <span className="font-mono font-medium">{formatCurrency(gstAmount)}</span>
            </div>

            {subsidyAmount > 0 && (
              <div className="flex justify-between items-center text-emerald-700 font-medium">
                <span>Subsidy Deduction:</span>
                <span className="font-mono">- {formatCurrency(subsidyAmount)}</span>
              </div>
            )}

            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-emerald-700 font-medium">
                <span>Discount Deduction:</span>
                <span className="font-mono">- {formatCurrency(discountAmount)}</span>
              </div>
            )}

            <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-bold">
              <span className="text-slate-900">Total Net Amount:</span>
              <span className="font-mono text-solar-900 text-base">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            {/* Advance and Balance Fields */}
            <div className="border-t border-dashed border-slate-200 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <Input
                  label="Advance Payment Received (₹)"
                  type="number"
                  error={errors.advancePaid?.message}
                  {...register('advancePaid', { valueAsNumber: true })}
                />
              </div>

              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 flex flex-col justify-center">
                <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide">
                  Remaining Balance:
                </span>
                <span className="text-base font-bold font-mono text-amber-950 mt-0.5">
                  {formatCurrency(balanceAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: Validity & Internal Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Quotation Valid Until *"
            type="date"
            leftIcon={<Calendar className="w-4 h-4 text-slate-400" />}
            error={errors.validUntil?.message}
            {...register('validUntil')}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">Scope & Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Turnkey rooftop installation with DISCOM net-metering synchronization..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:outline-none focus:ring-2 focus:ring-solar-500/20 focus:border-solar-600"
              {...register('notes')}
            />
          </div>
        </div>
      </form>
    </Drawer>
  );
};
