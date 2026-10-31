-- ==============================================================================
-- SunPower Solar Management System - Database Schema (SQLite)
-- Schema uses exact camelCase field names matching the React TypeScript types.
-- This allows direct, zero-overhead JSON serialization between backend & frontend.
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------------------------
-- 1. Authentication & RBAC Users [Member 1]
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK(role IN ('ADMIN', 'DIRECTOR', 'SALES', 'TECHNICIAN', 'WAREHOUSE_MANAGER', 'SUPPORT_AGENT')),
    department TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK(status IN ('ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED')),
    roleAssignedBy TEXT,
    roleAssignedAt TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS role_audit_logs (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    userName TEXT NOT NULL,
    oldRole TEXT,
    newRole TEXT NOT NULL,
    changedById TEXT NOT NULL,
    changedByName TEXT NOT NULL,
    reason TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- 2. Customer Leads, Sales Pipeline, Surveys & Quotations [Member 2]
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    pincode TEXT NOT NULL,
    monthlyBill REAL NOT NULL DEFAULT 0,
    requiredCapacityKW REAL NOT NULL DEFAULT 1,
    systemType TEXT NOT NULL CHECK(systemType IN ('ON_GRID', 'OFF_GRID', 'HYBRID')),
    subsidyRequired INTEGER NOT NULL DEFAULT 1,
    enquirySource TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NEW',
    notes TEXT,
    assignedTo TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS surveys (
    id TEXT PRIMARY KEY,
    customerId TEXT NOT NULL,
    customerName TEXT NOT NULL,
    surveyDate TEXT NOT NULL,
    surveyorId TEXT NOT NULL,
    surveyorName TEXT NOT NULL,
    roofAreaSqFt REAL NOT NULL,
    shadowFreeAreaSqFt REAL NOT NULL,
    roofType TEXT NOT NULL,
    roofTiltAngle REAL NOT NULL DEFAULT 15,
    roofAzimuth TEXT NOT NULL DEFAULT 'SOUTH',
    cableRunLengthMeters REAL NOT NULL,
    electricalConnection TEXT NOT NULL,
    sanctionedLoadKW REAL NOT NULL,
    feasibilityStatus TEXT NOT NULL DEFAULT 'PENDING',
    rejectionReason TEXT,
    remarks TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS quotations (
    id TEXT PRIMARY KEY,
    quotationNumber TEXT NOT NULL UNIQUE,
    customerId TEXT NOT NULL,
    customerName TEXT NOT NULL,
    capacityKW REAL NOT NULL,
    systemType TEXT NOT NULL,
    panelModel TEXT NOT NULL,
    panelCount INTEGER NOT NULL,
    inverterModel TEXT NOT NULL,
    inverterCount INTEGER NOT NULL,
    batteryModel TEXT,
    batteryCount INTEGER DEFAULT 0,
    bomLines TEXT NOT NULL, -- Stored as JSON string
    baseAmount REAL NOT NULL,
    gstAmount REAL NOT NULL,
    subsidyAmount REAL NOT NULL DEFAULT 0,
    totalAmount REAL NOT NULL,
    grossMarginPercent REAL NOT NULL,
    validUntil TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    scheduledDate TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    orderNumber TEXT NOT NULL UNIQUE,
    quotationId TEXT NOT NULL,
    customerId TEXT NOT NULL,
    customerName TEXT NOT NULL,
    capacityKW REAL NOT NULL,
    totalAmount REAL NOT NULL,
    advanceReceived REAL NOT NULL DEFAULT 0,
    balanceDue REAL NOT NULL,
    paymentStatus TEXT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'ORDER_CONFIRMED',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (quotationId) REFERENCES quotations(id) ON DELETE RESTRICT,
    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE RESTRICT
);

-- ------------------------------------------------------------------------------
-- 3. Warehouse Inventory, Movements, Dispatch & Warranties [Member 3]
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'Nos',
    currentStock INTEGER NOT NULL DEFAULT 0,
    lowStockThreshold INTEGER NOT NULL DEFAULT 10,
    unitCostPrice REAL NOT NULL,
    unitSellingPrice REAL NOT NULL,
    hasSerialNumbers INTEGER NOT NULL DEFAULT 0,
    warrantyYears INTEGER NOT NULL DEFAULT 5,
    specifications TEXT,
    location TEXT NOT NULL DEFAULT 'Main Warehouse',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY,
    inventoryItemId TEXT NOT NULL,
    itemName TEXT NOT NULL,
    movementType TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    reason TEXT,
    reference TEXT,
    performedBy TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (inventoryItemId) REFERENCES inventory_items(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS dispatch_orders (
    id TEXT PRIMARY KEY,
    dispatchNumber TEXT NOT NULL UNIQUE,
    orderId TEXT NOT NULL,
    customerId TEXT NOT NULL,
    customerName TEXT NOT NULL,
    customerAddress TEXT NOT NULL,
    items TEXT NOT NULL, -- Stored as JSON array with serial numbers
    status TEXT NOT NULL DEFAULT 'DRAFT',
    vehicleNumber TEXT,
    driverName TEXT,
    dispatchedAt TEXT,
    deliveredAt TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE RESTRICT,
    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS warranty_records (
    id TEXT PRIMARY KEY,
    serialNumber TEXT NOT NULL UNIQUE,
    inventoryItemId TEXT NOT NULL,
    itemName TEXT NOT NULL,
    itemCategory TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    customerId TEXT NOT NULL,
    customerName TEXT NOT NULL,
    customerPhone TEXT NOT NULL,
    dispatchOrderId TEXT,
    dispatchDate TEXT NOT NULL,
    warrantyYears INTEGER NOT NULL,
    warrantyExpiryDate TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    installationDate TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE RESTRICT
);

-- ------------------------------------------------------------------------------
-- 4. Field Installation Jobs, Service Tickets & P&L [Member 4]
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS installation_jobs (
    id TEXT PRIMARY KEY,
    jobCode TEXT NOT NULL UNIQUE,
    orderId TEXT NOT NULL,
    customerId TEXT NOT NULL,
    customerName TEXT NOT NULL,
    customerPhone TEXT NOT NULL,
    siteAddress TEXT NOT NULL,
    capacityKW REAL NOT NULL,
    systemType TEXT NOT NULL,
    leadTechnicianId TEXT,
    leadTechnicianName TEXT,
    assistantTechnicianIds TEXT NOT NULL DEFAULT '[]', -- JSON array
    scheduledStartDate TEXT NOT NULL,
    scheduledEndDate TEXT NOT NULL,
    actualStartTime TEXT,
    actualFinishTime TEXT,
    stage TEXT NOT NULL DEFAULT 'SCHEDULED',
    checklist TEXT NOT NULL DEFAULT '{}', -- JSON object
    photos TEXT NOT NULL DEFAULT '{}', -- JSON object
    customerSignature TEXT,
    customerRating INTEGER,
    customerFeedback TEXT,
    completionReportNumber TEXT,
    commissionedAt TEXT,
    notes TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE RESTRICT,
    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS service_tickets (
    id TEXT PRIMARY KEY,
    ticketNumber TEXT NOT NULL UNIQUE,
    customerId TEXT NOT NULL,
    customerName TEXT NOT NULL,
    customerPhone TEXT NOT NULL,
    serialNumber TEXT,
    warrantyRecordId TEXT,
    isUnderWarranty INTEGER NOT NULL DEFAULT 1,
    faultCode TEXT,
    faultDescription TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    status TEXT NOT NULL DEFAULT 'OPEN',
    assignedTechnicianId TEXT,
    assignedTechnicianName TEXT,
    resolutionNotes TEXT,
    resolvedAt TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE RESTRICT
);

-- Lightning fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_role_audit_logs_user ON role_audit_logs(userId);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_surveys_customer ON surveys(customerId);
CREATE INDEX IF NOT EXISTS idx_quotations_customer ON quotations(customerId);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customerId);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_warranty_serial ON warranty_records(serialNumber);
CREATE INDEX IF NOT EXISTS idx_service_status ON service_tickets(status);
CREATE INDEX IF NOT EXISTS idx_installation_stage ON installation_jobs(stage);

