/**
 * [Member 2] Site Survey Routes
 * 
 * Purpose:
 * Routes for technical site audit submission, feasibility evaluation, and customer audit histories.
 */

import { Router } from 'express';
import { surveyController } from './survey.controller.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', surveyController.getSurveys);
router.get('/customer/:customerId', surveyController.getSurveysByCustomerId);
router.get('/:id', surveyController.getSurveyById);
router.post('/', surveyController.createSurvey);
router.put('/:id', surveyController.updateSurvey);
router.patch('/:id', surveyController.updateSurvey);
router.patch('/:id/feasibility', surveyController.updateFeasibility);
router.patch('/:id/status', surveyController.updateFeasibility);
router.delete('/:id', surveyController.deleteSurvey);

export default router;
