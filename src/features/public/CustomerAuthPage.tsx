import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
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
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Top Bar / Back to Home */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6 flex items-center justify-between z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to SunPower Website</span>
        </Link>
        <Link
          to="/login"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          Staff ERP Login &rarr;
        </Link>
      </div>

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mb-3 shadow-xs border border-amber-200">
          <SunMedium className="w-6 h-6 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Customer Solar Portal
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Track PM Surya Ghar subsidy, site survey reports, DISCOM approvals & equipment warranties.
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <Card className="bg-white border-slate-200 shadow-xl overflow-hidden rounded-3xl">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setLoginError('');
              }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
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
              className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
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
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {loginError}
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-amber-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    Instant Project Tracking
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Sign in with the mobile phone number or email you used when booking your rooftop consultation.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Registered Mobile Number or Email *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={loginPhoneOrEmail}
                      onChange={(e) => setLoginPhoneOrEmail(e.target.value)}
                      placeholder="e.g. 9811223344 or name@example.com"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Password or Portal PIN (Optional)
                    </label>
                    <span className="text-[10px] text-slate-400">Direct phone lookup enabled</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Leave blank for instant mobile login"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoginSubmitting}
                  className="w-full mt-2 font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {isLoginSubmitting ? 'Accessing...' : 'Access My Solar Project'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2">
                  <p className="text-xs text-slate-500">
                    New to SunPower?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="text-amber-600 font-bold hover:underline"
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
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {registerError}
                  </div>
                )}

                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-slate-700">
                  <p className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600" />
                    PM Surya Ghar Subsidy Eligible
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    We will automatically size your rooftop system and prepare your DBT subsidy filing (up to ₹78,000).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name (as per Electricity Bill) *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Chandra Sharma"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10-digit number"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@email.com"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      City / District *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Gurugram, Delhi, Noida"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Monthly Electricity Bill (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={500}
                      value={monthlyBill}
                      onChange={(e) => setMonthlyBill(e.target.value)}
                      placeholder="e.g. 4500"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Installation Address & Landmark
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Sector 45, Near Cyber Park"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      placeholder="e.g. 122001"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Desired Sizing
                    </label>
                    <select
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                    >
                      <option value="1-2kW">1-2 kW (Bill ₹1,500 - ₹3,000)</option>
                      <option value="3-4kW">3-4 kW (Bill ₹3,500 - ₹6,500)</option>
                      <option value="5kW+">5 kW (Bill ₹7,000 - ₹12,000)</option>
                      <option value="10kW+">10 kW+ (Villas / Societies)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      System Architecture
                    </label>
                    <select
                      value={systemType}
                      onChange={(e) => setSystemType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                    >
                      <option value="ON_GRID">On-Grid (Net Metering Subsidy)</option>
                      <option value="OFF_GRID">Off-Grid (Battery Energy Storage)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Electricity CA / Consumer Number (Optional)
                  </label>
                  <div className="relative">
                    <FileCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={consumerNumber}
                      onChange={(e) => setConsumerNumber(e.target.value)}
                      placeholder="e.g. 1002349887 (found on electricity bill)"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>I authorize SunPower Solutions to verify technical feasibility with my local DISCOM for PM Surya Ghar subsidy disbursement.</span>
                </div>

                <button
                  type="submit"
                  disabled={isRegisterSubmitting}
                  className="w-full mt-2 font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {isRegisterSubmitting ? 'Registering...' : 'Submit & Open Solar Tracker'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-1">
                  <p className="text-xs text-slate-500">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="text-amber-600 font-bold hover:underline"
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
