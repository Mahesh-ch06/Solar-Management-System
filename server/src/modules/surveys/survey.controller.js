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
   * Returns list of all rooftop technical audits
   */
  getSurveys(req, res, next) {
    try {
      const surveys = db.prepare('SELECT * FROM surveys ORDER BY createdAt DESC').all();
      return res.status(200).json({ success: true, data: surveys });
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
   * POST /api/v1/surveys
   * Submits a new rooftop survey and transitions customer status to SURVEY_SCHEDULED
   */
  createSurvey(req, res, next) {
    try {
      const {
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
        remarks,
      } = req.body;

      if (!customerId || !roofAreaSqFt || !shadowFreeAreaSqFt) {
        return res.status(400).json({
          success: false,
          error: 'Customer ID, roof area, and shadow-free area are required.',
        });
      }

      // Lookup customer if customerName not directly passed
      let resolvedCustomerName = customerName;
      if (!resolvedCustomerName) {
        const cust = db.prepare('SELECT name FROM customers WHERE id = ?').get(customerId);
        resolvedCustomerName = cust ? cust.name : 'Unknown Customer';
      }

      const countRow = db.prepare('SELECT COUNT(*) as count FROM surveys').get();
      const id = `surv-${String(countRow.count + 1).padStart(2, '0')}`;

      const insert = db.prepare(`
        INSERT INTO surveys (
          id, customerId, customerName, surveyDate, surveyorId, surveyorName,
          roofAreaSqFt, shadowFreeAreaSqFt, roofType, roofTiltAngle, roofAzimuth,
          cableRunLengthMeters, electricalConnection, sanctionedLoadKW,
          feasibilityStatus, remarks, createdAt, updatedAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, datetime('now'), datetime('now')
        )
      `);

      insert.run(
        id,
        customerId,
        resolvedCustomerName,
        surveyDate || new Date().toISOString().split('T')[0],
        surveyorId || req.user.id,
        surveyorName || req.user.name,
        Number(roofAreaSqFt),
        Number(shadowFreeAreaSqFt),
        roofType || 'RCC_FLAT',
        Number(roofTiltAngle) || 15,
        roofAzimuth || 'SOUTH',
        Number(cableRunLengthMeters) || 20,
        electricalConnection || 'SINGLE_PHASE',
        Number(sanctionedLoadKW) || 5,
        feasibilityStatus || 'PENDING',
        remarks || ''
      );

      // Automatically advance customer stage to SURVEY_SCHEDULED
      db.prepare(`
        UPDATE customers 
        SET status = 'SURVEY_SCHEDULED', updatedAt = datetime('now')
        WHERE id = ? AND status IN ('NEW', 'CONTACTED')
      `).run(customerId);

      const created = db.prepare('SELECT * FROM surveys WHERE id = ?').get(id);
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/surveys/:id/feasibility
   * Feasibility Sign-Off: Approves or Rejects a technical audit
   */
  updateFeasibility(req, res, next) {
    try {
      const { id } = req.params;
      const { feasibilityStatus, rejectionReason, remarks } = req.body;

      if (!['APPROVED', 'REJECTED', 'PENDING'].includes(feasibilityStatus)) {
        return res.status(400).json({ success: false, error: 'Invalid feasibility status.' });
      }

      const update = db.prepare(`
        UPDATE surveys SET
          feasibilityStatus = ?,
          rejectionReason = ?,
          remarks = COALESCE(?, remarks),
          updatedAt = datetime('now')
        WHERE id = ?
      `);

      const result = update.run(feasibilityStatus, rejectionReason || null, remarks || null, id);

      if (result.changes === 0) {
        return res.status(404).json({ success: false, error: 'Survey not found.' });
      }

      const updated = db.prepare('SELECT * FROM surveys WHERE id = ?').get(id);
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
};

