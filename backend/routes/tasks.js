const express = require('express');
const router = express.Router();
const { verifyToken, isEmployer } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { sanitizeFields } = require('../middleware/sanitizeFields');
const { asyncHandler } = require("../middleware/asyncHandler");
const { handleValidationErrors } = require('../middleware/validation');
const { assignTask, getTasks, updateTaskStatus, deleteTask } = require('../controllers/taskController');
const { taskStatusLimiterPerUser, employerWriteLimiter } = require("../middleware/rateLimiters");

router.post(
  '/assign',
  verifyToken,
  isEmployer,
  employerWriteLimiter,
  sanitizeFields(['description']),
  [
    body('id').isInt().toInt().withMessage('ID must be an integer'),
    body('description').notEmpty().withMessage('Task description is required'),
  ],
  handleValidationErrors,
  asyncHandler(assignTask)
);

router.get(
  '/',
  verifyToken,
  [
    query('id').optional().isInt().toInt().withMessage('ID must be an integer'),
  ],
  handleValidationErrors,
  asyncHandler(getTasks)
);

router.put(
  '/:taskId/status',
  verifyToken,
  taskStatusLimiterPerUser,
  sanitizeFields(['status']),
  [
    param('taskId').isInt().toInt().withMessage('Task ID must be an integer'),
    body('status').isIn(['pending', 'done']).withMessage('Invalid status'),
  ],
  handleValidationErrors,
  asyncHandler(updateTaskStatus)
);

router.delete(
  '/:taskId',
  verifyToken,
  isEmployer,
  employerWriteLimiter,
  [
    param('taskId').isInt().toInt().withMessage('Task ID must be an integer'),
  ],
  handleValidationErrors,
  asyncHandler(deleteTask)
);

module.exports = router;