import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ProtectedRoute } from './ProtectedRoute';
import { HomePage } from '../features/public/HomePage';
import { CustomerPortalPage } from '../features/public/CustomerPortalPage';
import { CustomerAuthPage } from '../features/public/CustomerAuthPage';
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
import { RouteErrorBoundary } from '../components/common/RouteErrorBoundary';

export const router = createBrowserRouter([
  // Public Customer Facing Website & Portal
  {
    path: '/',
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/portal',
    element: <CustomerPortalPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/portal/login',
    element: <CustomerAuthPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/customer/login',
    element: <CustomerAuthPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/customer/register',
    element: <CustomerAuthPage />,
    errorElement: <RouteErrorBoundary />,
  },

  // Staff & Enterprise Authentication Portals
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
    errorElement: <RouteErrorBoundary />,
  },

  // Authenticated Enterprise ERP Shell
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/erp',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: '/customers',
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
