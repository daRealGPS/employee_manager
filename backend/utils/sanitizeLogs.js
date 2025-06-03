const MAX_STR = 300;

const truncate = (value, max = MAX_STR) => {
  if (value === null || value === undefined) return value;
  const s = String(value);
  return s.length > max ? `${s.slice(0, max)}...[TRUNCATED]` : s;

};

const stripQuery = (url) => {
  if (!url) return url;
  const s = String(url);
  const q = s.indexOf("?");
  return q === -1 ? s : s.slice(0, q);
};

// For error messages. Keeps it short and avoids huge dumps.
const sanitizeErrorMessage = (msg) => truncate(msg, 500);

module.exports = {
  truncate,
  stripQuery,
  sanitizeErrorMessage,
};
