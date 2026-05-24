'use strict';

const Joi = require('joi');
const { query, withTransaction } = require('../../config/database');
const { success, error, created, notFound, validationError, paginated, getPaginationParams } = require('../../utils/response');
const logger = require('../../utils/logger');

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional().allow('', null),
  language: Joi.string().valid('en', 'hi', 'ta', 'te', 'kn', 'ml').optional(),
});

const addressSchema = Joi.object({
  label: Joi.string().max(50).optional().default('Home'),
  address_line1: Joi.string().min(5).max(255).required(),
  address_line2: Joi.string().max(255).optional().allow('', null),
  city: Joi.string().max(100).required(),
  state: Joi.string().max(100).required(),
  pincode: Joi.string().pattern(/^\d{6}$/).required(),
  lat: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional(),
  is_default: Joi.boolean().optional().default(false),
});

async function getProfile(req, res) {
  try {
    const result = await query(
      `SELECT u.id, u.phone, u.email, u.name, u.avatar_url, u.role, u.kyc_status,
              u.wallet_balance, u.referral_code, u.language, u.created_at,
              COUNT(v.id)::int AS vehicle_count,
              COUNT(b.id)::int AS booking_count
       FROM users u
       LEFT JOIN vehicles v ON v.user_id = u.id AND v.is_active = true
       LEFT JOIN bookings b ON b.consumer_id = u.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [req.user.id]
    );

    if (result.rows.length === 0) return notFound(res, 'User not found');
    return success(res, result.rows[0]);
  } catch (err) {
    logger.error('getProfile error', { userId: req.user.id, error: err.message });
    return error(res, 'Failed to fetch profile');
  }
}

async function updateProfile(req, res) {
  const { error: validErr, value } = updateProfileSchema.validate(req.body);
  if (validErr) return validationError(res, validErr.details.map((d) => d.message));

  try {
    const updates = [];
    const params = [];
    let idx = 1;

    if (value.name !== undefined) { updates.push(`name = $${idx++}`); params.push(value.name); }
    if (value.email !== undefined) { updates.push(`email = $${idx++}`); params.push(value.email || null); }
    if (value.language !== undefined) { updates.push(`language = $${idx++}`); params.push(value.language); }

    // Handle avatar upload from upload middleware
    if (req.file?.location) {
      updates.push(`avatar_url = $${idx++}`);
      params.push(req.file.location);
    }

    if (updates.length === 0) return error(res, 'No fields to update', 400);

    params.push(req.user.id);
    const result = await query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING id, phone, email, name, avatar_url, role, language`,
      params
    );

    return success(res, result.rows[0], 'Profile updated');
  } catch (err) {
    if (err.code === '23505') return error(res, 'Email already in use', 409);
    logger.error('updateProfile error', { userId: req.user.id, error: err.message });
    return error(res, 'Failed to update profile');
  }
}

async function getAddresses(req, res) {
  try {
    const result = await query(
      'SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );
    return success(res, result.rows);
  } catch (err) {
    return error(res, 'Failed to fetch addresses');
  }
}

async function addAddress(req, res) {
  const { error: validErr, value } = addressSchema.validate(req.body);
  if (validErr) return validationError(res, validErr.details.map((d) => d.message));

  try {
    const result = await withTransaction(async (client) => {
      if (value.is_default) {
        await client.query(
          'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
          [req.user.id]
        );
      }
      return client.query(
        `INSERT INTO user_addresses (user_id, label, address_line1, address_line2, city, state, pincode, lat, lng, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [req.user.id, value.label, value.address_line1, value.address_line2, value.city, value.state, value.pincode, value.lat, value.lng, value.is_default]
      );
    });

    return created(res, result.rows[0], 'Address added');
  } catch (err) {
    logger.error('addAddress error', { userId: req.user.id, error: err.message });
    return error(res, 'Failed to add address');
  }
}

async function deleteAddress(req, res) {
  const { id } = req.params;

  try {
    const result = await query(
      'DELETE FROM user_addresses WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rowCount === 0) return notFound(res, 'Address not found');
    return success(res, null, 'Address deleted');
  } catch (err) {
    return error(res, 'Failed to delete address');
  }
}

async function setDefaultAddress(req, res) {
  const { id } = req.params;

  try {
    await withTransaction(async (client) => {
      await client.query(
        'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
        [req.user.id]
      );
      const result = await client.query(
        'UPDATE user_addresses SET is_default = true WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, req.user.id]
      );
      if (result.rowCount === 0) throw Object.assign(new Error('Address not found'), { status: 404 });
      return result;
    });
    return success(res, null, 'Default address updated');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
}

async function getWallet(req, res) {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);

    const [balanceResult, txResult, countResult] = await Promise.all([
      query('SELECT wallet_balance FROM users WHERE id = $1', [req.user.id]),
      query(
        `SELECT * FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      ),
      query('SELECT COUNT(*) FROM wallet_transactions WHERE user_id = $1', [req.user.id]),
    ]);

    return paginated(
      res,
      {
        balance: parseFloat(balanceResult.rows[0]?.wallet_balance || 0),
        transactions: txResult.rows,
      },
      { page, limit, total: parseInt(countResult.rows[0].count, 10) }
    );
  } catch (err) {
    return error(res, 'Failed to fetch wallet');
  }
}

async function getReferral(req, res) {
  try {
    const result = await query(
      `SELECT u.referral_code,
              COUNT(r.id)::int AS total_referrals,
              SUM(CASE WHEN r.status = 'rewarded' THEN r.referrer_reward ELSE 0 END) AS total_earned,
              COALESCE(
                json_agg(
                  json_build_object(
                    'name', ru.name,
                    'phone', regexp_replace(ru.phone, '\\d{4}$', '****'),
                    'status', r.status,
                    'reward', r.referrer_reward,
                    'date', r.created_at
                  ) ORDER BY r.created_at DESC
                ) FILTER (WHERE r.id IS NOT NULL), '[]'
              ) AS referrals
       FROM users u
       LEFT JOIN referrals r ON r.referrer_id = u.id
       LEFT JOIN users ru ON ru.id = r.referee_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [req.user.id]
    );

    if (result.rows.length === 0) return notFound(res);

    const referralLink = `${process.env.APP_URL || 'https://autocarex.in'}/join?ref=${result.rows[0].referral_code}`;

    return success(res, { ...result.rows[0], referral_link: referralLink });
  } catch (err) {
    logger.error('getReferral error', { userId: req.user.id, error: err.message });
    return error(res, 'Failed to fetch referral info');
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  deleteAddress,
  setDefaultAddress,
  getWallet,
  getReferral,
};
