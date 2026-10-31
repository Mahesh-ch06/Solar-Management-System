/**
 * [Member 4] Post-Sales Service Routes
 * 
 * Purpose:
 * Routes for customer service ticket submission and lifecycle updates.
 */

import { Router } from 'express';
import { serviceController } from './service.controller.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', serviceController.getTickets);
router.get('/:id', serviceController.getTicketById);
router.post('/', serviceController.createTicket);
router.patch('/:id/status', serviceController.updateTicketStatus);

export default router;

