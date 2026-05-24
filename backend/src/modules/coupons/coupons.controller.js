'use strict';

const Joi = require('joi');
const { query, withTransaction } = require('../../config/database');
const { success, created, error, notFound, validationError } = require('../../utils/response');
const logger = require('../../utils/logger');

const validateCouponSchema = Joi.object({
  code: Joi.string().min(3).max(50).uppercase().required(),
  booking_id: Joi.string().uuid().optional(),
  order_amount: Joi.number().min(0).optional().default(0),
});

const createCouponSchema = Joi.object({
  code: Joi.string().min(3).max(50).uppercase().required(),
  name: Joi.string().min(3).max(200).required(),
  type: Joi.string().valid('percent', 'flat', 'free_service').required(),
  value: Joi.number().min(1).required(),
  min_order_value: Joi.number().min(0).optional().default(0),
  max_discount: Joi.number().optional().allow(null),
  usage_limit: Joi.number().integer().optional().allow(null),
  valid_from: Joi.date().iso().required(),
  valid_until: Joi.date().iso().greater(Joi.ref('valid_from')).required(),
  applicable_services: Joi.array().items(Joi.string().uuid()).optional().default([]),
  user_restriction: Joi.string().valid('all', 'new', 'premium').optional().default('all'),
});

/**
 * Validate and calculate coupon discount (without applying)
 */
async function validateCoupon(req, res) {
  const { error: validErr, value } = validateCouponSchema.validate(req.body);
  if (validErr) return validationError(res, validErr.details.map((d) => d.message));

  try {
    const couponResult = await query(
      `SELECT * FROM coupons WHERE code = $1 AND is_active = true`,
      [value.code]
    );

    if (couponResult.rows.length === 0) {
      return error(res, 'Invalid or expired coupon code', 404);
    }

    const coupon = couponResult.rows[0];
    const now = new Date();

    // Check validity period
    if (now < new Date(coupon.valid_from) || now > new Date(coupon.valid_until)) {
      return error(res, 'Coupon has expired or is not yet active', 400);
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return error(res, 'Coupon usage limit reached', 400);
    }

    // Check user restriction
    if (coupon.user_restriction === 'new') {
      const bookingCount = await query(
        "SELECT COUNT(*) FROM bookings WHERE consumer_id = $1 AND status = 'completed'",
        [req.user.id]
      );
      if (parseInt(bookingCount.rows[0].count, 10) > 0) {
        return error(res, 'This coupon is only for new customers', 400);
      }
    }

    if (coupon.user_restriction === 'premium') {
      const hasSub = await query(
        "SELECT id FROM subscriptions WHERE user_id = $1 AND status = 'active' LIMIT 1",
        [req.user.id]
      );
      if (hasSub.rows.length === 0) {
        return error(res, 'This coupon is only for premium subscribers', 400);
      }
    }

    // Check minimum order value
    if (value.order_amount < coupon.min_order_value) {
      return error(res, `Minimum order value ₹${coupon.min_order_value} required`, 400);
    }

    // Check if user already used this coupon
    const alreadyUsed = await query(
      'SELECT id FROM coupon_usages WHERE coupon_id = $1 AND user_id = $2',
      [coupon.id, req.user.id]
    );
    if (alreadyUsed.rows.length > 0) {
      return error(res, 'You have already used this coupon', 400);
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percent') {
      discount = (value.order_amount * coupon.value) / 100;
      if (coupon.max_discount) {
        discount = Math.min(discount, coupon.max_discount);
      }
    } else if (coupon.type === 'flat') {
      discount = Math.min(coupon.value, value.order_amount);
    } else if (coupon.type === 'free_service') {
      discount = value.order_amount;
    }

    discount = Math.round(discount * 100) / 100;

    return success(res, {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
      },
      discount,
      final_amount: Math.max(0, value.order_amount - discount),
    });
  } catch (err) {
    logger.error('validateCoupon error', { error: err.message });
    return error(res, 'Failed to validate coupon');
  }
}

/**
 * Apply coupon to a booking (called internally or by booking service)
 */
async function applyCoupon(userId, couponCode, bookingId, orderAmount) {
  const couponResult = await query(
    'SELECT * FROM coupons WHERE code = $1 AND is_active = true',
    [couponCode.toUpperCase()]
  );

  if (couponResult.rows.length === 0) {
    throw Object.assign(new Error('Invalid coupon'), { status: 400 });
  }

  const coupon = couponResult.rows[0];

  // All validations...
  const now = new Date();
  if (now < new Date(coupon.valid_from) || now > new Date(coupon.valid_until)) {
    throw Object.assign(new Error('Coupon expired'), { status: 400 });
  }
  if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
    throw Object.assign(new Error('Coupon limit reached'), { status: 400 });
  }

  let discount = 0;
  if (coupon.type === 'percent') {
    discount = Math.min((orderAmount * coupon.value) / 100, coupon.max_discount || Infinity);
  } else if (coupon.type === 'flat') {
    discount = Math.min(coupon.value, orderAmount);
  } else {
    discount = orderAmount;
  }
  discount = Math.round(discount * 100) / 100;

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO coupon_usages (coupon_id, user_id, booking_id, discount_applied)
       VALUES ($1, $2, $3, $4)`,
      [coupon.id, userId, bookingId, discount]
    );
    await client.query(
      'UPDATE coupons SET used_count = used_count + 1 WHERE id = $1',
      [coupon.id]
    );
  });

  return { discount, couponId: coupon.id };
}

// Admin: create coupon
async function createCoupon(req, res) {
  const { error: validErr, value } = createCouponSchema.validate(req.body, { abortEarly: false });
  if (validErr) return validationError(res, validErr.details.map((d) => d.message));

  try {
    const result = await query(
      `INSERT INTO coupons
         (code, name, type, value, min_order_value, max_discount, usage_limit,
          valid_from, valid_until, applicable_services, user_restriction)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [value.code, value.name, value.type, value.value, value.min_order_value,
       value.max_discount, value.usage_limit, value.valid_from, value.valid_until,
       value.applicable_services, value.user_restriction]
    );
    return created(res, result.rows[0], 'Coupon created');
  } catch (err) {
    if (err.code === '23505') return error(res, 'Coupon code already exists', 409);
    return error(res, 'Failed to create coupon');
  }
}

async function getCoupons(req, res) {
  try {
    const result = await query(
      `SELECT * FROM coupons WHERE is_active = true AND valid_until > NOW()
       ORDER BY valid_until ASC`
    );
    return success(res, result.rows);
  } catch (err) {
    return error(res, 'Failed to fetch coupons');
  }
}

async function deactivateCoupon(req, res) {
  try {
    const result = await query(
      'UPDATE coupons SET is_active = false WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rowCount === 0) return notFound(res, 'Coupon not found');
    return success(res, null, 'Coupon deactivated');
  } catch (err) {
    return error(res, 'Failed to deactivate coupon');
  }
}

module.exports = { validateCoupon, applyCoupon, createCoupon, getCoupons, deactivateCoupon };
