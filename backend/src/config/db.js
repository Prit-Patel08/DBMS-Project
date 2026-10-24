const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'hackarena_app',
  password: process.env.DB_PASSWORD || 'HackArena@2026',
  database: process.env.DB_NAME || 'hackarena_db',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  charset: 'utf8mb4',
  dateStrings: true
});

module.exports = pool;
