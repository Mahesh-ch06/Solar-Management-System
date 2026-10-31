import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, MOCK_USERS } from '../../context/AuthContext';
import { UserRole } from '../../types/roles';
import { ROLE_CONFIGS } from '../../constants/roles';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';
import { SunMedium, Shield, ArrowRight, Lock, Mail } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { switchRole } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('rajesh.admin@sunpowersolutions.in');
  const [password, setPassword] = useState('password123');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Validation Error', 'Please enter email and password', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      showToast('Welcome Back', 'Logged in successfully to SunPower ERP', 'success');
      navigate('/');
    }, 400);
  };

  const handleFastRoleSelect = (role: UserRole) => {
    switchRole(role);
    const user = MOCK_USERS[role];
    setEmail(user.email);
    showToast('Role Switched', `Active credentials set to ${ROLE_CONFIGS[role].label}`, 'info');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Solar Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-solar-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-solar-800 text-amber-400 mb-4 shadow-xl border border-solar-700">
          <SunMedium className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          SunPower Solutions ERP
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Enterprise Solar Installation & Operations Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Card className="p-8 shadow-2xl border-white/10 bg-slate-950/80 backdrop-blur-md">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Staff Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. employee@sunpowersolutions.in"
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to ERP Portal
            </Button>
          </form>

          {/* Quick Role-Switcher Testing Shortcuts */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Shield className="w-3.5 h-3.5 text-solar-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                1-Click Role Preview (Dev Mode)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(MOCK_USERS) as UserRole[]).map((r) => {
                const cfg = ROLE_CONFIGS[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleFastRoleSelect(r)}
                    className="p-2 text-left rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <span className="text-xs font-semibold text-slate-200 block truncate">
                      {cfg.label}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {r.replace('_', ' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
