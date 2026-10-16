const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { validate } = require('../validate');
const { auth, wrap } = require('../middleware');

const sign = (u) => jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
const pub = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

router.post('/signup', wrap(async (req, res) => {
  const errors = validate(req.body, ['name', 'email', 'address', 'password']);
  if (Object.keys(errors).length) return res.status(400).json({ errors });
  const { name, email, address, password } = req.body;
  const exists = await pool.query('SELECT 1 FROM users WHERE email=$1', [email.trim().toLowerCase()]);
  if (exists.rowCount) return res.status(409).json({ errors: { email: 'Email already registered' } });
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (name,email,password_hash,address,role) VALUES ($1,$2,$3,$4,'user') RETURNING *`,
    [name.trim(), email.trim().toLowerCase(), hash, address.trim()]);
  res.status(201).json({ token: sign(rows[0]), user: pub(rows[0]) });
}));

router.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [(email || '').trim().toLowerCase()]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(password || '', u.password_hash)))
    return res.status(401).json({ message: 'Invalid email or password' });
  res.json({ token: sign(u), user: pub(u) });
}));

router.put('/password', auth, wrap(async (req, res) => {
  const errors = validate({ password: req.body.newPassword }, ['password']);
  if (Object.keys(errors).length) return res.status(400).json({ errors: { newPassword: errors.password } });
  const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
  if (!(await bcrypt.compare(req.body.currentPassword || '', rows[0].password_hash)))
    return res.status(400).json({ errors: { currentPassword: 'Current password is incorrect' } });
  await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [await bcrypt.hash(req.body.newPassword, 10), req.user.id]);
  res.json({ message: 'Password updated' });
}));

module.exports = router;
