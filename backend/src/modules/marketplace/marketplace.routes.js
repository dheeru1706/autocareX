'use strict';

const router = require('express').Router();
const {
  getListings, getListing, createListing, updateListing, deleteListing,
  createInquiry, getAIPricing, getMyListings,
} = require('./marketplace.controller');
const { verifyToken, optionalAuth } = require('../../middleware/auth');
const { uploadMarketplaceImages, handleMulterError } = require('../../middleware/upload');
const { apiLimiter, uploadLimiter, strictLimiter } = require('../../middleware/rateLimiter');

router.get('/', apiLimiter, optionalAuth, getListings);
router.get('/ai-pricing', apiLimiter, getAIPricing);
router.get('/my-listings', verifyToken, apiLimiter, getMyListings);
router.get('/:id', optionalAuth, getListing);

router.use(verifyToken);
router.use(apiLimiter);

router.post(
  '/',
  uploadLimiter,
  uploadMarketplaceImages.array('images', 15),
  handleMulterError,
  createListing
);

router.patch(
  '/:id',
  uploadLimiter,
  uploadMarketplaceImages.array('images', 15),
  handleMulterError,
  updateListing
);

router.delete('/:id', deleteListing);
router.post('/:id/inquiries', strictLimiter, createInquiry);

module.exports = router;
