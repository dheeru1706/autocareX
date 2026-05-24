'use strict';

const crypto = require('crypto');
const { query, withTransaction } = require('../../config/database');
const { publish } = require('../../config/redis');
const { notifyBookingStatus } = require('../../utils/notifications');
const logger = require('../../utils/logger');

/**
 * Generate a unique booking number
 */
function generateBookingNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `ACX${timestamp}${random}`;
}

/**
 * Generate a 4-digit OTP for service verification
 */
function generateServiceOTP() {
  return crypto.randomInt(1000, 9999).toString();
}

/**
 * Find the best available partner for a booking based on location and availability
 */
async function findBestPartner(city, vehicleType, scheduledAt) {
  const result = await query(
    `SELECT fp.id, fp.business_name, fp.rating,
            COUNT(s.id) AS available_staff_count
     FROM franchise_partners fp
     JOIN staff s ON s.partner_id = fp.id AND s.is_available = true AND s.is_active = true
     WHERE fp.city = $1
       AND fp.is_active = true
       AND fp.kyc_status = 'approved'
     GROUP BY fp.id, fp.business_name, fp.rating
     HAVING COUNT(s.id) > 0
     ORDER BY fp.rating DESC, available_staff_count DESC
     LIMIT 1`,
    [city]
  );

  return result.rows[0] || null;
}

/**
 * Find available staff for a partner at a given time slot
 */
async function findAvailableStaff(partnerId, scheduledAt, durationMins) {
  const slotEnd = new Date(new Date(scheduledAt).getTime() + durationMins * 60000).toISOString();

  const result = await query(
    `SELECT s.id, s.name, s.rating, s.jobs_completed
     FROM staff s
     WHERE s.partner_id = $1
       AND s.is_available = true
       AND s.is_active = true
       AND s.id NOT IN (
         SELECT b.staff_id FROM bookings b
         WHERE b.staff_id IS NOT NULL
           AND b.status NOT IN ('cancelled', 'completed', 'refunded')
           AND b.slot_start < $3
           AND b.slot_end > $2
       )
     ORDER BY s.rating DESC, s.jobs_completed DESC
     LIMIT 1`,
    [partnerId, scheduledAt, slotEnd]
  );

  return result.rows[0] || null;
}

/**
 * Check slot availability for a partner
 */
async function checkSlotAvailability(partnerId, scheduledAt, durationMins) {
  const slotEnd = new Date(new Date(scheduledAt).getTime() + durationMins * 60000).toISOString();

  const result = await query(
    `SELECT COUNT(*) AS concurrent_bookings,
            (SELECT COUNT(*) FROM staff WHERE partner_id = $1 AND is_available = true AND is_active = true) AS available_staff
     FROM bookings
     WHERE partner_id = $1
       AND status NOT IN ('cancelled', 'completed', 'refunded')
       AND slot_start < $3
       AND slot_end > $2`,
    [partnerId, scheduledAt, slotEnd]
  );

  const { concurrent_bookings, available_staff } = result.rows[0];
  return parseInt(concurrent_bookings, 10) < parseInt(available_staff, 10);
}

/**
 * Create a new booking
 */
async function createBooking({ consumerId, vehicleId, addressId, servicePackageId, scheduledAt, notes }) {
  // Fetch package details
  const packageResult = await query(
    `SELECT sp.*, sc.name AS category_name
     FROM service_packages sp
     JOIN service_categories sc ON sc.id = sp.category_id
     WHERE sp.id = $1 AND sp.is_active = true`,
    [servicePackageId]
  );

  if (packageResult.rows.length === 0) {
    throw Object.assign(new Error('Service package not found or unavailable'), { status: 404 });
  }

  const pkg = packageResult.rows[0];

  // Fetch address city for partner matching
  const addressResult = await query(
    'SELECT city, state, address_line1, lat, lng FROM user_addresses WHERE id = $1 AND user_id = $2',
    [addressId, consumerId]
  );

  if (addressResult.rows.length === 0) {
    throw Object.assign(new Error('Address not found'), { status: 404 });
  }

  const address = addressResult.rows[0];

  // Fetch vehicle to validate
  const vehicleResult = await query(
    'SELECT id, vehicle_type, make, model FROM vehicles WHERE id = $1 AND user_id = $2 AND is_active = true',
    [vehicleId, consumerId]
  );

  if (vehicleResult.rows.length === 0) {
    throw Object.assign(new Error('Vehicle not found'), { status: 404 });
  }

  const vehicle = vehicleResult.rows[0];

  // Validate vehicle type compatibility
  if (pkg.vehicle_types.length > 0 && !pkg.vehicle_types.includes(vehicle.vehicle_type)) {
    throw Object.assign(
      new Error(`This service is not available for ${vehicle.vehicle_type} vehicles`),
      { status: 400 }
    );
  }

  const slotStart = new Date(scheduledAt);
  const slotEnd = new Date(slotStart.getTime() + pkg.duration_mins * 60000);

  // Find best partner
  const partner = await findBestPartner(address.city, vehicle.vehicle_type, scheduledAt);

  const booking = await withTransaction(async (client) => {
    const bookingNumber = generateBookingNumber();
    const otp = generateServiceOTP();

    // Create booking
    const bookingResult = await client.query(
      `INSERT INTO bookings (booking_number, consumer_id, partner_id, vehicle_id, address_id,
                              service_package_id, scheduled_at, slot_start, slot_end, otp, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        bookingNumber, consumerId, partner?.id || null, vehicleId, addressId,
        servicePackageId, scheduledAt, slotStart, slotEnd, otp, notes || null,
      ]
    );

    const newBooking = bookingResult.rows[0];

    // Add timeline entry
    await client.query(
      `INSERT INTO booking_timeline (booking_id, status, note, created_by)
       VALUES ($1, 'pending', 'Booking created', $2)`,
      [newBooking.id, consumerId]
    );

    // If partner found, auto-confirm
    if (partner) {
      await client.query(
        `UPDATE bookings SET status = 'confirmed' WHERE id = $1`,
        [newBooking.id]
      );
      await client.query(
        `INSERT INTO booking_timeline (booking_id, status, note, created_by)
         VALUES ($1, 'confirmed', 'Partner auto-assigned', $2)`,
        [newBooking.id, consumerId]
      );
      newBooking.status = 'confirmed';
    }

    // Create chat conversation
    if (partner) {
      await client.query(
        `INSERT INTO chat_conversations (booking_id, consumer_id, partner_id)
         VALUES ($1, $2, $3) ON CONFLICT (booking_id) DO NOTHING`,
        [newBooking.id, consumerId, partner.id]
      );
    }

    return newBooking;
  });

  // Send notification
  await notifyBookingStatus(booking.id, consumerId, partner?.id, booking.status);

  // Publish real-time event
  await publish('booking:created', {
    bookingId: booking.id,
    partnerId: partner?.id,
    consumerId,
    status: booking.status,
  });

  return {
    ...booking,
    package: { name: pkg.name, duration_mins: pkg.duration_mins, price: pkg.discounted_price || pkg.base_price },
    partner: partner ? { id: partner.id, name: partner.business_name } : null,
    otp: booking.otp, // return OTP to consumer
  };
}

/**
 * Cancel a booking
 */
async function cancelBooking(bookingId, userId, reason) {
  const result = await query(
    'SELECT * FROM bookings WHERE id = $1 AND consumer_id = $2',
    [bookingId, userId]
  );

  if (result.rows.length === 0) {
    throw Object.assign(new Error('Booking not found'), { status: 404 });
  }

  const booking = result.rows[0];
  const cancellableStatuses = ['pending', 'confirmed'];

  if (!cancellableStatuses.includes(booking.status)) {
    throw Object.assign(
      new Error(`Cannot cancel booking in '${booking.status}' status`),
      { status: 400 }
    );
  }

  // Check cancellation policy (no-penalty if > 2 hours before)
  const hoursUntilService = (new Date(booking.scheduled_at) - new Date()) / 3600000;
  const lateCancellation = hoursUntilService < 2;

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE bookings
       SET status = 'cancelled', cancellation_reason = $1, updated_at = NOW()
       WHERE id = $2`,
      [reason, bookingId]
    );

    await client.query(
      `INSERT INTO booking_timeline (booking_id, status, note, created_by)
       VALUES ($1, 'cancelled', $2, $3)`,
      [bookingId, `Cancelled by consumer: ${reason}`, userId]
    );
  });

  // Process refund if payment was made
  const payment = await query(
    "SELECT * FROM payments WHERE booking_id = $1 AND status = 'success' LIMIT 1",
    [bookingId]
  );

  let refunded = false;
  if (payment.rows.length > 0 && !lateCancellation) {
    // Full refund to wallet
    await withTransaction(async (client) => {
      const pmnt = payment.rows[0];
      await client.query(
        `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
        [pmnt.final_amount, userId]
      );
      await client.query(
        `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, reference_type, reference_id, description)
         SELECT $1, 'credit', $2, wallet_balance + $2, 'booking_refund', $3, 'Refund for cancelled booking'
         FROM users WHERE id = $1`,
        [userId, pmnt.final_amount, bookingId]
      );
      await client.query(
        `UPDATE bookings SET status = 'refunded' WHERE id = $1`,
        [bookingId]
      );
      await client.query(
        `UPDATE payments SET status = 'refunded' WHERE id = $1`,
        [pmnt.id]
      );
    });
    refunded = true;
  }

  await publish('booking:cancelled', { bookingId, partnerId: booking.partner_id });

  return { cancelled: true, refunded, lateCancellation };
}

/**
 * Submit booking rating/review
 */
async function rateBooking(bookingId, userId, { rating, review }) {
  const result = await query(
    "SELECT * FROM bookings WHERE id = $1 AND consumer_id = $2 AND status = 'completed'",
    [bookingId, userId]
  );

  if (result.rows.length === 0) {
    throw Object.assign(new Error('Booking not found or not completed'), { status: 404 });
  }

  const booking = result.rows[0];

  if (booking.rating) {
    throw Object.assign(new Error('Booking already rated'), { status: 409 });
  }

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE bookings SET rating = $1, review = $2, updated_at = NOW() WHERE id = $3`,
      [rating, review || null, bookingId]
    );

    // Insert review record
    if (booking.partner_id) {
      await client.query(
        `INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, reviewee_type, rating, comment)
         VALUES ($1, $2, $3, 'partner', $4, $5)
         ON CONFLICT (booking_id, reviewer_id, reviewee_type) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment`,
        [bookingId, userId, booking.partner_id, rating, review || null]
      );

      // Update partner average rating
      await client.query(
        `UPDATE franchise_partners SET rating = (
           SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE reviewee_id = $1 AND reviewee_type = 'partner'
         ) WHERE id = $1`,
        [booking.partner_id]
      );
    }
  });

  return { rated: true };
}

/**
 * Get bookings for partner with filters
 */
async function getPartnerBookings(partnerId, filters) {
  const { status, date, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;
  const conditions = ['b.partner_id = $1'];
  const params = [partnerId];
  let idx = 2;

  if (status) { conditions.push(`b.status = $${idx++}`); params.push(status); }
  if (date) {
    conditions.push(`DATE(b.scheduled_at) = $${idx++}`);
    params.push(date);
  }

  const whereClause = conditions.join(' AND ');

  const [bookingsResult, countResult] = await Promise.all([
    query(
      `SELECT b.*, sp.name AS service_name, sp.duration_mins,
              v.make, v.model, v.registration_number, v.vehicle_type,
              u.name AS consumer_name, u.phone AS consumer_phone,
              st.name AS staff_name
       FROM bookings b
       JOIN service_packages sp ON sp.id = b.service_package_id
       JOIN vehicles v ON v.id = b.vehicle_id
       JOIN users u ON u.id = b.consumer_id
       LEFT JOIN staff st ON st.id = b.staff_id
       WHERE ${whereClause}
       ORDER BY b.scheduled_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    ),
    query(`SELECT COUNT(*) FROM bookings b WHERE ${whereClause}`, params),
  ]);

  return {
    bookings: bookingsResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
    page,
    limit,
  };
}

module.exports = {
  createBooking,
  cancelBooking,
  rateBooking,
  getPartnerBookings,
  findAvailableStaff,
  checkSlotAvailability,
};
