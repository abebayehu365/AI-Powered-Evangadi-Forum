import crypto from 'crypto';
import Telebirr from 'telebirrjs';
import { safeExecute } from '../../../../db/config.js';
import { BadRequestError, NotFoundError } from '../../../utils/errors/index.js';

/**
 * Validates Ethiopian phone number format (Telebirr accepts 09..., 07..., or +251...).
 */
export const validatePhoneNumber = phone => {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  const ethiopianRegex = /^(?:\+251|251|0)?([79]\d{8})$/;
  return ethiopianRegex.test(cleaned);
};

export const normalizePhoneNumber = phone => {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  const match = cleaned.match(/^(?:\+251|251|0)?([79]\d{8})$/);
  return match ? `+251${match[1]}` : cleaned;
};

/**
 * Checks if live Telebirr API credentials are provided in the environment.
 */
export const isTelebirrApiConfigured = () => {
  const { TELEBIRR_APP_ID, TELEBIRR_APP_KEY, TELEBIRR_SHORT_CODE, TELEBIRR_PUBLIC_KEY } = process.env;
  return Boolean(
    TELEBIRR_APP_ID &&
    TELEBIRR_APP_KEY &&
    TELEBIRR_SHORT_CODE &&
    TELEBIRR_PUBLIC_KEY &&
    !TELEBIRR_APP_ID.includes('YOUR_') &&
    TELEBIRR_APP_ID.trim().length > 3
  );
};

/**
 * Returns the status of the Telebirr API integration.
 */
export const getTelebirrApiConfigStatusService = () => {
  const configured = isTelebirrApiConfigured();
  return {
    configured,
    shortCode: configured ? process.env.TELEBIRR_SHORT_CODE : null,
    receiveName: process.env.TELEBIRR_RECEIVE_NAME || 'ForumStudy',
    manualRecipientNumber: '0941427950',
    mode: configured ? 'live_api' : 'sandbox_and_manual',
  };
};

/**
 * Option 1: Official Telebirr Web/App API Checkout via telebirrjs.
 * If credentials are configured, calls Ethio Telecom's gateway to generate a toPayUrl.
 * If credentials are not configured yet, provides a simulated checkout session for testing.
 */
export const initiateTelebirrApiCheckoutService = async ({ userId, phoneNumber }) => {
  const userRows = await safeExecute(
    'SELECT user_id, first_name, last_name, email, is_premium FROM users WHERE user_id = ?',
    [userId],
  );
  if (!userRows.length) {
    throw new NotFoundError('User not found.');
  }

  if (userRows[0].is_premium) {
    return {
      success: true,
      alreadyPremium: true,
      message: 'Your account is already upgraded to Premium!',
    };
  }

  const amount = 5.00;
  const outTradeNo = `FS${Date.now()}${userId}`;
  const cleanPhone = phoneNumber ? normalizePhoneNumber(phoneNumber) : 'N/A';

  // 1. If live credentials exist, generate live payment with Telebirr API
  if (isTelebirrApiConfigured()) {
    try {
      const telebirr = new Telebirr({
        appId: process.env.TELEBIRR_APP_ID,
        appKey: process.env.TELEBIRR_APP_KEY,
        shortCode: process.env.TELEBIRR_SHORT_CODE,
        publicKey: process.env.TELEBIRR_PUBLIC_KEY,
      });

      const notifyUrl =
        process.env.TELEBIRR_NOTIFY_URL ||
        `${process.env.APP_BASE_URL || 'http://localhost:3777'}/api/payment/telebirr-api/notify`;
      const returnUrl =
        process.env.TELEBIRR_RETURN_URL || 'http://localhost:5173/plans?payment=success';

      const nonce = crypto.randomBytes(16).toString('hex');

      // Record pending payment in database
      await safeExecute(
        `INSERT INTO payments (user_id, amount, currency, provider, phone_number, transaction_id, status)
         VALUES (?, ?, 'ETB', 'telebirr_api', ?, ?, 'pending')`,
        [userId, amount, cleanPhone, outTradeNo],
      );

      const result = await telebirr.makePayment({
        paymentMethod: 'web',
        nonce,
        notifyUrl,
        totalAmount: amount,
        outTradeNo,
        receiveName: process.env.TELEBIRR_RECEIVE_NAME || 'ForumStudy',
        returnUrl,
        subject: 'ForumStudy Premium Membership (5 Birr)',
        timeoutExpress: '120',
      });

      if (result.success && result.response?.data?.toPayUrl) {
        return {
          success: true,
          mode: 'live_api',
          outTradeNo,
          toPayUrl: result.response.data.toPayUrl,
          message: 'Telebirr checkout initiated successfully.',
        };
      } else {
        console.warn('Telebirr API response issue:', result);
        return {
          success: false,
          mode: 'live_api',
          error: result.response?.message || 'Telebirr gateway error. Please try direct transfer.',
        };
      }
    } catch (err) {
      console.error('Telebirr makePayment exception:', err);
      throw new BadRequestError('Failed to initiate live Telebirr payment: ' + err.message);
    }
  }

  // 2. Fallback / Sandbox mode when credentials aren't supplied in .env yet
  await safeExecute(
    `INSERT INTO payments (user_id, amount, currency, provider, phone_number, transaction_id, status)
     VALUES (?, ?, 'ETB', 'telebirr_sandbox', ?, ?, 'pending')`,
    [userId, amount, cleanPhone, outTradeNo],
  );

  return {
    success: true,
    mode: 'sandbox',
    outTradeNo,
    amount,
    currency: 'ETB',
    message:
      'Telebirr API checkout initialized in Sandbox/Testing mode (add credentials in .env for live Ethio Telecom processing).',
    simulationUrl: `/plans?payment=sandbox_ready&tradeNo=${outTradeNo}`,
  };
};

/**
 * Handles Telebirr official webhook notification (POST /api/payment/telebirr-api/notify).
 * Telebirr sends an encrypted body. telebirrjs decrypts using the public key and verifies the transaction.
 */
export const handleTelebirrApiCallbackService = async rawEncryptedPayload => {
  if (!isTelebirrApiConfigured()) {
    console.warn('Received Telebirr callback but API credentials are not set in .env.');
    return { code: 0, message: 'Received' };
  }

  try {
    const telebirr = new Telebirr({
      appId: process.env.TELEBIRR_APP_ID,
      appKey: process.env.TELEBIRR_APP_KEY,
      shortCode: process.env.TELEBIRR_SHORT_CODE,
      publicKey: process.env.TELEBIRR_PUBLIC_KEY,
    });

    const decrypted = telebirr.getDecryptedCallbackNotification(rawEncryptedPayload);
    const { outTradeNo, tradeStatus, transactionNo } = decrypted;

    // Telebirr status check (Completed / 2 / SUCCESS)
    if (
      tradeStatus === 'Completed' ||
      tradeStatus === '2' ||
      String(tradeStatus).toUpperCase() === 'SUCCESS'
    ) {
      const txRows = await safeExecute(
        'SELECT payment_id, user_id FROM payments WHERE transaction_id = ?',
        [outTradeNo],
      );

      if (txRows.length) {
        const { user_id, payment_id } = txRows[0];
        await safeExecute(
          "UPDATE payments SET status = 'completed', transaction_id = ? WHERE payment_id = ?",
          [transactionNo || outTradeNo, payment_id],
        );
        await safeExecute(
          'UPDATE users SET is_premium = 1, premium_since = NOW() WHERE user_id = ?',
          [user_id],
        );
        console.log(`User ${user_id} upgraded to Premium automatically via Telebirr API callback!`);
      }
    }

    return { code: 0, message: 'success' };
  } catch (error) {
    console.error('Error handling Telebirr webhook callback:', error);
    return { code: -1, message: error.message };
  }
};

/**
 * Instantly completes a sandbox checkout for testing Telebirr API flows without live credentials.
 */
export const completeSandboxPaymentService = async ({ userId, outTradeNo }) => {
  const txRows = await safeExecute(
    'SELECT payment_id, user_id, status FROM payments WHERE transaction_id = ? AND user_id = ?',
    [outTradeNo, userId],
  );

  if (!txRows.length) {
    throw new NotFoundError('Transaction not found or does not belong to you.');
  }

  await safeExecute(
    "UPDATE payments SET status = 'completed' WHERE payment_id = ?",
    [txRows[0].payment_id],
  );

  await safeExecute(
    'UPDATE users SET is_premium = 1, premium_since = NOW() WHERE user_id = ?',
    [userId],
  );

  return {
    success: true,
    message: 'Sandbox Telebirr payment verified! Your account is now Premium.',
  };
};

/**
 * Option 2: Direct Telebirr manual transfer for 5 Birr to 0941427950.
 * Saves as 'pending' for admin verification against transfers to 0941427950.
 */
export const initiateTelebirrPaymentService = async ({ userId, phoneNumber, transactionCode }) => {
  if (!phoneNumber) {
    throw new BadRequestError('Telebirr phone number is required.');
  }

  if (!validatePhoneNumber(phoneNumber)) {
    throw new BadRequestError(
      'Invalid phone number format. Please enter a valid Ethiopian Telebirr number (e.g. 0912345678 or 0712345678).',
    );
  }

  const cleanCode = (transactionCode || '').trim();
  if (!cleanCode || cleanCode.length < 4) {
    throw new BadRequestError(
      'Please enter the Telebirr Transaction Number / SMS confirmation code from your transfer to 0941427950.',
    );
  }

  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const amount = 5.00;
  const currency = 'ETB';
  const provider = 'telebirr';
  const transactionId = cleanCode.toUpperCase();

  // Verify user exists
  const userRows = await safeExecute(
    'SELECT user_id, first_name, last_name, email, is_premium FROM users WHERE user_id = ?',
    [userId],
  );
  if (!userRows.length) {
    throw new NotFoundError('User not found.');
  }

  if (userRows[0].is_premium) {
    return {
      success: true,
      pending: false,
      message: 'Your account is already upgraded to Premium!',
      user: { is_premium: 1 },
    };
  }

  // Check if transaction ID already exists
  const existingTx = await safeExecute(
    'SELECT payment_id, status FROM payments WHERE transaction_id = ?',
    [transactionId],
  );
  if (existingTx.length) {
    if (existingTx[0].status === 'completed') {
      throw new BadRequestError('This Telebirr transaction code has already been verified and used.');
    } else {
      throw new BadRequestError('This Telebirr transaction code is already pending admin verification.');
    }
  }

  // Record payment transaction as PENDING verification
  await safeExecute(
    `INSERT INTO payments (user_id, amount, currency, provider, phone_number, transaction_id, status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    [userId, amount, currency, provider, normalizedPhone, transactionId],
  );

  return {
    success: true,
    pending: true,
    message:
      'Telebirr payment submitted for verification! Once our admin confirms the transfer to 0941427950, your Premium features will be active.',
    transaction: {
      transactionId,
      amount,
      currency,
      provider: 'Telebirr (Ethio Telecom)',
      phoneNumber: normalizedPhone,
      recipientNumber: '0941427950',
      status: 'pending',
      date: new Date().toISOString(),
    },
    user: {
      is_premium: 0,
    },
  };
};

/**
 * Get payment and membership history for a user.
 */
export const getUserSubscriptionService = async userId => {
  const userRows = await safeExecute(
    'SELECT user_id, is_premium, premium_since, security_pin_enabled FROM users WHERE user_id = ?',
    [userId],
  );
  if (!userRows.length) {
    throw new NotFoundError('User not found.');
  }

  const payments = await safeExecute(
    `SELECT payment_id AS paymentId, amount, currency, provider, phone_number AS phoneNumber,
            transaction_id AS transactionId, status, created_at AS createdAt
     FROM payments
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId],
  );

  return {
    isPremium: Boolean(userRows[0].is_premium),
    premiumSince: userRows[0].premium_since,
    securityPinEnabled: Boolean(userRows[0].security_pin_enabled),
    payments,
  };
};
