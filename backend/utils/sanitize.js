const sanitizeHtml = require('sanitize-html');

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {}
  }).trim(); // force lowercase + trim
};

module.exports = { sanitizeInput };
