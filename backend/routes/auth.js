const express = require('express');
const { body } = require('express-validator');
const { login } = require('../controllers/authController');
const { handleValidationErrors } = require('../middleware/validation');
const { loginLimiterPerIp, loginLimiterPerUsername } = require("../middleware/rateLimiters");
const { asyncHandler } = require('../middleware/asyncHandler');
const router = express.Router();

// router.post(
//   '/register',
//   [
//     body('name').trim().notEmpty().withMessage('Name is required'),
//     body('password')
//       .isLength({ min: 6 })
//       .withMessage('Password must be at least 6 characters long')
//   ],
//   registerEmployer
// );

router.post(
  '/login',
  loginLimiterPerIp,
  loginLimiterPerUsername,
  [
    body('username').trim().notEmpty().withMessage('Name is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  handleValidationErrors,
  asyncHandler(login)
);

module.exports = router;
