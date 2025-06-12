// MIDDLEWARE/AUTH.JS
// ========================================
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger } = require('../utils/helpers');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = {
      ...user,
      roles: user.roles ? user.roles.split(',') : [],
      bases: user.bases ? user.bases.split(',') : []
    };
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { authenticateToken };