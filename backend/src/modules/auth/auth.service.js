'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { query, withTransaction } = require('../../config/database');
const { set, get, del } = require('../../config/redis');
const { sendOTP } = require('../../utils/sms');
const { generateTokenPair, verifyRefreshToken } = require('../../middleware/auth');
const logger = require('../../utils/logger');

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 600; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

function generateOTP() {
  // Cryptographically secure OTP
  const bytes = crypto.randomBytes(4);
  const otp = (bytes.readUInt32BE(0) % 900000 + 100000).toString();
  return otp;
}

function generateReferralCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Initiate OTP login flow
 */
async function initiateOTP(phone) {
  // Check for existing valid session
  const existingSession = await get(`otp:${phone}`);
  if (existingSession && existingSession.createdAt) {
    const elapsed = Date.now() - new Date(existingSession.createdAt).getTime();
    if (elapsed < 30000) {
      throw Object.assign(new Error('Please wait 30 seconds before requesting another OTP'), {
        status: 429,
      });
    }
  }

  const otp = process.env.NODE_ENV === 'development' ? '123456' : generateOTP();
  const otpHash = await bcrypt.hash(otp, 10);

  // Store in Redis with TTL
  await set(
    `otp:${phone}`,
    { hash: otpHash, attempts: 0, createdAt: new Date().toISOString() },
    OTP_EXPIRY_SECONDS
  );

  // Also store in DB for audit
  await query(
    `INSERT INTO otp_sessions (phone, otp_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '10 minutes')`,
    [phone, otpHash]
  );

  // Send SMS
  await sendOTP(phone, otp);

  logger.info('OTP sent', { phone: phone.replace(/\d{4}$/, '****') });

  return {
    message: 'OTP sent successfully',
    expiresIn: OTP_EXPIRY_SECONDS,
  };
}

/**
 * Verify OTP and issue tokens
 */
async function verifyOTPAndLogin(phone, otp, fcmToken) {
  const session = await get(`otp:${phone}`);

  if (!session) {
    throw Object.assign(new Error('OTP expired or not requested. Please request a new OTP.'), {
      status: 400,
    });
  }

  if (session.attempts >= MAX_OTP_ATTEMPTS) {
    await del(`otp:${phone}`);
    throw Object.assign(new Error('Too many failed attempts. Please request a new OTP.'), {
      status: 429,
    });
  }

  const isMatch = await bcrypt.compare(otp, session.hash);

  if (!isMatch) {
    // Increment attempt count
    session.attempts += 1;
    const ttlLeft = OTP_EXPIRY_SECONDS - Math.floor((Date.now() - new Date(session.createdAt).getTime()) / 1000);
    await set(`otp:${phone}`, session, Math.max(ttlLeft, 1));

    throw Object.assign(
      new Error(`Invalid OTP. ${MAX_OTP_ATTEMPTS - session.attempts} attempts remaining.`),
      { status: 400 }
    );
  }

  // OTP is valid — invalidate session
  await del(`otp:${phone}`);

  // Upsert user
  const { user, isNewUser } = await withTransaction(async (client) => {
    let result = await client.query(
      'SELECT id, phone, name, role, is_active, kyc_status FROM users WHERE phone = $1',
      [phone]
    );

    let user;
    let isNewUser = false;

    if (result.rows.length === 0) {
      // New user registration
      const referralCode = generateReferralCode();
      const insertResult = await client.query(
        `INSERT INTO users (phone, referral_code, fcm_token)
         VALUES ($1, $2, $3)
         RETURNING id, phone, name, role, is_active, kyc_status`,
        [phone, referralCode, fcmToken || null]
      );
      user = insertResult.rows[0];
      isNewUser = true;
      logger.info('New user registered', { userId: user.id });
    } else {
      user = result.rows[0];

      if (!user.is_active) {
        throw Object.assign(new Error('Account is deactivated. Please contact support.'), {
          status: 403,
        });
      }

      // Update FCM token if provided
      if (fcmToken) {
        await client.query('UPDATE users SET fcm_token = $1 WHERE id = $2', [fcmToken, user.id]);
      }
    }

    return { user, isNewUser };
  });

  const { accessToken, refreshToken } = generateTokenPair(user.id, user.role);

  // Store refresh token in Redis
  await set(`refresh:${user.id}:${refreshToken.slice(-20)}`, { userId: user.id, role: user.role }, REFRESH_TOKEN_EXPIRY_SECONDS);

  logger.info('User logged in', { userId: user.id, isNewUser });

  return {
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      kycStatus: user.kyc_status,
      isNewUser,
    },
    tokens: { accessToken, refreshToken },
  };
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });
  }

  const key = `refresh:${decoded.userId}:${refreshToken.slice(-20)}`;
  const stored = await get(key);

  if (!stored) {
    throw Object.assign(new Error('Refresh token revoked'), { status: 401 });
  }

  // Verify user is still active
  const result = await query(
    'SELECT id, role, is_active FROM users WHERE id = $1',
    [decoded.userId]
  );

  if (result.rows.length === 0 || !result.rows[0].is_active) {
    await del(key);
    throw Object.assign(new Error('Account not found or deactivated'), { status: 401 });
  }

  const user = result.rows[0];

  // Rotate tokens (invalidate old refresh token)
  await del(key);

  const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user.id, user.role);
  await set(`refresh:${user.id}:${newRefreshToken.slice(-20)}`, { userId: user.id, role: user.role }, REFRESH_TOKEN_EXPIRY_SECONDS);

  return { accessToken, refreshToken: newRefreshToken };
}

/**
 * Logout: blacklist access token, revoke refresh token
 */
async function logout(userId, accessToken, refreshToken) {
  // Blacklist the access token until it expires (~15min)
  await set(`blacklist:${accessToken}`, true, 15 * 60);

  // Remove refresh token from Redis if provided
  if (refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const key = `refresh:${decoded.userId}:${refreshToken.slice(-20)}`;
      await del(key);
    } catch {
      // Ignore invalid refresh token during logout
    }
  }

  // Clear FCM token
  await query('UPDATE users SET fcm_token = NULL WHERE id = $1', [userId]);

  logger.info('User logged out', { userId });
}

/**
 * Social login (Google/Apple)
 */
async function socialLogin(provider, idToken, fcmToken) {
  // Verify the social token based on provider
  let providerUserId, email, name;

  if (provider === 'google') {
    // Verify with Google
    const response = await require('axios').get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );
    if (response.data.aud !== process.env.GOOGLE_CLIENT_ID) {
      throw Object.assign(new Error('Invalid Google token'), { status: 401 });
    }
    providerUserId = response.data.sub;
    email = response.data.email;
    name = response.data.name;
  } else if (provider === 'apple') {
    // Apple sign-in verification would go here
    throw Object.assign(new Error('Apple Sign-In not yet configured'), { status: 501 });
  } else {
    throw Object.assign(new Error('Unsupported social provider'), { status: 400 });
  }

  // Find or create user by email
  const { user, isNewUser } = await withTransaction(async (client) => {
    let result = await client.query(
      'SELECT id, phone, name, role, is_active, kyc_status FROM users WHERE email = $1',
      [email]
    );

    let user;
    let isNewUser = false;

    if (result.rows.length === 0) {
      const referralCode = generateReferralCode();
      const insertResult = await client.query(
        `INSERT INTO users (email, name, referral_code, fcm_token)
         VALUES ($1, $2, $3, $4)
         RETURNING id, phone, name, role, is_active, kyc_status`,
        [email, name, referralCode, fcmToken || null]
      );
      user = insertResult.rows[0];
      isNewUser = true;
    } else {
      user = result.rows[0];
      if (!user.is_active) {
        throw Object.assign(new Error('Account deactivated'), { status: 403 });
      }
      if (fcmToken) {
        await client.query('UPDATE users SET fcm_token = $1, name = COALESCE(name, $2) WHERE id = $3', [
          fcmToken,
          name,
          user.id,
        ]);
      }
    }

    return { user, isNewUser };
  });

  const { accessToken, refreshToken } = generateTokenPair(user.id, user.role);
  await set(`refresh:${user.id}:${refreshToken.slice(-20)}`, { userId: user.id, role: user.role }, REFRESH_TOKEN_EXPIRY_SECONDS);

  return { user: { ...user, isNewUser }, tokens: { accessToken, refreshToken } };
}

module.exports = { initiateOTP, verifyOTPAndLogin, refreshAccessToken, logout, socialLogin };
