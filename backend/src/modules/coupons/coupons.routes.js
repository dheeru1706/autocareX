'use strict';

const router = require('express').Router();
const {
  validateCoupon, createCoupon, getCoupons, deactivateCoupon,
} = require('./coupons.controller');
const { verifyToken, requireAdmin } = require('../../middleware/auth');
const { apiLimiter, strictLimiter } = require('../../middleware/rateLimiter');

// Public: list available coupons
router.get('/', apiLimiter, getCoupons);

router.use(verifyToken);

// Consumer: validate coupon
router.post('/validate', strictLimiter, validateCoupon);

// Admin routes
router.post('/', requireAdmin, createCoupon);
router.patch('/:id/deactivate', requireAdmin, deactivateCoupon);

module.exports = router;
