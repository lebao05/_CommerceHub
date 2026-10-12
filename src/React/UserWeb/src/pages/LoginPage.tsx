import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // TODO: Implement actual login logic
      console.log('Login:', { email, password });
      navigate('/');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

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
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'white',
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
          <h2 style={{
            fontSize: '24px',
            fontWeight: 600,
            marginTop: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-xs)',
          }}>
            Welcome Back
          </h2>
          <p style={{
            color: 'var(--color-text-secondary)',
            fontSize: '14px',
          }}>
            Sign in to your account to continue
          </p>
        </div>

        {error && (
          <div style={{
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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: 'var(--spacing-xs)',
              color: 'var(--color-text-primary)',
            }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={20} style={{
                position: 'absolute',
                left: 'var(--spacing-md)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-secondary)',
              }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: 'var(--spacing-xs)',
              color: 'var(--color-text-primary)',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={20} style={{
                position: 'absolute',
                left: 'var(--spacing-md)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-secondary)',
              }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-lg)',
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)',
              fontSize: '14px',
              cursor: 'pointer',
            }}>
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <a href="#" style={{
              fontSize: '14px',
              color: 'var(--color-accent-cool)',
              textDecoration: 'none',
            }}>
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
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
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: 'var(--spacing-lg)',
          textAlign: 'center',
          fontSize: '14px',
        }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>
            Don't have an account?{' '}
          </span>
          <Link to="/register" style={{
            color: 'var(--color-accent-cool)',
            textDecoration: 'none',
            fontWeight: 600,
          }}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
