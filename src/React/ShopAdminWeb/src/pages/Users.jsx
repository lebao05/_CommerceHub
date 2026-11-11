import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '../store/users.jsx';
import Badge from '../components/Badge.jsx';

export default function Users() {
  const { users, toggleActive } = useUsers();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('All');
  const [status, setStatus] = useState('All');

  const filtered = useMemo(() => users.filter((u) =>
    (role === 'All' || u.role === role) &&
    (status === 'All' || u.status === status) &&
    (q === '' || (u.name + u.email).toLowerCase().includes(q.toLowerCase()))), [users, q, role, status]);

  return (
    <>
      <div className="toolbar">
        <input placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 260 }} />
        <select value={role} onChange={(e) => setRole(e.target.value)}>{['All', 'Customer', 'Seller', 'Admin'].map((s) => <option key={s}>{s}</option>)}</select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>{['All', 'Active', 'Inactive', 'Suspended'].map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} onClick={() => navigate(`/users/${u.id}`)} style={{ cursor: 'pointer' }}>
                <td><strong>{u.name}</strong></td>
                <td>{u.email}</td>
                <td><Badge value={u.role} /></td>
                <td><Badge value={u.status} /></td>
                <td>{u.joined}</td>
                <td style={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                  <button className="btn ghost small" onClick={() => navigate(`/users/${u.id}`)}>View</button>{' '}
                  <button className="btn secondary small" onClick={() => toggleActive(u.id)}>{u.status === 'Active' ? 'Deactivate' : 'Activate'}</button>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>No users found.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
