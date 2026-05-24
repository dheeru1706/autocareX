'use strict';

const router = require('express').Router();
const { sendOTP, verifyOTP, refreshToken, logoutUser, socialLoginHandler } = require('./auth.controller');
const { verifyToken } = require('../../middleware/auth');
const { otpLimiter, authLimiter } = require('../../middleware/rateLimiter');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');
const { success, error: apiError } = require('../../utils/response');

// POST /api/v1/auth/admin/login — Admin panel login
router.post('/admin/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return apiError(res, 'Email and password required', 400);

    const { rows: [user] } = await db.query(
      `SELECT id, name, email, role, is_active, password_hash FROM users
       WHERE email = $1 AND role IN ('admin','staff','fleet_manager')`,
      [email]
    );
    if (!user) return apiError(res, 'Invalid credentials', 401);
    if (!user.is_active) return apiError(res, 'Account suspended', 403);

    let valid = false;
    if (user.password_hash) {
      valid = await bcrypt.compare(password, user.password_hash);
    }
    // In dev also accept default password
    if (!valid && process.env.NODE_ENV !== 'production') {
      const ADMIN_PASS = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123';
      if (password === ADMIN_PASS) valid = true;
    }
    if (!valid) return apiError(res, 'Invalid credentials', 401);

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return success(res, {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    return apiError(res, err.message, 500);
  }
});

// POST /api/auth/send-otp
router.post('/send-otp', otpLimiter, sendOTP);

// POST /api/auth/verify-otp
router.post('/verify-otp', authLimiter, verifyOTP);

// POST /api/auth/refresh-token
router.post('/refresh-token', authLimiter, refreshToken);

// POST /api/auth/logout  (requires valid access token)
router.post('/logout', verifyToken, logoutUser);

// POST /api/auth/social-login
router.post('/social-login', authLimiter, socialLoginHandler);

module.exports = router;
