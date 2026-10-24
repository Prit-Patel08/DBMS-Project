const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

// Test MySQL database connectivity before starting server listener
pool.getConnection()
  .then((conn) => {
    console.log(`[Database] Connected successfully to MySQL database '${process.env.DB_NAME || 'hackarena_db'}'.`);
    conn.release();

    app.listen(PORT, () => {
      console.log(`[Server] HackArena backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[Database Error] Failed to connect to MySQL database:', err.message);
    process.exit(1);
  });
