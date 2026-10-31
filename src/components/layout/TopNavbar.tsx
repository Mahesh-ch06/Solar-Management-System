import React, { useState } from 'react';
import {
  Search,
  Bell,
  Menu,
  Shield,
  Check,
  ChevronDown,
  Database,
  User as UserIcon,
  LogOut,
} from 'lucide-react';
import { useAuth, MOCK_USERS } from '../../context/AuthContext';
import { UserRole } from '../../types/roles';
import { ROLE_CONFIGS } from '../../constants/roles';
import { Breadcrumb } from './Breadcrumb';
import { cn } from '../../utils/cn';

interface TopNavbarProps {
  onOpenMobileMenu: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenMobileMenu }) => {
  const { user, switchRole, logout } = useAuth();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentRoleConfig = ROLE_CONFIGS[user.role];

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 shadow-xs">
      {/* Left: Mobile Menu Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          aria-label="Open mobile menu"
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
            placeholder="Search by customer name, serial number, phone, project ID..."
            className="w-full bg-slate-50 text-slate-800 placeholder:text-slate-400 text-xs rounded-lg border border-slate-200 pl-9 pr-4 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-solar-500/20 focus:border-solar-600 transition-all"
          />
        </div>
      </div>

      {/* Right: Environment Pill, Notifications & Role / Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mock Data Transparency Pill */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-semibold"
          title="Centralized mock adapter enabled for Phase 1 frontend development"
        >
          <Database className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span>MOCK ADAPTER</span>
        </div>

        {/* Role Switcher Menu (Interactive Dev Tool for Stakeholders) */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-solar-700" />
            <span className="hidden sm:inline">Role:</span>
            <span className="font-semibold text-slate-900">{currentRoleConfig.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isRoleDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsRoleDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-fade-in">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Switch Active Role
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Test role-based navigation and permission scopes
                  </p>
                </div>
                {Object.keys(MOCK_USERS).map((roleKey) => {
                  const role = roleKey as UserRole;
                  const cfg = ROLE_CONFIGS[role];
                  const isSelected = user.role === role;

                  return (
                    <button
                      key={role}
                      onClick={() => {
                        switchRole(role);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-xs flex items-start gap-2.5 hover:bg-slate-50 transition-colors',
                        isSelected && 'bg-solar-50/60'
                      )}
                    >
                      <div className="mt-0.5">
                        {isSelected ? (
                          <Check className="w-4 h-4 text-solar-700" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800">{cfg.label}</div>
                        <div className="text-[10px] text-slate-500 leading-tight">
                          {cfg.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Notifications Icon */}
        <button
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Notifications (3 unread)"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-solar-600 ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-solar-800 text-amber-300 font-semibold text-xs flex items-center justify-center shadow-xs">
              {user.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="hidden md:block text-left">
              <span className="text-xs font-semibold text-slate-800 block leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-500 block leading-tight">
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
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-fade-in">
                <div className="px-3.5 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900">{user.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setIsUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
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
