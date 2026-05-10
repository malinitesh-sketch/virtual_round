const mysql = require('mysql2/promise');

// Creates a connection pool for MySQL (raw SQL approach)
function createPool() {
  const {
    DB_HOST = '127.0.0.1',
    DB_PORT = 3306,
    DB_USER = 'root',
    DB_PASS = '',
    DB_NAME = 'travelloop',
    DB_CONN_LIMIT = 10,
  } = process.env;

  return mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: Number(DB_CONN_LIMIT),
    queueLimit: 0,
    dateStrings: true,
  });
}

module.exports = { createPool };

