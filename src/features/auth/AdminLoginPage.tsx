import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';
import { Shield, Lock, Mail, ArrowRight, AlertTriangle, ArrowLeft } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter administrator email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await login({ email, password }, true);

      if (!result.success) {
        setErrorMessage(result.error || 'Authentication denied. Verify admin credentials.');
        return;
      }

      showToast('Admin Authenticated', 'Administrator security session initialized.', 'success');
      navigate('/admin/users');
    } catch {
      setErrorMessage('An error occurred while communicating with the security authority.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-solar-500 selection:text-white">
      {/* Top Website Links */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6 flex items-center justify-between z-10">
        <Link
          to="/"
          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          &larr; Back to Website
        </Link>
        <Link
          to="/login"
          className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
        >
          Staff Login &rarr;
        </Link>
      </div>

      {/* Brand & Security Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-950 text-purple-400 mb-3 shadow-lg border border-purple-800">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          System Administration
        </h1>
        <p className="mt-1 text-xs text-purple-300 font-medium">
          Authorized Security & Management Gateway
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-7 shadow-2xl border-purple-900/50 bg-slate-900/90 text-slate-100">
          <div className="p-3 mb-4 rounded-lg bg-purple-950/40 border border-purple-900/60 text-purple-200 text-xs flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              This terminal is restricted exclusively to authorized enterprise administrators. All access
              attempts and role changes are recorded in the system audit log.
            </span>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <div>
              <Input
                label="Administrator Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sunpowersolutions.in"
                leftIcon={<Mail className="w-4 h-4 text-purple-400" />}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-purple-500"
                required
              />
            </div>

            <div>
              <Input
                label="Admin Security Passphrase"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                leftIcon={<Lock className="w-4 h-4 text-purple-400" />}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-purple-500"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 bg-purple-600 hover:bg-purple-700 border-purple-500"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Authenticate Administrator
            </Button>
          </form>

          {/* Return to standard staff login */}
          <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <Link
              to="/login"
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Standard Staff Login</span>
            </Link>

            <Link
              to="/register"
              className="text-[11px] text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              First-Time Setup? Register
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
