import { StatusCodes } from 'http-status-codes';
import {
  initiateTelebirrPaymentService,
  getUserSubscriptionService,
  initiateTelebirrApiCheckoutService,
  handleTelebirrApiCallbackService,
  completeSandboxPaymentService,
  getTelebirrApiConfigStatusService,
} from '../service/payment.service.js';

/**
 * Handles initiating Telebirr payment for 5 Birr (manual SMS verification).
 */
export const initiateTelebirrPaymentController = async (req, res, next) => {
  try {
    const { phoneNumber, transactionCode } = req.body;
    const result = await initiateTelebirrPaymentService({
      userId: req.user.id,
      phoneNumber,
      transactionCode,
    });
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Handles official Telebirr API checkout initiation.
 */
export const initiateTelebirrApiCheckoutController = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    const result = await initiateTelebirrApiCheckoutService({
      userId: req.user.id,
      phoneNumber,
    });
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Handles Telebirr webhook callback notifications from Ethio Telecom.
 */
export const handleTelebirrApiCallbackController = async (req, res, next) => {
  try {
    // Body can be raw plaintext string or JSON from Telebirr
    const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const result = await handleTelebirrApiCallbackService(payload);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Completes simulated sandbox payment for testing without live Ethio Telecom credentials.
 */
export const completeSandboxPaymentController = async (req, res, next) => {
  try {
    const { outTradeNo } = req.body;
    const result = await completeSandboxPaymentService({
      userId: req.user.id,
      outTradeNo,
    });
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Checks whether live Telebirr API keys are configured.
 */
export const getTelebirrApiConfigStatusController = async (req, res, next) => {
  try {
    const status = getTelebirrApiConfigStatusService();
    res.status(StatusCodes.OK).json({ success: true, status });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles fetching subscription status and payment history.
 */
export const getUserSubscriptionController = async (req, res, next) => {
  try {
    const result = await getUserSubscriptionService(req.user.id);
    res.status(StatusCodes.OK).json({
      success: true,
      subscription: result,
    });
  } catch (error) {
    next(error);
  }
};
