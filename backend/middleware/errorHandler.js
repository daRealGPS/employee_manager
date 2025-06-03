const { AppError } = require("../utils/AppError");

const errorHandler = (err, req, res, next) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  if (statusCode >= 500) {
    console.error("Unhandled error:", {
      timestamp: new Date().toISOString(),
      requestId: req.requestId || null,
      path: req.originalUrl,
      user_id: req.user?.userId ?? null,
      method: req.method,
      message: err.message,
      stack: err.stack,
    });
  }

  const message =
    err instanceof AppError
      ? err.message
      : "Something went wrong, please try again later.";

  res.status(statusCode).json({ error: message });
};

module.exports = { errorHandler };
