const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authorization');
const router = express.Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/profile', authenticateToken, AuthController.getProfile);

module.exports = router;
