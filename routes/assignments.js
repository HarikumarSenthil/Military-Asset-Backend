// routes/assignmentRoutes.js
const express = require('express');
const { body } = require('express-validator');
const assignmentController = require('../controllers/assignmentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/',
  authenticateToken,
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

router.get('/', authenticateToken, assignmentController.getAllAssignments);
router.get('/:assignmentId', authenticateToken, assignmentController.getAssignmentById);
router.patch('/:assignmentId/return', authenticateToken, assignmentController.returnAssignedAsset);

module.exports = router;
