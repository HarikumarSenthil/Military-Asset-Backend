const User = require('../models/User');
const Role = require('../models/Role');
const Base = require('../models/Base');
const { validationResult } = require('express-validator');
const { logger } = require('../utils/helpers');
const { recordAudit } = require('../utils/auditHelper');

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const users = await User.getAll(page, limit);
    
    res.json({
      users: users.map(user => ({
        ...user,
        roles: user.roles ? user.roles.split(',') : []
      })),
      pagination: {
        page,
        limit,
        total: users.length
      }
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({ message: 'Failed to get users', error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        ...user,
        roles: user.roles ? user.roles.split(',') : [],
        bases: user.bases ? user.bases.split(',') : []
      }
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Failed to get user', error: error.message });
  }
};

const assignRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { roleId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    await User.assignRole(userId, roleId);
    
    logger.info(`Role ${role.role_name} assigned to user ${user.username}`);

    // ✅ Audit log
    await recordAudit({
      req,
      action: 'Role Assigned',
      details: {
        user_id: userId,
        assigned_role_id: roleId,
        assigned_by_user_id: req.user.user_id
      }
    });

    res.json({ message: 'Role assigned successfully' });
  } catch (error) {
    logger.error('Assign role error:', error);
    res.status(500).json({ message: 'Failed to assign role', error: error.message });
  }
};

const assignBase = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { baseId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const base = await Base.findById(baseId);
    if (!base) {
      return res.status(404).json({ message: 'Base not found' });
    }

    await User.assignBase(userId, baseId);
    
    logger.info(`Base ${base.base_name} assigned to user ${user.username}`);

   
    await recordAudit({
      req,
      action: 'Base Assigned',
      details: {
        user_id: userId,
        assigned_base_id: baseId,
        assigned_by_user_id: req.user.user_id
      }
    });

    res.json({ message: 'Base assigned successfully' });
  } catch (error) {
    logger.error('Assign base error:', error);
    res.status(500).json({ message: 'Failed to assign base', error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, email, full_name } = req.body;
    
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const user = await User.create({ username, password, email, full_name });
    
    logger.info(`New user created: ${username} by ${req.user.username}`);

   
    await recordAudit({
      req,
      action: 'User Created',
      details: {
        new_user_id: user.user_id,
        username: user.username,
        created_by: req.user.user_id
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name
      }
    });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  assignRole,
  assignBase,
  createUser
};
