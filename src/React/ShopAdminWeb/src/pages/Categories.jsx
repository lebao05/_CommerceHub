import { useState } from 'react';
import { categories as seed } from '../data/mock.js';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';

// Categories are limited to max depth 2:
// depth 1 = root category, depth 2 = subcategory. No deeper nesting.
const MAX_DEPTH = 2;

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function Node({ node, depth, onAdd, onEdit, onDelete }) {
  const canAddSub = depth < MAX_DEPTH;
  return (
    <div className="tree-node">
      <div className="row">
        <div>
          <span style={{ fontSize: 11, color: '#64748B', marginRight: 6 }}>L{depth}</span>
          <strong>{node.name}</strong>{' '}
          <code className="mono">{node.slug}</code>{' '}
          <span style={{ color: '#64748B', fontSize: 12 }}>{node.count} products</span>{' '}
          <Badge value={node.active ? 'Active' : 'Inactive'} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {canAddSub && (
            <button className="btn secondary small" onClick={() => onAdd(node, depth)}>Add sub</button>
          )}
          <button className="btn ghost small" onClick={() => onEdit(node)}>Edit</button>
          <button className="btn ghost small" onClick={() => onDelete(node)}>Delete</button>
        </div>
      </div>
      {node.children?.length > 0 && (
        <div className="tree-children">
          {node.children.map((c) => (
            <Node key={c.id} node={c} depth={depth + 1} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Categories() {
  const [tree, setTree] = useState(seed);
  const [modal, setModal] = useState(null); // {mode:'add-root'|'add-sub'|'edit', parent?, parentDepth?, node?}
  const [form, setForm] = useState({ name: '', slug: '', description: '', active: true });

  const openAddRoot = () => { setForm({ name: '', slug: '', description: '', active: true }); setModal({ mode: 'add-root' }); };
  const openAddSub = (parent, parentDepth) => {
    if (parentDepth >= MAX_DEPTH) return;
    setForm({ name: '', slug: '', description: '', active: true });
    setModal({ mode: 'add-sub', parent });
  };
  const openEdit = (node) => { setForm({ name: node.name, slug: node.slug, description: '', active: node.active }); setModal({ mode: 'edit', node }); };

  const updateTree = (fn) => setTree((t) => fn(structuredClone(t)));

  const save = () => {
    if (!form.name.trim()) return;
    const slug = form.slug.trim() || slugify(form.name);
    if (modal.mode === 'add-root') {
      updateTree((t) => { t.push({ id: `cat-${Date.now()}`, name: form.name, slug, count: 0, active: form.active, children: [] }); return t; });
    } else if (modal.mode === 'add-sub') {
      updateTree((t) => {
        const walk = (nodes) => nodes.forEach((n) => {
          if (n.id === modal.parent.id) (n.children ??= []).push({ id: `cat-${Date.now()}`, name: form.name, slug, count: 0, active: form.active, children: [] });
          else walk(n.children ?? []);
        });
        walk(t); return t;
      });
    } else {
      updateTree((t) => {
        const walk = (nodes) => nodes.forEach((n) => {
          if (n.id === modal.node.id) { n.name = form.name; n.slug = slug; n.active = form.active; }
          else walk(n.children ?? []);
        });
        walk(t); return t;
      });
    }
    setModal(null);
  };

  const removeNode = (target) => {
    if (!window.confirm(`Delete category "${target.name}"?`)) return;
    updateTree((t) => {
      const walk = (nodes) => nodes.filter((n) => {
        n.children = walk(n.children ?? []);
        return n.id !== target.id;
      });
      return walk(t);
    });
  };

  return (
    <>
      <div className="toolbar">
        <button className="btn primary" onClick={openAddRoot}>Add Category</button>
        <span style={{ fontSize: 13, color: '#64748B' }}>Max depth: 2 levels (category → subcategory). “Add sub” is hidden on level-2 nodes.</span>
      </div>
      <div className="tree">
        {tree.map((n) => (
          <Node key={n.id} node={n} depth={1} onAdd={openAddSub} onEdit={openEdit} onDelete={removeNode} />
        ))}
      </div>
      {modal && (
        <Modal title={modal.mode === 'edit' ? 'Edit Category' : modal.mode === 'add-sub' ? `Add Subcategory to ${modal.parent.name} (level 2 of 2)` : 'Add Category (level 1)'} onClose={() => setModal(null)}>
          <div className="form-grid">
            <label className="field">Name*<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} /></label>
            <label className="field">Slug<input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></label>
            <label className="field">Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <label style={{ fontSize: 13 }}><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
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
