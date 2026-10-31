/**
 * [Member 2] Orders Routes
 * 
 * Purpose:
 * Dedicated REST routes for confirmed solar project orders.
 */

import { Router } from 'express';
import { quotationController } from './quotation.controller.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', quotationController.getOrders);
router.get('/:id', quotationController.getOrderById);
router.patch('/:id', quotationController.updateOrder);
router.patch('/:id/stage', quotationController.updateOrder);

export default router;
