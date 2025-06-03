const express = require('express');
const { body, param } = require('express-validator');
const { verifyToken, isEmployer } = require('../middleware/auth');
const { sanitizeFields } = require('../middleware/sanitizeFields');
const { handleValidationErrors } = require('../middleware/validation');
const { 
  markAttendance, getEmployeeAttendance, getTodayAttendance 
} = require('../controllers/attendanceController');
const { attendanceLimiterPerUser } = require("../middleware/rateLimiters");
const { asyncHandler } = require('../middleware/asyncHandler');
const router = express.Router();

router.post(
  "/mark",
  verifyToken,
  attendanceLimiterPerUser,
  sanitizeFields(["photo_url"]), // do NOT sanitize numbers
  [
    body("photo_url").trim().notEmpty().withMessage("Photo URL is required"),
    body("latitude").isFloat({ min: -90, max: 90 }).toFloat().withMessage("Invalid latitude"),
    body("longitude").isFloat({ min: -180, max: 180 }).toFloat().withMessage("Invalid longitude"),
    body("accuracy_m").optional().isFloat({ min: 0, max: 10000 }).toFloat().withMessage("Invalid accuracy"),
  ],
  handleValidationErrors,
  asyncHandler(markAttendance)
);

router.get(
  '/today',
  verifyToken,
  isEmployer,
  asyncHandler(getTodayAttendance)
);

router.get(
  '/:id',
  verifyToken,
  isEmployer,
  [param("id").isInt().toInt().withMessage('ID must be an integer')],
  handleValidationErrors,
  asyncHandler(getEmployeeAttendance)
);


module.exports = router;
