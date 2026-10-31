# ☀️ SunPower Solar ERP - Backend API Engine

Enterprise RESTful API backend for Rooftop Solar Installation & Operations ERP. Built with **Node.js, Express, and native SQLite (`node:sqlite`)**.

---

## 🌟 Why This Architecture? (Evaluation Round Defense)

1. **100% Offline & Zero External Daemons**:
   - Uses Node.js native `DatabaseSync` from `node:sqlite`.
   - No external database server (PostgreSQL/MySQL/MongoDB) needs to be installed, running, or configured on the evaluator's laptop.
   - Zero native C++ compilation (`node-gyp`) errors across Windows, Mac, and Linux.
2. **Feature-First / Modular Architecture**:
   - 4-member team division with dedicated directories per member.
   - **Zero merge conflicts** when committing to Git.
3. **Relational Data Integrity**:
   - SQLite foreign keys enabled (`PRAGMA foreign_keys = ON;`).
   - Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) for fast concurrent reads and writes.

---

## 👥 4-Member Team Ownership & File Mapping

```
server/
├── src/
│   ├── config/
│   │   └── config.js              # [Shared] Environment variables & settings
│   ├── db/
│   │   ├── database.js            # [Shared] SQLite connection & schema initialization
│   │   ├── schema.sql             # [Shared] Relational DDL tables & indexes
│   │   └── seed.js                # [Shared] Seed realistic Indian solar demo data
│   ├── middleware/
│   │   ├── authMiddleware.js      # [Member 1] JWT verification & RBAC role guards
│   │   └── errorHandler.js        # [Shared] Central HTTP error formatter
│   │
│   ├── modules/
│   │   ├── auth/                  # 👤 Member 1: Authentication (Login, Register, Profile)
│   │   ├── admin/                 # 👤 Member 1: Administrative Portal & Security Audit
│   │   ├── customers/             # 👤 Member 2: CRM Leads & Sales Pipeline Stages
│   │   ├── surveys/               # 👤 Member 2: Rooftop Technical Feasibility Audits
│   │   ├── quotations/            # 👤 Member 2: Automated Solar BOM & Orders
│   │   ├── inventory/             # 👤 Member 3: Warehouse Stock & Movement Logs
│   │   ├── dispatch/              # 👤 Member 3: Serial Number Anti-Duplicate Scanning
│   │   ├── warranties/            # 👤 Member 3: Serial-Based Warranty Registry
│   │   ├── installations/         # 👤 Member 4: 5-Stage Field Jobs & Quality Checklist
│   │   ├── service/               # 👤 Member 4: Post-Sales Complaint Tickets
│   │   └── dashboard/             # 👤 Member 4: Executive KPIs & P&L Analytics
│   │
│   ├── app.js                     # Express middleware setup & router mounting
│   └── server.js                  # HTTP server listener (port 5001)
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
*(Default port is `5001` so it doesn't collide with macOS AirPlay on port 5000).*

### 3. Seed Database
```bash
npm run seed
```
Creates `./data/solar.db` pre-populated with realistic Indian solar leads, rooftop surveys, quotations, inventory items, and demo user accounts.

### 4. Start Development Server
```bash
npm run dev
# Server running at: http://localhost:5001
# Health check: http://localhost:5001/api/v1/health
```

---

## 📋 Comprehensive API Route Reference

### 👤 Member 1: Auth & User Administration
| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| `POST` | `/api/v1/auth/login` | Email/password login; returns JWT & user profile | ❌ Public |
| `POST` | `/api/v1/auth/register` | Staff self-registration (Default: `PENDING_APPROVAL`) | ❌ Public |
| `GET` | `/api/v1/auth/me` | Fetch authenticated employee's session details | ✅ Token |
| `GET` | `/api/v1/admin/users` | List all staff members with status and roles | ✅ Admin / Director |
| `PATCH` | `/api/v1/admin/users/:id/status` | Approve or suspend account | ✅ Admin / Director |
| `PATCH` | `/api/v1/admin/users/:id/role` | Change employee role + immutable audit log | ✅ Admin / Director |
| `GET` | `/api/v1/admin/audit-logs` | Fetch security and role escalation history | ✅ Admin / Director |

### 👤 Member 2: CRM, Site Surveys & Dynamic Quotations
| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| `GET` | `/api/v1/customers` | List all customer leads and converted clients | ✅ Token |
| `GET` | `/api/v1/customers/:id` | Single customer details | ✅ Token |
| `POST` | `/api/v1/customers` | Create new prospective lead | ✅ Token |
| `PUT` | `/api/v1/customers/:id` | Update customer pipeline stage or notes | ✅ Token |
| `GET` | `/api/v1/surveys` | List all rooftop technical audits | ✅ Token |
| `POST` | `/api/v1/surveys` | Record survey (auto-sets customer to `SURVEY_SCHEDULED`) | ✅ Token |
| `PATCH`| `/api/v1/surveys/:id/feasibility` | Feasibility Sign-Off (Approve / Reject) | ✅ Token |
| `GET` | `/api/v1/quotations` | List all generated solar quotations | ✅ Token |
| `POST` | `/api/v1/quotations` | Generate quotation with BOM lines and GST | ✅ Token |
| `POST` | `/api/v1/quotations/:id/confirm-order` | Customer accepts quote $\rightarrow$ creates confirmed Order | ✅ Token |
| `GET` | `/api/v1/quotations/orders/list` | List all confirmed orders | ✅ Token |

### 👤 Member 3: Warehouse Inventory, Dispatch & Warranties
| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| `GET` | `/api/v1/inventory` | List stock catalog with low-stock alerts | ✅ Token |
| `POST` | `/api/v1/inventory` | Add new warehouse SKU | ✅ Token |
| `POST` | `/api/v1/inventory/stock-movement` | Record Inward / Outward adjustment | ✅ Token |
| `GET` | `/api/v1/inventory/movements/list` | Stock movement audit history | ✅ Token |
| `GET` | `/api/v1/dispatch` | List all equipment dispatch orders | ✅ Token |
| `POST` | `/api/v1/dispatch` | Create dispatch picking list for confirmed order | ✅ Token |
| `POST` | `/api/v1/dispatch/:id/scan-serial`| **Anti-Duplicate Serial Scanning & Auto-Warranty** | ✅ Token |
| `PATCH`| `/api/v1/dispatch/:id/status` | Update vehicle dispatch status | ✅ Token |
| `GET` | `/api/v1/warranties` | List all component warranties | ✅ Token |
| `GET` | `/api/v1/warranties/verify/:serialNumber`| Instant serial lookup & validity check | ✅ Token |

### 👤 Member 4: Field Installations, Service & Analytics
| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| `GET` | `/api/v1/installations` | List field jobs across the 5 milestone stages | ✅ Token |
| `POST` | `/api/v1/installations` | Create installation job assignment | ✅ Token |
| `PATCH`| `/api/v1/installations/:id/stage`| Advance stage (`SCHEDULED` $\rightarrow$ `COMMISSIONED`) | ✅ Token |
| `PUT` | `/api/v1/installations/:id/checklist`| Update digital safety & quality checklist | ✅ Token |
| `GET` | `/api/v1/service-tickets` | List post-sales service tickets | ✅ Token |
| `POST` | `/api/v1/service-tickets` | Submit customer complaint ticket | ✅ Token |
| `PATCH`| `/api/v1/service-tickets/:id/status`| Update resolution progress and notes | ✅ Token |
| `GET` | `/api/v1/dashboard/metrics` | Executive KPI overview | ✅ Token |
| `GET` | `/api/v1/dashboard/finance-summary`| Revenue, advance collected & margin summary | ✅ Token |

---

## 🎯 Viva & Evaluation Defense Cheat Sheet

### 1. "Why did your team choose SQLite instead of MongoDB or PostgreSQL?"
> *"Our application is a Solar Installation Enterprise ERP where data is strictly relational (customers have surveys, surveys lead to quotations, accepted quotations become orders, orders trigger dispatch and serialized warranties). SQLite provides a zero-configuration, fully ACID-compliant relational database stored in a single file (`solar.db`). With Node.js's built-in `node:sqlite`, the backend has zero external server dependencies, meaning the entire system runs locally and offline without requiring Docker or a cloud database."*

### 2. "How did you prevent SQL Injection?"
> *"We use parameterized queries everywhere via prepared statements (`db.prepare('... WHERE email = ?').get(email)`). The SQLite engine compiles the SQL command structure in advance and treats user inputs purely as literal values, completely neutralizing SQL injection attacks."*

### 3. "How does the Anti-Duplicate Barcode Scanning work?"
> *"In solar operations, inverters and panels carry unique manufacturer serial numbers. In `dispatch.controller.js`, before adding a scanned serial to a dispatch order, we run a query against the `warranty_records` table. If the serial number already exists, the API rejects it with an HTTP 409 Conflict error. Once validated, the system automatically registers a new warranty record with the customer's name, install date, and 5-25 year warranty expiry."*

### 4. "How did 4 people build this backend without Git merge conflicts?"
> *"We adopted a **Feature-First / Modular Directory Architecture**. Each team member was assigned a distinct module directory (`modules/auth`, `modules/customers`, `modules/inventory`, `modules/installations`). Each member worked exclusively on their own branch. Because members wrote code in separate files rather than editing one giant file, Git merges into `main` occurred cleanly without conflicting lines."*

