/**
 * [Member 2] Customer Leads & Sales Pipeline Controller
 * 
 * Purpose:
 * Manages solar prospective leads, qualification criteria (kW capacity, subsidy eligibility),
 * and pipeline stage transitions (QUEUED -> NEW -> CONTACTED -> SURVEY_SCHEDULED -> QUOTATION_SENT -> CONVERTED -> CLOSED_LOST).
 * 
 * Smart Assignment & Queueing Feature:
 * - When an enquiry arrives, it is automatically assigned to a sales consultant who is not busy.
 * - A consultant is "busy" when their active leads count >= MAX_ACTIVE_LEADS_PER_STAFF.
 * - If all consultants are busy (or none available), the enquiry is placed in a priority FIFO queue ('QUEUED').
 * - When a consultant is released (lead marked as CONVERTED/CLOSED_LOST or deleted), the next queued
 *   enquiry is automatically assigned to them.
 */

import { db } from '../../db/database.js';

export const VALID_PIPELINE_STATUSES = [
  'QUEUED',
  'NEW',
  'CONTACTED',
  'SURVEY_SCHEDULED',
  'SURVEY_DONE',
  'QUOTATION_SENT',
  'CONVERTED',
  'CLOSED_LOST',
];

export const ACTIVE_WORKLOAD_STATUSES = [
  'NEW',
  'CONTACTED',
  'SURVEY_SCHEDULED',
  'SURVEY_DONE',
  'QUOTATION_SENT',
];

/**
 * Returns the maximum active lead capacity per sales consultant before being marked as busy.
 * Default is 2 active leads per consultant (can be configured via environment variable).
 */
export const getMaxCapacity = () => parseInt(process.env.MAX_ACTIVE_LEADS_PER_STAFF || '2', 10);

/**
 * Returns the count of active leads currently assigned to a staff member.
 */
export function getStaffActiveLeadCount(staffName) {
  if (!staffName) return 0;
  const placeholders = ACTIVE_WORKLOAD_STATUSES.map(() => '?').join(', ');
  const row = db.prepare(`
    SELECT COUNT(*) as count 
    FROM customers 
    WHERE assignedTo = ? 
      AND status IN (${placeholders})
  `).get(staffName, ...ACTIVE_WORKLOAD_STATUSES);
  return row ? row.count : 0;
}

/**
 * Finds an available sales staff member who is NOT busy (activeLeads < maxCapacity).
 * If multiple staff are available, selects the one with the lowest current workload (least busy).
 * If all staff are busy (or no active staff exist), returns null.
 */
export function findAvailableStaff() {
  const maxCap = getMaxCapacity();
  const staffList = db.prepare(`
    SELECT id, name, email, role 
    FROM users 
    WHERE role IN ('SALES', 'SUPPORT_AGENT') 
      AND status = 'ACTIVE'
    ORDER BY name ASC
  `).all();

  if (!staffList || staffList.length === 0) {
    return null;
  }

  const evaluatedStaff = staffList.map((s) => {
    const activeLeads = getStaffActiveLeadCount(s.name);
    return {
      ...s,
      activeLeads,
      isAvailable: activeLeads < maxCap,
    };
  });

  const availableStaff = evaluatedStaff.filter((s) => s.isAvailable);
  if (availableStaff.length === 0) {
    return null;
  }

  // Sort ascending by active lead count (least busy first), then name for deterministic ordering
  availableStaff.sort((a, b) => a.activeLeads - b.activeLeads || a.name.localeCompare(b.name));
  return availableStaff[0];
}

/**
 * Returns total count of queued customer enquiries waiting for staff assignment.
 */
export function getQueueCount() {
  return db.prepare(`
    SELECT COUNT(*) as count 
    FROM customers 
    WHERE status = 'QUEUED' OR assignedTo = 'UNASSIGNED'
  `).get().count;
}

/**
 * Automatically processes the FIFO queue of enquiries when a staff member is released
 * (e.g. when an active lead is converted, closed lost, or reassigned).
 */
export function processQueuedEnquiries(releasedStaffName = null) {
  const maxCap = getMaxCapacity();
  const assigned = [];

  while (true) {
    // 1. Fetch oldest queued enquiry
    const oldestQueued = db.prepare(`
      SELECT * FROM customers 
      WHERE status = 'QUEUED' OR assignedTo = 'UNASSIGNED'
      ORDER BY createdAt ASC 
      LIMIT 1
    `).get();

    if (!oldestQueued) {
      break; // No more enquiries waiting in queue
    }

    // 2. Determine target staff (prefer released staff if they have capacity)
    let target = null;
    if (releasedStaffName) {
      const activeCount = getStaffActiveLeadCount(releasedStaffName);
      if (activeCount < maxCap) {
        target = { name: releasedStaffName, activeLeads: activeCount };
      }
    }

    if (!target) {
      target = findAvailableStaff();
    }

    if (!target) {
      // All staff are still at max capacity; remaining enquiries stay queued
      break;
    }

    // 3. Assign queued customer to target staff member
    const autoNote = `\n[Auto-Assignment] Reassigned from waiting queue to consultant ${target.name} upon consultant release.`;
    const updatedNotes = (oldestQueued.notes || '') + autoNote;

    db.prepare(`
      UPDATE customers SET
        assignedTo = ?,
        status = 'NEW',
        notes = ?,
        updatedAt = datetime('now')
      WHERE id = ?
    `).run(target.name, updatedNotes, oldestQueued.id);

    assigned.push({
      customerId: oldestQueued.id,
      customerName: oldestQueued.name,
      assignedTo: target.name,
    });
  }

  return assigned;
}

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
   * GET /api/v1/customers/queue/status
   * Returns consultant workload metrics and list of queued enquiries
   */
  getQueueStatus(req, res, next) {
    try {
      const maxCapacity = getMaxCapacity();
      const staffList = db.prepare(`
        SELECT id, name, email, role 
        FROM users 
        WHERE role IN ('SALES', 'SUPPORT_AGENT') 
          AND status = 'ACTIVE'
        ORDER BY name ASC
      `).all();

      const staff = staffList.map((s) => {
        const activeLeads = getStaffActiveLeadCount(s.name);
        return {
          id: s.id,
          name: s.name,
          email: s.email,
          role: s.role,
          activeLeads,
          maxCapacity,
          isBusy: activeLeads >= maxCapacity,
          availableSlots: Math.max(0, maxCapacity - activeLeads),
        };
      });

      const queuedCustomers = db.prepare(`
        SELECT id, name, phone, city, requiredCapacityKW, status, assignedTo, createdAt 
        FROM customers 
        WHERE status = 'QUEUED' OR assignedTo = 'UNASSIGNED'
        ORDER BY createdAt ASC
      `).all();

      return res.status(200).json({
        success: true,
        maxCapacityPerStaff: maxCapacity,
        staff,
        queue: {
          count: queuedCustomers.length,
          items: queuedCustomers,
        },
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
   * Registers a new lead from web enquiry, phone call, or referral.
   * Auto-assigns to the least busy consultant; queues with friendly message if all are busy.
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

      const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && typeof email === 'string' && email.trim() && !EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email address format.',
        });
      }

      const cleanDigits = String(phone).trim().replace(/\D/g, '');
      if (cleanDigits.length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Phone number must contain at least 10 digits.',
        });
      }

      if (monthlyBill !== undefined && monthlyBill !== null) {
        const parsedBill = Number(monthlyBill);
        if (isNaN(parsedBill) || parsedBill < 0) {
          return res.status(400).json({
            success: false,
            error: 'Monthly electricity bill must be a non-negative number.',
          });
        }
      }

      if (requiredCapacityKW !== undefined && requiredCapacityKW !== null) {
        const parsedKW = Number(requiredCapacityKW);
        if (isNaN(parsedKW) || parsedKW <= 0 || parsedKW > 500) {
          return res.status(400).json({
            success: false,
            error: 'Required solar capacity must be a positive number between 1 kW and 500 kW.',
          });
        }
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

      // Smart Consultant Assignment & Capacity Management
      let finalAssignedTo = assignedTo ? assignedTo.trim() : '';
      let finalStatus = status && VALID_PIPELINE_STATUSES.includes(status) ? status : 'NEW';
      let assignmentMessage = '';
      let isQueued = false;
      let queuePosition = 0;

      // Auto-assign when assignedTo is omitted, empty, or set to 'AUTO' / 'UNASSIGNED'
      if (!finalAssignedTo || finalAssignedTo === 'AUTO' || finalAssignedTo === 'UNASSIGNED') {
        const availableStaff = findAvailableStaff();

        if (availableStaff) {
          // Available consultant found!
          finalAssignedTo = availableStaff.name;
          finalStatus = status && VALID_PIPELINE_STATUSES.includes(status) && status !== 'QUEUED' ? status : 'NEW';
          assignmentMessage = `Enquiry registered and assigned to solar consultant ${availableStaff.name}.`;
        } else {
          // All consultants are currently busy -> Place into priority queue
          finalAssignedTo = 'UNASSIGNED';
          finalStatus = 'QUEUED';
          isQueued = true;
          const currentQueueCount = getQueueCount();
          queuePosition = currentQueueCount + 1;
          assignmentMessage = `All our solar consultants are currently engaged in active consultations. Your enquiry has been placed in our priority queue (#${queuePosition} in queue) and will be assigned automatically once a consultant becomes available.`;
        }
      } else {
        assignmentMessage = `Customer lead registered and assigned to ${finalAssignedTo}.`;
      }

      let finalNotes = notes ? notes.trim() : '';
      if (isQueued) {
        finalNotes = finalNotes ? `${finalNotes}\n[Priority Queue] All consultants busy. Placed in queue position #${queuePosition}.` : `[Priority Queue] All consultants busy. Placed in queue position #${queuePosition}.`;
      } else if (finalAssignedTo && finalAssignedTo !== 'UNASSIGNED') {
        finalNotes = finalNotes ? `${finalNotes}\n[Auto-Assignment] Assigned to consultant ${finalAssignedTo}.` : `[Auto-Assignment] Assigned to consultant ${finalAssignedTo}.`;
      }

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
        finalStatus,
        finalNotes,
        finalAssignedTo
      );

      const created = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
      return res.status(201).json({
        success: true,
        message: assignmentMessage,
        isQueued,
        queuePosition: isQueued ? queuePosition : undefined,
        assignedTo: finalAssignedTo,
        data: created,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT or PATCH /api/v1/customers/:id
   * Updates lead profile, assignment, or technical requirements.
   * If lead is closed or converted, releases staff capacity and triggers queue assignment.
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

      if (email !== undefined && email !== null && String(email).trim() && !EMAIL_REGEX.test(String(email).trim())) {
        return res.status(400).json({ success: false, error: 'Invalid email address format.' });
      }

      if (phone !== undefined && phone !== null) {
        const clean = String(phone).trim().replace(/\D/g, '');
        if (clean.length < 10) {
          return res.status(400).json({ success: false, error: 'Phone number must contain at least 10 digits.' });
        }
      }

      if (monthlyBill !== undefined && monthlyBill !== null) {
        const parsed = Number(monthlyBill);
        if (isNaN(parsed) || parsed < 0) {
          return res.status(400).json({ success: false, error: 'Monthly electricity bill must be a non-negative number.' });
        }
      }

      if (requiredCapacityKW !== undefined && requiredCapacityKW !== null) {
        const parsed = Number(requiredCapacityKW);
        if (isNaN(parsed) || parsed <= 0 || parsed > 500) {
          return res.status(400).json({ success: false, error: 'Required solar capacity must be a positive number between 1 kW and 500 kW.' });
        }
      }

      if (systemType && !['ON_GRID', 'OFF_GRID', 'HYBRID'].includes(systemType)) {
        return res.status(400).json({ success: false, error: 'Invalid systemType. Must be ON_GRID, OFF_GRID, or HYBRID.' });
      }

      if (status && !VALID_PIPELINE_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, error: `Invalid pipeline status. Must be one of: ${VALID_PIPELINE_STATUSES.join(', ')}` });
      }

      const wasActive = ACTIVE_WORKLOAD_STATUSES.includes(existing.status);
      const isNowInactive = status && ['CONVERTED', 'CLOSED_LOST'].includes(status);
      const staffChanged = assignedTo !== undefined && assignedTo !== existing.assignedTo;

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

      // Check if consultant was released to take on queued enquiries
      let assignedFromQueue = [];
      if (wasActive && (isNowInactive || staffChanged) && existing.assignedTo) {
        assignedFromQueue = processQueuedEnquiries(existing.assignedTo);
      }

      const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
      let message = 'Customer details updated successfully.';
      if (assignedFromQueue.length > 0) {
        const assignedNames = assignedFromQueue.map((q) => `${q.customerName} (${q.customerId})`).join(', ');
        message += ` Consultant ${existing.assignedTo} released; automatically assigned waiting enquiry: ${assignedNames}.`;
      }

      return res.status(200).json({
        success: true,
        message,
        data: updated,
        assignedFromQueue,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/customers/:id/status
   * Dedicated endpoint to transition customer pipeline stage.
   * If transition releases staff capacity (CONVERTED or CLOSED_LOST),
   * automatically assigns the next waiting enquiry from the FIFO queue.
   */
  updateCustomerStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !VALID_PIPELINE_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${VALID_PIPELINE_STATUSES.join(', ')}`,
        });
      }

      const existing = db.prepare('SELECT id, name, status, assignedTo FROM customers WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Customer not found.' });
      }

      const wasActive = ACTIVE_WORKLOAD_STATUSES.includes(existing.status);
      const isNowInactive = ['CONVERTED', 'CLOSED_LOST'].includes(status);

      db.prepare(`
        UPDATE customers SET
          status = ?,
          updatedAt = datetime('now')
        WHERE id = ?
      `).run(status, id);

      // Automatically assign waiting queued lead if staff member released
      let assignedFromQueue = [];
      if (wasActive && isNowInactive && existing.assignedTo) {
        assignedFromQueue = processQueuedEnquiries(existing.assignedTo);
      }

      const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
      let message = `Customer pipeline status updated to ${status}.`;
      if (assignedFromQueue.length > 0) {
        const summary = assignedFromQueue.map((q) => `${q.customerName} (${q.customerId})`).join(', ');
        message += ` Consultant ${existing.assignedTo} was released; automatically assigned waiting enquiry: ${summary}.`;
      }

      return res.status(200).json({
        success: true,
        message,
        data: updated,
        assignedFromQueue,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/v1/customers/:id
   * Soft-checks dependencies before removing customer to maintain relational integrity.
   * If customer was active, releases consultant and assigns queued enquiry if present.
   */
  deleteCustomer(req, res, next) {
    try {
      const { id } = req.params;

      const existing = db.prepare('SELECT id, name, status, assignedTo FROM customers WHERE id = ?').get(id);
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

      const wasActive = ACTIVE_WORKLOAD_STATUSES.includes(existing.status);
      const previousStaff = existing.assignedTo;

      db.prepare('DELETE FROM customers WHERE id = ?').run(id);

      let assignedFromQueue = [];
      if (wasActive && previousStaff) {
        assignedFromQueue = processQueuedEnquiries(previousStaff);
      }

      let message = 'Customer deleted successfully.';
      if (assignedFromQueue.length > 0) {
        const summary = assignedFromQueue.map((q) => `${q.customerName} (${q.customerId})`).join(', ');
        message += ` Staff released; automatically assigned waiting enquiry: ${summary}.`;
      }

      return res.status(200).json({
        success: true,
        message,
        assignedFromQueue,
      });
    } catch (err) {
      next(err);
    }
  },
};
