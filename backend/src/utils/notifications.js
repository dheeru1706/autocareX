'use strict';

const { getMessaging } = require('../config/firebase');
const { query } = require('../config/database');
const logger = require('./logger');

/**
 * Send push notification to a single device
 */
async function sendPushNotification(fcmToken, title, body, data = {}) {
  if (!fcmToken) {
    logger.debug('No FCM token, skipping push notification');
    return null;
  }

  const message = {
    notification: { title, body },
    data: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    ),
    token: fcmToken,
    android: {
      notification: {
        sound: 'default',
        priority: 'high',
        channelId: 'autocarex_default',
      },
      priority: 'high',
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  try {
    const messaging = getMessaging(); if (!messaging) return null;
    const response = await messaging.send(message);
    logger.debug('Push notification sent', { messageId: response });
    return response;
  } catch (err) {
    if (err.code === 'messaging/registration-token-not-registered') {
      logger.warn('FCM token expired or unregistered', { token: fcmToken.substring(0, 20) });
    } else {
      logger.error('Push notification failed', { error: err.message, code: err.code });
    }
    return null;
  }
}

/**
 * Send push notification to multiple devices (multicast)
 */
async function sendMulticastNotification(fcmTokens, title, body, data = {}) {
  if (!fcmTokens || fcmTokens.length === 0) return null;

  const validTokens = fcmTokens.filter(Boolean);
  if (validTokens.length === 0) return null;

  const message = {
    notification: { title, body },
    data: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    ),
    tokens: validTokens,
    android: {
      notification: { sound: 'default', priority: 'high', channelId: 'autocarex_default' },
      priority: 'high',
    },
    apns: {
      payload: { aps: { sound: 'default', badge: 1 } },
    },
  };

  try {
    const messaging = getMessaging(); if (!messaging) return null;
    const response = await messaging.sendEachForMulticast(message);
    logger.info('Multicast notification sent', {
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
    return response;
  } catch (err) {
    logger.error('Multicast notification failed', { error: err.message });
    return null;
  }
}

/**
 * Send notification to a user (saves to DB + sends push)
 */
async function notifyUser(userId, title, body, type = 'general', data = {}) {
  try {
    // Save to notifications table
    await query(
      `INSERT INTO notifications (user_id, title, body, type, data, sent_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, title, body, type, JSON.stringify(data)]
    );

    // Get user FCM token
    const userResult = await query(
      'SELECT fcm_token FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );

    if (userResult.rows.length > 0 && userResult.rows[0].fcm_token) {
      await sendPushNotification(userResult.rows[0].fcm_token, title, body, {
        type,
        ...data,
      });
    }
  } catch (err) {
    logger.error('notifyUser failed', { userId, error: err.message });
  }
}

/**
 * Send booking status notification
 */
async function notifyBookingStatus(bookingId, consumerId, partnerId, status) {
  const statusMessages = {
    confirmed: { title: 'Booking Confirmed!', body: 'Your booking has been confirmed. A technician will be assigned shortly.' },
    assigned: { title: 'Technician Assigned!', body: 'A technician has been assigned to your booking.' },
    in_progress: { title: 'Service Started', body: 'Your vehicle service has started.' },
    completed: { title: 'Service Completed!', body: 'Your vehicle service is complete. Please rate your experience.' },
    cancelled: { title: 'Booking Cancelled', body: 'Your booking has been cancelled.' },
  };

  const msg = statusMessages[status];
  if (!msg) return;

  await notifyUser(consumerId, msg.title, msg.body, 'booking', {
    bookingId: String(bookingId),
    status,
  });
}

module.exports = {
  sendPushNotification,
  sendMulticastNotification,
  notifyUser,
  notifyBookingStatus,
};
