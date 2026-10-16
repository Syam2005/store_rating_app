const router = require('express').Router();
const pool = require('../db');
const { orderBy, like } = require('../validate');
const { auth, role, wrap } = require('../middleware');

router.use(auth, role('user'));

router.get('/', wrap(async (req, res) => {
  const ord = orderBy(req.query, { name: 's.name', address: 's.address', overall: 'overall', myRating: 'my_rating' }, 'name');
  const { rows } = await pool.query(
    `SELECT s.id,s.name,s.address,
            COALESCE(ROUND(AVG(r.rating),1),0)::float AS overall,
            (SELECT rating FROM ratings WHERE store_id=s.id AND user_id=$1) AS my_rating
     FROM stores s LEFT JOIN ratings r ON r.store_id=s.id
     WHERE s.name ILIKE $2 AND s.address ILIKE $3
     GROUP BY s.id ${ord}`,
    [req.user.id, like(req.query.name), like(req.query.address)]);
  res.json(rows);
}));

// submit or modify rating
router.put('/:id/rating', wrap(async (req, res) => {
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be an integer 1-5' });
  const s = await pool.query('SELECT 1 FROM stores WHERE id=$1', [req.params.id]);
  if (!s.rowCount) return res.status(404).json({ message: 'Store not found' });
  await pool.query(
    `INSERT INTO ratings (user_id,store_id,rating) VALUES ($1,$2,$3)
     ON CONFLICT (user_id,store_id) DO UPDATE SET rating=EXCLUDED.rating, updated_at=now()`,
    [req.user.id, req.params.id, rating]);
  res.json({ message: 'Rating saved' });
}));

module.exports = router;
