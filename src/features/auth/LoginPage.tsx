import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDefaultRouteForRole } from '../../router/ProtectedRoute';
import { useToast } from '../../context/ToastContext';
import { SunMedium, ArrowRight, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Email and password are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await login({ email, password }, false);

      if (!result.success) {
        setErrorMessage(result.error || 'Authentication failed. Please verify your credentials.');
        return;
      }

      showToast('Welcome back', 'Signed in successfully.', 'success');
      const targetRoute = user ? getDefaultRouteForRole(user.role) : '/dashboard';
      navigate(targetRoute);
    } catch {
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col md:flex-row">
        {/* Left panel — branding */}
        <div className="md:w-5/12 bg-gradient-to-br from-amber-50 via-amber-100/60 to-orange-50 border-r border-amber-200/80 text-slate-900 p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-xs">
                <SunMedium className="w-5 h-5 text-slate-950" strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-[17px] font-bold text-slate-900 tracking-tight block">SunPower Solutions</span>
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Staff Operations ERP</span>
              </div>
            </div>
          </div>

          <div className="space-y-6 my-8 relative z-10">
            <div className="border-l-4 border-amber-500 pl-4 py-1">
              <p className="text-[13px] font-semibold text-slate-700 leading-relaxed">
                "Empowering clean energy delivery across India through intelligent rooftop operations & unified execution."
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { label: 'Live Installations', value: '500+' },
                { label: 'Surya Ghar Cap', value: '₹78K' },
                { label: 'Module Warranty', value: '25 Yr' },
                { label: 'Customer Rating', value: '4.9★' },
              ].map((s) => (
                <div key={s.label} className="bg-white/90 border border-amber-200/80 rounded-xl p-3 shadow-xs">
                  <p className="text-[17px] font-extrabold text-slate-900 font-mono">{s.value}</p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-amber-200/80 flex items-center justify-between text-[11px] text-slate-600 relative z-10 font-medium">
            <span>© {new Date().getFullYear()} SunPower EPC Ltd.</span>
            <Link to="/" className="text-amber-700 hover:text-amber-800 font-bold">Public Site →</Link>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-sm mx-auto w-full">
            <div className="mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 inline-block mb-2">
                Staff Authentication
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in to ERP</h1>
              <p className="text-xs text-slate-500 mt-1">
                Enter your authorized employee credentials to access operational tools.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-700 leading-relaxed font-medium">{errorMessage}</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. maheshch1094@gmail.com"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 pl-10 pr-4 py-2.5 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 pl-10 pr-10 py-2.5 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
                  <>Sign In to Workspace <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                New staff member?{' '}
                <Link to="/register" className="text-amber-600 hover:text-amber-700 font-bold underline underline-offset-2">
                  Register
                </Link>
              </span>
              <Link to="/admin/login" className="text-slate-600 hover:text-slate-900 font-semibold">
                Admin Portal →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
