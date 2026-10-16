const router = require('express').Router();
const pool = require('../db');
const { orderBy } = require('../validate');
const { auth, role, wrap } = require('../middleware');

router.use(auth, role('store_owner'));

router.get('/dashboard', wrap(async (req, res) => {
  const s = await pool.query('SELECT id,name,address FROM stores WHERE owner_id=$1', [req.user.id]);
  if (!s.rows[0]) return res.json({ store: null, average: 0, raters: [] });
  const ord = orderBy(req.query, { name: 'u.name', email: 'u.email', rating: 'r.rating', date: 'r.updated_at' }, 'name');
  const raters = await pool.query(
    `SELECT u.id,u.name,u.email,r.rating,r.updated_at FROM ratings r JOIN users u ON u.id=r.user_id
     WHERE r.store_id=$1 ${ord}`, [s.rows[0].id]);
  const avg = await pool.query('SELECT COALESCE(ROUND(AVG(rating),2),0)::float AS a FROM ratings WHERE store_id=$1', [s.rows[0].id]);
  res.json({ store: s.rows[0], average: avg.rows[0].a, raters: raters.rows });
}));

module.exports = router;
