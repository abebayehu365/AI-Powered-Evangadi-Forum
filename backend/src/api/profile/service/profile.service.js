import { safeExecute } from '../../../../db/config.js';
import { BadRequestError, NotFoundError } from '../../../utils/errors/index.js';

/**
 * Get a user's public profile with activity statistics.
 */
export const getProfileService = async ({ targetUserId, viewerId }) => {
  // Fetch user base info
  const userRows = await safeExecute(
    `SELECT
       user_id    AS id,
       username,
       first_name AS firstName,
       last_name  AS lastName,
       email,
       bio,
       avatar_url AS avatarUrl,
       created_at AS createdAt
     FROM users
     WHERE user_id = ?
     LIMIT 1`,
    [targetUserId],
  );

  if (!userRows.length) {
    throw new NotFoundError('User not found.');
  }

  const user = userRows[0];

  // Question count
  const [{ questionCount }] = await safeExecute(
    `SELECT COUNT(*) AS questionCount FROM questions WHERE user_id = ?`,
    [targetUserId],
  );

  // Answer count
  const [{ answerCount }] = await safeExecute(
    `SELECT COUNT(*) AS answerCount FROM answers WHERE user_id = ?`,
    [targetUserId],
  );

  // Follower / following counts
  const [{ followerCount }] = await safeExecute(
    `SELECT COUNT(*) AS followerCount FROM follows WHERE following_id = ?`,
    [targetUserId],
  );

  const [{ followingCount }] = await safeExecute(
    `SELECT COUNT(*) AS followingCount FROM follows WHERE follower_id = ?`,
    [targetUserId],
  );

  // Is the viewer following this profile?
  let isFollowing = false;
  if (viewerId && viewerId !== targetUserId) {
    const followRows = await safeExecute(
      `SELECT follow_id FROM follows WHERE follower_id = ? AND following_id = ?`,
      [viewerId, targetUserId],
    );
    isFollowing = followRows.length > 0;
  }

  // Recent 5 questions
  const recentQuestions = await safeExecute(
    `SELECT question_hash AS hash, title, created_at AS createdAt
     FROM questions
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 5`,
    [targetUserId],
  );

  // Recent 5 answers
  const recentAnswers = await safeExecute(
    `SELECT a.answer_id AS answerId, q.question_hash AS questionHash, q.title AS questionTitle,
            a.created_at AS createdAt
     FROM answers a
     JOIN questions q ON q.question_id = a.question_id
     WHERE a.user_id = ?
     ORDER BY a.created_at DESC
     LIMIT 5`,
    [targetUserId],
  );

  return {
    ...user,
    stats: {
      questions: Number(questionCount),
      answers: Number(answerCount),
      followers: Number(followerCount),
      following: Number(followingCount),
    },
    isFollowing,
    recentQuestions,
    recentAnswers,
  };
};

/**
 * Update authenticated user's own profile (username, names, bio, avatar_url).
 */
export const updateProfileService = async ({ userId, username, firstName, lastName, bio, avatarUrl }) => {
  const fields = [];
  const values = [];

  if (username !== undefined) {
    fields.push('username = ?');
    values.push(username ? username.trim() : null);
  }
  if (firstName !== undefined && firstName.trim()) {
    fields.push('first_name = ?');
    values.push(firstName.trim());
  }
  if (lastName !== undefined && lastName.trim()) {
    fields.push('last_name = ?');
    values.push(lastName.trim());
  }
  if (bio !== undefined) {
    fields.push('bio = ?');
    values.push(bio ? bio.trim() : null);
  }
  if (avatarUrl !== undefined) {
    fields.push('avatar_url = ?');
    values.push(avatarUrl ? avatarUrl.trim() : null);
  }

  if (fields.length > 0) {
    values.push(userId);
    await safeExecute(
      `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`,
      values,
    );
  }

  return getProfileService({ targetUserId: userId, viewerId: userId });
};
