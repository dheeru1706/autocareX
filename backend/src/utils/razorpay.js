'use strict';

const Razorpay = require('razorpay');
const crypto = require('crypto');
const logger = require('./logger');

let razorpayInstance = null;

function getRazorpay() {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

/**
 * Create a Razorpay order
 */
async function createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // convert to paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes,
    });
    logger.info('Razorpay order created', { orderId: order.id, amount });
    return order;
  } catch (err) {
    logger.error('Razorpay order creation failed', { error: err.message, error_description: err.error?.description });
    throw new Error(err.error?.description || 'Payment order creation failed');
  }
}

/**
 * Verify Razorpay payment signature
 */
function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(signature, 'hex')
  );

  logger.debug('Payment signature verification', { orderId, isValid });
  return isValid;
}

/**
 * Verify Razorpay webhook signature
 */
function verifyWebhookSignature(body, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

/**
 * Create a Razorpay subscription plan
 */
async function createPlan({ name, interval, period, amount, currency = 'INR' }) {
  try {
    const razorpay = getRazorpay();
    const plan = await razorpay.plans.create({
      period,
      interval,
      item: {
        name,
        amount: Math.round(amount * 100),
        currency,
        description: name,
      },
    });
    logger.info('Razorpay plan created', { planId: plan.id });
    return plan;
  } catch (err) {
    logger.error('Razorpay plan creation failed', { error: err.message });
    throw new Error('Plan creation failed');
  }
}

/**
 * Create a Razorpay subscription
 */
async function createSubscription({ planId, totalCount, customerId, notes = {}, startAt }) {
  try {
    const razorpay = getRazorpay();
    const payload = {
      plan_id: planId,
      total_count: totalCount,
      quantity: 1,
      notes,
    };
    if (customerId) payload.customer_id = customerId;
    if (startAt) payload.start_at = Math.floor(new Date(startAt).getTime() / 1000);

    const subscription = await razorpay.subscriptions.create(payload);
    logger.info('Razorpay subscription created', { subscriptionId: subscription.id });
    return subscription;
  } catch (err) {
    logger.error('Razorpay subscription creation failed', { error: err.message });
    throw new Error('Subscription creation failed');
  }
}

/**
 * Cancel a Razorpay subscription
 */
async function cancelSubscription(subscriptionId, cancelAtCycleEnd = true) {
  try {
    const razorpay = getRazorpay();
    const result = await razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
    logger.info('Razorpay subscription cancelled', { subscriptionId });
    return result;
  } catch (err) {
    logger.error('Razorpay subscription cancellation failed', { error: err.message });
    throw new Error('Subscription cancellation failed');
  }
}

/**
 * Fetch a payment from Razorpay
 */
async function fetchPayment(paymentId) {
  try {
    const razorpay = getRazorpay();
    return await razorpay.payments.fetch(paymentId);
  } catch (err) {
    logger.error('Razorpay payment fetch failed', { paymentId, error: err.message });
    throw new Error('Payment fetch failed');
  }
}

/**
 * Initiate a refund
 */
async function createRefund(paymentId, amount) {
  try {
    const razorpay = getRazorpay();
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(amount * 100),
    });
    logger.info('Razorpay refund initiated', { paymentId, refundId: refund.id, amount });
    return refund;
  } catch (err) {
    logger.error('Razorpay refund failed', { paymentId, error: err.message });
    throw new Error('Refund initiation failed');
  }
}

module.exports = {
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  createPlan,
  createSubscription,
  cancelSubscription,
  fetchPayment,
  createRefund,
};
