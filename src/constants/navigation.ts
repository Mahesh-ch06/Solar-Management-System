import { UserRole } from '../types/roles';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  iconName: string;
  allowedRoles?: UserRole[];
  badge?: string;
  badgeVariant?: 'emerald' | 'amber' | 'rose' | 'sky';
}

export interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export const NAVIGATION_GROUPS: NavGroup[] = [
  {
    id: 'overview',
    title: 'Overview',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        iconName: 'LayoutDashboard',
      },
    ],
  },
  {
    id: 'sales-commercial',
    title: 'Sales & Customer Pipeline',
    items: [
      {
        id: 'customers',
        label: 'Customers & Leads',
        path: '/customers',
        iconName: 'Users',
        allowedRoles: ['ADMIN', 'SALES', 'DIRECTOR'],
        badge: '42 Active',
        badgeVariant: 'sky',
      },
      {
        id: 'quotations',
        label: 'Quotations & Orders',
        path: '/quotations',
        iconName: 'FileSpreadsheet',
        allowedRoles: ['ADMIN', 'SALES', 'DIRECTOR'],
        badge: '9 Pending',
        badgeVariant: 'amber',
      },
    ],
  },
  {
    id: 'field-operations',
    title: 'Field & Engineering',
    items: [
      {
        id: 'surveys',
        label: 'Site Surveys',
        path: '/surveys',
        iconName: 'Compass',
        allowedRoles: ['ADMIN', 'SALES', 'TECHNICIAN', 'DIRECTOR'],
        badge: '14 Pending',
        badgeVariant: 'amber',
      },
      {
        id: 'installations',
        label: 'Rooftop Installations',
        path: '/installations',
        iconName: 'Sun',
        allowedRoles: ['ADMIN', 'TECHNICIAN', 'DIRECTOR', 'WAREHOUSE_MANAGER'],
        badge: '8 Active',
        badgeVariant: 'emerald',
      },
      {
        id: 'service-tickets',
        label: 'Service & Maintenance',
        path: '/service-tickets',
        iconName: 'Wrench',
        allowedRoles: ['ADMIN', 'SUPPORT_AGENT', 'TECHNICIAN', 'DIRECTOR'],
        badge: '5 Open',
        badgeVariant: 'rose',
      },
    ],
  },
  {
    id: 'supply-chain',
    title: 'Supply Chain & Inventory',
    items: [
      {
        id: 'inventory',
        label: 'Warehouse Inventory',
        path: '/inventory',
        iconName: 'Package',
        allowedRoles: ['ADMIN', 'WAREHOUSE_MANAGER', 'DIRECTOR'],
      },
      {
        id: 'dispatch',
        label: 'Dispatch & Serial Tracking',
        path: '/dispatch',
        iconName: 'Truck',
        allowedRoles: ['ADMIN', 'WAREHOUSE_MANAGER', 'TECHNICIAN', 'DIRECTOR'],
      },
      {
        id: 'warranty',
        label: 'Warranty Registry',
        path: '/warranties',
        iconName: 'ShieldCheck',
        allowedRoles: ['ADMIN', 'SUPPORT_AGENT', 'SALES', 'DIRECTOR'],
      },
    ],
  },
  {
    id: 'executive',
    title: 'Finance & Analytics',
    items: [
      {
        id: 'finance',
        label: 'Finance & Cashflow',
        path: '/finance',
        iconName: 'Receipt',
        allowedRoles: ['ADMIN', 'DIRECTOR'],
      },
      {
        id: 'reports',
        label: 'Reports & Compliance',
        path: '/reports',
        iconName: 'BarChart3',
        allowedRoles: ['ADMIN', 'DIRECTOR', 'SALES'],
      },
    ],
  },
  {
    id: 'administration',
    title: 'System Administration',
    items: [
      {
        id: 'user-management',
        label: 'User Management & RBAC',
        path: '/admin/users',
        iconName: 'ShieldCheck',
        allowedRoles: ['ADMIN'],
      },
    ],
  },
];
