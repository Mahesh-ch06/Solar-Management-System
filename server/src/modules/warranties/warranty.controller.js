/**
 * [Member 3] Warranty Registry Controller
 * 
 * Purpose:
 * Provides instant warranty lookup by component serial number (Inverter, Battery, Solar Panel).
 * Verifies validity period, days remaining, and customer ownership for post-sales maintenance.
 * Monitors expiring warranties within 60-day thresholds.
 * 
 * Why in this file?
 * Centralizes serial-number warranty lookup, certificate verification, and lifecycle tracking for Member 3.
 */

import { db } from '../../db/database.js';

function computeWarrantyStatus(record) {
  const now = new Date();
  const expiry = new Date(record.warrantyExpiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isExpired = daysRemaining <= 0;
  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 60;

  let computedStatus = record.status;
  if (record.status !== 'VOID' && record.status !== 'CLAIMED') {
    if (isExpired) {
      computedStatus = 'EXPIRED';
    } else if (isExpiringSoon) {
      computedStatus = 'EXPIRING_SOON';
    } else {
      computedStatus = 'ACTIVE';
    }
  }

  return {
    ...record,
    status: computedStatus,
    isExpired,
    isExpiringSoon,
    daysRemaining: isExpired ? 0 : daysRemaining,
  };
}

export const warrantyController = {
  /**
   * GET /api/v1/warranties
   * Fetches all registered equipment warranties with dynamic validity calculations
   */
  getWarranties(req, res, next) {
    try {
      const { status, customerId, search } = req.query;

      let sql = 'SELECT * FROM warranty_records WHERE 1=1';
      const params = [];

      if (customerId) {
        sql += ' AND customerId = ?';
        params.push(customerId);
      }

      if (search && search.trim()) {
        const term = `%${search.trim().toLowerCase()}%`;
        sql += ' AND (LOWER(serialNumber) LIKE ? OR LOWER(customerName) LIKE ? OR LOWER(itemName) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(model) LIKE ?)';
        params.push(term, term, term, term, term);
      }

      sql += ' ORDER BY createdAt DESC';

      const rows = db.prepare(sql).all(...params);
      let records = rows.map(computeWarrantyStatus);

      if (status) {
        records = records.filter((r) => r.status.toUpperCase() === status.toUpperCase());
      }

      const activeCount = records.filter((r) => r.status === 'ACTIVE').length;
      const expiringCount = records.filter((r) => r.status === 'EXPIRING_SOON').length;
      const expiredCount = records.filter((r) => r.status === 'EXPIRED').length;

      return res.status(200).json({
        success: true,
        count: records.length,
        summary: {
          active: activeCount,
          expiringSoon: expiringCount,
          expired: expiredCount,
        },
        data: records,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/warranties/verify/:serialNumber
   * GET /api/v1/warranties/lookup/:serialNumber
   * Instant serial number lookup & warranty validity verification
   */
  verifyWarranty(req, res, next) {
    try {
      const { serialNumber } = req.params;
      if (!serialNumber) {
        return res.status(400).json({ success: false, error: 'Serial number parameter is required.' });
      }

      const cleanSerial = serialNumber.trim().toUpperCase();

      // Look for exact match first
      let record = db.prepare('SELECT * FROM warranty_records WHERE UPPER(serialNumber) = ?').get(cleanSerial);

      // If not exact match, check if starts with or contains
      if (!record) {
        record = db.prepare('SELECT * FROM warranty_records WHERE UPPER(serialNumber) LIKE ? LIMIT 1').get(`%${cleanSerial}%`);
      }

      if (!record) {
        return res.status(404).json({
          success: false,
          error: `No warranty record found for serial number "${cleanSerial}". Please verify the label on the equipment or scan barcode.`,
        });
      }

      const processed = computeWarrantyStatus(record);

      return res.status(200).json({
        success: true,
        data: processed,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/warranties/expiring
   * Lists warranties that will expire within the given threshold (default 60 days)
   */
  getExpiringWarranties(req, res, next) {
    try {
      const days = Number(req.query.days) || 60;
      const rows = db.prepare("SELECT * FROM warranty_records WHERE status != 'VOID' ORDER BY warrantyExpiryDate ASC").all();

      const expiring = rows
        .map(computeWarrantyStatus)
        .filter((r) => r.daysRemaining > 0 && r.daysRemaining <= days);

      return res.status(200).json({
        success: true,
        count: expiring.length,
        thresholdDays: days,
        data: expiring,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/warranties
   * Manual warranty registration endpoint
   */
  createWarranty(req, res, next) {
    try {
      const {
        serialNumber,
        inventoryItemId,
        itemName,
        itemCategory,
        brand,
        model,
        customerId,
        customerName,
        customerPhone,
        dispatchOrderId,
        dispatchDate,
        warrantyYears,
        installationDate,
      } = req.body;

      if (!serialNumber || !itemName || !customerId) {
        return res.status(400).json({
          success: false,
          error: 'Serial number, item name, and customer ID are required.',
        });
      }

      const cleanSerial = serialNumber.trim().toUpperCase();

      // Check anti-duplicate
      const existing = db.prepare('SELECT customerName FROM warranty_records WHERE UPPER(serialNumber) = ?').get(cleanSerial);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: `Serial number "${cleanSerial}" is already registered to "${existing.customerName}".`,
        });
      }

      // Fetch customer details if name/phone missing
      let custName = customerName;
      let custPhone = customerPhone;
      if (!custName || !custPhone) {
        const cust = db.prepare('SELECT name, phone FROM customers WHERE id = ?').get(customerId);
        if (cust) {
          custName = custName || cust.name;
          custPhone = custPhone || cust.phone;
        }
      }

      const id = `warr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const years = Number(warrantyYears) || 5;
      const dDate = dispatchDate || new Date().toISOString().split('T')[0];
      const iDate = installationDate || dDate;
      const expiryDate = new Date(new Date(iDate).getTime() + years * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const insert = db.prepare(`
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

      insert.run(
        id,
        cleanSerial,
        inventoryItemId || `inv-manual-${Date.now().toString(36)}`,
        itemName.trim(),
        itemCategory || 'SOLAR_EQUIPMENT',
        brand ? brand.trim() : 'Solar OEM',
        model ? model.trim() : 'Standard',
        customerId,
        custName || 'Customer',
        custPhone || '',
        dispatchOrderId || null,
        dDate,
        years,
        expiryDate,
        iDate
      );

      const created = db.prepare('SELECT * FROM warranty_records WHERE id = ?').get(id);
      return res.status(201).json({
        success: true,
        message: `Warranty record for serial "${cleanSerial}" created successfully.`,
        data: computeWarrantyStatus(created),
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/warranties/:id/status
   * Updates warranty status (ACTIVE, CLAIMED, VOID, EXPIRED)
   */
  updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, error: 'Status is required.' });
      }

      const update = db.prepare(`
        UPDATE warranty_records SET
          status = ?,
          updatedAt = datetime('now')
        WHERE id = ?
      `);

      const result = update.run(status.toUpperCase(), id);
      if (result.changes === 0) {
        return res.status(404).json({ success: false, error: 'Warranty record not found.' });
      }

      const updated = db.prepare('SELECT * FROM warranty_records WHERE id = ?').get(id);
      return res.status(200).json({
        success: true,
        message: `Warranty status updated to ${status}.`,
        data: computeWarrantyStatus(updated),
      });
    } catch (err) {
      next(err);
    }
  },
};
