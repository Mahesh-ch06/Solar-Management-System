/**
 * [Member 2] Customer Leads & Sales Pipeline Controller
 * 
 * Purpose:
 * Manages solar prospective leads, qualification criteria (kW capacity, subsidy eligibility),
 * and pipeline stage transitions (NEW -> CONTACTED -> SURVEY_SCHEDULED -> QUOTATION_SENT -> CONVERTED -> CLOSED_LOST).
 * 
 * Why in this file?
 * Centralizes all customer CRM functionality for Member 2 without interfering with inventory or installations.
 */

import { db } from '../../db/database.js';

export const customerController = {
  /**
   * GET /api/v1/customers
   * Fetches all leads and converted clients with optional search and status filtering
   */
  getCustomers(req, res, next) {
    try {
      const { search, status, assignedTo } = req.query;

      let sql = 'SELECT * FROM customers WHERE 1=1';
      const params = [];

      if (status) {
        sql += ' AND status = ?';
        params.push(status);
      }

      if (assignedTo) {
        sql += ' AND assignedTo = ?';
        params.push(assignedTo);
      }

      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR city LIKE ?)';
        params.push(term, term, term, term);
      }

      sql += ' ORDER BY createdAt DESC';

      const customers = db.prepare(sql).all(...params);
      return res.status(200).json({
        success: true,
        count: customers.length,
        data: customers,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/customers/:id
   * Fetches full profile of a single customer, including linked surveys and quotations
   */
  getCustomerById(req, res, next) {
    try {
      const { id } = req.params;
      const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);

      if (!customer) {
        return res.status(404).json({ success: false, error: 'Customer not found.' });
      }

      // Fetch associated surveys
      const surveys = db.prepare('SELECT * FROM surveys WHERE customerId = ? ORDER BY createdAt DESC').all(id);

      // Fetch associated quotations
      const rawQuotations = db.prepare('SELECT * FROM quotations WHERE customerId = ? ORDER BY createdAt DESC').all(id);
      const quotations = rawQuotations.map((q) => ({
        ...q,
        bomLines: q.bomLines ? JSON.parse(q.bomLines) : [],
      }));

      // Fetch associated orders
      const orders = db.prepare('SELECT * FROM orders WHERE customerId = ? ORDER BY createdAt DESC').all(id);

      return res.status(200).json({
        success: true,
        data: {
          ...customer,
          surveys,
          quotations,
          orders,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/customers
   * Registers a new lead from web enquiry, phone call, or referral
   */
  createCustomer(req, res, next) {
    try {
      const {
        id: customId,
        name,
        phone,
        email,
        address,
        city,
        pincode,
        monthlyBill,
        requiredCapacityKW,
        systemType,
        subsidyRequired,
        enquirySource,
        notes,
        assignedTo,
        status,
      } = req.body;

      if (!name || !phone || !address || !city || !pincode) {
        return res.status(400).json({
          success: false,
          error: 'Name, phone, address, city, and pincode are required.',
        });
      }

      // Determine customer ID
      let id = customId;
      if (!id) {
        const rows = db.prepare("SELECT id FROM customers WHERE id LIKE 'cust-%'").all();
        let maxId = 0;
        for (const r of rows) {
          const num = parseInt(r.id.replace('cust-', ''), 10);
          if (!isNaN(num) && num > maxId) {
            maxId = num;
          }
        }
        id = `cust-${String(maxId + 1).padStart(2, '0')}`;
      } else {
        // Check if custom ID already exists
        const exists = db.prepare('SELECT id FROM customers WHERE id = ?').get(id);
        if (exists) {
          return res.status(409).json({ success: false, error: `Customer with ID ${id} already exists.` });
        }
      }

      const validSystemTypes = ['ON_GRID', 'OFF_GRID', 'HYBRID'];
      const resolvedSystemType = validSystemTypes.includes(systemType) ? systemType : 'ON_GRID';

      const validStatuses = ['NEW', 'CONTACTED', 'SURVEY_SCHEDULED', 'QUOTATION_SENT', 'CONVERTED', 'CLOSED_LOST'];
      const resolvedStatus = validStatuses.includes(status) ? status : 'NEW';

      const insert = db.prepare(`
        INSERT INTO customers (
          id, name, phone, email, address, city, pincode,
          monthlyBill, requiredCapacityKW, systemType, subsidyRequired,
          enquirySource, status, notes, assignedTo, createdAt, updatedAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, datetime('now'), datetime('now')
        )
      `);

      insert.run(
        id,
        name.trim(),
        phone.trim(),
        email ? email.trim() : '',
        address.trim(),
        city.trim(),
        pincode.trim(),
        Number(monthlyBill) || 0,
        Number(requiredCapacityKW) || 1,
        resolvedSystemType,
        subsidyRequired === false || subsidyRequired === 0 ? 0 : 1,
        enquirySource || 'WEB_FORM',
        resolvedStatus,
        notes ? notes.trim() : '',
        assignedTo ? assignedTo.trim() : ''
      );

      const created = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
      return res.status(201).json({
        success: true,
        message: 'Customer lead registered successfully.',
        data: created,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT or PATCH /api/v1/customers/:id
   * Updates lead profile, assignment, or technical requirements
   */
  updateCustomer(req, res, next) {
    try {
      const { id } = req.params;
      const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);

      if (!existing) {
        return res.status(404).json({ success: false, error: 'Customer not found.' });
      }

      const {
        name,
        phone,
        email,
        address,
        city,
        pincode,
        monthlyBill,
        requiredCapacityKW,
        systemType,
        subsidyRequired,
        enquirySource,
        status,
        notes,
        assignedTo,
      } = req.body;

      if (systemType && !['ON_GRID', 'OFF_GRID', 'HYBRID'].includes(systemType)) {
        return res.status(400).json({ success: false, error: 'Invalid systemType. Must be ON_GRID, OFF_GRID, or HYBRID.' });
      }

      if (status && !['NEW', 'CONTACTED', 'SURVEY_SCHEDULED', 'QUOTATION_SENT', 'CONVERTED', 'CLOSED_LOST'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid pipeline status.' });
      }

      const update = db.prepare(`
        UPDATE customers SET
          name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          address = COALESCE(?, address),
          city = COALESCE(?, city),
          pincode = COALESCE(?, pincode),
          monthlyBill = COALESCE(?, monthlyBill),
          requiredCapacityKW = COALESCE(?, requiredCapacityKW),
          systemType = COALESCE(?, systemType),
          subsidyRequired = COALESCE(?, subsidyRequired),
          enquirySource = COALESCE(?, enquirySource),
          status = COALESCE(?, status),
          notes = COALESCE(?, notes),
          assignedTo = COALESCE(?, assignedTo),
          updatedAt = datetime('now')
        WHERE id = ?
      `);

      update.run(
        name !== undefined ? name.trim() : null,
        phone !== undefined ? phone.trim() : null,
        email !== undefined ? email.trim() : null,
        address !== undefined ? address.trim() : null,
        city !== undefined ? city.trim() : null,
        pincode !== undefined ? pincode.trim() : null,
        monthlyBill !== undefined ? Number(monthlyBill) : null,
        requiredCapacityKW !== undefined ? Number(requiredCapacityKW) : null,
        systemType !== undefined ? systemType : null,
        subsidyRequired !== undefined ? (subsidyRequired ? 1 : 0) : null,
        enquirySource !== undefined ? enquirySource : null,
        status !== undefined ? status : null,
        notes !== undefined ? notes : null,
        assignedTo !== undefined ? assignedTo : null,
        id
      );

      const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
      return res.status(200).json({
        success: true,
        message: 'Customer details updated successfully.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/customers/:id/status
   * Dedicated endpoint to transition customer pipeline stage
   */
  updateCustomerStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['NEW', 'CONTACTED', 'SURVEY_SCHEDULED', 'QUOTATION_SENT', 'CONVERTED', 'CLOSED_LOST'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
      }

      const existing = db.prepare('SELECT id FROM customers WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Customer not found.' });
      }

      db.prepare(`
        UPDATE customers SET
          status = ?,
          updatedAt = datetime('now')
        WHERE id = ?
      `).run(status, id);

      const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
      return res.status(200).json({
        success: true,
        message: `Customer pipeline status updated to ${status}.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/v1/customers/:id
   * Soft-checks dependencies before removing customer to maintain relational integrity
   */
  deleteCustomer(req, res, next) {
    try {
      const { id } = req.params;

      const existing = db.prepare('SELECT id, name FROM customers WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Customer not found.' });
      }

      // Check for related records in surveys, quotations, or orders
      const surveyCount = db.prepare('SELECT COUNT(*) as count FROM surveys WHERE customerId = ?').get(id);
      const quotationCount = db.prepare('SELECT COUNT(*) as count FROM quotations WHERE customerId = ?').get(id);
      const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE customerId = ?').get(id);

      if (surveyCount.count > 0 || quotationCount.count > 0 || orderCount.count > 0) {
        return res.status(409).json({
          success: false,
          error: `Cannot delete customer "${existing.name}". Linked records exist (${surveyCount.count} surveys, ${quotationCount.count} quotations, ${orderCount.count} orders).`,
        });
      }

      db.prepare('DELETE FROM customers WHERE id = ?').run(id);

      return res.status(200).json({
        success: true,
        message: 'Customer deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  },
};
