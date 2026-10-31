import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../utils/formatters';
import {
  customers,
  surveys,
  quotations,
  orders,
  installationJobs,
  warrantyRecords,
} from '../../store/inMemoryDb';
import { Customer } from '../../types/customer';
import {
  getStoredCustomerSession,
  clearCustomerSession,
} from './CustomerAuthPage';
import {
  SunMedium,
  Search,
  CheckCircle2,
  ShieldCheck,
  Phone,
  ArrowLeft,
  AlertCircle,
  LogOut,
  User,
} from 'lucide-react';

export const CustomerPortalPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('phone') || '');
  const [hasSearched, setHasSearched] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const handleSearch = (query: string) => {
    const clean = query.trim().toLowerCase();
    if (!clean) return;

    setHasSearched(true);
    const found =
      customers.find((c) => c.phone.trim().toLowerCase() === clean) ||
      customers.find((c) => c.id.toLowerCase() === clean) ||
      customers.find((c) => c.name.toLowerCase().includes(clean)) ||
      null;

    setCustomer(found);
  };

  useEffect(() => {
    const initialPhone = searchParams.get('phone');
    if (initialPhone) {
      handleSearch(initialPhone);
    } else {
      const stored = getStoredCustomerSession();
      if (stored) {
        setCustomer(stored);
        setSearchQuery(stored.phone);
        setHasSearched(true);
      }
    }
  }, [searchParams]);

  const handleSignOut = () => {
    clearCustomerSession();
    setCustomer(null);
    setHasSearched(false);
    setSearchQuery('');
  };

  // Associated operational entities
  const customerSurvey = customer ? surveys.find((s) => s.customerId === customer.id) : undefined;
  const customerQuotation = customer ? quotations.find((q) => q.customerId === customer.id) : undefined;
  const customerOrder = customer ? orders.find((o) => o.customerId === customer.id) : undefined;
  const customerJob = customer ? installationJobs.find((j) => j.customerId === customer.id) : undefined;
  const customerWarranties = customer ? warrantyRecords.filter((w) => w.customerId === customer.id) : [];

  // Determine stage progression (0 to 5)
  const currentStep = !customer
    ? 0
    : customerJob?.stage === 'COMMISSIONED'
    ? 5
    : customerJob
    ? 4
    : customerOrder
    ? 3
    : customerQuotation
    ? 2
    : customerSurvey
    ? 1
    : 0;

  const steps = [
    { title: 'Inquiry Registered', desc: 'Rooftop consultation booked' },
    { title: 'Site Survey Completed', desc: 'Shadow analysis & 3D measurements' },
    { title: 'Quotation & BOM Approved', desc: 'System sized & subsidy calculated' },
    { title: 'DISCOM Feasibility Approval', desc: 'National portal paperwork filed' },
    { title: 'Rooftop Installation', desc: 'Mounting & inverter wiring' },
    { title: 'Commissioned & Subsidy DBT', desc: 'Net meter energized & subsidy released' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <SunMedium className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900">SunPower Solutions</span>
              <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider leading-none">Customer Tracking Portal</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 hidden sm:flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>

            {customer ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-bold truncate max-w-[130px]">{customer.name}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="border-slate-300 text-slate-700 hover:bg-slate-100"
                  leftIcon={<LogOut className="w-3.5 h-3.5 text-slate-500" />}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/customer/login">
                  <Button variant="primary" size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                    Customer Sign In
                  </Button>
                </Link>
                <Link to="/customer/register">
                  <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-100 hidden md:inline-flex">
                    Create Account
                  </Button>
                </Link>
              </div>
            )}

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 text-xs">
                Staff ERP
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <Badge variant="amber" size="md" className="mb-2">
            <Search className="w-3.5 h-3.5 mr-1 text-amber-600" />
            Live Project Tracker
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Track Your Rooftop Solar & Subsidy Status
          </h1>
          <p className="text-xs text-slate-600 mt-2">
            Enter the 10-digit mobile number used during registration or your Application Reference Number.
          </p>

          {/* Quick Account Links if not logged in */}
          {!customer && (
            <div className="mt-3 flex items-center justify-center gap-3 text-xs text-slate-500">
              <span>Have an account?</span>
              <Link to="/customer/login" className="text-amber-600 font-bold hover:underline">
                Sign In to Portal
              </Link>
              <span>•</span>
              <Link to="/customer/register" className="text-amber-600 font-bold hover:underline">
                New Solar Registration
              </Link>
            </div>
          )}

          {/* Search Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(searchQuery);
            }}
            className="mt-6 flex gap-2 max-w-md mx-auto"
          >
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. 9810123456 or CUST-..."
              className="bg-white border-slate-300 text-slate-900"
            />
            <Button
              type="submit"
              variant="primary"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shrink-0 shadow-xs"
              leftIcon={<Search className="w-4 h-4" />}
            >
              Track Status
            </Button>
          </form>
        </div>

        {hasSearched && !customer && (
          <Card className="bg-white border-slate-200 p-8 text-center max-w-md mx-auto shadow-md rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Application Found</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              We couldn't find an active solar application matching <strong className="text-slate-800">"{searchQuery}"</strong>. Please verify the mobile number or create a new application account.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <Link to="/customer/register">
                <Button variant="primary" size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                  Create Account & Apply
                </Button>
              </Link>
              <Link to="/#quote-form">
                <Button variant="outline" size="sm" className="border-slate-300 text-slate-700">
                  Book Free Survey
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {customer && (
          <div className="space-y-6">
            {/* Overview Card */}
            <Card className="bg-white border-slate-200 p-6 rounded-2xl shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">{customer.name}</h2>
                    <Badge variant="emerald" size="sm">
                      {customer.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span>{customer.city}, {customer.pincode}</span>
                    <span>•</span>
                    <span>Mobile: {customer.phone}</span>
                  </p>
                </div>

                <div className="text-right sm:text-right">
                  <p className="text-[11px] text-slate-400 font-medium">Application Reference</p>
                  <p className="text-sm font-bold text-amber-600 font-mono">{customer.id}</p>
                </div>
              </div>

              {/* System Specs Pill Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">System Capacity</p>
                  <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">{customer.requiredCapacityKW} kW</p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-[10px] text-amber-800 uppercase font-bold">Configuration</p>
                  <p className="text-sm font-bold text-amber-700 mt-0.5">
                    {customer.systemType === 'ON_GRID' ? 'On-Grid Net Meter' : 'Hybrid with Battery'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-[10px] text-emerald-800 uppercase font-bold">PM Surya Ghar Subsidy</p>
                  <p className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
                    {customer.subsidyRequired ? (customer.requiredCapacityKW <= 2 ? '₹60,000' : '₹78,000') : 'Not Applied'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Assigned Engineer</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{customer.assignedTo || 'Lead Solar Engineer'}</p>
                </div>
              </div>
            </Card>

            {/* Stepper Progress Bar */}
            <Card className="bg-white border-slate-200 p-6 rounded-2xl shadow-sm">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-base text-slate-900">Project Milestones & Verification</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {steps.map((step, idx) => {
                    const isDone = idx <= currentStep;
                    const isCurrent = idx === currentStep;

                    return (
                      <div key={step.title} className="relative flex items-start gap-4">
                        {/* Dot indicator */}
                        <div
                          className={`absolute -left-6 sm:-left-8 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white ${
                            isDone
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>

                        <div>
                          <p className={`text-xs font-bold ${isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                            {step.title}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                          {isCurrent && (
                            <span className="inline-block mt-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                              Current In-Progress Stage
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Warranties & Registered Equipment Card */}
            {customerWarranties.length > 0 && (
              <Card className="bg-white border-slate-200 p-6 rounded-2xl shadow-sm">
                <CardHeader className="p-0 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <CardTitle className="text-base text-slate-900">Registered Equipment Warranties</CardTitle>
                  </div>
                  <Badge variant="emerald" size="sm">Active Coverage</Badge>
                </CardHeader>
                <div className="divide-y divide-slate-100">
                  {customerWarranties.map((w) => (
                    <div key={w.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{w.itemName}</p>
                        <p className="text-slate-500 text-[11px] font-mono mt-0.5">SN: {w.serialNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-700 font-bold">{w.warrantyYears} Years Warranty</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Expires: {formatDate(w.warrantyExpiryDate)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Need Assistance Card */}
            <Card className="bg-slate-50 border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Have questions about your installation?</p>
                  <p className="text-[11px] text-slate-500">Our customer care desk is available Monday through Saturday, 9 AM to 7 PM.</p>
                </div>
              </div>

              <a
                href="tel:+919810123456"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shrink-0 transition-colors shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call +91 98101 23456</span>
              </a>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};
