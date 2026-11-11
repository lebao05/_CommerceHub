import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="card" style={{ textAlign: 'center', padding: 48 }}>
      <h2 style={{ margin: 0 }}>404 — Page not found</h2>
      <p style={{ color: '#64748B' }}>That admin screen does not exist in this mockup.</p>
      <Link to="/"><button className="btn primary">Back to Dashboard</button></Link>
    </div>
  );
}
