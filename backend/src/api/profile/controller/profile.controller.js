import { StatusCodes } from 'http-status-codes';
import { getProfileService, updateProfileService } from '../service/profile.service.js';

export const getProfileController = async (req, res) => {
  const targetUserId = parseInt(req.params.userId, 10);
  const viewerId = req.user?.id ?? null;

  const profile = await getProfileService({ targetUserId, viewerId });
  res.status(StatusCodes.OK).json({ success: true, data: profile });
};

export const updateProfileController = async (req, res) => {
  const userId = req.user.id;
  const { username, firstName, lastName, bio, avatarUrl } = req.body;

  const profile = await updateProfileService({
    userId,
    username,
    firstName,
    lastName,
    bio,
    avatarUrl,
  });
  res.status(StatusCodes.OK).json({ success: true, data: profile });
};
