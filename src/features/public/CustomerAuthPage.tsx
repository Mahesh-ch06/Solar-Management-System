import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import {
  customers,
  addCustomer,
} from '../../store/inMemoryDb';
import { Customer } from '../../types/customer';
import {
  SunMedium,
  ArrowRight,
  ShieldCheck,
  Phone,
  Mail,
  User,
  MapPin,
  FileCheck,
  Zap,
  ArrowLeft,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const CUSTOMER_SESSION_KEY = 'sunpower_customer_session';

export function getStoredCustomerSession(): Customer | null {
  try {
    const raw = localStorage.getItem(CUSTOMER_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const fresh = customers.find((c) => c.id === parsed.id || c.phone === parsed.phone);
    return fresh || parsed;
  } catch {
    return null;
  }
}

export function setCustomerSession(customer: Customer): void {
  localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(customer));
}

export function clearCustomerSession(): void {
  localStorage.removeItem(CUSTOMER_SESSION_KEY);
}

export const CustomerAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialMode);

  // Login form state
  const [loginPhoneOrEmail, setLoginPhoneOrEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [consumerNumber, setConsumerNumber] = useState('');
  const [monthlyBill, setMonthlyBill] = useState(searchParams.get('bill') || '3500');
  const [capacity, setCapacity] = useState<'1-2kW' | '3-4kW' | '5kW+' | '10kW+'>(
    (searchParams.get('kw') as any) || '3-4kW'
  );
  const [systemType, setSystemType] = useState<'ON_GRID' | 'OFF_GRID'>('ON_GRID');
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState('');

  // Handle Customer Sign-In
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const query = loginPhoneOrEmail.trim().toLowerCase();
    if (!query) {
      setLoginError('Please enter your registered mobile number or email.');
      return;
    }

    setIsLoginSubmitting(true);
    setTimeout(() => {
      // Find customer by phone, email, or ID
      const matched = customers.find(
        (c) =>
          c.phone.trim().toLowerCase() === query ||
          (c.email && c.email.trim().toLowerCase() === query) ||
          c.id.toLowerCase() === query
      );

      if (!matched) {
        setIsLoginSubmitting(false);
        setLoginError('No customer account found with this phone number or email. Please register below.');
        return;
      }

      setCustomerSession(matched);
      setIsLoginSubmitting(false);
      showToast('Welcome Back', `Logged in as ${matched.name}`, 'success');
      navigate('/portal');
    }, 450);
  };

  // Handle Customer Registration / New Solar Application
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (!name.trim()) {
      setRegisterError('Please enter your full name.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setRegisterError('Please provide a valid 10-digit mobile number.');
      return;
    }

    if (!city.trim()) {
      setRegisterError('Please enter your installation city/district.');
      return;
    }

    setIsRegisterSubmitting(true);
    setTimeout(() => {
      // Check if phone already registered
      const existing = customers.find((c) => c.phone.replace(/\D/g, '') === cleanPhone);
      if (existing) {
        setCustomerSession(existing);
        setIsRegisterSubmitting(false);
        showToast('Existing Account', 'You already had an active project inquiry. Logged you in!', 'info');
        navigate('/portal');
        return;
      }

      const billNum = parseInt(monthlyBill, 10) || 3500;
      const kwMap: Record<string, number> = {
        '1-2kW': 2,
        '3-4kW': 3,
        '5kW+': 5,
        '10kW+': 10,
      };

      const newId = `CUST-${String(customers.length + 1).padStart(3, '0')}`;
      const newCustomer: Customer = {
        id: newId,
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim() || `${cleanPhone}@sunpower.customer`,
        address: address.trim() || `${city}, India`,
        city: city.trim(),
        pincode: pinCode.trim() || '110001',
        monthlyBill: billNum,
        requiredCapacityKW: kwMap[capacity] || 3,
        systemType: systemType,
        subsidyRequired: true,
        enquirySource: 'WEB_FORM',
        status: 'NEW',
        assignedTo: 'Vikram Mehta',
        notes: `Customer registered via SunPower Web Portal. DISCOM CA No: ${consumerNumber || 'Pending'}. Sizing: ${capacity}.`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addCustomer(newCustomer);
      setCustomerSession(newCustomer);
      setIsRegisterSubmitting(false);

      showToast(
        'Account Created Successfully!',
        'Your solar application has been registered. You can now track PM Surya Ghar subsidy and site survey.',
        'success'
      );
      navigate('/portal');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-solar-500 selection:text-white">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-solar-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Bar / Back to Home */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6 flex items-center justify-between z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to SunPower Website</span>
        </Link>
        <Link
          to="/login"
          className="text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors"
        >
          Staff ERP Login &rarr;
        </Link>
      </div>

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-solar-500/10 text-solar-400 mb-3 shadow-md border border-solar-500/20">
          <SunMedium className="w-6 h-6 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Customer Solar Portal
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Track PM Surya Ghar subsidy, site survey reports, DISCOM approvals & equipment warranties.
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 border-b border-slate-800 bg-slate-950/60 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setLoginError('');
              }}
              className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Customer Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setRegisterError('');
              }}
              className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Solar Account
            </button>
          </div>

          <div className="p-6">
            {/* LOGIN TAB */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {loginError}
                  </div>
                )}

                <div className="p-3 rounded-xl bg-solar-500/10 border border-solar-500/20 text-xs text-solar-300 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-solar-400" />
                    Instant Project Tracking
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Sign in with the mobile phone number or email you used when booking your rooftop consultation.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Registered Mobile Number or Email *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={loginPhoneOrEmail}
                      onChange={(e) => setLoginPhoneOrEmail(e.target.value)}
                      placeholder="e.g. 9811223344 or name@example.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-solar-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Password or Portal PIN (Optional)
                    </label>
                    <span className="text-[10px] text-slate-400">Direct phone lookup enabled</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Leave blank for instant OTP-less mobile login"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-solar-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full mt-2 font-bold bg-solar-600 hover:bg-solar-500 text-white"
                  isLoading={isLoginSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Access My Solar Project
                </Button>

                <div className="text-center pt-2">
                  <p className="text-xs text-slate-400">
                    New to SunPower?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="text-solar-400 font-semibold hover:underline"
                    >
                      Apply for Rooftop Solar &rarr;
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* REGISTER TAB */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                {registerError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {registerError}
                  </div>
                )}

                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    PM Surya Ghar Subsidy Eligible
                  </p>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    We will automatically size your rooftop system and prepare your DBT subsidy filing (up to ₹78,000).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name (as per Electricity Bill) *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Chandra Sharma"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-solar-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10-digit number"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-solar-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@email.com"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-solar-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      City / District *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Gurugram, Delhi, Noida"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-solar-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Monthly Electricity Bill (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={500}
                      value={monthlyBill}
                      onChange={(e) => setMonthlyBill(e.target.value)}
                      placeholder="e.g. 4500"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-solar-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Installation Address & Landmark
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Sector 45, Near Cyber Park"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-solar-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      placeholder="e.g. 122001"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-solar-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Desired Sizing
                    </label>
                    <select
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-solar-500"
                    >
                      <option value="1-2kW">1-2 kW (Bill ₹1,500 - ₹3,000)</option>
                      <option value="3-4kW">3-4 kW (Bill ₹3,500 - ₹6,500)</option>
                      <option value="5kW+">5 kW (Bill ₹7,000 - ₹12,000)</option>
                      <option value="10kW+">10 kW+ (Villas / Societies)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      System Architecture
                    </label>
                    <select
                      value={systemType}
                      onChange={(e) => setSystemType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-solar-500"
                    >
                      <option value="ON_GRID">On-Grid (Net Metering Subsidy)</option>
                      <option value="OFF_GRID">Off-Grid (Battery Energy Storage)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Electricity CA / Consumer Number (Optional)
                  </label>
                  <div className="relative">
                    <FileCheck className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={consumerNumber}
                      onChange={(e) => setConsumerNumber(e.target.value)}
                      placeholder="e.g. 1002349887 (found on electricity bill)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-solar-500"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>I authorize SunPower Solutions to verify technical feasibility with my local DISCOM for PM Surya Ghar subsidy disbursement.</span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full mt-2 font-bold bg-solar-600 hover:bg-solar-500 text-white"
                  isLoading={isRegisterSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Submit & Open Solar Tracker
                </Button>

                <div className="text-center pt-1">
                  <p className="text-xs text-slate-400">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="text-solar-400 font-semibold hover:underline"
                    >
                      Sign In &rarr;
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        </Card>
      </div>

      {/* Trust Footer */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mt-6 text-center text-xs text-slate-500 space-y-1">
        <p>Direct Benefit Transfer (DBT) funds credited by Ministry of New and Renewable Energy (MNRE).</p>
        <p>&copy; {new Date().getFullYear()} SunPower Solutions. All rights reserved.</p>
      </div>
    </div>
  );
};
