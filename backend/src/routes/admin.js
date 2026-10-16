const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { validate, orderBy, like } = require('../validate');
const { auth, role, wrap } = require('../middleware');

router.use(auth, role('admin'));

router.get('/stats', wrap(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT (SELECT COUNT(*) FROM users)::int AS users,
            (SELECT COUNT(*) FROM stores)::int AS stores,
            (SELECT COUNT(*) FROM ratings)::int AS ratings`);
  res.json(rows[0]);
}));

router.post('/users', wrap(async (req, res) => {
  const errors = validate(req.body, ['name', 'email', 'address', 'password']);
  if (!['admin', 'user', 'store_owner'].includes(req.body.role)) errors.role = 'Invalid role';
  if (Object.keys(errors).length) return res.status(400).json({ errors });
  const { name, email, address, password, role: r } = req.body;
  const dup = await pool.query('SELECT 1 FROM users WHERE email=$1', [email.trim().toLowerCase()]);
  if (dup.rowCount) return res.status(409).json({ errors: { email: 'Email already registered' } });
  const { rows } = await pool.query(
    `INSERT INTO users (name,email,password_hash,address,role) VALUES ($1,$2,$3,$4,$5) RETURNING id,name,email,address,role`,
    [name.trim(), email.trim().toLowerCase(), await bcrypt.hash(password, 10), address.trim(), r]);
  res.status(201).json(rows[0]);
}));

router.post('/stores', wrap(async (req, res) => {
  const errors = validate(req.body, ['name', 'email', 'address']);
  if (Object.keys(errors).length) return res.status(400).json({ errors });
  const { name, email, address, ownerId } = req.body;
  if (ownerId) {
    const o = await pool.query(`SELECT 1 FROM users WHERE id=$1 AND role='store_owner'`, [ownerId]);
    if (!o.rowCount) return res.status(400).json({ errors: { ownerId: 'Owner must be an existing store owner' } });
    const taken = await pool.query('SELECT 1 FROM stores WHERE owner_id=$1', [ownerId]);
    if (taken.rowCount) return res.status(409).json({ errors: { ownerId: 'Owner already has a store' } });
  }
  const dup = await pool.query('SELECT 1 FROM stores WHERE email=$1', [email.trim().toLowerCase()]);
  if (dup.rowCount) return res.status(409).json({ errors: { email: 'Store email already exists' } });
  const { rows } = await pool.query(
    `INSERT INTO stores (name,email,address,owner_id) VALUES ($1,$2,$3,$4) RETURNING *`,
    [name.trim(), email.trim().toLowerCase(), address.trim(), ownerId || null]);
  res.status(201).json(rows[0]);
}));

router.get('/users', wrap(async (req, res) => {
  const ord = orderBy(req.query, { name: 'u.name', email: 'u.email', address: 'u.address', role: 'u.role' }, 'name');
  const { rows } = await pool.query(
    `SELECT u.id,u.name,u.email,u.address,u.role
     FROM users u
     WHERE u.name ILIKE $1 AND u.email ILIKE $2 AND u.address ILIKE $3 AND ($4::text IS NULL OR u.role=$4)
     ${ord}`,
    [like(req.query.name), like(req.query.email), like(req.query.address), req.query.role || null]);
  res.json(rows);
}));

router.get('/users/:id', wrap(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id,u.name,u.email,u.address,u.role,
       CASE WHEN u.role='store_owner' THEN
         (SELECT ROUND(AVG(r.rating),2) FROM ratings r JOIN stores s ON s.id=r.store_id WHERE s.owner_id=u.id)
       END AS rating
     FROM users u WHERE u.id=$1`, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: 'User not found' });
  res.json(rows[0]);
}));

router.get('/stores', wrap(async (req, res) => {
  const ord = orderBy(req.query, { name: 's.name', email: 's.email', address: 's.address', rating: 'rating' }, 'name');
  const { rows } = await pool.query(
    `SELECT s.id,s.name,s.email,s.address, COALESCE(ROUND(AVG(r.rating),2),0)::float AS rating
     FROM stores s LEFT JOIN ratings r ON r.store_id=s.id
     WHERE s.name ILIKE $1 AND s.email ILIKE $2 AND s.address ILIKE $3
     GROUP BY s.id ${ord}`,
    [like(req.query.name), like(req.query.email), like(req.query.address)]);
  res.json(rows);
}));

router.get('/owners', wrap(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id,u.name,u.email FROM users u WHERE u.role='store_owner'
     AND NOT EXISTS (SELECT 1 FROM stores s WHERE s.owner_id=u.id) ORDER BY u.name`);
  res.json(rows);
}));

module.exports = router;
