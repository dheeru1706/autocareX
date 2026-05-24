'use strict';

const Joi = require('joi');
const { query, withTransaction } = require('../../config/database');
const {
  success, created, error, notFound, validationError, paginated, getPaginationParams,
} = require('../../utils/response');
const logger = require('../../utils/logger');

// =============================================
// DASHBOARD KPIs
// =============================================

async function getDashboard(req, res) {
  try {
    const [
      userStats, bookingStats, revenueStats, partnerStats,
    ] = await Promise.all([
      query(`
        SELECT
          COUNT(*)::int AS total_users,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')::int AS new_users_month,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS new_users_week,
          COUNT(*) FILTER (WHERE role = 'partner')::int AS total_partners
        FROM users WHERE is_active = true
      `),
      query(`
        SELECT
          COUNT(*)::int AS total_bookings,
          COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
          COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
          COUNT(*) FILTER (WHERE status IN ('pending', 'confirmed', 'assigned', 'in_progress'))::int AS active,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::int AS today
        FROM bookings
      `),
      query(`
        SELECT
          COALESCE(SUM(final_amount) FILTER (WHERE status = 'success'), 0) AS total_revenue,
          COALESCE(SUM(final_amount) FILTER (WHERE status = 'success' AND created_at > NOW() - INTERVAL '30 days'), 0) AS revenue_month,
          COALESCE(SUM(final_amount) FILTER (WHERE status = 'success' AND created_at > NOW() - INTERVAL '7 days'), 0) AS revenue_week,
          COALESCE(SUM(final_amount) FILTER (WHERE status = 'success' AND DATE(created_at) = CURRENT_DATE), 0) AS revenue_today
        FROM payments
      `),
      query(`
        SELECT
          COUNT(*)::int AS total_partners,
          COUNT(*) FILTER (WHERE kyc_status = 'pending')::int AS pending_kyc,
          COUNT(*) FILTER (WHERE is_active = true AND kyc_status = 'approved')::int AS active_partners
        FROM franchise_partners
      `),
    ]);

    return success(res, {
      users: userStats.rows[0],
      bookings: bookingStats.rows[0],
      revenue: revenueStats.rows[0],
      partners: partnerStats.rows[0],
    });
  } catch (err) {
    logger.error('getDashboard error', { error: err.message });
    return error(res, 'Failed to fetch dashboard data');
  }
}

// =============================================
// REVENUE ANALYTICS
// =============================================

async function getRevenueAnalytics(req, res) {
  const { period = 'monthly', year = new Date().getFullYear() } = req.query;

  try {
    const truncLevel = { daily: 'day', weekly: 'week', monthly: 'month' }[period] || 'month';

    const revenueResult = await query(
      `SELECT DATE_TRUNC($1, created_at) AS period,
              SUM(final_amount) AS revenue,
              COUNT(*) AS transactions
       FROM payments
       WHERE status = 'success' AND EXTRACT(YEAR FROM created_at) = $2
       GROUP BY period ORDER BY period`,
      [truncLevel, year]
    );

    const categoryRevenue = await query(
      `SELECT sc.name AS category,
              COUNT(b.id)::int AS bookings,
              COALESCE(SUM(p.final_amount), 0) AS revenue
       FROM bookings b
       JOIN service_packages sp ON sp.id = b.service_package_id
       JOIN service_categories sc ON sc.id = sp.category_id
       LEFT JOIN payments p ON p.booking_id = b.id AND p.status = 'success'
       WHERE b.status = 'completed' AND EXTRACT(YEAR FROM b.created_at) = $1
       GROUP BY sc.name ORDER BY revenue DESC`,
      [year]
    );

    const cityRevenue = await query(
      `SELECT fp.city,
              COUNT(b.id)::int AS bookings,
              COALESCE(SUM(p.final_amount), 0) AS revenue
       FROM bookings b
       JOIN franchise_partners fp ON fp.id = b.partner_id
       LEFT JOIN payments p ON p.booking_id = b.id AND p.status = 'success'
       WHERE b.status = 'completed' AND EXTRACT(YEAR FROM b.created_at) = $1
       GROUP BY fp.city ORDER BY revenue DESC LIMIT 10`,
      [year]
    );

    return success(res, {
      revenue_trend: revenueResult.rows,
      by_category: categoryRevenue.rows,
      by_city: cityRevenue.rows,
    });
  } catch (err) {
    logger.error('getRevenueAnalytics error', { error: err.message });
    return error(res, 'Failed to fetch analytics');
  }
}

// =============================================
// USER MANAGEMENT
// =============================================

async function getUsers(req, res) {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { role, search, is_active } = req.query;

  try {
    const conditions = ['1 = 1'];
    const params = [];
    let idx = 1;

    if (role) { conditions.push(`u.role = $${idx++}`); params.push(role); }
    if (is_active !== undefined) { conditions.push(`u.is_active = $${idx++}`); params.push(is_active === 'true'); }
    if (search) {
      conditions.push(`(u.name ILIKE $${idx} OR u.phone ILIKE $${idx} OR u.email ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const whereClause = conditions.join(' AND ');

    const [usersResult, countResult] = await Promise.all([
      query(
        `SELECT u.id, u.phone, u.email, u.name, u.role, u.kyc_status, u.is_active,
                u.wallet_balance, u.created_at,
                COUNT(b.id)::int AS booking_count
         FROM users u
         LEFT JOIN bookings b ON b.consumer_id = u.id
         WHERE ${whereClause}
         GROUP BY u.id
         ORDER BY u.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*) FROM users u WHERE ${whereClause}`, params),
    ]);

    return paginated(res, usersResult.rows, {
      page, limit, total: parseInt(countResult.rows[0].count, 10),
    });
  } catch (err) {
    return error(res, 'Failed to fetch users');
  }
}

async function getUserDetails(req, res) {
  try {
    const [userResult, bookings, vehicles] = await Promise.all([
      query(
        `SELECT u.*, fp.id AS partner_id, fp.business_name, fp.kyc_status AS partner_kyc
         FROM users u
         LEFT JOIN franchise_partners fp ON fp.user_id = u.id
         WHERE u.id = $1`,
        [req.params.id]
      ),
      query(
        'SELECT id, booking_number, status, scheduled_at FROM bookings WHERE consumer_id = $1 ORDER BY created_at DESC LIMIT 5',
        [req.params.id]
      ),
      query(
        'SELECT id, make, model, registration_number, vehicle_type FROM vehicles WHERE user_id = $1 AND is_active = true',
        [req.params.id]
      ),
    ]);

    if (userResult.rows.length === 0) return notFound(res, 'User not found');

    return success(res, {
      user: userResult.rows[0],
      recent_bookings: bookings.rows,
      vehicles: vehicles.rows,
    });
  } catch (err) {
    return error(res, 'Failed to fetch user details');
  }
}

async function toggleUserStatus(req, res) {
  try {
    const result = await query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, is_active',
      [req.params.id]
    );
    if (result.rowCount === 0) return notFound(res, 'User not found');

    const action = result.rows[0].is_active ? 'activated' : 'deactivated';
    return success(res, result.rows[0], `User ${action}`);
  } catch (err) {
    return error(res, 'Failed to update user status');
  }
}

// =============================================
// FRANCHISE / PARTNER MANAGEMENT
// =============================================

async function getPartners(req, res) {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { kyc_status, city } = req.query;

  try {
    const conditions = ['1 = 1'];
    const params = [];
    let idx = 1;

    if (kyc_status) { conditions.push(`fp.kyc_status = $${idx++}`); params.push(kyc_status); }
    if (city) { conditions.push(`fp.city ILIKE $${idx++}`); params.push(`%${city}%`); }

    const whereClause = conditions.join(' AND ');

    const [partnersResult, countResult] = await Promise.all([
      query(
        `SELECT fp.*, u.name AS owner_name, u.phone, u.email,
                COUNT(DISTINCT s.id)::int AS staff_count,
                COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'completed')::int AS completed_bookings
         FROM franchise_partners fp
         JOIN users u ON u.id = fp.user_id
         LEFT JOIN staff s ON s.partner_id = fp.id AND s.is_active = true
         LEFT JOIN bookings b ON b.partner_id = fp.id
         WHERE ${whereClause}
         GROUP BY fp.id, u.name, u.phone, u.email
         ORDER BY fp.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*) FROM franchise_partners fp WHERE ${whereClause}`, params),
    ]);

    return paginated(res, partnersResult.rows, {
      page, limit, total: parseInt(countResult.rows[0].count, 10),
    });
  } catch (err) {
    return error(res, 'Failed to fetch partners');
  }
}

async function approvePartner(req, res) {
  const { action, notes } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return error(res, 'action must be "approve" or "reject"', 400);
  }

  try {
    const kycStatus = action === 'approve' ? 'approved' : 'rejected';
    const result = await withTransaction(async (client) => {
      const updateResult = await client.query(
        `UPDATE franchise_partners
         SET kyc_status = $1, approval_notes = $2, is_active = $3, joined_at = CASE WHEN $3 THEN NOW() ELSE joined_at END, updated_at = NOW()
         WHERE id = $4
         RETURNING *, (SELECT user_id FROM franchise_partners WHERE id = $4) AS uid`,
        [kycStatus, notes || null, action === 'approve', req.params.id]
      );

      if (updateResult.rowCount === 0) throw Object.assign(new Error('Partner not found'), { status: 404 });

      // Log audit
      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_data, ip_address)
         VALUES ($1, $2, 'franchise_partner', $3, $4, $5)`,
        [req.user.id, `partner_${action}d`, req.params.id, JSON.stringify({ kyc_status: kycStatus, notes }), req.ip]
      );

      return updateResult;
    });

    // Notify partner
    const partner = result.rows[0];
    await require('../../utils/notifications').notifyUser(
      partner.user_id,
      action === 'approve' ? 'Application Approved!' : 'Application Update',
      action === 'approve'
        ? 'Congratulations! Your partner application has been approved.'
        : `Your application was not approved. ${notes || ''}`,
      'kyc'
    );

    return success(res, result.rows[0], `Partner ${action}d successfully`);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
}

// =============================================
// BOOKING MANAGEMENT (Admin view)
// =============================================

async function getAllBookings(req, res) {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { status, date, city, partner_id } = req.query;

  try {
    const conditions = ['1 = 1'];
    const params = [];
    let idx = 1;

    if (status) { conditions.push(`b.status = $${idx++}`); params.push(status); }
    if (date) { conditions.push(`DATE(b.scheduled_at) = $${idx++}`); params.push(date); }
    if (partner_id) { conditions.push(`b.partner_id = $${idx++}`); params.push(partner_id); }
    if (city) { conditions.push(`fp.city ILIKE $${idx++}`); params.push(`%${city}%`); }

    const whereClause = conditions.join(' AND ');

    const [bookingsResult, countResult] = await Promise.all([
      query(
        `SELECT b.id, b.booking_number, b.status, b.scheduled_at, b.rating,
                sp.name AS service_name,
                v.make, v.model, v.registration_number,
                u.name AS consumer_name, u.phone AS consumer_phone,
                fp.business_name AS partner_name, fp.city
         FROM bookings b
         JOIN service_packages sp ON sp.id = b.service_package_id
         JOIN vehicles v ON v.id = b.vehicle_id
         JOIN users u ON u.id = b.consumer_id
         LEFT JOIN franchise_partners fp ON fp.id = b.partner_id
         WHERE ${whereClause}
         ORDER BY b.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
      query(
        `SELECT COUNT(*) FROM bookings b LEFT JOIN franchise_partners fp ON fp.id = b.partner_id WHERE ${whereClause}`,
        params
      ),
    ]);

    return paginated(res, bookingsResult.rows, {
      page, limit, total: parseInt(countResult.rows[0].count, 10),
    });
  } catch (err) {
    return error(res, 'Failed to fetch bookings');
  }
}

// =============================================
// SERVICE MANAGEMENT
// =============================================

async function getServiceCategories(req, res) {
  try {
    const result = await query('SELECT * FROM service_categories ORDER BY sort_order ASC');
    return success(res, result.rows);
  } catch (err) {
    return error(res, 'Failed to fetch categories');
  }
}

async function createServiceCategory(req, res) {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    slug: Joi.string().pattern(/^[a-z0-9-]+$/).required(),
    description: Joi.string().optional().allow('', null),
    sort_order: Joi.number().integer().optional().default(0),
  });

  const { error: validErr, value } = schema.validate(req.body);
  if (validErr) return validationError(res, validErr.details.map((d) => d.message));

  try {
    const iconUrl = req.file?.location || null;
    const result = await query(
      `INSERT INTO service_categories (name, slug, description, sort_order, icon_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [value.name, value.slug, value.description, value.sort_order, iconUrl]
    );
    return created(res, result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return error(res, 'Slug already exists', 409);
    return error(res, 'Failed to create category');
  }
}

async function createServicePackage(req, res) {
  const schema = Joi.object({
    category_id: Joi.string().uuid().required(),
    name: Joi.string().min(3).max(200).required(),
    description: Joi.string().optional(),
    duration_mins: Joi.number().integer().min(15).required(),
    base_price: Joi.number().min(1).required(),
    discounted_price: Joi.number().optional().allow(null),
    includes: Joi.array().items(Joi.string()).optional().default([]),
    excludes: Joi.array().items(Joi.string()).optional().default([]),
    is_popular: Joi.boolean().optional().default(false),
    vehicle_types: Joi.array().items(Joi.string()).optional().default([]),
  });

  const { error: validErr, value } = schema.validate(req.body, { abortEarly: false });
  if (validErr) return validationError(res, validErr.details.map((d) => d.message));

  try {
    const imageUrls = req.files ? req.files.map((f) => f.location || f.path) : [];
    const result = await query(
      `INSERT INTO service_packages
         (category_id, name, description, duration_mins, base_price, discounted_price,
          includes, excludes, images, is_popular, vehicle_types)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [value.category_id, value.name, value.description, value.duration_mins, value.base_price,
       value.discounted_price, value.includes, value.excludes, imageUrls, value.is_popular,
       value.vehicle_types]
    );
    return created(res, result.rows[0]);
  } catch (err) {
    return error(res, 'Failed to create package');
  }
}

// =============================================
// SYSTEM REPORTS
// =============================================

async function generateReport(req, res) {
  const { type, from_date, to_date } = req.query;

  if (!from_date || !to_date) {
    return error(res, 'from_date and to_date are required', 400);
  }

  try {
    let reportData;

    switch (type) {
      case 'bookings':
        reportData = await query(
          `SELECT b.booking_number, b.status, b.scheduled_at, b.rating,
                  sp.name AS service, sp.base_price,
                  u.name AS consumer, u.phone,
                  fp.business_name AS partner, fp.city,
                  p.final_amount, p.method AS payment_method
           FROM bookings b
           JOIN service_packages sp ON sp.id = b.service_package_id
           JOIN users u ON u.id = b.consumer_id
           LEFT JOIN franchise_partners fp ON fp.id = b.partner_id
           LEFT JOIN payments p ON p.booking_id = b.id AND p.status = 'success'
           WHERE b.created_at BETWEEN $1 AND $2
           ORDER BY b.created_at DESC`,
          [from_date, to_date]
        );
        break;

      case 'revenue':
        reportData = await query(
          `SELECT DATE(created_at) AS date,
                  COUNT(*) AS transactions,
                  SUM(final_amount) AS revenue,
                  SUM(gst_amount) AS gst
           FROM payments
           WHERE status = 'success' AND created_at BETWEEN $1 AND $2
           GROUP BY DATE(created_at) ORDER BY date`,
          [from_date, to_date]
        );
        break;

      case 'partners':
        reportData = await query(
          `SELECT fp.business_name, fp.city, fp.commission_rate,
                  COUNT(b.id) FILTER (WHERE b.status = 'completed')::int AS completed_bookings,
                  AVG(b.rating)::numeric(3,2) AS avg_rating,
                  COALESCE(SUM(p.final_amount), 0) AS total_revenue
           FROM franchise_partners fp
           LEFT JOIN bookings b ON b.partner_id = fp.id AND b.created_at BETWEEN $1 AND $2
           LEFT JOIN payments p ON p.booking_id = b.id AND p.status = 'success'
           WHERE fp.is_active = true
           GROUP BY fp.id ORDER BY total_revenue DESC`,
          [from_date, to_date]
        );
        break;

      default:
        return error(res, 'Invalid report type. Use: bookings, revenue, partners', 400);
    }

    return success(res, {
      type,
      period: { from: from_date, to: to_date },
      records: reportData.rows,
      total_records: reportData.rows.length,
    });
  } catch (err) {
    logger.error('generateReport error', { error: err.message });
    return error(res, 'Failed to generate report');
  }
}

// City / Zone management
async function getCities(req, res) {
  try {
    const result = await query(
      `SELECT DISTINCT fp.city, fp.state, COUNT(fp.id)::int AS partner_count
       FROM franchise_partners fp WHERE fp.is_active = true
       GROUP BY fp.city, fp.state ORDER BY partner_count DESC`
    );
    return success(res, result.rows);
  } catch (err) {
    return error(res, 'Failed to fetch cities');
  }
}

module.exports = {
  getDashboard,
  getRevenueAnalytics,
  getUsers,
  getUserDetails,
  toggleUserStatus,
  getPartners,
  approvePartner,
  getAllBookings,
  getServiceCategories,
  createServiceCategory,
  createServicePackage,
  generateReport,
  getCities,
};
