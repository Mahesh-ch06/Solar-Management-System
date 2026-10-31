/**
 * [Member 3] Equipment Dispatch Routes
 * 
 * Purpose:
 * Routes for picking orders, barcode scanning, and delivery tracking.
 */

import { Router } from 'express';
import { dispatchController } from './dispatch.controller.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', dispatchController.getDispatches);
router.get('/:id', dispatchController.getDispatchById);
router.post('/', dispatchController.createDispatch);
router.post('/:id/scan-serial', dispatchController.scanSerial);
router.patch('/:id/status', dispatchController.updateStatus);

export default router;

