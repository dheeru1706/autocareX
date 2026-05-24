'use strict';

const Joi = require('joi');
const { query } = require('../../config/database');
const { success, error, notFound, validationError, paginated, getPaginationParams } = require('../../utils/response');
const { sendPushNotification, sendMulticastNotification } = require('../../utils/notifications');
const logger = require('../../utils/logger');

async function getNotifications(req, res) {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { unread_only } = req.query;

  try {
    const conditions = ['user_id = $1'];
    const params = [req.user.id];

    if (unread_only === 'true') {
      conditions.push('is_read = false');
    }

    const whereClause = conditions.join(' AND ');

    const [notifResult, countResult, unreadCount] = await Promise.all([
      query(
        `SELECT * FROM notifications WHERE ${whereClause}
         ORDER BY sent_at DESC LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      ),
      query(`SELECT COUNT(*) FROM notifications WHERE ${whereClause}`, params),
      query('SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false', [req.user.id]),
    ]);

    return paginated(
      res,
      {
        notifications: notifResult.rows,
        unread_count: parseInt(unreadCount.rows[0].count, 10),
      },
      { page, limit, total: parseInt(countResult.rows[0].count, 10) }
    );
  } catch (err) {
    return error(res, 'Failed to fetch notifications');
  }
}

async function markAsRead(req, res) {
  const { notification_ids } = req.body;

  try {
    if (notification_ids && Array.isArray(notification_ids) && notification_ids.length > 0) {
      await query(
        `UPDATE notifications SET is_read = true, read_at = NOW()
         WHERE id = ANY($1::uuid[]) AND user_id = $2`,
        [notification_ids, req.user.id]
      );
    } else {
      // Mark all as read
      await query(
        'UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false',
        [req.user.id]
      );
    }

    return success(res, null, 'Notifications marked as read');
  } catch (err) {
    return error(res, 'Failed to update notifications');
  }
}

async function deleteNotification(req, res) {
  try {
    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rowCount === 0) return notFound(res, 'Notification not found');
    return success(res, null, 'Notification deleted');
  } catch (err) {
    return error(res, 'Failed to delete notification');
  }
}

// Admin: send broadcast notification
async function sendBroadcast(req, res) {
  const schema = Joi.object({
    title: Joi.string().min(3).max(255).required(),
    body: Joi.string().min(5).max(500).required(),
    type: Joi.string().optional().default('broadcast'),
    target: Joi.string().valid('all', 'consumer', 'partner', 'premium').optional().default('all'),
    data: Joi.object().optional().default({}),
  });

  const { error: validErr, value } = schema.validate(req.body);
  if (validErr) return validationError(res, validErr.details.map((d) => d.message));

  try {
    // Get target users
    let userQuery = 'SELECT id, fcm_token FROM users WHERE is_active = true AND fcm_token IS NOT NULL';
    const params = [];
    let idx = 1;

    if (value.target === 'consumer') {
      userQuery += ` AND role = 'consumer'`;
    } else if (value.target === 'partner') {
      userQuery += ` AND role = 'partner'`;
    } else if (value.target === 'premium') {
      userQuery += ` AND id IN (SELECT user_id FROM subscriptions WHERE status = 'active')`;
    }

    const usersResult = await query(userQuery, params);
    const users = usersResult.rows;

    if (users.length === 0) {
      return success(res, { sent: 0 }, 'No users to notify');
    }

    // Save notification records
    const notifValues = users
      .map((u) => `('${u.id}', '${value.title.replace(/'/g, "''")}', '${value.body.replace(/'/g, "''")}', '${value.type}', '${JSON.stringify(value.data).replace(/'/g, "''")}')`)
      .join(', ');

    await query(
      `INSERT INTO notifications (user_id, title, body, type, data) VALUES ${notifValues}`
    );

    // Send FCM to all valid tokens in batches of 500
    const tokens = users.map((u) => u.fcm_token).filter(Boolean);
    const batchSize = 500;
    let successCount = 0;

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      const response = await sendMulticastNotification(batch, value.title, value.body, {
        type: value.type,
        ...value.data,
      });
      successCount += response?.successCount || 0;
    }

    logger.info('Broadcast notification sent', { total: users.length, success: successCount });
    return success(res, { sent: successCount, total: users.length });
  } catch (err) {
    logger.error('sendBroadcast error', { error: err.message });
    return error(res, 'Failed to send broadcast');
  }
}

// Update FCM token
async function updateFcmToken(req, res) {
  const { fcm_token } = req.body;

  if (!fcm_token) return error(res, 'fcm_token is required', 400);

  try {
    await query('UPDATE users SET fcm_token = $1 WHERE id = $2', [fcm_token, req.user.id]);
    return success(res, null, 'FCM token updated');
  } catch (err) {
    return error(res, 'Failed to update FCM token');
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  deleteNotification,
  sendBroadcast,
  updateFcmToken,
};
