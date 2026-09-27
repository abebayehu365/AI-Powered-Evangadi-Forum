import express from 'express';
import {
  authenticateUser,
  optionalAuthenticateUser,
} from '../../../middleware/authentication.js';
import {
  rateStarItemController,
  getItemStarRatingController,
  getBulkItemStarRatingsController,
  rateAnswerController,
  getAnswerRatingController,
  getBulkRatingsController,
} from '../controller/rating.controller.js';

const router = express.Router();

/**
 * 1-5 Star Ratings
 */
router.post('/stars/:itemType/:itemId', authenticateUser, rateStarItemController);
router.get('/stars/bulk/:itemType', optionalAuthenticateUser, getBulkItemStarRatingsController);
router.get('/stars/:itemType/:itemId', optionalAuthenticateUser, getItemStarRatingController);

/**
 * Legacy Answer Ratings
 */
router.post('/answers/:answerId', authenticateUser, rateAnswerController);
router.get('/answers/:answerId', optionalAuthenticateUser, getAnswerRatingController);
router.get('/bulk', optionalAuthenticateUser, getBulkRatingsController);

export default router;
