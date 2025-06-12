// MODELS/AUDITLOG.JS
// ========================================
const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class AuditLog {
  static async create(logData) {
    const {
      user_id,
      action,
      details,
      ip_address,
      status = 'Success'
    } = logData;
    const logId = uuidv4();

    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO audit_logs (log_id, user_id, action, details, ip_address, status) VALUES (?, ?, ?, ?, ?, ?)',
        [logId, user_id, action, JSON.stringify(details), ip_address, status],
        function(err) {
          if (err) reject(err);
          else resolve({ log_id: logId, ...logData });
        }
      );
    });
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT al.*, u.full_name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.user_id) {
      query += ' AND al.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.action) {
      query += ' AND al.action = ?';
      params.push(filters.action);
    }

    if (filters.start_date && filters.end_date) {
      query += ' AND al.timestamp BETWEEN ? AND ?';
      params.push(filters.start_date, filters.end_date);
    }

    query += ' ORDER BY al.timestamp DESC LIMIT 1000';

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => ({
          ...row,
          details: row.details ? JSON.parse(row.details) : null
        })));
      });
    });
  }
}

module.exports = AuditLog;