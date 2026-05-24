'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { get, set, subscribe, publish } = require('../config/redis');
const logger = require('../utils/logger');

const SOCKET_EVENTS = {
  // Booking events
  BOOKING_STATUS_UPDATE: 'booking:status_update',
  STAFF_LOCATION: 'staff:location',
  BOOKING_OTP: 'booking:otp',

  // Chat events
  CHAT_MESSAGE: 'chat:message',
  CHAT_READ: 'chat:read',
  CHAT_TYPING: 'chat:typing',

  // Notifications
  NOTIFICATION: 'notification',

  // Staff events
  STAFF_AVAILABLE: 'staff:available',
  STAFF_UNAVAILABLE: 'staff:unavailable',
};

function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // JWT Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return next(new Error('Invalid token'));
      }

      // Check blacklist
      const blacklisted = await get(`blacklist:${token}`);
      if (blacklisted) {
        return next(new Error('Token revoked'));
      }

      const result = await query(
        'SELECT id, name, role FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return next(new Error('User not found'));
      }

      socket.user = result.rows[0];
      next();
    } catch (err) {
      logger.error('Socket auth error', { error: err.message });
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const { id: userId, role } = socket.user;
    logger.info('Socket connected', { userId, socketId: socket.id, role });

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Store socket mapping in Redis
    set(`socket:${userId}`, socket.id, 86400);

    // ---- Booking events ----

    socket.on('booking:join', async (bookingId) => {
      try {
        // Verify access to this booking
        let hasAccess = false;

        if (role === 'consumer') {
          const result = await query(
            'SELECT id FROM bookings WHERE id = $1 AND consumer_id = $2',
            [bookingId, userId]
          );
          hasAccess = result.rows.length > 0;
        } else if (role === 'partner') {
          const result = await query(
            `SELECT b.id FROM bookings b
             JOIN franchise_partners fp ON fp.id = b.partner_id
             WHERE b.id = $1 AND fp.user_id = $2`,
            [bookingId, userId]
          );
          hasAccess = result.rows.length > 0;
        } else if (role === 'admin') {
          hasAccess = true;
        }

        if (hasAccess) {
          socket.join(`booking:${bookingId}`);
          logger.debug('User joined booking room', { userId, bookingId });
        } else {
          socket.emit('error', { message: 'Access denied to this booking' });
        }
      } catch (err) {
        logger.error('booking:join error', { error: err.message });
      }
    });

    socket.on('booking:leave', (bookingId) => {
      socket.leave(`booking:${bookingId}`);
    });

    // ---- Staff location updates ----

    socket.on('staff:location_update', async ({ bookingId, lat, lng }) => {
      try {
        if (role !== 'staff' && role !== 'partner') return;

        // Update staff location in DB
        await query(
          `UPDATE staff SET current_lat = $1, current_lng = $2
           WHERE user_id = $3`,
          [lat, lng, userId]
        );

        // Store in Redis for fast retrieval
        await set(`staff_location:${userId}`, { lat, lng, timestamp: Date.now() }, 300);

        // Broadcast to booking room
        if (bookingId) {
          io.to(`booking:${bookingId}`).emit(SOCKET_EVENTS.STAFF_LOCATION, {
            bookingId,
            lat,
            lng,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err) {
        logger.error('staff:location_update error', { error: err.message });
      }
    });

    socket.on('staff:toggle_availability', async ({ isAvailable }) => {
      try {
        if (role !== 'staff' && role !== 'partner') return;

        await query(
          'UPDATE staff SET is_available = $1 WHERE user_id = $2',
          [isAvailable, userId]
        );

        socket.emit(isAvailable ? SOCKET_EVENTS.STAFF_AVAILABLE : SOCKET_EVENTS.STAFF_UNAVAILABLE, {
          userId,
          isAvailable,
        });
      } catch (err) {
        logger.error('staff:toggle_availability error', { error: err.message });
      }
    });

    // ---- Chat ----

    socket.on('chat:join', async (conversationId) => {
      try {
        const result = await query(
          `SELECT id FROM chat_conversations
           WHERE id = $1 AND (consumer_id = $2 OR partner_id IN (
             SELECT id FROM franchise_partners WHERE user_id = $2
           ))`,
          [conversationId, userId]
        );

        if (result.rows.length > 0 || role === 'admin') {
          socket.join(`chat:${conversationId}`);
          logger.debug('User joined chat room', { userId, conversationId });
        } else {
          socket.emit('error', { message: 'Access denied to this conversation' });
        }
      } catch (err) {
        logger.error('chat:join error', { error: err.message });
      }
    });

    socket.on('chat:send_message', async ({ conversationId, message, messageType = 'text' }) => {
      try {
        if (!message || message.trim().length === 0) return;

        // Save to DB
        const result = await query(
          `INSERT INTO chat_messages (conversation_id, sender_id, message, message_type)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [conversationId, userId, message.trim(), messageType]
        );

        const savedMessage = result.rows[0];

        // Broadcast to conversation room
        io.to(`chat:${conversationId}`).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
          ...savedMessage,
          sender_name: socket.user.name,
        });

        // Notify if other party is offline
        const conv = await query(
          'SELECT consumer_id, partner_id FROM chat_conversations WHERE id = $1',
          [conversationId]
        );

        if (conv.rows.length > 0) {
          const recipientId =
            conv.rows[0].consumer_id === userId
              ? null // partner's user_id needs further lookup
              : conv.rows[0].consumer_id;

          if (recipientId) {
            const recipientSocket = await get(`socket:${recipientId}`);
            if (!recipientSocket || !io.sockets.sockets.get(recipientSocket)) {
              // Recipient is offline, send push notification
              await require('../utils/notifications').notifyUser(
                recipientId,
                'New Message',
                `${socket.user.name}: ${message.substring(0, 100)}`,
                'chat',
                { conversationId }
              );
            }
          }
        }
      } catch (err) {
        logger.error('chat:send_message error', { error: err.message });
      }
    });

    socket.on('chat:typing', ({ conversationId, isTyping }) => {
      socket.to(`chat:${conversationId}`).emit(SOCKET_EVENTS.CHAT_TYPING, {
        userId,
        name: socket.user.name,
        isTyping,
        conversationId,
      });
    });

    socket.on('chat:mark_read', async ({ conversationId }) => {
      try {
        await query(
          `UPDATE chat_messages SET is_read = true
           WHERE conversation_id = $1 AND sender_id != $2 AND is_read = false`,
          [conversationId, userId]
        );

        socket.to(`chat:${conversationId}`).emit(SOCKET_EVENTS.CHAT_READ, {
          conversationId,
          readBy: userId,
        });
      } catch (err) {
        logger.error('chat:mark_read error', { error: err.message });
      }
    });

    // ---- Disconnect ----

    socket.on('disconnect', async (reason) => {
      logger.info('Socket disconnected', { userId, socketId: socket.id, reason });

      // Remove socket mapping from Redis
      const storedSocketId = await get(`socket:${userId}`);
      if (storedSocketId === socket.id) {
        await set(`socket:${userId}`, null, 1);
      }
    });
  });

  // ---- Subscribe to Redis pub/sub for cross-instance events ----

  subscribe('booking:created', (data) => {
    const { bookingId, partnerId, consumerId, status } = data;
    io.to(`user:${consumerId}`).emit(SOCKET_EVENTS.BOOKING_STATUS_UPDATE, { bookingId, status });
  });

  subscribe('booking:cancelled', (data) => {
    const { bookingId, partnerId } = data;
    io.to(`booking:${bookingId}`).emit(SOCKET_EVENTS.BOOKING_STATUS_UPDATE, {
      bookingId,
      status: 'cancelled',
    });
  });

  /**
   * Emit booking status update to all parties in the booking room
   */
  function emitBookingUpdate(bookingId, data) {
    io.to(`booking:${bookingId}`).emit(SOCKET_EVENTS.BOOKING_STATUS_UPDATE, data);
  }

  /**
   * Send notification to specific user
   */
  function notifyUser(userId, notification) {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.NOTIFICATION, notification);
  }

  logger.info('Socket.io initialized');
  return { io, emitBookingUpdate, notifyUser };
}

module.exports = { initializeSocket, SOCKET_EVENTS };
