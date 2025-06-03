const pool = require('../../db');

const createSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('employer', 'employee'))
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      request_id TEXT,
      actor_user_id INTEGER,
      actor_role TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      success BOOLEAN NOT NULL,
      status_code INTEGER,
      ip TEXT,
      user_agent TEXT,
      metadata_json JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
};

module.exports = { createSchema };