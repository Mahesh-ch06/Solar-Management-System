import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Administrator email and password are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await login({ email, password }, true);

      if (!result.success) {
        setErrorMessage(result.error || 'Authentication denied. Verify administrator credentials.');
        return;
      }

      showToast('Admin authenticated', 'Administrator session initialized.', 'success');
      navigate('/admin/users');
    } catch {
      setErrorMessage('An error occurred while connecting to the authentication service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 sm:p-10">
        {/* Back link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Staff Sign In
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4 text-amber-600 shadow-xs">
            <Shield className="w-6 h-6 text-amber-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Portal</h1>
          <p className="text-xs text-slate-500 mt-1">
            Restricted access. System administration, role governance, and audit trails.
          </p>
        </div>

        {/* Security notice */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/60 mb-6">
          <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
            This gateway is restricted to authorized system administrators only. All login telemetry and IP attempts are logged.
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 leading-relaxed font-medium">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Administrator Email</label>
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
            <label className="block text-xs font-bold text-slate-700">Security Passphrase</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
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
              <>Authenticate as Admin <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between text-xs">
          <Link to="/register" className="text-slate-500 hover:text-slate-800 font-medium">
            First-time staff registration?
          </Link>
          <Link to="/" className="text-amber-600 hover:text-amber-700 font-bold">
            Public Website →
          </Link>
        </div>
      </div>
    </div>
  );
};
