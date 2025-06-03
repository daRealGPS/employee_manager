// routes/employees.js
const express = require('express');
const { body } = require('express-validator');
const { verifyToken, isEmployer } = require('../middleware/auth');
const { sanitizeFields } = require('../middleware/sanitizeFields');
const { handleValidationErrors } = require('../middleware/validation');
const {
  createEmployee,
  listEmployees,
  deleteEmployee,
  updateEmployee
} = require('../controllers/employeeController');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

router.post(
  '/create',
  verifyToken,
  isEmployer,
  sanitizeFields(['username', 'password']),
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],
  handleValidationErrors,
  asyncHandler(createEmployee)
);

router.get(
  '/list',
  verifyToken,
  isEmployer,
  asyncHandler(listEmployees)
);

router.delete(
  '/delete',
  verifyToken,
  isEmployer,
  [
    body('id').isInt().toInt().withMessage('ID must be an integer'),
  ],
  handleValidationErrors,
  asyncHandler(deleteEmployee)
);

router.put(
  '/update',
  verifyToken,
  isEmployer,
  sanitizeFields(['username', 'newUsername', 'newPassword']),
  [  
    body('id').isInt().toInt().withMessage('ID must be an integer'),
    body('username').trim().notEmpty().withMessage('Current username is required'),
    body('newUsername').optional().trim(),
    body('newPassword').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  handleValidationErrors,
  asyncHandler(updateEmployee)
);

module.exports = router;
