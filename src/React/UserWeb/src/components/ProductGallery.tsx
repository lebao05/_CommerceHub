import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import type { ProductImage } from '../data/productDetail';

interface ProductGalleryProps {
  images: ProductImage[];
  /** Alt text for the main image (typically the product name) */
  alt: string;
}

function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Reset to first image whenever the image set changes
  useEffect(() => {
    setActiveIndex(0);
  }, [images]);

  // Preload all images so navigating the strip feels instant
  useEffect(() => {
    images.forEach(img => {
      const preload = new Image();
      preload.src = img.url;
    });
  }, [images]);

  // Keyboard navigation when the gallery is focused
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  };

  const prev = () =>
    setActiveIndex(i => (i - 1 + images.length) % images.length);
  const next = () =>
    setActiveIndex(i => (i + 1) % images.length);

  if (images.length === 0) return null;

  const active = images[activeIndex];

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKey}
      role="region"
      aria-label="Product image gallery"
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: '12px',
        alignItems: 'start',
        outline: 'none',
      }}
    >
      {/* Vertical thumbnail strip */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: '560px',
          overflowY: 'auto',
          paddingRight: '2px',
        }}
        className="product-thumbs"
      >
        {images.map((img, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={img.id}
              onClick={() => setActiveIndex(idx)}
              aria-label={`View image ${idx + 1}${img.caption ? `: ${img.caption}` : ''}`}
              aria-current={isActive ? 'true' : undefined}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: 'var(--radius-md)',
                border: isActive
                  ? '2px solid var(--color-text-primary)'
                  : '1px solid var(--color-border)',
                padding: '0',
                background: '#f5f5f5',
                cursor: 'pointer',
                overflow: 'hidden',
                flexShrink: 0,
                transition: 'border-color 150ms, transform 150ms',
                outline: isActive ? '1px solid var(--color-text-primary)' : 'none',
                outlineOffset: '1px',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.borderColor = 'var(--color-text-secondary)';
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
            >
              <img
                src={img.thumb}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Main image */}
      <div
        style={{
          position: 'relative',
          backgroundColor: '#f5f5f5',
          borderRadius: 'var(--radius-md)',
          aspectRatio: '1 / 1',
          overflow: 'hidden',
        }}
      >
        <img
          src={active.url}
          alt={alt}
          key={active.id}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            animation: 'gallery-fade-in 300ms ease-out',
          }}
        />

        {/* Expand / zoom icon (top-right) */}
        <button
          aria-label="Zoom in"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-primary)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        >
          <Expand size={16} />
        </button>

        {/* Prev / Next arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              style={navButtonStyle('left')}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              style={navButtonStyle('right')}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Caption (bottom-left) + image counter (bottom-right) */}
        {active.caption && (
          <span
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {active.caption}
          </span>
        )}

        {images.length > 1 && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {activeIndex + 1} / {images.length}
          </span>
        )}
      </div>

      {/* Inline keyframe for the fade-in transition on main image swap */}
      <style>{`
        @keyframes gallery-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .product-thumbs::-webkit-scrollbar { width: 4px; }
        .product-thumbs::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 4px; }
        @media (max-width: 768px) {
          .product-thumbs {
            max-height: none !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            flex-direction: row !important;
          }
        }
      `}</style>
    </div>
  );
}

const NAV_BUTTON_BASE: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255,255,255,0.95)',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--color-text-primary)',
  boxShadow: 'var(--shadow-md)',
  transition: 'background-color 150ms',
};

function navButtonStyle(side: 'left' | 'right'): React.CSSProperties {
  return side === 'left' ? { ...NAV_BUTTON_BASE, left: '12px' } : { ...NAV_BUTTON_BASE, right: '12px' };
}

export default ProductGallery;
