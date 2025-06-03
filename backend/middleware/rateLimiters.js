const rateLimit = require("express-rate-limit");
const { auditLog } = require("../utils/audit");

const auditRateLimitHit = (req, scope) => {
  return auditLog({
    req,
    action: "ratelimit.hit",
    targetType: null,
    targetId: null,
    success: false,
    statusCode: 429,
    metadata: { scope },
  })
};

const loginLimiterPerIp = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    auditRateLimitHit(req, "login_per_ip");
    res.status(429).json({ error: "Too many login attempts. Try again later." });
  },
});

const loginLimiterPerUsername = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    const u = String(req.body?.username ?? "").trim().toLowerCase();
    return u ? `user:${u}` : rateLimit.ipKeyGenerator(req, res);
  },
  handler: (req, res) => {
    auditRateLimitHit(req, "login_per_username");
    res.status(429).json({ error: "Too many login attempts. Try again later." });
  },
});

const attendanceLimiterPerUser = rateLimit({
  windowMs: 60 * 1000,
  max: 2,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    if (req.user?.userId) {
      return `user:${req.user.userId}`;
    }
    return rateLimit.ipKeyGenerator(req, res);
  },
  handler: (req, res) => {
    auditRateLimitHit(req, "attendance_per_user");
    res.status(429).json({ error: "Too many attendance submissions. Try again later." });
  },
});

const taskStatusLimiterPerUser = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    if (req.user?.userId) {
      return `user:${req.user.userId}`;
    }
    return rateLimit.ipKeyGenerator(req, res);
  },
  handler: (req, res) => {
    auditRateLimitHit(req, "task_status_per_user");
    res.status(429).json({ error: "Too many task updates. Try again later." });
  },
});

module.exports = {
  loginLimiterPerIp,
  loginLimiterPerUsername,
  attendanceLimiterPerUser,
  taskStatusLimiterPerUser,
};
