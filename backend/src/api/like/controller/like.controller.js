import { StatusCodes } from 'http-status-codes';
import {
  voteItemService,
  getItemLikeSummaryService,
  getBulkItemLikesService,
} from '../service/like.service.js';

export const voteItemController = async (req, res, next) => {
  try {
    const { itemType, itemId } = req.params;
    const { vote } = req.body;
    const result = await voteItemService({
      userId: req.user.id,
      itemType,
      itemId: Number(itemId),
      vote,
    });
    res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getItemLikeSummaryController = async (req, res, next) => {
  try {
    const { itemType, itemId } = req.params;
    const userId = req.user?.id || 0;
    const result = await getItemLikeSummaryService({
      userId,
      itemType,
      itemId: Number(itemId),
    });
    res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getBulkItemLikesController = async (req, res, next) => {
  try {
    const { itemType } = req.params;
    const { ids } = req.query;
    const userId = req.user?.id || 0;
    const itemIds = ids ? ids.split(',').map(id => Number(id.trim())).filter(Boolean) : [];
    const result = await getBulkItemLikesService({
      userId,
      itemType,
      itemIds,
    });
    res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
