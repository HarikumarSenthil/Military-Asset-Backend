const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Base {
  static async create(baseData) {
    const { base_name, location, description } = baseData;
    const baseId = uuidv4();

    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO bases (base_id, base_name, location, description) VALUES (?, ?, ?, ?)',
        [baseId, base_name, location, description],
        function(err) {
          if (err) reject(err);
          else resolve({ base_id: baseId, base_name, location, description });
        }
      );
    });
  }

  static async getAll() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM bases ORDER BY base_name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async findById(baseId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM bases WHERE base_id = ?', [baseId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static async getUserBases(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT b.* FROM bases b
         JOIN user_bases ub ON b.base_id = ub.base_id
         WHERE ub.user_id = ?`,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
}

module.exports = Base;