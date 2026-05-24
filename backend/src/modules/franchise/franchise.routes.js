'use strict';

const router = require('express').Router();
const {
  onboardPartner, getPartnerProfile, updatePartnerProfile,
  getStaff, addStaff, updateStaff, deleteStaff,
  getPartnerBookingsHandler, getEarnings, getAnalytics,
} = require('./franchise.controller');
const { verifyToken, requirePartner } = require('../../middleware/auth');
const { uploadKycDocuments, uploadAvatar, handleMulterError } = require('../../middleware/upload');
const { apiLimiter, strictLimiter } = require('../../middleware/rateLimiter');

router.use(verifyToken);
router.use(apiLimiter);

// Onboarding (any authenticated user can apply)
router.post(
  '/onboard',
  strictLimiter,
  uploadAvatar.single('logo'),
  handleMulterError,
  onboardPartner
);

// Partner-only routes
router.get('/profile', requirePartner, getPartnerProfile);
router.patch(
  '/profile',
  requirePartner,
  uploadAvatar.single('logo'),
  handleMulterError,
  updatePartnerProfile
);

// Staff management
router.get('/staff', requirePartner, getStaff);
router.post('/staff', requirePartner, addStaff);
router.patch('/staff/:staffId', requirePartner, updateStaff);
router.delete('/staff/:staffId', requirePartner, deleteStaff);

// Bookings
router.get('/bookings', requirePartner, getPartnerBookingsHandler);

// Earnings & analytics
router.get('/earnings', requirePartner, getEarnings);
router.get('/analytics', requirePartner, getAnalytics);

module.exports = router;
