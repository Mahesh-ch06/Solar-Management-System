/**
 * [Member 1] Administrative Portal Routes
 * 
 * Purpose:
 * Routes for administrative operations protected by JWT and role authorization (ADMIN, DIRECTOR).
 */

import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/authMiddleware.js';

const router = Router();

// Only ADMIN and DIRECTOR can access user management and audit logs
router.use(authenticateToken);
router.use(requireRoles('ADMIN', 'DIRECTOR'));

router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/role', adminController.updateUserRole);
router.get('/audit-logs', adminController.getAuditLogs);

export default router;

