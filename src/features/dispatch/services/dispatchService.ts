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
import { apiClient, USE_MOCK_DATA } from '../../../api/apiClient';

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
    if (!USE_MOCK_DATA) {
      try {
        const res = await apiClient.get<{ success: boolean; data: DispatchOrder[] }>('/dispatch');
        if (res.data?.success && Array.isArray(res.data.data)) {
          return wrapResponse<DispatchOrder[]>(res.data.data);
        }
      } catch (err) {
        console.warn('[dispatchService] API getDispatchOrders failed, falling back to local store:', err);
      }
    }
    return wrapResponse<DispatchOrder[]>([...dispatchOrders]);
  },

  /**
   * Retrieves a single dispatch order by ID
   */
  async getDispatchById(id: string): Promise<ApiResponse<DispatchOrder | null>> {
    if (!USE_MOCK_DATA) {
      try {
        const res = await apiClient.get<{ success: boolean; data: DispatchOrder }>(`/dispatch/${id}`);
        if (res.data?.success && res.data.data) {
          return wrapResponse<DispatchOrder | null>(res.data.data);
        }
      } catch (err) {
        console.warn('[dispatchService] API getDispatchById failed, falling back to local store:', err);
      }
    }
    const order = dispatchOrders.find((d) => d.id === id) || null;
    return wrapResponse<DispatchOrder | null>(order ? { ...order } : null);
  },

  /**
   * Creates a new dispatch order in PENDING_SERIAL state
   */
  async createDispatch(data: CreateDispatchInput): Promise<ApiResponse<DispatchOrder>> {
    if (!USE_MOCK_DATA) {
      try {
        const res = await apiClient.post<{ success: boolean; data: DispatchOrder }>('/dispatch', data);
        if (res.data?.success && res.data.data) {
          return wrapResponse<DispatchOrder>(res.data.data, 'Dispatch order created');
        }
      } catch (err) {
        console.warn('[dispatchService] API createDispatch failed, falling back to local store:', err);
      }
    }

    const customer = customers.find((c) => c.id === data.customerId);
    const count = dispatchOrders.length + 1;
    const dispatchNumber = `DSP-2026-${String(count).padStart(3, '0')}`;

    const newDispatch: DispatchOrder = {
      id: `disp-${Date.now()}`,
      dispatchNumber,
      orderId: data.orderId || `ord-${Date.now()}`,
      customerId: data.customerId,
      customerName: data.customerName || customer?.name || 'Customer',
      customerAddress: data.customerAddress || customer?.address || 'Site Address',
      items: data.items.map((i) => ({
        ...i,
        serialNumbers: i.serialNumbers || [],
      })),
      status: 'PENDING_SERIAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDispatchOrder(newDispatch);
    return wrapResponse<DispatchOrder>(newDispatch, 'Dispatch order created');
  },

  /**
   * Records a verified serial number against a dispatch item and auto-registers warranty
   */
  async recordSerialScan(
    dispatchOrderId: string,
    inventoryItemId: string,
    serialNumber: string
  ): Promise<ApiResponse<DispatchOrder>> {
    const cleanSerial = serialNumber.trim().toUpperCase();

    if (!USE_MOCK_DATA) {
      try {
        await apiClient.post(`/dispatch/${dispatchOrderId}/scan-serial`, {
          inventoryItemId,
          serialNumber: cleanSerial,
        });
      } catch (err: any) {
        const errMsg = err?.response?.data?.error;
        if (errMsg) throw new Error(errMsg);
        console.warn('[dispatchService] API recordSerialScan failed, falling back to local store:', err);
      }
    }

    const order = dispatchOrders.find((d) => d.id === dispatchOrderId);
    if (!order) {
      throw new Error(`Dispatch order "${dispatchOrderId}" not found`);
    }

    const item = order.items.find((i) => i.inventoryItemId === inventoryItemId);
    if (!item) {
      throw new Error(`Item "${inventoryItemId}" not found in dispatch order`);
    }

    if (item.serialNumbers.includes(cleanSerial)) {
      throw new Error(`Serial number "${cleanSerial}" is already scanned in this order`);
    }

    const alreadyRegistered = warrantyRecords.find(
      (w) => w.serialNumber.trim().toUpperCase() === cleanSerial
    );
    if (alreadyRegistered) {
      throw new Error(
        `Serial number "${cleanSerial}" is already assigned to Customer "${alreadyRegistered.customerName}"`
      );
    }

    const updatedSerials = [...item.serialNumbers, cleanSerial];
    const updatedItems = order.items.map((i) =>
      i.inventoryItemId === inventoryItemId ? { ...i, serialNumbers: updatedSerials } : i
    );

    const allItemsComplete = updatedItems.every(
      (i) => i.serialNumbers.length >= i.quantity
    );
    const newStatus = allItemsComplete ? 'READY' : 'PENDING_SERIAL';

    const updatedOrder = updateDispatchOrder(dispatchOrderId, {
      items: updatedItems,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    const invItem = inventoryItems.find((i) => i.id === inventoryItemId);
    const customer = customers.find((c) => c.id === order.customerId);
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(now.getFullYear() + item.warrantyYears);

    const newWarranty: WarrantyRecord = {
      id: `warr-${Date.now()}`,
      serialNumber: cleanSerial,
      inventoryItemId: item.inventoryItemId,
      itemName: item.itemName,
      itemCategory: invItem?.category || 'OTHER',
      brand: invItem?.brand || 'Solar Brand',
      model: invItem?.model || 'Model',
      customerId: order.customerId,
      customerName: order.customerName,
      customerPhone: customer?.phone || '—',
      dispatchOrderId: order.id,
      dispatchDate: now.toISOString().split('T')[0],
      warrantyYears: item.warrantyYears,
      warrantyExpiryDate: expiryDate.toISOString().split('T')[0],
      status: 'ACTIVE',
    };

    addWarrantyRecord(newWarranty);

    return wrapResponse<DispatchOrder>(
      updatedOrder,
      `Serial "${cleanSerial}" recorded. Warranty auto-registered.`
    );
  },

  /**
   * Updates dispatch status
   */
  async updateStatus(
    id: string,
    status: DispatchOrder['status'],
    details?: { vehicleNumber?: string; driverName?: string }
  ): Promise<ApiResponse<DispatchOrder>> {
    if (!USE_MOCK_DATA) {
      try {
        await apiClient.patch(`/dispatch/${id}/status`, { status, ...details });
      } catch (err) {
        console.warn('[dispatchService] API updateStatus failed, continuing with local store:', err);
      }
    }

    const updated = updateDispatchOrder(id, {
      status,
      ...details,
      updatedAt: new Date().toISOString(),
    });

    return wrapResponse<DispatchOrder>(updated, `Status updated to ${status}`);
  },

  /**
   * Marks a dispatch order as dispatched with vehicle and driver details
   */
  async markDispatched(
    id: string,
    vehicleNumber?: string,
    driverName?: string
  ): Promise<ApiResponse<DispatchOrder>> {
    return this.updateStatus(id, 'DISPATCHED', { vehicleNumber, driverName });
  },

  /**
   * Marks a dispatch order as delivered
   */
  async markDelivered(id: string): Promise<ApiResponse<DispatchOrder>> {
    return this.updateStatus(id, 'DELIVERED');
  },

  /**
   * Updates serial numbers for items in a dispatch order
   */
  async updateDispatchSerials(
    dispatchOrderId: string,
    itemsWithSerials: { inventoryItemId: string; serialNumbers: string[] }[]
  ): Promise<ApiResponse<DispatchOrder>> {
    const order = dispatchOrders.find((d) => d.id === dispatchOrderId);
    if (!order) {
      throw new Error(`Dispatch order "${dispatchOrderId}" not found`);
    }

    const updatedItems = order.items.map((item) => {
      const match = itemsWithSerials.find((m) => m.inventoryItemId === item.inventoryItemId);
      if (match) {
        return { ...item, serialNumbers: match.serialNumbers };
      }
      return item;
    });

    const allComplete = updatedItems.every((i) => i.serialNumbers.length >= i.quantity);
    const newStatus = allComplete ? 'READY' : order.status;

    if (!USE_MOCK_DATA) {
      try {
        await apiClient.put(`/dispatch/${dispatchOrderId}/serials`, { items: itemsWithSerials });
      } catch (err) {
        console.warn('[dispatchService] API updateDispatchSerials failed, updating local store:', err);
      }
    }

    const updated = updateDispatchOrder(dispatchOrderId, {
      items: updatedItems,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    return wrapResponse<DispatchOrder>(updated, 'Serial numbers updated');
  },
};

