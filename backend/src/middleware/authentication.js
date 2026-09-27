import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { UnauthenticatedError } from '../utils/errors/index.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthenticatedError('Authentication invalid');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.id,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role || 'user',
      isPremium: Boolean(payload.isPremium),
    };
    next();
  } catch (error) {
    throw new UnauthenticatedError('Authentication invalid');
  }
};

export const optionalAuthenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.id,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role || 'user',
      isPremium: Boolean(payload.isPremium),
    };
  } catch {
    // Ignore invalid token in optional auth
  }
  next();
};

export const authorizeAdmin = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    throw new UnauthenticatedError('Authentication required');
  }

  try {
    const { safeExecute } = await import('../../db/config.js');
    const rows = await safeExecute(
      'SELECT role FROM users WHERE user_id = ?',
      [req.user.id],
    );
    const userRole = rows[0]?.role;
    if (!rows.length || (userRole !== 'admin' && userRole !== 'co-admin' && userRole !== 'moderator')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Administrator or Co-Admin privileges required.',
      });
    }
    req.userRole = userRole;
    next();
  } catch (err) {
    next(err);
  }
};

export const authorizeSuperAdmin = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    throw new UnauthenticatedError('Authentication required');
  }

  try {
    const { safeExecute } = await import('../../db/config.js');
    const rows = await safeExecute(
      'SELECT role FROM users WHERE user_id = ?',
      [req.user.id],
    );
    if (!rows.length || rows[0]?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Super Admin can perform this action.',
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};

