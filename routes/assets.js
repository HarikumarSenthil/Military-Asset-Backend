const express = require('express');
const { body } = require('express-validator');
const assetController = require('../controllers/assetController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/assets - Create a new asset
router.post(
  '/',
  authenticateToken,
  [
    body('equipment_type_id').notEmpty().withMessage('Equipment type is required'),
    body('model_name').notEmpty().withMessage('Model name is required'),
    body('initial_balance').isNumeric().withMessage('Initial balance must be a number'),
    body('base_id').notEmpty().withMessage('Base ID is required'),
  ],
  assetController.createAsset
);

// GET /api/assets - Get all assets with optional filters
router.get('/', authenticateToken, assetController.getAllAssets);

// GET /api/assets/:assetId - Get asset by ID
router.get('/:assetId', authenticateToken, assetController.getAssetById);

// GET /api/assets/metrics/dashboard - Get asset dashboard metrics
router.get('/metrics/dashboard', authenticateToken, assetController.getDashboardMetrics);

// PUT /api/assets/:assetId/balance - Update asset balance
router.put(
  '/:assetId/balance',
  authenticateToken,
  [body('balance').isNumeric().withMessage('Balance must be a valid number')],
  assetController.updateAssetBalance
);

module.exports = router;
