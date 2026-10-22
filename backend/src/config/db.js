// Unified Database Engine: Neon PostgreSQL (Primary / Remote) + SQLite (Fallback / Offline)

const path = require('path');
const fs = require('fs');
const { hashPassword } = require('../utils/security');

const isPostgres = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres'));

let db;
let pool = null;
let sqliteDb = null;

if (isPostgres) {
  const { Pool } = require('pg');
  console.log('🐘 Initializing Neon PostgreSQL connection pool...');

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000
  });

  pool.on('error', (err) => {
    console.error('⚠️ Unexpected PostgreSQL pool error on idle client:', err.message);
  });

  function toPgSql(sql) {
    let idx = 1;
    return sql.replace(/\?/g, () => '$' + (idx++));
  }

  db = {
    isPostgres: true,
    async query(sql, params = []) {
      const pgSql = toPgSql(sql);
      return await pool.query(pgSql, params);
    },
    prepare(sql) {
      return {
        get: async (...params) => {
          const pgSql = toPgSql(sql);
          const res = await pool.query(pgSql, params);
          return res.rows[0] || null;
        },
        all: async (...params) => {
          const pgSql = toPgSql(sql);
          const res = await pool.query(pgSql, params);
          return res.rows || [];
        },
        run: async (...params) => {
          let pgSql = toPgSql(sql);
          const isInsert = /^\s*INSERT\s+INTO\s+/i.test(pgSql);
          if (isInsert && !/RETURNING/i.test(pgSql)) {
            if (/INSERT\s+INTO\s+sessions\b/i.test(pgSql)) {
              pgSql += ' RETURNING token';
            } else {
              pgSql += ' RETURNING id';
            }
          }
          const res = await pool.query(pgSql, params);
          return {
            lastInsertRowid: res.rows && res.rows[0] ? (res.rows[0].id || res.rows[0].token) : null,
            changes: res.rowCount
          };
        }

      };
    },
    async exec(sql) {
      return await pool.query(sql);
    }
  };
} else {
  // SQLite Fallback / Local / Test Mode
  const { DatabaseSync } = require('node:sqlite');
  const dbPath = process.env.DB_FILE || path.join(__dirname, '../../annasetu.db');

  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  sqliteDb = new DatabaseSync(dbPath);
  sqliteDb.exec('PRAGMA foreign_keys = ON;');

  db = {
    isPostgres: false,
    prepare(sql) {
      const stmt = sqliteDb.prepare(sql);
      return {
        get: async (...params) => stmt.get(...params),
        all: async (...params) => stmt.all(...params),
        run: async (...params) => stmt.run(...params)
      };
    },
    async exec(sql) {
      return sqliteDb.exec(sql);
    }
  };
}

/**
 * Creates in-app notifications
 */
async function notify(userId, message) {
  try {
    await db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(userId, message);
  } catch (err) {
    console.error('Notification error:', err);
  }
}

/**
 * Logs a status transition in donation history
 */
async function logHistory(donationId, status) {
  try {
    await db.prepare('INSERT INTO history (donation_id, status) VALUES (?, ?)').run(donationId, status);
  } catch (err) {
    console.error('History log error:', err);
  }
}

/**
 * Initializes database tables schema
 */
async function initSchema() {
  if (isPostgres) {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        pw VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK(role IN ('donor', 'ngo', 'volunteer', 'beneficiary', 'admin')),
        phone VARCHAR(50),
        address TEXT,
        org_name VARCHAR(255),
        verified INTEGER NOT NULL DEFAULT 0,
        available INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token VARCHAR(255) PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(100) NOT NULL,
        quantity INTEGER NOT NULL,
        location TEXT NOT NULL,
        description TEXT,
        urgency VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Open',
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS donations (
        id SERIAL PRIMARY KEY,
        donor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        request_id INTEGER REFERENCES requests(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        quantity INTEGER NOT NULL,
        servings INTEGER,
        prepared_at TIMESTAMP,
        deadline TIMESTAMP,
        description TEXT,
        pickup TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Created',
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS distributions (
        id SERIAL PRIMARY KEY,
        donation_id INTEGER UNIQUE NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
        ngo_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        delivery_location TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'Open',
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        distribution_id INTEGER UNIQUE NOT NULL REFERENCES distributions(id) ON DELETE CASCADE,
        volunteer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'Assigned',
        assigned TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started TIMESTAMP,
        delivered TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS history (
        id SERIAL PRIMARY KEY,
        donation_id INTEGER NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL,
        at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } else {
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        pw TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('donor', 'ngo', 'volunteer', 'beneficiary', 'admin')),
        phone TEXT,
        address TEXT,
        org_name TEXT,
        verified INTEGER NOT NULL DEFAULT 0,
        available INTEGER NOT NULL DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        location TEXT NOT NULL,
        description TEXT,
        urgency TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Open',
        created TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS donations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        donor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        request_id INTEGER REFERENCES requests(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        servings INTEGER,
        prepared_at TEXT,
        deadline TEXT,
        description TEXT,
        pickup TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Created',
        created TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS distributions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        donation_id INTEGER UNIQUE NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
        ngo_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        delivery_location TEXT,
        status TEXT NOT NULL DEFAULT 'Open',
        created TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        distribution_id INTEGER UNIQUE NOT NULL REFERENCES distributions(id) ON DELETE CASCADE,
        volunteer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'Assigned',
        assigned TEXT DEFAULT CURRENT_TIMESTAMP,
        started TEXT,
        delivered TEXT
      );

      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        donation_id INTEGER NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        created TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
}

/**
 * Seeds default production accounts and initial live relief listings
 */
async function seedInitialData() {
  await initSchema();
  const userCheck = await db.prepare('SELECT COUNT(*) AS count FROM users').get();
  const count = Number(userCheck.count || 0);
  if (count > 0) return;

  const realUsers = [
    ['National Relief Coordinator', 'admin@annasetu.org', 'admin', 'HQ, Central Secretariat, New Delhi', '+91 98110 24001', 'National Disaster & Relief Authority'],
    ['The Grand Palace Kitchens', 'donor@annasetu.org', 'donor', 'Plot 14, Connaught Place, New Delhi', '+91 98220 54321', 'Grand Palace Hospitality Group'],
    ['Seva Food Relief Foundation', 'ngo@annasetu.org', 'ngo', 'Block B-4, Community Care Hub, Okhla, New Delhi', '+91 98330 65432', 'Seva Hunger Relief Trust'],
    ['Rahul Sharma (Lead Volunteer)', 'volunteer@annasetu.org', 'volunteer', 'Sector 15, Vasundhara, Ghaziabad', '+91 98440 76543', 'National Relief Volunteer Corps'],
    ['Yamuna Community Relief Shelter', 'beneficiary@annasetu.org', 'beneficiary', 'Shelter Cluster 9, Yamuna Bank, Delhi', '+91 98550 87654', 'Yamuna Bank Relief Center'],

    ['Administrator', 'admin@demo.test', 'admin', 'Headquarters, Delhi', '+91 98110 00001', 'AnnaSetu Authority'],
    ['Grand Kitchens', 'donor@demo.test', 'donor', 'Connaught Place, Delhi', '+91 98220 00002', 'Grand Kitchens'],
    ['Seva Foundation', 'ngo@demo.test', 'ngo', 'Okhla Relief Center, Delhi', '+91 98330 00003', 'Seva Foundation'],
    ['Volunteer Dispatch', 'volunteer@demo.test', 'volunteer', 'Noida Hub, Delhi NCR', '+91 98440 00004', 'Volunteer Dispatch'],
    ['Community Camp', 'beneficiary@demo.test', 'beneficiary', 'Yamuna Relief Camp, Delhi', '+91 98550 00005', 'Community Camp']
  ];

  const hashedPw = hashPassword('AnnaSetu@1234');
  for (const [name, email, role, addr, phone, org] of realUsers) {
    await db.prepare(`
      INSERT INTO users (name, email, pw, role, address, phone, org_name, verified, available)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)
    `).run(name, email, hashedPw, role, addr, phone, org);
  }

  try {
    const getUserId = async (email) => {
      const row = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      return row ? row.id : null;
    };

    const donorId = await getUserId('donor@annasetu.org');
    const ngoId = await getUserId('ngo@annasetu.org');
    const volId = await getUserId('volunteer@annasetu.org');
    const benId = await getUserId('beneficiary@annasetu.org');

    if (donorId && ngoId && volId && benId) {
      const r1 = await db.prepare(`
        INSERT INTO requests (user_id, category, quantity, location, description, urgency, status)
        VALUES (?, 'Water', 50, 'Shelter Cluster 9, Yamuna Bank, Delhi', 'Clean drinking water bottles required urgently for 120 flood-affected individuals.', 'Critical', 'Open')
      `).run(benId);

      const r2 = await db.prepare(`
        INSERT INTO requests (user_id, category, quantity, location, description, urgency, status)
        VALUES (?, 'Food', 100, 'Shelter Cluster 9, Yamuna Bank, Delhi', 'Hot nutritious meals needed for community dinner.', 'High', 'Open')
      `).run(benId);

      await db.prepare(`
        INSERT INTO requests (user_id, category, quantity, location, description, urgency, status)
        VALUES (?, 'Blankets', 40, 'Night Shelter 14, Kashmere Gate', 'Thermal blankets for elderly shelter residents.', 'Medium', 'Open')
      `).run(benId);

      const d1 = await db.prepare(`
        INSERT INTO donations (donor_id, request_id, title, category, quantity, servings, pickup, description, status)
        VALUES (?, ?, '100 Fresh Meal Boxes (Rice, Dal, Subzi & Rotis)', 'Food', 100, 100, 'Plot 14, Connaught Place, New Delhi (Kitchen Rear Loading Bay)', 'Freshly prepared vegetarian meals packed in hygienic foil boxes.', 'Available')
      `).run(donorId, r2.lastInsertRowid);
      const d1Id = d1.lastInsertRowid;
      for (const st of ['Created', 'Submitted', 'UnderReview', 'Approved', 'Available']) {
        await logHistory(d1Id, st);
      }
      await db.prepare("INSERT INTO distributions (donation_id, ngo_id, status) VALUES (?, ?, 'Open')").run(d1Id, ngoId);

      const d2 = await db.prepare(`
        INSERT INTO donations (donor_id, request_id, title, category, quantity, servings, pickup, description, status)
        VALUES (?, ?, '50 Bottled Drinking Water Cartons (20L Packaged)', 'Water', 50, 200, 'City Beverage Depot, Mayapuri Industrial Area', 'Sealed mineral water cartons for immediate disaster relief.', 'InTransit')
      `).run(donorId, r1.lastInsertRowid);
      const d2Id = d2.lastInsertRowid;
      for (const st of ['Created', 'Submitted', 'UnderReview', 'Approved', 'Available', 'Assigned', 'InTransit']) {
        await logHistory(d2Id, st);
      }
      const dist2 = await db.prepare("INSERT INTO distributions (donation_id, ngo_id, delivery_location, status) VALUES (?, ?, 'Shelter Cluster 9, Yamuna Bank, Delhi', 'Open')").run(d2Id, ngoId);
      await db.prepare("INSERT INTO tasks (distribution_id, volunteer_id, status, started) VALUES (?, ?, 'InTransit', CURRENT_TIMESTAMP)").run(dist2.lastInsertRowid, volId);

      await notify(donorId, 'Welcome to AnnaSetu Relief Platform. Your account is active.');
      await notify(ngoId, 'Welcome Seva Food Relief Foundation. 2 active community emergency requests require attention.');
      await notify(volId, 'New transit task assigned: Deliver 50 Bottled Water Cartons to Yamuna Bank Shelter Cluster 9.');
    }
  } catch (seedErr) {
    console.error('Initial data seed error:', seedErr);
  }

  console.log('✅ Real production relief data ready in database');
}

module.exports = {
  db,
  notify,
  logHistory,
  initSchema,
  seedInitialData,
  seedDemoData: seedInitialData
};
