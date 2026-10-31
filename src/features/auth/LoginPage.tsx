import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDefaultRouteForRole } from '../../router/ProtectedRoute';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';
import { SunMedium, ArrowRight, Lock, Mail, Shield, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await login({ email, password }, false);

      if (!result.success) {
        setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
        return;
      }

      showToast('Welcome Back', 'Logged in successfully to SunPower ERP', 'success');
      // If user state is populated, redirect to their role-specific dashboard
      const targetRoute = user ? getDefaultRouteForRole(user.role) : '/dashboard';
      navigate(targetRoute);
    } catch {
      setErrorMessage('A network error occurred while connecting to the authentication service.');
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
          to="/customer/login"
          className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
        >
          Customer Portal &rarr;
        </Link>
      </div>

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-solar-800 text-amber-400 mb-3 shadow-md border border-solar-700">
          <SunMedium className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          SunPower Solutions
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Staff Portal & Operations Management System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-7 shadow-xl border-slate-800 bg-slate-900/90 text-slate-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <div>
              <Input
                label="Registered Staff Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@sunpowersolutions.in"
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-solar-500"
                required
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-solar-500"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Workspace
            </Button>
          </form>

          {/* Navigation to Registration & Admin Portal */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span>
              New employee?{' '}
              <Link to="/register" className="text-solar-400 hover:text-solar-300 font-semibold underline underline-offset-2">
                Register staff account
              </Link>
            </span>
            <Link
              to="/admin/login"
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-solar-500" />
              <span>Admin Portal</span>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
