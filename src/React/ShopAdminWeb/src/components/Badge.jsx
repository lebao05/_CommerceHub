export function badgeTone(status) {
  const s = String(status).toLowerCase();
  if (['active', 'delivered', 'healthy', 'approved', 'success'].includes(s)) return 'success';
  if (['pending', 'processing', 'degraded', 'draft'].includes(s)) return 'warning';
  if (['cancelled', 'inactive', 'suspended', 'rejected', 'denied', 'down', 'failed'].includes(s)) return 'danger';
  if (['shipped', 'info'].includes(s)) return 'info';
  return 'neutral';
}

export default function Badge({ value }) {
  return <span className={`badge ${badgeTone(value)}`}>{value}</span>;
}
