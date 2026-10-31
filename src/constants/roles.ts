import { UserRole } from '../types/roles';

export interface RoleConfig {
  key: UserRole;
  label: string;
  description: string;
  badgeColor: string;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  ADMIN: {
    key: 'ADMIN',
    label: 'System Admin',
    description: 'Full access to all modules, settings, and staff operations',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  DIRECTOR: {
    key: 'DIRECTOR',
    label: 'Managing Director',
    description: 'Executive view with financial analytics, margins, and growth reports',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  SALES: {
    key: 'SALES',
    label: 'Sales Executive',
    description: 'Leads, customer surveys, quotations, and commercial pipeline',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  WAREHOUSE_MANAGER: {
    key: 'WAREHOUSE_MANAGER',
    label: 'Warehouse Manager',
    description: 'Inventory, dispatches, stock alerts, and serial tracking',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  TECHNICIAN: {
    key: 'TECHNICIAN',
    label: 'Field Technician',
    description: 'Site surveys, rooftop installations, checklists, and signoffs',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  SUPPORT_AGENT: {
    key: 'SUPPORT_AGENT',
    label: 'Support Agent',
    description: 'Customer service tickets, warranty verification, and repair calls',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
  },
};
