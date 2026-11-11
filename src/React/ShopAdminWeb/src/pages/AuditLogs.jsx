import { auditLogs } from '../data/mock.js';
import Badge from '../components/Badge.jsx';

export default function AuditLogs() {
  return (
    <div className="card" style={{ padding: 0, overflow: 'auto' }}>
      <table className="table">
        <thead><tr><th>Actor</th><th>Action</th><th>Target</th><th>At</th><th>Result</th></tr></thead>
        <tbody>
          {auditLogs.map((a) => (
            <tr key={a.id}>
              <td>{a.actor}</td>
              <td><code className="mono">{a.action}</code></td>
              <td>{a.target}</td>
              <td>{a.at}</td>
              <td><Badge value={a.result} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
