'use strict';

const Joi = require('joi');
const { query, withTransaction } = require('../../config/database');
const { success, created, error, notFound, validationError, forbidden } = require('../../utils/response');
const logger = require('../../utils/logger');

const vehicleSchema = Joi.object({
  make: Joi.string().min(2).max(100).required(),
  model: Joi.string().min(1).max(100).required(),
  year: Joi.number().integer().min(1990).max(new Date().getFullYear() + 1).required(),
  registration_number: Joi.string().pattern(/^[A-Z]{2}[0-9]{2}[A-Z]{0,3}[0-9]{4}$/).required().uppercase().messages({
    'string.pattern.base': 'Invalid registration number format (e.g., MH12AB1234)',
  }),
  fuel_type: Joi.string().valid('petrol', 'diesel', 'cng', 'electric', 'hybrid').required(),
  color: Joi.string().max(50).optional().allow('', null),
  vehicle_type: Joi.string().valid('hatchback', 'sedan', 'suv', 'luxury', 'commercial').required(),
  insurance_expiry: Joi.date().iso().optional().allow(null),
  puc_expiry: Joi.date().iso().optional().allow(null),
  last_service_date: Joi.date().iso().optional().allow(null),
  mileage: Joi.number().integer().min(0).optional().allow(null),
  vin: Joi.string().max(50).optional().allow('', null),
});

const updateVehicleSchema = vehicleSchema.fork(
  ['make', 'model', 'year', 'registration_number', 'fuel_type', 'vehicle_type'],
  (field) => field.optional()
);

async function getVehicles(req, res) {
  try {
    const result = await query(
      `SELECT v.*,
              CASE WHEN v.insurance_expiry < CURRENT_DATE THEN true ELSE false END AS insurance_expired,
              CASE WHEN v.puc_expiry < CURRENT_DATE THEN true ELSE false END AS puc_expired,
              CASE WHEN v.insurance_expiry < CURRENT_DATE + INTERVAL '30 days' AND v.insurance_expiry >= CURRENT_DATE THEN true ELSE false END AS insurance_expiring_soon
       FROM vehicles v
       WHERE v.user_id = $1 AND v.is_active = true
       ORDER BY v.created_at DESC`,
      [req.user.id]
    );
    return success(res, result.rows);
  } catch (err) {
    return error(res, 'Failed to fetch vehicles');
  }
}

async function getVehicle(req, res) {
  try {
    const result = await query(
      `SELECT v.*,
              CASE WHEN v.insurance_expiry < CURRENT_DATE THEN true ELSE false END AS insurance_expired,
              CASE WHEN v.puc_expiry < CURRENT_DATE THEN true ELSE false END AS puc_expired
       FROM vehicles v
       WHERE v.id = $1 AND v.user_id = $2 AND v.is_active = true`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) return notFound(res, 'Vehicle not found');
    return success(res, result.rows[0]);
  } catch (err) {
    return error(res, 'Failed to fetch vehicle');
  }
}

async function addVehicle(req, res) {
  const { error: validErr, value } = vehicleSchema.validate(req.body, { abortEarly: false });
  if (validErr) return validationError(res, validErr.details.map((d) => d.message));

  try {
    // Collect uploaded image URLs
    const imageUrls = req.files ? req.files.map((f) => f.location || f.path) : [];

    const result = await query(
      `INSERT INTO vehicles (user_id, make, model, year, registration_number, fuel_type, color, vehicle_type,
                             insurance_expiry, puc_expiry, last_service_date, mileage, vin, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        req.user.id, value.make, value.model, value.year, value.registration_number.toUpperCase(),
        value.fuel_type, value.color, value.vehicle_type, value.insurance_expiry || null,
        value.puc_expiry || null, value.last_service_date || null, value.mileage || null,
        value.vin || null, imageUrls,
      ]
    );

    return created(res, result.rows[0], 'Vehicle added successfully');
  } catch (err) {
    if (err.code === '23505') return error(res, 'Vehicle with this registration number already exists', 409);
    logger.error('addVehicle error', { userId: req.user.id, error: err.message });
    return error(res, 'Failed to add vehicle');
  }
}

async function updateVehicle(req, res) {
  const { error: validErr, value } = updateVehicleSchema.validate(req.body, { abortEarly: false });
  if (validErr) return validationError(res, validErr.details.map((d) => d.message));

  try {
    // Verify ownership
    const existing = await query(
      'SELECT id FROM vehicles WHERE id = $1 AND user_id = $2 AND is_active = true',
      [req.params.id, req.user.id]
    );
    if (existing.rows.length === 0) return notFound(res, 'Vehicle not found');

    const fields = ['make', 'model', 'year', 'fuel_type', 'color', 'vehicle_type', 'insurance_expiry', 'puc_expiry', 'last_service_date', 'mileage', 'vin'];
    const updates = [];
    const params = [];
    let idx = 1;

    for (const field of fields) {
      if (value[field] !== undefined) {
        updates.push(`${field} = $${idx++}`);
        params.push(value[field]);
      }
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((f) => f.location || f.path);
      updates.push(`images = images || $${idx++}::text[]`);
      params.push(newImages);
    }

    if (updates.length === 0) return error(res, 'No fields to update', 400);

    params.push(req.params.id);
    const result = await query(
      `UPDATE vehicles SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      params
    );

    return success(res, result.rows[0], 'Vehicle updated');
  } catch (err) {
    if (err.code === '23505') return error(res, 'Registration number already exists', 409);
    return error(res, 'Failed to update vehicle');
  }
}

async function deleteVehicle(req, res) {
  try {
    // Soft delete
    const result = await query(
      'UPDATE vehicles SET is_active = false WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rowCount === 0) return notFound(res, 'Vehicle not found');
    return success(res, null, 'Vehicle removed');
  } catch (err) {
    return error(res, 'Failed to delete vehicle');
  }
}

async function removeVehicleImage(req, res) {
  const { id, imageUrl } = req.params;

  try {
    const result = await query(
      'UPDATE vehicles SET images = array_remove(images, $1) WHERE id = $2 AND user_id = $3 RETURNING images',
      [decodeURIComponent(imageUrl), id, req.user.id]
    );
    if (result.rowCount === 0) return notFound(res, 'Vehicle not found');
    return success(res, { images: result.rows[0].images }, 'Image removed');
  } catch (err) {
    return error(res, 'Failed to remove image');
  }
}

module.exports = { getVehicles, getVehicle, addVehicle, updateVehicle, deleteVehicle, removeVehicleImage };
