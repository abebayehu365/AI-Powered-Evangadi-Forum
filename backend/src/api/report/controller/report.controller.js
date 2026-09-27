import { StatusCodes } from 'http-status-codes';
import {
  createReportService,
  listReportsService,
  updateReportStatusService,
  deleteReportedContentService,
} from '../service/report.service.js';

export const createReportController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { targetType, itemType, targetId, itemId, reason, description, details } = req.body;

    const result = await createReportService({
      userId,
      itemType: itemType || targetType,
      itemId: parseInt(itemId || targetId, 10),
      reason,
      details: details || description,
    });

    res.status(StatusCodes.CREATED).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listReportsController = async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const reports = await listReportsService({
      status,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
    res.status(StatusCodes.OK).json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

export const updateReportStatusController = async (req, res, next) => {
  try {
    const reportId = parseInt(req.params.reportId, 10);
    const { status } = req.body;

    const result = await updateReportStatusService({ reportId, status });
    res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const deleteReportedContentController = async (req, res, next) => {
  try {
    const reportId = parseInt(req.params.reportId, 10);
    const result = await deleteReportedContentService({ reportId });
    res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
