'use strict';

const { createClient } = require('redis');
const logger = require('../utils/logger');

const redisConfig = {
  url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB, 10) || 0,
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis max reconnection attempts reached');
        return new Error('Redis connection failed');
      }
      const delay = Math.min(retries * 100, 3000);
      logger.warn(`Redis reconnecting in ${delay}ms`, { retries });
      return delay;
    },
  },
};

const client = createClient(redisConfig);
const subscriber = createClient(redisConfig);
const publisher = createClient(redisConfig);

client.on('error', (err) => logger.error('Redis client error', { error: err.message }));
client.on('connect', () => logger.info('Redis client connected'));
client.on('reconnecting', () => logger.warn('Redis client reconnecting'));
client.on('ready', () => logger.info('Redis client ready'));

subscriber.on('error', (err) => logger.error('Redis subscriber error', { error: err.message }));
publisher.on('error', (err) => logger.error('Redis publisher error', { error: err.message }));

async function connectRedis() {
  await Promise.all([client.connect(), subscriber.connect(), publisher.connect()]);
  logger.info('All Redis connections established');
}

async function disconnectRedis() {
  await Promise.all([client.quit(), subscriber.quit(), publisher.quit()]);
  logger.info('All Redis connections closed');
}

// ---- Utility helpers ----

async function get(key) {
  const value = await client.get(key);
  if (value === null) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function set(key, value, ttlSeconds) {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  if (ttlSeconds) {
    return client.setEx(key, ttlSeconds, serialized);
  }
  return client.set(key, serialized);
}

async function del(...keys) {
  return client.del(keys);
}

async function exists(key) {
  return client.exists(key);
}

async function incr(key) {
  return client.incr(key);
}

async function expire(key, ttlSeconds) {
  return client.expire(key, ttlSeconds);
}

async function ttl(key) {
  return client.ttl(key);
}

async function hSet(key, field, value) {
  return client.hSet(key, field, typeof value === 'string' ? value : JSON.stringify(value));
}

async function hGet(key, field) {
  const value = await client.hGet(key, field);
  if (value === null) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function hGetAll(key) {
  const data = await client.hGetAll(key);
  const result = {};
  for (const [k, v] of Object.entries(data)) {
    try {
      result[k] = JSON.parse(v);
    } catch {
      result[k] = v;
    }
  }
  return result;
}

async function lPush(key, ...values) {
  return client.lPush(key, values.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))));
}

async function lRange(key, start, stop) {
  const items = await client.lRange(key, start, stop);
  return items.map((item) => {
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  });
}

async function publish(channel, message) {
  const payload = typeof message === 'string' ? message : JSON.stringify(message);
  return publisher.publish(channel, payload);
}

async function subscribe(channel, handler) {
  return subscriber.subscribe(channel, (message) => {
    try {
      handler(JSON.parse(message));
    } catch {
      handler(message);
    }
  });
}

async function unsubscribe(channel) {
  return subscriber.unsubscribe(channel);
}

module.exports = {
  client,
  subscriber,
  publisher,
  connectRedis,
  disconnectRedis,
  get,
  set,
  del,
  exists,
  incr,
  expire,
  ttl,
  hSet,
  hGet,
  hGetAll,
  lPush,
  lRange,
  publish,
  subscribe,
  unsubscribe,
};
