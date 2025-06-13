const express = require('express');
const baseController = require('../controllers/baseController');
const { authenticateToken } = require('../middleware/authorization');
const { checkRole } = require('../middleware/rbac');

const router = express.Router();

// Create a new base (Admins only)
router.post('/', authenticateToken, checkRole(['Admin']), baseController.createBase);

// Get all bases
router.get('/', authenticateToken, baseController.getAllBases);

// Get base by ID
router.get('/:baseId', authenticateToken, baseController.getBaseById);

// Get all bases assigned to a user
router.get('/user/:userId', authenticateToken, baseController.getUserBases);

module.exports = router;
