/**
 * [Member 2] Quotations & Orders Routes
 * 
 * Purpose:
 * Routes for quotations generation, customer acceptance, and order tracking.
 */

import { Router } from 'express';
import { quotationController } from './quotation.controller.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', quotationController.getQuotations);
router.get('/:id', quotationController.getQuotationById);
router.post('/', quotationController.createQuotation);
router.post('/:id/confirm-order', quotationController.confirmOrder);

// Orders endpoints
router.get('/orders/list', quotationController.getOrders);
router.get('/orders/:id', quotationController.getOrderById);

export default router;

