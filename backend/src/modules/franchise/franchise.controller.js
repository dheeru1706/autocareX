'use strict';

const Joi = require('joi');
const { query, withTransaction } = require('../../config/database');
const {
  success, created, error, notFound, validationError, paginated, getPaginationParams,
} = require('../../utils/response');
const { getPartnerBookings } = require('../bookings/bookings.service');
const logger = require('../../utils/logger');

const onboardingSchema = Joi.object({
  business_name: Joi.string().min(3).max(255).required(),
  gst_number: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional().allow('', null),
  pan_number: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional().allow('', null),
  city: Joi.string().min(2).max(100).required(),
  state: Joi.string().min(2).max(100).required(),
  bank_account: Joi.string().pattern(/^\d{9,18}$/).optional().allow('', null),
  ifsc: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).optional().allow('', null),
});

const staffSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  role: Joi.string().valid('technician', 'supervisor', 'driver').required(),
  skills: Joi.array().items(Joi.string()).optional().default([]),
});

async function onboardPartner(req, res) {
  const { error: validErr, value } = onboardingSchema.validate(req.body, { abortEarly: false });
  if (validErr) return validationError(res, validErr.details.map((d) => d.message));

  try {
    // Check if user already has a partner account
    const existing = await query(
      'SELECT id FROM franchise_partners WHERE user_id = $1',
      [req.user.id]
    );
    if (existing.rows.length > 0) {
      return error(res, 'Partner account already exists for this user', 409);
    }

    const logoUrl = req.file?.location || null;

    const result = await withTransaction(async (client) => {
      const partnerResult = await client.query(
        `INSERT INTO franchise_partners
           (user_id, business_name, gst_number, pan_number, city, state, bank_account, ifsc, logo_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [req.user.id, value.business_name, value.gst_number || null, value.pan_number || null,
         value.city, value.state, value.bank_account || null, value.ifsc || null, logoUrl]
      );

      // Update user role to partner
      await client.query(
        "UPDATE users SET role = 'partner' WHERE id = $1",
        [req.user.id]
      );

      return partnerResult;
    });

    return created(res, result.rows[0], 'Partner application submitted. KYC review pending.');
  } catch (err) {
    logger.error('onboardPartner error', { userId: req.user.id, error: err.message });
    return error(res, 'Failed to submit partner application');
  }
}

async function getPartnerProfile(req, res) {
  try {
    const result = await query(
      `SELECT fp.*, u.name AS owner_name, u.email, u.phone,
              COUNT(DISTINCT s.id)::int AS staff_count,
              COUNT(DISTINCT b.id)::int AS total_bookings,
              AVG(b.rating)::numeric(3,2) AS avg_rating
       FROM franchise_partners fp
       JOIN users u ON u.id = fp.user_id
       LEFT JOIN staff s ON s.partner_id = fp.id AND s.is_active = true
       LEFT JOIN bookings b ON b.partner_id = fp.id AND b.status = 'completed'
       WHERE fp.user_id = $1
       GROUP BY fp.id, u.name, u.email, u.phone`,
      [req.user.id]
    );

    if (result.rows.length === 0) return notFound(res, 'Partner profile not found');
    return success(res, result.rows[0]);
  } catch (err) {
    return error(res, 'Failed to fetch partner profile');
  }
}

async function updatePartnerProfile(req, res) {
  const schema = Joi.object({
    business_name: Joi.string().min(3).max(255).optional(),
    gst_number: Joi.string().optional().allow('', null),
    bank_account: Joi.string().optional().allow('', null),
    ifsc: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).optional().allow('', null),
    territory_polygon: Joi.object().optional().allow(null),
  });

  const { error: validErr, value } = schema.validate(req.body, { abortEarly: false });
  if (validErr) return validationError(res, validErr.details.map((d) => d.message));

  try {
    const updates = [];
    const params = [];
    let idx = 1;

    const fields = ['business_name', 'gst_number', 'bank_account', 'ifsc', 'territory_polygon'];
    for (const f of fields) {
      if (value[f] !== undefined) {
        updates.push(`${f} = $${idx++}`);
        params.push(value[f]);
      }
    }

    if (req.file?.location) {
      updates.push(`logo_url = $${idx++}`);
      params.push(req.file.location);
    }

    if (updates.length === 0) return error(res, 'No fields to update', 400);

    params.push(req.user.id);
    const result = await query(
      `UPDATE franchise_partners SET ${updates.join(', ')}, updated_at = NOW()
       WHERE user_id = $${idx} RETURNING *`,
      params
    );

    if (result.rowCount === 0) return notFound(res, 'Partner not found');
    return success(res, result.rows[0], 'Profile updated');
  } catch (err) {
    return error(res, 'Failed to update profile');
  }
}

// Staff Management
async function getStaff(req, res) {
  try {
    const partner = await query('SELECT id FROM franchise_partners WHERE user_id = $1', [req.user.id]);
    if (partner.rows.length === 0) return notFound(res, 'Partner not found');

    const result = await query(
      'SELECT * FROM staff WHERE partner_id = $1 AND is_active = true ORDER BY name',
      [partner.rows[0].id]
    );
    return success(res, result.rows);
  } catch (err) {
    return error(res, 'Failed to fetch staff');
  }
}

async function addStaff(req, res) {
  const { error: validErr, value } = staffSchema.validate(req.body, { abortEarly: false });
  if (validErr) return validationError(res, validErr.details.map((d) => d.message));

  try {
    const partner = await query('SELECT id FROM franchise_partners WHERE user_id = $1 AND is_active = true', [req.user.id]);
    if (partner.rows.length === 0) return notFound(res, 'Active partner account not found');

    const result = await query(
      `INSERT INTO staff (partner_id, name, phone, role, skills)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [partner.rows[0].id, value.name, value.phone, value.role, value.skills]
    );
    return created(res, result.rows[0], 'Staff member added');
  } catch (err) {
    return error(res, 'Failed to add staff');
  }
}

async function updateStaff(req, res) {
  const schema = Joi.object({
    name: Joi.string().optional(),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
    role: Joi.string().valid('technician', 'supervisor', 'driver').optional(),
    skills: Joi.array().items(Joi.string()).optional(),
    is_available: Joi.boolean().optional(),
  });

  const { error: validErr, value } = schema.validate(req.body);
  if (validErr) return validationError(res, validErr.details.map((d) => d.message));

  try {
    const partner = await query('SELECT id FROM franchise_partners WHERE user_id = $1', [req.user.id]);
    if (partner.rows.length === 0) return notFound(res, 'Partner not found');

    const updates = [];
    const params = [];
    let idx = 1;

    ['name', 'phone', 'role', 'skills', 'is_available'].forEach((f) => {
      if (value[f] !== undefined) {
        updates.push(`${f} = $${idx++}`);
        params.push(value[f]);
      }
    });

    if (updates.length === 0) return error(res, 'No fields to update', 400);

    params.push(req.params.staffId, partner.rows[0].id);
    const result = await query(
      `UPDATE staff SET ${updates.join(', ')} WHERE id = $${idx} AND partner_id = $${idx + 1} RETURNING *`,
      params
    );

    if (result.rowCount === 0) return notFound(res, 'Staff not found');
    return success(res, result.rows[0], 'Staff updated');
  } catch (err) {
    return error(res, 'Failed to update staff');
  }
}

async function deleteStaff(req, res) {
  try {
    const partner = await query('SELECT id FROM franchise_partners WHERE user_id = $1', [req.user.id]);
    if (partner.rows.length === 0) return notFound(res, 'Partner not found');

    const result = await query(
      'UPDATE staff SET is_active = false WHERE id = $1 AND partner_id = $2 RETURNING id',
      [req.params.staffId, partner.rows[0].id]
    );
    if (result.rowCount === 0) return notFound(res, 'Staff not found');
    return success(res, null, 'Staff removed');
  } catch (err) {
    return error(res, 'Failed to remove staff');
  }
}

async function getPartnerBookingsHandler(req, res) {
  try {
    const partner = await query('SELECT id FROM franchise_partners WHERE user_id = $1', [req.user.id]);
    if (partner.rows.length === 0) return notFound(res, 'Partner not found');

    const { page, limit } = getPaginationParams(req.query);
    const result = await getPartnerBookings(partner.rows[0].id, {
      status: req.query.status,
      date: req.query.date,
      page,
      limit,
    });

    return paginated(res, result.bookings, { page, limit, total: result.total });
  } catch (err) {
    return error(res, 'Failed to fetch bookings');
  }
}

async function getEarnings(req, res) {
  try {
    const partner = await query('SELECT id, commission_rate, total_earnings FROM franchise_partners WHERE user_id = $1', [req.user.id]);
    if (partner.rows.length === 0) return notFound(res, 'Partner not found');

    const { period = 'month' } = req.query;
    const periodFilter = {
      week: "created_at > NOW() - INTERVAL '7 days'",
      month: "created_at > NOW() - INTERVAL '1 month'",
      quarter: "created_at > NOW() - INTERVAL '3 months'",
      year: "created_at > NOW() - INTERVAL '1 year'",
    }[period] || "created_at > NOW() - INTERVAL '1 month'";

    const earningsResult = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_bookings,
         COALESCE(SUM(p.final_amount) FILTER (WHERE b.status = 'completed'), 0) AS gross_revenue,
         COALESCE(SUM(p.final_amount * $2 / 100) FILTER (WHERE b.status = 'completed'), 0) AS partner_earnings,
         COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled_bookings
       FROM bookings b
       LEFT JOIN payments p ON p.booking_id = b.id AND p.status = 'success'
       WHERE b.partner_id = $1 AND b.${periodFilter}`,
      [partner.rows[0].id, partner.rows[0].commission_rate]
    );

    const dailyBreakdown = await query(
      `SELECT DATE(b.created_at) AS date,
              COUNT(*) FILTER (WHERE b.status = 'completed')::int AS bookings,
              COALESCE(SUM(p.final_amount * $2 / 100) FILTER (WHERE b.status = 'completed'), 0) AS earnings
       FROM bookings b
       LEFT JOIN payments p ON p.booking_id = b.id AND p.status = 'success'
       WHERE b.partner_id = $1 AND b.${periodFilter}
       GROUP BY DATE(b.created_at)
       ORDER BY date DESC`,
      [partner.rows[0].id, partner.rows[0].commission_rate]
    );

    return success(res, {
      ...earningsResult.rows[0],
      total_earnings: parseFloat(partner.rows[0].total_earnings),
      commission_rate: parseFloat(partner.rows[0].commission_rate),
      daily_breakdown: dailyBreakdown.rows,
    });
  } catch (err) {
    logger.error('getEarnings error', { error: err.message });
    return error(res, 'Failed to fetch earnings');
  }
}

async function getAnalytics(req, res) {
  try {
    const partner = await query('SELECT id FROM franchise_partners WHERE user_id = $1', [req.user.id]);
    if (partner.rows.length === 0) return notFound(res, 'Partner not found');

    const [serviceBreakdown, staffPerformance, ratingTrend] = await Promise.all([
      query(
        `SELECT sc.name AS service, COUNT(b.id)::int AS count, SUM(p.final_amount) AS revenue
         FROM bookings b
         JOIN service_packages sp ON sp.id = b.service_package_id
         JOIN service_categories sc ON sc.id = sp.category_id
         LEFT JOIN payments p ON p.booking_id = b.id AND p.status = 'success'
         WHERE b.partner_id = $1 AND b.status = 'completed'
           AND b.created_at > NOW() - INTERVAL '3 months'
         GROUP BY sc.name ORDER BY count DESC`,
        [partner.rows[0].id]
      ),
      query(
        `SELECT s.name, s.rating, s.jobs_completed
         FROM staff s
         WHERE s.partner_id = $1 AND s.is_active = true
         ORDER BY s.rating DESC`,
        [partner.rows[0].id]
      ),
      query(
        `SELECT DATE_TRUNC('week', b.created_at) AS week, AVG(b.rating)::numeric(3,2) AS avg_rating
         FROM bookings b
         WHERE b.partner_id = $1 AND b.rating IS NOT NULL
           AND b.created_at > NOW() - INTERVAL '3 months'
         GROUP BY week ORDER BY week`,
        [partner.rows[0].id]
      ),
    ]);

    return success(res, {
      service_breakdown: serviceBreakdown.rows,
      staff_performance: staffPerformance.rows,
      rating_trend: ratingTrend.rows,
    });
  } catch (err) {
    return error(res, 'Failed to fetch analytics');
  }
}

module.exports = {
  onboardPartner, getPartnerProfile, updatePartnerProfile,
  getStaff, addStaff, updateStaff, deleteStaff,
  getPartnerBookingsHandler, getEarnings, getAnalytics,
};
