/**
 * [Member 3] Warranty Registry Controller
 * 
 * Purpose:
 * Provides instant warranty lookup by component serial number (Inverter, Battery, Solar Panel).
 * Verifies validity period and customer ownership for post-sales maintenance.
 * 
 * Why in this file?
 * Keeps serial-number warranty lookup separated from daily warehouse operations.
 */

import { db } from '../../db/database.js';

export const warrantyController = {
  /**
   * GET /api/v1/warranties
   * Fetches all registered equipment warranties
   */
  getWarranties(req, res, next) {
    try {
      const records = db.prepare('SELECT * FROM warranty_records ORDER BY createdAt DESC').all();
      return res.status(200).json({ success: true, data: records });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/warranties/verify/:serialNumber
   * Instant serial number lookup
   */
  verifyWarranty(req, res, next) {
    try {
      const { serialNumber } = req.params;
      const cleanSerial = serialNumber.trim().toUpperCase();

      const record = db.prepare('SELECT * FROM warranty_records WHERE UPPER(serialNumber) = ?').get(cleanSerial);

      if (!record) {
        return res.status(404).json({
          success: false,
          error: `No warranty record found for serial number "${cleanSerial}". Please verify the label on the equipment.`,
        });
      }

      const today = new Date();
      const expiry = new Date(record.warrantyExpiryDate);
      const isExpired = today > expiry;

      return res.status(200).json({
        success: true,
        data: {
          ...record,
          isExpired,
          status: isExpired ? 'EXPIRED' : record.status,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

