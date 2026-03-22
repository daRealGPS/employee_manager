const pool = require("../db");
const { seedDemoData } = require("../controllers/demoController");

async function main() {
  const client = await pool.connect();
  try {

    await client.query("BEGIN");

    await client.query(`
      TRUNCATE TABLE
        attendance,
        tasks,
        audit_logs,
        users
      RESTART IDENTITY CASCADE
    `);

    await seedDemoData(client);

    await client.query("COMMIT");
    console.log("Demo database seeded successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Failed to seed demo database:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();