import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { safeExecute } from '../../../../db/config.js';
import {
  BadRequestError,
  UnauthenticatedError,
} from '../../../utils/errors/index.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const normalizeEmail = email => email.trim().toLowerCase();

/**
 * Checks if a user exists by email.
 *
 * @param {string} email - The email to check.
 * @returns {Promise<boolean>} True if the user exists, false otherwise.
 */
export const checkUserExists = async email => {
  const normalizedEmail = normalizeEmail(email);
  const sql = 'SELECT user_id FROM users WHERE email = ? ';
  const rows = await safeExecute(sql, [normalizedEmail]);
  return rows.length > 0;
};

/**
 * Registers a new user in the database.
 *
 * @param {Object} userData - The user data.
 * @param {string} userData.firstName - The first name.
 * @param {string} userData.lastName - The last name.
 * @param {string} userData.email - The email address.
 * @param {string} userData.password - The plain text password.
 * @returns {Promise<Object>} The created user object (without password).
 */
export const registerService = async ({
  firstName,
  lastName,
  email,
  password,
}) => {
  const normalizedEmail = normalizeEmail(email);
  const userExists = await checkUserExists(normalizedEmail);
  if (userExists) {
    throw new BadRequestError('User already exists with this email.');
  }

  // every time we call bcrypt.genSalt, it generates a new random salt string.
  const salt = await bcrypt.genSalt(10); // generates a unique random salt each call
  const hashedPassword = await bcrypt.hash(password, salt);
  const sql =
    'INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)';
  let result;
  try {
    result = await safeExecute(sql, [
      firstName,
      lastName,
      normalizedEmail,
      hashedPassword,
    ]);
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      throw new BadRequestError('User already exists with this email.');
    }
    throw error;
  }

  return {
    id: result.insertId,
    firstName,
    lastName,
    email: normalizedEmail,
    role: 'user',
    is_premium: 0,
    security_pin_enabled: 0,
  };
};

/**
 * Authenticates a user and generates a JWT token.
 *
 * @param {Object} credentials - The login credentials.
 * @param {string} credentials.email - The user's email.
 * @param {string} credentials.password - The user's plain text password.
 * @returns {Promise<Object>} An object containing the user and token.
 * @throws {UnauthenticatedError} If authentication fails.
 */
export const loginService = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const sql =
    'SELECT user_id, first_name, last_name, email, password_hash, is_premium, premium_since, security_pin_enabled, role FROM users WHERE email = ? LIMIT 1';
  const rows = await safeExecute(sql, [normalizedEmail]);

  if (rows.length === 0) {
    throw new UnauthenticatedError('Invalid email or password');
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    throw new UnauthenticatedError('Invalid email or password');
  }

  const role = user.role || 'user';
  const isPremium = Boolean(user.is_premium);

  const payload = {
    id: user.user_id,
    firstName: user.first_name,
    lastName: user.last_name,
    role,
    isPremium,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    user: {
      id: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role,
      is_premium: isPremium ? 1 : 0,
      premium_since: user.premium_since,
      security_pin_enabled: Boolean(user.security_pin_enabled),
    },
    token,
  };
};

/**
 * Fetches current user profile including membership and PIN status.
 */
export const getMeService = async userId => {
  const sql =
    'SELECT user_id, first_name, last_name, email, is_premium, premium_since, security_pin_enabled, role, avatar_url, bio, created_at FROM users WHERE user_id = ? LIMIT 1';
  const rows = await safeExecute(sql, [userId]);
  if (!rows.length) {
    throw new UnauthenticatedError('User not found');
  }
  const u = rows[0];
  return {
    id: u.user_id,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    role: u.role || 'user',
    is_premium: Boolean(u.is_premium) ? 1 : 0,
    premium_since: u.premium_since,
    security_pin_enabled: Boolean(u.security_pin_enabled),
    avatarUrl: u.avatar_url,
    bio: u.bio,
    createdAt: u.created_at,
  };
};

/**
 * Sets a Security Plus PIN for a Premium user.
 */
export const setPinService = async ({ userId, pin, enabled = true }) => {
  // Check if user is premium
  const [userRow] = await safeExecute(
    'SELECT is_premium FROM users WHERE user_id = ?',
    [userId],
  );
  if (!userRow || !userRow.is_premium) {
    throw new BadRequestError(
      'Security Plus PIN is a Premium feature. Upgrade to Premium for 5 Birr to activate it.',
    );
  }

  if (!pin || !/^\d{4,6}$/.test(pin.trim())) {
    throw new BadRequestError('PIN must be between 4 and 6 numeric digits.');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPin = await bcrypt.hash(pin.trim(), salt);

  await safeExecute(
    'UPDATE users SET security_pin = ?, security_pin_enabled = ? WHERE user_id = ?',
    [hashedPin, enabled ? 1 : 0, userId],
  );

  return {
    success: true,
    security_pin_enabled: enabled,
    message: 'Security Plus PIN saved successfully.',
  };
};

/**
 * Toggles PIN protection on or off.
 */
export const togglePinService = async ({ userId, enabled }) => {
  const [userRow] = await safeExecute(
    'SELECT is_premium, security_pin FROM users WHERE user_id = ?',
    [userId],
  );
  if (!userRow || !userRow.is_premium) {
    throw new BadRequestError('Security Plus is only available to Premium users.');
  }
  if (enabled && !userRow.security_pin) {
    throw new BadRequestError('Please set a PIN before enabling Security Plus.');
  }

  await safeExecute(
    'UPDATE users SET security_pin_enabled = ? WHERE user_id = ?',
    [enabled ? 1 : 0, userId],
  );

  return {
    success: true,
    security_pin_enabled: Boolean(enabled),
  };
};

/**
 * Verifies entered PIN against stored hashed PIN.
 */
export const verifyPinService = async ({ userId, pin }) => {
  const [userRow] = await safeExecute(
    'SELECT security_pin, security_pin_enabled FROM users WHERE user_id = ?',
    [userId],
  );

  if (!userRow || !userRow.security_pin) {
    throw new BadRequestError('No security PIN configured for this account.');
  }

  const isMatch = await bcrypt.compare(pin.trim(), userRow.security_pin);
  if (!isMatch) {
    throw new BadRequestError('Incorrect PIN. Please try again.');
  }

  return { success: true, verified: true };
};

