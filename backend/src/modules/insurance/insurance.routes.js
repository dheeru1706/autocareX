'use strict';

const router = require('express').Router();
const Joi = require('joi');
const { query, withTransaction } = require('../../config/database');
const {
  success, created, error, notFound, validationError, paginated, getPaginationParams,
} = require('../../utils/response');
const { verifyToken } = require('../../middleware/auth');
const { uploadInsuranceDoc, handleMulterError } = require('../../middleware/upload');
const { apiLimiter, strictLimiter } = require('../../middleware/rateLimiter');
const { notifyUser } = require('../../utils/notifications');
const logger = require('../../utils/logger');

const policySchema = Joi.object({
  vehicle_id: Joi.string().uuid().required(),
  provider_name: Joi.string().min(2).max(200).required(),
  policy_number: Joi.string().min(5).max(100).required(),
  type: Joi.string().valid('third_party', 'comprehensive', 'zero_dep').required(),
  premium: Joi.number().min(1000).max(1000000).required(),
  sum_insured: Joi.number().min(100000).required(),
  expiry_date: Joi.date().iso().required(),
});

router.use(verifyToken);
router.use(apiLimiter);

// Get all policies for user
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT ip.*, v.make, v.model, v.registration_number,
              CASE WHEN ip.expiry_date < CURRENT_DATE THEN true ELSE false END AS is_expired,
              CASE WHEN ip.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN true ELSE false END AS expiring_soon
       FROM insurance_policies ip
       JOIN vehicles v ON v.id = ip.vehicle_id
       WHERE ip.user_id = $1
       ORDER BY ip.expiry_date ASC`,
      [req.user.id]
    );
    return success(res, result.rows);
  } catch (err) {
    return error(res, 'Failed to fetch policies');
  }
});

// Get single policy
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT ip.*, v.make, v.model, v.registration_number, v.year
       FROM insurance_policies ip
       JOIN vehicles v ON v.id = ip.vehicle_id
       WHERE ip.id = $1 AND ip.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return notFound(res, 'Policy not found');
    return success(res, result.rows[0]);
  } catch (err) {
    return error(res, 'Failed to fetch policy');
  }
});

// Add a policy
router.post(
  '/',
  strictLimiter,
  uploadInsuranceDoc.single('document'),
  handleMulterError,
  async (req, res) => {
    const { error: validErr, value } = policySchema.validate(req.body, { abortEarly: false });
    if (validErr) return validationError(res, validErr.details.map((d) => d.message));

    try {
      // Verify vehicle ownership
      const vehicle = await query(
        'SELECT id FROM vehicles WHERE id = $1 AND user_id = $2 AND is_active = true',
        [value.vehicle_id, req.user.id]
      );
      if (vehicle.rows.length === 0) return notFound(res, 'Vehicle not found');

      const documentUrl = req.file?.location || null;

      const result = await query(
        `INSERT INTO insurance_policies
           (user_id, vehicle_id, provider_name, policy_number, type, premium, sum_insured, expiry_date, document_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [req.user.id, value.vehicle_id, value.provider_name, value.policy_number,
         value.type, value.premium, value.sum_insured, value.expiry_date, documentUrl]
      );

      return created(res, result.rows[0], 'Insurance policy added');
    } catch (err) {
      if (err.code === '23505') return error(res, 'Policy number already exists', 409);
      logger.error('Add policy error', { error: err.message });
      return error(res, 'Failed to add policy');
    }
  }
);

// Update policy
router.patch('/:id', async (req, res) => {
  const schema = Joi.object({
    expiry_date: Joi.date().iso().optional(),
    premium: Joi.number().optional(),
    sum_insured: Joi.number().optional(),
    status: Joi.string().valid('active', 'expired', 'claimed').optional(),
  });

  const { error: validErr, value } = schema.validate(req.body);
  if (validErr) return validationError(res, validErr.details.map((d) => d.message));

  try {
    const updates = [];
    const params = [];
    let idx = 1;
    ['expiry_date', 'premium', 'sum_insured', 'status'].forEach((f) => {
      if (value[f] !== undefined) { updates.push(`${f} = $${idx++}`); params.push(value[f]); }
    });

    if (updates.length === 0) return error(res, 'No fields to update', 400);

    params.push(req.params.id, req.user.id);
    const result = await query(
      `UPDATE insurance_policies SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
      params
    );

    if (result.rowCount === 0) return notFound(res, 'Policy not found');
    return success(res, result.rows[0], 'Policy updated');
  } catch (err) {
    return error(res, 'Failed to update policy');
  }
});

// Get renewal reminders (policies expiring in next 30 days)
router.get('/reminders/upcoming', async (req, res) => {
  try {
    const result = await query(
      `SELECT ip.*, v.make, v.model, v.registration_number,
              ip.expiry_date - CURRENT_DATE AS days_remaining
       FROM insurance_policies ip
       JOIN vehicles v ON v.id = ip.vehicle_id
       WHERE ip.user_id = $1
         AND ip.status = 'active'
         AND ip.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'
       ORDER BY ip.expiry_date ASC`,
      [req.user.id]
    );
    return success(res, result.rows);
  } catch (err) {
    return error(res, 'Failed to fetch reminders');
  }
});

module.exports = router;
