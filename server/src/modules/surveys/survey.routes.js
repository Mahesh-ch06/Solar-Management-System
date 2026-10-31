/**
 * [Member 2] Site Survey Routes
 * 
 * Purpose:
 * Routes for technical site audit submission and feasibility evaluation.
 */

import { Router } from 'express';
import { surveyController } from './survey.controller.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', surveyController.getSurveys);
router.get('/:id', surveyController.getSurveyById);
router.post('/', surveyController.createSurvey);
router.patch('/:id/feasibility', surveyController.updateFeasibility);

export default router;

