/**
 * [Member 3] Equipment Dispatch Routes
 * 
 * Purpose:
 * Routes for picking orders, barcode serial scanning, anti-duplicate validation,
 * and delivery tracking.
 */

import { Router } from 'express';
import { dispatchController } from './dispatch.controller.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

// List all dispatches
router.get('/', dispatchController.getDispatches);

// Anti-Duplicate Barcode Pre-Check (Must come before /:id parameterized route)
router.post('/validate-serial', dispatchController.validateSerial);

// Single dispatch operations
router.get('/:id', dispatchController.getDispatchById);
router.post('/', dispatchController.createDispatch);
router.post('/:id/scan-serial', dispatchController.scanSerial);
router.put('/:id/scan', dispatchController.updateScan);
router.patch('/:id/status', dispatchController.updateStatus);
router.patch('/:id/complete', dispatchController.markComplete);
router.delete('/:id', dispatchController.deleteDispatch);

export default router;
