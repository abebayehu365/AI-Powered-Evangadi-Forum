import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import {
  createReportController,
  listReportsController,
  updateReportStatusController,
} from '../controller/report.controller.js';

const router = express.Router();

// POST /api/addon/reports — submit a new report
router.post('/', authenticateUser, createReportController);

// GET /api/addon/reports — list all reports (authenticated users; filtering by status)
router.get('/', authenticateUser, listReportsController);

// PATCH /api/addon/reports/:reportId/status — update a report's status
router.patch('/:reportId/status', authenticateUser, updateReportStatusController);

export default router;
