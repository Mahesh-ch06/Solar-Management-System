import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/roles';
import { ROLE_CONFIGS } from '../constants/roles';
import { Button } from '../components/ui/Button';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * Returns the default authorized landing page for a user's role
 */
export function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
    case 'DIRECTOR':
      return '/';
    case 'SALES':
      return '/customers';
    case 'TECHNICIAN':
      return '/installations';
    case 'WAREHOUSE_MANAGER':
      return '/inventory';
    case 'SUPPORT_AGENT':
      return '/service-tickets';
    default:
      return '/';
  }
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-solar-700 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Verifying security session...</p>
        </div>
      </div>
    );
  }

  // Not authenticated -> redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const userRoleConfig = ROLE_CONFIGS[user.role];
    const defaultRoute = getDefaultRouteForRole(user.role);

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-lg space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Access Restricted</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Your account is currently assigned to the{' '}
              <strong className="text-slate-800">{userRoleConfig.label}</strong> role. This feature
              is restricted to authorized roles.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 border border-slate-100 text-left space-y-1">
            <p>
              <span className="text-slate-400">Authenticated User:</span>{' '}
              <strong className="text-slate-800">{user.name}</strong>
            </p>
            <p>
              <span className="text-slate-400">Assigned Department:</span>{' '}
              <span className="text-slate-700">{user.department || 'General'}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate(defaultRoute)}
            >
              Go to My Workspace
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              leftIcon={<LogOut className="w-4 h-4" />}
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : null;
};
