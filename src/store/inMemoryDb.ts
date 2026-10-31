// src/store/inMemoryDb.ts
// Central in-memory data store - simulates a database for Phase 1 frontend
// Replace each service function's array with a real API call when backend is ready

import { Customer } from '../types/customer';
import { Survey } from '../types/survey';
import { Quotation, Order, QuotationStatus } from '../types/quotation';
import { InventoryItem, StockMovement } from '../types/inventory';
import {
  DispatchOrder,
  WarrantyRecord,
  ServiceTicket,
  WarrantyStatus,
} from '../types/operations';
import { InstallationJob } from '../types/installation';
import { UserAccount, RoleAuditEntry } from '../types/auth';
import { UserRole } from '../types/roles';
import { calculateBOM } from '../utils/bomCalculator';

// ==========================================
// 1. Customers (8 realistic Indian solar leads/clients)
// ==========================================
export let customers: Customer[] = [
  {
    id: 'cust-01',
    name: 'Rajesh Malhotra',
    phone: '9810123456',
    email: 'rajesh.malhotra@gmail.com',
    address: 'B-42, South Extension Part II',
    city: 'Delhi',
    pincode: '110049',
    monthlyBill: 7200,
    requiredCapacityKW: 5,
    systemType: 'ON_GRID',
    subsidyRequired: true,
    enquirySource: 'WEB_FORM',
    status: 'CONVERTED',
    notes: 'Approved 5 kW On-Grid system. Full rooftop shadow analysis completed. Order confirmed.',
    assignedTo: 'Vikram Mehta',
    createdAt: '2026-09-10T10:30:00.000Z',
    updatedAt: '2026-10-25T16:00:00.000Z',
  },
  {
    id: 'cust-02',
    name: 'Sunita Sharma',
    phone: '9871234567',
    email: 'sunita.sharma@outlook.com',
    address: 'House 142, Sector 14, Urban Estate',
    city: 'Gurugram',
    pincode: '122001',
    monthlyBill: 5800,
    requiredCapacityKW: 4,
    systemType: 'ON_GRID',
    subsidyRequired: true,
    enquirySource: 'WHATSAPP',
    status: 'CONVERTED',
    notes: '4 kW On-Grid setup. 20% advance received. Ready for dispatch.',
    assignedTo: 'Pooja Nair',
    createdAt: '2026-09-18T11:15:00.000Z',
    updatedAt: '2026-10-26T12:00:00.000Z',
  },
  {
    id: 'cust-03',
    name: 'Vikram Singhania',
    phone: '9899123456',
    email: 'vikram.singhania@yahoo.co.in',
    address: 'A-12, Sector 62',
    city: 'Noida',
    pincode: '201301',
    monthlyBill: 4500,
    requiredCapacityKW: 3,
    systemType: 'ON_GRID',
    subsidyRequired: true,
    enquirySource: 'PHONE_CALL',
    status: 'QUOTATION_SENT',
    notes: 'Quotation sent for 3 kW system with PM Surya Ghar subsidy applied. Follow-up scheduled.',
    assignedTo: 'Vikram Mehta',
    createdAt: '2026-10-02T09:45:00.000Z',
    updatedAt: '2026-10-18T15:20:00.000Z',
  },
  {
    id: 'cust-04',
    name: 'Aarav Patel',
    phone: '9820123456',
    email: 'aarav.patel@gmail.com',
    address: 'Villa 18, Silver Oaks, DLF Phase 2',
    city: 'Gurugram',
    pincode: '122002',
    monthlyBill: 7800,
    requiredCapacityKW: 5,
    systemType: 'OFF_GRID',
    subsidyRequired: false,
    enquirySource: 'REFERRAL',
    status: 'QUOTATION_SENT',
    notes: 'Requested 5 kW off-grid solution with 10 kWh lithium storage bank for backup.',
    assignedTo: 'Suresh Patel',
    createdAt: '2026-10-05T14:00:00.000Z',
    updatedAt: '2026-10-22T17:10:00.000Z',
  },
  {
    id: 'cust-05',
    name: 'Priya Saxena',
    phone: '9818987654',
    email: 'priya.saxena@rediffmail.com',
    address: 'Flat 403, Tower B, Shipra Suncity, Indirapuram',
    city: 'Noida',
    pincode: '201014',
    monthlyBill: 3800,
    requiredCapacityKW: 3,
    systemType: 'ON_GRID',
    subsidyRequired: true,
    enquirySource: 'WEB_FORM',
    status: 'SURVEY_SCHEDULED',
    notes: 'Site survey scheduled with technician Amit Rawat.',
    assignedTo: 'Pooja Nair',
    createdAt: '2026-10-20T10:00:00.000Z',
    updatedAt: '2026-10-28T09:30:00.000Z',
  },
  {
    id: 'cust-06',
    name: 'Dr. Ramesh Goel',
    phone: '9873456789',
    email: 'dr.rameshgoel@gmail.com',
    address: 'C-8, Vasant Vihar',
    city: 'Delhi',
    pincode: '110057',
    monthlyBill: 6400,
    requiredCapacityKW: 4,
    systemType: 'ON_GRID',
    subsidyRequired: true,
    enquirySource: 'REFERRAL',
    status: 'SURVEY_SCHEDULED',
    notes: 'Roof survey completed by Amit Rawat; pending engineering manager approval.',
    assignedTo: 'Vikram Mehta',
    createdAt: '2026-10-12T16:30:00.000Z',
    updatedAt: '2026-10-29T11:45:00.000Z',
  },
  {
    id: 'cust-07',
    name: 'Meenakshi Sundaram',
    phone: '9910234567',
    email: 'meenakshi.s@gmail.com',
    address: 'Plot 294, Block C, Sushant Lok Phase 1',
    city: 'Gurugram',
    pincode: '122009',
    monthlyBill: 2900,
    requiredCapacityKW: 2,
    systemType: 'ON_GRID',
    subsidyRequired: true,
    enquirySource: 'WALK_IN',
    status: 'CONTACTED',
    notes: 'Consultation conducted. Customer interested in 2 kW system under rooftop solar scheme.',
    assignedTo: 'Suresh Patel',
    createdAt: '2026-10-27T13:20:00.000Z',
    updatedAt: '2026-10-28T16:00:00.000Z',
  },
  {
    id: 'cust-08',
    name: 'Harish Chawla',
    phone: '9811234567',
    email: 'harish.chawla@gmail.com',
    address: 'Shop 14, Commercial Complex, Sector 18',
    city: 'Noida',
    pincode: '201301',
    monthlyBill: 2200,
    requiredCapacityKW: 1,
    systemType: 'OFF_GRID',
    subsidyRequired: false,
    enquirySource: 'WEB_FORM',
    status: 'NEW',
    notes: 'New lead from portal looking for compact 1 kW emergency backup for retail counter.',
    assignedTo: 'Pooja Nair',
    createdAt: '2026-10-31T08:15:00.000Z',
    updatedAt: '2026-10-31T08:15:00.000Z',
  },
];

// ==========================================
// 2. Surveys (6 surveys linked to customers)
// ==========================================
export let surveys: Survey[] = [
  {
    id: 'surv-01',
    customerId: 'cust-01',
    customerName: 'Rajesh Malhotra',
    address: 'B-42, South Extension Part II, Delhi',
    status: 'APPROVED',
    assignedTechnicianId: 'tech-01',
    assignedTechnicianName: 'Manoj Kumar',
    scheduledDate: '2026-09-15',
    completedDate: '2026-09-15',
    roofType: 'RCC_FLAT',
    totalRoofAreaSqFt: 1100,
    shadowFreeAreaSqFt: 850,
    roofDirection: 'SOUTH',
    tiltAngleDeg: 28,
    acCableDistanceMeters: 18,
    dcCableDistanceMeters: 24,
    gridConnectionSuitable: true,
    gridConnectionNotes: '3-phase 10kW connection verified with BSES Rajdhani bidirectional meter position.',
    structureFeasible: true,
    recommendedCapacityKW: 5,
    surveyNotes: 'Excellent south-facing flat RCC roof. No chimney or tree shadow issues. Standard elevated mounting feasible.',
    approvedBy: 'Rajiv Sharma (Chief Engineer)',
    approvalNotes: 'Approved for 5 kW Mono PERC installation.',
    createdAt: '2026-09-12T10:00:00.000Z',
    updatedAt: '2026-09-16T14:30:00.000Z',
  },
  {
    id: 'surv-02',
    customerId: 'cust-02',
    customerName: 'Sunita Sharma',
    address: 'House 142, Sector 14, Urban Estate, Gurugram',
    status: 'APPROVED',
    assignedTechnicianId: 'tech-02',
    assignedTechnicianName: 'Deepak Joshi',
    scheduledDate: '2026-09-22',
    completedDate: '2026-09-22',
    roofType: 'RCC_FLAT',
    totalRoofAreaSqFt: 850,
    shadowFreeAreaSqFt: 680,
    roofDirection: 'SOUTH',
    tiltAngleDeg: 26,
    acCableDistanceMeters: 14,
    dcCableDistanceMeters: 20,
    gridConnectionSuitable: true,
    gridConnectionNotes: 'DHBVN net-metering feasible. Existing sanctioned domestic load is 6 kW.',
    structureFeasible: true,
    recommendedCapacityKW: 4,
    surveyNotes: 'Rooftop slab is structurally strong. Parapet wall height is 3 ft. Recommended 4 kW array.',
    approvedBy: 'Rajiv Sharma (Chief Engineer)',
    approvalNotes: 'Approved with standard ballasted/grouted structure.',
    createdAt: '2026-09-19T09:00:00.000Z',
    updatedAt: '2026-09-23T11:00:00.000Z',
  },
  {
    id: 'surv-03',
    customerId: 'cust-03',
    customerName: 'Vikram Singhania',
    address: 'A-12, Sector 62, Noida',
    status: 'APPROVED',
    assignedTechnicianId: 'tech-03',
    assignedTechnicianName: 'Amit Rawat',
    scheduledDate: '2026-10-08',
    completedDate: '2026-10-08',
    roofType: 'RCC_FLAT',
    totalRoofAreaSqFt: 650,
    shadowFreeAreaSqFt: 520,
    roofDirection: 'SOUTH_EAST',
    tiltAngleDeg: 25,
    acCableDistanceMeters: 16,
    dcCableDistanceMeters: 22,
    gridConnectionSuitable: true,
    gridConnectionNotes: 'PVVNL distribution line close. Main distribution board on 2nd floor.',
    structureFeasible: true,
    recommendedCapacityKW: 3,
    surveyNotes: 'Mumty on north side causes zero shadow on proposed array placement. 3 kW system ideal.',
    approvedBy: 'Rajiv Sharma (Chief Engineer)',
    approvalNotes: 'Engineering drawings validated. Quotation cleared.',
    createdAt: '2026-10-04T12:00:00.000Z',
    updatedAt: '2026-10-09T16:45:00.000Z',
  },
  {
    id: 'surv-04',
    customerId: 'cust-04',
    customerName: 'Aarav Patel',
    address: 'Villa 18, Silver Oaks, DLF Phase 2, Gurugram',
    status: 'APPROVED',
    assignedTechnicianId: 'tech-05',
    assignedTechnicianName: 'Rohit Verma',
    scheduledDate: '2026-10-12',
    completedDate: '2026-10-12',
    roofType: 'RCC_SLOPED',
    totalRoofAreaSqFt: 1200,
    shadowFreeAreaSqFt: 950,
    roofDirection: 'SOUTH',
    tiltAngleDeg: 22,
    acCableDistanceMeters: 25,
    dcCableDistanceMeters: 30,
    gridConnectionSuitable: false,
    gridConnectionNotes: 'Customer requested 100% off-grid hybrid setup; grid export not required.',
    structureFeasible: true,
    recommendedCapacityKW: 5,
    surveyNotes: 'Sloped roof with ceramic tiles. Special penetration-free tile bracket mounts required.',
    approvedBy: 'Rajiv Sharma (Chief Engineer)',
    approvalNotes: 'Approved. Special roof brackets added to BOM.',
    createdAt: '2026-10-07T11:30:00.000Z',
    updatedAt: '2026-10-13T10:15:00.000Z',
  },
  {
    id: 'surv-05',
    customerId: 'cust-06',
    customerName: 'Dr. Ramesh Goel',
    address: 'C-8, Vasant Vihar, Delhi',
    status: 'COMPLETED',
    assignedTechnicianId: 'tech-03',
    assignedTechnicianName: 'Amit Rawat',
    scheduledDate: '2026-10-28',
    completedDate: '2026-10-28',
    roofType: 'RCC_FLAT',
    totalRoofAreaSqFt: 900,
    shadowFreeAreaSqFt: 720,
    roofDirection: 'SOUTH_WEST',
    tiltAngleDeg: 27,
    acCableDistanceMeters: 20,
    dcCableDistanceMeters: 28,
    gridConnectionSuitable: true,
    gridConnectionNotes: 'BSES connection verified. Inverter location selected near mumty stairwell.',
    structureFeasible: true,
    recommendedCapacityKW: 4,
    surveyNotes: 'Survey completed on site. Slight shade from water tank tower between 4:30 PM - 5:30 PM.',
    createdAt: '2026-10-24T14:00:00.000Z',
    updatedAt: '2026-10-28T18:00:00.000Z',
  },
  {
    id: 'surv-06',
    customerId: 'cust-05',
    customerName: 'Priya Saxena',
    address: 'Flat 403, Tower B, Shipra Suncity, Indirapuram, Noida',
    status: 'PENDING',
    assignedTechnicianId: 'tech-03',
    assignedTechnicianName: 'Amit Rawat',
    scheduledDate: '2026-11-01',
    roofType: 'RCC_FLAT',
    totalRoofAreaSqFt: 550,
    shadowFreeAreaSqFt: 420,
    roofDirection: 'FLAT',
    tiltAngleDeg: 25,
    acCableDistanceMeters: 15,
    dcCableDistanceMeters: 18,
    gridConnectionSuitable: true,
    gridConnectionNotes: 'Preliminary review indicates single phase meter. Pending physical site check.',
    structureFeasible: true,
    recommendedCapacityKW: 3,
    surveyNotes: 'Pending on-site measurement and society NOC verification.',
    createdAt: '2026-10-28T10:00:00.000Z',
    updatedAt: '2026-10-28T10:00:00.000Z',
  },
];

// Helper to construct Quotations with real calculated BOM items
function createQuotation(
  id: string,
  quotationNumber: string,
  customerId: string,
  customerName: string,
  capacityKW: number,
  systemType: 'ON_GRID' | 'OFF_GRID',
  status: QuotationStatus,
  subsidyAmount: number,
  discountAmount: number,
  advancePaid: number,
  validUntil: string,
  notes: string,
  createdAt: string,
  updatedAt: string,
  surveyId?: string
): Quotation {
  const bomItems = calculateBOM(capacityKW, systemType);
  const subtotal = bomItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const gstPercent = 12;
  const gstAmount = Math.round((subtotal * gstPercent) / 100);
  const totalAmount = subtotal + gstAmount - subsidyAmount - discountAmount;
  const balanceAmount = totalAmount - advancePaid;

  return {
    id,
    quotationNumber,
    customerId,
    customerName,
    surveyId,
    capacityKW,
    systemType,
    bomItems,
    subtotal,
    gstPercent,
    gstAmount,
    subsidyAmount,
    discountAmount,
    totalAmount,
    advancePaid,
    balanceAmount,
    status,
    validUntil,
    notes,
    termsConditions:
      '1. 25-year performance warranty on solar panels.\n2. 5-year warranty on solar inverter.\n3. Net metering approvals subject to State DISCOM timelines.\n4. Payment terms: 20% advance with order, 70% before dispatch, 10% on commissioning.',
    createdBy: 'Vikram Mehta (Senior Solar Consultant)',
    createdAt,
    updatedAt,
  };
}

// ==========================================
// 3. Quotations (4 quotations in different states)
// ==========================================
export let quotations: Quotation[] = [
  createQuotation(
    'quot-101',
    'QUOT-2026-001',
    'cust-01',
    'Rajesh Malhotra',
    5,
    'ON_GRID',
    'CONVERTED_TO_ORDER',
    78000, // PM Surya Ghar subsidy
    5000,
    55000,
    '2026-10-31',
    'Converted to confirmed order ORD-2026-001. Dispatch scheduled.',
    '2026-09-17T11:00:00.000Z',
    '2026-10-20T15:30:00.000Z',
    'surv-01'
  ),
  createQuotation(
    'quot-102',
    'QUOT-2026-002',
    'cust-02',
    'Sunita Sharma',
    4,
    'ON_GRID',
    'APPROVED',
    78000, // PM Surya Ghar subsidy
    4000,
    45000,
    '2026-11-15',
    'Customer approved proposal. Advance cheque received and verified.',
    '2026-09-24T14:00:00.000Z',
    '2026-10-24T18:00:00.000Z',
    'surv-02'
  ),
  createQuotation(
    'quot-103',
    'QUOT-2026-003',
    'cust-03',
    'Vikram Singhania',
    3,
    'ON_GRID',
    'SENT',
    78000,
    3000,
    0,
    '2026-11-10',
    'Sent via email and WhatsApp. Follow up with customer this Saturday.',
    '2026-10-10T16:00:00.000Z',
    '2026-10-18T10:30:00.000Z',
    'surv-03'
  ),
  createQuotation(
    'quot-104',
    'QUOT-2026-004',
    'cust-04',
    'Aarav Patel',
    5,
    'OFF_GRID',
    'DRAFT',
    0, // Off-grid systems not covered under rooftop on-grid subsidy
    8000,
    0,
    '2026-11-20',
    'Drafting off-grid quotation with 10 kWh lithium battery storage package.',
    '2026-10-14T10:00:00.000Z',
    '2026-10-22T12:00:00.000Z',
    'surv-04'
  ),
];

// ==========================================
// 4. Orders (2 confirmed orders)
// ==========================================
export let orders: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'ORD-2026-001',
    quotationId: 'quot-101',
    customerId: 'cust-01',
    customerName: 'Rajesh Malhotra',
    capacityKW: 5,
    systemType: 'ON_GRID',
    totalAmount: quotations[0].totalAmount,
    advancePaid: quotations[0].advancePaid,
    balanceAmount: quotations[0].balanceAmount,
    status: 'DISPATCHED',
    scheduledInstallationDate: '2026-11-05',
    assignedTechnicianIds: ['tech-01', 'tech-02'],
    createdAt: '2026-10-20T16:00:00.000Z',
    updatedAt: '2026-10-25T10:00:00.000Z',
  },
  {
    id: 'ord-102',
    orderNumber: 'ORD-2026-002',
    quotationId: 'quot-102',
    customerId: 'cust-02',
    customerName: 'Sunita Sharma',
    capacityKW: 4,
    systemType: 'ON_GRID',
    totalAmount: quotations[1].totalAmount,
    advancePaid: quotations[1].advancePaid,
    balanceAmount: quotations[1].balanceAmount,
    status: 'CONFIRMED',
    scheduledInstallationDate: '2026-11-12',
    assignedTechnicianIds: ['tech-03', 'tech-04'],
    createdAt: '2026-10-25T11:00:00.000Z',
    updatedAt: '2026-10-26T14:30:00.000Z',
  },
];

// ==========================================
// 5. Inventory Items (12+ realistic items covering all categories)
// ==========================================
export let inventoryItems: InventoryItem[] = [
  {
    id: 'inv-item-01',
    sku: 'PNL-ADNI-540W',
    name: 'Adani Solar 540W Mono PERC Half-Cut Module',
    brand: 'Adani Solar',
    model: 'AS540-144',
    category: 'SOLAR_PANEL',
    unit: 'Nos',
    currentStock: 480,
    lowStockThreshold: 50,
    unitCostPrice: 14500,
    unitSellingPrice: 17000,
    hasSerialNumbers: true,
    warrantyYears: 25,
    specifications: '540W Mono PERC, 144 half-cells, 21.3% module efficiency, IP68 junction box',
    location: 'Warehouse Bay A1-P4',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-10-25T10:00:00.000Z',
  },
  {
    id: 'inv-item-02',
    sku: 'PNL-TATA-545W',
    name: 'Tata Power 545W Bifacial Dual-Glass Solar Panel',
    brand: 'Tata Power Solar',
    model: 'TP545-BF',
    category: 'SOLAR_PANEL',
    unit: 'Nos',
    currentStock: 120,
    lowStockThreshold: 30,
    unitCostPrice: 15200,
    unitSellingPrice: 18000,
    hasSerialNumbers: true,
    warrantyYears: 25,
    specifications: '545W Bifacial Mono PERC, up to 25% rear gain, 30-year linear power warranty',
    location: 'Warehouse Bay A2-P1',
    createdAt: '2026-02-10T08:00:00.000Z',
    updatedAt: '2026-10-20T09:00:00.000Z',
  },
  {
    id: 'inv-item-03',
    sku: 'INV-GWTT-5KW',
    name: 'Growatt MIN 5000TL-X 5kW Single-Phase On-Grid Inverter',
    brand: 'Growatt',
    model: 'MIN 5000TL-X',
    category: 'INVERTER',
    unit: 'Nos',
    currentStock: 24,
    lowStockThreshold: 5,
    unitCostPrice: 36000,
    unitSellingPrice: 44000,
    hasSerialNumbers: true,
    warrantyYears: 5,
    specifications: '5 kW Single Phase, Dual MPPT, 98.4% max efficiency, built-in DC switch & Wi-Fi',
    location: 'Electronics Shelf E1',
    createdAt: '2026-01-20T08:00:00.000Z',
    updatedAt: '2026-10-25T10:00:00.000Z',
  },
  {
    id: 'inv-item-04',
    sku: 'INV-SOLIS-3KW',
    name: 'Solis S6-GR1P3K 3kW Dual MPPT On-Grid Inverter',
    brand: 'Solis',
    model: 'S6-GR1P3K',
    category: 'INVERTER',
    unit: 'Nos',
    currentStock: 18,
    lowStockThreshold: 4,
    unitCostPrice: 23500,
    unitSellingPrice: 28500,
    hasSerialNumbers: true,
    warrantyYears: 5,
    specifications: '3 kW Single Phase, AFCI protection, IP66 enclosure, Wi-Fi datalogger',
    location: 'Electronics Shelf E2',
    createdAt: '2026-02-01T08:00:00.000Z',
    updatedAt: '2026-10-26T11:00:00.000Z',
  },
  {
    id: 'inv-item-05',
    sku: 'BAT-PVL-48V',
    name: 'Livguard Solar 48V 100Ah Lithium LiFePO4 Battery Bank',
    brand: 'Livguard',
    model: 'LG-LFP48100',
    category: 'BATTERY',
    unit: 'Set',
    currentStock: 14,
    lowStockThreshold: 3,
    unitCostPrice: 78000,
    unitSellingPrice: 96000,
    hasSerialNumbers: true,
    warrantyYears: 5,
    specifications: '4.8 kWh 48V 100Ah LiFePO4 chemistry, 6000+ cycle life, built-in smart BMS & CAN/RS485',
    location: 'Battery Vault B-02',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-10-24T12:00:00.000Z',
  },
  {
    id: 'inv-item-06',
    sku: 'BAT-LUM-150AH',
    name: 'Luminous Solarverter 12V 150Ah Tall Tubular C10 Battery',
    brand: 'Luminous',
    model: 'LPTT12150',
    category: 'BATTERY',
    unit: 'Nos',
    currentStock: 28,
    lowStockThreshold: 6,
    unitCostPrice: 11500,
    unitSellingPrice: 14000,
    hasSerialNumbers: true,
    warrantyYears: 3,
    specifications: '12V 150Ah @ C10 rating, heavy duty tubular plates, low maintenance electrolyte level indicator',
    location: 'Battery Vault B-01',
    createdAt: '2026-03-05T08:00:00.000Z',
    updatedAt: '2026-10-18T14:00:00.000Z',
  },
  {
    id: 'inv-item-07',
    sku: 'CC-SRNE-60A',
    name: 'SRNE 60A 12V/24V/48V Auto MPPT Charge Controller',
    brand: 'SRNE',
    model: 'ML4860',
    category: 'CHARGE_CONTROLLER',
    unit: 'Nos',
    currentStock: 22,
    lowStockThreshold: 5,
    unitCostPrice: 6800,
    unitSellingPrice: 8500,
    hasSerialNumbers: true,
    warrantyYears: 2,
    specifications: '60A continuous charging current, 150V Max PV Voc, 99.9% MPPT tracking efficiency',
    location: 'Electronics Shelf E3',
    createdAt: '2026-03-12T08:00:00.000Z',
    updatedAt: '2026-10-15T15:00:00.000Z',
  },
  {
    id: 'inv-item-08',
    sku: 'MNT-GI-STR',
    name: 'Hot-Dip Galvanised (GI) Rooftop Mounting Structure Kit',
    brand: 'Pennar Solar',
    model: 'PS-MNT-80MICRON',
    category: 'MOUNTING_STRUCTURE',
    unit: 'Set',
    currentStock: 75,
    lowStockThreshold: 15,
    unitCostPrice: 2200,
    unitSellingPrice: 2800,
    hasSerialNumbers: false,
    warrantyYears: 10,
    specifications: '80 micron hot-dip galvanised steel, rated for 150 km/h wind speed, SS304 fasteners',
    location: 'Yard Bay Y-1',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-10-25T10:00:00.000Z',
  },
  {
    id: 'inv-item-09',
    sku: 'WIR-DC-4SQMM',
    name: 'Polycab 4 sq mm Single-Core Solar DC Cable (Tinned Copper)',
    brand: 'Polycab',
    model: 'POL-SOL-4MM',
    category: 'DC_WIRE',
    unit: 'Meters',
    currentStock: 1850,
    lowStockThreshold: 300,
    unitCostPrice: 26,
    unitSellingPrice: 35,
    hasSerialNumbers: false,
    warrantyYears: 25,
    specifications: 'TUV approved EN 50618 cross-linked polyolefin insulation, UV & ozone resistant, 1500V DC',
    location: 'Cable Spool Rack C1',
    createdAt: '2026-01-05T08:00:00.000Z',
    updatedAt: '2026-10-26T16:00:00.000Z',
  },
  {
    id: 'inv-item-10',
    sku: 'WIR-AC-6SQMM',
    name: 'Havells 6 sq mm 3-Core Copper Armoured AC Power Cable',
    brand: 'Havells',
    model: 'HAV-AC-6MM3C',
    category: 'AC_WIRE',
    unit: 'Meters',
    currentStock: 820,
    lowStockThreshold: 150,
    unitCostPrice: 42,
    unitSellingPrice: 55,
    hasSerialNumbers: false,
    warrantyYears: 10,
    specifications: '1100V grade PVC insulated annealed copper conductor, GI wire armoured, IS 1554 Part 1',
    location: 'Cable Spool Rack C2',
    createdAt: '2026-01-08T08:00:00.000Z',
    updatedAt: '2026-10-20T17:00:00.000Z',
  },
  {
    id: 'inv-item-11',
    sku: 'CON-MC4-PAIR',
    name: 'Staubli Original MC4 Solar Cable Connectors (Male/Female Pair)',
    brand: 'Staubli',
    model: 'MC4-EVO2',
    category: 'CONNECTOR',
    unit: 'Nos',
    currentStock: 640,
    lowStockThreshold: 100,
    unitCostPrice: 85,
    unitSellingPrice: 120,
    hasSerialNumbers: false,
    warrantyYears: 5,
    specifications: 'Original Staubli MC4 connector pair, IP68 rated, 1500V DC 45A, snap-in locking',
    location: 'Hardware Bin H-12',
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-10-25T10:00:00.000Z',
  },
  {
    id: 'inv-item-12',
    sku: 'SWG-ACDB-DCDB',
    name: 'ACDB & DCDB Distribution Box with 32A MCB & Type II SPD',
    brand: 'Schneider Electric',
    model: 'SE-SOL-DB32',
    category: 'SWITCHGEAR',
    unit: 'Nos',
    currentStock: 35,
    lowStockThreshold: 8,
    unitCostPrice: 3800,
    unitSellingPrice: 5000,
    hasSerialNumbers: false,
    warrantyYears: 2,
    specifications: 'IP65 polycarbonate enclosure with 32A 1000V DC MCB, 40kA DC SPD, AC MCB & AC SPD',
    location: 'Switchgear Shelf S1',
    createdAt: '2026-01-18T08:00:00.000Z',
    updatedAt: '2026-10-24T14:00:00.000Z',
  },
  {
    id: 'inv-item-13',
    sku: 'SAF-EARTH-KIT',
    name: 'Chemical Earthing Kit with 14mm x 2m Copper Bonded Rod & Compound',
    brand: 'TruePower',
    model: 'TP-EARTH-2M',
    category: 'EARTHING',
    unit: 'Set',
    currentStock: 42,
    lowStockThreshold: 10,
    unitCostPrice: 2600,
    unitSellingPrice: 3500,
    hasSerialNumbers: false,
    warrantyYears: 5,
    specifications: '250 micron copper bonded steel rod with 25kg carbon-based earth enhancing backfill compound',
    location: 'Yard Bay Y-2',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-10-25T10:00:00.000Z',
  },
];

// ==========================================
// 6. Stock Movements (10 movements)
// ==========================================
export let stockMovements: StockMovement[] = [
  {
    id: 'sm-01',
    inventoryItemId: 'inv-item-01',
    itemName: 'Adani Solar 540W Mono PERC Half-Cut Module',
    movementType: 'INWARD',
    quantity: 100,
    reason: 'Bulk shipment received from Adani Solar Mundra plant',
    reference: 'PO-2026-089',
    performedBy: 'Suresh Patel (Store Manager)',
    createdAt: '2026-10-10T11:00:00.000Z',
  },
  {
    id: 'sm-02',
    inventoryItemId: 'inv-item-03',
    itemName: 'Growatt MIN 5000TL-X 5kW Single-Phase On-Grid Inverter',
    movementType: 'INWARD',
    quantity: 15,
    reason: 'Monthly inventory replenishment from Growatt India distributor',
    reference: 'PO-2026-091',
    performedBy: 'Suresh Patel (Store Manager)',
    createdAt: '2026-10-14T14:30:00.000Z',
  },
  {
    id: 'sm-03',
    inventoryItemId: 'inv-item-01',
    itemName: 'Adani Solar 540W Mono PERC Half-Cut Module',
    movementType: 'OUTWARD',
    quantity: 10,
    reason: 'Dispatched for installation at Rajesh Malhotra site',
    reference: 'DISP-2026-001',
    performedBy: 'Vikas Singh (Warehouse Lead)',
    createdAt: '2026-10-25T09:30:00.000Z',
  },
  {
    id: 'sm-04',
    inventoryItemId: 'inv-item-03',
    itemName: 'Growatt MIN 5000TL-X 5kW Single-Phase On-Grid Inverter',
    movementType: 'OUTWARD',
    quantity: 1,
    reason: 'Dispatched for installation at Rajesh Malhotra site',
    reference: 'DISP-2026-001',
    performedBy: 'Vikas Singh (Warehouse Lead)',
    createdAt: '2026-10-25T09:30:00.000Z',
  },
  {
    id: 'sm-05',
    inventoryItemId: 'inv-item-01',
    itemName: 'Adani Solar 540W Mono PERC Half-Cut Module',
    movementType: 'OUTWARD',
    quantity: 8,
    reason: 'Allocated for Sunita Sharma Gurugram site dispatch',
    reference: 'DISP-2026-002',
    performedBy: 'Vikas Singh (Warehouse Lead)',
    createdAt: '2026-10-26T10:00:00.000Z',
  },
  {
    id: 'sm-06',
    inventoryItemId: 'inv-item-04',
    itemName: 'Solis S6-GR1P3K 3kW Dual MPPT On-Grid Inverter',
    movementType: 'OUTWARD',
    quantity: 1,
    reason: 'Allocated for Sunita Sharma Gurugram site dispatch',
    reference: 'DISP-2026-002',
    performedBy: 'Vikas Singh (Warehouse Lead)',
    createdAt: '2026-10-26T10:00:00.000Z',
  },
  {
    id: 'sm-07',
    inventoryItemId: 'inv-item-09',
    itemName: 'Polycab 4 sq mm Single-Core Solar DC Cable (Tinned Copper)',
    movementType: 'INWARD',
    quantity: 500,
    reason: 'Spool shipment received from Polycab Electricals',
    reference: 'PO-2026-094',
    performedBy: 'Suresh Patel (Store Manager)',
    createdAt: '2026-10-22T16:00:00.000Z',
  },
  {
    id: 'sm-08',
    inventoryItemId: 'inv-item-09',
    itemName: 'Polycab 4 sq mm Single-Core Solar DC Cable (Tinned Copper)',
    movementType: 'ADJUSTMENT',
    quantity: -12,
    reason: 'Quarterly audit trim wastage and spool end reconciliation',
    reference: 'AUDIT-2026-Q3',
    performedBy: 'Harish Rana (Inventory Auditor)',
    createdAt: '2026-10-24T18:00:00.000Z',
  },
  {
    id: 'sm-09',
    inventoryItemId: 'inv-item-04',
    itemName: 'Solis S6-GR1P3K 3kW Dual MPPT On-Grid Inverter',
    movementType: 'RETURN',
    quantity: 1,
    reason: 'OEM warranty replacement received back from Solis service center',
    reference: 'RET-2026-012',
    performedBy: 'Suresh Patel (Store Manager)',
    createdAt: '2026-10-27T11:45:00.000Z',
  },
  {
    id: 'sm-10',
    inventoryItemId: 'inv-item-13',
    itemName: 'Chemical Earthing Kit with 14mm x 2m Copper Bonded Rod & Compound',
    movementType: 'INWARD',
    quantity: 25,
    reason: 'Monthly stocking of grounding materials',
    reference: 'PO-2026-098',
    performedBy: 'Suresh Patel (Store Manager)',
    createdAt: '2026-10-28T15:20:00.000Z',
  },
];

// ==========================================
// 7. Dispatch Orders (2 dispatches with real serial numbers)
// Format: INV-GWTT-24001, BAT-PVL-24001, PNL-ADNI-24001
// ==========================================
export let dispatchOrders: DispatchOrder[] = [
  {
    id: 'disp-01',
    dispatchNumber: 'DISP-2026-001',
    orderId: 'ord-101',
    customerId: 'cust-01',
    customerName: 'Rajesh Malhotra',
    customerAddress: 'B-42, South Extension Part II, Delhi - 110049',
    items: [
      {
        inventoryItemId: 'inv-item-01',
        itemName: 'Adani Solar 540W Mono PERC Half-Cut Module',
        quantity: 10,
        serialNumbers: [
          'PNL-ADNI-24001',
          'PNL-ADNI-24002',
          'PNL-ADNI-24003',
          'PNL-ADNI-24004',
          'PNL-ADNI-24005',
          'PNL-ADNI-24006',
          'PNL-ADNI-24007',
          'PNL-ADNI-24008',
          'PNL-ADNI-24009',
          'PNL-ADNI-24010',
        ],
        warrantyYears: 25,
      },
      {
        inventoryItemId: 'inv-item-03',
        itemName: 'Growatt MIN 5000TL-X 5kW Single-Phase On-Grid Inverter',
        quantity: 1,
        serialNumbers: ['INV-GWTT-24001'],
        warrantyYears: 5,
      },
      {
        inventoryItemId: 'inv-item-08',
        itemName: 'Hot-Dip Galvanised (GI) Rooftop Mounting Structure Kit',
        quantity: 10,
        serialNumbers: [],
        warrantyYears: 10,
      },
    ],
    status: 'DELIVERED',
    vehicleNumber: 'DL 1L AB 4022',
    driverName: 'Ramphal Singh',
    dispatchedAt: '2026-10-25T09:30:00.000Z',
    deliveredAt: '2026-10-25T14:15:00.000Z',
    createdAt: '2026-10-24T15:00:00.000Z',
    updatedAt: '2026-10-25T15:00:00.000Z',
  },
  {
    id: 'disp-02',
    dispatchNumber: 'DISP-2026-002',
    orderId: 'ord-102',
    customerId: 'cust-02',
    customerName: 'Sunita Sharma',
    customerAddress: 'House 142, Sector 14, Urban Estate, Gurugram, Haryana - 122001',
    items: [
      {
        inventoryItemId: 'inv-item-01',
        itemName: 'Adani Solar 540W Mono PERC Half-Cut Module',
        quantity: 8,
        serialNumbers: [
          'PNL-ADNI-24011',
          'PNL-ADNI-24012',
          'PNL-ADNI-24013',
          'PNL-ADNI-24014',
          'PNL-ADNI-24015',
          'PNL-ADNI-24016',
          'PNL-ADNI-24017',
          'PNL-ADNI-24018',
        ],
        warrantyYears: 25,
      },
      {
        inventoryItemId: 'inv-item-04',
        itemName: 'Solis S6-GR1P3K 3kW Dual MPPT On-Grid Inverter',
        quantity: 1,
        serialNumbers: ['INV-SOLIS-24002'],
        warrantyYears: 5,
      },
      {
        inventoryItemId: 'inv-item-05',
        itemName: 'Livguard Solar 48V 100Ah Lithium LiFePO4 Battery Bank',
        quantity: 1,
        serialNumbers: ['BAT-PVL-24001'],
        warrantyYears: 5,
      },
    ],
    status: 'READY',
    vehicleNumber: 'HR 26 DQ 8819',
    driverName: 'Kuldeep Yadav',
    dispatchedAt: '2026-10-30T08:00:00.000Z',
    createdAt: '2026-10-26T12:00:00.000Z',
    updatedAt: '2026-10-29T17:30:00.000Z',
  },
];

// Helper to compute warranty expiry date and dynamic status
export function computeWarrantyExpiryAndStatus(
  dispatchDateStr: string,
  warrantyYears: number
): { warrantyExpiryDate: string; status: WarrantyStatus } {
  const dispatchDate = new Date(dispatchDateStr);
  const expiryDate = new Date(dispatchDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + warrantyYears);

  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let status: WarrantyStatus = 'ACTIVE';
  if (diffDays <= 0) {
    status = 'EXPIRED';
  } else if (diffDays <= 30) {
    status = 'EXPIRING_SOON';
  } else {
    status = 'ACTIVE';
  }

  return {
    warrantyExpiryDate: expiryDate.toISOString().split('T')[0],
    status,
  };
}

// Generate dynamic dispatch dates relative to current date to guarantee exact ACTIVE, EXPIRING_SOON, EXPIRED states
const nowTime = Date.now();
const oneDayMs = 24 * 60 * 60 * 1000;

// Record 4: EXPIRING_SOON (expires in 18 days with 1-year warranty)
const expiringSoonExpiryTime = nowTime + 18 * oneDayMs;
const expiringSoonDispatchDate = new Date(expiringSoonExpiryTime);
expiringSoonDispatchDate.setFullYear(expiringSoonDispatchDate.getFullYear() - 1);
const expiringSoonDispatchStr = expiringSoonDispatchDate.toISOString().split('T')[0];

// Record 5: EXPIRED (expired 45 days ago with 1-year warranty)
const expiredExpiryTime = nowTime - 45 * oneDayMs;
const expiredDispatchDate = new Date(expiredExpiryTime);
expiredDispatchDate.setFullYear(expiredDispatchDate.getFullYear() - 1);
const expiredDispatchStr = expiredDispatchDate.toISOString().split('T')[0];

// ==========================================
// 8. Warranty Records (5 warranty records - calculated dynamically)
// ==========================================
export let warrantyRecords: WarrantyRecord[] = [
  // 1. ACTIVE - Inverter
  (() => {
    const dispatchDate = '2026-05-15';
    const warrantyYears = 5;
    const { warrantyExpiryDate, status } = computeWarrantyExpiryAndStatus(
      dispatchDate,
      warrantyYears
    );
    return {
      id: 'warr-01',
      serialNumber: 'INV-GWTT-24001',
      inventoryItemId: 'inv-item-03',
      itemName: 'Growatt MIN 5000TL-X 5kW Single-Phase On-Grid Inverter',
      itemCategory: 'INVERTER',
      brand: 'Growatt',
      model: 'MIN 5000TL-X',
      customerId: 'cust-01',
      customerName: 'Rajesh Malhotra',
      customerPhone: '9810123456',
      dispatchOrderId: 'disp-01',
      dispatchDate,
      warrantyYears,
      warrantyExpiryDate,
      status,
      installationDate: '2026-05-18',
    };
  })(),

  // 2. ACTIVE - Solar Panel
  (() => {
    const dispatchDate = '2026-05-15';
    const warrantyYears = 25;
    const { warrantyExpiryDate, status } = computeWarrantyExpiryAndStatus(
      dispatchDate,
      warrantyYears
    );
    return {
      id: 'warr-02',
      serialNumber: 'PNL-ADNI-24001',
      inventoryItemId: 'inv-item-01',
      itemName: 'Adani Solar 540W Mono PERC Half-Cut Module',
      itemCategory: 'SOLAR_PANEL',
      brand: 'Adani Solar',
      model: 'AS540-144',
      customerId: 'cust-01',
      customerName: 'Rajesh Malhotra',
      customerPhone: '9810123456',
      dispatchOrderId: 'disp-01',
      dispatchDate,
      warrantyYears,
      warrantyExpiryDate,
      status,
      installationDate: '2026-05-18',
    };
  })(),

  // 3. ACTIVE - Battery
  (() => {
    const dispatchDate = '2026-08-10';
    const warrantyYears = 5;
    const { warrantyExpiryDate, status } = computeWarrantyExpiryAndStatus(
      dispatchDate,
      warrantyYears
    );
    return {
      id: 'warr-03',
      serialNumber: 'BAT-PVL-24001',
      inventoryItemId: 'inv-item-05',
      itemName: 'Livguard Solar 48V 100Ah Lithium LiFePO4 Battery Bank',
      itemCategory: 'BATTERY',
      brand: 'Livguard',
      model: 'LG-LFP48100',
      customerId: 'cust-02',
      customerName: 'Sunita Sharma',
      customerPhone: '9871234567',
      dispatchOrderId: 'disp-02',
      dispatchDate,
      warrantyYears,
      warrantyExpiryDate,
      status,
      installationDate: '2026-08-14',
    };
  })(),

  // 4. EXPIRING_SOON - Expiry within 30 days
  (() => {
    const dispatchDate = expiringSoonDispatchStr;
    const warrantyYears = 1;
    const { warrantyExpiryDate, status } = computeWarrantyExpiryAndStatus(
      dispatchDate,
      warrantyYears
    );
    return {
      id: 'warr-04',
      serialNumber: 'INV-SOLIS-23049',
      inventoryItemId: 'inv-item-04',
      itemName: 'Solis S6-GR1P3K 3kW Dual MPPT On-Grid Inverter',
      itemCategory: 'INVERTER',
      brand: 'Solis',
      model: 'S6-GR1P3K',
      customerId: 'cust-05',
      customerName: 'Priya Saxena',
      customerPhone: '9818987654',
      dispatchOrderId: 'disp-00-hist-04',
      dispatchDate,
      warrantyYears,
      warrantyExpiryDate,
      status,
      installationDate: dispatchDate,
    };
  })(),

  // 5. EXPIRED - Expiry in the past
  (() => {
    const dispatchDate = expiredDispatchStr;
    const warrantyYears = 1;
    const { warrantyExpiryDate, status } = computeWarrantyExpiryAndStatus(
      dispatchDate,
      warrantyYears
    );
    return {
      id: 'warr-05',
      serialNumber: 'INV-GWTT-21008',
      inventoryItemId: 'inv-item-03',
      itemName: 'Growatt MIN 3000TL-X 3kW Inverter',
      itemCategory: 'INVERTER',
      brand: 'Growatt',
      model: 'MIN 3000TL-X',
      customerId: 'cust-06',
      customerName: 'Dr. Ramesh Goel',
      customerPhone: '9873456789',
      dispatchOrderId: 'disp-00-hist-01',
      dispatchDate,
      warrantyYears,
      warrantyExpiryDate,
      status,
      installationDate: dispatchDate,
    };
  })(),
];

// ==========================================
// 9. Service Tickets (5 tickets with fault codes E04, E07, etc.)
// ==========================================
export let serviceTickets: ServiceTicket[] = [
  {
    id: 'tkt-01',
    ticketNumber: 'TCK-2026-001',
    customerId: 'cust-05',
    customerName: 'Priya Saxena',
    customerPhone: '9818987654',
    serialNumber: 'INV-SOLIS-23049',
    warrantyRecordId: 'warr-04',
    isUnderWarranty: true,
    faultCode: 'E04',
    faultDescription:
      'Inverter trips daily between 1:00 PM and 2:30 PM with Error Code E04 (Grid Overvoltage). Grid AC voltage surges above 258V.',
    priority: 'CRITICAL',
    status: 'IN_PROGRESS',
    assignedTechnicianId: 'tech-09',
    assignedTechnicianName: 'Gaurav Bisht',
    partsUsed: [],
    labourCost: 0,
    totalBillAmount: 0,
    resolutionNotes: 'Technician on field testing grid tap change settings and inverter upper voltage threshold.',
    createdAt: '2026-10-30T09:30:00.000Z',
    updatedAt: '2026-10-31T09:00:00.000Z',
  },
  {
    id: 'tkt-02',
    ticketNumber: 'TCK-2026-002',
    customerId: 'cust-01',
    customerName: 'Rajesh Malhotra',
    customerPhone: '9810123456',
    serialNumber: 'INV-GWTT-24001',
    warrantyRecordId: 'warr-01',
    isUnderWarranty: true,
    faultCode: 'E07',
    faultDescription:
      'Inverter displaying Error E07 (DC Ground Insulation Fault) following heavy rain. PV string insulation impedance under 50k Ohm.',
    priority: 'HIGH',
    status: 'OPEN',
    assignedTechnicianId: 'tech-01',
    assignedTechnicianName: 'Manoj Kumar',
    partsUsed: [],
    labourCost: 0,
    totalBillAmount: 0,
    createdAt: '2026-10-31T07:45:00.000Z',
    updatedAt: '2026-10-31T08:00:00.000Z',
  },
  {
    id: 'tkt-03',
    ticketNumber: 'TCK-2026-003',
    customerId: 'cust-02',
    customerName: 'Sunita Sharma',
    customerPhone: '9871234567',
    serialNumber: 'BAT-PVL-24001',
    warrantyRecordId: 'warr-03',
    isUnderWarranty: true,
    faultCode: 'COMM-01',
    faultDescription:
      'Smart BMS Wi-Fi datalogger dongle disconnected. Customer mobile app not showing battery state of charge (SOC).',
    priority: 'MEDIUM',
    status: 'ASSIGNED',
    assignedTechnicianId: 'tech-02',
    assignedTechnicianName: 'Deepak Joshi',
    partsUsed: [],
    labourCost: 0,
    totalBillAmount: 0,
    createdAt: '2026-10-29T14:10:00.000Z',
    updatedAt: '2026-10-30T11:20:00.000Z',
  },
  {
    id: 'tkt-04',
    ticketNumber: 'TCK-2026-004',
    customerId: 'cust-06',
    customerName: 'Dr. Ramesh Goel',
    customerPhone: '9873456789',
    serialNumber: 'INV-GWTT-21008',
    warrantyRecordId: 'warr-05',
    isUnderWarranty: false,
    faultCode: 'E02',
    faultDescription:
      'Lightning surge triggered DC SPD blown indicator. System shut down safely on PV overvoltage protection.',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    assignedTechnicianId: 'tech-03',
    assignedTechnicianName: 'Amit Rawat',
    partsUsed: [
      { name: '1000V DC SPD Replacement Cartridge (Type II)', cost: 2400 },
      { name: 'Replacement 1000V 15A Solar DC Fuses (Pair)', cost: 600 },
    ],
    labourCost: 800,
    totalBillAmount: 3800,
    resolutionNotes:
      'Replaced blown DC SPD cartridge and string fuses. Measured open circuit voltage Voc at 378V DC. System resumed power generation at 3.8 kW.',
    customerConfirmedAt: '2026-10-28T16:45:00.000Z',
    createdAt: '2026-10-27T10:00:00.000Z',
    updatedAt: '2026-10-28T17:00:00.000Z',
  },
  {
    id: 'tkt-05',
    ticketNumber: 'TCK-2026-005',
    customerId: 'cust-04',
    customerName: 'Aarav Patel',
    customerPhone: '9820123456',
    isUnderWarranty: true,
    faultCode: 'E09',
    faultDescription:
      'Inverter thermal throttling warning E09 during afternoon peak. Cooling heatsink accumulation observed.',
    priority: 'LOW',
    status: 'CLOSED',
    assignedTechnicianId: 'tech-02',
    assignedTechnicianName: 'Deepak Joshi',
    partsUsed: [],
    labourCost: 0,
    totalBillAmount: 0,
    resolutionNotes:
      'Cleaned external heatsink and air vents. Verified internal temperature stabilized at 46°C under full 5 kW generation load.',
    customerConfirmedAt: '2026-10-26T15:30:00.000Z',
    createdAt: '2026-10-25T11:00:00.000Z',
    updatedAt: '2026-10-26T16:00:00.000Z',
  },
];

// ==========================================
// Helper Mutation Functions
// ==========================================

export function addCustomer(
  c:
    | Customer
    | (Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> &
        Partial<Pick<Customer, 'id' | 'createdAt' | 'updatedAt'>>)
): Customer {
  const customer: Customer = {
    id: c.id || `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: c.createdAt || new Date().toISOString(),
    updatedAt: c.updatedAt || new Date().toISOString(),
    ...c,
  } as Customer;
  customers.unshift(customer);
  persistDb();
  return customer;
}

export function updateCustomer(id: string, data: Partial<Customer>): Customer {
  const index = customers.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new Error(`Customer with id "${id}" not found`);
  }
  const updated: Customer = {
    ...customers[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  customers[index] = updated;
  persistDb();
  return updated;
}

export function addSurvey(
  s:
    | Survey
    | (Omit<Survey, 'id' | 'createdAt' | 'updatedAt'> &
        Partial<Pick<Survey, 'id' | 'createdAt' | 'updatedAt'>>)
): Survey {
  const survey: Survey = {
    id: s.id || `surv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: s.createdAt || new Date().toISOString(),
    updatedAt: s.updatedAt || new Date().toISOString(),
    ...s,
  } as Survey;
  surveys.unshift(survey);
  persistDb();
  return survey;
}

export function updateSurvey(id: string, data: Partial<Survey>): Survey {
  const index = surveys.findIndex((s) => s.id === id);
  if (index === -1) {
    throw new Error(`Survey with id "${id}" not found`);
  }
  const updated: Survey = {
    ...surveys[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  surveys[index] = updated;
  persistDb();
  return updated;
}

export function addQuotation(
  q:
    | Quotation
    | (Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'> &
        Partial<Pick<Quotation, 'id' | 'createdAt' | 'updatedAt'>>)
): Quotation {
  const quotation: Quotation = {
    id: q.id || `quot-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: q.createdAt || new Date().toISOString(),
    updatedAt: q.updatedAt || new Date().toISOString(),
    ...q,
  } as Quotation;
  quotations.unshift(quotation);
  persistDb();
  return quotation;
}

export function updateQuotation(
  id: string,
  data: Partial<Quotation>
): Quotation | undefined {
  const index = quotations.findIndex((q) => q.id === id);
  if (index === -1) return undefined;
  const updated: Quotation = {
    ...quotations[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  quotations[index] = updated;
  persistDb();
  return updated;
}

export function addOrder(
  o:
    | Order
    | (Omit<Order, 'id' | 'createdAt' | 'updatedAt'> &
        Partial<Pick<Order, 'id' | 'createdAt' | 'updatedAt'>>)
): Order {
  const order: Order = {
    id: o.id || `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: o.createdAt || new Date().toISOString(),
    updatedAt: o.updatedAt || new Date().toISOString(),
    ...o,
  } as Order;
  orders.unshift(order);
  persistDb();
  return order;
}

export function updateOrder(id: string, data: Partial<Order>): Order {
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) {
    throw new Error(`Order with id "${id}" not found`);
  }
  const updated: Order = {
    ...orders[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  orders[index] = updated;
  persistDb();
  return updated;
}

export function addInventoryItem(
  item:
    | InventoryItem
    | (Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'> &
        Partial<Pick<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>>)
): InventoryItem {
  const inventoryItem: InventoryItem = {
    id: item.id || `inv-item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
    ...item,
  } as InventoryItem;
  inventoryItems.unshift(inventoryItem);
  persistDb();
  return inventoryItem;
}

export function updateInventoryItem(
  id: string,
  data: Partial<InventoryItem>
): InventoryItem {
  const index = inventoryItems.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error(`Inventory item with id "${id}" not found`);
  }
  const updated: InventoryItem = {
    ...inventoryItems[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  inventoryItems[index] = updated;
  persistDb();
  return updated;
}

export function addStockMovement(
  m:
    | StockMovement
    | (Omit<StockMovement, 'id' | 'createdAt'> &
        Partial<Pick<StockMovement, 'id' | 'createdAt'>>)
): StockMovement {
  const movement: StockMovement = {
    id: m.id || `sm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: m.createdAt || new Date().toISOString(),
    ...m,
  } as StockMovement;
  stockMovements.unshift(movement);

  // Automatically update currentStock on the matching inventory item
  const item = inventoryItems.find((i) => i.id === movement.inventoryItemId);
  if (item) {
    if (movement.movementType === 'INWARD' || movement.movementType === 'RETURN') {
      item.currentStock += movement.quantity;
    } else if (movement.movementType === 'OUTWARD') {
      item.currentStock = Math.max(0, item.currentStock - movement.quantity);
    } else if (movement.movementType === 'ADJUSTMENT') {
      item.currentStock = Math.max(0, item.currentStock + movement.quantity);
    }
    item.updatedAt = new Date().toISOString();
  }
  persistDb();
  return movement;
}

export function addDispatchOrder(
  d:
    | DispatchOrder
    | (Omit<DispatchOrder, 'id' | 'createdAt' | 'updatedAt'> &
        Partial<Pick<DispatchOrder, 'id' | 'createdAt' | 'updatedAt'>>)
): DispatchOrder {
  const dispatchOrder: DispatchOrder = {
    id: d.id || `disp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: d.createdAt || new Date().toISOString(),
    updatedAt: d.updatedAt || new Date().toISOString(),
    ...d,
  } as DispatchOrder;
  dispatchOrders.unshift(dispatchOrder);
  persistDb();
  return dispatchOrder;
}

export function updateDispatchOrder(
  id: string,
  data: Partial<DispatchOrder>
): DispatchOrder | undefined {
  const index = dispatchOrders.findIndex((d) => d.id === id);
  if (index === -1) return undefined;
  const updated: DispatchOrder = {
    ...dispatchOrders[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  dispatchOrders[index] = updated;
  persistDb();
  return updated;
}

export function addWarrantyRecord(
  w:
    | WarrantyRecord
    | (Omit<WarrantyRecord, 'id'> & Partial<Pick<WarrantyRecord, 'id'>>)
): WarrantyRecord {
  const record: WarrantyRecord = {
    id: w.id || `warr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...w,
  } as WarrantyRecord;
  warrantyRecords.unshift(record);
  persistDb();
  return record;
}

export function updateWarrantyRecord(
  id: string,
  data: Partial<WarrantyRecord>
): WarrantyRecord {
  const index = warrantyRecords.findIndex((w) => w.id === id);
  if (index === -1) {
    throw new Error(`Warranty record with id "${id}" not found`);
  }
  const updated: WarrantyRecord = {
    ...warrantyRecords[index],
    ...data,
  };
  warrantyRecords[index] = updated;
  persistDb();
  return updated;
}

export function addServiceTicket(
  t:
    | ServiceTicket
    | (Omit<ServiceTicket, 'id' | 'createdAt' | 'updatedAt'> &
        Partial<Pick<ServiceTicket, 'id' | 'createdAt' | 'updatedAt'>>)
): ServiceTicket {
  const ticket: ServiceTicket = {
    id: t.id || `tkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: t.createdAt || new Date().toISOString(),
    updatedAt: t.updatedAt || new Date().toISOString(),
    ...t,
  } as ServiceTicket;
  serviceTickets.unshift(ticket);
  persistDb();
  return ticket;
}

export function updateServiceTicket(
  id: string,
  data: Partial<ServiceTicket>
): ServiceTicket {
  const index = serviceTickets.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error(`Service ticket with id "${id}" not found`);
  }
  const updated: ServiceTicket = {
    ...serviceTickets[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  serviceTickets[index] = updated;
  persistDb();
  return updated;
}

/**
 * Checks across all dispatch orders whether a serial number has already been allocated
 */
export function isSerialNumberTaken(sn: string): boolean {
  if (!sn) return false;
  const normalized = sn.trim().toUpperCase();
  return dispatchOrders.some((order) =>
    order.items.some((item) =>
      item.serialNumbers.some((s) => s.trim().toUpperCase() === normalized)
    )
  );
}

/**
 * Finds a warranty record by equipment serial number
 */
export function findWarrantyBySerial(sn: string): WarrantyRecord | undefined {
  if (!sn) return undefined;
  const normalized = sn.trim().toUpperCase();
  return warrantyRecords.find(
    (record) => record.serialNumber.trim().toUpperCase() === normalized
  );
}

// ==========================================
// 10. Installation Jobs (Rooftop commissioning jobs)
// ==========================================
export let installationJobs: InstallationJob[] = [
  {
    id: 'job-01',
    jobCode: 'JOB-2026-001',
    orderId: 'ord-01',
    customerId: 'cust-01',
    customerName: 'Rajesh Malhotra',
    customerPhone: '9810123456',
    siteAddress: 'B-42, South Extension Part II, Delhi - 110049',
    capacityKW: 5,
    systemType: 'ON_GRID',
    leadTechnicianId: 'tech-01',
    leadTechnicianName: 'Manoj Kumar',
    assistantTechnicianIds: ['tech-02'],
    scheduledStartDate: '2026-10-28',
    scheduledEndDate: '2026-10-29',
    actualStartTime: '2026-10-28T09:30:00Z',
    actualFinishTime: '2026-10-29T16:45:00Z',
    stage: 'COMMISSIONED',
    checklist: {
      structureAnchoringChecked: true,
      panelMountingTightened: true,
      dcPolarityVerified: true,
      dcStringVocVolts: 382,
      inverterWallMounted: true,
      acDcdbInstalled: true,
      earthResistanceOhms: 2.4,
      lightningArresterConnected: true,
      generationTestWatts: 4890,
      customerBriefed: true,
    },
    photos: {
      panelsMountedUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400',
      inverterWiringUrl: 'https://images.unsplash.com/photo-1558441719-8b489c63f7d1?w=400',
      netMeterUrl: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=400',
    },
    customerSignature: 'Rajesh Malhotra (Signed on Device)',
    customerRating: 5,
    customerFeedback: 'Clean work and neat cable routing. Technicians were very polite.',
    completionReportNumber: 'ICR-2026-1001',
    commissionedAt: '2026-10-29T17:00:00Z',
    notes: '5 kW On-Grid system energized. Net meter documentation handed to BSES.',
    createdAt: '2026-10-27T10:00:00Z',
    updatedAt: '2026-10-29T17:00:00Z',
  },
  {
    id: 'job-02',
    jobCode: 'JOB-2026-002',
    orderId: 'ord-02',
    customerId: 'cust-02',
    customerName: 'Sunita Sharma',
    customerPhone: '9871234567',
    siteAddress: 'House 142, Sector 14, Urban Estate, Gurugram - 122001',
    capacityKW: 4,
    systemType: 'ON_GRID',
    leadTechnicianId: 'tech-02',
    leadTechnicianName: 'Deepak Joshi',
    assistantTechnicianIds: ['tech-04'],
    scheduledStartDate: '2026-10-31',
    scheduledEndDate: '2026-11-01',
    actualStartTime: '2026-10-31T08:45:00Z',
    stage: 'IN_PROGRESS',
    checklist: {
      structureAnchoringChecked: true,
      panelMountingTightened: true,
      dcPolarityVerified: true,
      dcStringVocVolts: 310,
      inverterWallMounted: true,
      acDcdbInstalled: false,
      earthResistanceOhms: 3.1,
      lightningArresterConnected: true,
      generationTestWatts: 0,
      customerBriefed: false,
    },
    photos: {
      panelsMountedUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400',
    },
    notes: 'Structure mounted, panels laid. ACDB installation and synchronization scheduled for afternoon.',
    createdAt: '2026-10-29T11:00:00Z',
    updatedAt: '2026-10-31T09:00:00Z',
  },
  {
    id: 'job-03',
    jobCode: 'JOB-2026-003',
    orderId: 'ord-03',
    customerId: 'cust-03',
    customerName: 'Amitabh Sen',
    customerPhone: '9820345678',
    siteAddress: 'Villa 18, Palm Meadows, Greater Noida - 201308',
    capacityKW: 3,
    systemType: 'OFF_GRID',
    leadTechnicianId: 'tech-05',
    leadTechnicianName: 'Rohit Verma',
    assistantTechnicianIds: ['tech-06'],
    scheduledStartDate: '2026-11-02',
    scheduledEndDate: '2026-11-03',
    stage: 'SCHEDULED',
    checklist: {
      structureAnchoringChecked: false,
      panelMountingTightened: false,
      dcPolarityVerified: false,
      dcStringVocVolts: 0,
      inverterWallMounted: false,
      acDcdbInstalled: false,
      earthResistanceOhms: 0,
      lightningArresterConnected: false,
      generationTestWatts: 0,
      customerBriefed: false,
    },
    photos: {},
    notes: 'Material dispatch scheduled for Monday morning. 3 kW Hybrid with lithium battery storage.',
    createdAt: '2026-10-30T14:30:00Z',
    updatedAt: '2026-10-30T14:30:00Z',
  },
];

export function addInstallationJob(job: InstallationJob): InstallationJob {
  const newJob: InstallationJob = {
    ...job,
    id: job.id || `job-${Date.now()}`,
    jobCode: job.jobCode || `JOB-2026-${String(installationJobs.length + 1).padStart(3, '0')}`,
    createdAt: newJobTimestamp(),
    updatedAt: newJobTimestamp(),
  };
  installationJobs.unshift(newJob);
  persistDb();
  return newJob;
}

function newJobTimestamp(): string {
  return new Date().toISOString();
}

export function updateInstallationJob(
  id: string,
  data: Partial<InstallationJob>
): InstallationJob {
  const index = installationJobs.findIndex((j) => j.id === id);
  if (index === -1) {
    throw new Error(`Installation job with id "${id}" not found`);
  }
  const updated: InstallationJob = {
    ...installationJobs[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  installationJobs[index] = updated;
  persistDb();
  return updated;
}

// ==========================================
// 11. User Accounts (Provisioned staff & clients)
// ==========================================
export let users: UserAccount[] = [
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
  {
    id: 'usr-pending-01',
    name: 'Rohan Deshmukh',
    email: 'rohan.d@gmail.com',
    password: 'Password@123',
    phone: '+91 98111 00007',
    role: 'SALES',
    department: 'Sales Trainee',
    status: 'PENDING_APPROVAL',
    createdAt: '2026-10-30T16:20:00Z',
  },
];

// ==========================================
// 12. Role Change Audit Logs
// ==========================================
export let roleAuditLogs: RoleAuditEntry[] = [
  {
    id: 'audit-01',
    userId: 'usr-tech-01',
    userName: 'Manoj Kumar',
    userEmail: 'tech@sunpowersolutions.in',
    oldRole: 'SALES',
    newRole: 'TECHNICIAN',
    changedByAdminId: 'usr-admin-01',
    changedByAdminName: 'Rajesh Sharma',
    reason: 'Transferred from commercial surveys to rooftop lead installation engineer',
    timestamp: '2026-08-20T11:00:00Z',
  },
  {
    id: 'audit-02',
    userId: 'usr-wh-01',
    userName: 'Suresh Patel',
    userEmail: 'warehouse@sunpowersolutions.in',
    oldRole: 'SALES',
    newRole: 'WAREHOUSE_MANAGER',
    changedByAdminId: 'usr-admin-01',
    changedByAdminName: 'Rajesh Sharma',
    reason: 'Promoted to manage equipment stock, serial scanning and dispatches',
    timestamp: '2026-08-25T14:00:00Z',
  },
];

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

export function createUserAccount(
  data: Omit<UserAccount, 'id' | 'createdAt'>
): UserAccount {
  const newUser: UserAccount = {
    ...data,
    id: `usr-${Date.now()}`,
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
// 13. Persistent LocalStorage Layer
// ==========================================
const STORAGE_KEY = 'sunpower_db_state_v2';

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
    if (parsed.installationJobs && Array.isArray(parsed.installationJobs)) installationJobs = parsed.installationJobs;
    if (parsed.users && Array.isArray(parsed.users)) users = parsed.users;
    if (parsed.roleAuditLogs && Array.isArray(parsed.roleAuditLogs)) roleAuditLogs = parsed.roleAuditLogs;
  } catch (e) {
    console.warn('[inMemoryDb] LocalStorage hydration error:', e);
  }
}

// Hydrate state immediately
hydrateDbFromStorage();


