/**
 * [Member 4] Dashboard & Analytics Routes
 * 
 * Purpose:
 * Routes for executive KPI metrics and finance summary.
 */

import { Router } from 'express';
import { dashboardController } from './dashboard.controller.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/metrics', dashboardController.getMetrics);
router.get('/finance-summary', dashboardController.getFinanceSummary);

export default router;

