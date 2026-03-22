const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
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
  });
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
  keyGenerator: req => {
    const u = String(req.body?.username ?? "").trim().toLowerCase();
    return u ? `user:${u}` : ipKeyGenerator(req.ip);
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
  keyGenerator: req => {
    if (req.user?.userId) {
      return `user:${req.user.userId}`;
    }
    return ipKeyGenerator(req.ip);
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
  keyGenerator: req => {
    if (req.user?.userId) {
      return `user:${req.user.userId}`;
    }
    return ipKeyGenerator(req.ip);
  },
  handler: (req, res) => {
    auditRateLimitHit(req, "task_status_per_user");
    res.status(429).json({ error: "Too many task updates. Try again later." });
  },
});

const globalApiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    auditRateLimitHit(req, "global_api");
    res.status(429).json({ error: "Too many requests. Try again later." });
  },
});

const employerWriteLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    if (req.user?.userId) {
      return `user:${req.user.userId}`;
    }
    return ipKeyGenerator(req.ip);
  },
  handler: (req, res) => {
    auditRateLimitHit(req, "employer_write");
    res.status(429).json({ error: "Too many write actions. Try again later." });
  },
});

const demoResetLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    if (req.user?.userId) {
      return `user:${req.user.userId}`;
    }
    return ipKeyGenerator(req.ip);
  },
  handler: (req, res) => {
    auditRateLimitHit(req, "demo_reset");
    res.status(429).json({ error: "Too many reset attempts. Try again later." });
  },
});

module.exports = {
  loginLimiterPerIp,
  loginLimiterPerUsername,
  attendanceLimiterPerUser,
  taskStatusLimiterPerUser,
  globalApiLimiter,
  employerWriteLimiter,
  demoResetLimiter,
};