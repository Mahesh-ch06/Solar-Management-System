/**
 * [Member 3] Equipment Dispatch & Serial Number Anti-Duplicate Scanning Controller
 * 
 * Purpose:
 * Prepares warehouse picking lists for solar installations.
 * Validates barcode/serial number scans for inverters, panels, and batteries.
 * Rejects duplicate serial numbers to prevent double-allocation and warranty fraud.
 * 
 * Why in this file?
 * Isolates warehouse fulfillment and serialized dispatch logic for Member 3.
 */

import { db } from '../../db/database.js';

export const dispatchController = {
  /**
   * GET /api/v1/dispatch
   * Lists all dispatch orders with parsed items
   */
  getDispatches(req, res, next) {
    try {
      const rows = db.prepare('SELECT * FROM dispatch_orders ORDER BY createdAt DESC').all();
      const dispatches = rows.map((d) => ({
        ...d,
        items: d.items ? JSON.parse(d.items) : [],
      }));
      return res.status(200).json({ success: true, data: dispatches });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/dispatch/:id
   * Fetches single dispatch order
   */
  getDispatchById(req, res, next) {
    try {
      const { id } = req.params;
      const d = db.prepare('SELECT * FROM dispatch_orders WHERE id = ?').get(id);

      if (!d) {
        return res.status(404).json({ success: false, error: 'Dispatch order not found.' });
      }

      return res.status(200).json({
        success: true,
        data: {
          ...d,
          items: d.items ? JSON.parse(d.items) : [],
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/dispatch
   * Creates a new warehouse dispatch job for an approved solar installation order
   */
  createDispatch(req, res, next) {
    try {
      const { orderId, customerId, customerName, customerAddress, items, scheduledDate } = req.body;

      if (!orderId || !customerId || !items || !items.length) {
        return res.status(400).json({
          success: false,
          error: 'Order ID, customer details, and dispatch items list are required.',
        });
      }

      const countRow = db.prepare('SELECT COUNT(*) as count FROM dispatch_orders').get();
      const id = `disp-${String(countRow.count + 1).padStart(2, '0')}`;
      const dispatchNumber = `DISP-2026-${String(countRow.count + 1).padStart(3, '0')}`;

      const insert = db.prepare(`
        INSERT INTO dispatch_orders (
          id, dispatchNumber, orderId, customerId, customerName, customerAddress,
          items, status, scheduledDate, createdAt, updatedAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, 'PENDING_SERIAL', ?, datetime('now'), datetime('now')
        )
      `);

      insert.run(
        id,
        dispatchNumber,
        orderId,
        customerId,
        customerName || 'Customer',
        customerAddress || 'Site Address',
        JSON.stringify(items),
        scheduledDate || new Date().toISOString().split('T')[0]
      );

      const created = db.prepare('SELECT * FROM dispatch_orders WHERE id = ?').get(id);
      return res.status(201).json({
        success: true,
        data: {
          ...created,
          items: JSON.parse(created.items),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/dispatch/:id/scan-serial
   * Anti-Duplicate Barcode Scanning & Auto-Warranty Registration
   */
  scanSerial(req, res, next) {
    try {
      const { id } = req.params;
      const { inventoryItemId, serialNumber } = req.body;

      if (!inventoryItemId || !serialNumber) {
        return res.status(400).json({
          success: false,
          error: 'Inventory item ID and serial number are required.',
        });
      }

      const cleanSerial = serialNumber.trim().toUpperCase();

      // 1. Strict Anti-Duplicate Validation: Is serial already registered in warranties?
      const existingWarranty = db.prepare('SELECT * FROM warranty_records WHERE UPPER(serialNumber) = ?').get(cleanSerial);
      if (existingWarranty) {
        return res.status(409).json({
          success: false,
          error: `Duplicate Serial Alert! Serial number "${cleanSerial}" is already assigned to Customer "${existingWarranty.customerName}" (Dispatch: ${existingWarranty.dispatchOrderId || 'N/A'}).`,
        });
      }

      // 2. Fetch dispatch order
      const dispatch = db.prepare('SELECT * FROM dispatch_orders WHERE id = ?').get(id);
      if (!dispatch) {
        return res.status(404).json({ success: false, error: 'Dispatch order not found.' });
      }

      const items = JSON.parse(dispatch.items || '[]');
      const targetItem = items.find((i) => i.inventoryItemId === inventoryItemId);

      if (!targetItem) {
        return res.status(400).json({ success: false, error: 'Item not part of this dispatch order.' });
      }

      if (!targetItem.serialNumbers) {
        targetItem.serialNumbers = [];
      }

      // Check if serial scanned within this same dispatch
      if (targetItem.serialNumbers.includes(cleanSerial)) {
        return res.status(409).json({
          success: false,
          error: `Serial number "${cleanSerial}" has already been scanned in this dispatch order.`,
        });
      }

      if (targetItem.serialNumbers.length >= targetItem.quantity) {
        return res.status(400).json({
          success: false,
          error: `All ${targetItem.quantity} required serial numbers for "${targetItem.itemName}" have already been scanned.`,
        });
      }

      // Add serial to list
      targetItem.serialNumbers.push(cleanSerial);

      // Check if all items in dispatch now have their serials scanned
      const allScanned = items.every((i) => (i.serialNumbers || []).length >= i.quantity);
      const newStatus = allScanned ? 'READY' : 'PENDING_SERIAL';

      // Update dispatch record
      db.prepare(`
        UPDATE dispatch_orders 
        SET items = ?, status = ?, updatedAt = datetime('now')
        WHERE id = ?
      `).run(JSON.stringify(items), newStatus, id);

      // 3. Auto-register in Warranty Registry
      const invItem = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(inventoryItemId);
      const cust = db.prepare('SELECT phone FROM customers WHERE id = ?').get(dispatch.customerId);

      const warrantyId = `warr-${Date.now().toString(36)}`;
      const warrantyYears = (targetItem && targetItem.warrantyYears) || (invItem && invItem.warrantyYears) || 5;

      const installDate = new Date().toISOString().split('T')[0];
      const expiryDate = new Date(Date.now() + warrantyYears * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const insertWarranty = db.prepare(`
        INSERT INTO warranty_records (
          id, serialNumber, inventoryItemId, itemName, itemCategory, brand, model,
          customerId, customerName, customerPhone, dispatchOrderId, dispatchDate,
          warrantyYears, warrantyExpiryDate, status, installationDate
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, 'ACTIVE', ?
        )
      `);

      insertWarranty.run(
        warrantyId,
        cleanSerial,
        inventoryItemId,
        targetItem.itemName,
        invItem ? invItem.category : 'SOLAR_EQUIPMENT',
        invItem ? invItem.brand : 'SunPower',
        invItem ? invItem.model : 'Standard',
        dispatch.customerId,
        dispatch.customerName,
        cust ? cust.phone : '',
        dispatch.id,
        installDate,
        warrantyYears,
        expiryDate,
        installDate
      );

      return res.status(200).json({
        success: true,
        message: `Serial number ${cleanSerial} validated and added. Warranty record created.`,
        dispatchStatus: newStatus,
        scannedCount: targetItem.serialNumbers.length,
        requiredCount: targetItem.quantity,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/dispatch/:id/status
   * Updates vehicle dispatch status (DISPATCHED, DELIVERED)
   */
  updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, vehicleNumber, driverName } = req.body;

      const update = db.prepare(`
        UPDATE dispatch_orders SET
          status = COALESCE(?, status),
          vehicleNumber = COALESCE(?, vehicleNumber),
          driverName = COALESCE(?, driverName),
          dispatchedAt = CASE WHEN ? = 'DISPATCHED' THEN datetime('now') ELSE dispatchedAt END,
          deliveredAt = CASE WHEN ? = 'DELIVERED' THEN datetime('now') ELSE deliveredAt END,
          updatedAt = datetime('now')
        WHERE id = ?
      `);

      const result = update.run(status, vehicleNumber, driverName, status, status, id);

      if (result.changes === 0) {
        return res.status(404).json({ success: false, error: 'Dispatch order not found.' });
      }

      return res.status(200).json({ success: true, message: `Dispatch status updated to ${status}.` });
    } catch (err) {
      next(err);
    }
  },
};

