/**
 * [Member 3] Equipment Dispatch & Serial Number Anti-Duplicate Scanning Controller
 * 
 * Purpose:
 * Prepares warehouse picking lists for solar installations.
 * Validates barcode/serial number scans for inverters, panels, and batteries.
 * Strict Anti-Duplicate Barcode Scanning: Rejects duplicate serial numbers to prevent
 * double-allocation and warranty fraud.
 * Auto-creates warranty records in the Warranty Registry upon serialized dispatch.
 * Automatically deducts stock inventory and records outward movements upon vehicle dispatch.
 * 
 * Why in this file?
 * Isolates warehouse fulfillment and serialized dispatch logic for Member 3.
 */

import { db } from '../../db/database.js';

export const dispatchController = {
  /**
   * GET /api/v1/dispatch
   * Lists all dispatch orders with parsed items JSON and optional status/customer filtering
   */
  getDispatches(req, res, next) {
    try {
      const { status, customerId } = req.query;

      let sql = 'SELECT * FROM dispatch_orders WHERE 1=1';
      const params = [];

      if (status) {
        sql += ' AND status = ?';
        params.push(status);
      }

      if (customerId) {
        sql += ' AND customerId = ?';
        params.push(customerId);
      }

      sql += ' ORDER BY createdAt DESC';

      const rows = db.prepare(sql).all(...params);
      const dispatches = rows.map((d) => ({
        ...d,
        items: d.items ? JSON.parse(d.items) : [],
      }));

      return res.status(200).json({ success: true, count: dispatches.length, data: dispatches });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/dispatch/:id
   * Fetches single dispatch order with parsed items
   */
  getDispatchById(req, res, next) {
    try {
      const { id } = req.params;
      const d = db.prepare('SELECT * FROM dispatch_orders WHERE id = ?').get(id);

      if (!d) {
        return res.status(404).json({ success: false, error: `Dispatch order "${id}" not found.` });
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

      if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Customer ID and dispatch items list (non-empty array) are required.',
        });
      }

      // Fetch customer details if name/address missing
      let custName = customerName;
      let custAddress = customerAddress;
      if (!custName || !custAddress) {
        const cust = db.prepare('SELECT name, address, city FROM customers WHERE id = ?').get(customerId);
        if (cust) {
          custName = custName || cust.name;
          custAddress = custAddress || `${cust.address}, ${cust.city}`;
        }
      }

      const countRow = db.prepare('SELECT COUNT(*) as count FROM dispatch_orders').get();
      const id = `disp-${String(countRow.count + 1).padStart(2, '0')}`;
      const dispatchNumber = `DISP-2026-${String(countRow.count + 1).padStart(3, '0')}`;

      // Normalize items list
      const formattedItems = items.map((i) => ({
        inventoryItemId: i.inventoryItemId || `inv-item-${Date.now().toString(36)}`,
        itemName: i.itemName || 'Solar Component',
        quantity: Number(i.quantity) || 1,
        serialNumbers: Array.isArray(i.serialNumbers) ? i.serialNumbers : [],
        warrantyYears: Number(i.warrantyYears) || 5,
      }));

      // Check if all serials already satisfied
      const allScanned = formattedItems.every((i) => i.serialNumbers.length >= i.quantity);
      const initialStatus = allScanned ? 'READY' : 'PENDING_SERIAL';

      const insert = db.prepare(`
        INSERT INTO dispatch_orders (
          id, dispatchNumber, orderId, customerId, customerName, customerAddress,
          items, status, scheduledDate, createdAt, updatedAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, datetime('now'), datetime('now')
        )
      `);

      insert.run(
        id,
        dispatchNumber,
        orderId || `ord-${Date.now().toString(36)}`,
        customerId,
        custName || 'Customer',
        custAddress || 'Site Address',
        JSON.stringify(formattedItems),
        initialStatus,
        scheduledDate || new Date().toISOString().split('T')[0]
      );

      const created = db.prepare('SELECT * FROM dispatch_orders WHERE id = ?').get(id);
      return res.status(201).json({
        success: true,
        message: `Dispatch order ${dispatchNumber} created successfully.`,
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
   * POST /api/v1/dispatch/validate-serial
   * Anti-Duplicate Pre-Check: Validates whether a barcode/serial number is unique
   * before adding it to a picking list (specified in BACKEND_SPEC.md Section 7)
   */
  validateSerial(req, res, next) {
    try {
      const { serialNumber, dispatchOrderId } = req.body;

      if (!serialNumber || !serialNumber.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Serial number is required for validation.',
        });
      }

      const cleanSerial = serialNumber.trim().toUpperCase();

      // 1. Check against registered warranties in database
      const existingWarranty = db.prepare('SELECT * FROM warranty_records WHERE UPPER(serialNumber) = ?').get(cleanSerial);
      if (existingWarranty) {
        return res.status(200).json({
          success: true,
          valid: false,
          alreadyDispatched: true,
          message: `Duplicate Serial Alert! Serial "${cleanSerial}" is already registered to customer "${existingWarranty.customerName}" (Dispatch: ${existingWarranty.dispatchOrderId || 'N/A'}).`,
          data: {
            valid: false,
            alreadyDispatched: true,
            serialNumber: cleanSerial,
            existingRecord: {
              customerName: existingWarranty.customerName,
              itemName: existingWarranty.itemName,
              dispatchDate: existingWarranty.dispatchDate,
            },
          },
        });
      }

      // 2. Check against other active dispatch orders
      const activeDispatches = db.prepare("SELECT id, dispatchNumber, customerName, items FROM dispatch_orders WHERE status IN ('PENDING_SERIAL', 'READY', 'DISPATCHED')").all();
      for (const disp of activeDispatches) {
        if (dispatchOrderId && disp.id === dispatchOrderId) continue;
        const items = JSON.parse(disp.items || '[]');
        for (const item of items) {
          if (item.serialNumbers && item.serialNumbers.map((s) => s.toUpperCase()).includes(cleanSerial)) {
            return res.status(200).json({
              success: true,
              valid: false,
              alreadyDispatched: true,
              message: `Serial "${cleanSerial}" is already allocated in Dispatch Order "${disp.dispatchNumber}" for "${disp.customerName}".`,
              data: {
                valid: false,
                alreadyDispatched: true,
                serialNumber: cleanSerial,
              },
            });
          }
        }
      }

      return res.status(200).json({
        success: true,
        valid: true,
        alreadyDispatched: false,
        message: `Serial "${cleanSerial}" is valid, unique, and available for assignment.`,
        data: {
          valid: true,
          alreadyDispatched: false,
          serialNumber: cleanSerial,
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
          error: 'Inventory item ID (inventoryItemId) and serial number are required.',
        });
      }

      const cleanSerial = serialNumber.trim().toUpperCase();

      // 1. Strict Anti-Duplicate Validation: Is serial already registered in warranties?
      const existingWarranty = db.prepare('SELECT * FROM warranty_records WHERE UPPER(serialNumber) = ?').get(cleanSerial);
      if (existingWarranty) {
        return res.status(409).json({
          success: false,
          error: `Duplicate Serial Alert! Serial number "${cleanSerial}" is already registered to Customer "${existingWarranty.customerName}" (Dispatch: ${existingWarranty.dispatchOrderId || 'N/A'}).`,
        });
      }

      // 2. Fetch target dispatch order
      const dispatch = db.prepare('SELECT * FROM dispatch_orders WHERE id = ?').get(id);
      if (!dispatch) {
        return res.status(404).json({ success: false, error: 'Dispatch order not found.' });
      }

      const items = JSON.parse(dispatch.items || '[]');
      const targetItem = items.find((i) => i.inventoryItemId === inventoryItemId);

      if (!targetItem) {
        return res.status(400).json({ success: false, error: `Item with ID "${inventoryItemId}" is not part of this dispatch order.` });
      }

      if (!targetItem.serialNumbers) {
        targetItem.serialNumbers = [];
      }

      // Check if serial already scanned within this same dispatch
      if (targetItem.serialNumbers.map((s) => s.toUpperCase()).includes(cleanSerial)) {
        return res.status(409).json({
          success: false,
          error: `Serial number "${cleanSerial}" has already been scanned in this dispatch order.`,
        });
      }

      // Check if serial scanned in another item of this dispatch
      const duplicateInOtherItem = items.some((i) => (i.serialNumbers || []).map((s) => s.toUpperCase()).includes(cleanSerial));
      if (duplicateInOtherItem) {
        return res.status(409).json({
          success: false,
          error: `Serial number "${cleanSerial}" is already assigned to another item in this dispatch order.`,
        });
      }

      // Check quota
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

      const warrantyId = `warr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const warrantyYears = (targetItem && targetItem.warrantyYears) || (invItem && invItem.warrantyYears) || 5;

      const installDate = new Date().toISOString().split('T')[0];
      const expiryDate = new Date(Date.now() + warrantyYears * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const insertWarranty = db.prepare(`
        INSERT INTO warranty_records (
          id, serialNumber, inventoryItemId, itemName, itemCategory, brand, model,
          customerId, customerName, customerPhone, dispatchOrderId, dispatchDate,
          warrantyYears, warrantyExpiryDate, status, installationDate, createdAt, updatedAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, 'ACTIVE', ?, datetime('now'), datetime('now')
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

      const createdWarranty = db.prepare('SELECT * FROM warranty_records WHERE id = ?').get(warrantyId);

      return res.status(200).json({
        success: true,
        message: `Serial number "${cleanSerial}" validated and added. Warranty record created.`,
        dispatchStatus: newStatus,
        scannedCount: targetItem.serialNumbers.length,
        requiredCount: targetItem.quantity,
        warrantyRecord: createdWarranty,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/v1/dispatch/:id/scan
   * Saves verified serial numbers (supports bulk itemsWithSerials or single scan)
   */
  updateScan(req, res, next) {
    try {
      const { id } = req.params;
      const { itemsWithSerials, inventoryItemId, serialNumber } = req.body;

      const dispatch = db.prepare('SELECT * FROM dispatch_orders WHERE id = ?').get(id);
      if (!dispatch) {
        return res.status(404).json({ success: false, error: 'Dispatch order not found.' });
      }

      // Delegate single scan to scanSerial logic if inventoryItemId & serialNumber provided
      if (inventoryItemId && serialNumber) {
        return dispatchController.scanSerial(req, res, next);
      }

      if (!itemsWithSerials || !Array.isArray(itemsWithSerials)) {
        return res.status(400).json({
          success: false,
          error: 'itemsWithSerials array or inventoryItemId/serialNumber is required.',
        });
      }

      const items = JSON.parse(dispatch.items || '[]');
      const cust = db.prepare('SELECT phone FROM customers WHERE id = ?').get(dispatch.customerId);
      const installDate = new Date().toISOString().split('T')[0];

      // Validate each serial
      for (const entry of itemsWithSerials) {
        const targetItem = items.find((i) => i.inventoryItemId === entry.inventoryItemId);
        if (!targetItem) continue;

        if (!targetItem.serialNumbers) targetItem.serialNumbers = [];

        for (const rawSerial of entry.serialNumbers || []) {
          if (!rawSerial) continue;
          const cleanSerial = rawSerial.trim().toUpperCase();

          // Check if already in this item
          if (targetItem.serialNumbers.includes(cleanSerial)) continue;

          // Check anti-duplicate against warranty records
          const existing = db.prepare('SELECT customerName FROM warranty_records WHERE UPPER(serialNumber) = ?').get(cleanSerial);
          if (existing) {
            return res.status(409).json({
              success: false,
              error: `Duplicate Serial Alert! "${cleanSerial}" is already registered to "${existing.customerName}".`,
            });
          }

          targetItem.serialNumbers.push(cleanSerial);

          // Auto-create warranty record
          const invItem = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(entry.inventoryItemId);
          const warrantyYears = targetItem.warrantyYears || (invItem && invItem.warrantyYears) || 5;
          const expiryDate = new Date(Date.now() + warrantyYears * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const warrantyId = `warr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

          db.prepare(`
            INSERT INTO warranty_records (
              id, serialNumber, inventoryItemId, itemName, itemCategory, brand, model,
              customerId, customerName, customerPhone, dispatchOrderId, dispatchDate,
              warrantyYears, warrantyExpiryDate, status, installationDate, createdAt, updatedAt
            ) VALUES (
              ?, ?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?,
              ?, ?, 'ACTIVE', ?, datetime('now'), datetime('now')
            )
          `).run(
            warrantyId,
            cleanSerial,
            entry.inventoryItemId,
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
        }
      }

      const allScanned = items.every((i) => (i.serialNumbers || []).length >= i.quantity);
      const newStatus = allScanned ? 'READY' : 'PENDING_SERIAL';

      db.prepare(`
        UPDATE dispatch_orders 
        SET items = ?, status = ?, updatedAt = datetime('now')
        WHERE id = ?
      `).run(JSON.stringify(items), newStatus, id);

      const updated = db.prepare('SELECT * FROM dispatch_orders WHERE id = ?').get(id);

      return res.status(200).json({
        success: true,
        message: 'Serial numbers updated successfully.',
        data: {
          ...updated,
          items: JSON.parse(updated.items),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/dispatch/:id/status
   * Updates vehicle dispatch status (READY, DISPATCHED, DELIVERED)
   * When status is DISPATCHED:
   * - Deducts warehouse stock for all items
   * - Creates outward stock movement records
   */
  updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, vehicleNumber, driverName } = req.body;

      const current = db.prepare('SELECT * FROM dispatch_orders WHERE id = ?').get(id);
      if (!current) {
        return res.status(404).json({ success: false, error: 'Dispatch order not found.' });
      }

      const nextStatus = status || 'DISPATCHED';

      // If moving to DISPATCHED and not previously dispatched, deduct stock inventory
      if (nextStatus === 'DISPATCHED' && current.status !== 'DISPATCHED' && current.status !== 'DELIVERED') {
        const items = JSON.parse(current.items || '[]');
        for (const item of items) {
          if (item.inventoryItemId && item.quantity > 0) {
            const inv = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(item.inventoryItemId);
            if (inv) {
              const newStock = Math.max(0, inv.currentStock - item.quantity);
              db.prepare("UPDATE inventory_items SET currentStock = ?, updatedAt = datetime('now') WHERE id = ?").run(newStock, inv.id);

              const movId = `mov-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
              db.prepare(`
                INSERT INTO stock_movements (
                  id, inventoryItemId, itemName, movementType, quantity,
                  reason, reference, performedBy, createdAt
                ) VALUES (?, ?, ?, 'OUTWARD', ?, ?, ?, ?, datetime('now'))
              `).run(
                movId,
                inv.id,
                inv.name,
                item.quantity,
                `Dispatch fulfillment for order ${current.dispatchNumber} (Customer: ${current.customerName})`,
                current.dispatchNumber,
                req.user?.name || driverName || 'Warehouse Staff'
              );
            }
          }
        }

        // Update related order stage if exists
        try {
          db.prepare("UPDATE orders SET stage = 'DISPATCHED', updatedAt = datetime('now') WHERE id = ?").run(current.orderId);
        } catch (_) {}
      }

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

      update.run(nextStatus, vehicleNumber || null, driverName || null, nextStatus, nextStatus, id);

      const updated = db.prepare('SELECT * FROM dispatch_orders WHERE id = ?').get(id);

      return res.status(200).json({
        success: true,
        message: `Dispatch order status updated to ${nextStatus}.`,
        data: {
          ...updated,
          items: JSON.parse(updated.items),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/dispatch/:id/complete
   * Alias to mark dispatch complete and vehicle on the road
   */
  markComplete(req, res, next) {
    req.body.status = 'DISPATCHED';
    return dispatchController.updateStatus(req, res, next);
  },

  /**
   * DELETE /api/v1/dispatch/:id
   * Cancels/deletes an un-dispatched order
   */
  deleteDispatch(req, res, next) {
    try {
      const { id } = req.params;
      const current = db.prepare('SELECT * FROM dispatch_orders WHERE id = ?').get(id);

      if (!current) {
        return res.status(404).json({ success: false, error: 'Dispatch order not found.' });
      }

      if (current.status === 'DISPATCHED' || current.status === 'DELIVERED') {
        return res.status(400).json({
          success: false,
          error: `Cannot delete dispatch order in status "${current.status}". It has already been fulfilled.`,
        });
      }

      db.prepare('DELETE FROM dispatch_orders WHERE id = ?').run(id);

      return res.status(200).json({
        success: true,
        message: `Dispatch order ${current.dispatchNumber} deleted successfully.`,
      });
    } catch (err) {
      next(err);
    }
  },
};
