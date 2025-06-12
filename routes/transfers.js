const express = require('express');
const { body } = require('express-validator');
const transferController = require('../controllers/transferController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/',
  authenticateToken,
  [
    body('asset_id').notEmpty(),
    body('asset_serial_number').notEmpty(),
    body('quantity').isInt({ min: 1 }),
    body('source_base_id').notEmpty(),
    body('destination_base_id').notEmpty(),
    body('transfer_date').isISO8601(),
    body('reason').notEmpty()
  ],
  transferController.createTransfer
);

router.get('/', authenticateToken, transferController.getAllTransfers);
router.get('/:transferId', authenticateToken, transferController.getTransferById);
router.patch('/:transferId/status', authenticateToken, transferController.updateTransferStatus);

module.exports = router;
