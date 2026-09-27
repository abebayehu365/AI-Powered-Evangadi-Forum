import { safeExecute } from '../../../../db/config.js';
import { BadRequestError, NotFoundError } from '../../../utils/errors/index.js';

/**
 * Validates item type and ensures existence.
 */
async function validateItemExists(itemType, itemId) {
  if (!['question', 'answer'].includes(itemType)) {
    throw new BadRequestError("Item type must be either 'question' or 'answer'.");
  }
  const table = itemType === 'question' ? 'questions' : 'answers';
  const idCol = itemType === 'question' ? 'question_id' : 'answer_id';
  const rows = await safeExecute(
    `SELECT ${idCol} FROM ${table} WHERE ${idCol} = ?`,
    [itemId],
  );
  if (!rows.length) {
    throw new NotFoundError(`${itemType === 'question' ? 'Question' : 'Answer'} not found.`);
  }
}

/**
 * Vote (1 = like, -1 = unlike, 0 = remove vote) on a question or answer.
 */
export const voteItemService = async ({ userId, itemType, itemId, vote }) => {
  if (![1, -1, 0].includes(Number(vote))) {
    throw new BadRequestError('Vote must be 1 (like), -1 (unlike), or 0 (remove).');
  }

  await validateItemExists(itemType, itemId);

  if (Number(vote) === 0) {
    await safeExecute(
      `DELETE FROM likes WHERE user_id = ? AND item_type = ? AND item_id = ?`,
      [userId, itemType, itemId],
    );
  } else {
    await safeExecute(
      `INSERT INTO likes (user_id, item_type, item_id, vote)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE vote = VALUES(vote), updated_at = NOW()`,
      [userId, itemType, itemId, Number(vote)],
    );
  }

  return getItemLikeSummaryService({ userId, itemType, itemId });
};

/**
 * Get like / unlike counts and current user's vote for an item.
 */
export const getItemLikeSummaryService = async ({ userId, itemType, itemId }) => {
  const rows = await safeExecute(
    `SELECT
       COALESCE(SUM(CASE WHEN vote =  1 THEN 1 ELSE 0 END), 0) AS likes,
       COALESCE(SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END), 0) AS unlikes,
       COALESCE(SUM(vote), 0) AS score,
       MAX(CASE WHEN user_id = ? THEN vote ELSE NULL END) AS userVote
     FROM likes
     WHERE item_type = ? AND item_id = ?`,
    [userId || 0, itemType, itemId],
  );

  const row = rows[0] || {};
  return {
    itemType,
    itemId: Number(itemId),
    likes: Number(row.likes || 0),
    unlikes: Number(row.unlikes || 0),
    score: Number(row.score || 0),
    userVote: row.userVote !== null && row.userVote !== undefined ? Number(row.userVote) : null,
  };
};

/**
 * Bulk get like / unlike summaries for multiple items.
 */
export const getBulkItemLikesService = async ({ userId, itemType, itemIds }) => {
  if (!itemIds || !itemIds.length) return {};

  const placeholders = itemIds.map(() => '?').join(', ');
  const rows = await safeExecute(
    `SELECT
       item_id,
       COALESCE(SUM(CASE WHEN vote =  1 THEN 1 ELSE 0 END), 0) AS likes,
       COALESCE(SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END), 0) AS unlikes,
       COALESCE(SUM(vote), 0) AS score,
       MAX(CASE WHEN user_id = ? THEN vote ELSE NULL END) AS userVote
     FROM likes
     WHERE item_type = ? AND item_id IN (${placeholders})
     GROUP BY item_id`,
    [userId || 0, itemType, ...itemIds],
  );

  const map = {};
  // initialize all requested IDs to 0
  for (const id of itemIds) {
    map[id] = { likes: 0, unlikes: 0, score: 0, userVote: null };
  }
  for (const row of rows) {
    map[row.item_id] = {
      likes: Number(row.likes || 0),
      unlikes: Number(row.unlikes || 0),
      score: Number(row.score || 0),
      userVote: row.userVote !== null && row.userVote !== undefined ? Number(row.userVote) : null,
    };
  }
  return map;
};
