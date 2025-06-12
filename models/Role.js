const { getDB } = require('../config/database');

class Role {
  static async getAll() {
    const db = getDB();
    return await db.all('SELECT * FROM roles ORDER BY role_name');
  }

  static async findByName(role_name) {
    const db = getDB();
    return await db.get('SELECT * FROM roles WHERE role_name = ?', [role_name]);
  }

  static async findById(role_id) {
    const db = getDB();
    return await db.get('SELECT * FROM roles WHERE role_id = ?', [role_id]);
  }
}

module.exports = Role;
