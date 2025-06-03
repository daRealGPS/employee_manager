const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { auditLog } = require('../utils/audit');
const { AppError } = require('../utils/AppError');

const login = async (req, res) => {
  const { username, password } = req.body;

  const { rows } = await pool.query(
    'SELECT id, username, password, role FROM users WHERE username = $1',
    [username]
  );

  if (rows.length === 0) {
    auditLog({
      req,
      action: "auth.login.failure",
      success: false,
      statusCode: 401,
      metadata: { reason: "user_not_found" },
      actorUserId: null,
      actorRole: null,
    });

    throw new AppError(401, "Invalid credentials");
  }

  const user = rows[0];
  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    auditLog({
      req,
      action: "auth.login.failure",
      success: false,
      statusCode: 401,
      metadata: { reason: "bad_password" },
      actorUserId: user.id,
      actorRole: user.role,
    });
    
    throw new AppError(401, "Invalid credentials");
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  auditLog({
    req,
    action: "auth.login.success",
    success: true,
    statusCode: 200,
    metadata: {},
    actorUserId: user.id,
    actorRole: user.role,
  });

  // default 200 status is fine for successful login
  res.json({ token });
};


module.exports = { login };
