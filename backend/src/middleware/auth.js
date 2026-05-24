'use strict';

const jwt = require('jsonwebtoken');
const { client: redisClient } = require('../config/redis');
const { query } = require('../config/database');
const { unauthorized, forbidden } = require('../utils/response');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets are not configured');
}

/**
 * Verify JWT access token
 */
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No authorization token provided');
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return unauthorized(res, 'Access token expired');
      }
      return unauthorized(res, 'Invalid access token');
    }

    // Check if token is blacklisted (logged out)
    try {
      const blacklisted = redisClient.isOpen ? await redisClient.get(`blacklist:${token}`) : null;
      if (blacklisted) return unauthorized(res, 'Token has been revoked');
    } catch (_) {}

    // Verify user still exists and is active (JWT field is 'id' or 'userId')
    const userId = decoded.id || decoded.userId;
    const result = await query(
      'SELECT id, phone, email, name, role, is_active, kyc_status, wallet_balance FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return unauthorized(res, 'User not found');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return unauthorized(res, 'Account is deactivated');
    }

    req.user = {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: user.role,
      kycStatus: user.kyc_status,
      walletBalance: parseFloat(user.wallet_balance),
    };

    next();
  } catch (err) {
    logger.error('Auth middleware error', { error: err.message });
    return unauthorized(res, 'Authentication failed');
  }
}

/**
 * Optional auth — populates req.user if token present, but doesn't block
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    try {
      const blacklisted = redisClient.isOpen ? await redisClient.get(`blacklist:${token}`) : null;
      if (blacklisted) return next();
    } catch (_) {}

    const userId = decoded.id || decoded.userId;
    const result = await query(
      'SELECT id, phone, email, name, role, is_active FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );

    if (result.rows.length > 0) {
      req.user = result.rows[0];
    }
  } catch {
    // Ignore errors, just don't set req.user
  }

  next();
}

/**
 * Role-based access control
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res);
    }
    if (!roles.includes(req.user.role)) {
      return forbidden(res, `Access restricted to: ${roles.join(', ')}`);
    }
    next();
  };
}

/**
 * Require partner role
 */
const requirePartner = requireRole('partner', 'admin');

/**
 * Require admin role
 */
const requireAdmin = requireRole('admin');

/**
 * Require staff role
 */
const requireStaff = requireRole('staff', 'partner', 'admin');

/**
 * Require fleet manager role
 */
const requireFleetManager = requireRole('fleet_manager', 'admin');

/**
 * Generate access + refresh token pair
 */
function generateTokenPair(userId, role) {
  const accessToken = jwt.sign({ userId, role }, JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    issuer: 'autocarex',
    audience: 'autocarex-app',
  });

  const refreshToken = jwt.sign({ userId, role, type: 'refresh' }, JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
    issuer: 'autocarex',
    audience: 'autocarex-app',
  });

  return { accessToken, refreshToken };
}

/**
 * Verify refresh token
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET, {
    issuer: 'autocarex',
    audience: 'autocarex-app',
  });
}

module.exports = {
  verifyToken,
  optionalAuth,
  requireRole,
  requirePartner,
  requireAdmin,
  requireStaff,
  requireFleetManager,
  generateTokenPair,
  verifyRefreshToken,
};
