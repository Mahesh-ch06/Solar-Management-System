# SunPower Solutions Solar ERP – Backend API Specification

This document provides the complete technical specification for implementing the backend REST API for the **SunPower Solutions Solar Installation Management System**.

---

## 1. General Architecture & Standards

- **Base URL**: `http://localhost:5000/api` (Configured via `VITE_API_BASE_URL` in frontend `.env`)
- **Protocol**: HTTP/1.1 or HTTP/2 over TLS (Production)
- **Data Format**: `application/json` (UTF-8)
- **Authentication**: JWT (JSON Web Token) in HTTP Header:
  ```http
  Authorization: Bearer <jwt_access_token>
  ```
- **Standard Success Response Envelope**:
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Operation completed successfully",
    "timestamp": "2026-10-31T12:00:00.000Z"
  }
  ```
- **Standard Error Response Envelope**:
  ```json
  {
    "success": false,
    "message": "Human readable error description",
    "errorCode": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT",
    "errors": [
      { "field": "email", "message": "Email address already registered" }
    ],
    "timestamp": "2026-10-31T12:00:00.000Z"
  }
  ```

---

## 2. Authentication & Session Endpoints (`/api/auth`)

### `POST /api/auth/register`
Public employee registration.
- **Request Body**:
  ```json
  {
    "name": "Arun Verma",
    "email": "arun.verma@sunpowersolutions.in",
    "phone": "9810123456",
    "password": "SecurePassword123!",
    "department": "Commercial Solutions (Sales)"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "data": {
      "id": "usr-1730368800000",
      "name": "Arun Verma",
      "email": "arun.verma@sunpowersolutions.in",
      "role": "SALES",
      "status": "PENDING_APPROVAL"
    },
    "message": "Account created. Awaiting administrator activation."
  }
  ```

### `POST /api/auth/login`
Staff authentication.
- **Request Body**:
  ```json
  {
    "email": "arun.verma@sunpowersolutions.in",
    "password": "SecurePassword123!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "usr-01",
        "name": "Arun Verma",
        "email": "arun.verma@sunpowersolutions.in",
        "role": "SALES",
        "status": "ACTIVE",
        "department": "Commercial Solutions (Sales)"
      }
    }
  }
  ```

### `POST /api/auth/admin-login`
Dedicated Administrator Portal authentication.
- Rejects non-`ADMIN` accounts with `403 Forbidden`.

### `GET /api/auth/me`
Fetches current session user profile. Requires Bearer Token.

---

## 3. User Administration & RBAC (`/api/users`)
*Requires role: `ADMIN`*

- `GET /api/users` – List all user accounts with optional query filters (`?role=...&status=...&search=...`).
- `GET /api/users/:id` – Retrieve user profile by ID.
- `PUT /api/users/:id/role` – Update user role (creates immutable audit record).
  - **Body**: `{ "newRole": "TECHNICIAN", "reason": "Completed certified rooftop safety training" }`
- `PUT /api/users/:id/status` – Activate, Suspend, or Reactivate account.
  - **Body**: `{ "status": "ACTIVE" | "SUSPENDED" }`
- `GET /api/users/audit-logs` – Retrieve full role change history.

---

## 4. Customer Pipeline (`/api/customers`)
*Accessible by: `ADMIN`, `SALES`, `DIRECTOR`*

- `GET /api/customers` – List customers with pagination, search, and status filters.
- `GET /api/customers/:id` – Customer details.
- `POST /api/customers` – Create new inquiry lead.
  - **Body**:
    ```json
    {
      "name": "Deepak Mehta",
      "phone": "9820011223",
      "email": "deepak@example.com",
      "address": "Plot 42, Sector 15",
      "city": "Gurugram",
      "pincode": "122001",
      "monthlyBill": 6500,
      "requiredCapacityKW": 5,
      "systemType": "ON_GRID",
      "subsidyRequired": true,
      "enquirySource": "WEB_FORM",
      "notes": "Interested in 5kW rooftop setup"
    }
    ```
- `PUT /api/customers/:id` – Update customer details.
- `PATCH /api/customers/:id/status` – Update pipeline status (`NEW`, `CONTACTED`, `SURVEY_SCHEDULED`, `QUOTATION_SENT`, `CONVERTED`, `CLOSED_LOST`).

---

## 5. Technical Site Surveys (`/api/surveys`)
*Accessible by: `ADMIN`, `TECHNICIAN`, `SALES`, `DIRECTOR`*

- `GET /api/surveys` – List all surveys.
- `GET /api/surveys/customer/:customerId` – Surveys for a customer.
- `POST /api/surveys` – Schedule new site survey.
  - **Body**: `{ "customerId": "...", "scheduledDate": "2026-11-05", "assignedTechnicianId": "...", "assignedTechnicianName": "..." }`
- `PUT /api/surveys/:id` – Submit roof measurements, shadow analysis, tilt angle, AC/DC cable distances, and grid suitability.
- `PATCH /api/surveys/:id/status` – Approve or Reject survey.

---

## 6. Quotations & Auto-BOM Engine (`/api/quotations`)
*Accessible by: `ADMIN`, `SALES`, `DIRECTOR`*

- `GET /api/quotations` – List quotations.
- `POST /api/quotations` – Generate quotation with auto-calculated Bill of Materials (BOM).
- `PATCH /api/quotations/:id/status` – Update quotation status (`DRAFT`, `SENT`, `APPROVED`, `REJECTED`).
- `POST /api/quotations/:id/convert-to-order` – Convert approved quotation to confirmed project order (`orders` table).

---

## 7. Warehouse Inventory & Serial Management (`/api/inventory`, `/api/dispatch`)
*Accessible by: `ADMIN`, `WAREHOUSE_MANAGER`, `DIRECTOR`*

- `GET /api/inventory` – List equipment stock with current quantities, minimum thresholds, and unit costs.
- `POST /api/inventory` – Add new SKU.
- `POST /api/inventory/movements` – Record stock inward, dispatch, or adjustment movements.
- `GET /api/dispatch` – List dispatch orders.
- `POST /api/dispatch` – Create dispatch kit for confirmed customer order.
- `POST /api/dispatch/validate-serial` – Validate that serial number is unique across active units:
  - **Body**: `{ "serialNumber": "INV-GROWATT-24099" }`
  - **Response**: `{ "valid": true, "alreadyDispatched": false }`
- `PUT /api/dispatch/:id/scan` – Save verified barcodes/serial numbers.
- `PATCH /api/dispatch/:id/complete` – Mark order as dispatched with vehicle number and driver; auto-registers warranties.

---

## 8. Installations & Commissioning (`/api/installations`)
*Accessible by: `ADMIN`, `TECHNICIAN`, `DIRECTOR`*

- `GET /api/installations` – List active rooftop installation jobs.
- `PATCH /api/installations/:id/stage` – Update stage (`SCHEDULED`, `STRUCTURE_MOUNTED`, `PANELS_INSTALLED`, `WIRING_DONE`, `TESTED_COMMISSIONED`).
- `POST /api/installations/:id/commissioning` – Submit digital commissioning checklist, customer signature, rating, and generate completion certificate.

---

## 9. Warranties & Customer Service (`/api/warranties`, `/api/service-tickets`)
*Accessible by: `ADMIN`, `SUPPORT_AGENT`, `TECHNICIAN`, `DIRECTOR`*

- `GET /api/warranties` – List registered warranties.
- `GET /api/warranties/lookup/:serial` – Instant lookup by serial number.
- `GET /api/service-tickets` – List customer complaints and service tickets.
- `POST /api/service-tickets` – Log ticket with automatic warranty validity check.
- `PUT /api/service-tickets/:id/resolve` – Resolve ticket with replaced parts and labour cost.

---

## 10. Executive Financials & Analytics (`/api/finance`, `/api/reports`, `/api/dashboard`)
*Accessible by: `ADMIN`, `DIRECTOR`*

- `GET /api/finance/overview` – Returns monthly revenue, parts costs, labor costs, net profit, and outstanding payments.
- `GET /api/dashboard/overview` – Aggregated live counts (enquiries, pending quotes, active installs, low stock alerts).
- `GET /api/reports/summary` – Job-wise P&L ledger and government PM Surya Ghar subsidy tracking.
