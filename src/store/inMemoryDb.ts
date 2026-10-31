// src/store/inMemoryDb.ts
// Central in-memory state store with localStorage persistence
// Prepared for seamless API synchronization when backend server is running

import { Customer, EnquiryStatus } from '../types/customer';
import { Survey } from '../types/survey';
import { Quotation, Order } from '../types/quotation';
import { InventoryItem, StockMovement } from '../types/inventory';
import { DispatchOrder, WarrantyRecord, ServiceTicket } from '../types/operations';
import { InstallationJob } from '../types/installation';
import { UserAccount, RoleAuditEntry } from '../types/auth';
import { UserRole } from '../types/roles';

// ==========================================
// Collections (Clean Initial State - Zero Mock Data)
// ==========================================
export let customers: Customer[] = [
  {
    id: 'cust-nikhil',
    name: 'Nikhil (Admin)',
    phone: '9811199999',
    email: 'nikhil@gmail.com',
    address: '123 Solar HQ, Central Park',
    city: 'Delhi',
    pincode: '110001',
    monthlyBill: 4500,
    requiredCapacityKW: 5,
    systemType: 'ON_GRID',
    subsidyRequired: true,
    enquirySource: 'WEB_FORM',
    status: 'CONVERTED',
    notes: 'System Administrator Account',
    assignedTo: 'Rajesh Sharma',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
export let surveys: Survey[] = [];
export let quotations: Quotation[] = [];
export let orders: Order[] = [];
export let inventoryItems: InventoryItem[] = [];
export let stockMovements: StockMovement[] = [];
export let dispatchOrders: DispatchOrder[] = [];
export let warrantyRecords: WarrantyRecord[] = [];
export let serviceTickets: ServiceTicket[] = [];
export let installationJobs: InstallationJob[] = [];
export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-admin-mahesh',
    name: 'Mahesh Ch',
    email: 'maheshch1094@gmail.com',
    password: 'Mahesh',
    phone: '+91 98765 43210',
    role: 'ADMIN',
    department: 'Executive Administration',
    status: 'ACTIVE',
    createdAt: '2026-08-01T09:00:00Z',
    roleAssignedBy: 'System Initializer',
    roleAssignedAt: '2026-08-01T09:00:00Z',
  },
  {
    id: 'usr-admin-nikhil',
    name: 'Nikhil',
    email: 'nikhil@gmail.com',
    password: '123456',
    role: 'ADMIN',
    status: 'ACTIVE',
    phone: '+91 98111 99999',
    department: 'Executive Management',
    roleAssignedBy: 'System Initializer',
    roleAssignedAt: '2026-08-01T09:00:00Z',
    createdAt: '2026-08-01T09:00:00Z',
  },
  {
    id: 'usr-admin-01',
    name: 'Rajesh Sharma',
    email: 'admin@sunpowersolutions.in',
    password: 'Password@123',
    phone: '+91 98111 00001',
    role: 'ADMIN',
    department: 'Executive Management',
    status: 'ACTIVE',
    createdAt: '2026-08-01T09:00:00Z',
    roleAssignedBy: 'System Initializer',
    roleAssignedAt: '2026-08-01T09:00:00Z',
  },
  {
    id: 'usr-dir-01',
    name: 'Ananya Verma',
    email: 'director@sunpowersolutions.in',
    password: 'Password@123',
    phone: '+91 98111 00002',
    role: 'DIRECTOR',
    department: 'Board of Directors',
    status: 'ACTIVE',
    createdAt: '2026-08-01T09:00:00Z',
    roleAssignedBy: 'System Initializer',
    roleAssignedAt: '2026-08-01T09:00:00Z',
  },
  {
    id: 'usr-sales-01',
    name: 'Vikram Mehta',
    email: 'sales@sunpowersolutions.in',
    password: 'Password@123',
    phone: '+91 98111 00003',
    role: 'SALES',
    department: 'Commercial Solutions',
    status: 'ACTIVE',
    createdAt: '2026-08-15T10:00:00Z',
    roleAssignedBy: 'Rajesh Sharma (Admin)',
    roleAssignedAt: '2026-08-15T10:00:00Z',
  },
  {
    id: 'usr-sales-02',
    name: 'Priya Kapoor',
    email: 'priya.k@sunpowersolutions.in',
    password: 'Password@123',
    role: 'SALES',
    status: 'ACTIVE',
    phone: '+91 98111 00008',
    department: 'Key Accounts',
    roleAssignedBy: 'Rajesh Sharma (Admin)',
    roleAssignedAt: '2026-08-16T10:00:00Z',
    createdAt: '2026-08-16T10:00:00Z',
  },
  {
    id: 'usr-sales-03',
    name: 'Rohit Gupta',
    email: 'rohit.g@sunpowersolutions.in',
    password: 'Password@123',
    role: 'SALES',
    status: 'ACTIVE',
    phone: '+91 98111 00009',
    department: 'Field Sales Lead',
    roleAssignedBy: 'Rajesh Sharma (Admin)',
    roleAssignedAt: '2026-08-17T10:00:00Z',
    createdAt: '2026-08-17T10:00:00Z',
  },
  {
    id: 'usr-tech-01',
    name: 'Manoj Kumar',
    email: 'tech@sunpowersolutions.in',
    password: 'Password@123',
    phone: '+91 98765 01001',
    role: 'TECHNICIAN',
    department: 'Field Engineering Team A',
    status: 'ACTIVE',
    createdAt: '2026-08-20T11:00:00Z',
    roleAssignedBy: 'Rajesh Sharma (Admin)',
    roleAssignedAt: '2026-08-20T11:00:00Z',
  },
  {
    id: 'usr-wh-01',
    name: 'Suresh Patel',
    email: 'warehouse@sunpowersolutions.in',
    password: 'Password@123',
    phone: '+91 98111 00005',
    role: 'WAREHOUSE_MANAGER',
    department: 'Supply Chain & Logistics',
    status: 'ACTIVE',
    createdAt: '2026-08-25T14:00:00Z',
    roleAssignedBy: 'Rajesh Sharma (Admin)',
    roleAssignedAt: '2026-08-25T14:00:00Z',
  },
  {
    id: 'usr-supp-01',
    name: 'Pooja Nair',
    email: 'support@sunpowersolutions.in',
    password: 'Password@123',
    phone: '+91 98111 00006',
    role: 'SUPPORT_AGENT',
    department: 'Customer Care & Warranty',
    status: 'ACTIVE',
    createdAt: '2026-09-01T09:30:00Z',
    roleAssignedBy: 'Rajesh Sharma (Admin)',
    roleAssignedAt: '2026-09-01T09:30:00Z',
  },
];

export let users: UserAccount[] = [...INITIAL_USERS];
export let roleAuditLogs: RoleAuditEntry[] = [];

// ==========================================
// Customer Smart Assignment & Queueing
// ==========================================
const MAX_ACTIVE_LEADS_PER_STAFF = 2;
const ACTIVE_LEAD_STATUSES: EnquiryStatus[] = ['NEW', 'CONTACTED', 'SURVEY_SCHEDULED', 'SURVEY_DONE', 'QUOTATION_SENT'];

function getActiveStaffLeadCount(staffName: string): number {
  return customers.filter(
    (c) => c.assignedTo === staffName && ACTIVE_LEAD_STATUSES.includes(c.status)
  ).length;
}

function findAvailableStaffOffline(): string | null {
  const salesStaff = ['Vikram Mehta', 'Priya Kapoor', 'Rohit Gupta'];
  const available = salesStaff
    .map((name) => ({ name, count: getActiveStaffLeadCount(name) }))
    .filter((s) => s.count < MAX_ACTIVE_LEADS_PER_STAFF)
    .sort((a, b) => a.count - b.count);

  return available.length > 0 ? available[0].name : null;
}

function processQueuedOffline(releasedStaffName?: string): void {
  while (true) {
    const oldestQueuedIndex = customers.findIndex(
      (c) => c.status === 'QUEUED' || c.assignedTo === 'UNASSIGNED'
    );
    if (oldestQueuedIndex === -1) break;

    let targetStaff: string | null = null;
    if (releasedStaffName && getActiveStaffLeadCount(releasedStaffName) < MAX_ACTIVE_LEADS_PER_STAFF) {
      targetStaff = releasedStaffName;
    } else {
      targetStaff = findAvailableStaffOffline();
    }

    if (!targetStaff) break;

    customers[oldestQueuedIndex] = {
      ...customers[oldestQueuedIndex],
      assignedTo: targetStaff,
      status: 'NEW',
      updatedAt: new Date().toISOString(),
    };
  }
}

// ==========================================
// Customer Mutations & Queries
// ==========================================
export function addCustomer(c: Customer): Customer {
  if (!c.assignedTo || c.assignedTo === 'UNASSIGNED' || c.assignedTo === 'AUTO') {
    const availableStaff = findAvailableStaffOffline();
    if (availableStaff) {
      c.assignedTo = availableStaff;
      c.status = 'NEW';
    } else {
      c.assignedTo = 'UNASSIGNED';
      c.status = 'QUEUED';
    }
  }

  customers.unshift(c);
  persistDb();
  return c;
}

export function updateCustomer(id: string, data: Partial<Customer>): Customer {
  const index = customers.findIndex((c) => c.id === id);
  if (index !== -1) {
    const existing = customers[index];
    const wasActive = ACTIVE_LEAD_STATUSES.includes(existing.status);
    const isNowInactive = data.status && ['CONVERTED', 'CLOSED_LOST'].includes(data.status);

    customers[index] = { ...customers[index], ...data, updatedAt: new Date().toISOString() };

    if (wasActive && isNowInactive && existing.assignedTo) {
      processQueuedOffline(existing.assignedTo);
    }

    persistDb();
    return customers[index];
  }
  throw new Error(`Customer with id "${id}" not found`);
}

// ==========================================
// Survey Mutations & Queries
// ==========================================
export function addSurvey(s: Survey): Survey {
  surveys.unshift(s);
  persistDb();
  return s;
}

export function updateSurvey(id: string, data: Partial<Survey>): Survey {
  const index = surveys.findIndex((s) => s.id === id);
  if (index !== -1) {
    surveys[index] = { ...surveys[index], ...data };
    persistDb();
    return surveys[index];
  }
  throw new Error(`Survey with id "${id}" not found`);
}

// ==========================================
// Quotation & Order Mutations
// ==========================================
export function addQuotation(q: Quotation): Quotation {
  quotations.unshift(q);
  persistDb();
  return q;
}

export function updateQuotation(id: string, data: Partial<Quotation>): Quotation {
  const index = quotations.findIndex((q) => q.id === id);
  if (index !== -1) {
    quotations[index] = { ...quotations[index], ...data };
    persistDb();
    return quotations[index];
  }
  throw new Error(`Quotation with id "${id}" not found`);
}

export function addOrder(o: Order): Order {
  orders.unshift(o);
  persistDb();
  return o;
}

export function updateOrder(id: string, data: Partial<Order>): Order {
  const index = orders.findIndex((o) => o.id === id);
  if (index !== -1) {
    orders[index] = { ...orders[index], ...data };
    persistDb();
    return orders[index];
  }
  throw new Error(`Order with id "${id}" not found`);
}

// ==========================================
// Inventory & Stock Mutations
// ==========================================
export function addInventoryItem(item: InventoryItem): InventoryItem {
  inventoryItems.unshift(item);
  persistDb();
  return item;
}

export function updateInventoryItem(id: string, data: Partial<InventoryItem>): InventoryItem {
  const index = inventoryItems.findIndex((i) => i.id === id);
  if (index !== -1) {
    inventoryItems[index] = { ...inventoryItems[index], ...data, updatedAt: new Date().toISOString() };
    persistDb();
    return inventoryItems[index];
  }
  throw new Error(`Inventory item with id "${id}" not found`);
}

export function addStockMovement(m: StockMovement): StockMovement {
  stockMovements.unshift(m);
  // Update currentStock on item
  const item = inventoryItems.find((i) => i.id === m.inventoryItemId);
  if (item) {
    if (m.movementType === 'INWARD' || m.movementType === 'RETURN') {
      item.currentStock += m.quantity;
    } else if (m.movementType === 'OUTWARD' || m.movementType === 'ADJUSTMENT') {
      item.currentStock = Math.max(0, item.currentStock - m.quantity);
    }
  }
  persistDb();
  return m;
}

// ==========================================
// Dispatch & Serial Number Tracking
// ==========================================
export function addDispatchOrder(d: DispatchOrder): DispatchOrder {
  dispatchOrders.unshift(d);
  persistDb();
  return d;
}

export function updateDispatchOrder(id: string, data: Partial<DispatchOrder>): DispatchOrder {
  const index = dispatchOrders.findIndex((d) => d.id === id);
  if (index !== -1) {
    dispatchOrders[index] = { ...dispatchOrders[index], ...data };
    persistDb();
    return dispatchOrders[index];
  }
  throw new Error(`Dispatch order with id "${id}" not found`);
}

export function isSerialNumberTaken(sn: string): boolean {
  const norm = sn.trim().toUpperCase();
  for (const d of dispatchOrders) {
    for (const item of d.items) {
      if (item.serialNumbers.some((s) => s.trim().toUpperCase() === norm)) {
        return true;
      }
    }
  }
  return false;
}

// ==========================================
// Warranty Records
// ==========================================
export function addWarrantyRecord(w: WarrantyRecord): WarrantyRecord {
  warrantyRecords.unshift(w);
  persistDb();
  return w;
}

export function updateWarrantyRecord(id: string, data: Partial<WarrantyRecord>): WarrantyRecord {
  const index = warrantyRecords.findIndex((w) => w.id === id);
  if (index !== -1) {
    warrantyRecords[index] = { ...warrantyRecords[index], ...data };
    persistDb();
    return warrantyRecords[index];
  }
  throw new Error(`Warranty record with id "${id}" not found`);
}

export function findWarrantyBySerial(sn: string): WarrantyRecord | undefined {
  const norm = sn.trim().toUpperCase();
  return warrantyRecords.find((w) => w.serialNumber.trim().toUpperCase() === norm);
}

// ==========================================
// Service Tickets
// ==========================================
export function addServiceTicket(t: ServiceTicket): ServiceTicket {
  serviceTickets.unshift(t);
  persistDb();
  return t;
}

export function updateServiceTicket(id: string, data: Partial<ServiceTicket>): ServiceTicket {
  const index = serviceTickets.findIndex((t) => t.id === id);
  if (index !== -1) {
    serviceTickets[index] = { ...serviceTickets[index], ...data, updatedAt: new Date().toISOString() };
    persistDb();
    return serviceTickets[index];
  }
  throw new Error(`Service ticket with id "${id}" not found`);
}

// ==========================================
// Installations & Commissioning
// ==========================================
export function addInstallationJob(job: InstallationJob): InstallationJob {
  installationJobs.unshift(job);
  persistDb();
  return job;
}

export function updateInstallationJob(id: string, data: Partial<InstallationJob>): InstallationJob {
  const index = installationJobs.findIndex((j) => j.id === id);
  if (index !== -1) {
    installationJobs[index] = { ...installationJobs[index], ...data, updatedAt: new Date().toISOString() };
    persistDb();
    return installationJobs[index];
  }
  throw new Error(`Installation job "${id}" not found`);
}

// ==========================================
// User Accounts & Authentic RBAC Store
// ==========================================
export function getUsers(): UserAccount[] {
  return [...users];
}

export function getUserById(id: string): UserAccount | undefined {
  return users.find((u) => u.id === id);
}

export function getUserByEmail(email: string): UserAccount | undefined {
  const norm = email.trim().toLowerCase();
  return users.find((u) => u.email.trim().toLowerCase() === norm);
}

/**
 * Creates user account.
 * System Bootstrap: If this is the very first registered user in the database,
 * automatically assign ADMIN role and ACTIVE status to enable initial setup.
 */
export function createUserAccount(
  data: Omit<UserAccount, 'id' | 'createdAt'>
): UserAccount {
  const isFirstUser = users.length === 0;

  const newUser: UserAccount = {
    ...data,
    id: `usr-${Date.now()}`,
    role: isFirstUser ? 'ADMIN' : data.role,
    status: isFirstUser ? 'ACTIVE' : data.status,
    roleAssignedBy: isFirstUser ? 'System Bootstrap' : data.roleAssignedBy,
    roleAssignedAt: isFirstUser ? new Date().toISOString() : data.roleAssignedAt,
    createdAt: new Date().toISOString(),
  };

  users.unshift(newUser);
  persistDb();
  return newUser;
}

export function updateUserRole(
  userId: string,
  newRole: UserRole,
  adminId: string,
  adminName: string,
  reason: string
): { user: UserAccount; audit: RoleAuditEntry } {
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    throw new Error(`User with id "${userId}" not found`);
  }

  const user = users[userIndex];
  const oldRole = user.role;

  const updatedUser: UserAccount = {
    ...user,
    role: newRole,
    roleAssignedBy: adminName,
    roleAssignedAt: new Date().toISOString(),
  };

  users[userIndex] = updatedUser;

  const auditEntry: RoleAuditEntry = {
    id: `audit-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    oldRole,
    newRole,
    changedByAdminId: adminId,
    changedByAdminName: adminName,
    reason,
    timestamp: new Date().toISOString(),
  };

  roleAuditLogs.unshift(auditEntry);
  persistDb();

  return { user: updatedUser, audit: auditEntry };
}

export function updateUserStatus(
  userId: string,
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED'
): UserAccount {
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) {
    throw new Error(`User with id "${userId}" not found`);
  }
  const updated: UserAccount = {
    ...users[index],
    status,
  };
  users[index] = updated;
  persistDb();
  return updated;
}

export function getRoleAuditLogs(): RoleAuditEntry[] {
  return [...roleAuditLogs];
}

// ==========================================
// Storage Persistence Layer
// ==========================================
const STORAGE_KEY = 'sunpower_db_state_v3';

export function persistDb(): void {
  if (typeof window === 'undefined') return;
  try {
    const state = {
      customers,
      surveys,
      quotations,
      orders,
      inventoryItems,
      stockMovements,
      dispatchOrders,
      warrantyRecords,
      serviceTickets,
      installationJobs,
      users,
      roleAuditLogs,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[inMemoryDb] LocalStorage save error:', e);
  }
}

export function hydrateDbFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    // Purge legacy mock data cache
    localStorage.removeItem('sunpower_db_state_v1');
    localStorage.removeItem('sunpower_db_state_v2');

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.customers && Array.isArray(parsed.customers)) customers = parsed.customers;
    if (parsed.surveys && Array.isArray(parsed.surveys)) surveys = parsed.surveys;
    if (parsed.quotations && Array.isArray(parsed.quotations)) quotations = parsed.quotations;
    if (parsed.orders && Array.isArray(parsed.orders)) orders = parsed.orders;
    if (parsed.inventoryItems && Array.isArray(parsed.inventoryItems)) inventoryItems = parsed.inventoryItems;
    if (parsed.stockMovements && Array.isArray(parsed.stockMovements)) stockMovements = parsed.stockMovements;
    if (parsed.dispatchOrders && Array.isArray(parsed.dispatchOrders)) dispatchOrders = parsed.dispatchOrders;
    if (parsed.warrantyRecords && Array.isArray(parsed.warrantyRecords)) warrantyRecords = parsed.warrantyRecords;
    if (parsed.serviceTickets && Array.isArray(parsed.serviceTickets)) serviceTickets = parsed.serviceTickets;
    if (parsed.users && Array.isArray(parsed.users) && parsed.users.length > 0) {
      users = parsed.users;
      const maheshIdx = users.findIndex((u) => u.email.toLowerCase() === 'maheshch1094@gmail.com');
      if (maheshIdx === -1) {
        users.unshift(INITIAL_USERS[0]);
      } else {
        users[maheshIdx].role = 'ADMIN';
        users[maheshIdx].status = 'ACTIVE';
        users[maheshIdx].password = 'Mahesh';
      }
    } else {
      users = [...INITIAL_USERS];
    }
    if (parsed.roleAuditLogs && Array.isArray(parsed.roleAuditLogs)) roleAuditLogs = parsed.roleAuditLogs;

    // Ensure Admin Nikhil account is always present
    if (!users.some((u) => u.email.toLowerCase() === 'nikhil@gmail.com')) {
      users.unshift({
        id: 'usr-admin-nikhil',
        name: 'Nikhil',
        email: 'nikhil@gmail.com',
        password: '123456',
        role: 'ADMIN',
        status: 'ACTIVE',
        phone: '+91 98111 99999',
        department: 'Executive Management',
        roleAssignedBy: 'System Initializer',
        roleAssignedAt: '2026-08-01T09:00:00Z',
        createdAt: '2026-08-01T09:00:00Z',
      });
    }

    if (!customers.some((c) => c.email && c.email.toLowerCase() === 'nikhil@gmail.com')) {
      customers.unshift({
        id: 'cust-nikhil',
        name: 'Nikhil (Admin)',
        phone: '9811199999',
        email: 'nikhil@gmail.com',
        address: '123 Solar HQ, Central Park',
        city: 'Delhi',
        pincode: '110001',
        monthlyBill: 4500,
        requiredCapacityKW: 5,
        systemType: 'ON_GRID',
        subsidyRequired: true,
        enquirySource: 'WEB_FORM',
        status: 'CONVERTED',
        notes: 'System Administrator Account',
        assignedTo: 'Rajesh Sharma',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.warn('[inMemoryDb] LocalStorage hydration error:', e);
  }
}

// Hydrate state immediately
hydrateDbFromStorage();
