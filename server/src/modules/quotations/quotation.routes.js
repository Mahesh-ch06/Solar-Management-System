/**
 * [Member 2] Quotations & Orders Routes
 * 
 * Purpose:
 * Routes for quotations generation, auto-BOM computation, customer acceptance, and order tracking.
 */

import { Router } from 'express';
import { quotationController } from './quotation.controller.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

// ==========================================
// Orders endpoints (must precede /:id)
// ==========================================
router.get('/orders/list', quotationController.getOrders);
router.get('/orders', quotationController.getOrders);
router.get('/orders/:id', quotationController.getOrderById);
router.patch('/orders/:id', quotationController.updateOrder);
router.patch('/orders/:id/stage', quotationController.updateOrder);

// ==========================================
// Quotation endpoints
// ==========================================
router.get('/', quotationController.getQuotations);
router.get('/:id', quotationController.getQuotationById);
router.post('/', quotationController.createQuotation);
router.put('/:id', quotationController.updateQuotation);
router.patch('/:id', quotationController.updateQuotation);
router.patch('/:id/status', quotationController.updateQuotationStatus);
router.post('/:id/confirm-order', quotationController.confirmOrder);
router.post('/:id/convert-to-order', quotationController.confirmOrder);
router.delete('/:id', quotationController.deleteQuotation);

export default router;
