import express from 'express';
import { authenticateUser, authorizeAdmin, authorizeSuperAdmin } from '../../../middleware/authentication.js';
import {
  listReportsController,
  updateReportStatusController,
  deleteReportedContentController,
} from '../../report/controller/report.controller.js';
import { safeExecute } from '../../../../db/config.js';

const router = express.Router();

// Require both authentication and admin/co-admin privileges for all admin routes
router.use(authenticateUser, authorizeAdmin);

/**
 * @route GET /api/admin/stats
 * @desc Quick platform stats for admin dashboard
 */
router.get('/stats', async (req, res, next) => {
  try {
    const userCount = await safeExecute('SELECT COUNT(*) as c FROM users', []);
    const premiumCount = await safeExecute('SELECT COUNT(*) as c FROM users WHERE is_premium = 1', []);
    const questionCount = await safeExecute('SELECT COUNT(*) as c FROM questions', []);
    const answerCount = await safeExecute('SELECT COUNT(*) as c FROM answers', []);
    const reportCount = await safeExecute('SELECT COUNT(*) as c FROM reports', []);
    const pendingReports = await safeExecute("SELECT COUNT(*) as c FROM reports WHERE status = 'pending'", []);
    const pendingPayments = await safeExecute("SELECT COUNT(*) as c FROM payments WHERE status = 'pending'", []);

    res.json({
      success: true,
      stats: {
        totalUsers: Number(userCount[0]?.c || 0),
        premiumUsers: Number(premiumCount[0]?.c || 0),
        totalQuestions: Number(questionCount[0]?.c || 0),
        totalAnswers: Number(answerCount[0]?.c || 0),
        totalReports: Number(reportCount[0]?.c || 0),
        pendingReports: Number(pendingReports[0]?.c || 0),
        pendingPayments: Number(pendingPayments[0]?.c || 0),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/admin/reports
 * @desc Get reported content/abuse with filtering
 */
router.get('/reports', listReportsController);

/**
 * @route PATCH /api/admin/reports/:reportId/status
 * @desc Change report status (pending, reviewed, dismissed, actioned)
 */
router.patch('/reports/:reportId/status', updateReportStatusController);

/**
 * @route DELETE /api/admin/reports/:reportId/content
 * @desc Delete abusive question or answer and mark report actioned
 */
router.delete('/reports/:reportId/content', deleteReportedContentController);

/**
 * @route GET /api/admin/users
 * @desc Search and list users with their roles and status
 */
router.get('/users', async (req, res, next) => {
  try {
    const search = req.query.search ? `%${req.query.search.trim()}%` : '%';
    const limit = Math.min(parseInt(req.query.limit || 50, 10), 100);
    const offset = parseInt(req.query.offset || 0, 10);

    const users = await safeExecute(
      `SELECT user_id AS id, first_name AS firstName, last_name AS lastName,
              username, email, role, is_premium AS isPremium,
              premium_since AS premiumSince, created_at AS createdAt
       FROM users
       WHERE email LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR username LIKE ?
       ORDER BY user_id DESC
       LIMIT ? OFFSET ?`,
      [search, search, search, search, limit, offset],
    );

    const totalRows = await safeExecute(
      `SELECT COUNT(*) AS total
       FROM users
       WHERE email LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR username LIKE ?`,
      [search, search, search, search],
    );

    res.json({
      success: true,
      users,
      total: totalRows[0]?.total || 0,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PATCH /api/admin/users/:userId/role
 * @desc Assign role to user (admin, co-admin, user). Requires Super Admin.
 */
router.patch('/users/:userId/role', authorizeSuperAdmin, async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    const { role } = req.body;

    const validRoles = ['admin', 'co-admin', 'moderator', 'user'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Allowed roles: admin, co-admin, moderator, user',
      });
    }

    if (targetUserId === req.user.id && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot revoke your own admin rights.',
      });
    }

    await safeExecute(
      'UPDATE users SET role = ? WHERE user_id = ?',
      [role, targetUserId],
    );

    res.json({
      success: true,
      message: `User #${targetUserId} role updated to ${role} successfully.`,
      role,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/admin/questions
 * @desc List questions with authors for moderation
 */
router.get('/questions', async (req, res, next) => {
  try {
    const search = req.query.search ? `%${req.query.search.trim()}%` : '%';
    const limit = Math.min(parseInt(req.query.limit || 50, 10), 100);
    const offset = parseInt(req.query.offset || 0, 10);

    const questions = await safeExecute(
      `SELECT q.question_id AS id, q.question_hash AS hash, q.title, q.content,
              q.created_at AS createdAt, q.updated_at AS updatedAt,
              u.user_id AS authorId, u.first_name AS authorFirstName, u.last_name AS authorLastName, u.email AS authorEmail
       FROM questions q
       LEFT JOIN users u ON u.user_id = q.user_id
       WHERE q.title LIKE ? OR q.content LIKE ?
       ORDER BY q.created_at DESC
       LIMIT ? OFFSET ?`,
      [search, search, limit, offset],
    );

    const countRows = await safeExecute(
      `SELECT COUNT(*) AS total FROM questions WHERE title LIKE ? OR content LIKE ?`,
      [search, search],
    );

    res.json({
      success: true,
      questions,
      total: countRows[0]?.total || 0,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PATCH /api/admin/questions/:questionId
 * @desc Edit question title and content directly by admin or co-admin
 */
router.patch('/questions/:questionId', async (req, res, next) => {
  try {
    const questionId = parseInt(req.params.questionId, 10);
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required.',
      });
    }

    await safeExecute(
      'UPDATE questions SET title = ?, content = ? WHERE question_id = ?',
      [title.trim(), content.trim(), questionId],
    );

    res.json({
      success: true,
      message: 'Question updated successfully by moderator/admin.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/admin/questions/:questionId
 * @desc Delete question directly by admin or co-admin
 */
router.delete('/questions/:questionId', async (req, res, next) => {
  try {
    const questionId = parseInt(req.params.questionId, 10);

    // Delete question (cascades or delete answers & ratings)
    await safeExecute('DELETE FROM answers WHERE question_id = ?', [questionId]).catch(() => {});
    await safeExecute('DELETE FROM ratings WHERE item_type = "question" AND item_id = ?', [questionId]).catch(() => {});
    await safeExecute('DELETE FROM likes WHERE item_type = "question" AND item_id = ?', [questionId]).catch(() => {});
    await safeExecute('DELETE FROM reports WHERE item_type = "question" AND item_id = ?', [questionId]).catch(() => {});
    await safeExecute('DELETE FROM questions WHERE question_id = ?', [questionId]);

    res.json({
      success: true,
      message: `Question #${questionId} deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/admin/payments
 * @desc List Telebirr payments for manual verification
 */
router.get('/payments', async (req, res, next) => {
  try {
    const status = req.query.status || 'all';
    const limit = Math.min(parseInt(req.query.limit || 50, 10), 100);
    const offset = parseInt(req.query.offset || 0, 10);

    let query = `
      SELECT p.payment_id AS paymentId, p.user_id AS userId, p.amount, p.currency,
             p.provider, p.phone_number AS phoneNumber, p.transaction_id AS transactionId,
             p.status, p.created_at AS createdAt,
             u.first_name AS userFirstName, u.last_name AS userLastName, u.email AS userEmail,
             u.is_premium AS isPremium
      FROM payments p
      JOIN users u ON u.user_id = p.user_id
    `;
    const params = [];

    if (status !== 'all') {
      query += ` WHERE p.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const payments = await safeExecute(query, params);

    res.json({
      success: true,
      payments,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PATCH /api/admin/payments/:paymentId/approve
 * @desc Approve Telebirr payment and activate user Premium
 */
router.patch('/payments/:paymentId/approve', async (req, res, next) => {
  try {
    const paymentId = parseInt(req.params.paymentId, 10);

    const paymentRows = await safeExecute(
      'SELECT payment_id, user_id, status FROM payments WHERE payment_id = ?',
      [paymentId],
    );
    if (!paymentRows.length) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    const { user_id: userId } = paymentRows[0];

    // Mark payment as completed
    await safeExecute(
      "UPDATE payments SET status = 'completed' WHERE payment_id = ?",
      [paymentId],
    );

    // Upgrade user to Premium
    await safeExecute(
      'UPDATE users SET is_premium = 1, premium_since = CURRENT_TIMESTAMP WHERE user_id = ?',
      [userId],
    );

    res.json({
      success: true,
      message: `Payment #${paymentId} verified & approved! User #${userId} is now Premium.`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PATCH /api/admin/payments/:paymentId/reject
 * @desc Reject false or unpaid Telebirr payment
 */
router.patch('/payments/:paymentId/reject', async (req, res, next) => {
  try {
    const paymentId = parseInt(req.params.paymentId, 10);

    await safeExecute(
      "UPDATE payments SET status = 'failed' WHERE payment_id = ?",
      [paymentId],
    );

    res.json({
      success: true,
      message: `Payment #${paymentId} rejected.`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PATCH /api/admin/users/:userId/premium
 * @desc Manually grant or revoke Premium for any user without database access
 */
router.patch('/users/:userId/premium', async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    const { isPremium } = req.body;
    const premiumVal = isPremium ? 1 : 0;

    await safeExecute(
      'UPDATE users SET is_premium = ?, premium_since = ? WHERE user_id = ?',
      [premiumVal, isPremium ? new Date() : null, targetUserId],
    );

    res.json({
      success: true,
      message: `User #${targetUserId} Premium status set to ${isPremium ? 'Active' : 'Free'}.`,
      isPremium: Boolean(isPremium),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/admin/users/assign-by-email
 * @desc Super Admin can easily assign Admin or Co-Admin by entering email in frontend
 */
router.post('/users/assign-by-email', authorizeSuperAdmin, async (req, res, next) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ success: false, message: 'Email and role are required.' });
    }

    const validRoles = ['admin', 'co-admin', 'moderator', 'user'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    const rows = await safeExecute(
      'SELECT user_id, first_name, last_name, email, role FROM users WHERE email = ?',
      [email.trim().toLowerCase()],
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: `No user found with email "${email}".` });
    }

    const targetUser = rows[0];
    await safeExecute('UPDATE users SET role = ? WHERE user_id = ?', [role, targetUser.user_id]);

    res.json({
      success: true,
      message: `Success! ${targetUser.first_name} ${targetUser.last_name} (${email}) has been assigned role "${role}".`,
      user: { id: targetUser.user_id, email, role },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
