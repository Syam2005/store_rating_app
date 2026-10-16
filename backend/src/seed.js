require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./db');

(async () => {
  await pool.query(fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8'));
  const hash = await bcrypt.hash('Admin@123', 10);
  await pool.query(
    `INSERT INTO users (name,email,password_hash,address,role)
     VALUES ('System Administrator Account','admin@example.com',$1,'Head Office','admin')
     ON CONFLICT (email) DO NOTHING`, [hash]);
  console.log('Schema ready. Admin: admin@example.com / Admin@123');
  await pool.end();
})().catch(e => { console.error(e); process.exit(1); });
