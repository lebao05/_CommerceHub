import { useState } from 'react';

const tabs = ['General', 'Payments', 'Shipping'];

export default function Settings() {
  const [tab, setTab] = useState('General');
  const [saved, setSaved] = useState('');
  return (
    <>
      <div className="tabs">
        {tabs.map((t) => (
          <button key={t} className={`btn secondary ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      <div className="card">
        <div className="form-grid" style={{ maxWidth: 560 }}>
          {tab === 'General' && (
            <>
              <label className="field">Store name<input defaultValue="CommerceHub" /></label>
              <label className="field">Support email<input defaultValue="support@commercehub.com" /></label>
              <label className="field">Currency<select><option>USD</option><option>EUR</option><option>VND</option></select></label>
            </>
          )}
          {tab === 'Payments' && (
            <>
              <label className="field">Provider<select><option>Stripe</option><option>PayPal</option><option>Bank Transfer</option></select></label>
              <label className="field">Publishable key<input defaultValue="pk_test_mock_123" /></label>
              <label className="field">Webhook secret<input defaultValue="whsec_mock" /></label>
            </>
          )}
          {tab === 'Shipping' && (
            <>
              <label className="field">Default carrier<select><option>GHN</option><option>GHTK</option><option>DHL</option></select></label>
              <label className="field">Standard rate (USD)<input defaultValue="5.99" /></label>
              <label className="field">Express rate (USD)<input defaultValue="12.99" /></label>
            </>
          )}
          <div className="form-row" style={{ justifyContent: 'flex-start' }}>
            <button className="btn primary" onClick={() => setSaved(`Saved ${tab} settings (mockup).`)}>Save {tab}</button>
            {saved && <span style={{ fontSize: 13, color: '#15803d' }}>{saved}</span>}
          </div>
        </div>
      </div>
    </>
  );
}
