/**
 * [Member 2] Quotations, Auto-BOM & Orders Controller
 * 
 * Purpose:
 * Computes engineering Bill of Materials (BOM), solar equipment pricing,
 * PM Surya Ghar DBT subsidies, and handles customer quotation acceptance into confirmed orders.
 * 
 * Why in this file?
 * Centralizes commercial quotation generation and order conversion for Member 2.
 */

import { db } from '../../db/database.js';

/**
 * Automated Solar BOM and Pricing Generator
 * Generates equipment lines, standard pricing, GST, and PM Surya Ghar government subsidy
 */
function generateAutoBOM(capacityKW, systemType = 'ON_GRID', customSubsidy = null) {
  const kw = Math.max(1, Number(capacityKW) || 1);
  const isOffGrid = systemType === 'OFF_GRID';
  const isHybrid = systemType === 'HYBRID';

  // 1. Solar Panels (540W Mono PERC Half-Cut Module)
  const panelWattage = 540;
  const panelCount = Math.ceil((kw * 1000) / panelWattage);
  const panelRate = 17000;
  const panelModel = 'Adani Solar 540W Mono PERC Half-Cut Module';

  // 2. Inverter selection based on kW capacity
  let inverterModel = 'Growatt MIN 5000TL-X 5kW Single-Phase On-Grid Inverter';
  let inverterRate = 44000;
  if (kw <= 1) {
    inverterModel = 'Growatt MIN 2500TL-X 1kW Single-Phase On-Grid Inverter';
    inverterRate = 18500;
  } else if (kw <= 2) {
    inverterModel = 'Growatt MIN 3000TL-X 2kW Single-Phase On-Grid Inverter';
    inverterRate = 22000;
  } else if (kw <= 3) {
    inverterModel = 'Solis S6-GR1P3K 3kW Dual MPPT On-Grid Inverter';
    inverterRate = 28500;
  } else if (kw <= 4) {
    inverterModel = 'Growatt MIN 4000TL-X 4kW Single-Phase On-Grid Inverter';
    inverterRate = 35000;
  } else if (kw <= 5) {
    inverterModel = 'Growatt MIN 5000TL-X 5kW Single-Phase On-Grid Inverter';
    inverterRate = 44000;
  } else {
    inverterModel = 'Huawei SUN2000-10KTL-M1 10kW Three-Phase Hybrid Inverter';
    inverterRate = 88000;
  }
  const inverterCount = 1;

  // 3. Battery (for Off-Grid / Hybrid)
  let batteryModel = null;
  let batteryCount = 0;
  let batteryRate = 0;
  if (isOffGrid || isHybrid) {
    batteryModel = 'Livguard Solar LFP 5.12kWh Lithium Battery Pack';
    batteryCount = Math.max(1, Math.round(kw / 2));
    batteryRate = 96000;
  }

  // Compile BOM line items
  const bomLines = [
    {
      itemName: `${panelModel} (${panelWattage}W)`,
      category: 'Solar Panels',
      quantity: panelCount,
      unit: 'Nos',
      rate: panelRate,
      amount: panelCount * panelRate,
    },
    {
      itemName: inverterModel,
      category: 'Inverter',
      quantity: inverterCount,
      unit: 'Nos',
      rate: inverterRate,
      amount: inverterCount * inverterRate,
    },
    {
      itemName: 'HDG Mounting Structure & Fasteners (Hot-Dip Galvanized)',
      category: 'Mounting Structure',
      quantity: Math.ceil(panelCount / 4),
      unit: 'Sets',
      rate: 5500,
      amount: Math.ceil(panelCount / 4) * 5500,
    },
    {
      itemName: 'Polycab 4 sq.mm UV Resistant Solar DC Cable',
      category: 'Cabling',
      quantity: kw * 20,
      unit: 'Meters',
      rate: 62,
      amount: kw * 20 * 62,
    },
    {
      itemName: '6 sq.mm AC Power Interconnection Cable',
      category: 'Cabling',
      quantity: 20,
      unit: 'Meters',
      rate: 55,
      amount: 20 * 55,
    },
    {
      itemName: 'MC4 Solar Connectors (IP68 Weatherproof)',
      category: 'Connectors',
      quantity: panelCount * 2,
      unit: 'Pairs',
      rate: 120,
      amount: panelCount * 2 * 120,
    },
    {
      itemName: 'ACDB & DCDB Surge Protection & Earthing Kit',
      category: 'Switchgear',
      quantity: 1,
      unit: 'Set',
      rate: 12500,
      amount: 12500,
    },
    {
      itemName: 'Dual Chemical Copper Earthing Electrodes & Lightning Arrester',
      category: 'Safety & Protection',
      quantity: 1,
      unit: 'Set',
      rate: 6300,
      amount: 6300,
    },
  ];

  if (!isOffGrid) {
    bomLines.push({
      itemName: 'Net Metering Liaison & State DISCOM Feasibility Filing',
      category: 'Utility Liaison',
      quantity: 1,
      unit: 'Job',
      rate: 5000,
      amount: 5000,
    });
  }

  if (isOffGrid || isHybrid) {
    bomLines.push({
      itemName: `${batteryModel} (51.2V 100Ah)`,
      category: 'Battery Energy Storage',
      quantity: batteryCount,
      unit: 'Sets',
      rate: batteryRate,
      amount: batteryCount * batteryRate,
    });
  }

  // Turnkey Installation & Commissioning Service
  const installCost = kw <= 2 ? 10000 : kw <= 3 ? 14000 : kw <= 5 ? 22000 : kw * 4500;
  bomLines.push({
    itemName: `Turnkey Rooftop Civil & Electrical Installation (${kw} kW)`,
    category: 'Installation & Commissioning',
    quantity: 1,
    unit: 'Job',
    rate: installCost,
    amount: installCost,
  });

  const baseAmount = bomLines.reduce((sum, item) => sum + item.amount, 0);
  const gstAmount = Math.round(baseAmount * 0.12); // Standard 12% solar GST

  // PM Surya Ghar: Muft Bijli Yojana Central DBT Subsidy calculation
  // 1 kW: ₹30,000 | 2 kW: ₹60,000 | >= 3 kW: ₹78,000 (Capped)
  let subsidyAmount = 0;
  if (customSubsidy !== null && customSubsidy !== undefined) {
    subsidyAmount = Number(customSubsidy) || 0;
  } else if (systemType === 'ON_GRID') {
    if (kw <= 1) {
      subsidyAmount = 30000;
    } else if (kw <= 2) {
      subsidyAmount = 60000;
    } else {
      subsidyAmount = 78000;
    }
  }

  const totalAmount = Math.max(0, baseAmount + gstAmount - subsidyAmount);

  return {
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
    grossMarginPercent: 25.5,
  };
}

export const quotationController = {
  /**
   * GET /api/v1/quotations
   * Fetches all quotations with parsed BOM lines, supports filtering by customerId or status
   */
  getQuotations(req, res, next) {
    try {
      const { customerId, status } = req.query;

      let sql = 'SELECT * FROM quotations WHERE 1=1';
      const params = [];

      if (customerId) {
        sql += ' AND customerId = ?';
        params.push(customerId);
      }

      if (status) {
        sql += ' AND status = ?';
        params.push(status);
      }

      sql += ' ORDER BY createdAt DESC';

      const rows = db.prepare(sql).all(...params);
      const quotations = rows.map((q) => ({
        ...q,
        bomLines: q.bomLines ? JSON.parse(q.bomLines) : [],
      }));

      return res.status(200).json({
        success: true,
        count: quotations.length,
        data: quotations,
      });
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
   * Generates and stores a new quotation with automated BOM & pricing calculation
   */
  createQuotation(req, res, next) {
    try {
      const {
        id: customId,
        customerId,
        customerName,
        capacityKW,
        systemType,
        panelModel: inputPanelModel,
        panelCount: inputPanelCount,
        inverterModel: inputInverterModel,
        inverterCount: inputInverterCount,
        batteryModel: inputBatteryModel,
        batteryCount: inputBatteryCount,
        bomLines: inputBomLines,
        baseAmount: inputBaseAmount,
        gstAmount: inputGstAmount,
        subsidyAmount: inputSubsidyAmount,
        totalAmount: inputTotalAmount,
        grossMarginPercent: inputMargin,
        validUntil,
        status: inputStatus,
      } = req.body;

      if (!customerId || !capacityKW) {
        return res.status(400).json({
          success: false,
          error: 'Customer ID and system capacity (kW) are required.',
        });
      }

      // Resolve Customer Name
      let resolvedCustomerName = customerName;
      const customer = db.prepare('SELECT id, name FROM customers WHERE id = ?').get(customerId);
      if (!customer) {
        return res.status(404).json({ success: false, error: `Customer with ID ${customerId} not found.` });
      }
      if (!resolvedCustomerName) {
        resolvedCustomerName = customer.name;
      }

      const resolvedSystemType = systemType || 'ON_GRID';

      // Auto-compute BOM if not manually provided
      const autoComputed = generateAutoBOM(capacityKW, resolvedSystemType, inputSubsidyAmount);

      const panelModel = inputPanelModel || autoComputed.panelModel;
      const panelCount = Number(inputPanelCount) || autoComputed.panelCount;
      const inverterModel = inputInverterModel || autoComputed.inverterModel;
      const inverterCount = Number(inputInverterCount) || autoComputed.inverterCount;
      const batteryModel = inputBatteryModel !== undefined ? inputBatteryModel : autoComputed.batteryModel;
      const batteryCount = Number(inputBatteryCount) || autoComputed.batteryCount;

      const bomLines = inputBomLines && Array.isArray(inputBomLines) && inputBomLines.length > 0
        ? inputBomLines
        : autoComputed.bomLines;

      const baseAmount = inputBaseAmount !== undefined ? Number(inputBaseAmount) : autoComputed.baseAmount;
      const gstAmount = inputGstAmount !== undefined ? Number(inputGstAmount) : autoComputed.gstAmount;
      const subsidyAmount = inputSubsidyAmount !== undefined ? Number(inputSubsidyAmount) : autoComputed.subsidyAmount;
      const totalAmount = inputTotalAmount !== undefined ? Number(inputTotalAmount) : autoComputed.totalAmount;
      const grossMarginPercent = inputMargin !== undefined ? Number(inputMargin) : autoComputed.grossMarginPercent;

      // Generate robust quotation ID and number
      let id = customId;
      if (!id) {
        const rows = db.prepare("SELECT id FROM quotations WHERE id LIKE 'quote-%'").all();
        let maxId = 0;
        for (const r of rows) {
          const num = parseInt(r.id.replace('quote-', ''), 10);
          if (!isNaN(num) && num > maxId) {
            maxId = num;
          }
        }
        id = `quote-${String(maxId + 1).padStart(2, '0')}`;
      }

      const countRow = db.prepare('SELECT COUNT(*) as count FROM quotations').get();
      const quotationNumber = `QT-2026-${String(countRow.count + 1).padStart(3, '0')}`;

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
          ?, ?, datetime('now'), datetime('now')
        )
      `);

      const expiryDate = validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const initialStatus = inputStatus || 'SENT';

      insert.run(
        id,
        quotationNumber,
        customerId,
        resolvedCustomerName,
        Number(capacityKW),
        resolvedSystemType,
        panelModel,
        panelCount,
        inverterModel,
        inverterCount,
        batteryModel,
        batteryCount,
        JSON.stringify(bomLines),
        baseAmount,
        gstAmount,
        subsidyAmount,
        totalAmount,
        grossMarginPercent,
        expiryDate,
        initialStatus
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
        message: 'Solar quotation generated successfully with automated Bill of Materials.',
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
   * PUT or PATCH /api/v1/quotations/:id
   * Updates quotation equipment parameters, BOM lines, or terms
   */
  updateQuotation(req, res, next) {
    try {
      const { id } = req.params;
      const existing = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id);

      if (!existing) {
        return res.status(404).json({ success: false, error: 'Quotation not found.' });
      }

      const {
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
        status,
      } = req.body;

      const update = db.prepare(`
        UPDATE quotations SET
          capacityKW = COALESCE(?, capacityKW),
          systemType = COALESCE(?, systemType),
          panelModel = COALESCE(?, panelModel),
          panelCount = COALESCE(?, panelCount),
          inverterModel = COALESCE(?, inverterModel),
          inverterCount = COALESCE(?, inverterCount),
          batteryModel = COALESCE(?, batteryModel),
          batteryCount = COALESCE(?, batteryCount),
          bomLines = COALESCE(?, bomLines),
          baseAmount = COALESCE(?, baseAmount),
          gstAmount = COALESCE(?, gstAmount),
          subsidyAmount = COALESCE(?, subsidyAmount),
          totalAmount = COALESCE(?, totalAmount),
          grossMarginPercent = COALESCE(?, grossMarginPercent),
          validUntil = COALESCE(?, validUntil),
          status = COALESCE(?, status),
          updatedAt = datetime('now')
        WHERE id = ?
      `);

      update.run(
        capacityKW !== undefined ? Number(capacityKW) : null,
        systemType || null,
        panelModel || null,
        panelCount !== undefined ? Number(panelCount) : null,
        inverterModel || null,
        inverterCount !== undefined ? Number(inverterCount) : null,
        batteryModel !== undefined ? batteryModel : null,
        batteryCount !== undefined ? Number(batteryCount) : null,
        bomLines ? JSON.stringify(bomLines) : null,
        baseAmount !== undefined ? Number(baseAmount) : null,
        gstAmount !== undefined ? Number(gstAmount) : null,
        subsidyAmount !== undefined ? Number(subsidyAmount) : null,
        totalAmount !== undefined ? Number(totalAmount) : null,
        grossMarginPercent !== undefined ? Number(grossMarginPercent) : null,
        validUntil || null,
        status || null,
        id
      );

      const updated = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id);
      return res.status(200).json({
        success: true,
        message: 'Quotation updated successfully.',
        data: {
          ...updated,
          bomLines: JSON.parse(updated.bomLines),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/quotations/:id/status
   * Updates quotation status (DRAFT, SENT, ACCEPTED, APPROVED, REJECTED)
   */
  updateQuotationStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['DRAFT', 'SENT', 'ACCEPTED', 'APPROVED', 'REJECTED'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
      }

      const existing = db.prepare('SELECT id FROM quotations WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Quotation not found.' });
      }

      db.prepare(`
        UPDATE quotations 
        SET status = ?, updatedAt = datetime('now')
        WHERE id = ?
      `).run(status, id);

      const updated = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id);
      return res.status(200).json({
        success: true,
        message: `Quotation status updated to ${status}.`,
        data: {
          ...updated,
          bomLines: JSON.parse(updated.bomLines),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/quotations/:id/confirm-order OR /api/v1/quotations/:id/convert-to-order
   * Customer accepts quote -> Converts to Confirmed Order in orders table
   */
  confirmOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { advanceReceived, advancePaid } = req.body;

      const quotation = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id);
      if (!quotation) {
        return res.status(404).json({ success: false, error: 'Quotation not found.' });
      }

      // Check if order already exists for this quotation
      const existingOrder = db.prepare('SELECT * FROM orders WHERE quotationId = ?').get(id);
      if (existingOrder) {
        return res.status(200).json({
          success: true,
          message: 'Order was already created for this quotation.',
          order: existingOrder,
          data: existingOrder,
        });
      }

      // Mark quote as ACCEPTED
      db.prepare("UPDATE quotations SET status = 'ACCEPTED', updatedAt = datetime('now') WHERE id = ?").run(id);

      // Determine robust order ID
      const rows = db.prepare("SELECT id FROM orders WHERE id LIKE 'ord-%'").all();
      let maxId = 0;
      for (const r of rows) {
        const num = parseInt(r.id.replace('ord-', ''), 10);
        if (!isNaN(num) && num > maxId) {
          maxId = num;
        }
      }
      const orderId = `ord-${String(maxId + 1).padStart(2, '0')}`;

      const orderCountRow = db.prepare('SELECT COUNT(*) as count FROM orders').get();
      const orderNumber = `ORD-2026-${String(orderCountRow.count + 1).padStart(3, '0')}`;

      const advanceInput = advanceReceived !== undefined ? advanceReceived : advancePaid;
      const advance = advanceInput !== undefined
        ? Number(advanceInput)
        : Math.round(quotation.totalAmount * 0.2); // Default 20% advance
      const balance = Math.max(0, quotation.totalAmount - advance);
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
        data: createdOrder,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/v1/quotations/:id
   * Removes quotation if not converted to an active order
   */
  deleteQuotation(req, res, next) {
    try {
      const { id } = req.params;
      const quotation = db.prepare('SELECT id FROM quotations WHERE id = ?').get(id);

      if (!quotation) {
        return res.status(404).json({ success: false, error: 'Quotation not found.' });
      }

      // Check if order references this quotation
      const order = db.prepare('SELECT id FROM orders WHERE quotationId = ?').get(id);
      if (order) {
        return res.status(409).json({
          success: false,
          error: `Cannot delete quotation: active order ${order.id} is linked to it.`,
        });
      }

      db.prepare('DELETE FROM quotations WHERE id = ?').run(id);

      return res.status(200).json({
        success: true,
        message: 'Quotation deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/quotations/orders/list AND /api/v1/orders
   * Lists all confirmed orders with optional status or customer filters
   */
  getOrders(req, res, next) {
    try {
      const { customerId, stage, paymentStatus } = req.query;

      let sql = 'SELECT * FROM orders WHERE 1=1';
      const params = [];

      if (customerId) {
        sql += ' AND customerId = ?';
        params.push(customerId);
      }

      if (stage) {
        sql += ' AND stage = ?';
        params.push(stage);
      }

      if (paymentStatus) {
        sql += ' AND paymentStatus = ?';
        params.push(paymentStatus);
      }

      sql += ' ORDER BY createdAt DESC';

      const orders = db.prepare(sql).all(...params);
      return res.status(200).json({
        success: true,
        count: orders.length,
        data: orders,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/quotations/orders/:id AND /api/v1/orders/:id
   * Fetches single order with quotation and customer context
   */
  getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);

      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found.' });
      }

      // Fetch customer details
      const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(order.customerId);

      // Fetch quotation details
      const quotation = db.prepare('SELECT * FROM quotations WHERE id = ?').get(order.quotationId);

      return res.status(200).json({
        success: true,
        data: {
          ...order,
          customer,
          quotation: quotation
            ? {
                ...quotation,
                bomLines: quotation.bomLines ? JSON.parse(quotation.bomLines) : [],
              }
            : null,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/orders/:id/stage or /api/v1/orders/:id/payment
   * Updates order stage or records payment adjustment
   */
  updateOrder(req, res, next) {
    try {
      const { id } = req.params;
      const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);

      if (!existing) {
        return res.status(404).json({ success: false, error: 'Order not found.' });
      }

      const { stage, advanceReceived, additionalPayment, paymentStatus } = req.body;

      let newAdvance = existing.advanceReceived;
      if (additionalPayment !== undefined) {
        newAdvance += Number(additionalPayment);
      } else if (advanceReceived !== undefined) {
        newAdvance = Number(advanceReceived);
      }

      const newBalance = Math.max(0, existing.totalAmount - newAdvance);
      const newPaymentStatus = paymentStatus || (newBalance <= 0 ? 'PAID' : newAdvance > 0 ? 'PARTIALLY_PAID' : 'UNPAID');

      const update = db.prepare(`
        UPDATE orders SET
          stage = COALESCE(?, stage),
          advanceReceived = ?,
          balanceDue = ?,
          paymentStatus = ?,
          updatedAt = datetime('now')
        WHERE id = ?
      `);

      update.run(stage || null, newAdvance, newBalance, newPaymentStatus, id);

      const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
      return res.status(200).json({
        success: true,
        message: 'Order updated successfully.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },
};
