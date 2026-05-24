'use strict';

const logger = require('../utils/logger');

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Global error handler middleware
 */
function globalErrorHandler(err, req, res, next) {
  // Log the error
  const logContext = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    errorName: err.name,
    errorMessage: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  };

  if (err.status >= 500 || !err.status) {
    logger.error('Unhandled error', logContext);
  } else {
    logger.warn('Request error', logContext);
  }

  // Determine status code
  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed';
    errors = err.details;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err.code === '23505') {
    // PostgreSQL unique violation
    statusCode = 409;
    message = 'Resource already exists';
  } else if (err.code === '23503') {
    // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Referenced resource does not exist';
  } else if (err.code === '22P02') {
    // PostgreSQL invalid text representation (invalid UUID etc.)
    statusCode = 400;
    message = 'Invalid data format';
  } else if (err.code === '23502') {
    // PostgreSQL not null violation
    statusCode = 400;
    message = 'Required field missing';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request payload too large';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  }

  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    message = 'Internal server error';
    errors = null;
  }

  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (errors) response.errors = errors;
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
}

/**
 * Async error wrapper utility
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { notFoundHandler, globalErrorHandler, asyncHandler };
