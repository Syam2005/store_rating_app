const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;

function validate(body, fields) {
  const errors = {};
  const v = (k) => (typeof body[k] === 'string' ? body[k].trim() : '');
  if (fields.includes('name') && (v('name').length < 20 || v('name').length > 60)) errors.name = 'Name must be 20-60 characters';
  if (fields.includes('address') && (!v('address') || v('address').length > 400)) errors.address = 'Address is required (max 400 characters)';
  if (fields.includes('email') && !EMAIL.test(v('email'))) errors.email = 'Invalid email';
  if (fields.includes('password') && !PASSWORD.test(body.password || '')) errors.password = 'Password: 8-16 chars, 1 uppercase, 1 special character';
  return errors;
}

// whitelist-based ORDER BY builder (prevents SQL injection)
function orderBy(q, allowed, fallback) {
  const col = allowed[q.sort] || allowed[fallback];
  const dir = String(q.order).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  return `ORDER BY ${col} ${dir}`;
}

const like = (s) => `%${(s || '').trim()}%`;
module.exports = { validate, orderBy, like };
