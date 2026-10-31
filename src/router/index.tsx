import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { LoginPage } from '../features/auth/LoginPage';
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

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'customers',
        element: <CustomersPage />,
      },
      {
        path: 'quotations',
        element: <QuotationsPage />,
      },
      {
        path: 'surveys',
        element: <SurveysPage />,
      },
      {
        path: 'installations',
        element: <InstallationsPage />,
      },
      {
        path: 'service-tickets',
        element: <ServiceTicketsPage />,
      },
      {
        path: 'inventory',
        element: <InventoryPage />,
      },
      {
        path: 'dispatch',
        element: <DispatchPage />,
      },
      {
        path: 'warranties',
        element: <WarrantyPage />,
      },
      {
        path: 'finance',
        element: <FinancePage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
