/**
 * [Member 4] Field Installations & Commissioning Controller
 * 
 * Purpose:
 * Coordinates rooftop solar physical installation jobs across 5 distinct milestone stages:
 * SCHEDULED -> MATERIAL_STAGED -> IN_PROGRESS -> TESTING -> COMMISSIONED.
 * Manages the digital quality checklist (earth resistance < 5 ohms, DC polarity, inverter voltage).
 * 
 * Why in this file?
 * Encapsulates field operations and technician handover logic for Member 4.
 */

import { db } from '../../db/database.js';

export const installationController = {
  /**
   * GET /api/v1/installations
   * Lists all installation jobs with parsed checklist & photos
   */
  getJobs(req, res, next) {
    try {
      const rows = db.prepare('SELECT * FROM installation_jobs ORDER BY scheduledStartDate DESC').all();
      const jobs = rows.map((job) => ({
        ...job,
        assistantTechnicianIds: job.assistantTechnicianIds ? JSON.parse(job.assistantTechnicianIds) : [],
        checklist: job.checklist ? JSON.parse(job.checklist) : {},
        photos: job.photos ? JSON.parse(job.photos) : {},
      }));
      return res.status(200).json({ success: true, data: jobs });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/installations/:id
   * Fetches single installation job
   */
  getJobById(req, res, next) {
    try {
      const { id } = req.params;
      const job = db.prepare('SELECT * FROM installation_jobs WHERE id = ?').get(id);

      if (!job) {
        return res.status(404).json({ success: false, error: 'Installation job not found.' });
      }

      return res.status(200).json({
        success: true,
        data: {
          ...job,
          assistantTechnicianIds: job.assistantTechnicianIds ? JSON.parse(job.assistantTechnicianIds) : [],
          checklist: job.checklist ? JSON.parse(job.checklist) : {},
          photos: job.photos ? JSON.parse(job.photos) : {},
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/installations
   * Creates an installation assignment
   */
  createJob(req, res, next) {
    try {
      const {
        orderId,
        customerId,
        customerName,
        customerPhone,
        siteAddress,
        capacityKW,
        systemType,
        leadTechnicianId,
        leadTechnicianName,
        assistantTechnicianIds,
        scheduledStartDate,
        scheduledEndDate,
        notes,
      } = req.body;

      if (!orderId || !customerId || !siteAddress || !capacityKW) {
        return res.status(400).json({
          success: false,
          error: 'Order ID, Customer ID, site address, and system capacity are required.',
        });
      }

      const countRow = db.prepare('SELECT COUNT(*) as count FROM installation_jobs').get();
      const id = `job-${String(countRow.count + 1).padStart(2, '0')}`;
      const jobCode = `JOB-2026-${String(countRow.count + 1).padStart(3, '0')}`;

      const defaultChecklist = {
        structureAnchoringChecked: false,
        panelMountingTightened: false,
        dcPolarityVerified: false,
        dcStringVocVolts: 0,
        inverterWallMounted: false,
        acDcdbInstalled: false,
        earthResistanceOhms: 0,
        lightningArresterConnected: false,
        generationTestWatts: 0,
        customerBriefed: false,
      };

      const insert = db.prepare(`
        INSERT INTO installation_jobs (
          id, jobCode, orderId, customerId, customerName, customerPhone,
          siteAddress, capacityKW, systemType, leadTechnicianId, leadTechnicianName,
          assistantTechnicianIds, scheduledStartDate, scheduledEndDate,
          stage, checklist, photos, notes, createdAt, updatedAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?,
          'SCHEDULED', ?, '{}', ?, datetime('now'), datetime('now')
        )
      `);

      insert.run(
        id,
        jobCode,
        orderId,
        customerId,
        customerName || 'Customer',
        customerPhone || '',
        siteAddress,
        Number(capacityKW),
        systemType || 'ON_GRID',
        leadTechnicianId || req.user.id,
        leadTechnicianName || req.user.name,
        JSON.stringify(assistantTechnicianIds || []),
        scheduledStartDate || new Date().toISOString().split('T')[0],
        scheduledEndDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        JSON.stringify(defaultChecklist),
        notes || ''
      );

      const created = db.prepare('SELECT * FROM installation_jobs WHERE id = ?').get(id);
      return res.status(201).json({
        success: true,
        data: {
          ...created,
          checklist: JSON.parse(created.checklist),
          photos: JSON.parse(created.photos),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/installations/:id/stage
   * Advances milestone stages
   */
  updateStage(req, res, next) {
    try {
      const { id } = req.params;
      const { stage, notes } = req.body;

      const validStages = ['SCHEDULED', 'MATERIAL_STAGED', 'IN_PROGRESS', 'TESTING', 'COMMISSIONED'];
      if (!validStages.includes(stage)) {
        return res.status(400).json({ success: false, error: 'Invalid installation stage.' });
      }

      const isCommissioned = stage === 'COMMISSIONED';

      const update = db.prepare(`
        UPDATE installation_jobs SET
          stage = ?,
          commissionedAt = CASE WHEN ? = 1 THEN datetime('now') ELSE commissionedAt END,
          notes = COALESCE(?, notes),
          updatedAt = datetime('now')
        WHERE id = ?
      `);

      const result = update.run(stage, isCommissioned ? 1 : 0, notes || null, id);

      if (result.changes === 0) {
        return res.status(404).json({ success: false, error: 'Installation job not found.' });
      }

      // If commissioned, update order stage to COMMISSIONED
      if (isCommissioned) {
        const job = db.prepare('SELECT orderId FROM installation_jobs WHERE id = ?').get(id);
        if (job && job.orderId) {
          db.prepare("UPDATE orders SET stage = 'COMMISSIONED', updatedAt = datetime('now') WHERE id = ?").run(job.orderId);
        }
      }

      return res.status(200).json({ success: true, message: `Installation stage updated to ${stage}.` });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/v1/installations/:id/checklist
   * Updates quality and electrical safety checklist
   */
  updateChecklist(req, res, next) {
    try {
      const { id } = req.params;
      const { checklist } = req.body;

      if (!checklist) {
        return res.status(400).json({ success: false, error: 'Checklist object is required.' });
      }

      const update = db.prepare(`
        UPDATE installation_jobs 
        SET checklist = ?, updatedAt = datetime('now')
        WHERE id = ?
      `);

      const result = update.run(JSON.stringify(checklist), id);

      if (result.changes === 0) {
        return res.status(404).json({ success: false, error: 'Installation job not found.' });
      }

      return res.status(200).json({ success: true, message: 'Checklist updated successfully.' });
    } catch (err) {
      next(err);
    }
  },
};

