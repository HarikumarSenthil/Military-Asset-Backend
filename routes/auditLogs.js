const express = require('express');
const { body } = require('express-validator');
const auditLogController = require('../controllers/auditLogController');
const { authenticateToken } = require('../middleware/authorization');
const { checkRole } = require('../middleware/RBAC');

const router = express.Router();

// Only Admins or Auditors can view audit logs
router.get('/', authenticateToken, checkRole(['Admin', 'Auditor']), auditLogController.getAllAuditLogs);

// (Optional) Only Admins can create logs manually
router.post(
  '/',
  authenticateToken,
  checkRole(['Admin']),
  [
    body('action').notEmpty().withMessage('Action is required'),
    body('details').optional(),
    body('status').optional()
  ],
  auditLogController.createAuditLog
);

module.exports = router;
