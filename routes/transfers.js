const express = require('express');
const { body } = require('express-validator');
const transferController = require('../controllers/transferController');
const { authenticateToken } = require('../middleware/authorization');
const { checkRole, checkBaseAccess } = require('../middleware/rbac'); 

const router = express.Router();

// Route: POST /api/transfers
router.post(
  '/',
  authenticateToken,
  checkRole(['Admin', 'Logistics Officer']), 
  checkBaseAccess, 
  [
    body('asset_id').notEmpty().withMessage('Asset ID is required'),
    body('asset_serial_number').notEmpty().withMessage('Asset serial number is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('source_base_id').notEmpty().withMessage('Source base ID is required'),
    body('destination_base_id').notEmpty().withMessage('Destination base ID is required'),
    body('transfer_date').isISO8601().withMessage('Valid transfer date is required'),
    body('reason').notEmpty().withMessage('Reason is required')
  ],
  transferController.createTransfer
);

// Route: GET /api/transfers
router.get(
  '/',
  authenticateToken,
  checkBaseAccess, 
  transferController.getAllTransfers
);

// Route: GET /api/transfers/:transferId
router.get(
  '/:transferId',
  authenticateToken,
  transferController.getTransferById
);

// Route: PATCH /api/transfers/:transferId/status
router.patch(
  '/:transferId/status',
  authenticateToken,
  checkRole(['Admin', 'Receiving Officer']), 
  transferController.updateTransferStatus
);

module.exports = router;
