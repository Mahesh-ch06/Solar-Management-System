/**
 * [Member 3] Warehouse Inventory & Stock Movements Controller
 * 
 * Purpose:
 * Tracks warehouse stock for solar panels, inverters, lithium batteries, mounting structures, and cabling.
 * Records inward, outward, adjustment, and return stock movements with complete audit reasons.
 * Provides low-stock threshold alerting and SKU catalog management.
 * 
 * Why in this file?
 * Centralizes inventory management, stock levels, and supply chain tracking for Member 3.
 */

import { db } from '../../db/database.js';

export const inventoryController = {
  /**
   * GET /api/v1/inventory
   * Fetches all inventory catalog items with stock levels, low-stock alerts, and optional category/search filters
   */
  getItems(req, res, next) {
    try {
      const { category, lowStock, search } = req.query;

      let sql = 'SELECT * FROM inventory_items WHERE 1=1';
      const params = [];

      if (category && category !== 'ALL') {
        sql += ' AND category = ?';
        params.push(category);
      }

      if (lowStock === 'true' || lowStock === '1') {
        sql += ' AND currentStock <= lowStockThreshold';
      }

      if (search && search.trim()) {
        const term = `%${search.trim().toLowerCase()}%`;
        sql += ' AND (LOWER(name) LIKE ? OR LOWER(sku) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(model) LIKE ?)';
        params.push(term, term, term, term);
      }

      sql += ' ORDER BY category, name';

      const rows = db.prepare(sql).all(...params);

      // Format items with boolean flags and low-stock indicators
      const items = rows.map((item) => ({
        ...item,
        hasSerialNumbers: Boolean(item.hasSerialNumbers),
        isLowStock: Number(item.currentStock) <= Number(item.lowStockThreshold),
      }));

      const lowStockCount = items.filter((i) => i.isLowStock).length;

      return res.status(200).json({
        success: true,
        count: items.length,
        lowStockCount,
        data: items,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/inventory/:id
   * Fetches single inventory item by ID or SKU
   */
  getItemById(req, res, next) {
    try {
      const { id } = req.params;
      const item = db.prepare('SELECT * FROM inventory_items WHERE id = ? OR UPPER(sku) = UPPER(?)').get(id, id);

      if (!item) {
        return res.status(404).json({ success: false, error: `Inventory item "${id}" not found.` });
      }

      return res.status(200).json({
        success: true,
        data: {
          ...item,
          hasSerialNumbers: Boolean(item.hasSerialNumbers),
          isLowStock: Number(item.currentStock) <= Number(item.lowStockThreshold),
        },
      });
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
          error: 'SKU, item name, brand, and category are required.',
        });
      }

      if (currentStock !== undefined && Number(currentStock) < 0) {
        return res.status(400).json({ success: false, error: 'Current stock cannot be negative.' });
      }
      if (lowStockThreshold !== undefined && Number(lowStockThreshold) < 0) {
        return res.status(400).json({ success: false, error: 'Low stock threshold cannot be negative.' });
      }
      if (unitCostPrice !== undefined && Number(unitCostPrice) < 0) {
        return res.status(400).json({ success: false, error: 'Unit cost price cannot be negative.' });
      }
      if (unitSellingPrice !== undefined && Number(unitSellingPrice) < 0) {
        return res.status(400).json({ success: false, error: 'Unit selling price cannot be negative.' });
      }

      const cleanSku = sku.trim().toUpperCase();
      const existing = db.prepare('SELECT id FROM inventory_items WHERE UPPER(sku) = ?').get(cleanSku);
      if (existing) {
        return res.status(409).json({ success: false, error: `SKU code "${cleanSku}" already exists in inventory.` });
      }

      const id = `inv-item-${Date.now().toString(36)}`;
      const stock = Number(currentStock) || 0;

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
        cleanSku,
        name.trim(),
        brand.trim(),
        model ? model.trim() : '',
        category,
        unit || 'Nos',
        stock,
        Number(lowStockThreshold) || 10,
        Number(unitCostPrice) || 0,
        Number(unitSellingPrice) || 0,
        hasSerialNumbers ? 1 : 0,
        Number(warrantyYears) || 5,
        specifications || '',
        location || 'Main Warehouse'
      );

      // If initial stock > 0, log an initial INWARD stock movement
      if (stock > 0) {
        const movId = `mov-${Date.now().toString(36)}`;
        db.prepare(`
          INSERT INTO stock_movements (
            id, inventoryItemId, itemName, movementType, quantity,
            reason, reference, performedBy, createdAt
          ) VALUES (?, ?, ?, 'INWARD', ?, 'Initial inventory stock receipt', 'INITIAL_STOCK', ?, datetime('now'))
        `).run(movId, id, name.trim(), stock, req.user?.name || 'Warehouse Staff');
      }

      const created = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(id);
      return res.status(201).json({
        success: true,
        message: 'Inventory item created successfully.',
        data: {
          ...created,
          hasSerialNumbers: Boolean(created.hasSerialNumbers),
          isLowStock: Number(created.currentStock) <= Number(created.lowStockThreshold),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/v1/inventory/:id
   * PATCH /api/v1/inventory/:id
   * Updates an existing inventory SKU
   */
  updateItem(req, res, next) {
    try {
      const { id } = req.params;
      const existing = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(id);

      if (!existing) {
        return res.status(404).json({ success: false, error: `Inventory item "${id}" not found.` });
      }

      const {
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

      if (currentStock !== undefined && Number(currentStock) < 0) {
        return res.status(400).json({ success: false, error: 'Current stock cannot be negative.' });
      }
      if (lowStockThreshold !== undefined && Number(lowStockThreshold) < 0) {
        return res.status(400).json({ success: false, error: 'Low stock threshold cannot be negative.' });
      }
      if (unitCostPrice !== undefined && Number(unitCostPrice) < 0) {
        return res.status(400).json({ success: false, error: 'Unit cost price cannot be negative.' });
      }
      if (unitSellingPrice !== undefined && Number(unitSellingPrice) < 0) {
        return res.status(400).json({ success: false, error: 'Unit selling price cannot be negative.' });
      }

      const newCurrentStock = currentStock !== undefined ? Number(currentStock) : existing.currentStock;
      const stockDiff = newCurrentStock - existing.currentStock;

      const update = db.prepare(`
        UPDATE inventory_items SET
          name = COALESCE(?, name),
          brand = COALESCE(?, brand),
          model = COALESCE(?, model),
          category = COALESCE(?, category),
          unit = COALESCE(?, unit),
          currentStock = ?,
          lowStockThreshold = COALESCE(?, lowStockThreshold),
          unitCostPrice = COALESCE(?, unitCostPrice),
          unitSellingPrice = COALESCE(?, unitSellingPrice),
          hasSerialNumbers = COALESCE(?, hasSerialNumbers),
          warrantyYears = COALESCE(?, warrantyYears),
          specifications = COALESCE(?, specifications),
          location = COALESCE(?, location),
          updatedAt = datetime('now')
        WHERE id = ?
      `);

      update.run(
        name !== undefined ? name.trim() : null,
        brand !== undefined ? brand.trim() : null,
        model !== undefined ? model.trim() : null,
        category || null,
        unit || null,
        newCurrentStock,
        lowStockThreshold !== undefined ? Number(lowStockThreshold) : null,
        unitCostPrice !== undefined ? Number(unitCostPrice) : null,
        unitSellingPrice !== undefined ? Number(unitSellingPrice) : null,
        hasSerialNumbers !== undefined ? (hasSerialNumbers ? 1 : 0) : null,
        warrantyYears !== undefined ? Number(warrantyYears) : null,
        specifications !== undefined ? specifications : null,
        location !== undefined ? location : null,
        id
      );

      // If stock level was directly adjusted, create an audit movement log
      if (stockDiff !== 0) {
        const movId = `mov-${Date.now().toString(36)}`;
        db.prepare(`
          INSERT INTO stock_movements (
            id, inventoryItemId, itemName, movementType, quantity,
            reason, reference, performedBy, createdAt
          ) VALUES (?, ?, ?, 'ADJUSTMENT', ?, ?, 'STOCK_EDIT', ?, datetime('now'))
        `).run(
          movId,
          id,
          name || existing.name,
          Math.abs(stockDiff),
          `Manual stock quantity adjustment from ${existing.currentStock} to ${newCurrentStock}`,
          req.user?.name || 'Warehouse Staff'
        );
      }

      const updated = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(id);
      return res.status(200).json({
        success: true,
        message: 'Inventory item updated successfully.',
        data: {
          ...updated,
          hasSerialNumbers: Boolean(updated.hasSerialNumbers),
          isLowStock: Number(updated.currentStock) <= Number(updated.lowStockThreshold),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/v1/inventory/:id
   * Deletes an inventory SKU if not referenced by active dispatch orders or warranties
   */
  deleteItem(req, res, next) {
    try {
      const { id } = req.params;
      const existing = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(id);

      if (!existing) {
        return res.status(404).json({ success: false, error: 'Inventory item not found.' });
      }

      // Check foreign references in warranty_records
      const warrantyCount = db.prepare('SELECT COUNT(*) as count FROM warranty_records WHERE inventoryItemId = ?').get(id);
      if (warrantyCount && warrantyCount.count > 0) {
        return res.status(400).json({
          success: false,
          error: `Cannot delete item "${existing.name}". It is associated with ${warrantyCount.count} registered warranty record(s).`,
        });
      }

      // Check movements
      const movCount = db.prepare('SELECT COUNT(*) as count FROM stock_movements WHERE inventoryItemId = ?').get(id);
      if (movCount && movCount.count > 0) {
        db.prepare('DELETE FROM stock_movements WHERE inventoryItemId = ?').run(id);
      }

      db.prepare('DELETE FROM inventory_items WHERE id = ?').run(id);

      return res.status(200).json({
        success: true,
        message: `Inventory item "${existing.name}" (${existing.sku}) deleted successfully.`,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/inventory/stock-movement
   * POST /api/v1/inventory/movements
   * Records stock inward, dispatch, return, or adjustment and updates quantity
   */
  recordMovement(req, res, next) {
    try {
      const { inventoryItemId, movementType, quantity, reason, reference } = req.body;

      if (!inventoryItemId || !movementType || quantity === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Item ID (inventoryItemId), movement type (INWARD/OUTWARD/ADJUSTMENT/RETURN), and quantity are required.',
        });
      }

      const item = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(inventoryItemId);
      if (!item) {
        return res.status(404).json({ success: false, error: `Inventory item "${inventoryItemId}" not found.` });
      }

      const qty = Number(quantity);
      if (isNaN(qty) || qty < 0) {
        return res.status(400).json({ success: false, error: 'Quantity must be a valid positive number.' });
      }

      let newStock = item.currentStock;

      if (movementType === 'INWARD' || movementType === 'RETURN') {
        newStock += qty;
      } else if (movementType === 'OUTWARD') {
        if (item.currentStock < qty) {
          return res.status(400).json({
            success: false,
            error: `Insufficient stock! Available: ${item.currentStock} ${item.unit}, requested outward: ${qty} ${item.unit}.`,
          });
        }
        newStock -= qty;
      } else if (movementType === 'ADJUSTMENT') {
        newStock = qty;
      } else {
        return res.status(400).json({
          success: false,
          error: `Invalid movement type "${movementType}". Allowed: INWARD, OUTWARD, ADJUSTMENT, RETURN.`,
        });
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
        req.user?.name || 'Warehouse Staff'
      );

      const createdMovement = db.prepare('SELECT * FROM stock_movements WHERE id = ?').get(movId);

      return res.status(200).json({
        success: true,
        message: 'Stock updated successfully.',
        updatedStock: newStock,
        isLowStock: newStock <= item.lowStockThreshold,
        data: createdMovement,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/inventory/:id/adjust
   * Quick adjustment endpoint for single item stock
   */
  adjustItemStock(req, res, next) {
    try {
      const { id } = req.params;
      const { newStock, quantity, movementType = 'ADJUSTMENT', reason, reference } = req.body;

      const item = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(id);
      if (!item) {
        return res.status(404).json({ success: false, error: 'Inventory item not found.' });
      }

      const targetStock = newStock !== undefined ? Number(newStock) : Number(quantity);
      if (isNaN(targetStock)) {
        return res.status(400).json({ success: false, error: 'A valid newStock or quantity value is required.' });
      }

      const diff = targetStock - item.currentStock;

      db.prepare("UPDATE inventory_items SET currentStock = ?, updatedAt = datetime('now') WHERE id = ?").run(targetStock, id);

      const movId = `mov-${Date.now().toString(36)}`;
      db.prepare(`
        INSERT INTO stock_movements (
          id, inventoryItemId, itemName, movementType, quantity,
          reason, reference, performedBy, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        movId,
        id,
        item.name,
        movementType,
        Math.abs(diff),
        reason || `Stock adjusted from ${item.currentStock} to ${targetStock}`,
        reference || 'QUICK-ADJUST',
        req.user?.name || 'Warehouse Staff'
      );

      return res.status(200).json({
        success: true,
        message: `Stock level for "${item.name}" updated to ${targetStock}.`,
        updatedStock: targetStock,
        isLowStock: targetStock <= item.lowStockThreshold,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/inventory/movements/list
   * GET /api/v1/inventory/movements
   * Returns audit history of stock adjustments
   */
  getMovements(req, res, next) {
    try {
      const { itemId, inventoryItemId, limit } = req.query;
      const targetId = inventoryItemId || itemId;

      let sql = 'SELECT * FROM stock_movements';
      const params = [];

      if (targetId) {
        sql += ' WHERE inventoryItemId = ?';
        params.push(targetId);
      }

      sql += ' ORDER BY createdAt DESC';

      const maxLimit = Number(limit) || 100;
      sql += ` LIMIT ${maxLimit}`;

      const movements = db.prepare(sql).all(...params);
      return res.status(200).json({ success: true, count: movements.length, data: movements });
    } catch (err) {
      next(err);
    }
  },
};
