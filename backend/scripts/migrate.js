'use strict';

/**
 * Run database schema migrations.
 * Usage: DATABASE_URL=... node scripts/migrate.js
 *   or:  node scripts/migrate.js  (uses .env)
 */

require('dotenv').config();

const path = require('path');
const fs   = require('fs');
const { Pool } = require('pg');

// Only enable SSL for remote databases (Railway/RDS); CI postgres doesn't support it
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

async function migrate() {
  const schemaPath = path.join(__dirname, '..', 'src', 'database', 'schema.sql');

  if (!fs.existsSync(schemaPath)) {
    console.error('❌ schema.sql not found at', schemaPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('🔄 Running schema migration...');
  try {
    await pool.query(sql);
    console.log('✅ Schema applied successfully');
  } catch (err) {
    // Ignore "already exists" errors — idempotent on re-runs
    if (err.code === '42P07' || err.code === '42710' || err.message.includes('already exists')) {
      console.log('ℹ️  Schema already up to date (some objects already existed)');
    } else {
      console.error('❌ Migration failed:', err.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

migrate();
