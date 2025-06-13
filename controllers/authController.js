const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { logger } = require('../utils/helpers');
const { recordAudit } = require('../utils/auditHelper');

const generateToken = ({ user_id, username, roles }) => {
  return jwt.sign(
    {
      userId: user_id,
      username,
      roles, 
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};


const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, email, full_name } = req.body;
    // Check if user already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const user = await User.create({ username, password, email, full_name });
    const token = generateToken(user.user_id);

    logger.info(`New user registered: ${username}`);

    await recordAudit({
      req,
      action: 'User Registration',
      details: {
        user_id: user.user_id,
        username: user.username,
        email: user.email
      }
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const user = await User.findByUsername(username);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await User.validatePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userWithRoles = await User.findById(user.user_id);
    const roles = userWithRoles.roles ? userWithRoles.roles.split(',') : [];

    // Pass roles into the token
    const token = generateToken({
      user_id: user.user_id,
      username: user.username,
      roles,
    });

    logger.info(`User logged in: ${username}`);

    await recordAudit({
      req,
      action: 'User Login',
      details: {
        user_id: user.user_id,
        username: user.username,
      },
    });

    // Send token in cookie and JSON response
    res
      .cookie('token', token, {
        httpOnly: true,
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        message: 'Login successful',
        token, // also send token in body if frontend wants to store it
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          roles,
          bases: userWithRoles.bases ? userWithRoles.bases.split(',') : [],
        },
      });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        roles: user.roles ? user.roles.split(',') : [],
        bases: user.bases ? user.bases.split(',') : [],
        created_at: user.created_at
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
};

module.exports = { register, login, getProfile };
