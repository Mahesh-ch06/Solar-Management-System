import { ApiResponse } from '../../../types/common';
import { DispatchOrder, WarrantyRecord } from '../../../types/operations';
import {
  dispatchOrders,
  addDispatchOrder,
  updateDispatchOrder,
  warrantyRecords,
  addWarrantyRecord,
  customers,
  inventoryItems,
} from '../../../store/inMemoryDb';
import { wrapResponse } from '../../../services/apiResponse';

export interface CreateDispatchInput {
  orderId?: string;
  customerId: string;
  customerName?: string;
  customerAddress?: string;
  items: {
    inventoryItemId: string;
    itemName: string;
    quantity: number;
    serialNumbers?: string[];
    warrantyYears: number;
  }[];
}

export const dispatchService = {
  /**
   * Retrieves all dispatch orders
   */
  async getDispatchOrders(): Promise<ApiResponse<DispatchOrder[]>> {
    return wrapResponse<DispatchOrder[]>([...dispatchOrders]);
  },

  /**
   * Retrieves a single dispatch order by ID
   */
  async getDispatchById(id: string): Promise<ApiResponse<DispatchOrder | null>> {
    const order = dispatchOrders.find((d) => d.id === id) || null;
    return wrapResponse<DispatchOrder | null>(order ? { ...order } : null);
  },

  /**
   * Creates a new dispatch order in PENDING_SERIAL state
   */
  async createDispatch(data: CreateDispatchInput): Promise<ApiResponse<DispatchOrder>> {
    const customer = customers.find((c) => c.id === data.customerId);
    const count = dispatchOrders.length + 1;
    const dispatchNumber = `DSP-2026-${String(count).padStart(3, '0')}`;

    const newDispatch: DispatchOrder = {
      id: `dsp-${Date.now()}`,
      dispatchNumber,
      orderId: data.orderId || `ord-${Date.now()}`,
      customerId: data.customerId,
      customerName: data.customerName || customer?.name || 'Customer',
      customerAddress:
        data.customerAddress || customer?.address || 'Site Address',
      items: data.items.map((item) => ({
        inventoryItemId: item.inventoryItemId,
        itemName: item.itemName,
        quantity: item.quantity,
        serialNumbers: item.serialNumbers || [],
        warrantyYears: item.warrantyYears || 5,
      })),
      status: 'PENDING_SERIAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDispatchOrder(newDispatch);
    return wrapResponse<DispatchOrder>(newDispatch, 'Dispatch order created');
  },

  /**
   * Updates serial numbers for items in a dispatch order and marks it as READY
   */
  async updateDispatchSerials(
    id: string,
    itemsWithSerials: { inventoryItemId: string; serialNumbers: string[] }[]
  ): Promise<ApiResponse<DispatchOrder>> {
    const existing = dispatchOrders.find((d) => d.id === id);
    if (!existing) {
      throw new Error(`Dispatch order with id ${id} not found`);
    }

    const updatedItems = existing.items.map((item) => {
      const match = itemsWithSerials.find((m) => m.inventoryItemId === item.inventoryItemId);
      if (match) {
        return {
          ...item,
          serialNumbers: [...match.serialNumbers],
        };
      }
      return item;
    });

    const updated = updateDispatchOrder(id, {
      items: updatedItems,
      status: 'READY',
      updatedAt: new Date().toISOString(),
    });

    return wrapResponse<DispatchOrder>(updated, 'Serial numbers assigned successfully');
  },

  /**
   * Marks dispatch order as DISPATCHED and automatically creates warranty records
   */
  async markDispatched(
    id: string,
    vehicleNumber: string,
    driverName: string
  ): Promise<ApiResponse<DispatchOrder>> {
    const existing = dispatchOrders.find((d) => d.id === id);
    if (!existing) {
      throw new Error(`Dispatch order with id ${id} not found`);
    }

    const nowIso = new Date().toISOString();
    const customer = customers.find((c) => c.id === existing.customerId);

    // Auto-create warranty records for each assigned serial number
    for (const item of existing.items) {
      const invItem = inventoryItems.find((inv) => inv.id === item.inventoryItemId);
      const warrantyYears = item.warrantyYears || invItem?.warrantyYears || 5;

      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + warrantyYears);

      for (const serial of item.serialNumbers) {
        if (!serial) continue;

        const alreadyExists = warrantyRecords.some(
          (w) => w.serialNumber.trim().toLowerCase() === serial.trim().toLowerCase()
        );

        if (!alreadyExists) {
          const newRecord: WarrantyRecord = {
            id: `war-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            serialNumber: serial.trim(),
            inventoryItemId: item.inventoryItemId,
            itemName: item.itemName,
            itemCategory: invItem?.category || 'SOLAR_PANEL',
            brand: invItem?.brand || 'Solar OEM',
            model: invItem?.model || item.itemName,
            customerId: existing.customerId,
            customerName: existing.customerName,
            customerPhone: customer?.phone || '—',
            dispatchOrderId: existing.id,
            dispatchDate: nowIso,
            warrantyYears,
            warrantyExpiryDate: expiryDate.toISOString(),
            status: 'ACTIVE',
            installationDate: nowIso,
          };

          addWarrantyRecord(newRecord);
        }
      }
    }

    const updated = updateDispatchOrder(id, {
      status: 'DISPATCHED',
      vehicleNumber,
      driverName,
      dispatchedAt: nowIso,
      updatedAt: nowIso,
    });

    return wrapResponse<DispatchOrder>(updated, 'Order marked as dispatched');
  },

  /**
   * Marks dispatch order as DELIVERED
   */
  async markDelivered(id: string): Promise<ApiResponse<DispatchOrder>> {
    const nowIso = new Date().toISOString();
    const updated = updateDispatchOrder(id, {
      status: 'DELIVERED',
      deliveredAt: nowIso,
      updatedAt: nowIso,
    });

    return wrapResponse<DispatchOrder>(updated, 'Order marked as delivered');
  },
};
