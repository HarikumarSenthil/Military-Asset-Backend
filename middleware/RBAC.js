// MIDDLEWARE/RBAC.JS
// ========================================
const Base = require('../models/Base');
const AuditLog = require('../models/AuditLog');

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const hasRole = allowedRoles.some(role => req.user.roles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

const checkBaseAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Admin has access to all bases
    if (req.user.roles.includes('Admin')) {
      return next();
    }

    // Get base ID from request (could be in params, query, or body)
    const baseId = req.params.baseId || req.query.base_id || req.body.base_id || req.body.receiving_base_id;
    
    if (!baseId) {
      return next(); // No base restriction if no base specified
    }

    // Check if user has access to this base
    const userBases = await Base.getUserBases(req.user.user_id);
    const hasAccess = userBases.some(base => base.base_id === baseId);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this base' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking base access', error: error.message });
  }
};

const auditLog = (action) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after response is sent
      if (res.statusCode < 400) {
        AuditLog.create({
          user_id: req.user?.user_id,
          action,
          details: {
            method: req.method,
            path: req.path,
            params: req.params,
            body: req.body
          },
          ip_address: req.ip,
          status: 'Success'
        }).catch(err => console.error('Audit log error:', err));
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = { checkRole, checkBaseAccess, auditLog };
