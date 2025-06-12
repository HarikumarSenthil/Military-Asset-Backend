const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Assignment {
  static async create(assignmentData) {
    const {
      asset_id,
      assigned_to_user_id,
      assignment_date,
      base_of_assignment_id,
      purpose,
      expected_return_date,
      recorded_by_user_id
    } = assignmentData;
    const assignmentId = uuidv4();

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO assignments (assignment_id, asset_id, assigned_to_user_id,
         assignment_date, base_of_assignment_id, purpose, expected_return_date, recorded_by_user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [assignmentId, asset_id, assigned_to_user_id, assignment_date,
         base_of_assignment_id, purpose, expected_return_date, recorded_by_user_id],
        function(err) {
          if (err) reject(err);
          else resolve({ assignment_id: assignmentId, ...assignmentData });
        }
      );
    });
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT asn.*, 
             a.model_name, a.serial_number, et.type_name,
             u1.full_name as assigned_to,
             u2.full_name as recorded_by,
             b.base_name
      FROM assignments asn
      JOIN assets a ON asn.asset_id = a.asset_id
      JOIN equipment_types et ON a.equipment_type_id = et.equipment_type_id
      JOIN users u1 ON asn.assigned_to_user_id = u1.user_id
      JOIN users u2 ON asn.recorded_by_user_id = u2.user_id
      JOIN bases b ON asn.base_of_assignment_id = b.base_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.base_id) {
      query += ' AND asn.base_of_assignment_id = ?';
      params.push(filters.base_id);
    }

    if (filters.is_active !== undefined) {
      query += ' AND asn.is_active = ?';
      params.push(filters.is_active);
    }

    if (filters.assigned_to_user_id) {
      query += ' AND asn.assigned_to_user_id = ?';
      params.push(filters.assigned_to_user_id);
    }

    query += ' ORDER BY asn.created_at DESC';

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async returnAsset(assignmentId, returnDate) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE assignments SET returned_date = ?, is_active = 0 WHERE assignment_id = ?',
        [returnDate, assignmentId],
        (err) => {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });
  }

  static async findById(assignmentId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT asn.*, 
                a.model_name, a.serial_number, et.type_name,
                u1.full_name as assigned_to,
                u2.full_name as recorded_by,
                b.base_name
         FROM assignments asn
         JOIN assets a ON asn.asset_id = a.asset_id
         JOIN equipment_types et ON a.equipment_type_id = et.equipment_type_id
         JOIN users u1 ON asn.assigned_to_user_id = u1.user_id
         JOIN users u2 ON asn.recorded_by_user_id = u2.user_id
         JOIN bases b ON asn.base_of_assignment_id = b.base_id
         WHERE asn.assignment_id = ?`,
        [assignmentId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }
}

module.exports = Assignment;