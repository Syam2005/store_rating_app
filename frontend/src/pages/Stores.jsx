import { useEffect, useState } from 'react';
import api from '../api';
import { SortableTable, useSort, ChangePassword } from '../components.jsx';

export default function StoreList() {
  const [filters, setFilters] = useState({ name: '', address: '' });
  const [{ sort, order }, toggle] = useSort('name');
  const [rows, setRows] = useState([]);
  const [edit, setEdit] = useState({});
  const [msg, setMsg] = useState('');
  const load = () => api.get('/stores', { params: { ...filters, sort, order } }).then((r) => setRows(r.data));
  useEffect(() => { load(); }, [filters, sort, order]);

  const save = async (id) => {
    try { await api.put(`/stores/${id}/rating`, { rating: Number(edit[id]) }); setMsg('Rating saved'); load(); }
    catch (e) { setMsg(e.response?.data?.message || 'Failed'); }
  };

  return (
    <main>
      <div className="card">
        <h3>Stores</h3>
        <div className="row">
          <input placeholder="Search by name" value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} />
          <input placeholder="Search by address" value={filters.address} onChange={(e) => setFilters({ ...filters, address: e.target.value })} />
        </div>
        {msg && <div className="ok">{msg}</div>}
        <SortableTable sort={sort} order={order} onSort={toggle} rows={rows}
          columns={[
            { key: 'name', label: 'Store', sortable: true },
            { key: 'address', label: 'Address', sortable: true },
            { key: 'overall', label: 'Overall rating', sortable: true },
            { key: 'my_rating', label: 'Your rating', render: (r) => r.my_rating ?? '—' },
            { key: 'act', label: 'Rate', render: (r) => (
              <span className="row" onClick={(e) => e.stopPropagation()}>
                <select value={edit[r.id] ?? r.my_rating ?? ''} onChange={(e) => setEdit({ ...edit, [r.id]: e.target.value })}>
                  <option value="" disabled>Select</option>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}
                </select>
                <button disabled={!edit[r.id]} onClick={() => save(r.id)}>{r.my_rating ? 'Modify' : 'Submit'}</button>
              </span>) },
          ]} />
      </div>
      <ChangePassword />
    </main>
  );
}
