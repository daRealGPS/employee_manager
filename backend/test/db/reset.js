const pool = require('../../db');

const resetDb = async () => {
  await pool.query('DROP TABLE IF EXISTS audit_logs CASCADE');
  await pool.query('DROP TABLE IF EXISTS users CASCADE');
};

module.exports = { resetDb };