'use strict';

const router = require('express').Router();
const {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  deleteAddress,
  setDefaultAddress,
  getWallet,
  getReferral,
} = require('./users.controller');
const { verifyToken } = require('../../middleware/auth');
const { uploadAvatar, handleMulterError } = require('../../middleware/upload');
const { apiLimiter } = require('../../middleware/rateLimiter');

router.use(verifyToken);
router.use(apiLimiter);

// Profile
router.get('/profile', getProfile);
router.patch('/profile', uploadAvatar.single('avatar'), handleMulterError, updateProfile);

// Addresses
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.delete('/addresses/:id', deleteAddress);
router.patch('/addresses/:id/default', setDefaultAddress);

// Wallet
router.get('/wallet', getWallet);

// Referral
router.get('/referral', getReferral);

module.exports = router;
