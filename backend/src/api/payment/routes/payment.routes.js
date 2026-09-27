import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import {
  initiateTelebirrPaymentController,
  getUserSubscriptionController,
  initiateTelebirrApiCheckoutController,
  handleTelebirrApiCallbackController,
  completeSandboxPaymentController,
  getTelebirrApiConfigStatusController,
} from '../controller/payment.controller.js';

const router = express.Router();

/**
 * @route POST /api/payment/telebirr
 * @desc Initiate manual 5 Birr Telebirr payment with SMS code to 0941427950
 * @access Protected
 */
router.post('/telebirr', authenticateUser, initiateTelebirrPaymentController);

/**
 * @route GET /api/payment/subscription
 * @desc Get current user subscription status and payment history
 * @access Protected
 */
router.get('/subscription', authenticateUser, getUserSubscriptionController);

/**
 * @route GET /api/payment/telebirr-api/config-status
 * @desc Check if official Telebirr API keys are present
 * @access Protected
 */
router.get('/telebirr-api/config-status', authenticateUser, getTelebirrApiConfigStatusController);

/**
 * @route POST /api/payment/telebirr-api/checkout
 * @desc Initiate official Telebirr payment using Ethio Telecom gateway (or sandbox if no keys)
 * @access Protected
 */
router.post('/telebirr-api/checkout', authenticateUser, initiateTelebirrApiCheckoutController);

/**
 * @route POST /api/payment/telebirr-api/notify
 * @desc Webhook callback receiving encrypted payment confirmation directly from Telebirr
 * @access Public (called by Ethio Telecom Telebirr servers)
 */
router.post('/telebirr-api/notify', handleTelebirrApiCallbackController);

/**
 * @route POST /api/payment/telebirr-api/sandbox-complete
 * @desc Completes a sandbox test payment when live credentials are not set
 * @access Protected
 */
router.post('/telebirr-api/sandbox-complete', authenticateUser, completeSandboxPaymentController);

export default router;
