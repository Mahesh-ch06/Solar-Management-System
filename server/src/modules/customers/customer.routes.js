/**
 * [Member 2] Customer Routes
 * 
 * Purpose:
 * Routes for CRUD operations on leads and clients, search, smart consultant assignment,
 * and pipeline status progression.
 */

import { Router } from 'express';
import { customerController } from './customer.controller.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = Router();

// Public / Guest routes (Homeowners submitting web enquiries or checking queue)
router.post('/', customerController.createCustomer);
router.get('/queue/status', customerController.getQueueStatus);

// Protect CRM management routes with staff authentication
router.use(authenticateToken);

router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);
router.put('/:id', customerController.updateCustomer);
router.patch('/:id/status', customerController.updateCustomerStatus);
router.patch('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

export default router;
