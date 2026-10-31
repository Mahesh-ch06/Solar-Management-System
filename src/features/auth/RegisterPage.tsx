import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';
import { SunMedium, ArrowRight, Lock, Mail, User, Phone, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRegisteredSuccess, setIsRegisteredSuccess] = useState(false);

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
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await register({
        name,
        email,
        phone,
        password,
        confirmPassword,
        department,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Registration failed.');
        return;
      }

      setIsRegisteredSuccess(true);
      showToast('Registration Submitted', 'Your account is pending administrator activation.', 'success');
    } catch {
      setErrorMessage('A network error occurred while submitting your registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-solar-500 selection:text-white">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-solar-800 text-amber-400 mb-3 shadow-md border border-solar-700">
          <SunMedium className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Staff Account Registration
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Join SunPower Solutions Operations Team
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-7 shadow-xl border-slate-800 bg-slate-900/90 text-slate-100">
          {isRegisteredSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Application Received</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Your employee profile has been registered and is currently in status{' '}
                  <span className="font-semibold text-amber-400">PENDING_APPROVAL</span>.
                </p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  An administrator has been notified. You will be assigned your authorized role
                  and receive an email confirmation once activated.
                </p>
              </div>

              <div className="pt-4">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  onClick={() => navigate('/login')}
                >
                  Return to Staff Login
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Chandra"
                leftIcon={<User className="w-4 h-4 text-slate-400" />}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500"
                required
              />

              <Input
                label="Work Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. ramesh@sunpowersolutions.in"
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500"
                required
              />

              <Input
                label="Mobile Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 98111 22334"
                leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500"
                required
              />

              <div>
                <Select
                  label="Department / Team"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  options={[
                    { label: 'Commercial Solutions (Sales)', value: 'Commercial Solutions (Sales)' },
                    { label: 'Field Engineering & Surveys', value: 'Field Engineering & Surveys' },
                    { label: 'Warehouse & Logistics', value: 'Warehouse & Logistics' },
                    { label: 'Customer Success & Warranty Support', value: 'Customer Success & Warranty Support' },
                  ]}
                  className="bg-slate-950 border-slate-800 text-white"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  * System role will be verified and assigned by an administrator.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500"
                  required
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500"
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
                Submit Staff Registration
              </Button>

              <div className="mt-4 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-solar-400 hover:text-solar-300 font-semibold underline underline-offset-2">
                  Sign in here
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
