const db = require('../../config/database');
const { success, error, paginated } = require('../../utils/response');

exports.getAccount = async (req, res) => {
  try {
    const { rows: [account] } = await db.query(
      'SELECT * FROM fleet_accounts WHERE user_id = $1 AND is_active = true', [req.user.id]
    );
    if (!account) return error(res, 404, 'Fleet account not found');
    return success(res, account);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

exports.createAccount = async (req, res) => {
  try {
    const { company_name, contact_person, email, phone, gst_number, city } = req.body;
    const { rows: [account] } = await db.query(
      `INSERT INTO fleet_accounts(user_id, company_name, contact_person, email, phone, gst_number, city)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, company_name, contact_person, email, phone, gst_number, city]
    );
    return success(res, account, 201);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

exports.getVehicles = async (req, res) => {
  try {
    const { rows: [account] } = await db.query('SELECT id FROM fleet_accounts WHERE user_id=$1', [req.user.id]);
    if (!account) return error(res, 404, 'Fleet account not found');
    const { rows } = await db.query(
      `SELECT fv.*, v.make, v.model, v.year, v.registration_number, v.fuel_type
       FROM fleet_vehicles fv JOIN vehicles v ON v.id = fv.vehicle_id
       WHERE fv.fleet_id = $1 AND fv.is_active = true`,
      [account.id]
    );
    return success(res, rows);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

exports.addVehicle = async (req, res) => {
  try {
    const { rows: [account] } = await db.query('SELECT id FROM fleet_accounts WHERE user_id=$1', [req.user.id]);
    const { vehicle_id, driver_name, driver_phone } = req.body;
    const { rows: [fv] } = await db.query(
      'INSERT INTO fleet_vehicles(fleet_id,vehicle_id,driver_name,driver_phone) VALUES($1,$2,$3,$4) RETURNING *',
      [account.id, vehicle_id, driver_name, driver_phone]
    );
    return success(res, fv, 201);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

exports.removeVehicle = async (req, res) => {
  try {
    await db.query('UPDATE fleet_vehicles SET is_active=false WHERE id=$1', [req.params.id]);
    return success(res, { removed: true });
  } catch (err) {
    return error(res, 500, err.message);
  }
};

exports.getBookings = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { rows: [account] } = await db.query('SELECT id FROM fleet_accounts WHERE user_id=$1', [req.user.id]);
    const { rows } = await db.query(
      `SELECT b.*, v.make, v.model, v.registration_number, sp.name AS service_name
       FROM bookings b
       JOIN fleet_vehicles fv ON fv.vehicle_id = b.vehicle_id
       JOIN vehicles v ON v.id = b.vehicle_id
       JOIN service_packages sp ON sp.id = b.service_package_id
       WHERE fv.fleet_id = $1
       ORDER BY b.scheduled_at DESC LIMIT $2 OFFSET $3`,
      [account.id, limit, (page-1)*limit]
    );
    return success(res, rows);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

exports.createBulkBooking = async (req, res) => {
  try {
    const { bookings } = req.body; // array of booking objects
    const results = [];
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      for (const booking of bookings) {
        const { rows: [b] } = await client.query(
          `INSERT INTO bookings(consumer_id,vehicle_id,address_id,service_package_id,scheduled_at,base_amount,final_amount,gst_amount)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING booking_number, id`,
          [req.user.id, booking.vehicle_id, booking.address_id, booking.service_package_id,
           booking.scheduled_at, booking.base_amount, booking.final_amount, booking.gst_amount]
        );
        results.push(b);
      }
      await client.query('COMMIT');
      return success(res, { created: results.length, bookings: results }, 201);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    return error(res, 500, err.message);
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const { month, year } = req.query;
    const { rows: [account] } = await db.query('SELECT id FROM fleet_accounts WHERE user_id=$1', [req.user.id]);
    const { rows } = await db.query(
      `SELECT DATE_TRUNC('month', b.created_at) AS month,
              COUNT(b.id) AS booking_count,
              SUM(b.final_amount) AS total_amount,
              SUM(b.gst_amount) AS gst_amount
       FROM bookings b
       JOIN fleet_vehicles fv ON fv.vehicle_id = b.vehicle_id
       WHERE fv.fleet_id = $1 AND b.status = 'completed'
       GROUP BY DATE_TRUNC('month', b.created_at)
       ORDER BY month DESC`,
      [account.id]
    );
    return success(res, rows);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const { rows: [account] } = await db.query('SELECT id FROM fleet_accounts WHERE user_id=$1', [req.user.id]);
    const [vehicleCount, bookingStats, monthlySpend] = await Promise.all([
      db.query('SELECT COUNT(*) FROM fleet_vehicles WHERE fleet_id=$1 AND is_active=true', [account.id]),
      db.query(
        `SELECT COUNT(*) AS total, COUNT(*) FILTER(WHERE status='completed') AS completed,
                COUNT(*) FILTER(WHERE status='pending') AS pending,
                SUM(final_amount) FILTER(WHERE status='completed') AS total_spend
         FROM bookings b JOIN fleet_vehicles fv ON fv.vehicle_id=b.vehicle_id WHERE fv.fleet_id=$1`,
        [account.id]
      ),
      db.query(
        `SELECT DATE_TRUNC('month', b.created_at) AS month, SUM(b.final_amount) AS spend
         FROM bookings b JOIN fleet_vehicles fv ON fv.vehicle_id=b.vehicle_id
         WHERE fv.fleet_id=$1 AND b.status='completed'
         GROUP BY 1 ORDER BY 1 DESC LIMIT 6`,
        [account.id]
      )
    ]);
    return success(res, {
      vehicles: parseInt(vehicleCount.rows[0].count),
      ...bookingStats.rows[0],
      monthly_trend: monthlySpend.rows
    });
  } catch (err) {
    return error(res, 500, err.message);
  }
};
