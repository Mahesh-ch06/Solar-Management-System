/**
 * [Member 1] Authentication Routes
 * 
 * Purpose:
 * Defines REST HTTP endpoints for user registration, login, admin portal login, session inspection, and logout.
 */

import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = Router();

router.post('/login', authController.login);
router.post('/admin-login', authController.adminLogin);
router.post('/register', authController.register);
router.get('/me', authenticateToken, authController.getMe);
router.post('/logout', authController.logout);

export default router;
