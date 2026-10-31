/**
 * [Member 2] Customer Routes
 * 
 * Purpose:
 * Routes for CRUD operations on leads and clients.
 */

import { Router } from 'express';
import { customerController } from './customer.controller.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = Router();

// Protect customer routes with authentication
router.use(authenticateToken);

router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);
router.post('/', customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

export default router;

