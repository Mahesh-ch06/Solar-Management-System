export type InventoryCategory =
  | 'SOLAR_PANEL'
  | 'INVERTER'
  | 'BATTERY'
  | 'CHARGE_CONTROLLER'
  | 'MOUNTING_STRUCTURE'
  | 'DC_WIRE'
  | 'AC_WIRE'
  | 'SWITCHGEAR'
  | 'EARTHING'
  | 'CONNECTOR'
  | 'OTHER';

export type MovementType = 'INWARD' | 'OUTWARD' | 'ADJUSTMENT' | 'RETURN';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  brand: string;
  model: string;
  category: InventoryCategory;
  unit: string; // Nos, Meters, Kg, Set
  currentStock: number;
  lowStockThreshold: number;
  unitCostPrice: number;
  unitSellingPrice: number;
  hasSerialNumbers: boolean;
  warrantyYears: number;
  specifications: string; // e.g. "540W Mono PERC, 21% efficiency"
  location: string; // Rack/shelf location
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  itemName: string;
  movementType: MovementType;
  quantity: number;
  reason: string;
  reference: string; // Dispatch order / Purchase order number
  performedBy: string;
  createdAt: string;
}
