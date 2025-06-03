class AppError extends Error {
  constructor(statusCode, message, code = null, metadata = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.metadata = metadata;
  }
}

module.exports = { AppError };
