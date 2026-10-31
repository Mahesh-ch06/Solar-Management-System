import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SunMedium, ArrowRight, Lock, Mail, User, Phone, CheckCircle, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Commercial Solutions (Sales)');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRegisteredSuccess, setIsRegisteredSuccess] = useState(false);
  const [isInitialAdminCreated, setIsInitialAdminCreated] = useState(false);

  const departments = [
    'Commercial Solutions (Sales)',
    'Field Engineering & Surveys',
    'Warehouse & Logistics',
    'Customer Success & Warranty Support',
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await register({ name, email, phone, password, confirmPassword, department });

      if (!result.success) {
        setErrorMessage(result.error || 'Registration failed. Please try again.');
        return;
      }

      if (result.isInitialAdmin) {
        setIsInitialAdminCreated(true);
        showToast('Setup complete', 'Administrator account created.', 'success');
      } else {
        showToast('Registration submitted', 'Your account is pending administrator approval.', 'success');
      }

      setIsRegisteredSuccess(true);
    } catch {
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 sm:p-10">
        {/* Back */}
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Staff Sign In
        </Link>

        {isRegisteredSuccess ? (
          /* ── Success State ── */
          <div className="text-center py-6 space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                {isInitialAdminCreated ? 'Admin Account Created' : 'Application Received'}
              </h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {isInitialAdminCreated
                  ? 'Your account has been provisioned as System Administrator with ACTIVE status.'
                  : 'Your registration is pending administrator approval. You will be notified once activated.'}
              </p>
            </div>
            <button
              onClick={() => navigate(isInitialAdminCreated ? '/admin/login' : '/login')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              {isInitialAdminCreated ? 'Go to Admin Portal' : 'Go to Login'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* ── Registration Form ── */
          <>
            <div className="mb-6">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-xs">
                  <SunMedium className="w-4.5 h-4.5" strokeWidth={2.5} />
                </div>
                <span className="text-[14px] font-bold text-slate-900">SunPower Solutions</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Staff Account</h1>
              <p className="text-xs text-slate-500 mt-1">
                Register as an employee. Administrator authorization required for system access.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-3.5">
              {errorMessage && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-700 leading-relaxed font-medium">{errorMessage}</p>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 pl-10 pr-4 py-2.5 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ramesh@sunpowersolutions.in"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 pl-10 pr-4 py-2.5 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 pl-10 pr-4 py-2.5 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 px-3.5 py-2.5 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                >
                  {departments.map((d) => (
                    <option key={d} value={d} className="text-slate-800">{d}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500">Official role privileges will be approved by an administrator.</p>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 pl-8 pr-8 py-2.5 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Confirm</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat"
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 pl-8 pr-4 py-2.5 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  <>Submit Registration <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="mt-5 text-center text-xs">
              <span className="text-slate-500">
                Already registered?{' '}
                <Link to="/login" className="text-amber-600 hover:text-amber-700 font-bold underline underline-offset-2">
                  Sign in
                </Link>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
