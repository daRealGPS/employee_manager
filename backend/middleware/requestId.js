const { randomUUID } = require("crypto");

const requestIdMiddleware = (req, res, next) => {
  const incoming = req.headers["x-request-id"];
  const requestId = typeof incoming === "string" && incoming.length > 0 ? incoming : randomUUID();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  next();
};

module.exports = { requestIdMiddleware };
