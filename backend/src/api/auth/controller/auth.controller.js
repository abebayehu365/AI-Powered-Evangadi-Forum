import { StatusCodes } from 'http-status-codes';
import {
  registerService,
  loginService,
  getMeService,
  setPinService,
  togglePinService,
  verifyPinService,
} from '../service/auth.service.js';

/**
 * Handles user registration requests.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const registerController = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const newUser = await registerService({
      firstName,
      lastName,
      email,
      password,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'User registered successfully.',
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles user login requests.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const authResult = await loginService({ email, password });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Login successful.',
      user: authResult.user,
      token: authResult.token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles fetching current user data.
 */
export const getMeController = async (req, res, next) => {
  try {
    const user = await getMeService(req.user.id);
    const avatarUrl = user.avatarUrl?.startsWith('/uploads/profile/')
      ? req.protocol + '://' + req.get('host') + user.avatarUrl
      : user.avatarUrl;
    res.status(StatusCodes.OK).json({
      success: true,
      user: { ...user, avatarUrl },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles setting a new Security Plus PIN.
 */
export const setPinController = async (req, res, next) => {
  try {
    const { pin, enabled } = req.body;
    const result = await setPinService({
      userId: req.user.id,
      pin,
      enabled: enabled !== undefined ? enabled : true,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles toggling Security Plus PIN lock.
 */
export const togglePinController = async (req, res, next) => {
  try {
    const { enabled } = req.body;
    const result = await togglePinService({
      userId: req.user.id,
      enabled,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles verifying PIN.
 */
export const verifyPinController = async (req, res, next) => {
  try {
    const { pin } = req.body;
    const result = await verifyPinService({
      userId: req.user.id,
      pin,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

