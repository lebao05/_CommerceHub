import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCatalog } from '../store/catalog.jsx';
import Badge from '../components/Badge.jsx';

export default function Products() {
  const { products, categoryName } = useCatalog();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');

  const rows = useMemo(() => products.map((p) => ({
    ...p,
    category: categoryName(p.categoryId),
  })), [products, categoryName]);

  const filtered = useMemo(() => rows.filter((p) =>
    (status === 'All' || p.status === status) &&
    (q === '' || (p.name + p.slug + p.category).toLowerCase().includes(q.toLowerCase()))), [rows, q, status]);

  return (
    <>
      <div className="toolbar">
        <input placeholder="Search name, slug, category…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {['All', 'Active', 'Draft', 'Pending', 'Inactive'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <span style={{ flex: 1 }} />
        <button className="btn primary" onClick={() => navigate('/products/new')}>Add Product</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="table">
          <thead><tr><th>Name</th><th>Slug</th><th>Category</th><th>Options</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} onClick={() => navigate(`/products/${p.id}`)} style={{ cursor: 'pointer' }}>
                <td><strong>{p.name}</strong>{p.featured ? ' ★' : ''}</td>
                <td><code className="mono">{p.slug}</code></td>
                <td>{p.category}</td>
                <td>{p.options.length ? p.options.map((o) => `${o.name} (${o.values.length})`).join(', ') : '—'}</td>
                <td><Badge value={p.status} /></td>
                <td style={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                  <button className="btn ghost small" onClick={() => navigate(`/products/${p.id}`)}>Manage options</button>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>No products match your filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
