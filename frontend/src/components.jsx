import { useState } from 'react';
import api, { errMsg } from './api';
import { validate } from './validators';

export function Field({ label, error, ...props }) {
  return (<label style={{ display: 'block', marginBottom: 8 }}>{label}
    {props.type === 'textarea' ? <textarea {...props} /> : <input {...props} />}
    {error && <div className="err">{error}</div>}</label>);
}

export function SortableTable({ columns, rows, sort, order, onSort, onRowClick }) {
  return (
    <table>
      <thead><tr>{columns.map((c) => (
        <th key={c.key} className={c.sortable ? 'sortable' : ''} onClick={() => c.sortable && onSort(c.key)}>
          {c.label}{sort === c.key ? (order === 'asc' ? ' ▲' : ' ▼') : ''}</th>))}</tr></thead>
      <tbody>
        {rows.length === 0 && <tr><td colSpan={columns.length}>No records</td></tr>}
        {rows.map((r) => (
          <tr key={r.id} onClick={() => onRowClick?.(r)} style={{ cursor: onRowClick ? 'pointer' : 'default' }}>
            {columns.map((c) => <td key={c.key}>{c.render ? c.render(r) : r[c.key]}</td>)}</tr>))}
      </tbody>
    </table>
  );
}

export function useSort(defKey = 'name') {
  const [s, setS] = useState({ sort: defKey, order: 'asc' });
  const toggle = (k) => setS((p) => ({ sort: k, order: p.sort === k && p.order === 'asc' ? 'desc' : 'asc' }));
  return [s, toggle];
}

export function ChangePassword() {
  const [f, setF] = useState({ currentPassword: '', newPassword: '' });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setMsg('');
    const v = validate({ password: f.newPassword }, ['password']);
    if (v.password) return setErrors({ newPassword: v.password });
    try { await api.put('/auth/password', f); setErrors({}); setMsg('Password updated'); setF({ currentPassword: '', newPassword: '' }); }
    catch (er) { setErrors(errMsg(er)); }
  };
  return (
    <form className="card" onSubmit={submit}>
      <h3>Update password</h3>
      <Field label="Current password" type="password" value={f.currentPassword} error={errors.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} />
      <Field label="New password" type="password" value={f.newPassword} error={errors.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} />
      {errors._ && <div className="err">{errors._}</div>}{msg && <div className="ok">{msg}</div>}
      <button>Update password</button>
    </form>
  );
}
