import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail } from 'lucide-react';
import { useTranslation } from '../i18n/context';

function Footer() {
  const { t } = useTranslation();

  return (
    <footer style={{
      backgroundColor: 'var(--color-primary)',
      color: 'var(--color-background)',
      padding: 'var(--spacing-3xl) 0 var(--spacing-lg)',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 var(--spacing-md)',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--spacing-xl)',
          marginBottom: 'var(--spacing-2xl)',
        }}>
          {/* Company Info */}
          <div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: 'var(--spacing-md)',
            }}>
              CommerceHub
            </h3>
            <p style={{
              color: 'rgba(248, 250, 252, 0.8)',
              fontSize: '14px',
              lineHeight: 1.6,
            }}>
              Your trusted e-commerce platform for quality products at competitive prices.
            </p>
            <div style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              marginTop: 'var(--spacing-md)',
            }}>
              <a href="#" aria-label="Facebook" style={{
                color: 'var(--color-background)',
                opacity: 0.8,
              }}>
                <Facebook size={20} />
              </a>
              <a href="#" aria-label="Twitter / X" style={{
                color: 'var(--color-background)',
                opacity: 0.8,
              }}>
                <Twitter size={20} />
              </a>
              <a href="#" aria-label="Instagram" style={{
                color: 'var(--color-background)',
                opacity: 0.8,
              }}>
                <Instagram size={20} />
              </a>
              <a href="#" aria-label={t('footerContact')} style={{
                color: 'var(--color-background)',
                opacity: 0.8,
              }}>
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: 'var(--spacing-md)',
            }}>
              {t('products')}
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}>
              <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                <Link to="/products" style={{
                  color: 'rgba(248, 250, 252, 0.8)',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}>
                  {t('viewAll')}
                </Link>
              </li>
              <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                <Link to="/my-orders" style={{
                  color: 'rgba(248, 250, 252, 0.8)',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}>
                  {t('orderHistory')}
                </Link>
              </li>
              <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                <Link to="/my-account" style={{
                  color: 'rgba(248, 250, 252, 0.8)',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}>
                  {t('myAccount')}
                </Link>
              </li>
              <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                <Link to="/cart" style={{
                  color: 'rgba(248, 250, 252, 0.8)',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}>
                  {t('yourCart')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: 'var(--spacing-md)',
            }}>
              {t('help')}
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}>
              <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                <a href="#" style={{
                  color: 'rgba(248, 250, 252, 0.8)',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}>
                  {t('footerContact')}
                </a>
              </li>
              <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                <a href="#" style={{
                  color: 'rgba(248, 250, 252, 0.8)',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}>
                  {t('footerFAQ')}
                </a>
              </li>
              <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                <a href="#" style={{
                  color: 'rgba(248, 250, 252, 0.8)',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}>
                  {t('footerShipping')}
                </a>
              </li>
              <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                <a href="#" style={{
                  color: 'rgba(248, 250, 252, 0.8)',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}>
                  {t('footerReturns')}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: 'var(--spacing-md)',
            }}>
              Legal
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}>
              <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                <a href="#" style={{
                  color: 'rgba(248, 250, 252, 0.8)',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}>
                  {t('footerPrivacy')}
                </a>
              </li>
              <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                <a href="#" style={{
                  color: 'rgba(248, 250, 252, 0.8)',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}>
                  {t('footerTerms')}
                </a>
              </li>
              <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                <a href="#" style={{
                  color: 'rgba(248, 250, 252, 0.8)',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}>
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(248, 250, 252, 0.1)',
          paddingTop: 'var(--spacing-lg)',
          textAlign: 'center',
        }}>
          <p style={{
            color: 'rgba(248, 250, 252, 0.6)',
            fontSize: '14px',
            margin: 0,
          }}>
            © {new Date().getFullYear()} CommerceHub. {t('footerRights')}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
