import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  User as UserIcon,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_CONFIGS } from '../../constants/roles';
import { Breadcrumb } from './Breadcrumb';

interface TopNavbarProps {
  onOpenMobileMenu: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) return null;

  const currentRoleConfig = ROLE_CONFIGS[user.role] || {
    label: user.role,
    badgeColor: 'bg-slate-100 text-slate-700',
  };

  const handleSignOut = () => {
    logout();
    setIsUserDropdownOpen(false);
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 shadow-xs">
      {/* Left: Mobile Menu Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <Breadcrumb />
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md mx-4 hidden lg:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, customers, serial numbers, tickets..."
            className="w-full bg-slate-50 text-slate-800 placeholder:text-slate-400 text-xs rounded-lg border border-slate-200 pl-9 pr-4 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-solar-500/20 focus:border-solar-600 transition-all"
          />
        </div>
      </div>

      {/* Right: Notifications & Verified User Profile */}
      <div className="flex items-center gap-3">
        {/* Role Badge Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5 text-solar-700" />
          <span>{currentRoleConfig.label}</span>
        </div>

        {/* Notifications Icon */}
        <button
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="System Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-solar-600 ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-slate-200 mx-0.5 hidden sm:block" />

        {/* User Account Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-solar-800 text-amber-300 font-bold text-xs flex items-center justify-center shadow-xs">
              {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="hidden md:block text-left">
              <span className="text-xs font-semibold text-slate-800 block leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-500 block leading-tight truncate max-w-[140px]">
                {user.department || currentRoleConfig.label}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isUserDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsUserDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-fade-in">
                <div className="px-3.5 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  <div className="mt-1.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${currentRoleConfig.badgeColor}`}>
                      Role: {currentRoleConfig.label}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  {user.role === 'ADMIN' && (
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        navigate('/admin/users');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                    >
                      <Shield className="w-4 h-4 text-purple-600" />
                      <span>User Management & RBAC</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>My Profile & Settings</span>
                  </button>

                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors border-t border-slate-100 mt-1"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
