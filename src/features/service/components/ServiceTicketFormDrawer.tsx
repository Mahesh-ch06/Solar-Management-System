import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ShieldCheck,
  ShieldAlert,
  Wrench,
  Search,
  HelpCircle,
} from 'lucide-react';
import { Drawer } from '../../../components/ui/Drawer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { serviceTicketSchema, ServiceTicketFormData } from '../../../utils/validators';
import { serviceService } from '../services/serviceService';
import { findWarrantyBySerial, customers } from '../../../store/inMemoryDb';
import { formatDate } from '../../../utils/formatters';
import { useToast } from '../../../context/ToastContext';

interface ServiceTicketFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialSerial?: string;
}

const FAULT_CODES = [
  { value: 'E01', label: 'E01 - Grid Voltage Fault (Over/Under)' },
  { value: 'E02', label: 'E02 - Grid Frequency Out of Bounds' },
  { value: 'E04', label: 'E04 - Ground Fault / Inverter Isolation Error' },
  { value: 'E05', label: 'E05 - DC Input Array Overvoltage' },
  { value: 'E08', label: 'E08 - High Heat Sink / Inverter Overheat' },
  { value: 'E10', label: 'E10 - WiFi / Cloud Telemetry Offline' },
  { value: 'BAT01', label: 'BAT01 - Battery BMS Trip / Deep Discharge' },
  { value: 'PAN01', label: 'PAN01 - Physical Micro-cracks or Hotspot' },
  { value: 'OTHER', label: 'OTHER - Miscellaneous Wiring / Mounting Issue' },
];

const TECHNICIANS = [
  { value: '', label: 'Unassigned (Queue for Dispatcher)' },
  { value: 'tech-01', label: 'Manoj Kumar (Field Lead - Gurugram)' },
  { value: 'tech-02', label: 'Deepak Joshi (Senior Electrician - DLF)' },
  { value: 'tech-03', label: 'Amit Rawat (Survey & Service - Delhi)' },
  { value: 'tech-06', label: 'Pawan Yadav (Quick Response - Available)' },
  { value: 'tech-09', label: 'Gaurav Bisht (Inverter Specialist - Faridabad)' },
];

export const ServiceTicketFormDrawer: React.FC<ServiceTicketFormDrawerProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialSerial = '',
}) => {
  const { showToast } = useToast();
  const [customerSearch, setCustomerSearch] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ServiceTicketFormData>({
    resolver: zodResolver(serviceTicketSchema),
    defaultValues: {
      customerId: '',
      serialNumber: initialSerial,
      faultCode: 'E04',
      faultDescription: '',
      priority: 'HIGH',
      assignedTechnicianId: '',
    },
  });

  const watchedSerial = watch('serialNumber') || '';
  const watchedPriority = watch('priority');

  // Set initial serial if passed in props
  useEffect(() => {
    if (initialSerial) {
      setValue('serialNumber', initialSerial);
    }
  }, [initialSerial, setValue]);

  // Reset form when drawer opens or closes
  useEffect(() => {
    if (!isOpen) {
      reset({
        customerId: '',
        serialNumber: '',
        faultCode: 'E04',
        faultDescription: '',
        priority: 'HIGH',
        assignedTechnicianId: '',
      });
      setCustomerSearch('');
    }
  }, [isOpen, reset]);

  // Real-time warranty lookup
  const warrantyLookup = React.useMemo(() => {
    if (!watchedSerial || watchedSerial.trim().length < 3) {
      return null;
    }
    const clean = watchedSerial.trim();
    return findWarrantyBySerial(clean);
  }, [watchedSerial]);

  // Filtered customer options
  const filteredCustomers = React.useMemo(() => {
    const q = customerSearch.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.city.toLowerCase().includes(q)
    );
  }, [customerSearch]);

  const onSubmit = async (data: ServiceTicketFormData) => {
    try {
      await serviceService.createTicket(data);
      showToast(
        'Service Ticket Created',
        `Ticket registered successfully. Warranty status automatically logged.`,
        'success'
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create service ticket';
      showToast('Error', msg, 'error');
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Log New Service & Maintenance Ticket"
      description="Record customer equipment breakdown, verify warranty entitlements, and dispatch technicians."
      width="lg"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            leftIcon={<Wrench className="w-3.5 h-3.5" />}
          >
            Create Ticket
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Selector Section */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 select-none block">
            Customer / Site Owner <span className="text-rose-500">*</span>
          </label>

          <div className="space-y-2">
            <Input
              placeholder="Type customer name or mobile number to filter..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              leftIcon={<Search className="w-3.5 h-3.5" />}
            />

            <Select
              options={[
                { label: '-- Select Registered Customer --', value: '' },
                ...filteredCustomers.map((c) => ({
                  label: `${c.name} (${c.phone}) - ${c.city}`,
                  value: c.id,
                })),
              ]}
              {...register('customerId')}
              error={errors.customerId?.message}
            />
          </div>
        </div>

        {/* Serial Number & Real-time Warranty Lookup Card */}
        <div className="space-y-2.5">
          <Input
            label="Component Serial Number (Optional for General Issues)"
            placeholder="e.g. SN-INV-88219"
            helperText="Enter equipment serial to verify active OEM warranty coverage"
            {...register('serialNumber')}
            error={errors.serialNumber?.message}
          />

          {/* Inline Warranty Status Feedback Card */}
          {watchedSerial && watchedSerial.trim().length >= 3 && (
            <div className="animate-fade-in transition-all">
              {warrantyLookup ? (
                warrantyLookup.status === 'ACTIVE' || warrantyLookup.status === 'EXPIRING_SOON' ? (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50/90 p-4 text-xs space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-emerald-900 font-bold">
                      <span className="flex items-center gap-1.5 text-sm">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        UNDER WARRANTY - Expires {formatDate(warrantyLookup.warrantyExpiryDate)}
                      </span>
                      <Badge variant="emerald" size="sm">
                        Zero Customer Charge
                      </Badge>
                    </div>
                    <p className="text-emerald-800">
                      Product: <strong>{warrantyLookup.itemName}</strong> ({warrantyLookup.brand})
                    </p>
                    <p className="text-emerald-700 text-[11px]">
                      Registered to: {warrantyLookup.customerName} • Replacement parts & service labour are 100% covered.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-rose-300 bg-rose-50/90 p-4 text-xs space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-rose-900 font-bold">
                      <span className="flex items-center gap-1.5 text-sm">
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        WARRANTY EXPIRED (Expired {formatDate(warrantyLookup.warrantyExpiryDate)})
                      </span>
                      <Badge variant="rose" size="sm">
                        Billable Repair
                      </Badge>
                    </div>
                    <p className="text-rose-800">
                      Product: <strong>{warrantyLookup.itemName}</strong> ({warrantyLookup.brand})
                    </p>
                    <p className="text-rose-700 text-[11px]">
                      Standard service visit charges (₹1,200) and replacement hardware costs apply.
                    </p>
                  </div>
                )
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-700 block">
                      No warranty record found
                    </span>
                    <span className="text-[11px] text-slate-500">
                      No active unit in registry matches "{watchedSerial.trim()}". Ticket will be logged as billable inspection.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fault Code Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Inverter / System Fault Code"
            options={FAULT_CODES}
            {...register('faultCode')}
            error={errors.faultCode?.message}
          />

          {/* Priority Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 select-none block mb-1.5">
              Service Priority <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((p) => {
                const isSelected = watchedPriority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setValue('priority', p)}
                    className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all text-center ${
                      isSelected
                        ? p === 'CRITICAL'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : p === 'HIGH'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : p === 'MEDIUM'
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-slate-700 text-white border-slate-700 shadow-xs'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            {errors.priority && (
              <p className="text-xs text-rose-600 font-medium mt-1">
                {errors.priority.message}
              </p>
            )}
          </div>
        </div>

        {/* Fault Description Textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 select-none flex items-center justify-between">
            <span>
              Fault Description & Symptoms <span className="text-rose-500">*</span>
            </span>
            <span className="text-[11px] text-slate-400">Min. 10 characters</span>
          </label>
          <textarea
            rows={4}
            placeholder="Detailed description of symptoms, inverter display readouts, tripped breakers, or customer observation..."
            className={`w-full bg-white text-slate-900 placeholder:text-slate-400 text-sm rounded-lg border py-2 px-3 transition-all duration-150 focus:outline-none focus:ring-2 ${
              errors.faultDescription
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900'
                : 'border-slate-300 focus:border-solar-600 focus:ring-solar-500/20'
            }`}
            {...register('faultDescription')}
          />
          {errors.faultDescription && (
            <p className="text-xs text-rose-600 font-medium">
              {errors.faultDescription.message}
            </p>
          )}
        </div>

        {/* Technician Assignment */}
        <Select
          label="Assign Field Technician"
          options={TECHNICIANS}
          {...register('assignedTechnicianId')}
          error={errors.assignedTechnicianId?.message}
          helperText="Selected technician will receive immediate push alert with site GPS coordinates"
        />
      </form>
    </Drawer>
  );
};
