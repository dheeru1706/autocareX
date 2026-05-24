const db = require('../../config/database');
const { client: redis } = require('../../config/redis');
const { success, error } = require('../../utils/response');

const CACHE_TTL = 3600; // 1 hour

exports.getCategories = async (req, res) => {
  try {
    const cacheKey = 'autocareX:categories:all';
    const cached = await redis.get(cacheKey);
    if (cached) return success(res, JSON.parse(cached));

    const { rows } = await db.query(
      'SELECT * FROM service_categories WHERE is_active = true ORDER BY sort_order ASC'
    );
    await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(rows));
    return success(res, rows);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

exports.getPackages = async (req, res) => {
  try {
    const { category_id, vehicle_type, city } = req.query;
    const cacheKey = `autocareX:packages:${category_id || 'all'}:${vehicle_type || 'all'}`;
    const cached = await redis.get(cacheKey);
    if (cached) return success(res, JSON.parse(cached));

    let query = `SELECT sp.*, sc.name AS category_name, sc.slug AS category_slug
                 FROM service_packages sp
                 JOIN service_categories sc ON sc.id = sp.category_id
                 WHERE sp.is_active = true`;
    const params = [];
    if (category_id) { query += ` AND sp.category_id = $${params.push(category_id)}`; }
    if (vehicle_type) { query += ` AND ($${params.push(vehicle_type)} = ANY(sp.vehicle_types) OR array_length(sp.vehicle_types,1) IS NULL)`; }
    query += ' ORDER BY sp.base_price ASC';

    const { rows } = await db.query(query, params);
    await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(rows));
    return success(res, rows);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

exports.getPackage = async (req, res) => {
  try {
    const { rows: [pkg] } = await db.query(
      `SELECT sp.*, sc.name AS category_name FROM service_packages sp
       JOIN service_categories sc ON sc.id = sp.category_id
       WHERE sp.id = $1 AND sp.is_active = true`,
      [req.params.id]
    );
    if (!pkg) return error(res, 404, 'Package not found');
    return success(res, pkg);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const { date, partner_id, duration_mins = 60 } = req.query;
    if (!date || !partner_id) return error(res, 400, 'date and partner_id are required');

    const dayStart = new Date(date);
    dayStart.setHours(8, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(20, 0, 0, 0);

    const { rows: booked } = await db.query(
      `SELECT slot_start, slot_end FROM bookings
       WHERE partner_id = $1 AND scheduled_at::date = $2::date
       AND status NOT IN ('cancelled','refunded')`,
      [partner_id, date]
    );

    const slots = [];
    let current = new Date(dayStart);
    while (current < dayEnd) {
      const slotEnd = new Date(current.getTime() + duration_mins * 60000);
      const isBusy = booked.some(b =>
        (current >= new Date(b.slot_start) && current < new Date(b.slot_end)) ||
        (slotEnd > new Date(b.slot_start) && slotEnd <= new Date(b.slot_end))
      );
      if (!isBusy && slotEnd <= dayEnd) {
        slots.push({ start: new Date(current).toISOString(), end: slotEnd.toISOString(), available: true });
      }
      current = new Date(current.getTime() + 30 * 60000); // 30-min increments
    }
    return success(res, slots);
  } catch (err) {
    return error(res, 500, err.message);
  }
};
