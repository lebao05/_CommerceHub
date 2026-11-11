import { NavLink, useLocation } from 'react-router-dom';

const links = [
  { section: 'Overview' },
  { to: '/', label: 'Dashboard' },
  { section: 'Catalog' },
  { to: '/products', label: 'Products' },
  { to: '/categories', label: 'Categories' },
  { section: 'Sales' },
  { to: '/orders', label: 'Orders' },
  { to: '/promotions', label: 'Promotions' },
  { to: '/banners', label: 'Banners' },
  { section: 'People' },
  { to: '/users', label: 'Users' },
  { section: 'System' },
  { to: '/settings', label: 'Settings' },
  { to: '/audit-logs', label: 'Audit Logs' },
  { to: '/health', label: 'Health Monitor' },
];

const titles = {
  '/': 'Admin Dashboard',
  '/products': 'All Products',
  '/products/new': 'Create Product',
  '/categories': 'Category Management',
  '/orders': 'Orders Management',
  '/users': 'Users Management',
  '/promotions': 'Promotions Management',
  '/banners': 'Banners Management',
  '/settings': 'System Settings',
  '/audit-logs': 'Audit Logs',
  '/health': 'Health Monitor',
};

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const title = titles[pathname]
    ?? (pathname.startsWith('/products/') ? 'Product Details'
      : pathname.startsWith('/users/') ? 'User Details' : 'ShopAdmin');
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <h1>ShopAdmin</h1>
          <p>CommerceHub Admin · Mockup</p>
        </div>
        <nav className="nav">
          {links.map((l, i) =>
            l.section ? (
              <div key={i} className="nav-section">{l.section}</div>
            ) : (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                {l.label}
              </NavLink>
            )
          )}
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <h2>{title}</h2>
          <div className="user">ops@commercehub.com · Admin</div>
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
