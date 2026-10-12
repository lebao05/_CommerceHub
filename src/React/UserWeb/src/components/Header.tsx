import { Link } from 'react-router-dom';
import { ShoppingCart, Search, Heart, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e5e5',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Top utility bar */}
      <div style={{
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #e5e5e5',
      }}>
        <div style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '6px 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '20px',
          fontSize: '12px',
          color: '#111',
        }}>
          <a href="#" style={{ color: '#111', textDecoration: 'none' }}>Find a Store</a>
          <span style={{ color: '#ccc' }}>|</span>
          <a href="#" style={{ color: '#111', textDecoration: 'none' }}>Help</a>
          <span style={{ color: '#ccc' }}>|</span>
          <a href="#" style={{ color: '#111', textDecoration: 'none' }}>Join Us</a>
          <span style={{ color: '#ccc' }}>|</span>
          <Link to="/login" style={{ color: '#111', textDecoration: 'none' }}>Sign In</Link>
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
              <path d="M9.6 4.5c-3.6 0-7 2.1-8.5 5.2C.4 11 0 12.4 0 14c0 1.5.4 2.9 1.1 4.2C2.6 21.3 6 23.4 9.6 23.4c3.6 0 7-2.1 8.5-5.2.7-1.3 1.1-2.7 1.1-4.2 0-1.6-.4-3-1.1-4.3-1.5-3.1-4.9-5.2-8.5-5.2zm-.4 14.7c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" fill="#111"/>
              <text x="22" y="19" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="700" fill="#111">CommerceHub</text>
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
            <a href="#" style={{ color: '#111', textDecoration: 'none', fontSize: '16px', fontWeight: 500 }}>New &amp; Featured</a>
            <Link to="/products" style={{ color: '#111', textDecoration: 'none', fontSize: '16px', fontWeight: 500 }}>Men</Link>
            <a href="#" style={{ color: '#111', textDecoration: 'none', fontSize: '16px', fontWeight: 500 }}>Women</a>
            <a href="#" style={{ color: '#111', textDecoration: 'none', fontSize: '16px', fontWeight: 500 }}>Kids</a>
            <a href="#" style={{ color: '#111', textDecoration: 'none', fontSize: '16px', fontWeight: 500 }}>Sale</a>
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
              backgroundColor: '#f5f5f5',
              borderRadius: '9999px',
              padding: '8px 16px',
              width: '180px',
            }}>
              <Search size={18} style={{ color: '#111', marginRight: '8px' }} />
              <input
                type="text"
                placeholder="Search"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  width: '100%',
                  color: '#111',
                }}
              />
            </div>

            {/* Wishlist */}
            <a href="#" style={{ color: '#111', display: 'flex', alignItems: 'center' }} aria-label="Wishlist">
              <Heart size={22} />
            </a>

            {/* Cart */}
            <Link to="/cart" style={{
              color: '#111',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
            }} aria-label="Cart">
              <ShoppingCart size={22} />
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-10px',
                backgroundColor: '#111',
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

            {/* Account */}
            <Link to="/my-account" style={{ color: '#111', display: 'flex', alignItems: 'center' }} aria-label="Account">
              <User size={22} />
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                color: '#111',
                background: 'none',
                border: 'none',
                padding: 0,
                display: 'none',
              }}
              className="mobile-menu-btn"
              aria-label="Menu"
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
            borderTop: '1px solid #e5e5e5',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <Link to="/products" style={{ color: '#111', textDecoration: 'none', fontSize: '18px', fontWeight: 500 }}>Men</Link>
            <a href="#" style={{ color: '#111', textDecoration: 'none', fontSize: '18px', fontWeight: 500 }}>Women</a>
            <a href="#" style={{ color: '#111', textDecoration: 'none', fontSize: '18px', fontWeight: 500 }}>Kids</a>
            <a href="#" style={{ color: '#111', textDecoration: 'none', fontSize: '18px', fontWeight: 500 }}>Sale</a>
            <Link to="/login" style={{ color: '#111', textDecoration: 'none', fontSize: '18px', fontWeight: 500 }}>Sign In</Link>
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
