import { StatusCodes } from 'http-status-codes';
import {
  rateStarItemService,
  getItemStarRatingService,
  getBulkItemStarRatingsService,
  rateAnswerService,
  getAnswerRatingService,
  getBulkRatingsService,
} from '../service/rating.service.js';

/**
 * 1-5 Star Ratings Controller
 */
export const rateStarItemController = async (req, res, next) => {
  try {
    const { itemType, itemId } = req.params;
    const { score } = req.body;
    const userId = req.user.id;

    const result = await rateStarItemService({
      userId,
      itemType,
      itemId: Number(itemId),
      score,
    });
    res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getItemStarRatingController = async (req, res, next) => {
  try {
    const { itemType, itemId } = req.params;
    const userId = req.user?.id || 0;

    const result = await getItemStarRatingService({
      userId,
      itemType,
      itemId: Number(itemId),
    });
    res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getBulkItemStarRatingsController = async (req, res, next) => {
  try {
    const { itemType } = req.params;
    const { ids } = req.query;
    const userId = req.user?.id || 0;
    const itemIds = ids
      ? ids
          .split(',')
          .map(id => parseInt(id.trim(), 10))
          .filter(Boolean)
      : [];

    const result = await getBulkItemStarRatingsService({
      userId,
      itemType,
      itemIds,
    });
    res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Legacy Answer Ratings Controller
 */
export const rateAnswerController = async (req, res, next) => {
  try {
    const answerId = parseInt(req.params.answerId, 10);
    const userId = req.user.id;
    const { value } = req.body;

    const result = await rateAnswerService({ answerId, userId, value: Number(value) });
    res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getAnswerRatingController = async (req, res, next) => {
  try {
    const answerId = parseInt(req.params.answerId, 10);
    const userId = req.user?.id || 0;

    const result = await getAnswerRatingService({ answerId, userId });
    res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getBulkRatingsController = async (req, res, next) => {
  try {
    const userId = req.user?.id || 0;
    const ids = (req.query.ids || '')
      .split(',')
      .map(id => parseInt(id.trim(), 10))
      .filter(id => !isNaN(id));

    const result = await getBulkRatingsService({ answerIds: ids, userId });
    res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
