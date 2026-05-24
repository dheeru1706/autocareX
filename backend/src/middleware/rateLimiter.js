'use strict';

const rateLimit = require('express-rate-limit');
const { error } = require('../utils/response');

function rateLimitHandler(req, res) {
  return error(res, 'Too many requests. Please try again later.', 429);
}

// Lazy Redis store — only imported after Redis has connected (avoids "client is closed" on startup)
function createStore(prefix) {
  try {
    const { RedisStore } = require('rate-limit-redis');
    const { client } = require('../config/redis');
    if (client && client.isOpen) {
      return new RedisStore({
        sendCommand: (...args) => client.sendCommand(args),
        prefix: `rl:${prefix}:`,
      });
    }
  } catch (_) {}
  return undefined; // falls back to built-in memory store
}

// Build a rate limiter with lazy Redis store
function makeLimiter(options) {
  return rateLimit({
    ...options,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    // store resolved at request time via a middleware wrapper
    skip: false,
  });
}

// Wraps the limiter so the Redis store is attached on the first real request (after Redis is ready)
function lazyLimiter(prefix, options) {
  let limiter = null;
  return (req, res, next) => {
    if (!limiter) {
      const store = createStore(prefix);
      limiter = rateLimit({
        ...options,
        standardHeaders: true,
        legacyHeaders: false,
        handler: rateLimitHandler,
        ...(store ? { store } : {}),
      });
    }
    return limiter(req, res, next);
  };
}

const otpLimiter = lazyLimiter('otp', {
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => `${req.ip}:${req.body?.phone || ''}`,
  message: 'Too many OTP requests. Please wait 10 minutes before trying again.',
});

const apiLimiter = lazyLimiter('api', {
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user?.id || req.ip,
});

const strictLimiter = lazyLimiter('strict', {
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.id || req.ip,
});

const uploadLimiter = lazyLimiter('upload', {
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.id || req.ip,
});

const authLimiter = lazyLimiter('auth', {
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.ip,
});

const webhookLimiter = lazyLimiter('webhook', {
  windowMs: 60 * 1000,
  max: 200,
  keyGenerator: (req) => req.ip,
});

module.exports = {
  otpLimiter,
  apiLimiter,
  strictLimiter,
  uploadLimiter,
  authLimiter,
  webhookLimiter,
};
