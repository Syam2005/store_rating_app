import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { Field } from '../components.jsx';
import { validate } from '../validators';
import { useAuth } from '../App.jsx';

export function Login() {
  const { login } = useAuth();
  const [f, setF] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const submit = async (e) => {
    e.preventDefault();
    try { const { data } = await api.post('/auth/login', f); login(data.token, data.user); }
    catch (er) { setErrors(errMsg(er)); }
  };
  return (
    <form className="card center" onSubmit={submit}>
      <h2>Login</h2>
      <Field label="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <Field label="Password" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      {errors._ && <div className="err">{errors._}</div>}
      <button>Login</button> <Link to="/signup">Create account</Link>
    </form>
  );
}

export function Signup() {
  const { login } = useAuth();
  const [f, setF] = useState({ name: '', email: '', address: '', password: '' });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    const v = validate(f, ['name', 'email', 'address', 'password']);
    if (Object.keys(v).length) return setErrors(v);
    try { const { data } = await api.post('/auth/signup', f); login(data.token, data.user); }
    catch (er) { setErrors(errMsg(er)); }
  };
  return (
    <form className="card center" onSubmit={submit}>
      <h2>Sign up</h2>
      <Field label="Name (20-60 chars)" value={f.name} error={errors.name} onChange={set('name')} />
      <Field label="Email" value={f.email} error={errors.email} onChange={set('email')} />
      <Field label="Address" type="textarea" value={f.address} error={errors.address} onChange={set('address')} />
      <Field label="Password" type="password" value={f.password} error={errors.password} onChange={set('password')} />
      {errors._ && <div className="err">{errors._}</div>}
      <button>Sign up</button> <Link to="/login">Back to login</Link>
    </form>
  );
}
