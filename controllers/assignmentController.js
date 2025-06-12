const Assignment = require('../models/Assignment');
const { validationResult } = require('express-validator');
const { logger } = require('../utils/helpers');
const { recordAudit } = require('../utils/auditHelper');

// Create a new assignment
const createAssignment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const assignmentData = {
      ...req.body,
      recorded_by_user_id: req.user.user_id
    };

    const assignment = await Assignment.create(assignmentData);

    logger.info(`Asset assigned: ${assignment.assignment_id} to user ${assignment.assigned_to_user_id}`);

    // ✅ Audit log
    await recordAudit({
      req,
      action: 'Asset Assigned',
      details: {
        assignment_id: assignment.assignment_id,
        asset_id: assignment.asset_id,
        assigned_to_user_id: assignment.assigned_to_user_id,
        assigned_date: assignment.assigned_date
      }
    });

    res.status(201).json({
      message: 'Asset assigned successfully',
      assignment
    });
  } catch (error) {
    logger.error('Create assignment error:', error);
    res.status(500).json({ message: 'Failed to create assignment', error: error.message });
  }
};

// Get all assignments (with optional filters)
const getAllAssignments = async (req, res) => {
  try {
    const filters = {
      base_id: req.query.base_id,
      is_active: req.query.is_active !== undefined ? Number(req.query.is_active) : undefined,
      assigned_to_user_id: req.query.assigned_to_user_id
    };

    const assignments = await Assignment.getAll(filters);
    res.json({ assignments });
  } catch (error) {
    logger.error('Get all assignments error:', error);
    res.status(500).json({ message: 'Failed to fetch assignments', error: error.message });
  }
};

// Get a specific assignment by ID
const getAssignmentById = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({ assignment });
  } catch (error) {
    logger.error('Get assignment by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch assignment', error: error.message });
  }
};

// Mark an assignment as returned
const returnAssignedAsset = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { returned_date } = req.body;

    if (!returned_date) {
      return res.status(400).json({ message: 'Returned date is required' });
    }

    await Assignment.returnAsset(assignmentId, returned_date);

    logger.info(`Asset returned for assignment ID: ${assignmentId}`);

    // ✅ Audit log
    await recordAudit({
      req,
      action: 'Asset Returned',
      details: {
        assignment_id: assignmentId,
        returned_date
      }
    });

    res.json({ message: 'Asset return recorded successfully' });
  } catch (error) {
    logger.error('Return asset error:', error);
    res.status(500).json({ message: 'Failed to mark asset as returned', error: error.message });
  }
};

module.exports = {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  returnAssignedAsset
};
