const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;
export function validate(v, fields) {
  const e = {};
  if (fields.includes('name') && (v.name.trim().length < 20 || v.name.trim().length > 60)) e.name = 'Name must be 20-60 characters';
  if (fields.includes('email') && !EMAIL.test(v.email)) e.email = 'Enter a valid email';
  if (fields.includes('address') && (!v.address.trim() || v.address.length > 400)) e.address = 'Address required (max 400 chars)';
  if (fields.includes('password') && !PASSWORD.test(v.password)) e.password = '8-16 chars, one uppercase, one special character';
  return e;
}
