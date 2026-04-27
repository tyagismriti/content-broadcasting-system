const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function runMigrations() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('Database schema applied successfully');
  } catch (err) {
    console.error('Migration error:', err.message);
    throw err;
  }
}

module.exports = runMigrations;
