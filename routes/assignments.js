const express = require('express');
const { body } = require('express-validator');
const assignmentController = require('../controllers/assignmentController');
const { authenticateToken } = require('../middleware/authorization');
const { checkRole, checkBaseAccess } = require('../middleware/RBAC'); 

const router = express.Router();

// POST /api/assignments - Create a new assignment
router.post(
  '/',
  authenticateToken,
  checkRole(['Admin', 'Commander', 'Logistics']), 
  checkBaseAccess, 
  [
    body('asset_id').notEmpty(),
    body('assigned_to_user_id').notEmpty(),
    body('assignment_date').isISO8601(),
    body('base_of_assignment_id').notEmpty(),
    body('purpose').notEmpty(),
    body('expected_return_date').isISO8601()
  ],
  assignmentController.createAssignment
);

// GET /api/assignments - View all assignments
router.get(
  '/',
  authenticateToken,
  checkRole(['Admin', 'Commander', 'Logistics']),
  assignmentController.getAllAssignments
);

// GET /api/assignments/:assignmentId - View one assignment
router.get(
  '/:assignmentId',
  authenticateToken,
  checkRole(['Admin', 'Commander', 'Logistics']),
  assignmentController.getAssignmentById
);

// PATCH /api/assignments/:assignmentId/return - Mark assignment returned
router.patch(
  '/:assignmentId/return',
  authenticateToken,
  checkRole(['Admin', 'Commander']),
  assignmentController.returnAssignedAsset
);

module.exports = router;
