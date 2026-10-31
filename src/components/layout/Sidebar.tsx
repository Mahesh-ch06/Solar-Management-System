import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileSpreadsheet, Compass, Sun, Wrench,
  Package, Truck, ShieldCheck, Receipt, BarChart3, ChevronLeft,
  ChevronRight, SunMedium, LucideIcon,
} from 'lucide-react';
import { NAVIGATION_GROUPS, NavItem } from '../../constants/navigation';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import {
  customers, surveys, quotations, installationJobs,
  serviceTickets, inventoryItems, users,
} from '../../store/inMemoryDb';

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, Users, FileSpreadsheet, Compass, Sun, Wrench,
  Package, Truck, ShieldCheck, Receipt, BarChart3,
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
    if (!user) return false;
    if (!item.allowedRoles) return true;
    return item.allowedRoles.includes(user.role);
  };

  const getDynamicBadge = (itemId: string): number | null => {
    switch (itemId) {
      case 'customers':
        return customers.length || null;
      case 'quotations': {
        const n = quotations.filter((q) => q.status === 'DRAFT' || q.status === 'SENT').length;
        return n || null;
      }
      case 'surveys': {
        const n = surveys.filter((s) => s.status === 'PENDING' || s.status === 'SCHEDULED').length;
        return n || null;
      }
      case 'installations': {
        const n = installationJobs.filter((j) => j.stage !== 'COMMISSIONED').length;
        return n || null;
      }
      case 'service-tickets': {
        const n = serviceTickets.filter((t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length;
        return n || null;
      }
      case 'inventory': {
        const n = inventoryItems.filter((i) => i.currentStock <= i.lowStockThreshold).length;
        return n || null;
      }
      case 'user-management': {
        const n = users.filter((u) => u.status === 'PENDING_APPROVAL').length;
        return n || null;
      }
      default:
        return null;
    }
  };

  return (
    <aside
      className={cn(
        'h-full bg-white text-slate-600 flex flex-col border-r border-slate-200 transition-all duration-300 select-none shadow-xs',
        isCollapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Brand */}
      <div className={cn(
        'h-14 border-b border-slate-200 flex items-center shrink-0',
        isCollapsed ? 'justify-center px-0' : 'justify-between px-4'
      )}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shrink-0 shadow-sm text-white">
            <SunMedium className="w-4.5 h-4.5" strokeWidth={2.5} />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-slate-900 leading-tight truncate">SunPower</p>
              <p className="text-[10px] font-medium text-amber-600 uppercase tracking-wider leading-tight">Solar ERP</p>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3 space-y-5 px-3">
        {NAVIGATION_GROUPS.map((group) => {
          const visibleItems = group.items.filter(isRoleAllowed);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.id}>
              {!isCollapsed && (
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {group.title}
                </p>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = iconMap[item.iconName] || LayoutDashboard;
                  const isActive =
                    item.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.path);
                  const badge = getDynamicBadge(item.id);

                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      onClick={onCloseMobile}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        'group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 relative',
                        isActive
                          ? 'bg-amber-50 text-amber-950 font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80',
                        isCollapsed && 'justify-center px-0 w-10 h-10 mx-auto'
                      )}
                    >
                      {/* Active indicator bar */}
                      {isActive && !isCollapsed && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-amber-500" />
                      )}

                      <Icon
                        className={cn(
                          'shrink-0 transition-colors',
                          isCollapsed ? 'w-5 h-5' : 'w-4 h-4',
                          isActive ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'
                        )}
                      />
                      {!isCollapsed && (
                        <>
                          <span className="truncate flex-1">{item.label}</span>
                          {badge !== null && (
                            <span
                              className={cn(
                                'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border',
                                isActive
                                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              )}
                            >
                              {badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 shrink-0">
        {!isCollapsed ? (
          <div className="px-1 py-1.5">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-medium text-slate-500">Monthly Target</span>
              <span className="font-bold text-slate-800 font-mono">38 / 40 MW</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full w-[95%] bg-amber-500 rounded-full" />
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
        )}
      </div>
    </aside>
  );
};
