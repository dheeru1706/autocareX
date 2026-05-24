'use strict';

const router = require('express').Router();
const {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
  getPaymentHistory,
} = require('./payments.controller');
const { verifyToken } = require('../../middleware/auth');
const { apiLimiter, strictLimiter, webhookLimiter } = require('../../middleware/rateLimiter');

// Webhook route — no JWT auth, Razorpay signature verified instead
router.post(
  '/webhook',
  webhookLimiter,
  (req, res, next) => {
    // Capture raw body for signature verification
    let rawBody = '';
    req.on('data', (chunk) => { rawBody += chunk; });
    req.on('end', () => {
      req.rawBody = rawBody;
      next();
    });
  },
  handleWebhook
);

router.use(verifyToken);
router.use(apiLimiter);

router.post('/create-order', strictLimiter, createPaymentOrder);
router.post('/verify', strictLimiter, verifyPayment);
router.get('/history', getPaymentHistory);

module.exports = router;
