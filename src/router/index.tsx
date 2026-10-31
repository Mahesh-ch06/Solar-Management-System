import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ModulePlaceholderPage } from '../features/placeholder/ModulePlaceholderPage';

export const router = createBrowserRouter([
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
        element: (
          <ModulePlaceholderPage
            moduleName="Customer Management & Enquiries"
            description="Manage customer profiles, electricity bills, solar capacity requirements, subsidy eligibility, and follow-ups."
            features={[
              'Customer directory with search, filter, sorting, and pagination',
              'Electricity bill upload and consumption pattern analysis',
              'Required solar capacity calculator (1kW to 5kW+)',
              'PM Surya Ghar subsidy eligibility verification',
              'Lead source tracking and multi-stage follow-up records',
              'Direct transition from Enquiry to Site Survey scheduling',
            ]}
          />
        ),
      },
      {
        path: 'quotations',
        element: (
          <ModulePlaceholderPage
            moduleName="Quotations & Orders"
            description="Generate customized solar quotes, calculate automated bill of materials (BOM), and track contract conversions."
            features={[
              'Predefined quotation templates for On-Grid and Off-Grid configurations',
              'Automated component generation (panels, inverters, structures, cables)',
              'Dynamic pricing engine with GST, discounts, and net subsidy deductions',
              'Advance payment milestones and order conversion workflow',
              'Printable and downloadable PDF quotation previews',
              'Strict validation ensuring survey approval prior to quote finalization',
            ]}
          />
        ),
      },
      {
        path: 'surveys',
        element: (
          <ModulePlaceholderPage
            moduleName="Site Survey Management"
            description="Schedule technician roof inspections, capture shadow-free area dimensions, and assess grid connection feasibility."
            features={[
              'Technician dispatch and rooftop visit scheduling',
              'RCC, tin-shed, and tile roof dimension recording',
              'Roof azimuth direction and optimum tilt angle calculations',
              'Shadow-free roof area mapping and obstruction tagging',
              'AC/DC cable run distance and DISCOM grid connection verification',
              'Site survey photo capture and engineering signoff/rejection workflow',
            ]}
          />
        ),
      },
      {
        path: 'installations',
        element: (
          <ModulePlaceholderPage
            moduleName="Installation Management"
            description="Coordinate on-site solar panel mounting, inverter wiring, DISCOM net-metering tests, and customer handovers."
            features={[
              'Field technician assignment and milestone tracking',
              'Mobile-first installation checklist for on-site execution',
              'Solar structure anchoring and torque verification',
              'Inverter commissioning and earth-resistance test logs',
              'Customer digital signature capture upon successful commissioning',
              'Automated generation of Installation Completion Report (ICR)',
            ]}
          />
        ),
      },
      {
        path: 'service-tickets',
        element: (
          <ModulePlaceholderPage
            moduleName="Service & Complaint Management"
            description="Handle solar post-commissioning maintenance, inverter fault codes, customer grievances, and replacement visits."
            features={[
              'Service ticket creation with fault codes (E01-E12 inverter errors)',
              'Instant warranty eligibility lookup via component serial numbers',
              'Technician dispatch for on-site troubleshooting',
              'Warranty coverage verification vs billable repairs',
              'Labour charges and replacement parts accounting',
              'Customer confirmation OTP and verified ticket closure',
            ]}
          />
        ),
      },
      {
        path: 'inventory',
        element: (
          <ModulePlaceholderPage
            moduleName="Inventory & Warehouse"
            description="Stock overview of Mono PERC panels, solar inverters, lithium batteries, safety switchgear, and mounting hardware."
            features={[
              'Real-time stock ledger across all 9 solar equipment categories',
              'Low-stock threshold alerts for fast-moving items (rails, wires, MCBs)',
              'Purchase orders and supplier delivery receipts (GRN)',
              'Serial number inward registration and batch barcode labelling',
              'Warehouse stock movements and internal transfer audits',
              'Historical inventory consumption per installation kW',
            ]}
          />
        ),
      },
      {
        path: 'dispatch',
        element: (
          <ModulePlaceholderPage
            moduleName="Dispatch & Serial Number Tracking"
            description="Assign individual equipment serial numbers to confirmed customer installations and validate outbound dispatches."
            features={[
              'Dispatch order generation linked to customer installation projects',
              'Individual panel and inverter serial number scanning & verification',
              'Duplicate serial number collision prevention algorithm',
              'Mobile camera barcode/QR code scanner interface',
              'Warehouse staging area checklist and dispatch gate-pass generation',
              'Complete chain-of-custody audit trail from warehouse to rooftop',
            ]}
          />
        ),
      },
      {
        path: 'warranties',
        element: (
          <ModulePlaceholderPage
            moduleName="Warranty Management"
            description="Track component warranties by individual serial number, calculate expiry schedules, and verify claim eligibility."
            features={[
              'Serial number instant search and component provenance lookup',
              'Configurable warranty durations (e.g. 20y panels, 5y inverters, 2y batteries)',
              'Automated expiry calculation based on commissioning gate pass',
              'Status classification: Active, Expiring Soon (<60 days), Expired',
              'Replacement history and manufacturer RMA tracking',
              'Customer warranty certificate generation',
            ]}
          />
        ),
      },
      {
        path: 'finance',
        element: (
          <ModulePlaceholderPage
            moduleName="Finance & Payments"
            description="Track customer advances, milestone payments, inventory procurement costs, technician wages, and project margins."
            features={[
              'Milestone payments: Advance, Pre-dispatch, Post-commissioning',
              'DISCOM subsidy subsidy disbursement tracking',
              'Supplier payment schedules and warehouse purchase invoices',
              'Technician job-wise labour cost calculation',
              'Project-level profit and loss (P&L) statements',
              'Exportable tax invoices with GST breakdown',
            ]}
          />
        ),
      },
      {
        path: 'reports',
        element: (
          <ModulePlaceholderPage
            moduleName="Reports & Compliance"
            description="Generate executive summaries, technician productivity metrics, subsidy paperwork statuses, and revenue statements."
            features={[
              'Monthly revenue, expense, and EBITDA profitability reports',
              'Technician installation speed and quality benchmarks',
              'Subsidy paperwork cycle-time tracking (PM Surya Ghar)',
              'Unfinished/delayed installation root-cause analysis',
              'Inventory turnover ratios and equipment defect rates',
              'Export to CSV, Excel, and printable PDF formats',
            ]}
          />
        ),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
