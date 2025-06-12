const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Transfer {
  static async create(transferData) {
    const {
      asset_id,
      asset_serial_number,
      quantity,
      source_base_id,
      destination_base_id,
      transfer_date,
      reason,
      initiated_by_user_id
    } = transferData;
    const transferId = uuidv4();

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO transfers (transfer_id, asset_id, asset_serial_number, quantity,
         source_base_id, destination_base_id, transfer_date, reason, initiated_by_user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [transferId, asset_id, asset_serial_number, quantity, source_base_id,
         destination_base_id, transfer_date, reason, initiated_by_user_id],
        function(err) {
          if (err) reject(err);
          else resolve({ transfer_id: transferId, ...transferData });
        }
      );
    });
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT t.*, 
             a.model_name, et.type_name,
             sb.base_name as source_base_name,
             db.base_name as destination_base_name,
             u1.full_name as initiated_by,
             u2.full_name as received_by
      FROM transfers t
      JOIN assets a ON t.asset_id = a.asset_id
      JOIN equipment_types et ON a.equipment_type_id = et.equipment_type_id
      JOIN bases sb ON t.source_base_id = sb.base_id
      JOIN bases db ON t.destination_base_id = db.base_id
      JOIN users u1 ON t.initiated_by_user_id = u1.user_id
      LEFT JOIN users u2 ON t.received_by_user_id = u2.user_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.base_id) {
      query += ' AND (t.source_base_id = ? OR t.destination_base_id = ?)';
      params.push(filters.base_id, filters.base_id);
    }

    if (filters.status) {
      query += ' AND t.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY t.created_at DESC';

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async updateStatus(transferId, status, receivedByUserId = null) {
    return new Promise((resolve, reject) => {
      const query = receivedByUserId 
        ? 'UPDATE transfers SET status = ?, received_by_user_id = ?, completed_at = CURRENT_TIMESTAMP WHERE transfer_id = ?'
        : 'UPDATE transfers SET status = ? WHERE transfer_id = ?';
      const params = receivedByUserId 
        ? [status, receivedByUserId, transferId]
        : [status, transferId];

      db.run(query, params, (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }

  static async findById(transferId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT t.*, 
                a.model_name, et.type_name,
                sb.base_name as source_base_name,
                db.base_name as destination_base_name,
                u1.full_name as initiated_by,
                u2.full_name as received_by
         FROM transfers t
         JOIN assets a ON t.asset_id = a.asset_id
         JOIN equipment_types et ON a.equipment_type_id = et.equipment_type_id
         JOIN bases sb ON t.source_base_id = sb.base_id
         JOIN bases db ON t.destination_base_id = db.base_id
         JOIN users u1 ON t.initiated_by_user_id = u1.user_id
         LEFT JOIN users u2 ON t.received_by_user_id = u2.user_id
         WHERE t.transfer_id = ?`,
        [transferId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }
}

module.exports = Transfer;