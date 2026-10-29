import { StatusCodes } from 'http-status-codes';
import fs from 'fs/promises';
import path from 'path';
import { getProfileService, updateProfileService } from '../service/profile.service.js';

const profileWithAvatarOrigin = (profile, req) => ({
  ...profile,
  avatarUrl: profile.avatarUrl?.startsWith('/uploads/profile/')
    ? req.protocol + '://' + req.get('host') + profile.avatarUrl
    : profile.avatarUrl,
});

export const getProfileController = async (req, res) => {
  const targetUserId = parseInt(req.params.userId, 10);
  const viewerId = req.user?.id ?? null;

  const profile = await getProfileService({ targetUserId, viewerId });
  res.status(StatusCodes.OK).json({ success: true, data: profileWithAvatarOrigin(profile, req) });
};

export const updateProfileController = async (req, res) => {
  const userId = req.user.id;
  const { username, firstName, lastName, bio, avatarUrl } = req.body;
  const storedAvatarUrl = req.file
    ? '/uploads/profile/' + path.basename(req.file.filename)
    : avatarUrl;

  try {
    const profile = await updateProfileService({
      userId, username, firstName, lastName, bio, avatarUrl: storedAvatarUrl,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      data: profileWithAvatarOrigin(profile, req),
    });
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(cleanupError => {
        console.warn('Could not remove failed profile picture upload:', cleanupError.message);
      });
    }
    throw error;
  }
};
