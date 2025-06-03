const pool = require('../../db');
const bcrypt = require('bcrypt');

const seedDb = async () => {
  const employerPassword = await bcrypt.hash('bosspass123', 10);
  const employeePassword = await bcrypt.hash('employeepass123', 10);

  await pool.query(
    `INSERT INTO users (username, password, role)
     VALUES ($1, $2, $3), ($4, $5, $6)`,
    [
      'boss',
      employerPassword,
      'employer',
      'worker1',
      employeePassword,
      'employee',
    ]
  );
};

module.exports = { seedDb };