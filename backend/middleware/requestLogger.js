const { stripQuery } = require("../utils/sanitizeLogs");

const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const latencyMs = Number(end - start) / 1_000_000;

    // baseUrl is the mount point of the router
    // route.path is the defined route path within the router
    const route =
      req.route && req.route.path
        ? `${req.baseUrl || ""}${req.route.path}`
        : stripQuery(req.originalUrl);

    const log = {
      type: "request",
      timestamp: new Date().toISOString(),
      request_id: req.requestId ?? null,
      method: req.method,
      route,
      status_code: res.statusCode,
      latency_ms: Math.round(latencyMs),
      user_id: req.user?.userId ?? null,
    };

    console.log(JSON.stringify(log));
  });

  next();
};

module.exports = { requestLogger };
