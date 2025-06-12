const { db } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
  static async create(userData) {
    const { username, password, email, full_name } = userData;
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 12);

    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (user_id, username, password_hash, email, full_name) VALUES (?, ?, ?, ?, ?)',
        [userId, username, hashedPassword, email, full_name],
        function(err) {
          if (err) reject(err);
          else resolve({ user_id: userId, username, email, full_name });
        }
      );
    });
  }

  static async findById(userId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT u.*, GROUP_CONCAT(r.role_name) as roles, 
         GROUP_CONCAT(b.base_name) as bases
         FROM users u 
         LEFT JOIN user_roles ur ON u.user_id = ur.user_id
         LEFT JOIN roles r ON ur.role_id = r.role_id
         LEFT JOIN user_bases ub ON u.user_id = ub.user_id
         LEFT JOIN bases b ON ub.base_id = b.base_id
         WHERE u.user_id = ? AND u.is_active = 1
         GROUP BY u.user_id`,
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static async findByUsername(username) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE username = ? AND is_active = 1',
        [username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static async validatePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  static async getAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT u.user_id, u.username, u.email, u.full_name, u.created_at,
         GROUP_CONCAT(r.role_name) as roles
         FROM users u 
         LEFT JOIN user_roles ur ON u.user_id = ur.user_id
         LEFT JOIN roles r ON ur.role_id = r.role_id
         WHERE u.is_active = 1
         GROUP BY u.user_id
         LIMIT ? OFFSET ?`,
        [limit, offset],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async assignRole(userId, roleId) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)',
        [userId, roleId],
        (err) => {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });
  }

  static async assignBase(userId, baseId) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT OR IGNORE INTO user_bases (user_id, base_id) VALUES (?, ?)',
        [userId, baseId],
        (err) => {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });
  }
}

module.exports = User;