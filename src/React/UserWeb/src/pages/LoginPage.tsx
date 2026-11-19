import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function LoginPage() {
  const { user, isLoading, error, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const registered = (location.state as { registered?: boolean } | null)?.registered === true;

  useEffect(() => {
    if (user) {
      navigate('/my-account', { replace: true });
    }
  }, [navigate, user]);

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-background)',
      padding: 'var(--spacing-md)',
    }}>
      <section style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'var(--color-background)',
        padding: 'var(--spacing-2xl)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <Link to="/" style={{
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--color-primary)',
            textDecoration: 'none',
          }}>
            CommerceHub
          </Link>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 600,
            marginTop: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-xs)',
          }}>
            Welcome Back
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Sign in securely with your CommerceHub account.
          </p>
        </div>

        {registered && (
          <div role="status" style={{
            backgroundColor: '#DCFCE7',
            color: '#166534',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px',
            marginBottom: 'var(--spacing-md)',
          }}>
            Your account was created. Continue to sign in.
          </div>
        )}

        {error && (
          <div role="alert" style={{
            backgroundColor: '#FEE2E2',
            color: '#DC2626',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px',
            marginBottom: 'var(--spacing-md)',
          }}>
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={login}
          disabled={isLoading}
          style={{
            width: '100%',
            backgroundColor: 'var(--color-accent-warm)',
            color: 'white',
            padding: '14px',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '16px',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? 'Checking sign-in status...' : 'Continue to sign in'}
        </button>

        <p style={{
          marginTop: 'var(--spacing-lg)',
          textAlign: 'center',
          fontSize: '14px',
          color: 'var(--color-text-secondary)',
        }}>
          New to CommerceHub?{' '}
          <Link to="/register" style={{
            color: 'var(--color-accent-cool)',
            textDecoration: 'none',
            fontWeight: 600,
          }}>
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}

export default LoginPage;
