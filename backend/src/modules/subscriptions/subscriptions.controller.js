'use strict';

const Joi = require('joi');
const { query, withTransaction } = require('../../config/database');
const { createSubscription, cancelSubscription } = require('../../utils/razorpay');
const { success, created, error, notFound, validationError } = require('../../utils/response');
const { notifyUser } = require('../../utils/notifications');
const logger = require('../../utils/logger');
const moment = require('moment-timezone');

const subscribeSchema = Joi.object({
  plan_id: Joi.string().uuid().required(),
  vehicle_id: Joi.string().uuid().required(),
  auto_renew: Joi.boolean().optional().default(true),
});

async function getPlans(req, res) {
  try {
    const result = await query(
      `SELECT id, name, description, plan_type, interval, price, services_per_month,
              includes, vehicle_types
       FROM subscription_plans
       WHERE is_active = true
       ORDER BY price ASC`
    );
    return success(res, result.rows);
  } catch (err) {
    return error(res, 'Failed to fetch plans');
  }
}

async function subscribe(req, res) {
  const { error: validErr, value } = subscribeSchema.validate(req.body);
  if (validErr) return validationError(res, validErr.details.map((d) => d.message));

  try {
    // Fetch plan
    const planResult = await query(
      'SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true',
      [value.plan_id]
    );
    if (planResult.rows.length === 0) return notFound(res, 'Plan not found');

    const plan = planResult.rows[0];

    // Verify vehicle belongs to user
    const vehicleResult = await query(
      'SELECT id, vehicle_type FROM vehicles WHERE id = $1 AND user_id = $2 AND is_active = true',
      [value.vehicle_id, req.user.id]
    );
    if (vehicleResult.rows.length === 0) return notFound(res, 'Vehicle not found');

    const vehicle = vehicleResult.rows[0];

    // Check vehicle type compatibility
    if (plan.vehicle_types.length > 0 && !plan.vehicle_types.includes(vehicle.vehicle_type)) {
      return error(res, `This plan is not available for ${vehicle.vehicle_type} vehicles`, 400);
    }

    // Check for existing active subscription for this vehicle
    const existingResult = await query(
      "SELECT id FROM subscriptions WHERE user_id = $1 AND vehicle_id = $2 AND status = 'active'",
      [req.user.id, value.vehicle_id]
    );
    if (existingResult.rows.length > 0) {
      return error(res, 'An active subscription already exists for this vehicle', 409);
    }

    // Calculate dates based on plan interval
    const intervalMap = { monthly: 1, quarterly: 3, yearly: 12 };
    const months = intervalMap[plan.interval] || 1;
    const startDate = moment().tz('Asia/Kolkata').toDate();
    const endDate = moment().tz('Asia/Kolkata').add(months, 'months').toDate();
    const nextBillingDate = endDate;

    // Create Razorpay subscription if plan has razorpay_plan_id
    let razorpaySubscription = null;
    if (plan.razorpay_plan_id) {
      const intervalCountMap = { monthly: 1, quarterly: 3, yearly: 12 };
      razorpaySubscription = await createSubscription({
        planId: plan.razorpay_plan_id,
        totalCount: 12, // 1 year of billing cycles
        notes: { user_id: req.user.id, vehicle_id: value.vehicle_id, plan_id: value.plan_id },
      });
    }

    const subscription = await withTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO subscriptions
           (user_id, plan_id, vehicle_id, status, start_date, end_date, next_billing_date,
            razorpay_subscription_id, services_remaining, auto_renew)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          req.user.id, value.plan_id, value.vehicle_id,
          razorpaySubscription ? 'active' : 'active',
          startDate, endDate, nextBillingDate,
          razorpaySubscription?.id || null,
          plan.services_per_month,
          value.auto_renew,
        ]
      );

      // Deduct wallet if no Razorpay subscription (manual payment)
      if (!razorpaySubscription) {
        const userResult = await client.query(
          'SELECT wallet_balance FROM users WHERE id = $1',
          [req.user.id]
        );
        const balance = parseFloat(userResult.rows[0].wallet_balance);
        if (balance < plan.price) {
          throw Object.assign(new Error('Insufficient wallet balance'), { status: 400 });
        }

        await client.query(
          'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
          [plan.price, req.user.id]
        );

        await client.query(
          `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, reference_type, reference_id, description)
           VALUES ($1, 'debit', $2, $3, 'subscription', $4, $5)`,
          [req.user.id, plan.price, balance - plan.price, result.rows[0].id, `Subscription: ${plan.name}`]
        );
      }

      return result.rows[0];
    });

    await notifyUser(req.user.id, 'Subscription Activated!', `Your ${plan.name} plan is now active.`, 'subscription');

    return created(res, {
      subscription,
      plan: { name: plan.name, price: plan.price, services_per_month: plan.services_per_month },
      razorpay_subscription_id: razorpaySubscription?.id,
      payment_link: razorpaySubscription?.short_url,
    }, 'Subscription created successfully');
  } catch (err) {
    logger.error('subscribe error', { userId: req.user.id, error: err.message });
    return error(res, err.message, err.status || 500);
  }
}

async function getMySubscription(req, res) {
  try {
    const result = await query(
      `SELECT s.*, sp.name AS plan_name, sp.description, sp.price, sp.services_per_month,
              sp.includes, sp.plan_type, sp.interval,
              v.make, v.model, v.registration_number, v.vehicle_type
       FROM subscriptions s
       JOIN subscription_plans sp ON sp.id = s.plan_id
       JOIN vehicles v ON v.id = s.vehicle_id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );
    return success(res, result.rows);
  } catch (err) {
    return error(res, 'Failed to fetch subscriptions');
  }
}

async function pauseSubscription(req, res) {
  try {
    const result = await query(
      "UPDATE subscriptions SET status = 'paused', updated_at = NOW() WHERE id = $1 AND user_id = $2 AND status = 'active' RETURNING id",
      [req.params.id, req.user.id]
    );
    if (result.rowCount === 0) return notFound(res, 'Active subscription not found');

    await notifyUser(req.user.id, 'Subscription Paused', 'Your subscription has been paused.', 'subscription');
    return success(res, null, 'Subscription paused');
  } catch (err) {
    return error(res, 'Failed to pause subscription');
  }
}

async function cancelSubscriptionHandler(req, res) {
  try {
    const result = await query(
      "SELECT * FROM subscriptions WHERE id = $1 AND user_id = $2 AND status IN ('active', 'paused')",
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return notFound(res, 'Subscription not found');

    const sub = result.rows[0];

    if (sub.razorpay_subscription_id) {
      await cancelSubscription(sub.razorpay_subscription_id, true);
    }

    await query(
      "UPDATE subscriptions SET status = 'cancelled', auto_renew = false, updated_at = NOW() WHERE id = $1",
      [sub.id]
    );

    await notifyUser(req.user.id, 'Subscription Cancelled', 'Your subscription has been cancelled.', 'subscription');
    return success(res, null, 'Subscription cancelled');
  } catch (err) {
    logger.error('cancelSubscription error', { error: err.message });
    return error(res, err.message || 'Failed to cancel subscription');
  }
}

module.exports = { getPlans, subscribe, getMySubscription, pauseSubscription, cancelSubscriptionHandler };
