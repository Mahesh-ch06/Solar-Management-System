/**
 * [Member 2] Quotations, Auto-BOM & Orders Controller
 * 
 * Purpose:
 * Computes pricing, solar equipment Bill of Materials (BOM), PM Surya Ghar subsidies,
 * and handles customer quotation acceptance into confirmed orders.
 * 
 * Why in this file?
 * Centralizes commercial quotation generation and order conversion for Member 2.
 */

import { db } from '../../db/database.js';

export const quotationController = {
  /**
   * GET /api/v1/quotations
   * Fetches all quotations with parsed BOM lines
   */
  getQuotations(req, res, next) {
    try {
      const rows = db.prepare('SELECT * FROM quotations ORDER BY createdAt DESC').all();
      const quotations = rows.map((q) => ({
        ...q,
        bomLines: q.bomLines ? JSON.parse(q.bomLines) : [],
      }));
      return res.status(200).json({ success: true, data: quotations });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/quotations/:id
   * Fetches single quotation with parsed BOM
   */
  getQuotationById(req, res, next) {
    try {
      const { id } = req.params;
      const q = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id);

      if (!q) {
        return res.status(404).json({ success: false, error: 'Quotation not found.' });
      }

      return res.status(200).json({
        success: true,
        data: {
          ...q,
          bomLines: q.bomLines ? JSON.parse(q.bomLines) : [],
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/quotations
   * Generates and stores a new quotation
   */
  createQuotation(req, res, next) {
    try {
      const {
        customerId,
        customerName,
        capacityKW,
        systemType,
        panelModel,
        panelCount,
        inverterModel,
        inverterCount,
        batteryModel,
        batteryCount,
        bomLines,
        baseAmount,
        gstAmount,
        subsidyAmount,
        totalAmount,
        grossMarginPercent,
        validUntil,
      } = req.body;

      if (!customerId || !capacityKW || !totalAmount) {
        return res.status(400).json({
          success: false,
          error: 'Customer ID, system capacity, and total amount are required.',
        });
      }

      const countRow = db.prepare('SELECT COUNT(*) as count FROM quotations').get();
      const id = `quote-${String(countRow.count + 1).padStart(2, '0')}`;
      const quotationNumber = `QT-2026-${String(countRow.count + 1).padStart(3, '0')}`;

      let resolvedCustomerName = customerName;
      if (!resolvedCustomerName) {
        const cust = db.prepare('SELECT name FROM customers WHERE id = ?').get(customerId);
        resolvedCustomerName = cust ? cust.name : 'Valued Customer';
      }

      const insert = db.prepare(`
        INSERT INTO quotations (
          id, quotationNumber, customerId, customerName, capacityKW, systemType,
          panelModel, panelCount, inverterModel, inverterCount, batteryModel, batteryCount,
          bomLines, baseAmount, gstAmount, subsidyAmount, totalAmount, grossMarginPercent,
          validUntil, status, createdAt, updatedAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, 'SENT', datetime('now'), datetime('now')
        )
      `);

      insert.run(
        id,
        quotationNumber,
        customerId,
        resolvedCustomerName,
        Number(capacityKW),
        systemType || 'ON_GRID',
        panelModel || 'Adani Solar 540W Mono PERC Half-Cut Module',
        Number(panelCount) || 10,
        inverterModel || 'Growatt MIN 5000TL-X 5kW Inverter',
        Number(inverterCount) || 1,
        batteryModel || null,
        Number(batteryCount) || 0,
        JSON.stringify(bomLines || []),
        Number(baseAmount) || 0,
        Number(gstAmount) || 0,
        Number(subsidyAmount) || 0,
        Number(totalAmount),
        Number(grossMarginPercent) || 25,
        validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );

      // Advance customer status to QUOTATION_SENT
      db.prepare(`
        UPDATE customers 
        SET status = 'QUOTATION_SENT', updatedAt = datetime('now')
        WHERE id = ? AND status != 'CONVERTED'
      `).run(customerId);

      const created = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id);
      return res.status(201).json({
        success: true,
        data: {
          ...created,
          bomLines: JSON.parse(created.bomLines),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/quotations/:id/confirm-order
   * Customer accepts quote -> Converts to Confirmed Order in orders table
   */
  confirmOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { advanceReceived } = req.body;

      const quotation = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id);
      if (!quotation) {
        return res.status(404).json({ success: false, error: 'Quotation not found.' });
      }

      // Mark quote as ACCEPTED
      db.prepare("UPDATE quotations SET status = 'ACCEPTED', updatedAt = datetime('now') WHERE id = ?").run(id);

      // Check if order already exists for this quotation
      const existingOrder = db.prepare('SELECT id FROM orders WHERE quotationId = ?').get(id);
      if (existingOrder) {
        return res.status(409).json({ success: false, error: 'Order already created for this quotation.' });
      }

      const orderCountRow = db.prepare('SELECT COUNT(*) as count FROM orders').get();
      const orderId = `ord-${String(orderCountRow.count + 1).padStart(2, '0')}`;
      const orderNumber = `ORD-2026-${String(orderCountRow.count + 1).padStart(3, '0')}`;

      const advance = Number(advanceReceived) || Math.round(quotation.totalAmount * 0.2); // Default 20% advance
      const balance = quotation.totalAmount - advance;
      const paymentStatus = balance <= 0 ? 'PAID' : advance > 0 ? 'PARTIALLY_PAID' : 'UNPAID';

      const insertOrder = db.prepare(`
        INSERT INTO orders (
          id, orderNumber, quotationId, customerId, customerName, capacityKW,
          totalAmount, advanceReceived, balanceDue, paymentStatus, stage,
          createdAt, updatedAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, 'ORDER_CONFIRMED',
          datetime('now'), datetime('now')
        )
      `);

      insertOrder.run(
        orderId,
        orderNumber,
        quotation.id,
        quotation.customerId,
        quotation.customerName,
        quotation.capacityKW,
        quotation.totalAmount,
        advance,
        balance,
        paymentStatus
      );

      // Mark Customer as CONVERTED
      db.prepare("UPDATE customers SET status = 'CONVERTED', updatedAt = datetime('now') WHERE id = ?").run(quotation.customerId);

      const createdOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
      return res.status(201).json({
        success: true,
        message: 'Quotation confirmed! Order successfully created.',
        order: createdOrder,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/orders
   * Lists all confirmed orders
   */
  getOrders(req, res, next) {
    try {
      const orders = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all();
      return res.status(200).json({ success: true, data: orders });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/orders/:id
   * Fetches single order
   */
  getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);

      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found.' });
      }

      return res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  },
};

