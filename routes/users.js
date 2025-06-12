const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth'); 


const router = express.Router();

// GET /api/users - Get all users with pagination
router.get('/', authenticateToken, userController.getAllUsers);

// GET /api/users/:userId - Get a user by ID
router.get('/:userId', authenticateToken, userController.getUserById);

// POST /api/users - Create a new user
router.post(
  '/',
  authenticateToken,
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('full_name').notEmpty().withMessage('Full name is required')
  ],
  userController.createUser
);

// POST /api/users/:userId/roles - Assign role to user
router.post(
  '/:userId/roles',
  authenticateToken,
  [body('roleId').notEmpty().withMessage('Role ID is required')],
  userController.assignRole
);

// POST /api/users/:userId/bases - Assign base to user
router.post(
  '/:userId/bases',
  authenticateToken,
  [body('baseId').notEmpty().withMessage('Base ID is required')],
  userController.assignBase
);

module.exports = router;
