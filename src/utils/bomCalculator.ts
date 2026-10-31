import { BOMItem } from '../types/quotation';

interface BOMConfig {
  panelWattage: number;
  panelUnitPrice: number;
  inverterUnitPrice: Record<number, number>;
  batteryUnitPrice: Record<number, number>;
  chargeControllerUnitPrice: Record<number, number>;
  mountingPerPanel: number;
  dcWirePerKW: number; // meters
  acWireFlat: number; // meters
  earthingKit: number;
  acdb: number;
  dcdb: number;
  lightningArrester: number;
  netMeteringCharge: number;
  installationCharge: Record<number, number>;
  gstPercent: number;
}

const CONFIG: BOMConfig = {
  panelWattage: 540, // Mono PERC 540W
  panelUnitPrice: 17000,
  inverterUnitPrice: { 1: 18500, 2: 22000, 3: 28500, 4: 35000, 5: 44000 },
  batteryUnitPrice: { 1: 32000, 2: 64000, 3: 96000, 4: 128000, 5: 160000 },
  chargeControllerUnitPrice: { 1: 4500, 2: 6000, 3: 8500, 4: 10000, 5: 12000 },
  mountingPerPanel: 2800, // per panel (GI structure)
  dcWirePerKW: 40, // 4 sq mm DC wire meters per kW
  acWireFlat: 20, // AC wire (flat rate, 6 sq mm)
  earthingKit: 3500,
  acdb: 4500,
  dcdb: 5000,
  lightningArrester: 2800,
  netMeteringCharge: 5000,
  installationCharge: { 1: 8000, 2: 10000, 3: 14000, 4: 18000, 5: 22000 },
  gstPercent: 12,
};

function genId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 8)}`;
}

export function calculateBOM(capacityKW: number, systemType: 'ON_GRID' | 'OFF_GRID'): BOMItem[] {
  const clampedKW = Math.min(5, Math.max(1, Math.round(capacityKW)));
  const panelCount = Math.ceil((clampedKW * 1000) / CONFIG.panelWattage);
  const items: BOMItem[] = [];

  // Solar Panels
  items.push({
    id: genId('bom'),
    name: `Mono PERC ${CONFIG.panelWattage}W Solar Panel`,
    category: 'Solar Panels',
    quantity: panelCount,
    unit: 'Nos',
    unitPrice: CONFIG.panelUnitPrice,
    totalPrice: panelCount * CONFIG.panelUnitPrice,
    isOptional: false,
  });

  // Inverter
  items.push({
    id: genId('bom'),
    name: `${clampedKW} kW String Inverter${systemType === 'OFF_GRID' ? ' (Hybrid)' : ''}`,
    category: 'Inverter',
    quantity: 1,
    unit: 'Nos',
    unitPrice: CONFIG.inverterUnitPrice[clampedKW] || 28500,
    totalPrice: CONFIG.inverterUnitPrice[clampedKW] || 28500,
    isOptional: false,
  });

  // Battery (Off-Grid only)
  if (systemType === 'OFF_GRID') {
    items.push({
      id: genId('bom'),
      name: `${clampedKW * 2} kWh Lithium Battery Bank`,
      category: 'Battery',
      quantity: 1,
      unit: 'Set',
      unitPrice: CONFIG.batteryUnitPrice[clampedKW] || 96000,
      totalPrice: CONFIG.batteryUnitPrice[clampedKW] || 96000,
      isOptional: false,
    });

    items.push({
      id: genId('bom'),
      name: `${clampedKW * 30}A MPPT Charge Controller`,
      category: 'Charge Controller',
      quantity: 1,
      unit: 'Nos',
      unitPrice: CONFIG.chargeControllerUnitPrice[clampedKW] || 8500,
      totalPrice: CONFIG.chargeControllerUnitPrice[clampedKW] || 8500,
      isOptional: false,
    });
  }

  // Mounting Structure
  items.push({
    id: genId('bom'),
    name: 'GI Mounting Structure (Hot Dip Galvanised)',
    category: 'Mounting Structure',
    quantity: panelCount,
    unit: 'Set',
    unitPrice: CONFIG.mountingPerPanel,
    totalPrice: panelCount * CONFIG.mountingPerPanel,
    isOptional: false,
  });

  // DC Wire
  const dcWireMeters = CONFIG.dcWirePerKW * clampedKW;
  items.push({
    id: genId('bom'),
    name: '4 sq mm Solar DC Cable (Red/Black)',
    category: 'Wiring',
    quantity: dcWireMeters,
    unit: 'Meters',
    unitPrice: 35,
    totalPrice: dcWireMeters * 35,
    isOptional: false,
  });

  // AC Wire
  items.push({
    id: genId('bom'),
    name: '6 sq mm AC Power Cable',
    category: 'Wiring',
    quantity: CONFIG.acWireFlat,
    unit: 'Meters',
    unitPrice: 55,
    totalPrice: CONFIG.acWireFlat * 55,
    isOptional: false,
  });

  // MC4 Connectors
  items.push({
    id: genId('bom'),
    name: 'MC4 Solar Connector Pairs',
    category: 'Connectors',
    quantity: panelCount * 2,
    unit: 'Nos',
    unitPrice: 120,
    totalPrice: panelCount * 2 * 120,
    isOptional: false,
  });

  // ACDB / DCDB
  items.push({
    id: genId('bom'),
    name: 'AC Distribution Box (ACDB) with MCB & SPD',
    category: 'Switchgear',
    quantity: 1,
    unit: 'Nos',
    unitPrice: CONFIG.acdb,
    totalPrice: CONFIG.acdb,
    isOptional: false,
  });

  items.push({
    id: genId('bom'),
    name: 'DC Distribution Box (DCDB) with Fuse',
    category: 'Switchgear',
    quantity: 1,
    unit: 'Nos',
    unitPrice: CONFIG.dcdb,
    totalPrice: CONFIG.dcdb,
    isOptional: false,
  });

  // Earthing Kit
  items.push({
    id: genId('bom'),
    name: 'Earthing & Bonding Kit (GI Flat + Clamps)',
    category: 'Safety & Earthing',
    quantity: 1,
    unit: 'Set',
    unitPrice: CONFIG.earthingKit,
    totalPrice: CONFIG.earthingKit,
    isOptional: false,
  });

  // Lightning Arrester
  items.push({
    id: genId('bom'),
    name: 'Lightning Surge Arrester',
    category: 'Safety & Earthing',
    quantity: 1,
    unit: 'Nos',
    unitPrice: CONFIG.lightningArrester,
    totalPrice: CONFIG.lightningArrester,
    isOptional: false,
  });

  // Net Metering (On-Grid only)
  if (systemType === 'ON_GRID') {
    items.push({
      id: genId('bom'),
      name: 'Net Metering Application & DISCOM Coordination',
      category: 'Service Charges',
      quantity: 1,
      unit: 'Lumpsum',
      unitPrice: CONFIG.netMeteringCharge,
      totalPrice: CONFIG.netMeteringCharge,
      isOptional: false,
    });
  }

  // Installation Labour
  items.push({
    id: genId('bom'),
    name: `Professional Rooftop Installation (${clampedKW} kW)`,
    category: 'Installation Service',
    quantity: 1,
    unit: 'Job',
    unitPrice: CONFIG.installationCharge[clampedKW] || 14000,
    totalPrice: CONFIG.installationCharge[clampedKW] || 14000,
    isOptional: false,
  });

  return items;
}

export function calculateQuotationTotals(
  items: BOMItem[],
  gstPercent: number,
  subsidyAmount: number,
  discountAmount: number
) {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const gstAmount = Math.round((subtotal * gstPercent) / 100);
  const totalAmount = subtotal + gstAmount - subsidyAmount - discountAmount;
  return { subtotal, gstAmount, totalAmount };
}
