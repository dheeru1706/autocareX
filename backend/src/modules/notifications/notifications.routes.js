'use strict';

const router = require('express').Router();
const {
  getNotifications,
  markAsRead,
  deleteNotification,
  sendBroadcast,
  updateFcmToken,
} = require('./notifications.controller');
const { verifyToken, requireAdmin } = require('../../middleware/auth');
const { apiLimiter, strictLimiter } = require('../../middleware/rateLimiter');

router.use(verifyToken);
router.use(apiLimiter);

router.get('/', getNotifications);
router.patch('/mark-read', markAsRead);
router.delete('/:id', deleteNotification);
router.put('/fcm-token', updateFcmToken);

// Admin broadcast
router.post('/broadcast', requireAdmin, strictLimiter, sendBroadcast);

module.exports = router;
