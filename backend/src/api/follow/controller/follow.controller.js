import { StatusCodes } from 'http-status-codes';
import {
  toggleFollowService,
  getFollowStatsService,
  getFollowersService,
  getFollowingService,
} from '../service/follow.service.js';

export const toggleFollowController = async (req, res) => {
  const followerId = req.user.id;
  const followingId = parseInt(req.params.userId, 10);

  const result = await toggleFollowService({ followerId, followingId });
  res.status(StatusCodes.OK).json({ success: true, data: result });
};

export const getFollowStatsController = async (req, res) => {
  const targetUserId = parseInt(req.params.userId, 10);
  const viewerId = req.user?.id ?? null;

  const result = await getFollowStatsService({ targetUserId, viewerId });
  res.status(StatusCodes.OK).json({ success: true, data: result });
};

export const getFollowersController = async (req, res) => {
  const targetUserId = parseInt(req.params.userId, 10);
  const { limit = 20, offset = 0 } = req.query;

  const followers = await getFollowersService({
    targetUserId,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
  });
  res.status(StatusCodes.OK).json({ success: true, data: followers });
};

export const getFollowingController = async (req, res) => {
  const targetUserId = parseInt(req.params.userId, 10);
  const { limit = 20, offset = 0 } = req.query;

  const following = await getFollowingService({
    targetUserId,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
  });
  res.status(StatusCodes.OK).json({ success: true, data: following });
};
