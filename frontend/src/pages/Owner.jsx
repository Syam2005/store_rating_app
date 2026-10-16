import { useEffect, useState } from 'react';
import api from '../api';
import { SortableTable, useSort, ChangePassword } from '../components.jsx';

export default function OwnerDashboard() {
  const [{ sort, order }, toggle] = useSort('name');
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/owner/dashboard', { params: { sort, order } }).then((r) => setData(r.data)); }, [sort, order]);
  if (!data) return <main>Loading…</main>;
  return (
    <main>
      <div className="card">
        {data.store ? <><h3>{data.store.name}</h3><p>{data.store.address}</p>
          <div>Average rating</div><div className="stat">{data.average || 'No ratings yet'}</div></>
          : <p>No store has been assigned to your account yet.</p>}
      </div>
      <div className="card">
        <h3>Users who rated your store</h3>
        <SortableTable sort={sort} order={order} onSort={toggle} rows={data.raters}
          columns={[{ key: 'name', label: 'Name', sortable: true }, { key: 'email', label: 'Email', sortable: true },
            { key: 'rating', label: 'Rating', sortable: true },
            { key: 'date', label: 'Updated', sortable: true, render: (r) => new Date(r.updated_at).toLocaleDateString() }]} />
      </div>
      <ChangePassword />
    </main>
  );
}
