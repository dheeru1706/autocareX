'use strict';

const router = require('express').Router();
const {
  getDashboard,
  getRevenueAnalytics,
  getUsers,
  getUserDetails,
  toggleUserStatus,
  getPartners,
  approvePartner,
  getAllBookings,
  getServiceCategories,
  createServiceCategory,
  createServicePackage,
  generateReport,
  getCities,
} = require('./admin.controller');
const { verifyToken, requireAdmin } = require('../../middleware/auth');
const { uploadServiceImages, handleMulterError } = require('../../middleware/upload');
const { apiLimiter, strictLimiter } = require('../../middleware/rateLimiter');
const { createCoupon, getCoupons, deactivateCoupon } = require('../coupons/coupons.controller');
const { sendBroadcast } = require('../notifications/notifications.controller');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');
const { success, error: apiError } = require('../../utils/response');

// Public: Admin login (must be before verifyToken middleware)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return apiError(res, 'Email and password required', 400);

    const { rows: [user] } = await db.query(
      `SELECT id, name, email, role, is_active, password_hash FROM users WHERE email = $1 AND role IN ('admin','staff','fleet_manager')`,
      [email]
    );
    if (!user) return apiError(res, 'Invalid credentials', 401);
    if (!user.is_active) return apiError(res, 'Account suspended', 403);

    let valid = false;
    if (user.password_hash) {
      valid = await bcrypt.compare(password, user.password_hash);
    }

    // In dev mode also accept the default password directly
    const isDev = process.env.NODE_ENV !== 'production';
    const ADMIN_PASS = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123';
    if (!valid && isDev && password === ADMIN_PASS) valid = true;

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

// All routes below require authentication
router.use(verifyToken);
router.use(requireAdmin);
router.use(apiLimiter);

// Dashboard
router.get('/dashboard', getDashboard);
router.get('/analytics/revenue', getRevenueAnalytics);
router.get('/reports', generateReport);

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.patch('/users/:id/toggle-status', toggleUserStatus);

// Partner management
router.get('/partners', getPartners);
router.patch('/partners/:id/approve', approvePartner);

// Bookings
router.get('/bookings', getAllBookings);

// Service management
router.get('/services/categories', getServiceCategories);
router.post('/services/categories', createServiceCategory);
router.post(
  '/services/packages',
  uploadServiceImages.array('images', 5),
  handleMulterError,
  createServicePackage
);

// Coupon management
router.get('/coupons', getCoupons);
router.post('/coupons', strictLimiter, createCoupon);
router.patch('/coupons/:id/deactivate', deactivateCoupon);

// Cities
router.get('/cities', getCities);

// Broadcast notifications
router.post('/notifications/broadcast', strictLimiter, sendBroadcast);

module.exports = router;
