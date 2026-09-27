import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import {
  toggleFollowController,
  getFollowStatsController,
  getFollowersController,
  getFollowingController,
} from '../controller/follow.controller.js';

const router = express.Router();

// POST /api/addon/follows/:userId — toggle follow/unfollow
router.post('/:userId', authenticateUser, toggleFollowController);

// GET /api/addon/follows/:userId/stats — follower/following counts + isFollowing
router.get('/:userId/stats', authenticateUser, getFollowStatsController);

// GET /api/addon/follows/:userId/followers — list followers
router.get('/:userId/followers', authenticateUser, getFollowersController);

// GET /api/addon/follows/:userId/following — list who they follow
router.get('/:userId/following', authenticateUser, getFollowingController);

export default router;
