import { safeExecute } from '../../../../db/config.js';
import { BadRequestError, NotFoundError } from '../../../utils/errors/index.js';

/**
 * Toggle follow/unfollow. Returns the new follow state.
 */
export const toggleFollowService = async ({ followerId, followingId }) => {
  if (followerId === followingId) {
    throw new BadRequestError('You cannot follow yourself.');
  }

  // Check target user exists
  const userRows = await safeExecute(
    `SELECT user_id FROM users WHERE user_id = ?`,
    [followingId],
  );
  if (!userRows.length) {
    throw new NotFoundError('User not found.');
  }

  // Check if already following
  const existing = await safeExecute(
    `SELECT follow_id FROM follows WHERE follower_id = ? AND following_id = ?`,
    [followerId, followingId],
  );

  if (existing.length) {
    // Unfollow
    await safeExecute(
      `DELETE FROM follows WHERE follower_id = ? AND following_id = ?`,
      [followerId, followingId],
    );
    const stats = await getFollowStatsService({ targetUserId: followingId, viewerId: followerId });
    return { following: false, ...stats };
  } else {
    // Follow
    await safeExecute(
      `INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`,
      [followerId, followingId],
    );
    const stats = await getFollowStatsService({ targetUserId: followingId, viewerId: followerId });
    return { following: true, ...stats };
  }
};

/**
 * Get follower/following counts for a user.
 */
export const getFollowStatsService = async ({ targetUserId, viewerId }) => {
  const [{ followerCount }] = await safeExecute(
    `SELECT COUNT(*) AS followerCount FROM follows WHERE following_id = ?`,
    [targetUserId],
  );

  const [{ followingCount }] = await safeExecute(
    `SELECT COUNT(*) AS followingCount FROM follows WHERE follower_id = ?`,
    [targetUserId],
  );

  let isFollowing = false;
  if (viewerId && viewerId !== targetUserId) {
    const rows = await safeExecute(
      `SELECT follow_id FROM follows WHERE follower_id = ? AND following_id = ?`,
      [viewerId, targetUserId],
    );
    isFollowing = rows.length > 0;
  }

  return {
    followerCount: Number(followerCount),
    followingCount: Number(followingCount),
    isFollowing,
  };
};

/**
 * List followers of a user.
 */
export const getFollowersService = async ({ targetUserId, limit = 20, offset = 0 }) => {
  return safeExecute(
    `SELECT u.user_id AS id, u.first_name AS firstName, u.last_name AS lastName,
            u.avatar_url AS avatarUrl, f.created_at AS followedAt
     FROM follows f
     JOIN users u ON u.user_id = f.follower_id
     WHERE f.following_id = ?
     ORDER BY f.created_at DESC
     LIMIT ? OFFSET ?`,
    [targetUserId, limit, offset],
  );
};

/**
 * List users that targetUser is following.
 */
export const getFollowingService = async ({ targetUserId, limit = 20, offset = 0 }) => {
  return safeExecute(
    `SELECT u.user_id AS id, u.first_name AS firstName, u.last_name AS lastName,
            u.avatar_url AS avatarUrl, f.created_at AS followedAt
     FROM follows f
     JOIN users u ON u.user_id = f.following_id
     WHERE f.follower_id = ?
     ORDER BY f.created_at DESC
     LIMIT ? OFFSET ?`,
    [targetUserId, limit, offset],
  );
};
