const AuditLog = require('../models/AuditLog');
const { logger } = require('../utils/helpers');

// Create an audit log entry manually (optional external trigger)
const createAuditLog = async (req, res) => {
  try {
    const { action, details, status } = req.body;
    const ipAddress = req.ip;
    const userId = req.user?.user_id;

    if (!action) {
      return res.status(400).json({ message: 'Action is required' });
    }

    const log = await AuditLog.create({
      user_id: userId,
      action,
      details,
      ip_address: ipAddress,
      status: status || 'Success'
    });

    logger.info(`Audit log created for user: ${userId}, action: ${action}`);
    res.status(201).json({ message: 'Audit log created', log });
  } catch (error) {
    logger.error('Create audit log error:', error);
    res.status(500).json({ message: 'Failed to create audit log', error: error.message });
  }
};

// Get all audit logs with filters
const getAllAuditLogs = async (req, res) => {
  try {
    const filters = {
      user_id: req.query.user_id,
      action: req.query.action,
      start_date: req.query.start_date,
      end_date: req.query.end_date
    };

    const logs = await AuditLog.getAll(filters);

    res.json({ logs });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Failed to fetch audit logs', error: error.message });
  }
};

module.exports = {
  createAuditLog,
  getAllAuditLogs
};
