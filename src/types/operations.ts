export type DispatchStatus = 'DRAFT' | 'PENDING_SERIAL' | 'READY' | 'DISPATCHED' | 'DELIVERED';
export type WarrantyStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
export type TicketStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SerialRecord {
  serialNumber: string;
  inventoryItemId: string;
  itemName: string;
  category: string;
  warrantyYears: number;
}

export interface DispatchOrder {
  id: string;
  dispatchNumber: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  items: {
    inventoryItemId: string;
    itemName: string;
    quantity: number;
    serialNumbers: string[];
    warrantyYears: number;
  }[];
  status: DispatchStatus;
  vehicleNumber?: string;
  driverName?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarrantyRecord {
  id: string;
  serialNumber: string;
  inventoryItemId: string;
  itemName: string;
  itemCategory: string;
  brand: string;
  model: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  dispatchOrderId: string;
  dispatchDate: string;
  warrantyYears: number;
  warrantyExpiryDate: string;
  status: WarrantyStatus;
  installationDate?: string;
}

export interface ServiceTicket {
  id: string;
  ticketNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  serialNumber?: string;
  warrantyRecordId?: string;
  isUnderWarranty: boolean;
  faultCode?: string;
  faultDescription: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  partsUsed: { name: string; cost: number }[];
  labourCost: number;
  totalBillAmount: number; // 0 if warranty covered
  resolutionNotes?: string;
  customerConfirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}
