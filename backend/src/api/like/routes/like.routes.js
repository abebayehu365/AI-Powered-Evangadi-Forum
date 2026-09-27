import express from 'express';
import {
  authenticateUser,
  optionalAuthenticateUser,
} from '../../../middleware/authentication.js';
import {
  voteItemController,
  getItemLikeSummaryController,
  getBulkItemLikesController,
} from '../controller/like.controller.js';

const router = express.Router();

/**
 * @route GET /api/likes/bulk
 * @desc Get like stats for multiple items
 * @access Public / Optional Auth
 */
router.get('/bulk/:itemType', optionalAuthenticateUser, getBulkItemLikesController);

/**
 * @route GET /api/likes/:itemType/:itemId
 * @desc Get like stats for a single question or answer
 * @access Public / Optional Auth
 */
router.get('/:itemType/:itemId', optionalAuthenticateUser, getItemLikeSummaryController);

/**
 * @route POST /api/likes/:itemType/:itemId
 * @desc Like (1), unlike (-1), or remove vote (0)
 * @access Protected
 */
router.post('/:itemType/:itemId', authenticateUser, voteItemController);

export default router;
