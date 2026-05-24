'use strict';

const Joi = require('joi');
const { query, withTransaction } = require('../../config/database');
const {
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  createRefund,
} = require('../../utils/razorpay');
const { success, created, error, notFound, validationError, paginated, getPaginationParams } = require('../../utils/response');
const { notifyUser } = require('../../utils/notifications');
const logger = require('../../utils/logger');

const GST_RATE = 0.18; // 18%

const createOrderSchema = Joi.object({
  booking_id: Joi.string().uuid().optional(),
  wallet_topup_amount: Joi.number().min(100).max(50000).optional(),
}).or('booking_id', 'wallet_topup_amount');

const verifySchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
  payment_id: Joi.string().uuid().required(),
});

async function createPaymentOrder(req, res) {
  const { error: validErr, value } = createOrderSchema.validate(req.body);
  if (validErr) return validationError(res, validErr.details.map((d) => d.message));

  try {
    let amount, bookingId, description;

    if (value.booking_id) {
      // Payment for a booking
      const bookingResult = await query(
        `SELECT b.*, sp.discounted_price, sp.base_price
         FROM bookings b
         JOIN service_packages sp ON sp.id = b.service_package_id
         WHERE b.id = $1 AND b.consumer_id = $2 AND b.status IN ('pending', 'confirmed')`,
        [value.booking_id, req.user.id]
      );

      if (bookingResult.rows.length === 0) {
        return notFound(res, 'Booking not found or not payable');
      }

      const booking = bookingResult.rows[0];
      const baseAmount = parseFloat(booking.discounted_price || booking.base_price);
      const gstAmount = Math.round(baseAmount * GST_RATE * 100) / 100;
      amount = baseAmount + gstAmount;
      bookingId = value.booking_id;
      description = `Payment for booking ${booking.booking_number}`;

      // Create payment record
      const paymentRecord = await query(
        `INSERT INTO payments (booking_id, user_id, amount, gst_amount, final_amount, method, status)
         VALUES ($1, $2, $3, $4, $5, 'razorpay', 'pending')
         RETURNING id`,
        [bookingId, req.user.id, baseAmount, gstAmount, amount]
      );

      const razorpayOrder = await createOrder({
        amount,
        receipt: `bk_${booking.booking_number}`,
        notes: {
          booking_id: bookingId,
          payment_id: paymentRecord.rows[0].id,
          user_id: req.user.id,
        },
      });

      await query(
        `UPDATE payments SET razorpay_order_id = $1 WHERE id = $2`,
        [razorpayOrder.id, paymentRecord.rows[0].id]
      );

      return created(res, {
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        payment_id: paymentRecord.rows[0].id,
        key: process.env.RAZORPAY_KEY_ID,
      });
    }

    if (value.wallet_topup_amount) {
      // Wallet top-up
      amount = value.wallet_topup_amount;

      const paymentRecord = await query(
        `INSERT INTO payments (user_id, amount, gst_amount, final_amount, method, status, metadata)
         VALUES ($1, $2, 0, $2, 'razorpay', 'pending', '{"type": "wallet_topup"}')
         RETURNING id`,
        [req.user.id, amount]
      );

      const razorpayOrder = await createOrder({
        amount,
        receipt: `wallet_${Date.now()}`,
        notes: {
          type: 'wallet_topup',
          payment_id: paymentRecord.rows[0].id,
          user_id: req.user.id,
        },
      });

      await query(
        `UPDATE payments SET razorpay_order_id = $1 WHERE id = $2`,
        [razorpayOrder.id, paymentRecord.rows[0].id]
      );

      return created(res, {
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        payment_id: paymentRecord.rows[0].id,
        key: process.env.RAZORPAY_KEY_ID,
      });
    }
  } catch (err) {
    logger.error('createPaymentOrder error', { userId: req.user.id, error: err.message });
    return error(res, err.message || 'Failed to create payment order');
  }
}

async function verifyPayment(req, res) {
  const { error: validErr, value } = verifySchema.validate(req.body);
  if (validErr) return validationError(res, validErr.details.map((d) => d.message));

  try {
    const isValid = verifyPaymentSignature({
      orderId: value.razorpay_order_id,
      paymentId: value.razorpay_payment_id,
      signature: value.razorpay_signature,
    });

    if (!isValid) {
      return error(res, 'Payment signature verification failed', 400);
    }

    // Fetch payment record
    const paymentResult = await query(
      'SELECT * FROM payments WHERE id = $1 AND user_id = $2 AND status = $3',
      [value.payment_id, req.user.id, 'pending']
    );

    if (paymentResult.rows.length === 0) {
      return notFound(res, 'Payment record not found');
    }

    const payment = paymentResult.rows[0];

    await withTransaction(async (client) => {
      // Update payment status
      await client.query(
        `UPDATE payments
         SET status = 'success', razorpay_payment_id = $1, razorpay_signature = $2
         WHERE id = $3`,
        [value.razorpay_payment_id, value.razorpay_signature, payment.id]
      );

      if (payment.booking_id) {
        // Confirm the booking as paid
        await client.query(
          `UPDATE bookings SET status = 'confirmed', updated_at = NOW() WHERE id = $1 AND status = 'pending'`,
          [payment.booking_id]
        );
      } else if (payment.metadata?.type === 'wallet_topup') {
        // Credit wallet
        await client.query(
          `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
          [payment.final_amount, req.user.id]
        );
        const newBalance = await client.query(
          'SELECT wallet_balance FROM users WHERE id = $1',
          [req.user.id]
        );
        await client.query(
          `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, reference_type, reference_id, description)
           VALUES ($1, 'credit', $2, $3, 'wallet_topup', $4, 'Wallet top-up via Razorpay')`,
          [req.user.id, payment.final_amount, newBalance.rows[0].wallet_balance, payment.id]
        );
      }
    });

    await notifyUser(req.user.id, 'Payment Successful', `Payment of ₹${payment.final_amount} received`, 'payment', {
      paymentId: payment.id,
    });

    return success(res, { verified: true, payment_id: payment.id }, 'Payment verified successfully');
  } catch (err) {
    logger.error('verifyPayment error', { userId: req.user.id, error: err.message });
    return error(res, 'Payment verification failed');
  }
}

async function handleWebhook(req, res) {
  try {
    const signature = req.headers['x-razorpay-signature'];

    if (!signature) {
      return error(res, 'Missing signature', 400);
    }

    // req.rawBody is set in app.js for webhook routes
    const isValid = verifyWebhookSignature(req.rawBody, signature);
    if (!isValid) {
      logger.warn('Invalid Razorpay webhook signature');
      return error(res, 'Invalid signature', 400);
    }

    const event = req.body;
    const eventType = event.event;

    logger.info('Razorpay webhook received', { event: eventType });

    switch (eventType) {
      case 'payment.captured': {
        const paymentEntity = event.payload.payment.entity;
        const paymentId = paymentEntity.notes?.payment_id;

        if (paymentId) {
          await query(
            `UPDATE payments SET status = 'success', razorpay_payment_id = $1 WHERE id = $2 AND status = 'pending'`,
            [paymentEntity.id, paymentId]
          );
        }
        break;
      }

      case 'payment.failed': {
        const paymentEntity = event.payload.payment.entity;
        const paymentId = paymentEntity.notes?.payment_id;

        if (paymentId) {
          await query(
            `UPDATE payments SET status = 'failed' WHERE id = $1`,
            [paymentId]
          );
        }
        break;
      }

      case 'subscription.charged': {
        const subscription = event.payload.subscription.entity;
        await query(
          `UPDATE subscriptions
           SET status = 'active', next_billing_date = NOW() + INTERVAL '1 month', services_remaining = services_remaining + (
             SELECT services_per_month FROM subscription_plans sp
             JOIN subscriptions s ON s.plan_id = sp.id
             WHERE s.razorpay_subscription_id = $1
           )
           WHERE razorpay_subscription_id = $1`,
          [subscription.id]
        );
        break;
      }

      case 'subscription.cancelled': {
        const subscription = event.payload.subscription.entity;
        await query(
          `UPDATE subscriptions SET status = 'cancelled', updated_at = NOW()
           WHERE razorpay_subscription_id = $1`,
          [subscription.id]
        );
        break;
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    logger.error('Webhook processing error', { error: err.message });
    return res.status(200).json({ received: true }); // Always 200 to Razorpay
  }
}

async function getPaymentHistory(req, res) {
  const { page, limit, offset } = getPaginationParams(req.query);

  try {
    const [payments, count] = await Promise.all([
      query(
        `SELECT p.*, b.booking_number
         FROM payments p
         LEFT JOIN bookings b ON b.id = p.booking_id
         WHERE p.user_id = $1
         ORDER BY p.created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      ),
      query('SELECT COUNT(*) FROM payments WHERE user_id = $1', [req.user.id]),
    ]);

    return paginated(res, payments.rows, {
      page, limit, total: parseInt(count.rows[0].count, 10),
    });
  } catch (err) {
    return error(res, 'Failed to fetch payment history');
  }
}

module.exports = {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
  getPaymentHistory,
};
