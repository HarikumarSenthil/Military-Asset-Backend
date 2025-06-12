// MODELS/ASSET.JS
// ========================================
const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Asset {
  static async create(assetData) {
    const {
      equipment_type_id,
      model_name,
      serial_number,
      current_base_id,
      quantity = 1,
      status = 'Operational'
    } = assetData;
    const assetId = uuidv4();

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO assets (asset_id, equipment_type_id, model_name, serial_number, 
         current_base_id, quantity, status, current_balance) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [assetId, equipment_type_id, model_name, serial_number, current_base_id, quantity, status, quantity],
        function(err) {
          if (err) reject(err);
          else resolve({ asset_id: assetId, ...assetData });
        }
      );
    });
  }

  static async findById(assetId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT a.*, et.type_name, et.category, et.is_fungible, b.base_name
         FROM assets a
         JOIN equipment_types et ON a.equipment_type_id = et.equipment_type_id
         LEFT JOIN bases b ON a.current_base_id = b.base_id
         WHERE a.asset_id = ?`,
        [assetId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT a.*, et.type_name, et.category, b.base_name
      FROM assets a
      JOIN equipment_types et ON a.equipment_type_id = et.equipment_type_id
      LEFT JOIN bases b ON a.current_base_id = b.base_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.base_id) {
      query += ' AND a.current_base_id = ?';
      params.push(filters.base_id);
    }

    if (filters.equipment_type) {
      query += ' AND et.type_name LIKE ?';
      params.push(`%${filters.equipment_type}%`);
    }

    if (filters.status) {
      query += ' AND a.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY a.created_at DESC';

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async updateBalance(assetId, newBalance) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE assets SET current_balance = ?, last_updated_at = CURRENT_TIMESTAMP WHERE asset_id = ?',
        [newBalance, assetId],
        (err) => {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });
  }

  static async getDashboardMetrics(filters = {}) {
    let baseFilter = '';
    let params = [];
    
    if (filters.base_id) {
      baseFilter = 'WHERE base_id = ?';
      params.push(filters.base_id);
    }

    const queries = {
      totalAssets: `SELECT SUM(current_balance) as total FROM assets ${baseFilter}`,
      assignedAssets: `SELECT COUNT(*) as total FROM assignments WHERE is_active = 1 ${baseFilter ? 'AND base_of_assignment_id = ?' : ''}`,
      totalPurchases: `SELECT SUM(quantity) as total FROM purchases ${filters.base_id ? 'WHERE receiving_base_id = ?' : ''}`,
      totalExpenditures: `SELECT SUM(quantity_expended) as total FROM expenditures ${baseFilter}`
    };

    const results = {};
    
    for (const [key, query] of Object.entries(queries)) {
      results[key] = await new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
          if (err) reject(err);
          else resolve(row?.total || 0);
        });
      });
    }

    return results;
  }
}

module.exports = Asset;