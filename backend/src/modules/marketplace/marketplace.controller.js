'use strict';

const Joi = require('joi');
const { query, withTransaction } = require('../../config/database');
const {
  success, created, error, notFound, validationError, paginated, getPaginationParams, forbidden,
} = require('../../utils/response');
const { uploadMarketplaceImages } = require('../../middleware/upload');
const logger = require('../../utils/logger');

const listingSchema = Joi.object({
  vehicle_id: Joi.string().uuid().optional().allow(null),
  title: Joi.string().min(10).max(300).required(),
  description: Joi.string().max(2000).optional().allow('', null),
  asking_price: Joi.number().min(10000).max(50000000).required(),
  year: Joi.number().integer().min(1990).max(new Date().getFullYear()).required(),
  mileage: Joi.number().integer().min(0).optional().allow(null),
  condition: Joi.string().valid('excellent', 'good', 'fair', 'poor').required(),
});

const updateListingSchema = listingSchema.fork(
  ['title', 'asking_price', 'year', 'condition'],
  (f) => f.optional()
);

const inquirySchema = Joi.object({
  message: Joi.string().min(10).max(1000).required(),
  contact_phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
});

/**
 * AI price estimation (simple heuristic, replace with ML model)
 */
function estimateCarPrice(make, model, year, mileage, condition) {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  const depreciationRate = 0.12; // 12% per year
  const basePrices = {
    maruti: 600000, hyundai: 800000, tata: 700000, honda: 1000000, toyota: 1200000,
    mahindra: 900000, ford: 750000, kia: 1100000, mg: 1300000, volkswagen: 1100000,
  };

  const basePrice = basePrices[make?.toLowerCase()] || 800000;
  let estimatedPrice = basePrice * Math.pow(1 - depreciationRate, age);

  // Mileage adjustment
  const avgAnnualMileage = 15000;
  const expectedMileage = age * avgAnnualMileage;
  if (mileage && mileage > expectedMileage) {
    estimatedPrice *= (1 - 0.05 * Math.min((mileage - expectedMileage) / avgAnnualMileage, 5));
  }

  // Condition adjustment
  const conditionMultipliers = { excellent: 1.1, good: 1.0, fair: 0.85, poor: 0.7 };
  estimatedPrice *= conditionMultipliers[condition] || 1.0;

  return Math.round(estimatedPrice / 1000) * 1000;
}

async function getListings(req, res) {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { min_price, max_price, year_from, year_to, condition, city, sort } = req.query;

  const conditions = ["ml.status = 'listed'"];
  const params = [];
  let idx = 1;

  if (min_price) { conditions.push(`ml.asking_price >= $${idx++}`); params.push(parseFloat(min_price)); }
  if (max_price) { conditions.push(`ml.asking_price <= $${idx++}`); params.push(parseFloat(max_price)); }
  if (year_from) { conditions.push(`ml.year >= $${idx++}`); params.push(parseInt(year_from, 10)); }
  if (year_to) { conditions.push(`ml.year <= $${idx++}`); params.push(parseInt(year_to, 10)); }
  if (condition) { conditions.push(`ml.condition = $${idx++}`); params.push(condition); }

  const orderClause = {
    newest: 'ml.created_at DESC',
    price_asc: 'ml.asking_price ASC',
    price_desc: 'ml.asking_price DESC',
    popular: 'ml.views DESC',
  }[sort] || 'ml.created_at DESC';

  const whereClause = conditions.join(' AND ');

  try {
    const [listingsResult, countResult] = await Promise.all([
      query(
        `SELECT ml.id, ml.title, ml.asking_price, ml.ai_estimated_price, ml.year, ml.mileage,
                ml.condition, ml.images, ml.views, ml.inquiries, ml.created_at,
                v.make, v.model, v.fuel_type, v.vehicle_type, v.color,
                u.name AS seller_name
         FROM marketplace_listings ml
         LEFT JOIN vehicles v ON v.id = ml.vehicle_id
         JOIN users u ON u.id = ml.seller_id
         WHERE ${whereClause}
         ORDER BY ${orderClause}
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*) FROM marketplace_listings ml WHERE ${whereClause}`, params),
    ]);

    return paginated(res, listingsResult.rows, {
      page, limit, total: parseInt(countResult.rows[0].count, 10),
    });
  } catch (err) {
    return error(res, 'Failed to fetch listings');
  }
}

async function getListing(req, res) {
  try {
    // Increment view count
    await query(
      'UPDATE marketplace_listings SET views = views + 1 WHERE id = $1',
      [req.params.id]
    );

    const result = await query(
      `SELECT ml.*,
              v.make, v.model, v.fuel_type, v.vehicle_type, v.color, v.registration_number,
              u.name AS seller_name
       FROM marketplace_listings ml
       LEFT JOIN vehicles v ON v.id = ml.vehicle_id
       JOIN users u ON u.id = ml.seller_id
       WHERE ml.id = $1 AND ml.status != 'removed'`,
      [req.params.id]
    );

    if (result.rows.length === 0) return notFound(res, 'Listing not found');

    return success(res, result.rows[0]);
  } catch (err) {
    return error(res, 'Failed to fetch listing');
  }
}

async function createListing(req, res) {
  const { error: validErr, value } = listingSchema.validate(req.body, { abortEarly: false });
  if (validErr) return validationError(res, validErr.details.map((d) => d.message));

  try {
    const imageUrls = req.files ? req.files.map((f) => f.location || f.path) : [];

    if (imageUrls.length === 0) {
      return error(res, 'At least one image is required', 400);
    }

    // Validate vehicle ownership if provided
    if (value.vehicle_id) {
      const vehicle = await query(
        'SELECT make, model FROM vehicles WHERE id = $1 AND user_id = $2 AND is_active = true',
        [value.vehicle_id, req.user.id]
      );
      if (vehicle.rows.length === 0) return notFound(res, 'Vehicle not found');

      const estimated = estimateCarPrice(
        vehicle.rows[0].make, vehicle.rows[0].model,
        value.year, value.mileage, value.condition
      );

      const result = await query(
        `INSERT INTO marketplace_listings
           (seller_id, vehicle_id, title, description, asking_price, ai_estimated_price,
            year, mileage, condition, images, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'listed')
         RETURNING *`,
        [req.user.id, value.vehicle_id, value.title, value.description, value.asking_price,
         estimated, value.year, value.mileage, value.condition, imageUrls]
      );
      return created(res, { ...result.rows[0], ai_estimated_price: estimated });
    }

    const result = await query(
      `INSERT INTO marketplace_listings
         (seller_id, title, description, asking_price, year, mileage, condition, images, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'listed')
       RETURNING *`,
      [req.user.id, value.title, value.description, value.asking_price,
       value.year, value.mileage, value.condition, imageUrls]
    );
    return created(res, result.rows[0]);
  } catch (err) {
    logger.error('createListing error', { userId: req.user.id, error: err.message });
    return error(res, 'Failed to create listing');
  }
}

async function updateListing(req, res) {
  const { error: validErr, value } = updateListingSchema.validate(req.body, { abortEarly: false });
  if (validErr) return validationError(res, validErr.details.map((d) => d.message));

  try {
    const existing = await query(
      "SELECT id FROM marketplace_listings WHERE id = $1 AND seller_id = $2 AND status != 'removed'",
      [req.params.id, req.user.id]
    );
    if (existing.rows.length === 0) return notFound(res, 'Listing not found');

    const fields = ['title', 'description', 'asking_price', 'year', 'mileage', 'condition'];
    const updates = [];
    const params = [];
    let idx = 1;

    for (const f of fields) {
      if (value[f] !== undefined) {
        updates.push(`${f} = $${idx++}`);
        params.push(value[f]);
      }
    }

    if (req.files && req.files.length > 0) {
      updates.push(`images = images || $${idx++}::text[]`);
      params.push(req.files.map((f) => f.location || f.path));
    }

    if (updates.length === 0) return error(res, 'No fields to update', 400);

    params.push(req.params.id);
    const result = await query(
      `UPDATE marketplace_listings SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      params
    );

    return success(res, result.rows[0], 'Listing updated');
  } catch (err) {
    return error(res, 'Failed to update listing');
  }
}

async function deleteListing(req, res) {
  try {
    const result = await query(
      "UPDATE marketplace_listings SET status = 'removed' WHERE id = $1 AND seller_id = $2 RETURNING id",
      [req.params.id, req.user.id]
    );
    if (result.rowCount === 0) return notFound(res, 'Listing not found');
    return success(res, null, 'Listing removed');
  } catch (err) {
    return error(res, 'Failed to remove listing');
  }
}

async function createInquiry(req, res) {
  const { error: validErr, value } = inquirySchema.validate(req.body);
  if (validErr) return validationError(res, validErr.details.map((d) => d.message));

  try {
    const listing = await query(
      "SELECT id, seller_id, title FROM marketplace_listings WHERE id = $1 AND status = 'listed'",
      [req.params.id]
    );
    if (listing.rows.length === 0) return notFound(res, 'Listing not found');

    if (listing.rows[0].seller_id === req.user.id) {
      return error(res, 'Cannot inquire on your own listing', 400);
    }

    const result = await withTransaction(async (client) => {
      const inqResult = await client.query(
        `INSERT INTO marketplace_inquiries (listing_id, buyer_id, message, contact_phone)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [req.params.id, req.user.id, value.message, value.contact_phone || null]
      );
      await client.query(
        'UPDATE marketplace_listings SET inquiries = inquiries + 1 WHERE id = $1',
        [req.params.id]
      );
      return inqResult;
    });

    // Notify seller
    await require('../../utils/notifications').notifyUser(
      listing.rows[0].seller_id,
      'New Inquiry',
      `Someone is interested in your listing: ${listing.rows[0].title}`,
      'marketplace',
      { listingId: req.params.id }
    );

    return created(res, result.rows[0], 'Inquiry sent');
  } catch (err) {
    return error(res, 'Failed to send inquiry');
  }
}

async function getAIPricing(req, res) {
  const { make, model, year, mileage, condition } = req.query;

  if (!make || !model || !year || !condition) {
    return error(res, 'make, model, year, and condition are required', 400);
  }

  const estimated = estimateCarPrice(make, model, parseInt(year, 10), parseInt(mileage, 10) || 0, condition);

  return success(res, {
    estimated_price: estimated,
    range: { min: Math.round(estimated * 0.9), max: Math.round(estimated * 1.1) },
    confidence: 'medium',
    based_on: { make, model, year, mileage, condition },
  });
}

async function getMyListings(req, res) {
  const { page, limit, offset } = getPaginationParams(req.query);
  try {
    const [listingsResult, countResult] = await Promise.all([
      query(
        `SELECT ml.*, v.make, v.model, v.registration_number
         FROM marketplace_listings ml
         LEFT JOIN vehicles v ON v.id = ml.vehicle_id
         WHERE ml.seller_id = $1 AND ml.status != 'removed'
         ORDER BY ml.created_at DESC LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      ),
      query(
        "SELECT COUNT(*) FROM marketplace_listings WHERE seller_id = $1 AND status != 'removed'",
        [req.user.id]
      ),
    ]);
    return paginated(res, listingsResult.rows, {
      page, limit, total: parseInt(countResult.rows[0].count, 10),
    });
  } catch (err) {
    return error(res, 'Failed to fetch listings');
  }
}

module.exports = {
  getListings, getListing, createListing, updateListing, deleteListing,
  createInquiry, getAIPricing, getMyListings,
};
