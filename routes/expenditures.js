// routes/expenditureRoutes.js
const express = require('express');
const { body } = require('express-validator');
const expenditureController = require('../controllers/expenditureController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/',
  authenticateToken,
  [
    body('asset_id').notEmpty().withMessage('Asset ID is required'),
    body('quantity_expended').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('expenditure_date').isISO8601().withMessage('Valid expenditure date is required'),
    body('base_id').notEmpty().withMessage('Base ID is required'),
    body('reason').notEmpty().withMessage('Reason is required')
  ],
  expenditureController.createExpenditure
);

router.get('/', authenticateToken, expenditureController.getAllExpenditures);
router.get('/:expenditureId', authenticateToken, expenditureController.getExpenditureById);

module.exports = router;
