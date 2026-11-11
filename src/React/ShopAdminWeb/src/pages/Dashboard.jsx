import { useMemo } from 'react';
import { metrics, revenueSeries, ordersByStatus, topProducts, activityFeed } from '../data/mock.js';
import Badge from '../components/Badge.jsx';

export default function Dashboard() {
  const max = useMemo(() => Math.max(...revenueSeries.map((r) => r.revenue)), []);
  const totalOrders = ordersByStatus.reduce((n, s) => n + s.value, 0);
  return (
    <>
      <div className="grid metrics">
        {metrics.map((m) => (
          <div key={m.id} className="card metric">
            <div style={{ fontSize: 13, color: '#64748B' }}>{m.label}</div>
            <div className="value">{m.value}</div>
            <div className="delta">{m.delta}</div>
          </div>
        ))}
      </div>
      <div className="grid two" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Revenue over time</h3>
          <div className="bars">
            {revenueSeries.map((r) => (
              <div key={r.month} className="bar" style={{ height: `${Math.round((r.revenue / max) * 140)}px` }} title={`$${r.revenue.toLocaleString()}`}>
                <span>{r.month}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 24 }} />
        </div>
        <div className="card">
          <h3>Orders by status</h3>
          <div className="legend">
            {ordersByStatus.map((s) => (
              <div key={s.label}>
                <span className="dot" style={{ background: s.color }} />
                {s.label} — <strong>{s.value.toLocaleString()}</strong> ({Math.round((s.value / totalOrders) * 100)}%)
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid two" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Top selling products</h3>
          <table className="table">
            <thead><tr><th>Product</th><th>Sold</th><th>Revenue</th></tr></thead>
            <tbody>
              {topProducts.map((p) => (
                <tr key={p.name}><td>{p.name}</td><td>{p.sold.toLocaleString()}</td><td>{p.revenue}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3>Recent activity</h3>
          <div className="feed">
            {activityFeed.map((a) => (
              <div key={a.id}>
                <Badge value={a.tone} /> <div>{a.text}</div>
                <time>{a.time}</time>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
