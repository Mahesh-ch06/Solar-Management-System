/**
 * [Member 3] Warranty Registry Routes
 * 
 * Purpose:
 * Routes for warranty lookup and certificate validation.
 */

import { Router } from 'express';
import { warrantyController } from './warranty.controller.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', warrantyController.getWarranties);
router.get('/verify/:serialNumber', warrantyController.verifyWarranty);

export default router;

