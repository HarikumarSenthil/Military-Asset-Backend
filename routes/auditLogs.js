const express = require('express');
const { body } = require('express-validator');
const auditLogController = require('../controllers/auditLogController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/audit-logs
router.get('/', authenticateToken, auditLogController.getAllAuditLogs);

// POST /api/audit-logs (optional, only if you want to create logs manually)
router.post(
  '/',
  authenticateToken,
  [
    body('action').notEmpty().withMessage('Action is required'),
    body('details').optional(),
    body('status').optional()
  ],
  auditLogController.createAuditLog
);

module.exports = router;
