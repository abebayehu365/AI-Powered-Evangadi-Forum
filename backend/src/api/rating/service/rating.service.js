import { safeExecute } from '../../../../db/config.js';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../../utils/errors/index.js';

/**
 * --------------------------------------------------------------------------
 * 1. 5-STAR RATING SYSTEM (uses `ratings` table, score 1..5)
 * --------------------------------------------------------------------------
 */

async function validateItemExists(itemType, itemId) {
  if (!['question', 'answer'].includes(itemType)) {
    throw new BadRequestError("Item type must be either 'question' or 'answer'.");
  }
  const table = itemType === 'question' ? 'questions' : 'answers';
  const idCol = itemType === 'question' ? 'question_id' : 'answer_id';
  const rows = await safeExecute(
    `SELECT ${idCol} AS itemId, user_id AS ownerId FROM ${table} WHERE ${idCol} = ?`,
    [itemId],
  );
  if (!rows.length) {
    throw new NotFoundError(`${itemType === 'question' ? 'Question' : 'Answer'} not found.`);
  }
  return rows[0];
}

/**
 * Submit or update 1-5 star rating for a question or answer (score = 0 to remove).
 */
export const rateStarItemService = async ({ userId, itemType, itemId, score }) => {
  const numScore = Number(score);
  if (![0, 1, 2, 3, 4, 5].includes(numScore)) {
    throw new BadRequestError('Star rating score must be an integer from 1 to 5 (or 0 to remove).');
  }

  const item = await validateItemExists(itemType, itemId);
  if (Number(item.ownerId) === Number(userId)) {
    throw new ForbiddenError(`You cannot rate your own ${itemType}.`);
  }

  if (numScore === 0) {
    await safeExecute(
      `DELETE FROM ratings WHERE user_id = ? AND item_type = ? AND item_id = ?`,
      [userId, itemType, itemId],
    );
  } else {
    await safeExecute(
      `INSERT INTO ratings (user_id, item_type, item_id, score)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE score = VALUES(score), updated_at = NOW()`,
      [userId, itemType, itemId, numScore],
    );
  }

  return getItemStarRatingService({ userId, itemType, itemId });
};

/**
 * Get 1-5 star rating summary (average score, total ratings, user's rating).
 */
export const getItemStarRatingService = async ({ userId, itemType, itemId }) => {
  const rows = await safeExecute(
    `SELECT
       COALESCE(ROUND(AVG(score), 1), 0) AS average,
       COUNT(score) AS total,
       MAX(CASE WHEN user_id = ? THEN score ELSE NULL END) AS userScore
     FROM ratings
     WHERE item_type = ? AND item_id = ?`,
    [userId || 0, itemType, itemId],
  );

  const row = rows[0] || {};
  return {
    itemType,
    itemId: Number(itemId),
    average: Number(row.average || 0),
    total: Number(row.total || 0),
    userScore: row.userScore !== null && row.userScore !== undefined ? Number(row.userScore) : null,
  };
};

/**
 * Bulk get 1-5 star ratings for questions or answers.
 */
export const getBulkItemStarRatingsService = async ({ userId, itemType, itemIds }) => {
  if (!itemIds || !itemIds.length) return {};

  const placeholders = itemIds.map(() => '?').join(', ');
  const rows = await safeExecute(
    `SELECT
       item_id,
       COALESCE(ROUND(AVG(score), 1), 0) AS average,
       COUNT(score) AS total,
       MAX(CASE WHEN user_id = ? THEN score ELSE NULL END) AS userScore
     FROM ratings
     WHERE item_type = ? AND item_id IN (${placeholders})
     GROUP BY item_id`,
    [userId || 0, itemType, ...itemIds],
  );

  const map = {};
  for (const id of itemIds) {
    map[id] = { average: 0, total: 0, userScore: null };
  }
  for (const row of rows) {
    map[row.item_id] = {
      average: Number(row.average || 0),
      total: Number(row.total || 0),
      userScore: row.userScore !== null && row.userScore !== undefined ? Number(row.userScore) : null,
    };
  }
  return map;
};

/**
 * --------------------------------------------------------------------------
 * 2. LEGACY / BACKWARDS-COMPATIBLE ANSWER RATINGS (mapped to `likes` table)
 * --------------------------------------------------------------------------
 */

export const rateAnswerService = async ({ answerId, userId, value }) => {
  const numValue = Number(value);
  if (![1, -1, 0].includes(numValue)) {
    throw new BadRequestError('Rating value must be 1, -1, or 0.');
  }

  const answerRows = await safeExecute(
    `SELECT answer_id FROM answers WHERE answer_id = ?`,
    [answerId],
  );
  if (!answerRows.length) {
    throw new NotFoundError('Answer not found.');
  }

  if (numValue === 0) {
    await safeExecute(
      `DELETE FROM likes WHERE item_type = 'answer' AND item_id = ? AND user_id = ?`,
      [answerId, userId],
    );
  } else {
    await safeExecute(
      `INSERT INTO likes (user_id, item_type, item_id, vote)
       VALUES (?, 'answer', ?, ?)
       ON DUPLICATE KEY UPDATE vote = VALUES(vote), updated_at = NOW()`,
      [userId, answerId, numValue],
    );
  }

  return getAnswerRatingService({ answerId, userId });
};

export const getAnswerRatingService = async ({ answerId, userId }) => {
  const rows = await safeExecute(
    `SELECT
       COALESCE(SUM(vote), 0) AS score,
       COALESCE(SUM(CASE WHEN vote =  1 THEN 1 ELSE 0 END), 0) AS upvotes,
       COALESCE(SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END), 0) AS downvotes,
       MAX(CASE WHEN user_id = ? THEN vote ELSE NULL END) AS userVote
     FROM likes
     WHERE item_type = 'answer' AND item_id = ?`,
    [userId || 0, answerId],
  );

  const row = rows[0] || {};
  return {
    answerId: Number(answerId),
    score: Number(row.score ?? 0),
    upvotes: Number(row.upvotes ?? 0),
    downvotes: Number(row.downvotes ?? 0),
    userVote: row.userVote !== null && row.userVote !== undefined ? Number(row.userVote) : null,
  };
};

export const getBulkRatingsService = async ({ answerIds, userId }) => {
  if (!answerIds || !answerIds.length) return {};

  const placeholders = answerIds.map(() => '?').join(', ');
  const rows = await safeExecute(
    `SELECT
       item_id,
       COALESCE(SUM(vote), 0) AS score,
       COALESCE(SUM(CASE WHEN vote =  1 THEN 1 ELSE 0 END), 0) AS upvotes,
       COALESCE(SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END), 0) AS downvotes,
       MAX(CASE WHEN user_id = ? THEN vote ELSE NULL END) AS userVote
     FROM likes
     WHERE item_type = 'answer' AND item_id IN (${placeholders})
     GROUP BY item_id`,
    [userId || 0, ...answerIds],
  );

  const map = {};
  for (const id of answerIds) {
    map[id] = { score: 0, upvotes: 0, downvotes: 0, userVote: null };
  }
  for (const row of rows) {
    map[row.item_id] = {
      score: Number(row.score),
      upvotes: Number(row.upvotes),
      downvotes: Number(row.downvotes),
      userVote: row.userVote !== null && row.userVote !== undefined ? Number(row.userVote) : null,
    };
  }
  return map;
};
