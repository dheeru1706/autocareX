'use strict';

const router = require('express').Router();
const {
  createBookingHandler,
  getBookings,
  getBooking,
  cancelBookingHandler,
  getBookingTimeline,
  rateBookingHandler,
  updateBookingStatus,
} = require('./bookings.controller');
const { verifyToken, requirePartner } = require('../../middleware/auth');
const { apiLimiter, strictLimiter } = require('../../middleware/rateLimiter');

router.use(verifyToken);
router.use(apiLimiter);

// Consumer routes
router.post('/create', strictLimiter, createBookingHandler);
router.get('/', getBookings);
router.get('/:id', getBooking);
router.patch('/:id/cancel', cancelBookingHandler);
router.get('/:id/timeline', getBookingTimeline);
router.post('/:id/rate', rateBookingHandler);

// Partner routes
router.patch('/:id/status', requirePartner, updateBookingStatus);

module.exports = router;
