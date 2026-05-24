'use strict';

const Joi = require('joi');
const { initiateOTP, verifyOTPAndLogin, refreshAccessToken, logout, socialLogin } = require('./auth.service');
const { success, error, validationError } = require('../../utils/response');
const logger = require('../../utils/logger');

const sendOtpSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please enter a valid 10-digit Indian mobile number',
    }),
});

const verifyOtpSchema = Joi.object({
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  otp: Joi.string().length(6).pattern(/^\d{6}$/).required(),
  fcm_token: Joi.string().optional().allow('', null),
});

const refreshSchema = Joi.object({
  refresh_token: Joi.string().required(),
});

const socialLoginSchema = Joi.object({
  provider: Joi.string().valid('google', 'apple').required(),
  id_token: Joi.string().required(),
  fcm_token: Joi.string().optional().allow('', null),
});

async function sendOTP(req, res) {
  const { error: validErr, value } = sendOtpSchema.validate(req.body);
  if (validErr) {
    return validationError(res, validErr.details.map((d) => d.message));
  }

  try {
    const result = await initiateOTP(value.phone);
    return success(res, result, 'OTP sent successfully');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
}

async function verifyOTP(req, res) {
  const { error: validErr, value } = verifyOtpSchema.validate(req.body);
  if (validErr) {
    return validationError(res, validErr.details.map((d) => d.message));
  }

  try {
    const result = await verifyOTPAndLogin(value.phone, value.otp, value.fcm_token);

    // Set refresh token as HttpOnly cookie for added security
    res.cookie('refresh_token', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    return success(
      res,
      {
        user: result.user,
        access_token: result.tokens.accessToken,
        refresh_token: result.tokens.refreshToken,
      },
      result.user.isNewUser ? 'Registration successful' : 'Login successful',
      result.user.isNewUser ? 201 : 200
    );
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
}

async function refreshToken(req, res) {
  const { error: validErr, value } = refreshSchema.validate(req.body);
  // Also check cookie
  const refreshTkn = value?.refresh_token || req.cookies?.refresh_token;

  if (validErr && !refreshTkn) {
    return validationError(res, ['refresh_token is required']);
  }

  try {
    const tokens = await refreshAccessToken(refreshTkn);

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    return success(res, { access_token: tokens.accessToken, refresh_token: tokens.refreshToken }, 'Token refreshed');
  } catch (err) {
    return error(res, err.message, err.status || 401);
  }
}

async function logoutUser(req, res) {
  const refreshTkn = req.body?.refresh_token || req.cookies?.refresh_token;
  const accessToken = req.headers.authorization?.split(' ')[1];

  try {
    await logout(req.user.id, accessToken, refreshTkn);

    res.clearCookie('refresh_token', { path: '/api/auth' });
    return success(res, null, 'Logged out successfully');
  } catch (err) {
    logger.error('Logout error', { userId: req.user.id, error: err.message });
    return error(res, 'Logout failed', 500);
  }
}

async function socialLoginHandler(req, res) {
  const { error: validErr, value } = socialLoginSchema.validate(req.body);
  if (validErr) {
    return validationError(res, validErr.details.map((d) => d.message));
  }

  try {
    const result = await socialLogin(value.provider, value.id_token, value.fcm_token);

    res.cookie('refresh_token', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    return success(res, {
      user: result.user,
      access_token: result.tokens.accessToken,
      refresh_token: result.tokens.refreshToken,
    }, 'Login successful');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
}

module.exports = { sendOTP, verifyOTP, refreshToken, logoutUser, socialLoginHandler };
