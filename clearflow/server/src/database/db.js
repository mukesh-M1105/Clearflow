const { Pool } = require('pg');
const { PGlite } = require('@electric-sql/pglite');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let pool = null;
let pgliteInstance = null;
let activeEngine = null;

/**
 * Initialize PostgreSQL connection or fallback to embedded PGlite
 */
async function initDatabase() {
  if (activeEngine) return;

  const connectionString = process.env.DATABASE_URL;

  // Try standard PostgreSQL first if configured
  if (connectionString) {
    try {
      const testPool = new Pool({
        connectionString,
        connectionTimeoutMillis: 2000
      });
      // Test the connection
      await testPool.query('SELECT 1');
      pool = testPool;
      activeEngine = 'POSTGRES_REMOTE';
      console.log('✅ Connected successfully to external/local PostgreSQL server via pg.Pool');
      return;
    } catch (err) {
      console.warn('⚠️  Could not connect to external PostgreSQL server:', err.message);
      console.log('⚡ Initializing embedded PostgreSQL engine (PGlite) for zero-configuration standalone operation...');
    }
  }

  // Fallback to embedded PostgreSQL (PGlite)
  try {
    const dataDir = path.resolve(__dirname, '../../data/pg_data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    pgliteInstance = new PGlite(dataDir);
    await pgliteInstance.waitReady;
    activeEngine = 'POSTGRES_EMBEDDED';
    console.log(`✅ Embedded PostgreSQL engine initialized successfully at ${dataDir}`);
  } catch (embeddedErr) {
    console.error('❌ Failed to initialize embedded PostgreSQL engine:', embeddedErr);
    throw embeddedErr;
  }
}

/**
 * Universal SQL Query Executor
 * Supports parameterized queries ($1, $2, ...) and returns { rows, rowCount }
 */
async function query(text, params = []) {
  if (!activeEngine) {
    await initDatabase();
  }

  if (activeEngine === 'POSTGRES_REMOTE') {
    const result = await pool.query(text, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount
    };
  } else if (activeEngine === 'POSTGRES_EMBEDDED') {
    // PGlite query supports params and returns { rows, affectedRows }
    const result = await pgliteInstance.query(text, params);
    return {
      rows: result.rows || [],
      rowCount: result.affectedRows !== undefined ? result.affectedRows : (result.rows ? result.rows.length : 0)
    };
  }

  throw new Error('Database engine not initialized');
}

/**
 * Execute raw DDL script containing multiple statements
 */
async function executeScript(sqlContent) {
  if (!activeEngine) {
    await initDatabase();
  }

  if (activeEngine === 'POSTGRES_REMOTE') {
    await pool.query(sqlContent);
  } else if (activeEngine === 'POSTGRES_EMBEDDED') {
    await pgliteInstance.exec(sqlContent);
  }
}

module.exports = {
  initDatabase,
  query,
  executeScript,
  getActiveEngine: () => activeEngine
};
