const express = require("express");
const { verifyToken, isEmployer } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/asyncHandler");
const { demoResetLimiter } = require("../middleware/rateLimiters");
const { resetDemoData } = require("../controllers/demoController");

const router = express.Router();

router.post(
  "/reset",
  verifyToken,
  isEmployer,
  demoResetLimiter,
  asyncHandler(resetDemoData)
);

module.exports = router;