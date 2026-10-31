/**
 * [Member 3] Warehouse Inventory Routes
 * 
 * Purpose:
 * Routes for inventory items, stock movements, and low stock threshold tracking.
 */

import { Router } from 'express';
import { inventoryController } from './inventory.controller.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', inventoryController.getItems);
router.get('/movements/list', inventoryController.getMovements);
router.get('/:id', inventoryController.getItemById);
router.post('/', inventoryController.createItem);
router.post('/stock-movement', inventoryController.recordMovement);

export default router;

