# Solar-Management-System

> **Note**: frontend added

Enterprise-grade Solar Installation Management System (ERP) designed for rooftop solar installation operations, managing residential and commercial solar projects, customer pipelines, site surveys, automated Bill of Materials (BOM) quotations, warehouse inventory with serial number tracking, field installations, commissioning checklists, warranty records, customer service tickets, and P&L financial reports.

---

## ☀️ Key Modules & Capabilities

1. **Role-Based Access Control (RBAC) & Security**
   - Authentic permission enforcement with strict route guarding (`ProtectedRoute`).
   - Dedicated Administrative Portal (`/admin/login`).
   - Staff self-registration (`/register`) with `PENDING_APPROVAL` status (no privilege escalation).
   - Admin User Management (`/admin/users`) with role assignment, status toggling, and immutable audit logs.
   - Transactional email dispatch powered by EmailJS (`@emailjs/browser`).

2. **Customer Enquiries & Sales Pipeline (`/customers`)**
   - Stage tracking: `NEW`, `CONTACTED`, `SURVEY_SCHEDULED`, `QUOTATION_SENT`, `CONVERTED`, `CLOSED_LOST`.
   - Lead qualification (monthly electricity bill, required kW capacity, subsidy eligibility).

3. **Technical Site Surveys (`/surveys`)**
   - Digital site audits: roof measurements, shadow-free area, azimuth direction, tilt, and AC/DC cable runs.
   - Feasibility sign-off workflow (Approve / Reject) with technical notes.

4. **Dynamic Quotations & Auto-BOM Engine (`/quotations`)**
   - Automated Bill of Materials computation based on system capacity (1 kW – 5 kW+).
   - Component auto-sizing: panels (540W Mono PERC), hybrid inverters, mounting structures, and cable gauges.
   - GST, subsidies (PM Surya Ghar), and gross margin calculations.

5. **Inventory & Serial Number Dispatch (`/inventory`, `/dispatch`)**
   - Multi-category warehouse stock (Panels, Inverters, Batteries, Mounting, Cabling, BOS).
   - Barcode/Serial number scanning and strict anti-duplicate validation before dispatch.

6. **Field Installations & Commissioning (`/installations`)**
   - Multi-stage job tracking: `SCHEDULED`, `STRUCTURE_MOUNTED`, `PANELS_INSTALLED`, `WIRING_DONE`, `TESTED_COMMISSIONED`.
   - Digital handover and commissioning verification checklists.

7. **Warranty Registry & Customer Service (`/warranties`, `/service-tickets`)**
   - Instant serial number warranty lookup (`INV-...`, `BAT-...`, `PNL-...`).
   - Service complaint ticket lifecycle: `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`.

8. **P&L Financials & Executive Reporting (`/finance`, `/reports`)**
   - Project-level profitability, equipment cost breakdowns, labor margins, and revenue analytics.

9. **Client-Side Persistence Engine**
   - Automatic hydration and synchronization with `localStorage` (`sunpower_db_state_v2`).
   - Real-time updates across all modules without backend dependency.

---

## 🔐 Default Demo Accounts

| Role | Email | Password | Access Scope |
|:---|:---|:---|:---|
| **System Administrator** | `admin@sunpowersolutions.in` | `Password@123` | Full Access + `/admin/users` |
| **Managing Director** | `director@sunpowersolutions.in` | `Password@123` | Executive Dashboard, Finance, P&L, Operations |
| **Sales Executive** | `sales@sunpowersolutions.in` | `Password@123` | Leads, Surveys, Quotes, Proposals |
| **Field Technician** | `tech@sunpowersolutions.in` | `Password@123` | Surveys, Installations, Commissioning |
| **Warehouse Manager** | `warehouse@sunpowersolutions.in` | `Password@123` | Inventory, Stock, Dispatch, Serials |
| **Support Agent** | `support@sunpowersolutions.in` | `Password@123` | Tickets, Warranties, Customer Care |

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS + Lucide React Icons
- **State Management**: TanStack React Query + Persistent In-Memory DB
- **Routing**: React Router v7 with RBAC Route Guards & Error Boundary
- **Forms & Validation**: React Hook Form + Zod Schema Validation
- **Charts & Visualizations**: Recharts
- **Notifications**: EmailJS Browser SDK + Custom Toast Notification Context
- **Build Tool**: Vite

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ installed
- npm or yarn

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Mahesh-ch06/Solar-Management-System.git
cd Solar-Management-System

# Install dependencies
npm install --legacy-peer-deps
```

### 3. Environment Setup (Optional for EmailJS)
Copy `.env.example` to `.env` and fill in your EmailJS credentials:
```bash
cp .env.example .env
```
```env
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```
*(If unconfigured, the application gracefully logs email actions without interruption).*

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
```

---

## 📁 Project Structure

```
src/
├── components/          # Reusable UI primitives (Buttons, Cards, Modals, Drawers, Badges)
│   ├── common/          # Error boundaries & shared utilities
│   ├── layout/          # AppShell, TopNavbar, Sidebar, Breadcrumbs
│   └── ui/              # Tailwind atomic components
├── context/             # AuthContext, ToastContext
├── features/            # Feature domains
│   ├── admin/           # User management & role assignment
│   ├── auth/            # Login, Admin Login, Registration
│   ├── customers/       # Enquiries and pipeline
│   ├── dashboard/       # Real-time metrics & recent activities
│   ├── dispatch/        # Dispatch orders & serial validation
│   ├── finance/         # P&L and cost tracking
│   ├── installations/   # Job tracking & commissioning
│   ├── inventory/       # Stock tracking & movements
│   ├── quotations/      # Auto-BOM quotation engine
│   ├── reports/         # Operational analytics
│   ├── service/         # Service complaint ticketing
│   ├── surveys/         # Site survey audits
│   └── warranty/        # Serial lookup & warranties
├── router/              # Protected routes & role access configuration
├── services/            # EmailJS and transactional services
├── store/               # In-memory database with localStorage sync
├── types/               # TypeScript models & schemas
└── utils/               # Formatters, Zod validators, BOM calculator
```

---

## 📄 License
MIT License. Developed for SunPower Solutions Solar ERP.
