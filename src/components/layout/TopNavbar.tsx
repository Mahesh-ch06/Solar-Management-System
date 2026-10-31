import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, Bell, Menu, ChevronDown, LogOut, Shield, ExternalLink,
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) return null;

  const roleConfig = ROLE_CONFIGS[user.role] || { label: user.role, badgeColor: '' };
  const initials = user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const handleSignOut = () => {
    logout();
    setIsDropdownOpen(false);
    navigate('/login');
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-5 flex items-center justify-between shrink-0 z-20 shadow-xs">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <Breadcrumb />
        </div>
      </div>

      {/* Center — search */}
      <div className="flex-1 max-w-sm mx-4 hidden lg:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers, jobs, tickets…"
            className="w-full bg-slate-50 border border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-400 rounded-lg pl-9 pr-4 py-1.5 focus:outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/10 transition-all"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2.5">
        {/* View website */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
        >
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          Website
        </a>

        {/* Role badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700">
          <Shield className="w-3 h-3 text-amber-500" />
          {roleConfig.label}
        </div>

        {/* Notifications */}
        <button className="relative p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
        </button>

        <div className="w-px h-4 bg-slate-200 mx-0.5 hidden sm:block" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[11px] flex items-center justify-center">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <span className="text-[12px] font-semibold text-slate-800 block leading-tight">{user.name}</span>
              <span className="text-[10px] text-slate-500 block leading-tight truncate max-w-[120px]">
                {user.department || roleConfig.label}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-40 animate-fade-in">
                {/* User info */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-[13px] font-bold text-slate-900">{user.name}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</p>
                  <span className="inline-block mt-2 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    {roleConfig.label}
                  </span>
                </div>

                <div className="py-1">
                  {(user.role === 'ADMIN' || user.role === 'DIRECTOR') && (
                    <button
                      onClick={() => { setIsDropdownOpen(false); navigate('/admin/users'); }}
                      className="w-full text-left px-4 py-2 text-[13px] text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-500" />
                      User Management
                    </button>
                  )}
                  <Link
                    to="/"
                    target="_blank"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full text-left px-4 py-2 text-[13px] text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    View Website
                  </Link>
                </div>

                <div className="border-t border-slate-100 py-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-[13px] font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    Sign Out
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
