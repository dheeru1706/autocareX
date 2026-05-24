'use strict';

const router = require('express').Router();
const {
  getPlans, subscribe, getMySubscription, pauseSubscription, cancelSubscriptionHandler,
} = require('./subscriptions.controller');
const { verifyToken } = require('../../middleware/auth');
const { apiLimiter, strictLimiter } = require('../../middleware/rateLimiter');

router.get('/plans', getPlans); // Public

router.use(verifyToken);
router.use(apiLimiter);

router.post('/subscribe', strictLimiter, subscribe);
router.get('/my-subscription', getMySubscription);
router.patch('/:id/pause', pauseSubscription);
router.patch('/:id/cancel', cancelSubscriptionHandler);

module.exports = router;
