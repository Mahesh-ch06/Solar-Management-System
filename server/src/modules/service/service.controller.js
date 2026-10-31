/**
 * [Member 4] Post-Sales Service & Maintenance Tickets Controller
 * 
 * Purpose:
 * Handles solar plant maintenance requests (inverter grid error codes, roof leakage, panel shading).
 * Links complaints with warranty records and technician dispatch.
 * 
 * Why in this file?
 * Separates warranty repair complaints from field installation work.
 */

import { db } from '../../db/database.js';

export const serviceController = {
  /**
   * GET /api/v1/service-tickets
   * Lists all service complaint tickets
   */
  getTickets(req, res, next) {
    try {
      const tickets = db.prepare('SELECT * FROM service_tickets ORDER BY createdAt DESC').all();
      return res.status(200).json({ success: true, data: tickets });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/service-tickets/:id
   * Fetches single ticket details
   */
  getTicketById(req, res, next) {
    try {
      const { id } = req.params;
      const ticket = db.prepare('SELECT * FROM service_tickets WHERE id = ?').get(id);

      if (!ticket) {
        return res.status(404).json({ success: false, error: 'Service ticket not found.' });
      }

      return res.status(200).json({ success: true, data: ticket });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/service-tickets
   * Submits a new customer service request
   */
  createTicket(req, res, next) {
    try {
      const {
        customerId,
        customerName,
        customerPhone,
        serialNumber,
        issueCategory,
        priority,
        description,
        faultCode,
      } = req.body;

      if (!customerId || !description) {
        return res.status(400).json({
          success: false,
          error: 'Customer ID and fault description are required.',
        });
      }

      const countRow = db.prepare('SELECT COUNT(*) as count FROM service_tickets').get();
      const id = `tkt-${String(countRow.count + 1).padStart(2, '0')}`;
      const ticketNumber = `TKT-2026-${String(countRow.count + 1).padStart(3, '0')}`;

      // Auto-check warranty if serial provided
      let warrantyRecordId = null;
      let isUnderWarranty = 1;

      if (serialNumber) {
        const warranty = db.prepare('SELECT id, warrantyExpiryDate FROM warranty_records WHERE UPPER(serialNumber) = ?').get(serialNumber.trim().toUpperCase());
        if (warranty) {
          warrantyRecordId = warranty.id;
          isUnderWarranty = new Date() <= new Date(warranty.warrantyExpiryDate) ? 1 : 0;
        }
      }

      let resolvedCustomerName = customerName;
      let resolvedPhone = customerPhone;

      if (!resolvedCustomerName || !resolvedPhone) {
        const cust = db.prepare('SELECT name, phone FROM customers WHERE id = ?').get(customerId);
        if (cust) {
          resolvedCustomerName = resolvedCustomerName || cust.name;
          resolvedPhone = resolvedPhone || cust.phone;
        }
      }

      const insert = db.prepare(`
        INSERT INTO service_tickets (
          id, ticketNumber, customerId, customerName, customerPhone,
          serialNumber, warrantyRecordId, isUnderWarranty, faultCode,
          faultDescription, priority, status, createdAt, updatedAt
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, 'OPEN', datetime('now'), datetime('now')
        )
      `);

      insert.run(
        id,
        ticketNumber,
        customerId,
        resolvedCustomerName || 'Customer',
        resolvedPhone || '',
        serialNumber ? serialNumber.trim().toUpperCase() : null,
        warrantyRecordId,
        isUnderWarranty,
        faultCode || null,
        description.trim(),
        priority || 'MEDIUM'
      );

      const created = db.prepare('SELECT * FROM service_tickets WHERE id = ?').get(id);
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/service-tickets/:id/status
   * Updates ticket lifecycle (ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED)
   */
  updateTicketStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, assignedTechnicianId, assignedTechnicianName, resolutionNotes } = req.body;

      const isResolved = status === 'RESOLVED' || status === 'CLOSED';

      const update = db.prepare(`
        UPDATE service_tickets SET
          status = COALESCE(?, status),
          assignedTechnicianId = COALESCE(?, assignedTechnicianId),
          assignedTechnicianName = COALESCE(?, assignedTechnicianName),
          resolutionNotes = COALESCE(?, resolutionNotes),
          resolvedAt = CASE WHEN ? = 1 THEN datetime('now') ELSE resolvedAt END,
          updatedAt = datetime('now')
        WHERE id = ?
      `);

      const result = update.run(
        status || null,
        assignedTechnicianId || null,
        assignedTechnicianName || null,
        resolutionNotes || null,
        isResolved ? 1 : 0,
        id
      );

      if (result.changes === 0) {
        return res.status(404).json({ success: false, error: 'Service ticket not found.' });
      }

      const updated = db.prepare('SELECT * FROM service_tickets WHERE id = ?').get(id);
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
};

