import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../features/auth/LoginPage';
import { AdminLoginPage } from '../features/auth/AdminLoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { CustomersPage } from '../features/customers/CustomersPage';
import { SurveysPage } from '../features/surveys/SurveysPage';
import { QuotationsPage } from '../features/quotations/QuotationsPage';
import { InventoryPage } from '../features/inventory/InventoryPage';
import { InstallationsPage } from '../features/installations/InstallationsPage';
import { DispatchPage } from '../features/dispatch/DispatchPage';
import { WarrantyPage } from '../features/warranty/WarrantyPage';
import { ServiceTicketsPage } from '../features/service/ServiceTicketsPage';
import { FinancePage } from '../features/finance/FinancePage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { UserManagementPage } from '../features/admin/UserManagementPage';

export const router = createBrowserRouter([
  // Public Authentication Portals
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },

  // Authenticated Enterprise Application Shell
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'customers',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'DIRECTOR']}>
            <CustomersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'quotations',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'DIRECTOR']}>
            <QuotationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'surveys',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'TECHNICIAN', 'DIRECTOR']}>
            <SurveysPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'installations',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'TECHNICIAN', 'DIRECTOR', 'WAREHOUSE_MANAGER']}>
            <InstallationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'service-tickets',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'SUPPORT_AGENT', 'TECHNICIAN', 'DIRECTOR']}>
            <ServiceTicketsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE_MANAGER', 'DIRECTOR']}>
            <InventoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dispatch',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE_MANAGER', 'TECHNICIAN', 'DIRECTOR']}>
            <DispatchPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'warranties',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'SUPPORT_AGENT', 'SALES', 'DIRECTOR']}>
            <WarrantyPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'finance',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'DIRECTOR']}>
            <FinancePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'DIRECTOR', 'SALES']}>
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/users',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <UserManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
