export type QuotationStatus =
  | 'DRAFT'
  | 'SENT'
  | 'APPROVED'
  | 'REJECTED'
  | 'CONVERTED_TO_ORDER'
  | 'EXPIRED';

export type OrderStatus =
  | 'CONFIRMED'
  | 'ADVANCE_RECEIVED'
  | 'DISPATCHED'
  | 'INSTALLED'
  | 'COMMISSIONED'
  | 'CANCELLED';

export interface BOMItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  isOptional: boolean;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  surveyId?: string;
  capacityKW: number;
  systemType: 'ON_GRID' | 'OFF_GRID';
  bomItems: BOMItem[];
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
  subsidyAmount: number; // PM Surya Ghar deduction
  discountAmount: number;
  totalAmount: number;
  advancePaid: number;
  balanceAmount: number;
  status: QuotationStatus;
  validUntil: string;
  notes: string;
  termsConditions: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  quotationId: string;
  customerId: string;
  customerName: string;
  capacityKW: number;
  systemType: 'ON_GRID' | 'OFF_GRID';
  totalAmount: number;
  advancePaid: number;
  balanceAmount: number;
  status: OrderStatus;
  scheduledInstallationDate?: string;
  assignedTechnicianIds: string[];
  createdAt: string;
  updatedAt: string;
}
