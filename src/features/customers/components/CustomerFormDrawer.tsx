import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { X, UserPlus, Edit3, IndianRupee, Zap, Building2, MapPin, Phone, Mail, UserCheck } from 'lucide-react';
import { Customer } from '../../../types/customer';
import { customerSchema, CustomerFormData } from '../../../utils/validators';
import { customerService } from '../services/customerService';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { cn } from '../../../utils/cn';

interface CustomerFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
}

const SALES_EXECUTIVES = [
  { value: 'Vikram Mehta', label: 'Vikram Mehta (Sr. Sales Manager)' },
  { value: 'Priya Kapoor', label: 'Priya Kapoor (Key Accounts)' },
  { value: 'Rohit Gupta', label: 'Rohit Gupta (Field Sales Lead)' },
];

const ENQUIRY_SOURCES = [
  { value: 'WEB_FORM', label: 'Web Form / Landing Page' },
  { value: 'WHATSAPP', label: 'WhatsApp Enquiry' },
  { value: 'PHONE_CALL', label: 'Direct Phone Call' },
  { value: 'REFERRAL', label: 'Customer / Partner Referral' },
  { value: 'WALK_IN', label: 'Walk-In / Office Visit' },
];

const CAPACITY_OPTIONS = [
  { value: '1', label: '1 kW (Small Rooftop / 1-2 BHK)' },
  { value: '2', label: '2 kW (2-3 BHK ~ 240 units/mo)' },
  { value: '3', label: '3 kW (Optimal for PM Surya Ghar)' },
  { value: '4', label: '4 kW (4 BHK / Moderate AC)' },
  { value: '5', label: '5 kW (Independent House / High AC)' },
];

const SYSTEM_TYPES = [
  { value: 'ON_GRID', label: 'On-Grid (Net Metering with DISCOM)' },
  { value: 'OFF_GRID', label: 'Off-Grid (Battery Storage System)' },
];

export const CustomerFormDrawer: React.FC<CustomerFormDrawerProps> = ({
  isOpen,
  onClose,
  customerToEdit,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      pincode: '',
      monthlyBill: 3500,
      requiredCapacityKW: 3,
      systemType: 'ON_GRID',
      subsidyRequired: true,
      enquirySource: 'WEB_FORM',
      notes: '',
      assignedTo: 'Vikram Mehta',
    },
  });

  useEffect(() => {
    if (customerToEdit) {
      reset({
        name: customerToEdit.name,
        phone: customerToEdit.phone,
        email: customerToEdit.email || '',
        address: customerToEdit.address,
        city: customerToEdit.city,
        pincode: customerToEdit.pincode,
        monthlyBill: customerToEdit.monthlyBill,
        requiredCapacityKW: customerToEdit.requiredCapacityKW,
        systemType: customerToEdit.systemType,
        subsidyRequired: customerToEdit.subsidyRequired,
        enquirySource: customerToEdit.enquirySource,
        notes: customerToEdit.notes || '',
        assignedTo: customerToEdit.assignedTo,
      });
    } else {
      reset({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        pincode: '',
        monthlyBill: 3500,
        requiredCapacityKW: 3,
        systemType: 'ON_GRID',
        subsidyRequired: true,
        enquirySource: 'WEB_FORM',
        notes: '',
        assignedTo: 'Vikram Mehta',
      });
    }
  }, [customerToEdit, isOpen, reset]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const onSubmit = async (data: CustomerFormData) => {
    try {
      setIsSubmitting(true);
      if (customerToEdit) {
        await customerService.updateCustomer(customerToEdit.id, data);
        showToast(
          'Customer Updated',
          `${data.name}'s profile was updated successfully.`,
          'success'
        );
      } else {
        await customerService.addCustomer(data);
        showToast(
          'Customer Created',
          `New enquiry for ${data.name} has been registered.`,
          'success'
        );
      }

      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      showToast('Operation Failed', message, 'error');
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
          className="w-screen max-w-[480px] bg-white shadow-2xl flex flex-col border-l border-slate-200 transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-solar-50 border border-solar-200 flex items-center justify-center text-solar-800 shrink-0">
                {customerToEdit ? (
                  <Edit3 className="w-5 h-5 text-solar-700" />
                ) : (
                  <UserPlus className="w-5 h-5 text-solar-700" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  {customerToEdit ? 'Edit Customer Enquiry' : 'Add New Customer Enquiry'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {customerToEdit
                    ? `Updating record for ${customerToEdit.id}`
                    : 'Capture rooftop lead details and solar requirements'}
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

          {/* Form Content */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Section 1: Customer Info */}
              <div>
                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-solar-800">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Personal & Contact Info</span>
                </div>
                <div className="space-y-3.5">
                  <Input
                    label="Full Name *"
                    placeholder="e.g. Vikramaditya Rathore"
                    leftIcon={<UserCheck className="w-4 h-4" />}
                    error={errors.name?.message}
                    {...register('name')}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Mobile Phone *"
                      placeholder="9876543210"
                      leftIcon={<Phone className="w-4 h-4" />}
                      helperText="10-digit Indian number"
                      error={errors.phone?.message}
                      {...register('phone')}
                    />

                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="name@domain.com"
                      leftIcon={<Mail className="w-4 h-4" />}
                      error={errors.email?.message}
                      {...register('email')}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Location & Address */}
              <div>
                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-solar-800">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Installation Site Address</span>
                </div>
                <div className="space-y-3.5">
                  <div className="w-full flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Rooftop / House Address *
                    </label>
                    <textarea
                      rows={2}
                      placeholder="House/Plot number, Street, Landmark"
                      className={cn(
                        'w-full bg-white text-slate-900 placeholder:text-slate-400 text-sm rounded-lg border border-slate-300 p-2.5 transition-all duration-150',
                        'focus:outline-none focus:ring-2 focus:ring-solar-500/20 focus:border-solar-600',
                        errors.address && 'border-rose-400 focus:border-rose-500 text-rose-900'
                      )}
                      {...register('address')}
                    />
                    {errors.address && (
                      <p className="text-xs text-rose-600 font-medium">
                        {errors.address.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="City *"
                      placeholder="e.g. Gurugram"
                      leftIcon={<Building2 className="w-4 h-4" />}
                      error={errors.city?.message}
                      {...register('city')}
                    />

                    <Input
                      label="PIN Code *"
                      placeholder="122001"
                      maxLength={6}
                      error={errors.pincode?.message}
                      {...register('pincode')}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Solar Requirements */}
              <div>
                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-solar-800">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Solar System & Energy Profile</span>
                </div>

                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Avg. Monthly Bill (₹) *"
                      type="number"
                      placeholder="3500"
                      leftIcon={<IndianRupee className="w-4 h-4" />}
                      error={errors.monthlyBill?.message}
                      {...register('monthlyBill', { valueAsNumber: true })}
                    />

                    <Select
                      label="Required Capacity *"
                      options={CAPACITY_OPTIONS}
                      error={errors.requiredCapacityKW?.message}
                      {...register('requiredCapacityKW', { valueAsNumber: true })}
                    />
                  </div>

                  <Select
                    label="System Type *"
                    options={SYSTEM_TYPES}
                    error={errors.systemType?.message}
                    {...register('systemType')}
                  />

                  {/* Subsidy Checkbox */}
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-solar-700 focus:ring-solar-500/30"
                        {...register('subsidyRequired')}
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-slate-800">
                          Apply for Central PM Surya Ghar Subsidy
                        </span>
                        <p className="text-slate-500 mt-0.5">
                          Eligible for direct DBT subsidy up to ₹78,000 for residential 3kW+ rooftop systems.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Section 4: Assignment & Source */}
              <div>
                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-solar-800">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Lead Attribution & Assignment</span>
                </div>

                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select
                      label="Enquiry Source *"
                      options={ENQUIRY_SOURCES}
                      error={errors.enquirySource?.message}
                      {...register('enquirySource')}
                    />

                    <Select
                      label="Assigned Sales Exec *"
                      options={SALES_EXECUTIVES}
                      error={errors.assignedTo?.message}
                      {...register('assignedTo')}
                    />
                  </div>

                  <div className="w-full flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Internal Notes / Remarks
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Customer requirements, preferred call times, existing sanction load..."
                      className={cn(
                        'w-full bg-white text-slate-900 placeholder:text-slate-400 text-sm rounded-lg border border-slate-300 p-2.5 transition-all duration-150',
                        'focus:outline-none focus:ring-2 focus:ring-solar-500/20 focus:border-solar-600',
                        errors.notes && 'border-rose-400 focus:border-rose-500 text-rose-900'
                      )}
                      {...register('notes')}
                    />
                    {errors.notes && (
                      <p className="text-xs text-rose-600 font-medium">
                        {errors.notes.message}
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
                {customerToEdit ? 'Save Changes' : 'Create Customer'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
