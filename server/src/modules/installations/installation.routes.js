/**
 * [Member 4] Field Installations Routes
 * 
 * Purpose:
 * Routes for tracking installation jobs, milestone stage progression, and commissioning checklist.
 */

import { Router } from 'express';
import { installationController } from './installation.controller.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', installationController.getJobs);
router.get('/:id', installationController.getJobById);
router.post('/', installationController.createJob);
router.patch('/:id/stage', installationController.updateStage);
router.put('/:id/checklist', installationController.updateChecklist);

export default router;

