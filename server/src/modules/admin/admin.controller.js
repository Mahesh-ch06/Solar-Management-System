/**
 * [Member 1] Administrative Portal Controller
 * 
 * Purpose:
 * Allows System Administrators and Directors to inspect all employees,
 * approve new registrations, change user roles with immutable audit logging,
 * and inspect security audit trails.
 * 
 * Why in this file?
 * Keeps administrative and governance logic isolated from everyday sales/field logic.
 */

import { db } from '../../db/database.js';

const VALID_STATUSES = ['ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED'];
const VALID_ROLES = ['ADMIN', 'DIRECTOR', 'SALES', 'TECHNICIAN', 'WAREHOUSE_MANAGER', 'SUPPORT_AGENT'];

export const adminController = {
  /**
   * GET /api/v1/admin/users
   * Lists all employees in the organization (without revealing password hashes)
   * Supports filtering by ?role=..., ?status=..., and ?search=...
   */
  getUsers(req, res, next) {
    try {
      let sql = `
        SELECT id, name, email, phone, role, department, status, roleAssignedBy, roleAssignedAt, createdAt, updatedAt
        FROM users
        WHERE 1=1
      `;
      const params = [];

      const { role, status, search } = req.query;

      if (role && role !== 'ALL') {
        sql += ' AND role = ?';
        params.push(role);
      }

      if (status && status !== 'ALL') {
        sql += ' AND status = ?';
        params.push(status);
      }

      if (search && search.trim()) {
        const searchTerm = `%${search.trim().toLowerCase()}%`;
        sql += " AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(COALESCE(department, '')) LIKE ? OR LOWER(COALESCE(phone, '')) LIKE ?)";
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      sql += ' ORDER BY createdAt DESC';

      const stmt = db.prepare(sql);
      const users = stmt.all(...params);

      return res.status(200).json({
        success: true,
        count: users.length,
        data: users,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/admin/users/:id
   * Fetches single employee profile
   */
  getUserById(req, res, next) {
    try {
      const { id } = req.params;

      const user = db.prepare(`
        SELECT id, name, email, phone, role, department, status, roleAssignedBy, roleAssignedAt, createdAt, updatedAt
        FROM users
        WHERE id = ?
      `).get(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found.',
          message: 'User not found.',
        });
      }

      return res.status(200).json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
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
      const { status } = req.body || {};

      if (!status || !VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid user status value. Allowed: ${VALID_STATUSES.join(', ')}`,
          message: `Invalid user status value. Allowed: ${VALID_STATUSES.join(', ')}`,
        });
      }

      // Prevent administrator from suspending their own active session
      if (req.user.id === id && status === 'SUSPENDED') {
        return res.status(400).json({
          success: false,
          error: 'Administrators cannot suspend their own active account.',
          message: 'Administrators cannot suspend their own active account.',
        });
      }

      const existingUser = db.prepare('SELECT id, name, email, role, status FROM users WHERE id = ?').get(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found.',
          message: 'User not found.',
        });
      }

      const approverInfo = `${req.user.name} (${req.user.role})`;

      const update = db.prepare(`
        UPDATE users 
        SET status = ?, 
            roleAssignedBy = COALESCE(roleAssignedBy, ?),
            roleAssignedAt = COALESCE(roleAssignedAt, datetime('now')),
            updatedAt = datetime('now')
        WHERE id = ?
      `);
      update.run(status, approverInfo, id);

      const updatedUser = db.prepare(`
        SELECT id, name, email, phone, role, department, status, roleAssignedBy, roleAssignedAt, createdAt, updatedAt
        FROM users
        WHERE id = ?
      `).get(id);

      return res.status(200).json({
        success: true,
        message: `User status updated to ${status}.`,
        data: updatedUser,
        timestamp: new Date().toISOString(),
      });
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
      const { role, newRole, reason, activateUser } = req.body || {};
      const targetRole = role || newRole;

      if (!targetRole || !VALID_ROLES.includes(targetRole)) {
        return res.status(400).json({
          success: false,
          error: `Invalid role value. Allowed: ${VALID_ROLES.join(', ')}`,
          message: `Invalid role value. Allowed: ${VALID_ROLES.join(', ')}`,
        });
      }

      const existingUser = db.prepare('SELECT id, name, email, role, status FROM users WHERE id = ?').get(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found.',
          message: 'User not found.',
        });
      }

      // Security Guard: Prevent admin from demoting themselves and locking out administration
      if (req.user.id === id && existingUser.role === 'ADMIN' && targetRole !== 'ADMIN') {
        return res.status(400).json({
          success: false,
          error: 'Administrators cannot demote their own account to prevent administrative lockout.',
          message: 'Administrators cannot demote their own account to prevent administrative lockout.',
        });
      }

      const oldRole = existingUser.role;
      const approverInfo = `${req.user.name} (${req.user.role})`;

      // If user was pending approval, assigning a role activates them automatically
      let newStatus = existingUser.status;
      if (existingUser.status === 'PENDING_APPROVAL' || activateUser === true) {
        newStatus = 'ACTIVE';
      }

      // Update user
      const updateUser = db.prepare(`
        UPDATE users 
        SET role = ?, 
            status = ?,
            roleAssignedBy = ?, 
            roleAssignedAt = datetime('now'), 
            updatedAt = datetime('now')
        WHERE id = ?
      `);
      updateUser.run(targetRole, newStatus, approverInfo, id);

      // Create Immutable Audit Entry
      const auditId = `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const cleanReason = reason && String(reason).trim() 
        ? String(reason).trim() 
        : `Role changed from ${oldRole} to ${targetRole}`;

      const insertAudit = db.prepare(`
        INSERT INTO role_audit_logs (id, userId, userName, oldRole, newRole, changedById, changedByName, reason, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);
      insertAudit.run(
        auditId,
        id,
        existingUser.name,
        oldRole,
        targetRole,
        req.user.id,
        req.user.name,
        cleanReason
      );

      const updatedUser = db.prepare(`
        SELECT id, name, email, phone, role, department, status, roleAssignedBy, roleAssignedAt, createdAt, updatedAt
        FROM users
        WHERE id = ?
      `).get(id);

      const auditRecord = db.prepare('SELECT * FROM role_audit_logs WHERE id = ?').get(auditId);

      return res.status(200).json({
        success: true,
        message: `Role successfully updated from ${oldRole} to ${targetRole}.`,
        data: {
          user: updatedUser,
          auditLog: auditRecord,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/admin/audit-logs
   * Fetches history of all role changes for security and compliance audits
   * Supports ?userId=... query filter
   */
  getAuditLogs(req, res, next) {
    try {
      let sql = 'SELECT * FROM role_audit_logs';
      const params = [];

      if (req.query.userId) {
        sql += ' WHERE userId = ?';
        params.push(req.query.userId);
      }

      sql += ' ORDER BY createdAt DESC';

      const logs = db.prepare(sql).all(...params);

      return res.status(200).json({
        success: true,
        count: logs.length,
        data: logs,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/admin/users/:id/audit-logs
   * Fetches audit history specifically for a single staff member
   */
  getUserAuditLogs(req, res, next) {
    try {
      const { id } = req.params;

      const logs = db.prepare(`
        SELECT * FROM role_audit_logs 
        WHERE userId = ? 
        ORDER BY createdAt DESC
      `).all(id);

      return res.status(200).json({
        success: true,
        count: logs.length,
        data: logs,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },
};
