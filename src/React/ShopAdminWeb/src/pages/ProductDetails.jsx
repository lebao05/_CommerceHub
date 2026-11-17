import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCatalog } from '../store/catalog.jsx';
import Badge from '../components/Badge.jsx';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProduct, categoryName, addOption, removeOption, addOptionValue, removeOptionValue, updateStock } = useCatalog();
  const product = getProduct(id);
  const [optionName, setOptionName] = useState('');
  const [valueInputs, setValueInputs] = useState({});
  const [error, setError] = useState('');
  const [stockDraft, setStockDraft] = useState('');
  const [stockSaved, setStockSaved] = useState(false);

  useEffect(() => {
    if (product) setStockDraft(String(product.stock ?? 0));
  }, [product?.id, product?.stock]);

  if (!product) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <h2 style={{ margin: 0 }}>Product not found</h2>
        <p style={{ color: '#64748B' }}>It may have been removed.</p>
        <Link to="/products"><button className="btn primary">Back to Products</button></Link>
      </div>
    );
  }

  const createOption = () => {
    setError('');
    try {
      addOption(product.id, optionName);
      setOptionName('');
    } catch (e) { setError(e.message); }
  };

  const createValue = (optionId) => {
    setError('');
    try {
      const v = valueInputs[optionId] ?? '';
      addOptionValue(product.id, optionId, v);
      setValueInputs((s) => ({ ...s, [optionId]: '' }));
    } catch (e) { setError(e.message); }
  };

  const saveStock = () => {
    setError('');
    try {
      updateStock(product.id, stockDraft);
      setStockSaved(true);
      setTimeout(() => setStockSaved(false), 1500);
    } catch (e) { setError(e.message); }
  };

  return (
    <>
      <div className="toolbar">
        <button className="btn ghost" onClick={() => navigate('/products')}>← Back to Products</button>
        <span style={{ flex: 1 }} />
        <button className="btn primary" onClick={() => navigate('/products/new')}>+ New Product</button>
      </div>
      {error && <div className="card" style={{ borderColor: '#EF4444', color: '#991B1B', marginBottom: 12 }}>{error}</div>}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0 }}>{product.name}</h3>
          <Badge value={product.status} />
        </div>
        <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
          <code className="mono">{product.slug}</code> · {categoryName(product.categoryId)} {product.featured ? '· ★ Featured' : ''}
        </div>
        <p style={{ marginBottom: 0 }}>{product.description || 'No description.'}</p>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Stock</h3>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 0 }}>
          Current on-hand quantity. Stock of 0 shows as out of stock, under 20 shows as low.
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="number"
            min={0}
            step={1}
            value={stockDraft}
            onChange={(e) => setStockDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveStock(); }}
            style={{ width: 140 }}
          />
          <button className="btn primary" onClick={saveStock}>Update Stock</button>
          {stockSaved && <span style={{ fontSize: 13, color: '#166534' }}>Stock updated to {product.stock}.</span>}
        </div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Create ProductOption</h3>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 0 }}>
          Mirrors <code className="mono">Product.AddOption(name)</code> → <code className="mono">ProductOption.Create(productId, name)</code>.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input style={{ flex: 1 }} placeholder="Option name — e.g. Color, Size" value={optionName} onChange={(e) => setOptionName(e.target.value)} />
          <button className="btn primary" onClick={createOption}>Add Option</button>
        </div>
      </div>
      <h3 style={{ margin: '8px 0 12px' }}>Options ({product.options.length})</h3>
      <div className="grid">
        {product.options.map((opt) => (
          <div key={opt.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <strong>{opt.name}</strong>
              <button className="btn ghost small" onClick={() => { if (window.confirm(`Remove option "${opt.name}" and its values?`)) removeOption(product.id, opt.id); }}>Remove option</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '10px 0' }}>
              {opt.values.map((v) => (
                <span key={v.id} className="badge neutral" style={{ textTransform: 'none', fontSize: 13 }}>
                  {v.value} <button onClick={() => removeOptionValue(product.id, opt.id, v.id)} style={{ border: 0, background: 'transparent', cursor: 'pointer' }} title="Remove value">✕</button>
                </span>
              ))}
              {!opt.values.length && <span style={{ fontSize: 13, color: '#64748B' }}>No values yet — add the first one below.</span>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                style={{ flex: 1 }}
                placeholder={`New value for ${opt.name} — e.g. Black`}
                value={valueInputs[opt.id] ?? ''}
                onChange={(e) => setValueInputs((s) => ({ ...s, [opt.id]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') createValue(opt.id); }}
              />
              <button className="btn secondary small" style={{ height: 40 }} onClick={() => createValue(opt.id)}>Add Value</button>
            </div>
          </div>
        ))}
        {!product.options.length && <div className="card">No options yet. Create the first option above.</div>}
      </div>
    </>
  );
}
