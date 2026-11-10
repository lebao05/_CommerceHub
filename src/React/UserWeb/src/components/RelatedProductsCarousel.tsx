import { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ListProduct } from '../data/productList';
import { formatVND } from '../utils/helpers';
import { useTranslation } from '../i18n/context';

interface RelatedProductsCarouselProps {
  products: ListProduct[];
  /** Section heading text */
  heading?: string;
}

export default function RelatedProductsCarousel({
  products,
  heading,
}: RelatedProductsCarouselProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBy = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector('[data-card]')?.getBoundingClientRect().width ?? 280;
    el.scrollBy({ left: direction === 'right' ? cardWidth + 16 : -(cardWidth + 16), behavior: 'smooth' });
  }, []);

  if (products.length === 0) return null;

  return (
    <section aria-label={t('relatedProducts')}>
      {/* Section heading + arrow controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <h2 style={{
          fontSize: '22px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: 0,
        }}>
          {heading ?? t('relatedProducts')}
        </h2>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => scrollBy('left')}
            aria-label="Scroll left"
            style={carouselArrowStyle}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => scrollBy('right')}
            aria-label="Scroll right"
            style={carouselArrowStyle}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={scrollRef}
        data-carousel="related"
        style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '12px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--color-border) transparent',
        }}
        className="related-carousel"
      >
        {products.map(product => (
          <Link
            key={product.id}
            to={`/products/${product.slug}`}
            data-card
            style={{
              flex: '0 0 auto',
              width: '240px',
              textDecoration: 'none',
              scrollSnapAlign: 'start',
            }}
          >
            {/* Image */}
            <div
              style={{
                width: '240px',
                height: '240px',
                backgroundColor: '#f5f5f5',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                marginBottom: '12px',
                transition: 'transform 200ms',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.03)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
              }}
            >
              <img
                src={product.image}
                alt={product.name}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>

            {/* Info */}
            <div style={{ padding: '0 4px' }}>
              <p style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                margin: '0 0 4px',
                lineHeight: 1.3,
              }}>
                {product.name}
              </p>
              <p style={{
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
                margin: '0 0 6px',
              }}>
                {product.category}
              </p>
              <p style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                margin: 0,
              }}>
                {formatVND(product.price)}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        .related-carousel::-webkit-scrollbar {
          height: 4px;
        }
        .related-carousel::-webkit-scrollbar-track {
          background: transparent;
        }
        .related-carousel::-webkit-scrollbar-thumb {
          background: var(--color-border);
          border-radius: 4px;
        }
      `}</style>
    </section>
  );
}

const carouselArrowStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-background)',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 150ms',
};
