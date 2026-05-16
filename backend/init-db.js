require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createPool } = require('./mysql');

async function runMigration() {
  const sqlPath = path.join(__dirname, 'db-setup.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('Missing db-setup.sql file.');
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  const pool = createPool();

  try {
    const statements = sql
      .split(/;\s*\n/)
      .map((stmt) => stmt.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await pool.query(statement);
    }

    console.log('Database migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Database migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
