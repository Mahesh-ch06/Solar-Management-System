import { z } from 'zod';

// ─────────────────────────────────────────────────────────
// Customer / Enquiry
// ─────────────────────────────────────────────────────────
export const customerSchema = z.object({
  name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Name is too long'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number (no spaces/+91)'),
  email: z
    .string()
    .email('Enter a valid email address')
    .or(z.literal('')),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code'),
  monthlyBill: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(100, 'Monthly bill must be at least ₹100')
    .max(100000, 'Monthly bill seems too high'),
  requiredCapacityKW: z
    .number({ invalid_type_error: 'Select a capacity' })
    .min(1)
    .max(10),
  systemType: z.enum(['ON_GRID', 'OFF_GRID']),
  subsidyRequired: z.boolean(),
  enquirySource: z.enum(['WEB_FORM', 'WHATSAPP', 'PHONE_CALL', 'REFERRAL', 'WALK_IN']),
  notes: z.string().max(500, 'Notes too long').optional().default(''),
  assignedTo: z.string().min(1, 'Assign to a sales executive'),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

// ─────────────────────────────────────────────────────────
// Site Survey
// ─────────────────────────────────────────────────────────
export const surveySchema = z.object({
  assignedTechnicianId: z.string().min(1, 'Assign a technician'),
  scheduledDate: z.string().min(1, 'Select a scheduled date'),
  roofType: z.enum(['RCC_FLAT', 'RCC_SLOPED', 'TIN_SHED', 'TILE', 'OTHER']),
  totalRoofAreaSqFt: z
    .number({ invalid_type_error: 'Enter area in sq ft' })
    .min(50, 'Area must be at least 50 sq ft')
    .max(50000),
  shadowFreeAreaSqFt: z
    .number({ invalid_type_error: 'Enter shadow-free area' })
    .min(0),
  roofDirection: z.enum(['SOUTH', 'SOUTH_EAST', 'SOUTH_WEST', 'EAST', 'WEST', 'FLAT']),
  tiltAngleDeg: z
    .number({ invalid_type_error: 'Enter tilt angle' })
    .min(0)
    .max(90),
  acCableDistanceMeters: z
    .number({ invalid_type_error: 'Enter AC cable distance' })
    .min(1)
    .max(500),
  dcCableDistanceMeters: z
    .number({ invalid_type_error: 'Enter DC cable distance' })
    .min(1)
    .max(200),
  gridConnectionSuitable: z.boolean(),
  gridConnectionNotes: z.string().optional().default(''),
  structureFeasible: z.boolean(),
  recommendedCapacityKW: z
    .number({ invalid_type_error: 'Enter recommended capacity' })
    .min(1)
    .max(10),
  surveyNotes: z.string().max(1000).optional().default(''),
}).refine(
  (data) => data.shadowFreeAreaSqFt <= data.totalRoofAreaSqFt,
  {
    message: 'Shadow-free area cannot exceed total roof area',
    path: ['shadowFreeAreaSqFt'],
  }
);

export type SurveyFormData = z.infer<typeof surveySchema>;

// ─────────────────────────────────────────────────────────
// Quotation
// ─────────────────────────────────────────────────────────
export const quotationSchema = z.object({
  customerId: z.string().min(1, 'Select a customer'),
  surveyId: z.string().optional(),
  capacityKW: z
    .number({ invalid_type_error: 'Select capacity' })
    .min(1)
    .max(10),
  systemType: z.enum(['ON_GRID', 'OFF_GRID']),
  subsidyAmount: z
    .number({ invalid_type_error: 'Enter subsidy amount' })
    .min(0),
  discountAmount: z
    .number({ invalid_type_error: 'Enter discount amount' })
    .min(0),
  advancePaid: z
    .number({ invalid_type_error: 'Enter advance amount' })
    .min(0),
  validUntil: z.string().min(1, 'Set a validity date'),
  notes: z.string().max(500).optional().default(''),
  gstPercent: z.number().min(0).max(30).default(12),
});

export type QuotationFormData = z.infer<typeof quotationSchema>;

// ─────────────────────────────────────────────────────────
// Inventory Item
// ─────────────────────────────────────────────────────────
export const inventoryItemSchema = z.object({
  sku: z.string().min(2, 'SKU is required').max(30),
  name: z.string().min(3, 'Item name is required'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  category: z.enum([
    'SOLAR_PANEL', 'INVERTER', 'BATTERY', 'CHARGE_CONTROLLER',
    'MOUNTING_STRUCTURE', 'DC_WIRE', 'AC_WIRE', 'SWITCHGEAR',
    'EARTHING', 'CONNECTOR', 'OTHER',
  ]),
  unit: z.string().min(1, 'Unit is required'),
  currentStock: z.number({ invalid_type_error: 'Enter stock quantity' }).min(0),
  lowStockThreshold: z.number().min(0),
  unitCostPrice: z.number({ invalid_type_error: 'Enter cost price' }).min(1),
  unitSellingPrice: z.number({ invalid_type_error: 'Enter selling price' }).min(1),
  warrantyYears: z.number().min(0).max(25),
  hasSerialNumbers: z.boolean(),
  specifications: z.string().max(500).optional().default(''),
  location: z.string().optional().default(''),
});

export type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;

// ─────────────────────────────────────────────────────────
// Service Ticket
// ─────────────────────────────────────────────────────────
export const serviceTicketSchema = z.object({
  customerId: z.string().min(1, 'Select a customer'),
  serialNumber: z.string().optional().default(''),
  faultCode: z.string().optional().default(''),
  faultDescription: z
    .string()
    .min(10, 'Describe the fault in at least 10 characters')
    .max(1000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  assignedTechnicianId: z.string().optional().default(''),
});

export type ServiceTicketFormData = z.infer<typeof serviceTicketSchema>;
