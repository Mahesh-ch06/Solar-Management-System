/**
 * [Member 3] Warehouse Inventory Routes
 * 
 * Purpose:
 * Routes for inventory items, stock movements, low stock threshold tracking,
 * and stock quantity adjustments.
 */

import { Router } from 'express';
import { inventoryController } from './inventory.controller.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

// Item catalog & stock movements list (Must come before /:id parameterized routes)
router.get('/', inventoryController.getItems);
router.get('/movements/list', inventoryController.getMovements);
router.get('/movements', inventoryController.getMovements);

// Stock movement actions
router.post('/stock-movement', inventoryController.recordMovement);
router.post('/movements', inventoryController.recordMovement);

// Single item CRUD & quick adjust
router.get('/:id', inventoryController.getItemById);
router.post('/', inventoryController.createItem);
router.put('/:id', inventoryController.updateItem);
router.patch('/:id', inventoryController.updateItem);
router.delete('/:id', inventoryController.deleteItem);
router.post('/:id/adjust', inventoryController.adjustItemStock);
router.patch('/:id/adjust', inventoryController.adjustItemStock);

export default router;
