/**
 * [Member 3] Warranty Registry Routes
 * 
 * Purpose:
 * Routes for warranty lookup, certificate validation, expiring warranty alerts,
 * and warranty status updates.
 */

import { Router } from 'express';
import { warrantyController } from './warranty.controller.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

// List all warranties & expiring warranties (Must come before /:id parameterized routes)
router.get('/', warrantyController.getWarranties);
router.get('/expiring', warrantyController.getExpiringWarranties);

// Instant Serial Number Lookup & Verification (aliases)
router.get('/verify/:serialNumber', warrantyController.verifyWarranty);
router.get('/lookup/:serialNumber', warrantyController.verifyWarranty);

// Create and update warranty status
router.post('/', warrantyController.createWarranty);
router.patch('/:id/status', warrantyController.updateStatus);

export default router;
