import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useUsers } from '../store/users.jsx';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getUser, updateUser, toggleActive, userStats, sellerProducts, userActivity } = useUsers();
  const user = getUser(id);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  if (!user) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <h2 style={{ margin: 0 }}>User not found</h2>
        <p style={{ color: '#64748B' }}>This user may have been removed.</p>
        <Link to="/users"><button className="btn primary">Back to Users</button></Link>
      </div>
    );
  }

  const stats = userStats(user);
  const products = sellerProducts(user);
  const activity = userActivity(user);

  const openEdit = () => {
    setForm({ name: user.name, email: user.email, phone: user.phone ?? '', location: user.location ?? '', role: user.role, status: user.status });
    setEditing(true);
  };
  const save = () => {
    updateUser(user.id, form);
    setEditing(false);
  };

  return (
    <>
      <div className="toolbar">
        <button className="btn ghost" onClick={() => navigate('/users')}>← Back to Users</button>
        <span style={{ flex: 1 }} />
        <button className="btn secondary" onClick={openEdit}>Edit user</button>
        <button className="btn secondary" onClick={() => toggleActive(user.id)}>
          {user.status === 'Active' ? 'Deactivate' : 'Activate'}
        </button>
      </div>

      <div className="grid two">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <h3 style={{ margin: 0 }}>{user.name}</h3>
            <span style={{ display: 'flex', gap: 6 }}>
              <Badge value={user.role} />
              <Badge value={user.status} />
            </span>
          </div>
          <div className="kv" style={{ marginTop: 12 }}>
            <span>Email</span><span>{user.email}</span>
            <span>Phone</span><span>{user.phone || '—'}</span>
            <span>Location</span><span>{user.location || '—'}</span>
            <span>Joined</span><span>{user.joined}</span>
            <span>Last login</span><span>{user.lastLogin || '—'}</span>
          </div>
          <h3 style={{ marginTop: 16 }}>Addresses</h3>
          {!user.addresses?.length && <p style={{ fontSize: 13, color: '#64748B' }}>No saved addresses.</p>}
          {(user.addresses ?? []).map((a, i) => (
            <div key={i} className="card" style={{ background: '#F8FAFC', marginBottom: 8 }}>
              <strong>{a.label}</strong> {a.isDefault && <Badge value="Default" />}
              <div style={{ fontSize: 13 }}>{a.line}</div>
              <div style={{ fontSize: 13, color: '#64748B' }}>{a.city}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3>Summary</h3>
          <div className="grid metrics">
            <div className="card metric" style={{ background: '#F8FAFC' }}>
              <div style={{ fontSize: 13, color: '#64748B' }}>Orders</div>
              <div className="value">{stats.orderCount}</div>
            </div>
            <div className="card metric" style={{ background: '#F8FAFC' }}>
              <div style={{ fontSize: 13, color: '#64748B' }}>Total spent</div>
              <div className="value">${stats.totalSpent.toFixed(2)}</div>
            </div>
            <div className="card metric" style={{ background: '#F8FAFC' }}>
              <div style={{ fontSize: 13, color: '#64748B' }}>Avg order</div>
              <div className="value">${stats.avgOrder.toFixed(2)}</div>
            </div>
            <div className="card metric" style={{ background: '#F8FAFC' }}>
              <div style={{ fontSize: 13, color: '#64748B' }}>Last order</div>
              <div className="value" style={{ fontSize: 18 }}>{stats.lastOrder ?? '—'}</div>
            </div>
          </div>
          {user.role === 'Seller' && (
            <>
              <h3 style={{ marginTop: 16 }}>Products ({products.length})</h3>
              {!products.length && <p style={{ fontSize: 13, color: '#64748B' }}>No products matched to this seller in mock data.</p>}
              {products.map((p) => (
                <div key={p.id} style={{ fontSize: 13, padding: '6px 0', borderBottom: '1px solid #E2E8F0' }}>
                  <strong>{p.name}</strong> · <code className="mono">{p.sku}</code> · {p.status}
                </div>
              ))}
            </>
          )}
          <h3 style={{ marginTop: 16 }}>Recent activity</h3>
          {!activity.length && <p style={{ fontSize: 13, color: '#64748B' }}>No audit entries for this user.</p>}
          {activity.map((a) => (
            <div key={a.id} style={{ fontSize: 13, padding: '6px 0', borderBottom: '1px solid #E2E8F0' }}>
              <code className="mono">{a.action}</code> · {a.target} · {a.at} · <Badge value={a.result} />
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16, padding: 0, overflow: 'auto' }}>
        <h3 style={{ margin: 0, padding: '16px 16px 0' }}>Orders of this user ({stats.orders.length})</h3>
        <table className="table">
          <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
          <tbody>
            {stats.orders.map((o) => (
              <tr key={o.id} onClick={() => navigate('/orders')} style={{ cursor: 'pointer' }}>
                <td><code className="mono">{o.id}</code></td>
                <td>{o.date}</td>
                <td>{o.items}</td>
                <td>${o.total.toFixed(2)}</td>
                <td>{o.payment}</td>
                <td><Badge value={o.status} /></td>
              </tr>
            ))}
            {!stats.orders.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>This user has no orders yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={`Edit ${user.email}`} onClose={() => setEditing(false)}>
          <div className="form-grid">
            <label className="field">Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="field">Email<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label className="field">Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            <label className="field">Location<input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
            <label className="field">Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option>Customer</option><option>Seller</option><option>Admin</option></select></label>
            <label className="field">Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Active</option><option>Inactive</option><option>Suspended</option></select></label>
            <div className="form-row">
              <button className="btn ghost" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn primary" onClick={save}>Save</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
