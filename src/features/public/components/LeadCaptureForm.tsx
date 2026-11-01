import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useToast } from '../../../context/ToastContext';
import { customerService } from '../../customers/services/customerService';
import { Customer } from '../../../types/customer';
import {
  Send,
  CheckCircle2,
  Clock,
  PhoneCall,
  Calendar,
  ShieldCheck,
  Building2,
  FileCheck2,
  ArrowRight,
} from 'lucide-react';

export const LeadCaptureForm: React.FC = () => {
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Gurugram');
  const [pincode, setPincode] = useState('');
  const [address, setAddress] = useState('');
  const [monthlyBill, setMonthlyBill] = useState('4500');
  const [requiredCapacityKW, setRequiredCapacityKW] = useState('3');
  const [systemType, setSystemType] = useState<'ON_GRID' | 'OFF_GRID'>('ON_GRID');
  const [subsidyRequired, setSubsidyRequired] = useState(true);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<Customer | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !city.trim()) {
      showToast('Missing Details', 'Please enter your name, mobile number, and city.', 'error');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      showToast('Invalid Phone', 'Please provide a valid 10-digit mobile number.', 'error');
      return;
    }

    if (email.trim()) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
      if (!emailRegex.test(email.trim())) {
        showToast('Invalid Email', 'Please enter a valid Gmail address (ending in @gmail.com).', 'error');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const created = await customerService.addCustomer({
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim() || `${cleanPhone}@sunpower.customer`,
        address: address.trim() || `${city}, North India`,
        city: city.trim(),
        pincode: pincode.trim() || '110001',
        monthlyBill: Number(monthlyBill) || 4500,
        requiredCapacityKW: Number(requiredCapacityKW) || 3,
        systemType,
        subsidyRequired,
        enquirySource: 'WEB_FORM',
        notes: notes.trim() || 'Website inquiry for PM Surya Ghar rooftop solar installation.',
      });

      setSubmittedLead(created);

      if (created.status === 'QUEUED') {
        showToast(
          'Enquiry Queued',
          'All consultants are currently busy. Your inquiry is in priority queue and will be assigned shortly.',
          'warning'
        );
      } else {
        showToast(
          'Inquiry Received',
          `Your rooftop solar inquiry has been received and assigned to consultant ${created.assignedTo}.`,
          'success'
        );
      }
    } catch {
      showToast('Error', 'Unable to submit your inquiry. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setPincode('');
    setAddress('');
    setNotes('');
    setSubmittedLead(null);
  };

  return (
    <Card className="bg-white border-slate-200 text-slate-900 p-6 sm:p-10 rounded-3xl shadow-xl">
      {submittedLead ? (
        <div className="text-center py-6 space-y-4">
          {submittedLead.status === 'QUEUED' ? (
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          )}

          <h3 className="text-xl font-bold text-slate-900">
            {submittedLead.status === 'QUEUED'
              ? 'Enquiry Placed in Priority Queue'
              : 'Rooftop Survey Request Confirmed!'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Thank you, <strong className="text-slate-900">{submittedLead.name}</strong>.{' '}
            {submittedLead.status === 'QUEUED'
              ? 'All our solar consultants are currently engaged in active consultations. Your enquiry has been placed in our priority queue and will be assigned to the next available specialist automatically.'
              : 'Your solar application has been recorded in our central system and assigned to our solar specialist.'}
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-sm mx-auto text-left space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Application Reference:</span>
              <span className="font-mono font-bold text-amber-600">{submittedLead.id}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Assigned Specialist:</span>
              <span className={submittedLead.status === 'QUEUED' ? 'font-semibold text-amber-600' : 'font-semibold text-emerald-700'}>
                {submittedLead.assignedTo && submittedLead.assignedTo !== 'UNASSIGNED'
                  ? `${submittedLead.assignedTo} (Dedicated Consultant)`
                  : 'Pending Assignment (In Priority Queue)'}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>System Requested:</span>
              <span className="font-semibold text-slate-900">{submittedLead.requiredCapacityKW} kW ({submittedLead.systemType === 'ON_GRID' ? 'On-Grid' : 'Hybrid'})</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Subsidy Guidance:</span>
              <span className="font-semibold text-emerald-700">PM Surya Ghar (Included)</span>
            </div>
          </div>

          <div className="max-w-md mx-auto p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-slate-700 text-left space-y-2">
            <p className="font-bold text-amber-900 flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-amber-700" />
              What Happens Next:
            </p>
            {submittedLead.status === 'QUEUED' ? (
              <p className="text-[11px] text-amber-900/90 leading-relaxed">
                As soon as a solar specialist is released from an ongoing consultation, your file will be allocated to them immediately. You will receive a direct phone call at <strong className="text-slate-900">{submittedLead.phone}</strong>.
              </p>
            ) : (
              <p className="text-[11px] text-slate-600 leading-relaxed">
                1. Dedicated solar consultant <strong className="text-slate-800">{submittedLead.assignedTo}</strong> will contact you at <strong className="text-slate-800">{submittedLead.phone}</strong> to confirm your address and schedule the 3D shadow analysis.
              </p>
            )}
            <p className="text-[11px] text-slate-600 leading-relaxed">
              2. We will generate your customized Bill of Materials (BOM) and file your pre-registration on the National Portal for the PM Surya Ghar subsidy.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <a
              href={`/portal?phone=${encodeURIComponent(submittedLead.phone)}`}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-md transition-colors"
            >
              <span>Track Application on Customer Portal</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <Button variant="outline" size="sm" onClick={resetForm} className="border-slate-300 text-slate-700">
              Submit Another Inquiry
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-200">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Book Free Rooftop Site Survey</h3>
              <p className="text-[11px] text-slate-500">
                Get an engineer site visit, 3D shadow analysis, and official PM Surya Ghar subsidy paperwork.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Suresh Bansal"
              required
            />

            <Input
              label="Mobile Number (WhatsApp) *"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Email Address (Optional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. suresh@gmail.com"
            />

            <Select
              label="City / District *"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              options={[
                { value: 'Gurugram', label: 'Gurugram (DHBVN)' },
                { value: 'Delhi', label: 'Delhi (BSES / Tata Power)' },
                { value: 'Noida', label: 'Noida (NPCL / PVVNL)' },
                { value: 'Faridabad', label: 'Faridabad (DHBVN)' },
                { value: 'Ghaziabad', label: 'Ghaziabad (PVVNL)' },
                { value: 'Other', label: 'Other North India Location' },
              ]}
            />

            <Input
              label="Area PIN Code"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="e.g. 122001"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Avg. Monthly Electricity Bill"
              value={monthlyBill}
              onChange={(e) => setMonthlyBill(e.target.value)}
              options={[
                { value: '2500', label: '₹1,500 – ₹3,000 / month' },
                { value: '4500', label: '₹3,000 – ₹6,000 / month' },
                { value: '8000', label: '₹6,000 – ₹10,000 / month' },
                { value: '15000', label: '₹10,000+ / month (Commercial / Villa)' },
              ]}
            />

            <Select
              label="Recommended System Capacity"
              value={requiredCapacityKW}
              onChange={(e) => setRequiredCapacityKW(e.target.value)}
              options={[
                { value: '2', label: '2 kW (Saves ~₹1,800/mo, ₹60k Subsidy)' },
                { value: '3', label: '3 kW (Saves ~₹2,700/mo, ₹78k Subsidy)' },
                { value: '4', label: '4 kW (Saves ~₹3,600/mo, ₹78k Subsidy)' },
                { value: '5', label: '5 kW (Saves ~₹4,500/mo, ₹78k Subsidy)' },
                { value: '10', label: '10 kW (Commercial / Large Villa)' },
              ]}
            />

            <Select
              label="Solar System Type"
              value={systemType}
              onChange={(e) => setSystemType(e.target.value as 'ON_GRID' | 'OFF_GRID')}
              options={[
                { value: 'ON_GRID', label: 'Grid-Tied (Max Subsidy & Net-Meter)' },
                { value: 'OFF_GRID', label: 'Hybrid with Battery Storage (24x7 Backup)' },
              ]}
            />
          </div>

          <div className="flex items-center gap-2 pt-1 pb-1">
            <input
              type="checkbox"
              id="subsidy-check"
              checked={subsidyRequired}
              onChange={(e) => setSubsidyRequired(e.target.checked)}
              className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
            />
            <label htmlFor="subsidy-check" className="text-xs text-slate-700 cursor-pointer">
              Apply for <strong>PM Surya Ghar Central Govt. Subsidy</strong> (Up to ₹78,000 direct bank transfer assistance).
            </label>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md"
              isLoading={isSubmitting}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Confirm Free Rooftop Site Visit & Subsidy Check
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500 pt-3 border-t border-slate-100">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              100% Free Site Inspection
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              Visit within 24-48 Hours
            </span>
            <span className="flex items-center gap-1 font-medium">
              <FileCheck2 className="w-3.5 h-3.5 text-sky-600" />
              Zero-Paperwork Subsidy Handling
            </span>
          </div>
        </form>
      )}
    </Card>
  );
};
