const { sanitizeInput } = require('../utils/sanitize');

const sanitizeFields = (fields, location = 'body') => (req, res, next) => {
  for (const field of fields) {
    if (req[location] && req[location][field]) {
      req[location][field] = sanitizeInput(req[location][field]);
    }
  }
  next();
};

module.exports = { sanitizeFields };
