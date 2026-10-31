import { ApiResponse } from '../../../types/common';
import { ServiceTicket, TicketStatus } from '../../../types/operations';
import { ServiceTicketFormData } from '../../../utils/validators';
import {
  serviceTickets,
  addServiceTicket,
  updateServiceTicket,
  findWarrantyBySerial,
  customers,
} from '../../../store/inMemoryDb';
import { wrapResponse } from '../../../services/apiResponse';

export interface ResolveTicketInput {
  partsUsed?: { name: string; cost: number }[];
  labourCost?: number;
  resolutionNotes: string;
}

export const serviceService = {
  /**
   * Retrieves all service and maintenance tickets
   */
  async getServiceTickets(): Promise<ApiResponse<ServiceTicket[]>> {
    return wrapResponse<ServiceTicket[]>([...serviceTickets]);
  },

  /**
   * Creates a new service ticket with automated warranty coverage verification
   */
  async createTicket(data: ServiceTicketFormData): Promise<ApiResponse<ServiceTicket>> {
    const customer = customers.find((c) => c.id === data.customerId);
    const count = serviceTickets.length + 1;
    const ticketNumber = `TKT-2026-${String(count).padStart(3, '0')}`;

    // Auto-check warranty coverage by serial number
    let isUnderWarranty = false;
    let warrantyRecordId: string | undefined;

    if (data.serialNumber && data.serialNumber.trim()) {
      const warranty = findWarrantyBySerial(data.serialNumber.trim());
      if (warranty && (warranty.status === 'ACTIVE' || warranty.status === 'EXPIRING_SOON')) {
        isUnderWarranty = true;
        warrantyRecordId = warranty.id;
      }
    }

    const initialLabour = isUnderWarranty ? 0 : 1200;
    const initialBill = isUnderWarranty ? 0 : 1200;

    const newTicket: ServiceTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber,
      customerId: data.customerId,
      customerName: customer?.name || 'Customer',
      customerPhone: customer?.phone || '—',
      serialNumber: data.serialNumber ? data.serialNumber.trim() : undefined,
      warrantyRecordId,
      isUnderWarranty,
      faultCode: data.faultCode || 'E00',
      faultDescription: data.faultDescription,
      priority: data.priority,
      status: data.assignedTechnicianId ? 'ASSIGNED' : 'OPEN',
      assignedTechnicianId: data.assignedTechnicianId || undefined,
      assignedTechnicianName: data.assignedTechnicianId ? 'Field Technician' : undefined,
      partsUsed: [],
      labourCost: initialLabour,
      totalBillAmount: initialBill,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addServiceTicket(newTicket);
    return wrapResponse<ServiceTicket>(newTicket, 'Ticket created successfully');
  },

  /**
   * Updates status of an existing ticket
   */
  async updateTicketStatus(
    id: string,
    status: TicketStatus
  ): Promise<ApiResponse<ServiceTicket>> {
    const updated = updateServiceTicket(id, {
      status,
      updatedAt: new Date().toISOString(),
    });

    return wrapResponse<ServiceTicket>(updated, 'Ticket status updated');
  },

  /**
   * Resolves a ticket with resolution notes and bill calculation
   */
  async resolveTicket(
    id: string,
    data: ResolveTicketInput
  ): Promise<ApiResponse<ServiceTicket>> {
    const existing = serviceTickets.find((t) => t.id === id);
    if (!existing) {
      throw new Error(`Service ticket with id ${id} not found`);
    }

    const parts = data.partsUsed || [];
    const partsTotal = parts.reduce((acc, p) => acc + (p.cost || 0), 0);
    const labour = data.labourCost !== undefined ? data.labourCost : existing.labourCost;

    // Total is ₹0 if under warranty, otherwise parts + labour
    const totalBill = existing.isUnderWarranty ? 0 : partsTotal + labour;

    const updated = updateServiceTicket(id, {
      status: 'RESOLVED',
      partsUsed: parts,
      labourCost: labour,
      totalBillAmount: totalBill,
      resolutionNotes: data.resolutionNotes,
      customerConfirmedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return wrapResponse<ServiceTicket>(updated, 'Ticket resolved successfully');
  },
};
