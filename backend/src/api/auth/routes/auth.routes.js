import 'dotenv/config';
import express from 'express';
import {
  registerController,
  loginController,
  getMeController,
  setPinController,
  togglePinController,
  verifyPinController,
} from '../controller/auth.controller.js';
import {
  registerValidation,
  loginValidation,
} from '../validations/auth.validation.js';
import { authenticateUser } from '../../../middleware/authentication.js';
import { safeExecute } from '../../../../db/config.js';

const router = express.Router();
const ADMIN_SETUP_SECRET = process.env.ADMIN_SETUP_SECRET || '';

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', registerValidation, registerController);

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and get token
 * @access Public
 */
router.post('/login', loginValidation, loginController);

/**
 * @route GET /api/auth/me
 * @desc Get fresh profile of currently authenticated user
 * @access Protected
 */
router.get('/me', authenticateUser, getMeController);

/**
 * @route POST /api/auth/pin/set
 * @desc Set a 4-6 digit Security Plus PIN (Premium only)
 * @access Protected
 */
router.post('/pin/set', authenticateUser, setPinController);

/**
 * @route POST /api/auth/pin/toggle
 * @desc Enable or disable PIN lock on return
 * @access Protected
 */
router.post('/pin/toggle', authenticateUser, togglePinController);

/**
 * @route POST /api/auth/pin/verify
 * @desc Verify entered PIN
 * @access Protected
 */
router.post('/pin/verify', authenticateUser, verifyPinController);

/**
 * @route POST /api/auth/setup-admin
 * @desc Bootstrap the very first platform Admin.
 *       SELF-DISABLING: Once any admin account exists in the database,
 *       this endpoint permanently returns 410 Gone and cannot be used again.
 *       Requires ADMIN_SETUP_SECRET (stored only in .env on the server).
 */
router.post('/setup-admin', async (req, res) => {
  try {
    // ── 1. Check if an admin already exists ──────────────────
    //    If yes, this endpoint is permanently disabled.
    const adminCheck = await safeExecute(
      "SELECT COUNT(*) AS c FROM users WHERE role = 'admin'",
      [],
    );
    const adminExists = Number(adminCheck[0]?.c || 0) > 0;

    if (adminExists) {
      // Endpoint self-disables — reveal nothing about the secret
      return res.status(410).json({
        success: false,
        message: 'Platform setup is already complete. This endpoint is no longer available.',
      });
    }

    // ── 2. Validate inputs ────────────────────────────────────
    const { email, secret } = req.body;

    if (!email || !secret) {
      return res.status(400).json({
        success: false,
        message: 'Email and secret are required.',
      });
    }

    // ── 3. Check secret — generic error, no hints ─────────────
    if (!ADMIN_SETUP_SECRET || secret.trim() !== ADMIN_SETUP_SECRET.trim()) {
      // Intentionally vague — do NOT reveal that the variable is in .env
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Setup failed.',
      });
    }

    // ── 4. Find user account ──────────────────────────────────
    const normalizedEmail = email.trim().toLowerCase();
    const rows = await safeExecute(
      'SELECT user_id, first_name, last_name, email, role FROM users WHERE email = ?',
      [normalizedEmail],
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'No account found with that email. Register first, then complete setup.',
      });
    }

    const targetUser = rows[0];

    // ── 5. Promote to admin ───────────────────────────────────
    await safeExecute(
      "UPDATE users SET role = 'admin' WHERE user_id = ?",
      [targetUser.user_id],
    );

    return res.json({
      success: true,
      message: `✅ Done! ${targetUser.first_name} ${targetUser.last_name} is now the platform Admin. Log out and log back in to access your Admin Dashboard.`,
    });
  } catch (err) {
    console.error('Setup-admin error:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

export default router;

