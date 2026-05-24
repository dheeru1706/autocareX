'use strict';

/**
 * Seed an admin user into the database.
 * Usage: DATABASE_URL=... node scripts/seed-admin.js
 *   or:  node scripts/seed-admin.js  (uses .env)
 */

require('dotenv').config();

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const dbUrl = process.env.DATABASE_URL || '';
const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
const sslConfig = dbUrl && !isLocal ? { rejectUnauthorized: false } : false;

const pool = dbUrl
  ? new Pool({ connectionString: dbUrl, ssl: sslConfig })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      database: process.env.DB_NAME || 'autocarex',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@autocarex.in';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '+919999000001';
const ADMIN_NAME  = process.env.ADMIN_NAME  || 'Admin';
const ADMIN_PASS  = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123';

async function seed() {
  try {
    const passwordHash = await bcrypt.hash(ADMIN_PASS, 12);
    const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    const { rows } = await pool.query(
      `INSERT INTO users (phone, email, name, role, is_active, referral_code, password_hash)
       VALUES ($1, $2, $3, 'admin', true, $4, $5)
       ON CONFLICT (email) DO UPDATE
         SET name = EXCLUDED.name,
             role = 'admin',
             is_active = true,
             password_hash = EXCLUDED.password_hash
       RETURNING id, email, role`,
      [ADMIN_PHONE, ADMIN_EMAIL, ADMIN_NAME, referralCode, passwordHash]
    );

    console.log('✅ Admin user seeded:', rows[0]);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASS}`);
    console.log('   👉 Change the password after first login!');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
