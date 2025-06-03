const jwt = require('jsonwebtoken');
const { AppError } = require("../utils/AppError");

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) throw new AppError(401, "Not authorized");

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    throw new AppError(403, "Invalid or expired token");
  }
}


function isEmployer(req, res, next) {
  if (req.user.role !== 'employer') {
    return res.status(403).json({ error: 'Access denied — employers only' });
  }
  
  next();
}

module.exports = { verifyToken, isEmployer };
