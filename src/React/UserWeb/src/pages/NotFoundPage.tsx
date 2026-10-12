import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-background)',
      padding: 'var(--spacing-md)',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '600px',
      }}>
        <h1 style={{
          fontSize: '120px',
          fontWeight: 700,
          color: 'var(--color-primary)',
          margin: 0,
          lineHeight: 1,
        }}>
          404
        </h1>
        <h2 style={{
          fontSize: '32px',
          fontWeight: 600,
          marginTop: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-md)',
          color: 'var(--color-text-primary)',
        }}>
          Page Not Found
        </h2>
        <p style={{
          fontSize: '18px',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--spacing-xl)',
          lineHeight: 1.6,
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" style={{
          display: 'inline-block',
          backgroundColor: 'var(--color-accent-warm)',
          color: 'white',
          padding: '14px 32px',
          borderRadius: 'var(--radius-md)',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '16px',
        }}>
          Go Home
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
