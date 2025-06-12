// utils/auditHelper.js
const AuditLog = require('../models/AuditLog');

const recordAudit = async ({ req, action, details = {}, status = 'Success' }) => {
  try {
    await AuditLog.create({
      user_id: req.user?.user_id || null,
      action,
      details,
      ip_address: req.ip,
      status
    });
  } catch (err) {
    console.error('Failed to record audit:', err.message);
  }
};

module.exports = { recordAudit };
