import {
  inventoryItems,
  stockMovements,
  addInventoryItem as dbAddInventoryItem,
  updateInventoryItem as dbUpdateInventoryItem,
  addStockMovement as dbAddStockMovement,
} from '../../../store/inMemoryDb';
import { InventoryItem, StockMovement, MovementType } from '../../../types/inventory';
import { InventoryItemFormData } from '../../../utils/validators';
import { apiClient, USE_MOCK_DATA } from '../../../api/apiClient';

const delay = (ms: number = 150) => new Promise((resolve) => setTimeout(resolve, ms));

export interface RecordMovementParams {
  inventoryItemId: string;
  movementType: MovementType;
  quantity: number;
  reason: string;
  reference: string;
  performedBy?: string;
}

export async function getInventoryItems(): Promise<InventoryItem[]> {
  if (!USE_MOCK_DATA) {
    try {
      const res = await apiClient.get<{ success: boolean; data: InventoryItem[] }>('/inventory');
      if (res.data?.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('[inventoryService] API getInventoryItems failed, falling back to local store:', err);
    }
  }
  await delay(150);
  return [...inventoryItems];
}

export async function getInventoryItemById(id: string): Promise<InventoryItem | null> {
  if (!USE_MOCK_DATA) {
    try {
      const res = await apiClient.get<{ success: boolean; data: InventoryItem }>(`/inventory/${id}`);
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('[inventoryService] API getInventoryItemById failed, falling back to local store:', err);
    }
  }
  await delay(100);
  const item = inventoryItems.find((i) => i.id === id);
  return item ? { ...item } : null;
}

export async function addItem(data: InventoryItemFormData): Promise<InventoryItem> {
  if (!USE_MOCK_DATA) {
    try {
      const res = await apiClient.post<{ success: boolean; data: InventoryItem }>('/inventory', data);
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('[inventoryService] API addItem failed, falling back to local store:', err);
    }
  }

  await delay(200);
  const newItem: InventoryItem = {
    id: `inv-${Date.now()}`,
    sku: data.sku.toUpperCase(),
    name: data.name,
    brand: data.brand,
    model: data.model,
    category: data.category,
    unit: data.unit,
    currentStock: Number(data.currentStock) || 0,
    lowStockThreshold: Number(data.lowStockThreshold) || 0,
    unitCostPrice: Number(data.unitCostPrice) || 0,
    unitSellingPrice: Number(data.unitSellingPrice) || 0,
    hasSerialNumbers: Boolean(data.hasSerialNumbers),
    warrantyYears: Number(data.warrantyYears) || 0,
    specifications: data.specifications || '',
    location: data.location || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbAddInventoryItem(newItem);
  return newItem;
}

export async function updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
  if (!USE_MOCK_DATA) {
    try {
      const res = await apiClient.put<{ success: boolean; data: InventoryItem }>(`/inventory/${id}`, updates);
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('[inventoryService] API updateItem failed, falling back to local store:', err);
    }
  }

  await delay(150);
  const updated = dbUpdateInventoryItem(id, updates);
  return updated || null;
}

export async function recordStockMovement(params: RecordMovementParams): Promise<StockMovement> {
  if (!USE_MOCK_DATA) {
    try {
      await apiClient.post('/inventory/stock-movement', params);
    } catch (err) {
      console.warn('[inventoryService] API recordStockMovement failed, falling back to local store:', err);
    }
  }

  await delay(200);
  const item = inventoryItems.find((i) => i.id === params.inventoryItemId);
  const itemName = item ? item.name : 'Unknown Item';

  const movement: StockMovement = {
    id: `mov-${Date.now()}`,
    inventoryItemId: params.inventoryItemId,
    itemName,
    movementType: params.movementType,
    quantity: Number(params.quantity),
    reason: params.reason,
    reference: params.reference,
    performedBy: params.performedBy || 'Warehouse Team',
    createdAt: new Date().toISOString(),
  };

  dbAddStockMovement(movement);

  if (item) {
    let newQty = item.currentStock;
    if (params.movementType === 'INWARD' || params.movementType === 'RETURN') {
      newQty += Number(params.quantity);
    } else if (params.movementType === 'OUTWARD') {
      newQty = Math.max(0, newQty - Number(params.quantity));
    } else if (params.movementType === 'ADJUSTMENT') {
      newQty = Number(params.quantity);
    }
    dbUpdateInventoryItem(item.id, { currentStock: newQty });
  }

  return movement;
}
