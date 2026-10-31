/**
 * Backend API Endpoint Definitions
 * Centralized registry of all REST API endpoints for SunPower Solutions Solar ERP
 */

export const API_ENDPOINTS = {
  // Authentication & Session
  AUTH: {
    LOGIN: '/auth/login',
    ADMIN_LOGIN: '/auth/admin-login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh',
  },

  // User Management & RBAC
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    UPDATE_ROLE: (id: string) => `/users/${id}/role`,
    UPDATE_STATUS: (id: string) => `/users/${id}/status`,
    AUDIT_LOGS: '/users/audit-logs',
  },

  // Customer Pipeline
  CUSTOMERS: {
    BASE: '/customers',
    BY_ID: (id: string) => `/customers/${id}`,
    UPDATE_STATUS: (id: string) => `/customers/${id}/status`,
  },

  // Technical Site Surveys
  SURVEYS: {
    BASE: '/surveys',
    BY_ID: (id: string) => `/surveys/${id}`,
    BY_CUSTOMER: (customerId: string) => `/surveys/customer/${customerId}`,
    UPDATE_STATUS: (id: string) => `/surveys/${id}/status`,
  },

  // Quotations & Auto-BOM
  QUOTATIONS: {
    BASE: '/quotations',
    BY_ID: (id: string) => `/quotations/${id}`,
    UPDATE_STATUS: (id: string) => `/quotations/${id}/status`,
    CONVERT_TO_ORDER: (id: string) => `/quotations/${id}/convert-to-order`,
  },

  // Confirmed Orders
  ORDERS: {
    BASE: '/orders',
    BY_ID: (id: string) => `/orders/${id}`,
  },

  // Inventory & Stock
  INVENTORY: {
    BASE: '/inventory',
    BY_ID: (id: string) => `/inventory/${id}`,
    MOVEMENTS: '/inventory/movements',
    ADJUST: (id: string) => `/inventory/${id}/adjust`,
  },

  // Equipment Dispatch
  DISPATCH: {
    BASE: '/dispatch',
    BY_ID: (id: string) => `/dispatch/${id}`,
    VALIDATE_SERIAL: '/dispatch/validate-serial',
    SCAN_ITEM: (id: string) => `/dispatch/${id}/scan`,
    COMPLETE: (id: string) => `/dispatch/${id}/complete`,
  },

  // Installations & Commissioning
  INSTALLATIONS: {
    BASE: '/installations',
    BY_ID: (id: string) => `/installations/${id}`,
    UPDATE_STAGE: (id: string) => `/installations/${id}/stage`,
    SUBMIT_CHECKLIST: (id: string) => `/installations/${id}/commissioning`,
  },

  // Warranties
  WARRANTIES: {
    BASE: '/warranties',
    LOOKUP_SERIAL: (serial: string) => `/warranties/lookup/${encodeURIComponent(serial)}`,
    EXPIRING: '/warranties/expiring',
  },

  // Service Complaint Tickets
  SERVICE_TICKETS: {
    BASE: '/service-tickets',
    BY_ID: (id: string) => `/service-tickets/${id}`,
    UPDATE_STATUS: (id: string) => `/service-tickets/${id}/status`,
    ASSIGN: (id: string) => `/service-tickets/${id}/assign`,
  },

  // Finance & Executive Metrics
  FINANCE: {
    OVERVIEW: '/finance/overview',
    PROJECT_PROFITABILITY: '/finance/profitability',
  },

  // Operational Analytics & Reports
  REPORTS: {
    SUBSIDIES: '/reports/subsidies',
    SUMMARY: '/reports/summary',
  },

  // Dashboard Aggregates
  DASHBOARD: {
    OVERVIEW: '/dashboard/overview',
    ACTIVITIES: '/dashboard/activities',
    PENDING_TASKS: '/dashboard/tasks',
  },
} as const;
