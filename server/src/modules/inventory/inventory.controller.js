/**
 * [Member 3] Warehouse Inventory & Stock Movements Controller
 * 
 * Purpose:
 * Tracks warehouse stock for solar panels, inverters, lithium batteries, mounting structures, and cabling.
 * Records inward and outward stock movements with audit reasons.
 * 
 * Why in this file?
 * Centralizes inventory and supply chain tracking for Member 3.
 */

import { db } from '../../db/database.js';

export const inventoryController = {
  /**
   * GET /api/v1/inventory
   * Fetches all inventory catalog items with stock levels
   */
  getItems(req, res, next) {
    try {
      const items = db.prepare('SELECT * FROM inventory_items ORDER BY category, name').all();
      return res.status(200).json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/inventory/:id
   * Fetches single inventory item
   */
  getItemById(req, res, next) {
    try {
      const { id } = req.params;
      const item = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(id);

      if (!item) {
        return res.status(404).json({ success: false, error: 'Inventory item not found.' });
      }

      return res.status(200).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/inventory
   * Creates a new inventory SKU
   */
  createItem(req, res, next) {
    try {
      const {
        sku,
        name,
        brand,
        model,
        category,
        unit,
        currentStock,
        lowStockThreshold,
        unitCostPrice,
        unitSellingPrice,
        hasSerialNumbers,
        warrantyYears,
        specifications,
        location,
      } = req.body;

      if (!sku || !name || !brand || !category) {
        return res.status(400).json({
          success: false,
          error: 'SKU, name, brand, and category are required.',
        });
      }

      const existing = db.prepare('SELECT id FROM inventory_items WHERE LOWER(sku) = LOWER(?)').get(sku.trim());
      if (existing) {
        return res.status(409).json({ success: false, error: 'SKU code already exists in inventory.' });
      }

      const id = `inv-item-${Date.now().toString(36)}`;

      const insert = db.prepare(`
        INSERT INTO inventory_items (
          id, sku, name, brand, model, category, unit,
          currentStock, lowStockThreshold, unitCostPrice, unitSellingPrice,
          hasSerialNumbers, warrantyYears, specifications, location,
          createdAt, updatedAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          datetime('now'), datetime('now')
        )
      `);

      insert.run(
        id,
        sku.trim().toUpperCase(),
        name.trim(),
        brand.trim(),
        model ? model.trim() : '',
        category,
        unit || 'Nos',
        Number(currentStock) || 0,
        Number(lowStockThreshold) || 10,
        Number(unitCostPrice) || 0,
        Number(unitSellingPrice) || 0,
        hasSerialNumbers ? 1 : 0,
        Number(warrantyYears) || 5,
        specifications || '',
        location || 'Main Warehouse'
      );

      const created = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(id);
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/inventory/stock-movement
   * Records stock inward, dispatch, or adjustment and updates quantity
   */
  recordMovement(req, res, next) {
    try {
      const { inventoryItemId, movementType, quantity, reason, reference } = req.body;

      if (!inventoryItemId || !movementType || !quantity) {
        return res.status(400).json({
          success: false,
          error: 'Item ID, movement type (INWARD/OUTWARD/ADJUSTMENT/RETURN), and quantity are required.',
        });
      }

      const item = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(inventoryItemId);
      if (!item) {
        return res.status(404).json({ success: false, error: 'Inventory item not found.' });
      }

      const qty = Number(quantity);
      let newStock = item.currentStock;

      if (movementType === 'INWARD' || movementType === 'RETURN') {
        newStock += qty;
      } else if (movementType === 'OUTWARD') {
        if (item.currentStock < qty) {
          return res.status(400).json({
            success: false,
            error: `Insufficient stock! Available: ${item.currentStock}, requested: ${qty}`,
          });
        }
        newStock -= qty;
      } else if (movementType === 'ADJUSTMENT') {
        newStock = qty;
      }

      // Update inventory stock level
      db.prepare("UPDATE inventory_items SET currentStock = ?, updatedAt = datetime('now') WHERE id = ?").run(newStock, item.id);

      // Record movement log
      const movId = `mov-${Date.now().toString(36)}`;
      const insertMovement = db.prepare(`
        INSERT INTO stock_movements (
          id, inventoryItemId, itemName, movementType, quantity,
          reason, reference, performedBy, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);

      insertMovement.run(
        movId,
        item.id,
        item.name,
        movementType,
        qty,
        reason || 'Manual inventory movement',
        reference || 'MANUAL-ADJ',
        req.user.name
      );

      return res.status(200).json({
        success: true,
        message: 'Stock updated successfully.',
        updatedStock: newStock,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/inventory/movements/list
   * Returns audit history of stock adjustments
   */
  getMovements(req, res, next) {
    try {
      const movements = db.prepare('SELECT * FROM stock_movements ORDER BY createdAt DESC LIMIT 100').all();
      return res.status(200).json({ success: true, data: movements });
    } catch (err) {
      next(err);
    }
  },
};

