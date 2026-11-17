import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { FEATURED_BRANDS, type Brand } from '../data/brands';
import { useTranslation } from '../i18n/context';

function BrandCard({ brand }: { brand: Brand }) {
  const { t } = useTranslation();

  return (
    <Link
      to={`/products?brand=${brand.slug}`}
      aria-label={`${brand.name} — ${brand.productCount} products`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-md)',
        padding: 'var(--spacing-md)',
        backgroundColor: 'var(--color-background)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        e.currentTarget.style.borderColor = brand.color;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--color-border)';
      }}
    >
      <span
        aria-hidden="true"
        style={{
          flexShrink: 0,
          width: '52px',
          height: '52px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: brand.color,
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '17px',
          fontWeight: 800,
          letterSpacing: '0.02em',
        }}
      >
        {brand.monogram}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {brand.name}
        </span>
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {t('productsCount').replace('{count}', String(brand.productCount))}
        </span>
      </span>
    </Link>
  );
}

function BrandShowcase() {
  const { t } = useTranslation();

  return (
    <section
      style={{
        padding: 'var(--spacing-3xl) var(--spacing-md)',
        backgroundColor: 'var(--color-background)',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-xl)',
            gap: 'var(--spacing-md)',
          }}
        >
          <h2 style={{ fontSize: '32px', fontWeight: 600, margin: 0 }}>
            {t('shopByBrand')}
          </h2>
          <Link
            to="/products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-accent-cool)',
              textDecoration: 'none',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {t('viewAllBrands')}
            <ArrowRight size={18} />
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 'var(--spacing-md)',
          }}
        >
          {FEATURED_BRANDS.map(brand => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default BrandShowcase;
