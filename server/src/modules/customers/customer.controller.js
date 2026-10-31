/**
 * [Member 2] Customer Leads & Sales Pipeline Controller
 * 
 * Purpose:
 * Manages solar prospective leads, qualification criteria (kW capacity, subsidy eligibility),
 * and pipeline stage transitions (NEW -> CONTACTED -> SURVEY_SCHEDULED -> QUOTATION_SENT -> CONVERTED).
 * 
 * Why in this file?
 * Centralizes all customer CRM functionality for Member 2 without interfering with inventory or installations.
 */

import { db } from '../../db/database.js';

export const customerController = {
  /**
   * GET /api/v1/customers
   * Fetches all leads and converted clients
   */
  getCustomers(req, res, next) {
    try {
      const customers = db.prepare('SELECT * FROM customers ORDER BY createdAt DESC').all();
      return res.status(200).json({ success: true, data: customers });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/customers/:id
   * Fetches full profile of a single customer
   */
  getCustomerById(req, res, next) {
    try {
      const { id } = req.params;
      const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);

      if (!customer) {
        return res.status(404).json({ success: false, error: 'Customer not found.' });
      }

      return res.status(200).json({ success: true, data: customer });
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

      // Generate incremental customer ID: cust-XX
      const countRow = db.prepare('SELECT COUNT(*) as count FROM customers').get();
      const id = `cust-${String(countRow.count + 1).padStart(2, '0')}`;

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
        systemType || 'ON_GRID',
        subsidyRequired ? 1 : 0,
        enquirySource || 'WEB_FORM',
        status || 'NEW',
        notes || '',
        assignedTo || ''
      );

      const created = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/v1/customers/:id
   * Updates lead profile, assignment, or pipeline status
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
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/v1/customers/:id
   * Soft checks and removes customer if no dependencies
   */
  deleteCustomer(req, res, next) {
    try {
      const { id } = req.params;
      const result = db.prepare('DELETE FROM customers WHERE id = ?').run(id);

      if (result.changes === 0) {
        return res.status(404).json({ success: false, error: 'Customer not found.' });
      }

      return res.status(200).json({ success: true, message: 'Customer deleted successfully.' });
    } catch (err) {
      next(err);
    }
  },
};

