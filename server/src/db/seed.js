/**
 * Database Seed Script
 * 
 * Purpose:
 * Seeds the SQLite database with realistic Indian solar rooftop data
 * (customers, technical surveys, auto-BOM quotations, orders, inventory items,
 * dispatch records, serial warranties, field installations, tickets, and user accounts).
 * 
 * Why in this file?
 * Running `npm run seed` allows the evaluator or any team member to test the entire application
 * offline immediately without having to manually type demo data into forms.
 */

import bcrypt from 'bcryptjs';
import { db } from './database.js';

console.log('🌱 Starting SunPower Solar ERP database seed...');

const defaultPasswordHash = bcrypt.hashSync('Password@123', 10);

// Clear existing tables
db.exec(`
  DELETE FROM role_audit_logs;
  DELETE FROM service_tickets;
  DELETE FROM installation_jobs;
  DELETE FROM warranty_records;
  DELETE FROM dispatch_orders;
  DELETE FROM stock_movements;
  DELETE FROM inventory_items;
  DELETE FROM orders;
  DELETE FROM quotations;
  DELETE FROM surveys;
  DELETE FROM customers;
  DELETE FROM users;
`);

// 1. Users
const insertUser = db.prepare(`
  INSERT INTO users (id, name, email, password, phone, role, department, status, roleAssignedBy, roleAssignedAt, createdAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const usersData = [
  ['usr-admin-mahesh', 'Mahesh Ch', 'maheshch1094@gmail.com', bcrypt.hashSync('Mahesh', 10), '+91 98765 43210', 'ADMIN', 'Executive Administration', 'ACTIVE', 'System Initializer', '2026-08-01T09:00:00Z', '2026-08-01T09:00:00Z'],
  ['usr-admin-01', 'Rajesh Sharma', 'admin@sunpowersolutions.in', defaultPasswordHash, '+91 98111 00001', 'ADMIN', 'Executive Management', 'ACTIVE', 'System Initializer', '2026-08-01T09:00:00Z', '2026-08-01T09:00:00Z'],
  ['usr-dir-01', 'Ananya Verma', 'director@sunpowersolutions.in', defaultPasswordHash, '+91 98111 00002', 'DIRECTOR', 'Board of Directors', 'ACTIVE', 'System Initializer', '2026-08-01T09:00:00Z', '2026-08-01T09:00:00Z'],
  ['usr-sales-01', 'Vikram Mehta', 'sales@sunpowersolutions.in', defaultPasswordHash, '+91 98111 00003', 'SALES', 'Commercial Solutions', 'ACTIVE', 'Rajesh Sharma (Admin)', '2026-08-15T10:00:00Z', '2026-08-15T10:00:00Z'],
  ['usr-tech-01', 'Manoj Kumar', 'tech@sunpowersolutions.in', defaultPasswordHash, '+91 98765 01001', 'TECHNICIAN', 'Field Engineering Team A', 'ACTIVE', 'Rajesh Sharma (Admin)', '2026-08-20T11:00:00Z', '2026-08-20T11:00:00Z'],
  ['usr-wh-01', 'Suresh Patel', 'warehouse@sunpowersolutions.in', defaultPasswordHash, '+91 98111 00005', 'WAREHOUSE_MANAGER', 'Supply Chain & Logistics', 'ACTIVE', 'Rajesh Sharma (Admin)', '2026-08-25T14:00:00Z', '2026-08-25T14:00:00Z'],
  ['usr-supp-01', 'Pooja Nair', 'support@sunpowersolutions.in', defaultPasswordHash, '+91 98111 00006', 'SUPPORT_AGENT', 'Customer Care & Warranty', 'ACTIVE', 'Rajesh Sharma (Admin)', '2026-09-01T09:30:00Z', '2026-09-01T09:30:00Z'],
  ['usr-pending-01', 'Rohan Deshmukh', 'rohan.d@gmail.com', defaultPasswordHash, '+91 98111 00007', 'SALES', 'Sales Trainee', 'PENDING_APPROVAL', null, null, '2026-10-30T16:20:00Z'],
];

for (const user of usersData) {
  insertUser.run(...user);
}

// 2. Role Audit Logs
const insertAuditLog = db.prepare(`
  INSERT INTO role_audit_logs (id, userId, userName, oldRole, newRole, changedById, changedByName, reason, createdAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const auditLogsData = [
  ['audit-01', 'usr-sales-01', 'Vikram Mehta', 'PENDING_APPROVAL', 'SALES', 'usr-admin-01', 'Rajesh Sharma (Admin)', 'Completed 2-week sales induction and onboarding', '2026-08-15T10:00:00Z'],
  ['audit-02', 'usr-tech-01', 'Manoj Kumar', 'PENDING_APPROVAL', 'TECHNICIAN', 'usr-admin-01', 'Rajesh Sharma (Admin)', 'Verified MNRE solar installer certification', '2026-08-20T11:00:00Z'],
  ['audit-03', 'usr-wh-01', 'Suresh Patel', 'PENDING_APPROVAL', 'WAREHOUSE_MANAGER', 'usr-admin-01', 'Rajesh Sharma (Admin)', 'Promoted to lead warehouse inventory manager', '2026-08-25T14:00:00Z'],
];

for (const log of auditLogsData) {
  insertAuditLog.run(...log);
}

// 3. Customers
const insertCustomer = db.prepare(`
  INSERT INTO customers (id, name, phone, email, address, city, pincode, monthlyBill, requiredCapacityKW, systemType, subsidyRequired, enquirySource, status, notes, assignedTo, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const customersData = [
  ['cust-01', 'Rajesh Malhotra', '9810123456', 'rajesh.malhotra@gmail.com', 'B-42, South Extension Part II', 'Delhi', '110049', 7200, 5, 'ON_GRID', 1, 'WEB_FORM', 'CONVERTED', 'Approved 5 kW On-Grid system. Order confirmed.', 'Vikram Mehta', '2026-09-10T10:30:00.000Z', '2026-10-25T16:00:00.000Z'],
  ['cust-02', 'Sunita Sharma', '9871234567', 'sunita.sharma@outlook.com', 'House 142, Sector 14, Urban Estate', 'Gurugram', '122001', 5800, 4, 'ON_GRID', 1, 'WHATSAPP', 'CONVERTED', '4 kW On-Grid setup. 20% advance received. Ready for dispatch.', 'Pooja Nair', '2026-09-18T11:15:00.000Z', '2026-10-26T12:00:00.000Z'],
  ['cust-03', 'Vikram Singhania', '9899123456', 'vikram.singhania@yahoo.co.in', 'A-12, Sector 62', 'Noida', '201301', 4500, 3, 'ON_GRID', 1, 'PHONE_CALL', 'QUOTATION_SENT', 'Quotation sent for 3 kW system with PM Surya Ghar subsidy.', 'Vikram Mehta', '2026-10-02T09:45:00.000Z', '2026-10-18T15:20:00.000Z'],
  ['cust-04', 'Anita Patel', '9825123456', 'anita.patel@gmail.com', 'Plot 88, Vasant Vihar', 'New Delhi', '110057', 12000, 10, 'HYBRID', 0, 'REFERRAL', 'SURVEY_SCHEDULED', 'Large residential villa. Interested in 10 kW hybrid system with battery backup.', 'Vikram Mehta', '2026-10-12T14:00:00.000Z', '2026-10-22T11:00:00.000Z'],
  ['cust-05', 'Amitav Sengupta', '9830123456', 'amitav.s@rediffmail.com', 'Flat 4B, Green Park Main', 'Delhi', '110016', 3200, 2, 'ON_GRID', 1, 'WEB_FORM', 'CONTACTED', 'Initial callback done. Needs PM Surya Ghar subsidy application assistance.', 'Pooja Nair', '2026-10-20T16:30:00.000Z', '2026-10-21T10:00:00.000Z'],
  ['cust-06', 'Col. Harbhajan Singh', '9818123456', 'hsingh.col@gmail.com', 'C-7, Defence Colony', 'New Delhi', '110024', 8500, 6, 'ON_GRID', 1, 'PHONE_CALL', 'NEW', 'Retired army officer. Inquired about solar net-metering rules with BSES Rajdhani.', 'Vikram Mehta', '2026-10-28T09:00:00.000Z', '2026-10-28T09:00:00.000Z'],
  ['cust-07', 'Deepak Agarwal', '9810987654', 'deepak.agarwal@agarwaltextiles.in', 'Plot 14, Udyog Vihar Phase IV', 'Gurugram', '122015', 38000, 25, 'ON_GRID', 0, 'EXHIBITION', 'CONTACTED', 'Commercial rooftop enquiry. Industrial tariff reduction evaluation requested.', 'Vikram Mehta', '2026-10-25T12:00:00.000Z', '2026-10-27T17:00:00.000Z'],
  ['cust-08', 'Meenakshi Sundaram', '9840123456', 'meenakshi.s@gmail.com', 'D-19, Hauz Khas Enclave', 'New Delhi', '110016', 2200, 1, 'ON_GRID', 1, 'OTHER', 'CLOSED_LOST', 'Budget constraints after consultation. May reconsider next fiscal year.', 'Pooja Nair', '2026-09-05T10:00:00.000Z', '2026-09-22T14:30:00.000Z']
];

for (const c of customersData) {
  insertCustomer.run(...c);
}

// 4. Surveys
const insertSurvey = db.prepare(`
  INSERT INTO surveys (id, customerId, customerName, surveyDate, surveyorId, surveyorName, roofAreaSqFt, shadowFreeAreaSqFt, roofType, roofTiltAngle, roofAzimuth, cableRunLengthMeters, electricalConnection, sanctionedLoadKW, feasibilityStatus, rejectionReason, remarks, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const surveysData = [
  ['surv-01', 'cust-01', 'Rajesh Malhotra', '2026-09-15', 'usr-tech-01', 'Manoj Kumar', 1200, 950, 'RCC_FLAT', 15, 'SOUTH', 28, 'THREE_PHASE', 10, 'APPROVED', null, 'Excellent south-facing RCC rooftop. Shadow analysis confirms 950 sq.ft unshaded area. Feasible for 5 kW system.', '2026-09-15T15:00:00.000Z', '2026-09-16T10:00:00.000Z'],
  ['surv-02', 'cust-02', 'Sunita Sharma', '2026-09-22', 'usr-tech-01', 'Manoj Kumar', 850, 700, 'RCC_FLAT', 12, 'SOUTH_EAST', 22, 'SINGLE_PHASE', 7, 'APPROVED', null, 'Minor shadow on NW corner between 4-5 PM. Net usable area 700 sq.ft is fully adequate for 4 kW.', '2026-09-22T16:30:00.000Z', '2026-09-23T09:00:00.000Z'],
  ['surv-03', 'cust-03', 'Vikram Singhania', '2026-10-06', 'usr-tech-01', 'Manoj Kumar', 600, 480, 'RCC_FLAT', 15, 'SOUTH', 18, 'SINGLE_PHASE', 5, 'APPROVED', null, 'Compact rooftop but 100% shadow-free south exposure. Sanctioned load 5 kW allows 3 kW on-grid setup.', '2026-10-06T14:00:00.000Z', '2026-10-07T11:00:00.000Z'],
  ['surv-04', 'cust-04', 'Anita Patel', '2026-10-24', 'usr-tech-01', 'Manoj Kumar', 2400, 1900, 'RCC_FLAT', 18, 'SOUTH', 45, 'THREE_PHASE', 15, 'PENDING', null, 'Multi-level rooftop. Structural load bearing inspection underway for 10 kW elevated mounting structure.', '2026-10-24T17:00:00.000Z', '2026-10-25T09:30:00.000Z']
];

for (const s of surveysData) {
  insertSurvey.run(...s);
}

// 5. Inventory Items
const insertInventory = db.prepare(`
  INSERT INTO inventory_items (id, sku, name, brand, model, category, unit, currentStock, lowStockThreshold, unitCostPrice, unitSellingPrice, hasSerialNumbers, warrantyYears, specifications, location, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const inventoryData = [
  ['inv-item-01', 'PNL-ADNI-540W', 'Adani Solar 540W Mono PERC Half-Cut Module', 'Adani Solar', 'AS540-144', 'SOLAR_PANEL', 'Nos', 480, 50, 14500, 17000, 1, 25, '540W Mono PERC, 144 half-cells, 21.3% module efficiency', 'Warehouse Bay A1-P4', '2026-01-15T08:00:00.000Z', '2026-10-25T10:00:00.000Z'],
  ['inv-item-02', 'PNL-TATA-545W', 'Tata Power 545W Bifacial Dual-Glass Solar Panel', 'Tata Power Solar', 'TP545-BF', 'SOLAR_PANEL', 'Nos', 120, 30, 15200, 18000, 1, 25, '545W Bifacial Mono PERC, up to 25% rear gain', 'Warehouse Bay A2-P1', '2026-02-10T08:00:00.000Z', '2026-10-20T09:00:00.000Z'],
  ['inv-item-03', 'INV-GWTT-5KW', 'Growatt MIN 5000TL-X 5kW Single-Phase On-Grid Inverter', 'Growatt', 'MIN 5000TL-X', 'INVERTER', 'Nos', 24, 5, 36000, 44000, 1, 5, '5 kW Single Phase, Dual MPPT, 98.4% max efficiency', 'Electronics Shelf E1', '2026-01-20T08:00:00.000Z', '2026-10-25T10:00:00.000Z'],
  ['inv-item-04', 'INV-SOLIS-3KW', 'Solis S6-GR1P3K 3kW Dual MPPT On-Grid Inverter', 'Solis', 'S6-GR1P3K', 'INVERTER', 'Nos', 18, 4, 23500, 28500, 1, 5, '3 kW Single Phase, Dual MPPT, IP66 rated enclosure', 'Electronics Shelf E2', '2026-02-01T08:00:00.000Z', '2026-10-22T11:00:00.000Z'],
  ['inv-item-05', 'INV-HUAW-10KW', 'Huawei SUN2000-10KTL-M1 10kW Three-Phase Hybrid Inverter', 'Huawei', 'SUN2000-10KTL', 'INVERTER', 'Nos', 8, 2, 72000, 88000, 1, 10, '10 kW Three Phase, AI-powered AFCI arcing protection', 'Electronics Shelf E3', '2026-03-05T08:00:00.000Z', '2026-10-18T14:00:00.000Z'],
  ['inv-item-06', 'BAT-LIVG-5KWH', 'Livguard Solar LFP 5.12kWh Lithium Battery Pack', 'Livguard', 'LFP-5120', 'BATTERY', 'Nos', 14, 3, 85000, 105000, 1, 10, '51.2V 100Ah, 6000 cycles @ 80% DoD, smart BMS', 'Battery Bay B1', '2026-04-12T08:00:00.000Z', '2026-10-24T12:00:00.000Z'],
  ['inv-item-07', 'STR-GI-HDG-4P', 'HDG Mounting Structure for 4 Panels (Elevated Type)', 'Apex Structures', 'STR-HDG-4P', 'MOUNTING_STRUCTURE', 'Nos', 65, 15, 4200, 5500, 0, 10, 'Hot-dip galvanized 80-micron zinc coating, 150 km/h wind resistance', 'Yard Section S2', '2026-02-15T08:00:00.000Z', '2026-10-26T09:00:00.000Z'],
  ['inv-item-08', 'CBL-POLYC-4MM', 'Polycab 4 sq.mm Solar DC Cable UV Resistant (Red/Black)', 'Polycab', 'SOL-DC-4MM', 'DC_WIRE', 'Meters', 1850, 300, 48, 62, 0, 5, 'Tinned copper, cross-linked polyolefin insulation, 1500V DC', 'Cable Reel Rack C1', '2026-01-10T08:00:00.000Z', '2026-10-26T14:00:00.000Z']
];

for (const inv of inventoryData) {
  insertInventory.run(...inv);
}

// 6. Stock Movements
const insertMovement = db.prepare(`
  INSERT INTO stock_movements (id, inventoryItemId, itemName, movementType, quantity, reason, reference, performedBy, createdAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const movementsData = [
  ['mov-01', 'inv-item-01', 'Adani Solar 540W Mono PERC Half-Cut Module', 'INWARD', 200, 'Direct container shipment receipt', 'PO-2026-0041', 'Suresh Patel', '2026-10-15T11:00:00.000Z'],
  ['mov-02', 'inv-item-03', 'Growatt MIN 5000TL-X 5kW Single-Phase On-Grid Inverter', 'INWARD', 10, 'Manufacturer dispatch delivery', 'PO-2026-0043', 'Suresh Patel', '2026-10-18T14:30:00.000Z'],
  ['mov-03', 'inv-item-01', 'Adani Solar 540W Mono PERC Half-Cut Module', 'OUTWARD', 10, 'Dispatch for Order ORD-2026-001 (Rajesh Malhotra 5 kW)', 'DISP-2026-001', 'Suresh Patel', '2026-10-22T09:15:00.000Z'],
  ['mov-04', 'inv-item-03', 'Growatt MIN 5000TL-X 5kW Single-Phase On-Grid Inverter', 'OUTWARD', 1, 'Dispatch for Order ORD-2026-001 (Rajesh Malhotra 5 kW)', 'DISP-2026-001', 'Suresh Patel', '2026-10-22T09:20:00.000Z']
];

for (const m of movementsData) {
  insertMovement.run(...m);
}

// 7. Quotations & Orders
const insertQuotation = db.prepare(`
  INSERT INTO quotations (id, quotationNumber, customerId, customerName, capacityKW, systemType, panelModel, panelCount, inverterModel, inverterCount, batteryModel, batteryCount, bomLines, baseAmount, gstAmount, subsidyAmount, totalAmount, grossMarginPercent, validUntil, status, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const quotationsData = [
  [
    'quote-01', 'QT-2026-001', 'cust-01', 'Rajesh Malhotra', 5, 'ON_GRID',
    'Adani Solar 540W Mono PERC Half-Cut Module', 10,
    'Growatt MIN 5000TL-X 5kW Single-Phase On-Grid Inverter', 1,
    null, 0,
    JSON.stringify([
      { itemName: 'Adani Solar 540W Mono PERC Module', quantity: 10, unit: 'Nos', rate: 17000, amount: 170000 },
      { itemName: 'Growatt 5kW On-Grid Inverter', quantity: 1, unit: 'Nos', rate: 44000, amount: 44000 },
      { itemName: 'HDG Mounting Structure & Fasteners', quantity: 3, unit: 'Nos', rate: 5500, amount: 16500 },
      { itemName: 'Polycab 4 sq.mm DC Solar Cable', quantity: 60, unit: 'Meters', rate: 62, amount: 3720 },
      { itemName: 'ACDB/DCDB Surge Protection & Earthing Kit', quantity: 1, unit: 'Set', rate: 12500, amount: 12500 },
      { itemName: 'Turnkey Installation, Testing & Net Metering Liaison', quantity: 1, unit: 'Job', rate: 22000, amount: 22000 }
    ]),
    268720, 32246, 78000, 222966, 26.5, '2026-11-20', 'ACCEPTED', '2026-09-18T10:00:00.000Z', '2026-09-20T16:00:00.000Z'
  ],
  [
    'quote-02', 'QT-2026-002', 'cust-02', 'Sunita Sharma', 4, 'ON_GRID',
    'Adani Solar 540W Mono PERC Half-Cut Module', 8,
    'Solis S6-GR1P3K 3kW Dual MPPT On-Grid Inverter', 1,
    null, 0,
    JSON.stringify([
      { itemName: 'Adani Solar 540W Mono PERC Module', quantity: 8, unit: 'Nos', rate: 17000, amount: 136000 },
      { itemName: 'Solis 4kW MPPT Inverter', quantity: 1, unit: 'Nos', rate: 36000, amount: 36000 },
      { itemName: 'Structure, Cabling & Installation', quantity: 1, unit: 'Lot', rate: 38000, amount: 38000 }
    ]),
    210000, 25200, 78000, 157200, 24.8, '2026-11-25', 'ACCEPTED', '2026-09-25T11:00:00.000Z', '2026-09-28T14:00:00.000Z'
  ]
];

for (const q of quotationsData) {
  insertQuotation.run(...q);
}

const insertOrder = db.prepare(`
  INSERT INTO orders (id, orderNumber, quotationId, customerId, customerName, capacityKW, totalAmount, advanceReceived, balanceDue, paymentStatus, stage, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const ordersData = [
  ['ord-01', 'ORD-2026-001', 'quote-01', 'cust-01', 'Rajesh Malhotra', 5, 222966, 100000, 122966, 'PARTIALLY_PAID', 'DISPATCH_PENDING', '2026-09-22T10:00:00.000Z', '2026-10-20T11:00:00.000Z'],
  ['ord-02', 'ORD-2026-002', 'quote-02', 'cust-02', 'Sunita Sharma', 4, 157200, 50000, 107200, 'PARTIALLY_PAID', 'DISPATCH_PENDING', '2026-09-30T14:00:00.000Z', '2026-10-22T09:30:00.000Z']
];

for (const o of ordersData) {
  insertOrder.run(...o);
}

// 8. Dispatch Orders
const insertDispatch = db.prepare(`
  INSERT INTO dispatch_orders (id, dispatchNumber, orderId, customerId, customerName, customerAddress, items, status, vehicleNumber, driverName, dispatchedAt, deliveredAt, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const dispatchData = [
  [
    'disp-01', 'DISP-2026-001', 'ord-01', 'cust-01', 'Rajesh Malhotra', 'B-42, South Extension Part II, Delhi',
    JSON.stringify([
      { inventoryItemId: 'inv-item-01', itemName: 'Adani Solar 540W Mono PERC Half-Cut Module', quantity: 10, serialNumbers: ['PNL-2026-AD-00101', 'PNL-2026-AD-00102', 'PNL-2026-AD-00103', 'PNL-2026-AD-00104', 'PNL-2026-AD-00105', 'PNL-2026-AD-00106', 'PNL-2026-AD-00107', 'PNL-2026-AD-00108', 'PNL-2026-AD-00109', 'PNL-2026-AD-00110'], warrantyYears: 25 },
      { inventoryItemId: 'inv-item-03', itemName: 'Growatt MIN 5000TL-X 5kW Single-Phase On-Grid Inverter', quantity: 1, serialNumbers: ['INV-2026-GW-50912'], warrantyYears: 5 }
    ]),
    'DISPATCHED', 'DL-1L-AA-4092', 'Ramesh Kumar', '2026-10-22T10:30:00.000Z', '2026-10-22T14:00:00.000Z', '2026-10-21T16:00:00.000Z', '2026-10-22T14:30:00.000Z'
  ]
];

for (const d of dispatchData) {
  insertDispatch.run(...d);
}

// 9. Warranty Records
const insertWarranty = db.prepare(`
  INSERT INTO warranty_records (id, serialNumber, inventoryItemId, itemName, itemCategory, brand, model, customerId, customerName, customerPhone, dispatchOrderId, dispatchDate, warrantyYears, warrantyExpiryDate, status, installationDate)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const warrantyData = [
  ['warr-01', 'INV-2026-GW-50912', 'inv-item-03', 'Growatt MIN 5000TL-X 5kW Inverter', 'INVERTER', 'Growatt', 'MIN 5000TL-X', 'cust-01', 'Rajesh Malhotra', '9810123456', 'disp-01', '2026-10-22', 5, '2031-10-22', 'ACTIVE', '2026-10-24'],
  ['warr-02', 'PNL-2026-AD-00101', 'inv-item-01', 'Adani Solar 540W Module', 'SOLAR_PANEL', 'Adani Solar', 'AS540-144', 'cust-01', 'Rajesh Malhotra', '9810123456', 'disp-01', '2026-10-22', 25, '2051-10-22', 'ACTIVE', '2026-10-24']
];

for (const w of warrantyData) {
  insertWarranty.run(...w);
}

// 10. Installation Jobs
const insertJob = db.prepare(`
  INSERT INTO installation_jobs (id, jobCode, orderId, customerId, customerName, customerPhone, siteAddress, capacityKW, systemType, leadTechnicianId, leadTechnicianName, assistantTechnicianIds, scheduledStartDate, scheduledEndDate, actualStartTime, actualFinishTime, stage, checklist, photos, customerSignature, customerRating, customerFeedback, completionReportNumber, commissionedAt, notes, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const jobsData = [
  [
    'job-01', 'JOB-2026-001', 'ord-01', 'cust-01', 'Rajesh Malhotra', '9810123456', 'B-42, South Extension Part II, Delhi', 5, 'ON_GRID',
    'usr-tech-01', 'Manoj Kumar', JSON.stringify(['tech-asst-01', 'tech-asst-02']),
    '2026-10-23', '2026-10-25', '2026-10-23T09:00:00Z', null, 'IN_PROGRESS',
    JSON.stringify({
      structureAnchoringChecked: true,
      panelMountingTightened: true,
      dcPolarityVerified: true,
      dcStringVocVolts: 385,
      inverterWallMounted: true,
      acDcdbInstalled: true,
      earthResistanceOhms: 2.8,
      lightningArresterConnected: true,
      generationTestWatts: 0,
      customerBriefed: false
    }),
    JSON.stringify({
      panelsMountedUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600',
      inverterWiringUrl: 'https://images.unsplash.com/photo-1558441719-8b489c63f7d1?w=600'
    }),
    null, null, null, null, null,
    'Structure mounting and panel clamping completed. DC cabling connected. Awaiting net-meter test certificate from DISCOM.',
    '2026-10-20T10:00:00.000Z', '2026-10-24T16:00:00.000Z'
  ]
];

for (const j of jobsData) {
  insertJob.run(...j);
}

// 11. Service Tickets
const insertTicket = db.prepare(`
  INSERT INTO service_tickets (id, ticketNumber, customerId, customerName, customerPhone, serialNumber, warrantyRecordId, isUnderWarranty, faultCode, faultDescription, priority, status, assignedTechnicianId, assignedTechnicianName, resolutionNotes, resolvedAt, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const ticketsData = [
  ['tkt-01', 'TKT-2026-001', 'cust-01', 'Rajesh Malhotra', '9810123456', 'INV-2026-GW-50912', 'warr-01', 1, 'ERR-029', 'Inverter display shows Error 029 (Grid voltage fluctuation) during peak afternoon hours', 'HIGH', 'ASSIGNED', 'usr-tech-01', 'Manoj Kumar', null, null, '2026-10-26T11:00:00.000Z', '2026-10-26T14:30:00.000Z']
];

for (const t of ticketsData) {
  insertTicket.run(...t);
}

console.log('✅ Database seeded successfully with demo records!');

