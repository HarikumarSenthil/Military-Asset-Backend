// MODELS/EXPENDITURE.JS
// ========================================
const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Expenditure {
  static async create(expenditureData) {
    const {
      asset_id,
      quantity_expended,
      expenditure_date,
      base_id,
      reason,
      reported_by_user_id
    } = expenditureData;
    const expenditureId = uuidv4();

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Insert expenditure record
        db.run(
          `INSERT INTO expenditures (expenditure_id, asset_id, quantity_expended,
           expenditure_date, base_id, reason, reported_by_user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [expenditureId, asset_id, quantity_expended, expenditure_date,
           base_id, reason, reported_by_user_id],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }

            // Update asset balance
            db.run(
              'UPDATE assets SET current_balance = current_balance - ?, last_updated_at = CURRENT_TIMESTAMP WHERE asset_id = ?',
              [quantity_expended, asset_id],
              (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  reject(err);
                } else {
                  db.run('COMMIT');
                  resolve({ expenditure_id: expenditureId, ...expenditureData });
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
      SELECT e.*, 
             a.model_name, et.type_name,
             b.base_name,
             u.full_name as reported_by
      FROM expenditures e
      JOIN assets a ON e.asset_id = a.asset_id
      JOIN equipment_types et ON a.equipment_type_id = et.equipment_type_id
      JOIN bases b ON e.base_id = b.base_id
      JOIN users u ON e.reported_by_user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.base_id) {
      query += ' AND e.base_id = ?';
      params.push(filters.base_id);
    }

    if (filters.start_date && filters.end_date) {
      query += ' AND e.expenditure_date BETWEEN ? AND ?';
      params.push(filters.start_date, filters.end_date);
    }

    query += ' ORDER BY e.created_at DESC';

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async findById(expenditureId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT e.*, 
                a.model_name, et.type_name,
                b.base_name,
                u.full_name as reported_by
         FROM expenditures e
         JOIN assets a ON e.asset_id = a.asset_id
         JOIN equipment_types et ON a.equipment_type_id = et.equipment_type_id
         JOIN bases b ON e.base_id = b.base_id
         JOIN users u ON e.reported_by_user_id = u.user_id
         WHERE e.expenditure_id = ?`,
        [expenditureId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }
}

module.exports = Expenditure;