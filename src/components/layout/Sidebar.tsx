import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Compass,
  Sun,
  Wrench,
  Package,
  Truck,
  ShieldCheck,
  Receipt,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  SunMedium,
  LucideIcon,
} from 'lucide-react';
import { NAVIGATION_GROUPS, NavItem } from '../../constants/navigation';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Compass,
  Sun,
  Wrench,
  Package,
  Truck,
  ShieldCheck,
  Receipt,
  BarChart3,
};

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  onCloseMobile,
}) => {
  const { user } = useAuth();
  const location = useLocation();

  const isRoleAllowed = (item: NavItem): boolean => {
    if (!item.allowedRoles) return true;
    return item.allowedRoles.includes(user.role);
  };

  return (
    <aside
      className={cn(
        'h-full bg-navy-950 text-slate-300 flex flex-col border-r border-navy-800 transition-all duration-300 select-none z-30',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-navy-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-solar-700 text-amber-400 flex items-center justify-center shrink-0 shadow-md">
            <SunMedium className="w-6 h-6 animate-pulse" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="text-sm font-bold tracking-tight text-white block truncate">
                SunPower Solutions
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-solar-400 block truncate">
                Solar ERP Platform
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800/80 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAVIGATION_GROUPS.map((group) => {
          // Filter items by active user role
          const visibleItems = group.items.filter(isRoleAllowed);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.id} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400/90 mb-2">
                  {group.title}
                </p>
              )}

              {visibleItems.map((item) => {
                const Icon = iconMap[item.iconName] || LayoutDashboard;
                const isActive = location.pathname === item.path;

                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 relative',
                      isActive
                        ? 'bg-solar-800 text-white shadow-sm font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-navy-900',
                      isCollapsed && 'justify-center px-0'
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5 shrink-0 transition-colors',
                        isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'
                      )}
                    />

                    {!isCollapsed && (
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 tracking-tight',
                              item.badgeVariant === 'emerald' && 'bg-emerald-950 text-emerald-300 border border-emerald-800/60',
                              item.badgeVariant === 'amber' && 'bg-amber-950 text-amber-300 border border-amber-800/60',
                              item.badgeVariant === 'rose' && 'bg-rose-950 text-rose-300 border border-rose-800/60',
                              item.badgeVariant === 'sky' && 'bg-sky-950 text-sky-300 border border-sky-800/60'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Enterprise Status Footer */}
      <div className="p-3 border-t border-navy-800/80 bg-navy-950">
        {!isCollapsed ? (
          <div className="bg-navy-900/90 rounded-xl p-2.5 border border-navy-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Monthly Target</span>
              <span className="font-semibold text-solar-400">38 / 40 Sites</span>
            </div>
            <div className="w-full bg-navy-950 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-solar-500 h-full rounded-full transition-all duration-500"
                style={{ width: '95%' }}
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <div className="w-2.5 h-2.5 rounded-full bg-solar-500 ring-4 ring-solar-500/20" title="System Online (38/40 Completed)" />
          </div>
        )}
      </div>
    </aside>
  );
};
