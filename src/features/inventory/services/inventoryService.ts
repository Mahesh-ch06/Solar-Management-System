import {
  inventoryItems,
  stockMovements,
  addInventoryItem as dbAddInventoryItem,
  updateInventoryItem as dbUpdateInventoryItem,
  addStockMovement as dbAddStockMovement,
} from '../../../store/inMemoryDb';
import { InventoryItem, StockMovement, MovementType } from '../../../types/inventory';
import { InventoryItemFormData } from '../../../utils/validators';

const delay = (ms: number = 350) => new Promise((resolve) => setTimeout(resolve, ms));

export interface RecordMovementParams {
  inventoryItemId: string;
  movementType: MovementType;
  quantity: number;
  reason: string;
  reference: string;
  performedBy?: string;
}

export async function getInventoryItems(): Promise<InventoryItem[]> {
  await delay(350);
  return [...inventoryItems];
}

export async function getInventoryItemById(id: string): Promise<InventoryItem | null> {
  await delay(150);
  const item = inventoryItems.find((i) => i.id === id);
  return item ? { ...item } : null;
}

export async function addItem(data: InventoryItemFormData): Promise<InventoryItem> {
  await delay(350);
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
  return { ...newItem };
}

export async function updateItem(
  id: string,
  data: Partial<InventoryItemFormData>
): Promise<InventoryItem> {
  await delay(350);
  const updates: Partial<InventoryItem> = {
    ...data,
    currentStock: data.currentStock !== undefined ? Number(data.currentStock) : undefined,
    lowStockThreshold:
      data.lowStockThreshold !== undefined ? Number(data.lowStockThreshold) : undefined,
    unitCostPrice: data.unitCostPrice !== undefined ? Number(data.unitCostPrice) : undefined,
    unitSellingPrice:
      data.unitSellingPrice !== undefined ? Number(data.unitSellingPrice) : undefined,
    warrantyYears: data.warrantyYears !== undefined ? Number(data.warrantyYears) : undefined,
  };

  // Remove undefined fields
  Object.keys(updates).forEach(
    (key) => (updates as any)[key] === undefined && delete (updates as any)[key]
  );

  const updated = dbUpdateInventoryItem(id, updates);
  if (!updated) {
    throw new Error(`Inventory item with id "${id}" not found`);
  }
  return { ...updated };
}

export async function recordStockMovement(params: RecordMovementParams): Promise<StockMovement> {
  await delay(350);
  const item = inventoryItems.find((i) => i.id === params.inventoryItemId);
  if (!item) {
    throw new Error(`Inventory item with id "${params.inventoryItemId}" not found`);
  }

  const movement: StockMovement = {
    id: `mov-${Date.now()}`,
    inventoryItemId: item.id,
    itemName: item.name,
    movementType: params.movementType,
    quantity: Number(params.quantity),
    reason: params.reason,
    reference: params.reference,
    performedBy: params.performedBy || 'Warehouse Staff',
    createdAt: new Date().toISOString(),
  };

  dbAddStockMovement(movement);
  return { ...movement };
}

export async function getStockMovements(itemId?: string): Promise<StockMovement[]> {
  await delay(200);
  if (itemId) {
    return stockMovements.filter((m) => m.inventoryItemId === itemId);
  }
  return [...stockMovements];
}

export const inventoryService = {
  getInventoryItems,
  getInventoryItemById,
  addItem,
  updateItem,
  recordStockMovement,
  getStockMovements,
};
