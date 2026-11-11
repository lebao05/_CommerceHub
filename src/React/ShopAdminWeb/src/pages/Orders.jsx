import { useMemo, useState } from 'react';
import { orders as seed } from '../data/mock.js';
import Badge from '../components/Badge.jsx';

export default function Orders() {
  const [rows] = useState(seed);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => rows.filter((o) =>
    (status === 'All' || o.status === status) &&
    (q === '' || (o.id + o.customer).toLowerCase().includes(q.toLowerCase()))), [rows, q, status]);

  return (
    <div className="grid two">
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <div className="toolbar" style={{ padding: '16px 16px 0' }}>
          <input placeholder="Search order # or customer…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 260 }} />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
          </select>
          <button className="btn secondary" onClick={() => alert('Mockup: export CSV')}>Export</button>
        </div>
        <table className="table">
          <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} onClick={() => setSelected(o)} style={{ cursor: 'pointer', background: selected?.id === o.id ? '#f1f5f9' : undefined }}>
                <td><code className="mono">{o.id}</code></td>
                <td>{o.date}</td>
                <td>{o.customer}</td>
                <td>{o.items}</td>
                <td>${o.total.toFixed(2)}</td>
                <td><Badge value={o.status} /></td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>No orders found.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="card drawer">
        {!selected ? <p style={{ color: '#64748B' }}>Select an order to see details.</p> : (
          <>
            <h3>{selected.id}</h3>
            <div className="kv">
              <span>Customer</span><span>{selected.customer}</span>
              <span>Date</span><span>{selected.date}</span>
              <span>Status</span><span><Badge value={selected.status} /></span>
              <span>Payment</span><span>{selected.payment}</span>
              <span>Total</span><span><strong>${selected.total.toFixed(2)}</strong></span>
            </div>
            <div className="form-row" style={{ justifyContent: 'flex-start' }}>
              <button className="btn secondary small" onClick={() => alert(`Mockup: tracking for ${selected.id}`)}>Track shipment</button>
              <button className="btn ghost small" onClick={() => alert(`Mockup: invoice for ${selected.id}`)}>Download invoice</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
