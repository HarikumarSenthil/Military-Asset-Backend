const express = require('express');
const { body } = require('express-validator');
const purchaseController = require('../controllers/purchaseController');
const { authenticateToken } = require('../middleware/auth');


const router = express.Router();

// Route: POST /api/purchases
// Description: Create a new purchase
router.post(
  '/',
  authenticateToken,
  [
    body('asset_id').notEmpty().withMessage('Asset ID is required'),
    body('quantity_purchased').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('purchase_date').isISO8601().withMessage('Valid purchase date is required'),
    body('base_id').notEmpty().withMessage('Base ID is required'),
    body('vendor').notEmpty().withMessage('Vendor is required')
  ],
  purchaseController.createPurchase
);

// Route: GET /api/purchases
// Description: Get all purchases (with optional filters)
router.get('/', authenticateToken, purchaseController.getAllPurchases);

// Route: GET /api/purchases/:purchaseId
// Description: Get a single purchase by ID
router.get('/:purchaseId', authenticateToken, purchaseController.getPurchaseById);

module.exports = router;
