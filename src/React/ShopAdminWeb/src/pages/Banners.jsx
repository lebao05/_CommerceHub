import { useMemo, useState } from 'react';
import { banners as seed } from '../data/mock.js';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';

const empty = { title: '', subtitle: '', image: '', link: '', position: 'Homepage Hero', order: 1, start: '', end: '', status: 'Active' };
const positions = ['Homepage Hero', 'Homepage Strip', 'Category Top', 'Checkout Banner'];

export default function Banners() {
  const [rows, setRows] = useState(seed);
  const [q, setQ] = useState('');
  const [position, setPosition] = useState('All');
  const [status, setStatus] = useState('All');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);

  const filtered = useMemo(() => rows
    .filter((b) =>
      (position === 'All' || b.position === position) &&
      (status === 'All' || b.status === status) &&
      (q === '' || (b.title + b.subtitle).toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => a.position.localeCompare(b.position) || a.order - b.order),
    [rows, q, position, status]);

  const liveByPosition = useMemo(() => {
    const map = {};
    rows.filter((b) => b.status === 'Active').forEach((b) => {
      (map[b.position] ??= []).push(b);
    });
    Object.values(map).forEach((list) => list.sort((a, b) => a.order - b.order));
    return map;
  }, [rows]);

  const openNew = () => { setForm({ ...empty, start: '2026-11-11', end: '2026-12-31' }); setModal({ mode: 'new' }); };
  const openEdit = (b) => { setForm({ ...b }); setModal({ mode: 'edit', id: b.id }); };
  const save = () => {
    if (!form.title.trim()) return;
    if (modal.mode === 'new') setRows((r) => [...r, { ...form, id: `b-${Date.now()}` }]);
    else setRows((r) => r.map((x) => (x.id === modal.id ? { ...form } : x)));
    setModal(null);
  };
  const toggle = (b) => setRows((r) => r.map((x) =>
    x.id === b.id ? { ...x, status: x.status === 'Active' ? 'Inactive' : 'Active' } : x));
  const remove = (b) => {
    if (!window.confirm(`Delete banner "${b.title}"?`)) return;
    setRows((r) => r.filter((x) => x.id !== b.id));
  };
  const move = (b, dir) => {
    const group = rows.filter((x) => x.position === b.position).sort((a, c) => a.order - c.order);
    const i = group.findIndex((x) => x.id === b.id);
    const j = i + dir;
    if (j < 0 || j >= group.length) return;
    const a = group[i]; const c = group[j];
    setRows((r) => r.map((x) => {
      if (x.id === a.id) return { ...x, order: c.order };
      if (x.id === c.id) return { ...x, order: a.order };
      return x;
    }));
  };

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Live preview — multiple banners can be active at once</h3>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 0 }}>
          Banners are grouped by position and shown in display-order. Several banners
          may share the same position and rotate on the storefront.
        </p>
        {Object.keys(liveByPosition).map((pos) => (
          <div key={pos} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{pos} ({liveByPosition[pos].length} live)</div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
              {liveByPosition[pos].map((b) => (
                <div key={b.id} style={{ minWidth: 220, border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                  <img src={b.image} alt={b.title} style={{ width: '100%', height: 90, objectFit: 'cover' }} />
                  <div style={{ padding: 8, fontSize: 12 }}>
                    <strong>#{b.order} {b.title}</strong>
                    <div style={{ color: '#64748B' }}>{b.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {!Object.keys(liveByPosition).length && <p style={{ fontSize: 13 }}>No active banners.</p>}
      </div>

      <div className="toolbar">
        <input placeholder="Search banners…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 220 }} />
        <select value={position} onChange={(e) => setPosition(e.target.value)}>
          {['All', ...positions].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {['All', 'Active', 'Scheduled', 'Inactive'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <span style={{ flex: 1 }} />
        <button className="btn primary" onClick={openNew}>Add Banner</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="table">
          <thead><tr><th>Preview</th><th>Title</th><th>Position / Order</th><th>Dates</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id}>
                <td><img src={b.image} alt="" style={{ width: 120, height: 52, objectFit: 'cover', borderRadius: 6 }} /></td>
                <td><strong>{b.title}</strong><div style={{ fontSize: 12, color: '#64748B' }}>{b.subtitle} · {b.link}</div></td>
                <td>{b.position}<div style={{ fontSize: 12 }}>Order: {b.order}</div></td>
                <td style={{ fontSize: 13 }}>{b.start} → {b.end}</td>
                <td><Badge value={b.status} /></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn ghost small" onClick={() => move(b, -1)}>↑</button>
                  <button className="btn ghost small" onClick={() => move(b, 1)}>↓</button>{' '}
                  <button className="btn ghost small" onClick={() => openEdit(b)}>Edit</button>{' '}
                  <button className="btn secondary small" onClick={() => toggle(b)}>{b.status === 'Active' ? 'Deactivate' : 'Activate'}</button>{' '}
                  <button className="btn ghost small" onClick={() => remove(b)}>Delete</button>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>No banners found.</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal.mode === 'new' ? 'Add Banner' : 'Edit Banner'} onClose={() => setModal(null)}>
          <div className="form-grid">
            <label className="field">Title*<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <label className="field">Subtitle<input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></label>
            <label className="field">Image URL<input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…" /></label>
            <label className="field">Target link<input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/products" /></label>
            <label className="field">Position<select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>{positions.map((p) => <option key={p}>{p}</option>)}</select></label>
            <label className="field">Display order<input type="number" min={1} value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 1 })} /></label>
            <div style={{ display: 'flex', gap: 8 }}>
              <label className="field" style={{ flex: 1 }}>Start<input type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></label>
              <label className="field" style={{ flex: 1 }}>End<input type="date" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></label>
            </div>
            <label className="field">Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Active</option><option>Scheduled</option><option>Inactive</option></select></label>
            <div className="form-row">
              <button className="btn ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn primary" onClick={save}>Save</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
