const pool = require('../db');
const bcrypt = require('bcrypt');

const { auditLog } = require("../utils/audit");
const { AppError } = require("../utils/AppError");

const createEmployee = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id`,
      [username, hashed, 'employee']
    );

    const newUserId = rows[0]?.id ?? null;

    auditLog({
      req,
      action: "employee.create",
      targetType: "user",
      targetId: newUserId,
      success: true,
      statusCode: 201,
      metadata: { role: "employee" },
    })

    res.status(201).json({ message: 'Employee created successfully' });
  } catch (err) {
    if (err.code === '23505') {
      auditLog({
        req,
        action: "employee.create",
        targetType: "user",
        targetId: null,
        success: false,
        statusCode: 400,
        metadata: { reason: "username_exists" },
      });
      
      throw new AppError(409, "Username already exists");
    }

    throw err;
  }
};  

const listEmployees = async (req, res, next) => {
  const { rows } = await pool.query(
    `SELECT id, username FROM users WHERE role = 'employee'`
  );

  res.status(200).json({ employees: rows });
};

const deleteEmployee = async (req, res, next) => {
  const { id } = req.body;
  const { rowCount } = await pool.query(`DELETE FROM users 
                                        WHERE id = $1 AND role = $2`,
                                        [id, 'employee']);

  // gotta use rowCount to check cuz rows will be empty array
  if (rowCount === 0) {
    throw new AppError(404, "Employee not found");
  }

  res.status(200).json({ message: 'Employee deleted successfully' });
};

const updateEmployee = async (req, res) => {
  const { id, username, newUsername, newPassword } = req.body;
  const updates = [];
  const values = [];

  try {
    if (newUsername) {
      updates.push("username = $" + (updates.length + 1));
      values.push(newUsername);
    }

    if (newPassword) {
      const hashed = await bcrypt.hash(newPassword, 10);
      updates.push("password = $" + (updates.length + 1));
      values.push(hashed);
    }

    if (updates.length === 0) {
      throw new AppError(400, "No updates provided");
    }

    values.push(id);
    values.push(username);

    const query = `
      UPDATE users
      SET ${updates.join(", ")}
      WHERE id = $${values.length - 1}
        AND username = $${values.length}
        AND role = 'employee'
      RETURNING id`;

    const { rowCount } = await pool.query(query, values);

    if (rowCount === 0) {
      throw new AppError(404, "Employee not found");
    }

    auditLog({
      req,
      action: "employee.update",
      targetType: "user",
      targetId: id,
      success: true,
      statusCode: 200,
      metadata: { oldUsername: username, newUsername: newUsername || username },
    });

    res.status(200).json({ message: "Employee updated successfully" });
  } catch (err) {
    if (err.code === "23505") {
      throw new AppError(409, "Username already exists");
    }
    throw err;
  }
};

module.exports = { createEmployee, listEmployees, deleteEmployee, updateEmployee };
