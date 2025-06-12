const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Purchase {
  static async create(purchaseData) {
    const {
      asset_id,
      quantity,
      unit_cost,
      total_cost,
      purchase_date,
      supplier_info,
      receiving_base_id,
      purchase_order_number,
      recorded_by_user_id
    } = purchaseData;
    const purchaseId = uuidv4();

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Insert purchase record
        db.run(
          `INSERT INTO purchases (purchase_id, asset_id, quantity, unit_cost, total_cost,
           purchase_date, supplier_info, receiving_base_id, purchase_order_number, recorded_by_user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [purchaseId, asset_id, quantity, unit_cost, total_cost, purchase_date,
           supplier_info, receiving_base_id, purchase_order_number, recorded_by_user_id],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }

            // Update asset balance
            db.run(
              'UPDATE assets SET current_balance = current_balance + ?, last_updated_at = CURRENT_TIMESTAMP WHERE asset_id = ?',
              [quantity, asset_id],
              (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  reject(err);
                } else {
                  db.run('COMMIT');
                  resolve({ purchase_id: purchaseId, ...purchaseData });
                }
              }
            );
          }
        );
      });
    });
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT p.*, a.model_name, et.type_name, b.base_name, u.full_name as recorded_by
      FROM purchases p
      JOIN assets a ON p.asset_id = a.asset_id
      JOIN equipment_types et ON a.equipment_type_id = et.equipment_type_id
      JOIN bases b ON p.receiving_base_id = b.base_id
      JOIN users u ON p.recorded_by_user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.base_id) {
      query += ' AND p.receiving_base_id = ?';
      params.push(filters.base_id);
    }

    if (filters.start_date && filters.end_date) {
      query += ' AND p.purchase_date BETWEEN ? AND ?';
      params.push(filters.start_date, filters.end_date);
    }

    query += ' ORDER BY p.created_at DESC';

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async findById(purchaseId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT p.*, a.model_name, et.type_name, b.base_name, u.full_name as recorded_by
         FROM purchases p
         JOIN assets a ON p.asset_id = a.asset_id
         JOIN equipment_types et ON a.equipment_type_id = et.equipment_type_id
         JOIN bases b ON p.receiving_base_id = b.base_id
         JOIN users u ON p.recorded_by_user_id = u.user_id
         WHERE p.purchase_id = ?`,
        [purchaseId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }
}

module.exports = Purchase;