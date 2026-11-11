import { services } from '../data/mock.js';
import Badge from '../components/Badge.jsx';

export default function Health() {
  return (
    <div className="card" style={{ padding: 0, overflow: 'auto' }}>
      <table className="table">
        <thead><tr><th>Service</th><th>Port</th><th>Status</th><th>Latency</th><th>Error rate</th></tr></thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.name}>
              <td><strong>{s.name}</strong></td>
              <td>{s.port}</td>
              <td><Badge value={s.status} /></td>
              <td>{s.latency}</td>
              <td>{s.errors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
