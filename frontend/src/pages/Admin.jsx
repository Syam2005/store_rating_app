import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { Field, SortableTable, useSort, ChangePassword } from '../components.jsx';
import { validate } from '../validators';

const empty = { name: '', email: '', address: '', password: '', role: 'user' };

export default function AdminDashboard() {
  const [tab, setTab] = useState('users');
  const [stats, setStats] = useState({});
  const [reload, setReload] = useState(0);
  useEffect(() => { api.get('/admin/stats').then((r) => setStats(r.data)); }, [reload]);
  return (
    <main>
      <div className="grid">
        {[['Total users', stats.users], ['Total stores', stats.stores], ['Total ratings', stats.ratings]].map(([l, v]) => (
          <div className="card" key={l}><div>{l}</div><div className="stat">{v ?? '-'}</div></div>))}
      </div>
      <div className="tabs card">
        {['users', 'stores', 'add user', 'add store', 'password'].map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>))}
      </div>
      {tab === 'users' && <Users />}
      {tab === 'stores' && <Stores />}
      {tab === 'add user' && <AddUser onDone={() => setReload(reload + 1)} />}
      {tab === 'add store' && <AddStore onDone={() => setReload(reload + 1)} />}
      {tab === 'password' && <ChangePassword />}
    </main>
  );
}

function Users() {
  const [filters, setFilters] = useState({ name: '', email: '', address: '', role: '' });
  const [{ sort, order }, toggle] = useSort('name');
  const [rows, setRows] = useState([]);
  const [detail, setDetail] = useState(null);
  useEffect(() => { api.get('/admin/users', { params: { ...filters, sort, order } }).then((r) => setRows(r.data)); }, [filters, sort, order]);
  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  return (
    <div className="card">
      <div className="row">
        <input placeholder="Filter name" value={filters.name} onChange={set('name')} />
        <input placeholder="Filter email" value={filters.email} onChange={set('email')} />
        <input placeholder="Filter address" value={filters.address} onChange={set('address')} />
        <select value={filters.role} onChange={set('role')}>
          <option value="">All roles</option><option value="admin">Admin</option><option value="user">Normal user</option><option value="store_owner">Store owner</option>
        </select>
      </div>
      <SortableTable sort={sort} order={order} onSort={toggle} rows={rows}
        onRowClick={(r) => api.get(`/admin/users/${r.id}`).then((d) => setDetail(d.data))}
        columns={[{ key: 'name', label: 'Name', sortable: true }, { key: 'email', label: 'Email', sortable: true },
          { key: 'address', label: 'Address', sortable: true }, { key: 'role', label: 'Role', sortable: true }]} />
      {detail && (
        <div className="card" style={{ background: '#f9fafb', marginTop: 16 }}>
          <h3>User details</h3>
          <p>Name: {detail.name}<br />Email: {detail.email}<br />Address: {detail.address}<br />Role: {detail.role}
            {detail.role === 'store_owner' && <><br />Rating: {detail.rating ?? 'No ratings yet'}</>}</p>
          <button className="secondary" onClick={() => setDetail(null)}>Close</button>
        </div>)}
    </div>
  );
}

function Stores() {
  const [filters, setFilters] = useState({ name: '', email: '', address: '' });
  const [{ sort, order }, toggle] = useSort('name');
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get('/admin/stores', { params: { ...filters, sort, order } }).then((r) => setRows(r.data)); }, [filters, sort, order]);
  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  return (
    <div className="card">
      <div className="row">
        <input placeholder="Filter name" value={filters.name} onChange={set('name')} />
        <input placeholder="Filter email" value={filters.email} onChange={set('email')} />
        <input placeholder="Filter address" value={filters.address} onChange={set('address')} />
      </div>
      <SortableTable sort={sort} order={order} onSort={toggle} rows={rows}
        columns={[{ key: 'name', label: 'Name', sortable: true }, { key: 'email', label: 'Email', sortable: true },
          { key: 'address', label: 'Address', sortable: true }, { key: 'rating', label: 'Rating', sortable: true }]} />
    </div>
  );
}

function AddUser({ onDone }) {
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setMsg('');
    const v = validate(f, ['name', 'email', 'address', 'password']);
    if (Object.keys(v).length) return setErrors(v);
    try { await api.post('/admin/users', f); setErrors({}); setF(empty); setMsg('User created'); onDone(); }
    catch (er) { setErrors(errMsg(er)); }
  };
  return (
    <form className="card" onSubmit={submit}>
      <h3>Add user</h3>
      <Field label="Name" value={f.name} error={errors.name} onChange={set('name')} />
      <Field label="Email" value={f.email} error={errors.email} onChange={set('email')} />
      <Field label="Address" type="textarea" value={f.address} error={errors.address} onChange={set('address')} />
      <Field label="Password" type="password" value={f.password} error={errors.password} onChange={set('password')} />
      <label>Role<select value={f.role} onChange={set('role')}><option value="user">Normal user</option><option value="admin">Admin</option><option value="store_owner">Store owner</option></select></label>
      {errors._ && <div className="err">{errors._}</div>}{msg && <div className="ok">{msg}</div>}
      <button>Create user</button>
    </form>
  );
}

function AddStore({ onDone }) {
  const [f, setF] = useState({ name: '', email: '', address: '', ownerId: '' });
  const [owners, setOwners] = useState([]);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  useEffect(() => { api.get('/admin/owners').then((r) => setOwners(r.data)); }, [msg]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setMsg('');
    const v = validate(f, ['name', 'email', 'address']);
    if (Object.keys(v).length) return setErrors(v);
    try { await api.post('/admin/stores', { ...f, ownerId: f.ownerId || null }); setErrors({}); setF({ name: '', email: '', address: '', ownerId: '' }); setMsg('Store created'); onDone(); }
    catch (er) { setErrors(errMsg(er)); }
  };
  return (
    <form className="card" onSubmit={submit}>
      <h3>Add store</h3>
      <Field label="Store name" value={f.name} error={errors.name} onChange={set('name')} />
      <Field label="Email" value={f.email} error={errors.email} onChange={set('email')} />
      <Field label="Address" type="textarea" value={f.address} error={errors.address} onChange={set('address')} />
      <label>Store owner (optional)<select value={f.ownerId} onChange={set('ownerId')}>
        <option value="">— none —</option>{owners.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.email})</option>)}</select></label>
      {errors.ownerId && <div className="err">{errors.ownerId}</div>}
      {errors._ && <div className="err">{errors._}</div>}{msg && <div className="ok">{msg}</div>}
      <button>Create store</button>
    </form>
  );
}
