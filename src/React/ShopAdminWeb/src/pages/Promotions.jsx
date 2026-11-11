import { useState } from 'react';
import { promotions as seed } from '../data/mock.js';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';

const empty = { name: '', code: '', type: 'Percentage', value: '', min: '', dates: '', status: 'Active' };

export default function Promotions() {
  const [rows, setRows] = useState(seed);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);

  const openNew = () => { setForm(empty); setModal({ mode: 'new' }); };
  const openEdit = (p) => { setForm({ name: p.name, code: p.code, type: p.type, value: p.value, min: p.min, dates: p.dates, status: p.status }); setModal({ mode: 'edit', id: p.id }); };
  const save = () => {
    if (!form.name.trim() || !form.code.trim()) return;
    if (modal.mode === 'new') setRows((r) => [...r, { ...form, id: `promo-${Date.now()}`, usage: '0' }]);
    else setRows((r) => r.map((x) => (x.id === modal.id ? { ...x, ...form } : x)));
    setModal(null);
  };
  const toggle = (p) => setRows((r) => r.map((x) => (x.id === p.id ? { ...x, status: x.status === 'Active' ? 'Inactive' : 'Active' } : x)));

  return (
    <>
      <div className="toolbar">
        <span style={{ flex: 1 }} />
        <button className="btn primary" onClick={openNew}>Create Promotion</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="table">
          <thead><tr><th>Name</th><th>Code</th><th>Type</th><th>Value</th><th>Min</th><th>Usage</th><th>Dates</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong></td>
                <td><code className="mono">{p.code}</code></td>
                <td>{p.type}</td>
                <td>{p.value}</td>
                <td>{p.min}</td>
                <td>{p.usage}</td>
                <td>{p.dates}</td>
                <td><Badge value={p.status} /></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn ghost small" onClick={() => openEdit(p)}>Edit</button>{' '}
                  <button className="btn secondary small" onClick={() => toggle(p)}>{p.status === 'Active' ? 'Deactivate' : 'Activate'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={modal.mode === 'new' ? 'Create Promotion' : 'Edit Promotion'} onClose={() => setModal(null)}>
          <div className="form-grid">
            <label className="field">Name*<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="field">Code*<input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></label>
            <label className="field">Discount type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>Percentage</option><option>Fixed Amount</option><option>Free Shipping</option></select></label>
            <label className="field">Value<input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="20% or 10" /></label>
            <label className="field">Minimum order<input value={form.min} onChange={(e) => setForm({ ...form, min: e.target.value })} /></label>
            <label className="field">Dates<input value={form.dates} onChange={(e) => setForm({ ...form, dates: e.target.value })} /></label>
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
