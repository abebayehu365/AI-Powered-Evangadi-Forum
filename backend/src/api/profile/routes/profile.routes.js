import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import {
  getProfileController,
  updateProfileController,
} from '../controller/profile.controller.js';

const router = express.Router();

// GET /api/addon/profiles/:userId — get public profile (auth optional for isFollowing field)
router.get('/:userId', authenticateUser, getProfileController);

// PUT /api/addon/profiles/me — update own profile (must be authenticated)
router.put('/me', authenticateUser, updateProfileController);

export default router;
