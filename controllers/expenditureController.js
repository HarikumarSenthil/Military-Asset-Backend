const Expenditure = require('../models/Expenditure');
const { validationResult } = require('express-validator');
const { logger } = require('../utils/helpers');
const { recordAudit } = require('../utils/auditHelper');

// Create a new expenditure record
const createExpenditure = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const expenditureData = {
      ...req.body,
      reported_by_user_id: req.user.user_id
    };

    const expenditure = await Expenditure.create(expenditureData);

    logger.info(`Expenditure recorded: ${expenditure.expenditure_id} for asset ${expenditure.asset_id}`);


    await recordAudit({
      req,
      action: 'Expenditure Created',
      details: {
        expenditure_id: expenditure.expenditure_id,
        asset_id: expenditure.asset_id,
        amount: expenditure.amount,
        reported_by_user_id: req.user.user_id
      }
    });

    res.status(201).json({
      message: 'Expenditure recorded successfully',
      expenditure
    });
  } catch (error) {
    logger.error('Create expenditure error:', error);
    res.status(500).json({ message: 'Failed to record expenditure', error: error.message });
  }
};

// Get all expenditures (with optional filters)
const getAllExpenditures = async (req, res) => {
  try {
    const filters = {
      base_id: req.query.base_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date
    };

    const expenditures = await Expenditure.getAll(filters);
    res.json({ expenditures });
  } catch (error) {
    logger.error('Get all expenditures error:', error);
    res.status(500).json({ message: 'Failed to fetch expenditures', error: error.message });
  }
};

// Get a specific expenditure by ID
const getExpenditureById = async (req, res) => {
  try {
    const { expenditureId } = req.params;

    const expenditure = await Expenditure.findById(expenditureId);

    if (!expenditure) {
      return res.status(404).json({ message: 'Expenditure not found' });
    }

    res.json({ expenditure });
  } catch (error) {
    logger.error('Get expenditure by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch expenditure', error: error.message });
  }
};

module.exports = {
  createExpenditure,
  getAllExpenditures,
  getExpenditureById
};
