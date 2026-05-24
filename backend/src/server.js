'use strict';

require('dotenv').config();

const http = require('http');
const app = require('./app');
const { initializeSocket } = require('./websocket/socket');
const { testConnection, closePool } = require('./config/database');
const { connectRedis, disconnectRedis } = require('./config/redis');
const { initializeFirebase } = require('./config/firebase');
const logger = require('./utils/logger');
const cron = require('node-cron');

const PORT = parseInt(process.env.PORT, 10) || 8000;
const HOST = process.env.HOST || '0.0.0.0';

const server = http.createServer(app);

// Attach Socket.io
let socketInstance;
try {
  socketInstance = initializeSocket(server);
  // Make io available globally for emitting events from anywhere
  global.io = socketInstance.io;
} catch (err) {
  logger.error('Failed to initialize Socket.io', { error: err.message });
}

// =============================================
// SCHEDULED JOBS
// =============================================

function setupCronJobs() {
  // Insurance renewal reminders — runs daily at 9 AM IST
  cron.schedule('0 9 * * *', async () => {
    logger.info('Running insurance renewal reminder job');
    try {
      const { query } = require('./config/database');
      const { notifyUser } = require('./utils/notifications');

      const expiring = await query(
        `SELECT ip.id, ip.user_id, ip.policy_number, ip.provider_name,
                ip.expiry_date, v.make, v.model, v.registration_number,
                ip.expiry_date - CURRENT_DATE AS days_remaining
         FROM insurance_policies ip
         JOIN vehicles v ON v.id = ip.vehicle_id
         WHERE ip.status = 'active'
           AND ip.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
           AND (ip.reminder_sent_at IS NULL OR ip.reminder_sent_at < NOW() - INTERVAL '7 days')`
      );

      for (const policy of expiring.rows) {
        await notifyUser(
          policy.user_id,
          'Insurance Expiring Soon!',
          `Your ${policy.provider_name} insurance for ${policy.make} ${policy.model} (${policy.registration_number}) expires in ${policy.days_remaining} days.`,
          'insurance_reminder',
          { policyId: policy.id }
        );

        await query(
          'UPDATE insurance_policies SET reminder_sent_at = NOW() WHERE id = $1',
          [policy.id]
        );
      }

      logger.info('Insurance reminder job completed', { count: expiring.rows.length });
    } catch (err) {
      logger.error('Insurance reminder job failed', { error: err.message });
    }
  }, { timezone: 'Asia/Kolkata' });

  // Subscription expiry check — runs daily at midnight
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running subscription expiry job');
    try {
      const { query } = require('./config/database');
      const { notifyUser } = require('./utils/notifications');

      // Mark expired subscriptions
      const expired = await query(
        `UPDATE subscriptions SET status = 'expired', updated_at = NOW()
         WHERE status = 'active' AND end_date < CURRENT_DATE
         RETURNING user_id, id`
      );

      for (const sub of expired.rows) {
        await notifyUser(
          sub.user_id,
          'Subscription Expired',
          'Your AutoCareX subscription has expired. Renew now for uninterrupted service.',
          'subscription'
        );
      }

      logger.info('Subscription expiry job completed', { expired: expired.rowCount });
    } catch (err) {
      logger.error('Subscription expiry job failed', { error: err.message });
    }
  }, { timezone: 'Asia/Kolkata' });

  // Clean up expired OTP sessions — runs every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const { query } = require('./config/database');
      await query("DELETE FROM otp_sessions WHERE expires_at < NOW() - INTERVAL '1 hour'");
    } catch (err) {
      logger.error('OTP cleanup job failed', { error: err.message });
    }
  });

  // Clean up expired audit logs older than 90 days — runs weekly
  cron.schedule('0 2 * * 0', async () => {
    try {
      const { query } = require('./config/database');
      const result = await query(
        "DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days'"
      );
      logger.info('Audit log cleanup', { deleted: result.rowCount });
    } catch (err) {
      logger.error('Audit log cleanup failed', { error: err.message });
    }
  });

  logger.info('Cron jobs scheduled');
}

// =============================================
// GRACEFUL SHUTDOWN
// =============================================

async function gracefulShutdown(signal) {
  logger.info(`${signal} received — initiating graceful shutdown`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await Promise.allSettled([
        closePool(),
        disconnectRedis(),
      ]);
      logger.info('All connections closed. Exiting.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown', { error: err.message });
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Graceful shutdown timeout — forcing exit');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

// =============================================
// STARTUP
// =============================================

async function start() {
  // Bind port immediately so Railway health-check passes and we can see logs
  await new Promise((resolve) => {
    server.listen(PORT, HOST, () => {
      process.stdout.write(`[STARTUP] HTTP server listening on ${HOST}:${PORT}\n`);
      logger.info('AutoCareX API listening', {
        port: PORT,
        host: HOST,
        env: process.env.NODE_ENV || 'development',
        pid: process.pid,
      });
      resolve();
    });
  });

  try {
    process.stdout.write('[STARTUP] Starting AutoCareX backend...\n');
    logger.info('Starting AutoCareX backend...');

    // Connect to Redis (with a hard 15-second timeout guard)
    process.stdout.write('[STARTUP] Connecting to Redis...\n');
    await Promise.race([
      connectRedis(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis connection timed out after 15s')), 15000)
      ),
    ]);
    logger.info('Redis connected');

    // Test DB connection
    process.stdout.write('[STARTUP] Testing DB connection...\n');
    const dbOk = await testConnection();
    if (!dbOk) {
      logger.warn('Database not reachable — continuing without DB');
    } else {
      logger.info('Database connected');
    }

    // Initialize Firebase
    try {
      initializeFirebase();
    } catch (err) {
      logger.warn('Firebase initialization skipped', { error: err.message });
    }

    // Start cron jobs (only if DB is up)
    if (dbOk) {
      setupCronJobs();
    }

    logger.info('AutoCareX API fully ready', {
      port: PORT,
      env: process.env.NODE_ENV || 'development',
    });
  } catch (err) {
    logger.error('Backend startup error (server still running)', { error: err.message, stack: err.stack });
    // Do NOT exit — keep the HTTP server running so we can observe logs
  }
}

start().catch((err) => {
  process.stderr.write(`[FATAL] start() rejected: ${err.message}\n${err.stack}\n`);
  process.exit(1);
});

module.exports = server;
