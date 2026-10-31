import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  X,
  Compass,
  Calendar,
  User,
  HardHat,
  Ruler,
  Cable,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { surveySchema } from '../../../utils/validators';
import { customerService } from '../../customers/services/customerService';
import { surveyService } from '../services/surveyService';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { cn } from '../../../utils/cn';

// Extend surveySchema to mandate customer selection
const extendedSurveySchema = surveySchema.and(
  z.object({
    customerId: z.string().min(1, 'Please select a customer for the survey'),
  })
);

type ExtendedSurveyFormData = z.infer<typeof extendedSurveySchema>;

interface SurveyFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCustomerId?: string;
}

// 15 Technicians from mock database
const TECHNICIANS = [
  { id: 'tech-01', name: 'Manoj Kumar', role: 'Sr. Field Engineer' },
  { id: 'tech-02', name: 'Deepak Joshi', role: 'Rooftop Inspector' },
  { id: 'tech-03', name: 'Amit Rawat', role: 'Lead Solar Technician' },
  { id: 'tech-04', name: 'Vikas Singh', role: 'Structure Specialist' },
  { id: 'tech-05', name: 'Rohit Verma', role: 'Grid Tie Engineer' },
  { id: 'tech-06', name: 'Pawan Yadav', role: 'Site Surveyor' },
  { id: 'tech-07', name: 'Sandeep Chauhan', role: 'Solar Electrician' },
  { id: 'tech-08', name: 'Dinesh Pal', role: 'Field Technician' },
  { id: 'tech-09', name: 'Gaurav Bisht', role: 'Rooftop Auditor' },
  { id: 'tech-10', name: 'Harish Rana', role: 'Junior Surveyor' },
  { id: 'tech-11', name: 'Kuldeep Negi', role: 'Commissioning Tech' },
  { id: 'tech-12', name: 'Mohit Saini', role: 'Electrical Inspector' },
  { id: 'tech-13', name: 'Rajinder Gill', role: 'Industrial Surveyor' },
  { id: 'tech-14', name: 'Suraj Thapa', role: 'Field Technician' },
  { id: 'tech-15', name: 'Vinod Tiwari', role: 'Assistant Technician' },
];

const ROOF_TYPES = [
  { value: 'RCC_FLAT', label: 'RCC Flat (Concrete Slab Terrace)' },
  { value: 'RCC_SLOPED', label: 'RCC Sloped Roof' },
  { value: 'TIN_SHED', label: 'Industrial Tin / Metal Shed' },
  { value: 'TILE', label: 'Clay / Mangalore Tiled Roof' },
  { value: 'OTHER', label: 'Other / Elevated Truss' },
];

const ROOF_DIRECTIONS = [
  { value: 'SOUTH', label: 'South (180° - Maximum Generation)' },
  { value: 'SOUTH_EAST', label: 'South-East (135°)' },
  { value: 'SOUTH_WEST', label: 'South-West (225°)' },
  { value: 'EAST', label: 'East (90°)' },
  { value: 'WEST', label: 'West (270°)' },
  { value: 'FLAT', label: 'Flat (0° horizontal)' },
];

const CAPACITY_OPTIONS = [
  { value: '1', label: '1 kW' },
  { value: '2', label: '2 kW' },
  { value: '3', label: '3 kW (PM Surya Ghar Recommended)' },
  { value: '4', label: '4 kW' },
  { value: '5', label: '5 kW' },
  { value: '6', label: '6 kW' },
  { value: '7', label: '7 kW' },
  { value: '8', label: '8 kW' },
  { value: '9', label: '9 kW' },
  { value: '10', label: '10 kW' },
];

export const SurveyFormDrawer: React.FC<SurveyFormDrawerProps> = ({
  isOpen,
  onClose,
  preselectedCustomerId,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerFilter, setCustomerFilter] = useState('');

  // Fetch customers to populate the customer selector
  const { data: customerList = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers(),
    enabled: isOpen,
  });

  // Tomorrow's date formatted as YYYY-MM-DD for default scheduled date
  const tomorrowFormatted = useMemo(() => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().split('T')[0];
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExtendedSurveyFormData>({
    resolver: zodResolver(extendedSurveySchema),
    defaultValues: {
      customerId: preselectedCustomerId || '',
      assignedTechnicianId: 'tech-01',
      scheduledDate: tomorrowFormatted,
      roofType: 'RCC_FLAT',
      totalRoofAreaSqFt: 600,
      shadowFreeAreaSqFt: 500,
      roofDirection: 'SOUTH',
      tiltAngleDeg: 28,
      acCableDistanceMeters: 15,
      dcCableDistanceMeters: 20,
      gridConnectionSuitable: true,
      gridConnectionNotes: '3-phase service connection with adequate earthing pit.',
      structureFeasible: true,
      recommendedCapacityKW: 4,
      surveyNotes: '',
    },
  });

  const selectedCustomerId = watch('customerId');

  // Filtered customer list for search
  const filteredCustomers = useMemo(() => {
    if (!customerFilter.trim()) return customerList;
    const q = customerFilter.toLowerCase();
    return customerList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.city.toLowerCase().includes(q)
    );
  }, [customerList, customerFilter]);

  // Selected customer object for preview
  const currentSelectedCustomer = useMemo(() => {
    return customerList.find((c) => c.id === selectedCustomerId);
  }, [customerList, selectedCustomerId]);

  // Sync preselectedCustomerId or reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      const initCustId = preselectedCustomerId || (customerList[0]?.id ?? '');
      setValue('customerId', initCustId);
      setValue('scheduledDate', tomorrowFormatted);
      setCustomerFilter('');

      // Auto-set recommended kW based on customer's required kW if available
      const cust = customerList.find((c) => c.id === initCustId);
      if (cust) {
        setValue('recommendedCapacityKW', cust.requiredCapacityKW || 4);
      }
    }
  }, [isOpen, preselectedCustomerId, customerList, setValue, tomorrowFormatted]);

  // Keyboard shortcut for escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const onSubmit = async (data: ExtendedSurveyFormData) => {
    try {
      setIsSubmitting(true);

      const tech = TECHNICIANS.find((t) => t.id === data.assignedTechnicianId);
      const cust = customerList.find((c) => c.id === data.customerId);

      await surveyService.addSurvey({
        ...data,
        customerName: cust?.name,
        address: cust ? `${cust.address}, ${cust.city}` : undefined,
        assignedTechnicianName: tech?.name,
      });

      showToast(
        'Survey Scheduled',
        `Site inspection booked for ${cust?.name || 'customer'} on ${data.scheduledDate}.`,
        'success'
      );

      // Invalidate queries to refresh lists
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['surveys'] }),
        queryClient.invalidateQueries({ queryKey: ['customers'] }),
      ]);

      reset();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to schedule survey';
      showToast('Scheduling Error', message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-950/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div
          role="dialog"
          aria-modal="true"
          className="w-screen max-w-[560px] bg-white shadow-2xl flex flex-col border-l border-slate-200 transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-solar-50 border border-solar-200 flex items-center justify-center text-solar-800 shrink-0">
                <Compass className="w-5 h-5 text-solar-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Schedule New Rooftop Survey
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dispatch technician for site measurement & feasibility audit
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer Selector Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-solar-700" />
                    <span>Select Customer *</span>
                  </label>
                  {customerList.length > 0 && (
                    <span className="text-[11px] text-slate-500">
                      {customerList.length} leads in pipeline
                    </span>
                  )}
                </div>

                {/* Search input for filtering customer */}
                <input
                  type="text"
                  placeholder="Filter customer by name, phone or city..."
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-solar-500 focus:border-solar-600"
                />

                {/* Dropdown Select */}
                <select
                  className={cn(
                    'w-full bg-white text-slate-900 text-sm rounded-lg border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-solar-500/20 focus:border-solar-600',
                    errors.customerId && 'border-rose-400 text-rose-900'
                  )}
                  {...register('customerId', {
                    onChange: (e) => {
                      const selectedId = e.target.value;
                      const cust = customerList.find((c) => c.id === selectedId);
                      if (cust) {
                        setValue('recommendedCapacityKW', cust.requiredCapacityKW || 4);
                      }
                    },
                  })}
                >
                  <option value="" disabled>
                    -- Choose customer --
                  </option>
                  {filteredCustomers.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.name} ({cust.city}) - {cust.phone} [{cust.requiredCapacityKW}kW Req.]
                    </option>
                  ))}
                </select>

                {errors.customerId && (
                  <p className="text-xs text-rose-600 font-medium">
                    {errors.customerId.message}
                  </p>
                )}

                {/* Selected Customer Preview Card */}
                {currentSelectedCustomer && (
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                    <div className="font-semibold text-slate-900 flex items-center justify-between">
                      <span>{currentSelectedCustomer.name}</span>
                      <span className="text-[11px] font-normal text-solar-800 bg-solar-50 px-2 py-0.5 rounded border border-solar-200">
                        Target: {currentSelectedCustomer.requiredCapacityKW} kW ({currentSelectedCustomer.systemType})
                      </span>
                    </div>
                    <div className="text-slate-500 truncate">
                      {currentSelectedCustomer.address}, {currentSelectedCustomer.city} - {currentSelectedCustomer.pincode}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Phone: <span className="font-mono text-slate-700">{currentSelectedCustomer.phone}</span> • Bill: ₹{currentSelectedCustomer.monthlyBill}/mo
                    </div>
                  </div>
                )}
              </div>

              {/* Technician & Date Assignment */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-solar-800">
                  <HardHat className="w-3.5 h-3.5" />
                  <span>Dispatch & Schedule</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="w-full flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Assigned Technician (15 Techs) *
                    </label>
                    <select
                      className={cn(
                        'w-full bg-white text-slate-900 text-sm rounded-lg border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-solar-500/20 focus:border-solar-600',
                        errors.assignedTechnicianId && 'border-rose-400'
                      )}
                      {...register('assignedTechnicianId')}
                    >
                      {TECHNICIANS.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.name} - {tech.role}
                        </option>
                      ))}
                    </select>
                    {errors.assignedTechnicianId && (
                      <p className="text-xs text-rose-600 font-medium">
                        {errors.assignedTechnicianId.message}
                      </p>
                    )}
                  </div>

                  <Input
                    label="Scheduled Date *"
                    type="date"
                    leftIcon={<Calendar className="w-4 h-4" />}
                    error={errors.scheduledDate?.message}
                    {...register('scheduledDate')}
                  />
                </div>
              </div>

              {/* Roof Physical Dimensions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-solar-800">
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Roof Surface & Shading Dimensions</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Select
                    label="Roof Construction Type *"
                    options={ROOF_TYPES}
                    error={errors.roofType?.message}
                    {...register('roofType')}
                  />

                  <Select
                    label="Roof Azimuth / Direction *"
                    options={ROOF_DIRECTIONS}
                    error={errors.roofDirection?.message}
                    {...register('roofDirection')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <Input
                    label="Total Roof Area (sq ft) *"
                    type="number"
                    placeholder="800"
                    helperText="Total structural slab"
                    error={errors.totalRoofAreaSqFt?.message}
                    {...register('totalRoofAreaSqFt', { valueAsNumber: true })}
                  />

                  <Input
                    label="Shadow-Free Area (sq ft) *"
                    type="number"
                    placeholder="650"
                    helperText="Unobstructed 9AM-4PM"
                    error={errors.shadowFreeAreaSqFt?.message}
                    {...register('shadowFreeAreaSqFt', { valueAsNumber: true })}
                  />

                  <Input
                    label="Roof Tilt Angle (0-90°) *"
                    type="number"
                    placeholder="28"
                    helperText="Degrees from horizon"
                    error={errors.tiltAngleDeg?.message}
                    {...register('tiltAngleDeg', { valueAsNumber: true })}
                  />
                </div>

                {errors.shadowFreeAreaSqFt && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errors.shadowFreeAreaSqFt.message}</span>
                  </div>
                )}
              </div>

              {/* Electrical Cable Distance */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-solar-800">
                  <Cable className="w-3.5 h-3.5" />
                  <span>Cabling Run Distances</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Input
                    label="DC Cable Distance (Meters) *"
                    type="number"
                    placeholder="20"
                    helperText="Panels to Inverter (max 200m)"
                    error={errors.dcCableDistanceMeters?.message}
                    {...register('dcCableDistanceMeters', { valueAsNumber: true })}
                  />

                  <Input
                    label="AC Cable Distance (Meters) *"
                    type="number"
                    placeholder="15"
                    helperText="Inverter to Distribution Box"
                    error={errors.acCableDistanceMeters?.message}
                    {...register('acCableDistanceMeters', { valueAsNumber: true })}
                  />
                </div>
              </div>

              {/* Engineering Feasibility & Recommendation */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-solar-800">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Feasibility Signoff & Sizing</span>
                </div>

                <div className="space-y-3">
                  {/* Structure feasible checkbox */}
                  <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 cursor-pointer transition-colors select-none">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-solar-700 focus:ring-solar-500/30"
                      {...register('structureFeasible')}
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-900">
                        Roof Structure Is Structurally Feasible
                      </span>
                      <p className="text-slate-500 mt-0.5">
                        Can safely withstand dead weight of solar modules + wind load (150 km/h).
                      </p>
                    </div>
                  </label>

                  {/* Grid connection suitable checkbox */}
                  <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 cursor-pointer transition-colors select-none">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-solar-700 focus:ring-solar-500/30"
                      {...register('gridConnectionSuitable')}
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-900">
                        DISCOM Grid Connection Is Suitable
                      </span>
                      <p className="text-slate-500 mt-0.5">
                        Sanctioned load, service breaker capacity, and earthing meet net-metering norms.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="space-y-3.5">
                  <Input
                    label="Grid Connection Notes"
                    placeholder="e.g. 3-phase meter present; requires 16A to 32A MCB upgrade"
                    error={errors.gridConnectionNotes?.message}
                    {...register('gridConnectionNotes')}
                  />

                  <Select
                    label="Recommended Capacity (kW) *"
                    options={CAPACITY_OPTIONS}
                    error={errors.recommendedCapacityKW?.message}
                    {...register('recommendedCapacityKW', { valueAsNumber: true })}
                  />

                  <div className="w-full flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Technician Survey Notes & Obstruction Remarks
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Note chimneys, parapet wall height, water tanks, trees, ladder access..."
                      className={cn(
                        'w-full bg-white text-slate-900 placeholder:text-slate-400 text-sm rounded-lg border border-slate-300 p-2.5 transition-all duration-150',
                        'focus:outline-none focus:ring-2 focus:ring-solar-500/20 focus:border-solar-600',
                        errors.surveyNotes && 'border-rose-400'
                      )}
                      {...register('surveyNotes')}
                    />
                    {errors.surveyNotes && (
                      <p className="text-xs text-rose-600 font-medium">
                        {errors.surveyNotes.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
              >
                Schedule Survey
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
