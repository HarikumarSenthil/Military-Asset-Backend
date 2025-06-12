const Transfer = require('../models/Transfer');
const { validationResult } = require('express-validator');
const { logger } = require('../utils/helpers');
const { recordAudit } = require('../utils/auditHelper');

// Create a new transfer
const createTransfer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const transferData = {
      ...req.body,
      initiated_by_user_id: req.user.user_id
    };

    const transfer = await Transfer.create(transferData);

    logger.info(`Transfer initiated: ${transfer.transfer_id} by ${req.user.username}`);

    // ✅ Audit log for transfer creation
    await recordAudit({
      req,
      action: 'Transfer Created',
      details: {
        transfer_id: transfer.transfer_id,
        asset_id: transfer.asset_id,
        from_base_id: transfer.from_base_id,
        to_base_id: transfer.to_base_id,
        quantity: transfer.quantity,
        initiated_by_user_id: transfer.initiated_by_user_id
      }
    });

    res.status(201).json({
      message: 'Transfer initiated successfully',
      transfer
    });
  } catch (error) {
    logger.error('Create transfer error:', error);
    res.status(500).json({ message: 'Failed to initiate transfer', error: error.message });
  }
};

// Get all transfers with optional filters
const getAllTransfers = async (req, res) => {
  try {
    const filters = {
      base_id: req.query.base_id,
      status: req.query.status
    };

    const transfers = await Transfer.getAll(filters);

    res.json({ transfers });
  } catch (error) {
    logger.error('Get all transfers error:', error);
    res.status(500).json({ message: 'Failed to fetch transfers', error: error.message });
  }
};

// Get a specific transfer by ID
const getTransferById = async (req, res) => {
  try {
    const { transferId } = req.params;

    const transfer = await Transfer.findById(transferId);

    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }

    res.json({ transfer });
  } catch (error) {
    logger.error('Get transfer by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch transfer', error: error.message });
  }
};

// Update transfer status (e.g., completed or cancelled)
const updateTransferStatus = async (req, res) => {
  try {
    const { transferId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const receivedByUserId = status === 'Completed' ? req.user.user_id : null;

    await Transfer.updateStatus(transferId, status, receivedByUserId);

    logger.info(`Transfer ${transferId} marked as ${status} by ${req.user.username}`);

    // ✅ Audit log for status update
    await recordAudit({
      req,
      action: `Transfer Status Updated to ${status}`,
      details: {
        transfer_id: transferId,
        updated_by: req.user.user_id,
        new_status: status
      }
    });

    res.json({ message: `Transfer status updated to ${status}` });
  } catch (error) {
    logger.error('Update transfer status error:', error);
    res.status(500).json({ message: 'Failed to update transfer status', error: error.message });
  }
};

module.exports = {
  createTransfer,
  getAllTransfers,
  getTransferById,
  updateTransferStatus
};
