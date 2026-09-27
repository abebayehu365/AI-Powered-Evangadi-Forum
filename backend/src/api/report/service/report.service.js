import { safeExecute } from '../../../../db/config.js';
import { BadRequestError, NotFoundError } from '../../../utils/errors/index.js';

/**
 * Submit a content report for question or answer.
 */
export const createReportService = async ({
  userId,
  itemType,
  itemId,
  reason,
  details,
}) => {
  // Support aliases targetType/targetId or itemType/itemId
  const type = itemType || 'question';
  const id = Number(itemId);

  if (!['question', 'answer'].includes(type)) {
    throw new BadRequestError("Item type must be 'question' or 'answer'.");
  }

  // Check target exists
  if (type === 'question') {
    const rows = await safeExecute(
      `SELECT question_id FROM questions WHERE question_id = ?`,
      [id],
    );
    if (!rows.length) throw new NotFoundError('Question not found.');
  } else {
    const rows = await safeExecute(
      `SELECT answer_id FROM answers WHERE answer_id = ?`,
      [id],
    );
    if (!rows.length) throw new NotFoundError('Answer not found.');
  }

  const validReasons = [
    'spam',
    'offensive',
    'misinformation',
    'off_topic',
    'plagiarism',
    'harassment',
    'inappropriate',
    'other',
  ];
  if (!validReasons.includes(reason?.toLowerCase())) {
    throw new BadRequestError(
      `Invalid reason. Must be one of: ${validReasons.join(', ')}`,
    );
  }

  try {
    const result = await safeExecute(
      `INSERT INTO reports (user_id, item_type, item_id, reason, details, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [userId, type, id, reason.toLowerCase(), details || null],
    );
    return { reportId: result.insertId, status: 'pending' };
  } catch (err) {
    if (err?.code === 'ER_DUP_ENTRY') {
      throw new BadRequestError('You have already reported this content.');
    }
    throw err;
  }
};

/**
 * List all reports with rich context for admin abuse review.
 */
export const listReportsService = async ({ status, limit = 50, offset = 0 }) => {
  const conditions = [];
  const params = [];

  if (status && status !== 'all') {
    conditions.push('r.status = ?');
    params.push(status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await safeExecute(
    `SELECT
       r.report_id   AS reportId,
       r.item_type   AS itemType,
       r.item_id     AS itemId,
       r.reason,
       r.details,
       r.status,
       r.created_at  AS createdAt,
       u.user_id     AS reporterId,
       u.first_name  AS reporterFirstName,
       u.last_name   AS reporterLastName,
       u.email       AS reporterEmail,
       CASE 
         WHEN r.item_type = 'question' THEN q.title 
         ELSE CONCAT('Answer to: ', COALESCE(aq.title, 'Question')) 
       END AS contentTitle,
       CASE 
         WHEN r.item_type = 'question' THEN q.content 
         ELSE a.content 
       END AS contentSnippet,
       CASE 
         WHEN r.item_type = 'question' THEN q.question_hash 
         ELSE aq.question_hash 
       END AS questionHash,
       CASE
         WHEN r.item_type = 'question' THEN qu.user_id
         ELSE au.user_id
       END AS authorId,
       CASE
         WHEN r.item_type = 'question' THEN CONCAT(qu.first_name, ' ', qu.last_name)
         ELSE CONCAT(au.first_name, ' ', au.last_name)
       END AS authorName
     FROM reports r
     JOIN users u ON u.user_id = r.user_id
     LEFT JOIN questions q ON (r.item_type = 'question' AND q.question_id = r.item_id)
     LEFT JOIN users qu ON q.user_id = qu.user_id
     LEFT JOIN answers a ON (r.item_type = 'answer' AND a.answer_id = r.item_id)
     LEFT JOIN questions aq ON a.question_id = aq.question_id
     LEFT JOIN users au ON a.user_id = au.user_id
     ${where}
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)],
  );

  return rows;
};

/**
 * Update report status (admin use).
 */
export const updateReportStatusService = async ({ reportId, status }) => {
  const validStatuses = ['pending', 'reviewed', 'dismissed', 'actioned'];
  if (!validStatuses.includes(status)) {
    throw new BadRequestError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const result = await safeExecute(
    `UPDATE reports SET status = ? WHERE report_id = ?`,
    [status, reportId],
  );

  if (!result.affectedRows) {
    throw new NotFoundError('Report not found.');
  }

  return { reportId, status };
};

/**
 * Admin action: Delete reported content (question or answer) and mark report actioned.
 */
export const deleteReportedContentService = async ({ reportId }) => {
  const reports = await safeExecute(
    `SELECT report_id, item_type, item_id FROM reports WHERE report_id = ?`,
    [reportId],
  );
  if (!reports.length) {
    throw new NotFoundError('Report not found.');
  }

  const report = reports[0];
  if (report.item_type === 'question') {
    await safeExecute(`DELETE FROM questions WHERE question_id = ?`, [report.item_id]);
  } else {
    await safeExecute(`DELETE FROM answers WHERE answer_id = ?`, [report.item_id]);
  }

  await safeExecute(
    `UPDATE reports SET status = 'actioned' WHERE report_id = ?`,
    [reportId],
  );

  return { success: true, message: `Reported ${report.item_type} deleted successfully.` };
};
