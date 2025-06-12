const Purchase = require('../models/purchase');
const { validationResult } = require('express-validator');
const { logger } = require('../utils/helpers');
const { recordAudit } = require('../utils/auditHelper');

// Create a new purchase
const createPurchase = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const purchaseData = {
      asset_id: req.body.asset_id,
      quantity: req.body.quantity_purchased,
      unit_cost: req.body.unit_cost,
      total_cost: req.body.total_cost,
      purchase_date: req.body.purchase_date,
      supplier_info: req.body.vendor,
      receiving_base_id: req.body.base_id,
      purchase_order_number: req.body.purchase_order_number || null,
      recorded_by_user_id: req.user.user_id
    };

    const purchase = await Purchase.create(purchaseData);

    logger.info(`Purchase created: ${purchase.purchase_id} by user ${req.user.username}`);

    // ✅ Audit log
    await recordAudit({
      req,
      action: 'Purchase Created',
      details: {
        purchase_id: purchase.purchase_id,
        asset_id: purchase.asset_id,
        quantity: purchase.quantity,
        total_cost: purchase.total_cost,
        base_id: purchase.receiving_base_id,
        recorded_by_user_id: req.user.user_id
      }
    });

    res.status(201).json({
      message: 'Purchase recorded successfully',
      purchase
    });
  } catch (error) {
    logger.error('Create purchase error:', error);
    res.status(500).json({ message: 'Failed to record purchase', error: error.message });
  }
};

// Get all purchases with optional filters
const getAllPurchases = async (req, res) => {
  try {
    const filters = {
      base_id: req.query.base_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date
    };

    const purchases = await Purchase.getAll(filters);

    res.json({ purchases });
  } catch (error) {
    logger.error('Get all purchases error:', error);
    res.status(500).json({ message: 'Failed to fetch purchases', error: error.message });
  }
};

// Get a specific purchase by ID
const getPurchaseById = async (req, res) => {
  try {
    const { purchaseId } = req.params;

    const purchase = await Purchase.findById(purchaseId);

    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    res.json({ purchase });
  } catch (error) {
    logger.error('Get purchase by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch purchase', error: error.message });
  }
};

module.exports = {
  createPurchase,
  getAllPurchases,
  getPurchaseById
};
