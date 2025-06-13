// CONTROLLERS/ASSETCONTROLLER.JS

const Asset = require('../models/Asset');
const { validationResult } = require('express-validator');
const { logger } = require('../utils/helpers');
const { recordAudit } = require('../utils/auditHelper');

// Create new asset
const createAsset = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const asset = await Asset.create(req.body);

    logger.info(`New asset created: ${asset.asset_id} by ${req.user.username}`);


    await recordAudit({
      req,
      action: 'Asset Created',
      details: {
        asset_id: asset.asset_id,
        asset_name: asset.asset_name,
        quantity: asset.quantity,
        unit_cost: asset.unit_cost,
        total_cost: asset.total_cost
      }
    });

    res.status(201).json({
      message: 'Asset created successfully',
      asset,
    });
  } catch (error) {
    logger.error('Create asset error:', error);
    res.status(500).json({ message: 'Failed to create asset', error: error.message });
  }
};

// Get all assets with optional filters
const getAllAssets = async (req, res) => {
  try {
    const filters = {
      base_id: req.query.base_id,
      equipment_type: req.query.equipment_type,
      status: req.query.status,
    };

    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined) delete filters[key];
    });

    const assets = await Asset.getAll(filters);

    res.json({ assets });
  } catch (error) {
    logger.error('Get all assets error:', error);
    res.status(500).json({ message: 'Failed to get assets', error: error.message });
  }
};

// Get single asset by ID
const getAssetById = async (req, res) => {
  try {
    const { assetId } = req.params;
    const asset = await Asset.findById(assetId);

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    res.json({ asset });
  } catch (error) {
    logger.error('Get asset by ID error:', error);
    res.status(500).json({ message: 'Failed to get asset', error: error.message });
  }
};

// Get dashboard metrics (e.g. for analytics)
const getDashboardMetrics = async (req, res) => {
  try {
    const filters = {
      base_id: req.query.base_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
    };

    const metrics = await Asset.getDashboardMetrics(filters);

    res.json({ metrics });
  } catch (error) {
    logger.error('Get dashboard metrics error:', error);
    res.status(500).json({ message: 'Failed to get dashboard metrics', error: error.message });
  }
};

// Update asset balance
const updateAssetBalance = async (req, res) => {
  try {
    const { assetId } = req.params;
    const { balance } = req.body;

    if (typeof balance !== 'number' || balance < 0) {
      return res.status(400).json({ message: 'Invalid balance value' });
    }

    await Asset.updateBalance(assetId, balance);

    logger.info(`Asset balance updated for ${assetId} to ${balance}`);

    await recordAudit({
      req,
      action: 'Asset Balance Updated',
      details: {
        asset_id: assetId,
        new_balance: balance
      }
    });

    res.json({ message: 'Asset balance updated successfully' });
  } catch (error) {
    logger.error('Update asset balance error:', error);
    res.status(500).json({ message: 'Failed to update balance', error: error.message });
  }
};

module.exports = {
  createAsset,
  getAllAssets,
  getAssetById,
  getDashboardMetrics,
  updateAssetBalance,
};
