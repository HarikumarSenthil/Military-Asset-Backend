const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { logger } = require('../utils/helpers');

const DB_PATH = process.env.DB_PATH || './database/military_assets.db';

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    logger.error('Error opening database:', err);
  } else {
    logger.info('Connected to SQLite database');
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

const initializeDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create tables in correct order (dependencies first)
      
      // Roles table
      db.run(`
        CREATE TABLE IF NOT EXISTS roles (
          role_id INTEGER PRIMARY KEY AUTOINCREMENT,
          role_name VARCHAR(50) UNIQUE NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Bases table
      db.run(`
        CREATE TABLE IF NOT EXISTS bases (
          base_id TEXT PRIMARY KEY,
          base_name VARCHAR(100) UNIQUE NOT NULL,
          location VARCHAR(200),
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          user_id TEXT PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          full_name VARCHAR(100) NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // UserRoles junction table
      db.run(`
        CREATE TABLE IF NOT EXISTS user_roles (
          user_id TEXT,
          role_id INTEGER,
          assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, role_id),
          FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
          FOREIGN KEY (role_id) REFERENCES roles (role_id) ON DELETE CASCADE
        )
      `);

      // UserBases junction table
      db.run(`
        CREATE TABLE IF NOT EXISTS user_bases (
          user_id TEXT,
          base_id TEXT,
          assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, base_id),
          FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
          FOREIGN KEY (base_id) REFERENCES bases (base_id) ON DELETE CASCADE
        )
      `);

      // Equipment types table
      db.run(`
        CREATE TABLE IF NOT EXISTS equipment_types (
          equipment_type_id TEXT PRIMARY KEY,
          type_name VARCHAR(100) UNIQUE NOT NULL,
          category VARCHAR(50),
          description TEXT,
          is_fungible BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Assets table
      db.run(`
        CREATE TABLE IF NOT EXISTS assets (
          asset_id TEXT PRIMARY KEY,
          equipment_type_id TEXT NOT NULL,
          model_name VARCHAR(100),
          serial_number VARCHAR(100) UNIQUE,
          current_base_id TEXT,
          quantity INTEGER DEFAULT 1,
          status VARCHAR(20) DEFAULT 'Operational',
          current_balance INTEGER DEFAULT 0,
          last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (equipment_type_id) REFERENCES equipment_types (equipment_type_id),
          FOREIGN KEY (current_base_id) REFERENCES bases (base_id)
        )
      `);

      // Purchases table
      db.run(`
        CREATE TABLE IF NOT EXISTS purchases (
          purchase_id TEXT PRIMARY KEY,
          asset_id TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          unit_cost DECIMAL(10,2),
          total_cost DECIMAL(10,2),
          purchase_date DATE NOT NULL,
          supplier_info VARCHAR(200),
          receiving_base_id TEXT NOT NULL,
          purchase_order_number VARCHAR(50),
          recorded_by_user_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (asset_id) REFERENCES assets (asset_id),
          FOREIGN KEY (receiving_base_id) REFERENCES bases (base_id),
          FOREIGN KEY (recorded_by_user_id) REFERENCES users (user_id)
        )
      `);

      // Transfers table
      db.run(`
        CREATE TABLE IF NOT EXISTS transfers (
          transfer_id TEXT PRIMARY KEY,
          asset_id TEXT NOT NULL,
          asset_serial_number VARCHAR(100),
          quantity INTEGER,
          source_base_id TEXT NOT NULL,
          destination_base_id TEXT NOT NULL,
          transfer_date DATETIME NOT NULL,
          reason TEXT,
          status VARCHAR(20) DEFAULT 'Initiated',
          initiated_by_user_id TEXT NOT NULL,
          received_by_user_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          FOREIGN KEY (asset_id) REFERENCES assets (asset_id),
          FOREIGN KEY (source_base_id) REFERENCES bases (base_id),
          FOREIGN KEY (destination_base_id) REFERENCES bases (base_id),
          FOREIGN KEY (initiated_by_user_id) REFERENCES users (user_id),
          FOREIGN KEY (received_by_user_id) REFERENCES users (user_id)
        )
      `);

      // Assignments table
      db.run(`
        CREATE TABLE IF NOT EXISTS assignments (
          assignment_id TEXT PRIMARY KEY,
          asset_id TEXT NOT NULL,
          assigned_to_user_id TEXT NOT NULL,
          assignment_date DATE NOT NULL,
          base_of_assignment_id TEXT NOT NULL,
          purpose TEXT,
          expected_return_date DATE,
          returned_date DATE,
          is_active BOOLEAN DEFAULT 1,
          recorded_by_user_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (asset_id) REFERENCES assets (asset_id),
          FOREIGN KEY (assigned_to_user_id) REFERENCES users (user_id),
          FOREIGN KEY (base_of_assignment_id) REFERENCES bases (base_id),
          FOREIGN KEY (recorded_by_user_id) REFERENCES users (user_id)
        )
      `);

      // Expenditures table
      db.run(`
        CREATE TABLE IF NOT EXISTS expenditures (
          expenditure_id TEXT PRIMARY KEY,
          asset_id TEXT NOT NULL,
          quantity_expended INTEGER NOT NULL,
          expenditure_date DATE NOT NULL,
          base_id TEXT NOT NULL,
          reason TEXT,
          reported_by_user_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (asset_id) REFERENCES assets (asset_id),
          FOREIGN KEY (base_id) REFERENCES bases (base_id),
          FOREIGN KEY (reported_by_user_id) REFERENCES users (user_id)
        )
      `);

      // Audit logs table
      db.run(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          log_id TEXT PRIMARY KEY,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          user_id TEXT,
          action VARCHAR(100) NOT NULL,
          details TEXT,
          ip_address VARCHAR(45),
          status VARCHAR(20) DEFAULT 'Success',
          FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          // Insert default data
          insertDefaultData().then(resolve).catch(reject);
        }
      });
    });
  });
};

const insertDefaultData = async () => {
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');

  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        // Insert default roles
        const roles = [
          { name: 'Admin', description: 'Full system access' },
          { name: 'Base Commander', description: 'Base-specific access' },
          { name: 'Logistics Officer', description: 'Limited operational access' }
        ];

        for (const role of roles) {
          db.run('INSERT OR IGNORE INTO roles (role_name, description) VALUES (?, ?)', 
            [role.name, role.description]);
        }

        // Insert default bases
        const bases = [
          { id: uuidv4(), name: 'HQ Base Alpha', location: 'Primary Headquarters' },
          { id: uuidv4(), name: 'Forward Base Beta', location: 'Eastern Sector' },
          { id: uuidv4(), name: 'Support Base Gamma', location: 'Western Sector' }
        ];

        for (const base of bases) {
          db.run('INSERT OR IGNORE INTO bases (base_id, base_name, location) VALUES (?, ?, ?)', 
            [base.id, base.name, base.location]);
        }

        // Insert default equipment types
        const equipmentTypes = [
          { id: uuidv4(), name: 'M4 Carbine', category: 'Small Arms', fungible: false },
          { id: uuidv4(), name: '5.56mm Ammunition', category: 'Ammunition', fungible: true },
          { id: uuidv4(), name: 'HMMWV', category: 'Vehicle', fungible: false },
          { id: uuidv4(), name: 'Body Armor', category: 'Personal Equipment', fungible: false }
        ];

        for (const type of equipmentTypes) {
          db.run('INSERT OR IGNORE INTO equipment_types (equipment_type_id, type_name, category, is_fungible) VALUES (?, ?, ?, ?)', 
            [type.id, type.name, type.category, type.fungible]);
        }

        // Insert default admin user
        const adminId = uuidv4();
        const hashedPassword = await bcrypt.hash('admin123', 12);
        
        db.run('INSERT OR IGNORE INTO users (user_id, username, password_hash, email, full_name) VALUES (?, ?, ?, ?, ?)', 
          [adminId, 'admin', hashedPassword, 'admin@military.gov', 'System Administrator'], (err) => {
            if (!err) {
              // Assign admin role
              db.run('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, 1)', [adminId]);
            }
            resolve();
          });

      } catch (error) {
        reject(error);
      }
    });
  });
};

module.exports = { db, initializeDatabase };
