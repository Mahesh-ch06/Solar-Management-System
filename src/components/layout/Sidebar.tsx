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
  customers,
  surveys,
  quotations,
  installationJobs,
  serviceTickets,
  inventoryItems,
  users,
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

  // Compute live dynamic badges based on inMemory store
  const getDynamicBadge = (itemId: string): { text: string; variant: 'emerald' | 'amber' | 'rose' | 'sky' } | null => {
    switch (itemId) {
      case 'customers':
        return { text: `${customers.length} Leads`, variant: 'sky' };
      case 'quotations': {
        const pending = quotations.filter((q) => q.status === 'DRAFT' || q.status === 'SENT').length;
        return pending > 0 ? { text: `${pending} Pending`, variant: 'amber' } : null;
      }
      case 'surveys': {
        const pending = surveys.filter((s) => s.status === 'PENDING' || s.status === 'SCHEDULED').length;
        return pending > 0 ? { text: `${pending} Pending`, variant: 'amber' } : null;
      }
      case 'installations': {
        const active = installationJobs.filter((j) => j.stage !== 'COMMISSIONED').length;
        return active > 0 ? { text: `${active} Active`, variant: 'emerald' } : null;
      }
      case 'service-tickets': {
        const open = serviceTickets.filter((t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length;
        return open > 0 ? { text: `${open} Open`, variant: 'rose' } : null;
      }
      case 'inventory': {
        const low = inventoryItems.filter((i) => i.currentStock <= i.lowStockThreshold).length;
        return low > 0 ? { text: `${low} Low`, variant: 'rose' } : null;
      }
      case 'user-management': {
        const pending = users.filter((u) => u.status === 'PENDING_APPROVAL').length;
        return pending > 0 ? { text: `${pending} Review`, variant: 'amber' } : null;
      }
      default:
        return null;
    }
  };

  return (
    <aside
      className={cn(
        'h-full bg-navy-950 text-slate-300 flex flex-col border-r border-white/5 transition-all duration-300 select-none',
        isCollapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Brand */}
      <div className="h-16 px-3 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-solar-600 to-solar-800 text-amber-300 flex items-center justify-center shrink-0 shadow-lg">
            <SunMedium className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-tight truncate">SunPower Solutions</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-solar-400 leading-tight">
                Solar ERP
              </p>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4 px-2">
        {NAVIGATION_GROUPS.map((group) => {
          const visibleItems = group.items.filter(isRoleAllowed);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.id}>
              {!isCollapsed && (
                <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                  {group.title}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = iconMap[item.iconName] || LayoutDashboard;
                  const isActive =
                    item.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.path);

                  const dynamicBadge = getDynamicBadge(item.id);

                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      onClick={onCloseMobile}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        'group flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 relative',
                        isActive
                          ? 'bg-solar-700/90 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-white/8',
                        isCollapsed && 'justify-center px-0 w-10 h-10 mx-auto'
                      )}
                    >
                      <Icon
                        className={cn(
                          'shrink-0 transition-colors',
                          isCollapsed ? 'w-5 h-5' : 'w-4 h-4',
                          isActive ? 'text-amber-300' : 'text-slate-500 group-hover:text-slate-200'
                        )}
                      />
                      {!isCollapsed && (
                        <>
                          <span className="truncate flex-1">{item.label}</span>
                          {dynamicBadge && (
                            <span
                              className={cn(
                                'text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0',
                                dynamicBadge.variant === 'emerald' && 'bg-emerald-500/20 text-emerald-300',
                                dynamicBadge.variant === 'amber' && 'bg-amber-500/20 text-amber-300',
                                dynamicBadge.variant === 'rose' && 'bg-rose-500/20 text-rose-300',
                                dynamicBadge.variant === 'sky' && 'bg-sky-500/20 text-sky-300',
                              )}
                            >
                              {dynamicBadge.text}
                            </span>
                          )}
                        </>
                      )}

                      {/* Active left bar */}
                      {isActive && !isCollapsed && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-amber-400" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: monthly progress */}
      <div className="p-3 border-t border-white/5 shrink-0">
        {!isCollapsed ? (
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-slate-400">Monthly Target</span>
              <span className="font-semibold text-solar-300">38 / 40</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-solar-500 to-amber-400 rounded-full" style={{ width: '95%' }} />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">95% of Oct target achieved</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-solar-400 ring-4 ring-solar-500/20" />
          </div>
        )}
      </div>
    </aside>
  );
};
