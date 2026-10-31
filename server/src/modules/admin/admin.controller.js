/**
 * [Member 1] Administrative Portal Controller
 * 
 * Purpose:
 * Allows System Administrators and Directors to inspect all employees,
 * approve new registrations, change user roles, and inspect security audit trails.
 * 
 * Why in this file?
 * Keeps administrative and governance logic isolated from everyday sales/field logic.
 */

import { db } from '../../db/database.js';

export const adminController = {
  /**
   * GET /api/v1/admin/users
   * Lists all employees in the organization (without revealing password hashes)
   */
  getUsers(req, res, next) {
    try {
      const stmt = db.prepare(`
        SELECT id, name, email, phone, role, department, status, roleAssignedBy, roleAssignedAt, createdAt, updatedAt
        FROM users
        ORDER BY createdAt DESC
      `);
      const users = stmt.all();
      return res.status(200).json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/admin/users/:id/status
   * Approves or suspends user accounts
   */
  updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid user status value.' });
      }

      const update = db.prepare(`
        UPDATE users 
        SET status = ?, updatedAt = datetime('now')
        WHERE id = ?
      `);
      const result = update.run(status, id);

      if (result.changes === 0) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      return res.status(200).json({ success: true, message: `User status updated to ${status}.` });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/admin/users/:id/role
   * Changes employee role and records an immutable audit log
   */
  updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role, reason } = req.body;

      if (!['ADMIN', 'DIRECTOR', 'SALES', 'TECHNICIAN', 'WAREHOUSE_MANAGER', 'SUPPORT_AGENT'].includes(role)) {
        return res.status(400).json({ success: false, error: 'Invalid role value.' });
      }

      const existingUser = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(id);
      if (!existingUser) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      const oldRole = existingUser.role;

      // Update user
      const updateUser = db.prepare(`
        UPDATE users 
        SET role = ?, roleAssignedBy = ?, roleAssignedAt = datetime('now'), updatedAt = datetime('now')
        WHERE id = ?
      `);
      updateUser.run(role, `${req.user.name} (${req.user.role})`, id);

      // Create Audit Entry
      const insertAudit = db.prepare(`
        INSERT INTO role_audit_logs (id, userId, userName, oldRole, newRole, changedById, changedByName, reason, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);
      insertAudit.run(
        `audit-${Date.now().toString(36)}`,
        id,
        existingUser.name,
        oldRole,
        role,
        req.user.id,
        req.user.name,
        reason || 'Administrative role adjustment'
      );

      return res.status(200).json({ success: true, message: `Role updated from ${oldRole} to ${role}.` });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/admin/audit-logs
   * Fetches history of all role changes for security and compliance audits
   */
  getAuditLogs(req, res, next) {
    try {
      const logs = db.prepare('SELECT * FROM role_audit_logs ORDER BY createdAt DESC').all();
      return res.status(200).json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  },
};

