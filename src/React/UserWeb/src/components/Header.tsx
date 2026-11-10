import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Search, Heart, User, Menu, X, Globe, Sun, Moon, Package, LogOut } from 'lucide-react';
import { useTranslation } from '../i18n/context';
import { useTheme } from '../hooks/useTheme';
import type { Locale } from '../i18n/context';

function Header() {
  const { locale, setLocale, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const localeRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Close locale dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (localeRef.current && !localeRef.current.contains(e.target as Node)) {
        setLocaleOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchLocale = (next: Locale) => {
    setLocale(next);
    setLocaleOpen(false);
  };

  return (
    <header style={{
      backgroundColor: 'var(--color-background)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      color: 'var(--color-text-primary)',
      transition: 'background-color 0.2s, border-color 0.2s',
    }}>
      {/* Top utility bar */}
      <div style={{
        backgroundColor: 'var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '6px 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '16px',
          fontSize: '12px',
          color: 'var(--color-text-secondary)',
        }}>
          {/* Language dropdown */}
          <div ref={localeRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setLocaleOpen(o => !o)}
              aria-haspopup="listbox"
              aria-expanded={localeOpen}
              aria-label={t('language')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                fontSize: '12px',
                padding: '2px 0',
                fontFamily: 'inherit',
              }}
            >
              <Globe size={13} />
              {locale === 'en' ? 'EN' : 'VI'}
              <span style={{
                display: 'inline-block',
                width: 0,
                height: 0,
                borderLeft: '3px solid transparent',
                borderRight: '3px solid transparent',
                borderTop: '4px solid currentColor',
                marginLeft: '2px',
                opacity: 0.6,
              }} />
            </button>

            {localeOpen && (
              <div
                role="listbox"
                aria-label={t('language')}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 6px)',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  minWidth: '130px',
                  overflow: 'hidden',
                  zIndex: 100,
                }}
              >
                {(['en', 'vi'] as Locale[]).map(l => (
                  <button
                    key={l}
                    role="option"
                    aria-selected={l === locale}
                    onClick={() => switchLocale(l)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '9px 14px',
                      background: l === locale ? 'var(--color-border)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: 'var(--color-text-primary)',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => { if (l !== locale) e.currentTarget.style.backgroundColor = 'var(--color-border)'; }}
                    onMouseLeave={e => { if (l !== locale) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <span style={{ fontWeight: l === locale ? 700 : 400 }}>
                      {l === 'en' ? '🇺🇸  English' : '🇻🇳  Tiếng Việt'}
                    </span>
                    {l === locale && (
                      <span style={{ marginLeft: 'auto', color: 'var(--color-accent-cool)' }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span style={{ color: 'var(--color-border)' }}>|</span>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={`${theme === 'light' ? t('darkMode') : t('lightMode')} (${t('theme')})`}
            title={`${t('theme')}: ${theme === 'light' ? t('darkMode') : t('lightMode')}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              padding: '2px 0',
            }}
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            <span style={{ marginLeft: '4px', fontSize: '12px' }}>
              {theme === 'light' ? t('darkMode') : t('lightMode')}
            </span>
          </button>

          <span style={{ color: 'var(--color-border)' }}>|</span>

          <a href="#" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>{t('findAStore')}</a>
          <span style={{ color: 'var(--color-border)' }}>|</span>
          <a href="#" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>{t('help')}</a>
          <span style={{ color: 'var(--color-border)' }}>|</span>
          <a href="#" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>{t('joinUs')}</a>
          <span style={{ color: 'var(--color-border)' }}>|</span>
          <Link to="/login" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>{t('signIn')}</Link>
        </div>
      </div>

      {/* Main navigation */}
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0 24px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '60px',
        }}>
          {/* Logo */}
          <Link to="/" style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
          }}>
            <svg width="70" height="28" viewBox="0 0 70 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="CommerceHub">
              <path d="M9.6 4.5c-3.6 0-7 2.1-8.5 5.2C.4 11 0 12.4 0 14c0 1.5.4 2.9 1.1 4.2C2.6 21.3 6 23.4 9.6 23.4c3.6 0 7-2.1 8.5-5.2.7-1.3 1.1-2.7 1.1-4.2 0-1.6-.4-3-1.1-4.3-1.5-3.1-4.9-5.2-8.5-5.2zm-.4 14.7c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" fill="var(--color-text-primary)"/>
              <text x="22" y="19" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="700" fill="var(--color-text-primary)">CommerceHub</text>
            </svg>
          </Link>

          {/* Center Nav - Desktop */}
          <nav
            className="desktop-nav"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
            }}
          >
            <a href="#" style={{ color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: '16px', fontWeight: 500 }}>{t('newFeatured')}</a>
            <Link to="/products" style={{ color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: '16px', fontWeight: 500 }}>{t('men')}</Link>
            <a href="#" style={{ color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: '16px', fontWeight: 500 }}>{t('women')}</a>
            <a href="#" style={{ color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: '16px', fontWeight: 500 }}>{t('kids')}</a>
            <a href="#" style={{ color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: '16px', fontWeight: 500 }}>{t('sale')}</a>
          </nav>

          {/* Right cluster: search + icons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            {/* Search bar */}
            <div className="desktop-search" style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--color-border)',
              borderRadius: '9999px',
              padding: '8px 16px',
              width: '180px',
            }}>
              <Search size={18} style={{ color: 'var(--color-text-secondary)', marginRight: '8px' }} />
              <input
                type="text"
                placeholder={t('search')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  width: '100%',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>

            {/* Wishlist */}
            <a href="#" style={{ color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center' }} aria-label={t('wishlist')}>
              <Heart size={22} />
            </a>

            {/* Cart */}
            <Link to="/cart" style={{
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
            }} aria-label={t('cart')}>
              <ShoppingCart size={22} />
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-10px',
                backgroundColor: 'var(--color-accent-warm)',
                color: '#fff',
                borderRadius: '9999px',
                minWidth: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 600,
                padding: '0 4px',
              }}>
                0
              </span>
            </Link>

            {/* Account dropdown (hover/click) */}
            <div
              ref={accountRef}
              style={{ position: 'relative' }}
              onMouseEnter={() => setAccountOpen(true)}
              onMouseLeave={() => setAccountOpen(false)}
            >
              <button
                onClick={() => setAccountOpen(o => !o)}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                aria-label={t('account')}
                style={{
                  color: 'var(--color-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                <User size={22} />
              </button>

              {accountOpen && (
                <div
                  role="menu"
                  aria-label={t('myAccount')}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 10px)',
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    minWidth: '200px',
                    overflow: 'hidden',
                    zIndex: 100,
                  }}
                >
                  <Link
                    to="/my-account"
                    role="menuitem"
                    onClick={() => setAccountOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      color: 'var(--color-text-primary)',
                      textDecoration: 'none',
                      fontSize: '14px',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-border)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <User size={16} />
                    {t('myAccount')}
                  </Link>
                  <Link
                    to="/my-orders"
                    role="menuitem"
                    onClick={() => setAccountOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      color: 'var(--color-text-primary)',
                      textDecoration: 'none',
                      fontSize: '14px',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-border)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <Package size={16} />
                    {t('myPurchase')}
                  </Link>
                  <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '4px 0' }} />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountOpen(false);
                      // TODO: clear auth state / redirect to /login
                      window.location.href = '/login';
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '10px 14px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-error)',
                      fontSize: '14px',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-border)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <LogOut size={16} />
                    {t('logout')}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                color: 'var(--color-text-primary)',
                background: 'none',
                border: 'none',
                padding: 0,
                display: 'none',
              }}
              className="mobile-menu-btn"
              aria-label={t('menu')}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="mobile-menu" style={{
            display: 'none',
            padding: '12px 0 20px',
            borderTop: '1px solid var(--color-border)',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <Link to="/products" style={{ color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: '18px', fontWeight: 500 }}>{t('men')}</Link>
            <a href="#" style={{ color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: '18px', fontWeight: 500 }}>{t('women')}</a>
            <a href="#" style={{ color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: '18px', fontWeight: 500 }}>{t('kids')}</a>
            <a href="#" style={{ color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: '18px', fontWeight: 500 }}>{t('sale')}</a>
            <Link to="/login" style={{ color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: '18px', fontWeight: 500 }}>{t('signIn')}</Link>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .desktop-nav { gap: 16px !important; }
          .desktop-nav a { font-size: 14px !important; }
          .desktop-search { display: none !important; }
        }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .mobile-menu { display: flex !important; }
        }
      `}</style>
    </header>
  );
}

export default Header;
