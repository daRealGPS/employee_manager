const { createSchema } = require('./db/schema');
const { resetDb } = require('./db/reset');
const { seedDb } = require('./db/seed');
const pool = require('../db');

const setupTestDb = async () => {
  await resetDb();
  await createSchema();
  await seedDb();
};

const closeTestDb = async () => {
  await pool.end();
};

module.exports = { setupTestDb, closeTestDb };