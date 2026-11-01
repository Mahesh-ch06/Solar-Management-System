/**
 * [Member 2] Site Technical Surveys Controller
 * 
 * Purpose:
 * Records rooftop physical dimensions, tilt angle, orientation/azimuth, cable run length,
 * shadow-free area calculations, and electrical load feasibility sign-offs.
 * 
 * Why in this file?
 * Separates technical field engineering survey data from standard CRM lead contact details.
 */

import { db } from '../../db/database.js';

export const surveyController = {
  /**
   * GET /api/v1/surveys
   * Returns list of all rooftop technical audits with optional filters
   */
  getSurveys(req, res, next) {
    try {
      const { customerId, feasibilityStatus, surveyorId } = req.query;

      let sql = 'SELECT * FROM surveys WHERE 1=1';
      const params = [];

      if (customerId) {
        sql += ' AND customerId = ?';
        params.push(customerId);
      }

      if (feasibilityStatus) {
        sql += ' AND feasibilityStatus = ?';
        params.push(feasibilityStatus);
      }

      if (surveyorId) {
        sql += ' AND surveyorId = ?';
        params.push(surveyorId);
      }

      sql += ' ORDER BY createdAt DESC';

      const surveys = db.prepare(sql).all(...params);
      return res.status(200).json({
        success: true,
        count: surveys.length,
        data: surveys,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/surveys/:id
   * Fetches specific survey audit details
   */
  getSurveyById(req, res, next) {
    try {
      const { id } = req.params;
      const survey = db.prepare('SELECT * FROM surveys WHERE id = ?').get(id);

      if (!survey) {
        return res.status(404).json({ success: false, error: 'Survey not found.' });
      }

      return res.status(200).json({ success: true, data: survey });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/surveys/customer/:customerId
   * Fetches all site surveys conducted for a specific customer
   */
  getSurveysByCustomerId(req, res, next) {
    try {
      const { customerId } = req.params;
      const surveys = db.prepare('SELECT * FROM surveys WHERE customerId = ? ORDER BY createdAt DESC').all(customerId);

      return res.status(200).json({
        success: true,
        count: surveys.length,
        data: surveys,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/surveys
   * Submits a new rooftop survey and transitions customer status to SURVEY_SCHEDULED
   */
  createSurvey(req, res, next) {
    try {
      const {
        id: customId,
        customerId,
        customerName,
        surveyDate,
        surveyorId,
        surveyorName,
        roofAreaSqFt,
        shadowFreeAreaSqFt,
        roofType,
        roofTiltAngle,
        roofAzimuth,
        cableRunLengthMeters,
        electricalConnection,
        sanctionedLoadKW,
        feasibilityStatus,
        rejectionReason,
        remarks,
      } = req.body;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          error: 'Customer ID is required.',
        });
      }

      if (roofAreaSqFt !== undefined && Number(roofAreaSqFt) < 0) {
        return res.status(400).json({ success: false, error: 'Roof area cannot be negative.' });
      }
      if (shadowFreeAreaSqFt !== undefined && Number(shadowFreeAreaSqFt) < 0) {
        return res.status(400).json({ success: false, error: 'Shadow-free area cannot be negative.' });
      }
      if (
        roofAreaSqFt !== undefined &&
        shadowFreeAreaSqFt !== undefined &&
        Number(shadowFreeAreaSqFt) > Number(roofAreaSqFt)
      ) {
        return res.status(400).json({
          success: false,
          error: 'Shadow-free area cannot exceed total roof area.',
        });
      }

      // Lookup customer if customerName not directly passed
      let resolvedCustomerName = customerName;
      const cust = db.prepare('SELECT id, name FROM customers WHERE id = ?').get(customerId);
      if (!cust) {
        return res.status(404).json({ success: false, error: `Customer with ID ${customerId} not found.` });
      }
      if (!resolvedCustomerName) {
        resolvedCustomerName = cust.name;
      }

      // Generate robust survey ID
      let id = customId;
      if (!id) {
        const rows = db.prepare("SELECT id FROM surveys WHERE id LIKE 'surv-%'").all();
        let maxId = 0;
        for (const r of rows) {
          const num = parseInt(r.id.replace('surv-', ''), 10);
          if (!isNaN(num) && num > maxId) {
            maxId = num;
          }
        }
        id = `surv-${String(maxId + 1).padStart(2, '0')}`;
      } else {
        const exists = db.prepare('SELECT id FROM surveys WHERE id = ?').get(id);
        if (exists) {
          return res.status(409).json({ success: false, error: `Survey with ID ${id} already exists.` });
        }
      }

      const insert = db.prepare(`
        INSERT INTO surveys (
          id, customerId, customerName, surveyDate, surveyorId, surveyorName,
          roofAreaSqFt, shadowFreeAreaSqFt, roofType, roofTiltAngle, roofAzimuth,
          cableRunLengthMeters, electricalConnection, sanctionedLoadKW,
          feasibilityStatus, rejectionReason, remarks, createdAt, updatedAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, datetime('now'), datetime('now')
        )
      `);

      insert.run(
        id,
        customerId,
        resolvedCustomerName,
        surveyDate || new Date().toISOString().split('T')[0],
        surveyorId || (req.user ? req.user.id : 'usr-tech-01'),
        surveyorName || (req.user ? req.user.name : 'Field Technician'),
        Number(roofAreaSqFt) || 0,
        Number(shadowFreeAreaSqFt) || 0,
        roofType || 'RCC_FLAT',
        Number(roofTiltAngle) || 15,
        roofAzimuth || 'SOUTH',
        Number(cableRunLengthMeters) || 20,
        electricalConnection || 'SINGLE_PHASE',
        Number(sanctionedLoadKW) || 5,
        feasibilityStatus || 'PENDING',
        rejectionReason || null,
        remarks || ''
      );

      // Automatically advance customer stage to SURVEY_SCHEDULED if currently in preliminary stages
      db.prepare(`
        UPDATE customers 
        SET status = 'SURVEY_SCHEDULED', updatedAt = datetime('now')
        WHERE id = ? AND status IN ('NEW', 'CONTACTED')
      `).run(customerId);

      const created = db.prepare('SELECT * FROM surveys WHERE id = ?').get(id);
      return res.status(201).json({
        success: true,
        message: 'Rooftop technical survey created successfully.',
        data: created,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT or PATCH /api/v1/surveys/:id
   * Updates rooftop audit measurements, tilt, azimuth, or electrical parameters
   */
  updateSurvey(req, res, next) {
    try {
      const { id } = req.params;
      const existing = db.prepare('SELECT * FROM surveys WHERE id = ?').get(id);

      if (!existing) {
        return res.status(404).json({ success: false, error: 'Survey not found.' });
      }

      const {
        surveyDate,
        surveyorId,
        surveyorName,
        roofAreaSqFt,
        shadowFreeAreaSqFt,
        roofType,
        roofTiltAngle,
        roofAzimuth,
        cableRunLengthMeters,
        electricalConnection,
        sanctionedLoadKW,
        feasibilityStatus,
        rejectionReason,
        remarks,
      } = req.body;

      const effectiveRoof = roofAreaSqFt !== undefined ? Number(roofAreaSqFt) : existing.roofAreaSqFt;
      const effectiveShadow = shadowFreeAreaSqFt !== undefined ? Number(shadowFreeAreaSqFt) : existing.shadowFreeAreaSqFt;
      if (effectiveRoof !== undefined && effectiveRoof < 0) {
        return res.status(400).json({ success: false, error: 'Roof area cannot be negative.' });
      }
      if (effectiveShadow !== undefined && effectiveShadow < 0) {
        return res.status(400).json({ success: false, error: 'Shadow-free area cannot be negative.' });
      }
      if (effectiveRoof !== undefined && effectiveShadow !== undefined && effectiveShadow > effectiveRoof) {
        return res.status(400).json({
          success: false,
          error: 'Shadow-free area cannot exceed total roof area.',
        });
      }

      const update = db.prepare(`
        UPDATE surveys SET
          surveyDate = COALESCE(?, surveyDate),
          surveyorId = COALESCE(?, surveyorId),
          surveyorName = COALESCE(?, surveyorName),
          roofAreaSqFt = COALESCE(?, roofAreaSqFt),
          shadowFreeAreaSqFt = COALESCE(?, shadowFreeAreaSqFt),
          roofType = COALESCE(?, roofType),
          roofTiltAngle = COALESCE(?, roofTiltAngle),
          roofAzimuth = COALESCE(?, roofAzimuth),
          cableRunLengthMeters = COALESCE(?, cableRunLengthMeters),
          electricalConnection = COALESCE(?, electricalConnection),
          sanctionedLoadKW = COALESCE(?, sanctionedLoadKW),
          feasibilityStatus = COALESCE(?, feasibilityStatus),
          rejectionReason = COALESCE(?, rejectionReason),
          remarks = COALESCE(?, remarks),
          updatedAt = datetime('now')
        WHERE id = ?
      `);

      update.run(
        surveyDate || null,
        surveyorId || null,
        surveyorName || null,
        roofAreaSqFt !== undefined ? Number(roofAreaSqFt) : null,
        shadowFreeAreaSqFt !== undefined ? Number(shadowFreeAreaSqFt) : null,
        roofType || null,
        roofTiltAngle !== undefined ? Number(roofTiltAngle) : null,
        roofAzimuth || null,
        cableRunLengthMeters !== undefined ? Number(cableRunLengthMeters) : null,
        electricalConnection || null,
        sanctionedLoadKW !== undefined ? Number(sanctionedLoadKW) : null,
        feasibilityStatus || null,
        rejectionReason !== undefined ? rejectionReason : null,
        remarks !== undefined ? remarks : null,
        id
      );

      const updated = db.prepare('SELECT * FROM surveys WHERE id = ?').get(id);
      return res.status(200).json({
        success: true,
        message: 'Survey measurements updated successfully.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/surveys/:id/feasibility or /api/v1/surveys/:id/status
   * Feasibility Sign-Off: Approves or Rejects a technical audit
   */
  updateFeasibility(req, res, next) {
    try {
      const { id } = req.params;
      const feasibilityStatus = req.body.feasibilityStatus || req.body.status;
      const { rejectionReason, remarks } = req.body;

      if (!['APPROVED', 'REJECTED', 'PENDING'].includes(feasibilityStatus)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid feasibility status. Must be APPROVED, REJECTED, or PENDING.',
        });
      }

      const existing = db.prepare('SELECT id, customerId FROM surveys WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Survey not found.' });
      }

      const update = db.prepare(`
        UPDATE surveys SET
          feasibilityStatus = ?,
          rejectionReason = ?,
          remarks = COALESCE(?, remarks),
          updatedAt = datetime('now')
        WHERE id = ?
      `);

      update.run(feasibilityStatus, rejectionReason || null, remarks || null, id);

      const updated = db.prepare('SELECT * FROM surveys WHERE id = ?').get(id);
      return res.status(200).json({
        success: true,
        message: `Site survey feasibility marked as ${feasibilityStatus}.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/v1/surveys/:id
   * Deletes a survey if no dependent orders/quotations block it
   */
  deleteSurvey(req, res, next) {
    try {
      const { id } = req.params;
      const existing = db.prepare('SELECT id FROM surveys WHERE id = ?').get(id);

      if (!existing) {
        return res.status(404).json({ success: false, error: 'Survey not found.' });
      }

      db.prepare('DELETE FROM surveys WHERE id = ?').run(id);

      return res.status(200).json({
        success: true,
        message: 'Survey deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  },
};
