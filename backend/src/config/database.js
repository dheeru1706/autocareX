'use strict';

const { Pool } = require('pg');
const logger = require('../utils/logger');

// Support Railway's DATABASE_URL (single connection string) as well as
// individual DB_* environment variables used for local development.
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      database: process.env.DB_NAME || 'autocarex',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(poolConfig);

pool.on('connect', (client) => {
  logger.debug('New database client connected');
  client.query("SET timezone='Asia/Kolkata'");
});

pool.on('error', (err) => {
  logger.error('Unexpected database pool error', { error: err.message });
});

pool.on('remove', () => {
  logger.debug('Database client removed from pool');
});

/**
 * Execute a query with optional retry logic
 */
async function query(text, params, retries = 3) {
  const start = Date.now();
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;

      if (duration > 1000) {
        logger.warn('Slow query detected', { query: text, duration, rows: result.rowCount });
      } else {
        logger.debug('Query executed', { duration, rows: result.rowCount });
      }

      return result;
    } catch (err) {
      lastError = err;

      const retryable = ['ECONNREFUSED', 'ETIMEDOUT', '57P01', '08006', '08001', '08004'].includes(
        err.code
      );

      if (!retryable || attempt === retries) {
        logger.error('Database query error', {
          error: err.message,
          code: err.code,
          query: text.substring(0, 200),
          attempt,
        });
        throw err;
      }

      const delay = Math.min(100 * Math.pow(2, attempt), 2000);
      logger.warn(`Database query failed, retrying in ${delay}ms`, { attempt, code: err.code });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Get a client from the pool for transaction use
 */
async function getClient() {
  const client = await pool.connect();

  const originalQuery = client.query.bind(client);
  const originalRelease = client.release.bind(client);
  let released = false;

  client.query = (...args) => {
    const start = Date.now();
    return originalQuery(...args).then((result) => {
      logger.debug('Transaction query', { duration: Date.now() - start });
      return result;
    });
  };

  client.release = (err) => {
    if (!released) {
      released = true;
      originalRelease(err);
    }
  };

  return client;
}

/**
 * Execute a function within a transaction
 */
async function withTransaction(fn) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Test database connectivity
 */
async function testConnection() {
  try {
    const result = await query('SELECT NOW() AS current_time, current_database() AS database');
    logger.info('Database connected', {
      time: result.rows[0].current_time,
      database: result.rows[0].database,
    });
    return true;
  } catch (err) {
    logger.error('Database connection failed', { error: err.message });
    return false;
  }
}

/**
 * Gracefully close the pool
 */
async function closePool() {
  await pool.end();
  logger.info('Database pool closed');
}

module.exports = { pool, query, getClient, withTransaction, testConnection, closePool };
