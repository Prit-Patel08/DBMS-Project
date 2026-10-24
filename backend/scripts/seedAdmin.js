const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');
require('dotenv').config();

const seedAdmin = async () => {
  const name = process.env.ADMIN_NAME || 'Project Admin';
  const email = (process.env.ADMIN_EMAIL || 'admin@hackarena.com').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';

  console.log(`[Admin Seeder] Seeding admin account: ${name} (${email})...`);

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const [existing] = await pool.query(
      'SELECT admin_id FROM admins WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      await pool.query(
        'UPDATE admins SET name = ?, password_hash = ? WHERE email = ?',
        [name, passwordHash, email]
      );
      console.log(`[Admin Seeder] Existing admin account (ID: ${existing[0].admin_id}) updated successfully.`);
    } else {
      const [result] = await pool.query(
        'INSERT INTO admins (name, email, password_hash) VALUES (?, ?, ?)',
        [name, email, passwordHash]
      );
      console.log(`[Admin Seeder] New admin account created with ID: ${result.insertId}.`);
    }

    console.log('[Admin Seeder] Admin credentials initialized successfully.');
  } catch (error) {
    console.error('[Admin Seeder Error]:', error.message);
  } finally {
    await pool.end();
  }
};

seedAdmin();
