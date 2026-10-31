/**
 * [Member 1] Administrative Portal Routes
 * 
 * Purpose:
 * Routes for administrative operations protected by JWT and role authorization (ADMIN, DIRECTOR).
 * Supports both PATCH and PUT for updates, user filtering, single-user lookups, and audit trails.
 * Supports mounting at both /api/v1/admin and /api/v1/users.
 */

import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/authMiddleware.js';

const router = Router();

// All admin endpoints require valid JWT and ADMIN or DIRECTOR privileges
router.use(authenticateToken);
router.use(requireRoles('ADMIN', 'DIRECTOR'));

// 1. Audit Logs (Must be defined before parameterized /:id routes to avoid collision)
router.get('/audit-logs', adminController.getAuditLogs);
router.get(['/users/audit-logs', '/audit/logs'], adminController.getAuditLogs);
router.get(['/users/:id/audit-logs', '/:id/audit-logs'], adminController.getUserAuditLogs);

// 2. User Collections
router.get(['/users', '/'], adminController.getUsers);

// 3. User Mutations & Single User Lookups
router.patch(['/users/:id/status', '/:id/status'], adminController.updateUserStatus);
router.put(['/users/:id/status', '/:id/status'], adminController.updateUserStatus);
router.patch(['/users/:id/role', '/:id/role'], adminController.updateUserRole);
router.put(['/users/:id/role', '/:id/role'], adminController.updateUserRole);
router.get(['/users/:id', '/:id'], adminController.getUserById);

export default router;
