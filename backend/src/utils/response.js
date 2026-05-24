'use strict';

/**
 * Send a successful response
 */
function success(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Send a created response
 */
function created(res, data = null, message = 'Created successfully') {
  return success(res, data, message, 201);
}

/**
 * Send an error response
 */
function error(res, message = 'Internal server error', statusCode = 500, errors = null) {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
}

/**
 * Send a validation error response
 */
function validationError(res, errors) {
  return error(res, 'Validation failed', 422, errors);
}

/**
 * Send a not found response
 */
function notFound(res, message = 'Resource not found') {
  return error(res, message, 404);
}

/**
 * Send an unauthorized response
 */
function unauthorized(res, message = 'Unauthorized') {
  return error(res, message, 401);
}

/**
 * Send a forbidden response
 */
function forbidden(res, message = 'Forbidden') {
  return error(res, message, 403);
}

/**
 * Send a conflict response
 */
function conflict(res, message = 'Conflict') {
  return error(res, message, 409);
}

/**
 * Send a paginated response
 */
function paginated(res, data, pagination, message = 'Success') {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrev: pagination.page > 1,
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Extract pagination params from query string
 */
function getPaginationParams(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

module.exports = {
  success,
  created,
  error,
  validationError,
  notFound,
  unauthorized,
  forbidden,
  conflict,
  paginated,
  getPaginationParams,
};
