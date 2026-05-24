'use strict';

const Joi = require('joi');
const { query } = require('../../config/database');
const { createBooking, cancelBooking, rateBooking, getPartnerBookings } = require('./bookings.service');
const {
  success, created, error, notFound, validationError, paginated, getPaginationParams,
} = require('../../utils/response');
const logger = require('../../utils/logger');

const createBookingSchema = Joi.object({
  vehicle_id: Joi.string().uuid().required(),
  address_id: Joi.string().uuid().required(),
  service_package_id: Joi.string().uuid().required(),
  scheduled_at: Joi.date().iso().min('now').required().messages({
    'date.min': 'Scheduled time must be in the future',
  }),
  notes: Joi.string().max(500).optional().allow('', null),
  coupon_code: Joi.string().max(50).optional().allow('', null),
});

const cancelSchema = Joi.object({
  reason: Joi.string().min(5).max(300).required(),
});

const rateSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  review: Joi.string().max(1000).optional().allow('', null),
});

async function createBookingHandler(req, res) {
  const { error: validErr, value } = createBookingSchema.validate(req.body);
  if (validErr) return validationError(res, validErr.details.map((d) => d.message));

  try {
    const booking = await createBooking({
      consumerId: req.user.id,
      vehicleId: value.vehicle_id,
      addressId: value.address_id,
      servicePackageId: value.service_package_id,
      scheduledAt: value.scheduled_at,
      notes: value.notes,
    });

    return created(res, booking, 'Booking created successfully');
  } catch (err) {
    logger.error('createBooking error', { userId: req.user.id, error: err.message });
    return error(res, err.message, err.status || 500);
  }
}

async function getBookings(req, res) {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { status } = req.query;

  try {
    const conditions = ['b.consumer_id = $1'];
    const params = [req.user.id];
    let idx = 2;

    if (status) {
      conditions.push(`b.status = $${idx++}`);
      params.push(status);
    }

    const whereClause = conditions.join(' AND ');

    const [bookingsResult, countResult] = await Promise.all([
      query(
        `SELECT b.id, b.booking_number, b.status, b.scheduled_at, b.rating, b.otp,
                sp.name AS service_name, sp.duration_mins, sp.discounted_price AS price,
                sc.name AS category_name, sc.icon_url AS category_icon,
                v.make, v.model, v.registration_number,
                fp.business_name AS partner_name,
                st.name AS staff_name
         FROM bookings b
         JOIN service_packages sp ON sp.id = b.service_package_id
         JOIN service_categories sc ON sc.id = sp.category_id
         JOIN vehicles v ON v.id = b.vehicle_id
         LEFT JOIN franchise_partners fp ON fp.id = b.partner_id
         LEFT JOIN staff st ON st.id = b.staff_id
         WHERE ${whereClause}
         ORDER BY b.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*) FROM bookings b WHERE ${whereClause}`, params),
    ]);

    return paginated(res, bookingsResult.rows, {
      page, limit, total: parseInt(countResult.rows[0].count, 10),
    });
  } catch (err) {
    return error(res, 'Failed to fetch bookings');
  }
}

async function getBooking(req, res) {
  try {
    const result = await query(
      `SELECT b.*,
              sp.name AS service_name, sp.description AS service_description,
              sp.duration_mins, sp.base_price, sp.discounted_price,
              sp.includes, sp.excludes,
              sc.name AS category_name, sc.icon_url AS category_icon,
              v.make, v.model, v.year, v.registration_number, v.fuel_type, v.vehicle_type, v.color,
              fp.business_name AS partner_name, fp.rating AS partner_rating,
              st.name AS staff_name, st.phone AS staff_phone, st.rating AS staff_rating,
              ua.address_line1, ua.address_line2, ua.city, ua.state, ua.pincode, ua.lat, ua.lng
       FROM bookings b
       JOIN service_packages sp ON sp.id = b.service_package_id
       JOIN service_categories sc ON sc.id = sp.category_id
       JOIN vehicles v ON v.id = b.vehicle_id
       LEFT JOIN franchise_partners fp ON fp.id = b.partner_id
       LEFT JOIN staff st ON st.id = b.staff_id
       LEFT JOIN user_addresses ua ON ua.id = b.address_id
       WHERE b.id = $1 AND b.consumer_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) return notFound(res, 'Booking not found');

    // Fetch payment
    const payment = await query(
      'SELECT method, final_amount, status FROM payments WHERE booking_id = $1 AND status = $2 LIMIT 1',
      [req.params.id, 'success']
    );

    return success(res, {
      ...result.rows[0],
      payment: payment.rows[0] || null,
    });
  } catch (err) {
    return error(res, 'Failed to fetch booking');
  }
}

async function cancelBookingHandler(req, res) {
  const { error: validErr, value } = cancelSchema.validate(req.body);
  if (validErr) return validationError(res, validErr.details.map((d) => d.message));

  try {
    const result = await cancelBooking(req.params.id, req.user.id, value.reason);
    return success(res, result, result.refunded ? 'Booking cancelled and refund issued' : 'Booking cancelled');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
}

async function getBookingTimeline(req, res) {
  try {
    const booking = await query(
      'SELECT id FROM bookings WHERE id = $1 AND consumer_id = $2',
      [req.params.id, req.user.id]
    );
    if (booking.rows.length === 0) return notFound(res, 'Booking not found');

    const timeline = await query(
      `SELECT bt.*, u.name AS created_by_name
       FROM booking_timeline bt
       LEFT JOIN users u ON u.id = bt.created_by
       WHERE bt.booking_id = $1
       ORDER BY bt.created_at ASC`,
      [req.params.id]
    );

    return success(res, timeline.rows);
  } catch (err) {
    return error(res, 'Failed to fetch timeline');
  }
}

async function rateBookingHandler(req, res) {
  const { error: validErr, value } = rateSchema.validate(req.body);
  if (validErr) return validationError(res, validErr.details.map((d) => d.message));

  try {
    const result = await rateBooking(req.params.id, req.user.id, value);
    return success(res, result, 'Thank you for your review!');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
}

// Partner: Update booking status
async function updateBookingStatus(req, res) {
  const { status, note, lat, lng } = req.body;
  const validTransitions = {
    confirmed: ['assigned'],
    assigned: ['in_progress'],
    in_progress: ['completed'],
  };

  try {
    // Verify partner owns this booking
    const bookingResult = await query(
      `SELECT b.*, fp.id AS fp_id FROM bookings b
       JOIN franchise_partners fp ON fp.id = b.partner_id
       WHERE b.id = $1 AND fp.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (bookingResult.rows.length === 0) return notFound(res, 'Booking not found');
    const booking = bookingResult.rows[0];

    const allowed = validTransitions[booking.status] || [];
    if (!allowed.includes(status)) {
      return error(res, `Cannot transition from '${booking.status}' to '${status}'`, 400);
    }

    // If completing, verify OTP
    if (status === 'completed' && req.body.otp !== booking.otp) {
      return error(res, 'Invalid service OTP', 400);
    }

    await query(
      `UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, booking.id]
    );

    await query(
      `INSERT INTO booking_timeline (booking_id, status, note, created_by, lat, lng)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [booking.id, status, note || null, req.user.id, lat || null, lng || null]
    );

    // Assign staff if assigning
    if (status === 'assigned' && req.body.staff_id) {
      await query(
        `UPDATE bookings SET staff_id = $1 WHERE id = $2`,
        [req.body.staff_id, booking.id]
      );
    }

    // Notify consumer
    await require('../../utils/notifications').notifyBookingStatus(
      booking.id, booking.consumer_id, booking.partner_id, status
    );

    return success(res, { status }, 'Status updated');
  } catch (err) {
    logger.error('updateBookingStatus error', { error: err.message });
    return error(res, 'Failed to update status');
  }
}

module.exports = {
  createBookingHandler,
  getBookings,
  getBooking,
  cancelBookingHandler,
  getBookingTimeline,
  rateBookingHandler,
  updateBookingStatus,
};
