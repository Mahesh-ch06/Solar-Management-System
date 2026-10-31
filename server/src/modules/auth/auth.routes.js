/**
 * [Member 1] Authentication Routes
 * 
 * Purpose:
 * Defines REST HTTP endpoints for user registration, login, and profile fetching.
 */

import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', authenticateToken, authController.getMe);

export default router;

