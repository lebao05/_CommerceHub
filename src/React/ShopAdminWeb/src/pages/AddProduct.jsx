import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCatalog, slugify } from '../store/catalog.jsx';

export default function AddProduct() {
  const { flatCategories, slugExists, addProductWithOptions } = useCatalog();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [categoryId, setCategoryId] = useState(flatCategories[0]?.id ?? '');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState([{ name: '', values: [{ value: '' }] }]);
  const [error, setError] = useState('');

  const onName = (v) => {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const addOptionRow = () => setOptions((o) => [...o, { name: '', values: [{ value: '' }] }]);
  const removeOptionRow = (i) => setOptions((o) => o.filter((_, x) => x !== i));
  const setOptionName = (i, v) => setOptions((o) => o.map((row, x) => (x === i ? { ...row, name: v } : row)));
  const addValueRow = (i) => setOptions((o) => o.map((row, x) => (x === i ? { ...row, values: [...row.values, { value: '' }] } : row)));
  const setValue = (i, j, v) => setOptions((o) => o.map((row, x) => (x === i ? { ...row, values: row.values.map((c, y) => (y === j ? { value: v } : c)) } : row)));
  const removeValueRow = (i, j) => setOptions((o) => o.map((row, x) => (x === i ? { ...row, values: row.values.filter((_, y) => y !== j) } : row)));

  const submit = (publish) => {
    setError('');
    try {
      const trimmedOptions = options
        .filter((o) => o.name.trim())
        .map((o) => ({ name: o.name, values: o.values.filter((v) => v.value.trim()) }));
      const product = addProductWithOptions({
        name, slug: slug.trim(), categoryId, description,
        options: trimmedOptions,
      });
      navigate(`/products/${product.id}${publish ? '' : ''}`, { replace: false });
    } catch (e) {
      setError(e.message);
    }
  };

  const duplicateSlug = slug.trim() !== '' && slugExists(slug.trim());

  return (
    <>
      <div className="toolbar">
        <button className="btn ghost" onClick={() => navigate('/products')}>← Back to Products</button>
      </div>
      {error && <div className="card" style={{ borderColor: '#EF4444', color: '#991B1B', marginBottom: 12 }}>{error}</div>}
      <div className="grid two">
        <div className="card">
          <h3>Basic information</h3>
          <div className="form-grid">
            <label className="field">Product name*<input value={name} onChange={(e) => onName(e.target.value)} placeholder="Aurora Wireless Headphones" /></label>
            <label className="field">Slug*<input value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} placeholder="aurora-wireless-headphones" />
              <span style={{ fontSize: 12, color: duplicateSlug ? '#991B1B' : '#64748B' }}>
                {duplicateSlug ? 'This slug already exists.' : 'URL-friendly identifier, must be unique.'}
              </span>
            </label>
            <label className="field">Category*<select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {flatCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select></label>
            <label className="field">Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Full product description…" /></label>
            <div style={{ fontSize: 13, color: '#64748B' }}>
              Status on creation: <strong>Draft</strong> · mirrors <code className="mono">Product.Create</code> (Name, Slug, CategoryId, Description).
            </div>
          </div>
        </div>
        <div className="card">
          <h3>Options & values</h3>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 0 }}>
            E.g. option <strong>Color</strong> with values <strong>Black, White</strong>. Mirrors <code className="mono">ProductOption.Create(productId, name)</code> + <code className="mono">AddValue(value)</code>.
          </p>
          {options.map((opt, i) => (
            <div key={i} className="card" style={{ marginBottom: 10, background: '#F8FAFC' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input style={{ flex: 1 }} placeholder={`Option ${i + 1} name — e.g. Color`} value={opt.name} onChange={(e) => setOptionName(i, e.target.value)} />
                <button className="btn ghost small" onClick={() => removeOptionRow(i)}>Remove</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {opt.values.map((v, j) => (
                  <div key={j} style={{ display: 'flex', gap: 8 }}>
                    <input style={{ flex: 1 }} placeholder={`Value ${j + 1} — e.g. Black`} value={v.value} onChange={(e) => setValue(i, j, e.target.value)} />
                    <button className="btn ghost small" onClick={() => removeValueRow(i, j)}>✕</button>
                  </div>
                ))}
                <button className="btn secondary small" onClick={() => addValueRow(i)}>+ Add value</button>
              </div>
            </div>
          ))}
          <button className="btn secondary" onClick={addOptionRow}>+ Add option</button>
          <div className="form-row">
            <button className="btn ghost" onClick={() => navigate('/products')}>Cancel</button>
            <button className="btn secondary" onClick={() => submit(false)}>Save Draft</button>
            <button className="btn primary" onClick={() => submit(true)}>Create Product</button>
          </div>
        </div>
      </div>
    </>
  );
}
