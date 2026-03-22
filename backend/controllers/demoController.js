const pool = require("../db");
const bcrypt = require("bcrypt");
const { auditLog } = require("../utils/audit");
const { AppError } = require("../utils/AppError");

const seedDemoData = async client => {
  const employerUsername = process.env.DEMO_EMPLOYER_USERNAME || "demo";
  const employerPassword = process.env.DEMO_EMPLOYER_PASSWORD || "demo123";

  const employeeNames = ["alex", "jamie", "morgan", "taylor", "casey"];

  const employerHash = await bcrypt.hash(employerPassword, 10);
  const employeeHash = await bcrypt.hash("employee123", 10);

  const employerInsert = await client.query(
    `
    INSERT INTO users (username, password, role)
    VALUES ($1, $2, 'employer')
    RETURNING id, username
    `,
    [employerUsername, employerHash]
  );

  const employer = employerInsert.rows[0];

  const employeeIds = [];

  for (const username of employeeNames) {
    const result = await client.query(
      `
      INSERT INTO users (username, password, role)
      VALUES ($1, $2, 'employee')
      RETURNING id, username
      `,
      [username, employeeHash]
    );

    employeeIds.push(result.rows[0]);
  }

  const taskSeed = [
    { userIndex: 0, description: "Check inventory counts for aisle A" },
    { userIndex: 1, description: "Prepare shelf restock summary" },
    { userIndex: 2, description: "Review damaged items list" },
    { userIndex: 3, description: "Confirm supplier delivery arrival" },
    { userIndex: 4, description: "Update low-stock report" },
    { userIndex: 0, description: "Verify barcode labels on new stock" },
  ];

  for (const task of taskSeed) {
    const employee = employeeIds[task.userIndex];
    await client.query(
      `
      INSERT INTO tasks (user_id, description, status)
      VALUES ($1, $2, 'pending')
      `,
      [employee.id, task.description]
    );
  }

  const attendanceSeedUsers = [employeeIds[0], employeeIds[2]];

  for (const employee of attendanceSeedUsers) {
    await client.query(
      `
      INSERT INTO attendance
        (user_id, photo_url, timestamp, latitude, longitude, accuracy_m, distance_m, geofence_ok)
      VALUES
        ($1, $2, now(), $3, $4, $5, $6, true)
      `,
      [
        employee.id,
        "https://placehold.co/600x400",
        Number(process.env.GEOFENCE_LAT),
        Number(process.env.GEOFENCE_LNG),
        15,
        0,
      ]
    );
  }

  return { employer, employeeIds };
};

const resetDemoData = async (req, res) => {
  if (process.env.DEMO_MODE !== "true") {
    throw new AppError(403, "Demo reset is disabled");
  }

  if (req.user?.role !== "employer") {
    throw new AppError(403, "Only employers can reset demo data");
  }

  if (req.user?.username !== process.env.DEMO_EMPLOYER_USERNAME) {
    throw new AppError(403, "Only the demo employer can reset demo data");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`
      TRUNCATE TABLE
        attendance,
        tasks,
        users
      RESTART IDENTITY CASCADE
    `);

    const { employer, employeeIds } = await seedDemoData(client);

    await client.query("COMMIT");

    await auditLog({
      req,
      action: "demo.reset",
      targetType: "system",
      targetId: null,
      success: true,
      statusCode: 200,
      metadata: {
        reseeded_employer_username: employer.username,
        reseeded_employee_count: employeeIds.length,
      },
      actorUserId: null,
      actorRole: "employer",
    });

    return res.status(200).json({ message: "Demo data reset successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { resetDemoData, seedDemoData };