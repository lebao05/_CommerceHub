import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Star,
  ChevronDown,
  ChevronRight,
  Heart,
  Share2,
  Truck,
  RotateCcw,
  ShieldCheck,
  Package,
  Zap,
  Award,
  Camera,
  Store,
  Minus,
  Plus,
  Check,
  ShoppingBag,
  Ruler,
  Info,
  Leaf,
  Clock,
  Tag,
  CreditCard,
  MessageSquare,
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import RelatedProductsCarousel from '../components/RelatedProductsCarousel';
import { SAMPLE_PRODUCT, RELATED_PRODUCTS } from '../data/productDetail';
import { formatVND } from '../utils/helpers';
import { useTranslation } from '../i18n/context';

/* ============================================================
   TYPES
   ============================================================ */

type DetailTab = 'description' | 'reviews' | 'sizing';

interface AccordionProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}

/* ============================================================
   BADGE COMPONENT
   ============================================================ */

function Badge({ children, color = '#10B981' }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: color,
        color: '#fff',
        fontSize: '11px',
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: '999px',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  );
}

/* ============================================================
   ACCORDION
   ============================================================ */

function Accordion({ label, icon, children, defaultOpen = false, badge }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid var(--color-border)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <span style={{ color: 'var(--color-text-secondary)', display: 'flex' }}>{icon}</span>
        {label}
        {badge && (
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-accent-warm)', fontWeight: 700 }}>
            {badge}
          </span>
        )}
        <ChevronDown
          size={16}
          style={{
            marginLeft: 'auto',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms',
          }}
        />
      </button>
      {open && (
        <div style={{ paddingBottom: '16px', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   RATING BAR
   ============================================================ */

function RatingBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round((value / 5) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
      <span style={{ width: '55px', color: 'var(--color-text-secondary)' }}>{label}</span>
      <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: 'var(--color-text-primary)',
            borderRadius: '3px',
            transition: 'width 600ms ease',
          }}
        />
      </div>
      <span style={{ width: '28px', textAlign: 'right', fontWeight: 600 }}>{value.toFixed(1)}</span>
    </div>
  );
}

/* ============================================================
   STAR RATING DISPLAY
   ============================================================ */

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: '2px', color: '#F59E0B' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} fill={i <= Math.round(rating) ? 'currentColor' : 'none'} stroke="currentColor" />
      ))}
    </div>
  );
}

/* ============================================================
   REVIEW CARD
   ============================================================ */

function ReviewCard({ author, rating, date, title, body, images = [] }: {
  author: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  images?: string[];
}) {
  const { t } = useTranslation();
  return (
    <div style={{ padding: '20px 0', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent-cool))',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '14px',
            flexShrink: 0,
          }}
        >
          {author.charAt(0)}
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 2px', color: 'var(--color-text-primary)' }}>{author}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <StarRating rating={rating} size={12} />
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '11px',
            color: 'var(--color-success)',
            backgroundColor: '#D1FAE5',
            padding: '2px 8px',
            borderRadius: '999px',
            fontWeight: 600,
          }}
        >
          {t('productVerified')} ✓
        </span>
      </div>
      <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)', margin: '0 0 6px' }}>{title}</p>
      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>{body}</p>
      {images.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Review photo ${i + 1}`}
              style={{ width: '72px', height: '72px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   PRODUCT GALLERY
   ============================================================ */

function ProductGallery({ images, alt }: { images: { url: string; thumb: string; caption?: string }[]; alt: string }) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => { setActiveIndex(0); }, [images]);

  if (!images.length) return null;

  const active = images[activeIndex];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px', alignItems: 'start' }}>
        {/* Thumbnail strip */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '600px', overflowY: 'auto', paddingRight: '2px' }} className="gallery-thumbs">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              aria-label={`View image ${idx + 1}`}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: 'var(--radius-md)',
                border: activeIndex === idx ? '2px solid var(--color-text-primary)' : '1px solid var(--color-border)',
                padding: 0,
                background: '#f5f5f5',
                cursor: 'pointer',
                overflow: 'hidden',
                flexShrink: 0,
                outline: activeIndex === idx ? '1px solid var(--color-text-primary)' : 'none',
                outlineOffset: '1px',
                transition: 'border-color 150ms',
              }}
            >
              <img src={img.thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </button>
          ))}
        </div>

        {/* Main image */}
        <div
          style={{
            position: 'relative',
            backgroundColor: '#f5f5f5',
            borderRadius: 'var(--radius-lg)',
            aspectRatio: '1 / 1',
            overflow: 'hidden',
            cursor: 'zoom-in',
          }}
          onClick={() => setLightboxOpen(true)}
        >
          <img
            key={activeIndex}
            src={active.url}
            alt={alt}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', animation: 'gallery-fade 250ms ease-out' }}
          />

          {/* Badges */}
          <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Badge color="#10B981">
              <Leaf size={10} /> {t('productHighlyRated')}
            </Badge>
          </div>

          {/* Counter */}
          {images.length > 1 && (
            <span style={{ position: 'absolute', bottom: '16px', right: '16px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px' }}>
              {activeIndex + 1} / {images.length}
            </span>
          )}
        </div>
      </div>

      {/* Action strip */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
        <button style={ghostBtnStyle}>
          <Heart size={15} /> {t('wishlist')}
        </button>
        <button style={ghostBtnStyle}>
          <Share2 size={15} /> {t('productShare')}
        </button>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.92)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
          <img
            src={active.url}
            alt={alt}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
          />
          {images.length > 1 && (
            <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px' }}>
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setActiveIndex(i); }}
                  style={{
                    width: '8px', height: '8px', borderRadius: '50%', border: 'none',
                    background: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer', padding: 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes gallery-fade { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .gallery-thumbs::-webkit-scrollbar { width: 4px; }
        .gallery-thumbs::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 4px; }
        @media (max-width: 768px) {
          .gallery-thumbs { flex-direction: row !important; max-height: none !important; overflow-x: auto !important; overflow-y: hidden !important; }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   SIZE GUIDE MODAL
   ============================================================ */

function SizeGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9998,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-background)', borderRadius: 'var(--radius-lg)',
          maxWidth: '540px', width: '100%', maxHeight: '80vh', overflowY: 'auto',
          padding: '28px', boxShadow: 'var(--shadow-xl)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Size Guide</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>✕</button>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          Measure your foot length (in cm) and compare with the table below for the best fit.
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-border)' }}>
              {['Size', 'US', 'UK', 'EU', 'Foot Length (cm)'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['UK 6', '7', '6', '40', '25.0'],
              ['UK 7', '8', '7', '41', '26.0'],
              ['UK 8', '9', '8', '42', '27.0'],
              ['UK 9', '10', '9', '43', '28.0'],
              ['UK 10', '11', '10', '44', '29.0'],
              ['UK 11', '12', '11', '45', '30.0'],
            ].map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: '10px 12px', fontWeight: j === 0 ? 600 : 400 }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '12px' }}>
          * All sizes are approximate. For the most accurate fit, measure your foot at the end of the day.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   PRODUCT INFO SECTION
   ============================================================ */

function ProductInfoSection({ product, selectedColourId, onColourChange }: {
  product: typeof SAMPLE_PRODUCT;
  selectedColourId: string;
  onColourChange: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [favourited, setFavourited] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const selectedColour = product.colours.find(c => c.id === selectedColourId) ?? product.colours[0];
  const discount = product.oldPrice != null ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;

  const handleAddToCart = () => {
    if (!selectedSize) return;
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Brand + badge row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '13px', fontWeight: 700, color: 'var(--color-text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {product.brand}
          </span>
          <Badge color="#0EA5E9"><Zap size={10} /> {t('productSustainableChoice')}</Badge>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
            <StarRating rating={product.rating} size={13} />
            <span style={{ fontWeight: 700 }}>{product.rating.toFixed(1)}</span>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            ({product.reviewCount.toLocaleString()} {t('reviews')})
          </span>
        </div>
      </div>

      {/* Product name */}
      <h1 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 4px', lineHeight: 1.1 }}>
        {product.name}
      </h1>

      {/* SKU + category */}
      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 14px' }}>
        {product.category} · {t('productSku')}: {product.sku}
      </p>

      {/* Price block */}
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap',
        padding: '16px', backgroundColor: '#F0FDF4', borderRadius: 'var(--radius-md)',
        border: '1px solid #BBF7D0', marginBottom: '16px',
      }}>
        <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-success)' }}>
          {formatVND(product.price)}
        </span>
        {product.oldPrice && (
          <>
            <span style={{ fontSize: '16px', color: 'var(--color-text-secondary)', textDecoration: 'line-through' }}>
              {formatVND(product.oldPrice)}
            </span>
            <Badge color="var(--color-error)">-{discount}%</Badge>
          </>
        )}
        <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 600, marginLeft: 'auto' }}>
          ✓ Free shipping
        </span>
      </div>

      {/* Promotions strip */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px', padding: '12px 14px', backgroundColor: '#FFF7ED', borderRadius: 'var(--radius-md)', border: '1px solid #FED7AA' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-accent-warm)', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Tag size={12} /> Promotions
        </p>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Check size={11} color="#10B981" /> 25% off when you buy 2 or more items from this shop
        </p>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Check size={11} color="#10B981" /> Free delivery on orders over ₫2,500,000
        </p>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Check size={11} color="#10B981" /> Bundle deal: Buy 3 get 10% off + free shipping
        </p>
      </div>

      {/* Colour selector */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
            {t('productColour')}
          </p>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{selectedColour.name}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {product.colours.map(c => (
            <button
              key={c.id}
              onClick={() => onColourChange(c.id)}
              aria-pressed={c.id === selectedColourId}
              aria-label={`Colour: ${c.name}`}
              title={c.name}
              style={{
                width: '44px', height: '44px', borderRadius: '50%',
                backgroundColor: c.hex,
                border: c.id === selectedColourId ? '3px solid var(--color-text-primary)' : '2px solid var(--color-border)',
                outline: c.id === selectedColourId ? '2px solid #fff' : 'none',
                boxShadow: c.id === selectedColourId ? '0 0 0 2px var(--color-text-primary)' : 'none',
                cursor: 'pointer', padding: 0, position: 'relative',
              }}
            >
              {c.id === selectedColourId && (
                <Check size={18} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: c.hex === '#f5f5f5' || c.hex === '#ffffff' ? '#111' : '#fff' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Size selector */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
            {t('selectSize')}
            {!selectedSize && <span style={{ color: 'var(--color-error)', marginLeft: '4px' }}>*</span>}
          </p>
          <button
            onClick={() => setSizeGuideOpen(true)}
            style={{ background: 'none', border: 'none', fontSize: '13px', color: 'var(--color-accent-cool)', textDecoration: 'underline', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Ruler size={13} /> {t('productSizeGuide')}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: '8px' }}>
          {product.sizes.map(s => {
            const isActive = s.label === selectedSize;
            return (
              <button
                key={s.label}
                onClick={() => s.available && setSelectedSize(s.label)}
                disabled={!s.available}
                aria-pressed={isActive}
                style={{
                  height: '48px', borderRadius: 'var(--radius-md)',
                  border: isActive ? '2px solid var(--color-text-primary)' : '1px solid var(--color-border)',
                  backgroundColor: isActive ? 'var(--color-text-primary)' : 'var(--color-background)',
                  color: isActive ? 'var(--color-background)' : s.available ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  fontSize: '14px', fontWeight: isActive ? 700 : 500,
                  cursor: s.available ? 'pointer' : 'not-allowed',
                  opacity: s.available ? 1 : 0.5,
                  position: 'relative',
                  transition: 'all 150ms',
                }}
              >
                {s.label}
                {s.lowStock && s.available && (
                  <span style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#F97316' }} />
                )}
                {!s.available && (
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ position: 'absolute', width: '70%', height: '1px', backgroundColor: 'currentColor', transform: 'rotate(-18deg)' }} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {selectedSize && (
          <p style={{ fontSize: '12px', color: 'var(--color-success)', margin: '8px 0 0', fontWeight: 600 }}>
            ✓ Selected: {selectedSize}
          </p>
        )}
      </div>

      {/* Quantity stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Quantity</p>
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <button
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            style={{ width: '40px', height: '40px', border: 'none', background: 'transparent', cursor: quantity <= 1 ? 'not-allowed' : 'pointer', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: quantity <= 1 ? 0.4 : 1 }}
          >
            <Minus size={15} />
          </button>
          <span style={{ minWidth: '40px', textAlign: 'center', fontSize: '15px', fontWeight: 700 }}>{quantity}</span>
          <button
            onClick={() => setQuantity(q => Math.min(10, q + 1))}
            disabled={quantity >= 10}
            style={{ width: '40px', height: '40px', border: 'none', background: 'transparent', cursor: quantity >= 10 ? 'not-allowed' : 'pointer', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: quantity >= 10 ? 0.4 : 1 }}
          >
            <Plus size={15} />
          </button>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>10 items available</span>
      </div>

      {/* CTA Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={handleAddToCart}
          disabled={!selectedSize}
          style={{
            flex: 1, minWidth: '200px', height: '54px',
            borderRadius: 'var(--radius-full)', border: 'none',
            backgroundColor: !selectedSize ? 'var(--color-border)' : addedToCart ? 'var(--color-success)' : 'var(--color-text-primary)',
            color: !selectedSize ? 'var(--color-text-secondary)' : '#fff',
            fontSize: '15px', fontWeight: 700, cursor: selectedSize ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'all 300ms',
            letterSpacing: '0.02em',
          }}
        >
          {addedToCart ? (
            <><Check size={18} /> {t('productAddedToCart')}</>
          ) : (
            <><ShoppingBag size={18} /> {t('addToCart')}</>
          )}
        </button>
        <button
          onClick={() => { if (!selectedSize) return; setFavourited(f => !f); }}
          disabled={!selectedSize}
          aria-pressed={favourited}
          style={{
            width: '54px', height: '54px', borderRadius: 'var(--radius-full)',
            border: favourited ? '2px solid var(--color-error)' : '1px solid var(--color-border)',
            background: 'transparent', cursor: selectedSize ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: favourited ? 'var(--color-error)' : 'var(--color-text-primary)',
            transition: 'all 200ms',
          }}
        >
          <Heart size={20} fill={favourited ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Secondary actions */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button style={{ flex: 1, minWidth: '140px', height: '44px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-primary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <MessageSquare size={15} /> {t('productChatShop')}
        </button>
        <button style={{ flex: 1, minWidth: '140px', height: '44px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-primary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Store size={15} /> {t('productCheckStore')}
        </button>
      </div>

      {/* Trust badges strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        {[
          { icon: <ShieldCheck size={16} />, label: '100% Authentic', sub: 'Verified genuine product' },
          { icon: <RotateCcw size={16} />, label: '7-Day Returns', sub: 'No questions asked' },
          { icon: <Truck size={16} />, label: 'Free Exchange', sub: 'Size/colour within 30 days' },
          { icon: <Award size={16} />, label: 'Member Rewards', sub: 'Earn 2x CommerceHub Coins' },
        ].map(({ icon, label, sub }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ color: 'var(--color-success)', display: 'flex', flexShrink: 0 }}>{icon}</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{label}</p>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Shipping info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          <Truck size={14} />
          <span>Standard delivery: 3–5 business days</span>
          <span style={{ marginLeft: 'auto', color: 'var(--color-success)', fontWeight: 600 }}>Free</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          <Clock size={14} />
          <span>Express delivery: 1–2 business days</span>
          <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{formatVND(85000)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          <Store size={14} />
          <span>Pick up in store — available today</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          <CreditCard size={14} />
          <span>Payments: COD · Visa · Mastercard · MoMo · ZaloPay</span>
        </div>
      </div>

      {sizeGuideOpen && <SizeGuideModal onClose={() => setSizeGuideOpen(false)} />}
    </div>
  );
}

/* ============================================================
   PRODUCT HIGHLIGHTS (VaMe-style)
   ============================================================ */

function ProductHighlights({ features }: { features: string[] }) {
  const { t } = useTranslation();
  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: 'var(--color-text-primary)' }}>
        {t('productHighlights')}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        {features.map((feat, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 14px',
              backgroundColor: 'var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: 'var(--color-text-primary)',
            }}
          >
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--color-success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 }}>
              ✓
            </span>
            {feat}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   HOW OTHERS ARE WEARING IT
   ============================================================ */

function HowOthersWear() {
  const { t } = useTranslation();
  return (
    <div style={{ marginBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {t('productHowOthersWear')}
        </h3>
        <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', background: 'transparent', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: 'var(--color-text-primary)' }}>
          <Camera size={14} /> {t('productUploadPhoto')}
        </button>
      </div>
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
        {[
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&q=80',
          'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=200&q=80',
          'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=200&q=80',
          'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=200&q=80',
          'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=200&q=80',
        ].map((src, i) => (
          <div
            key={i}
            style={{
              flex: '0 0 auto', width: '160px', height: '200px',
              borderRadius: 'var(--radius-md)', overflow: 'hidden',
              backgroundColor: '#f5f5f5', position: 'relative',
              cursor: 'pointer',
            }}
          >
            <img src={src} alt={`Customer styled photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '11px', fontWeight: 600, padding: '4px 8px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              View Looks
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   SUSTAINABILITY BANNER (Nike-style)
   ============================================================ */

function SustainabilityBanner() {
  const { t } = useTranslation();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '16px 20px',
        backgroundColor: '#F0FDF4',
        borderRadius: 'var(--radius-md)',
        border: '1px solid #BBF7D0',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: '28px' }}>♻️</span>
      <div>
        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-success)', margin: '0 0 2px' }}>
          {t('productMadeWithRecycled')}
        </p>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
          This product is made from at least 75% recycled polyester fibres — a step toward a more sustainable future.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   SHARED GHOST BUTTON
   ============================================================ */

const ghostBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px',
  padding: '8px 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)', background: 'transparent',
  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
  color: 'var(--color-text-primary)', flex: 1,
};

/* ============================================================
   MAIN PAGE
   ============================================================ */

function ProductDetailPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<DetailTab>('description');
  const [selectedColourId, setSelectedColourId] = useState(SAMPLE_PRODUCT.colours[0].id);
  const { slug } = useParams<{ slug: string }>();
  void slug;

  const product = SAMPLE_PRODUCT;
  const selectedColour = product.colours.find(c => c.id === selectedColourId) ?? product.colours[0];

  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'description', label: t('description') },
    { id: 'reviews', label: `${t('reviews')} (${product.reviewCount.toLocaleString()})` },
    { id: 'sizing', label: 'Size & Fit' },
  ];

  const ratingDist = [
    { stars: 5, count: 924 },
    { stars: 4, count: 214 },
    { stars: 3, count: 87 },
    { stars: 2, count: 39 },
    { stars: 1, count: 20 },
  ];

  return (
    <MainLayout>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <ChevronRight size={12} />
          <Link to="/products" style={{ color: 'inherit', textDecoration: 'none' }}>{t('products')}</Link>
          <ChevronRight size={12} />
          <Link to="/products" style={{ color: 'inherit', textDecoration: 'none' }}>{product.brand}</Link>
          <ChevronRight size={12} />
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{product.name}</span>
        </nav>

        {/* Hero grid: gallery | info */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)',
          gap: '60px', alignItems: 'start', marginBottom: '60px',
        }} className="pd-hero-grid">

          {/* Left: Gallery */}
          <ProductGallery images={selectedColour.images} alt={product.name} />

          {/* Right: Product info */}
          <ProductInfoSection
            product={product}
            selectedColourId={selectedColourId}
            onColourChange={setSelectedColourId}
          />
        </div>

        {/* Sustainability banner */}
        <SustainabilityBanner />

        {/* Tabs navigation */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '32px', marginBottom: '40px' }}>
          <div role="tablist" style={{ display: 'flex', gap: '0', marginBottom: '28px', borderBottom: '2px solid var(--color-border)' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 24px', background: 'none', border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid var(--color-text-primary)' : '2px solid transparent',
                  marginBottom: '-2px', cursor: 'pointer', fontSize: '15px',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  fontFamily: 'inherit', transition: 'color 150ms',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Description Panel ── */}
          <div role="tabpanel" id="panel-description" aria-labelledby="tab-description" hidden={activeTab !== 'description'}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '48px', alignItems: 'start' }} className="pd-desc-grid">
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px' }}>{t('description')}</h2>
                <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
                  {product.longDescription}
                </p>
                <ProductHighlights features={product.features} />
              </div>

              {/* Sidebar: specs */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>{t('productDetails')}</h3>
                <div>
                  {product.specs.map((spec, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{spec.label}</span>
                      <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{spec.value}</span>
                    </div>
                  ))}
                </div>

                {/* How This Was Made */}
                <div style={{ marginTop: '20px', padding: '14px', backgroundColor: '#F0FDF4', borderRadius: 'var(--radius-md)', border: '1px solid #BBF7D0' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-success)', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Leaf size={14} /> {t('productHowThisWasMade')}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
                    At least 75% of the upper is made from recycled polyester fibres. The midsole uses Nike Air cushioning — pressurised air for responsive comfort with every step. The rubber outsole is partly sourced from recycled materials.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Reviews Panel ── */}
          <div role="tabpanel" id="panel-reviews" aria-labelledby="tab-reviews" hidden={activeTab !== 'reviews'}>
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '48px', alignItems: 'start' }} className="pd-reviews-grid">
              {/* Left: summary */}
              <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#f5f5f5', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ fontSize: '56px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 4px' }}>
                  {product.rating.toFixed(1)}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                  <StarRating rating={product.rating} size={18} />
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 20px' }}>
                  Based on {product.reviewCount.toLocaleString()} reviews
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', textAlign: 'left' }}>
                  {ratingDist.map(({ stars, count }) => (
                    <RatingBar key={stars} label={`${stars}★`} value={(count / product.reviewCount) * 5} />
                  ))}
                </div>
                <button style={{ marginTop: '20px', width: '100%', padding: '10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-text-primary)', background: 'transparent', color: 'var(--color-text-primary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  {t('productWriteReview')}
                </button>
              </div>

              {/* Right: reviews */}
              <div>
                {product.reviews.map(review => (
                  <ReviewCard key={review.id} {...review} />
                ))}
                {product.reviews.length === 0 && (
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', padding: '20px 0' }}>
                    No reviews yet. Be the first to share your thoughts!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Size & Fit Panel ── */}
          <div role="tabpanel" id="panel-sizing" aria-labelledby="tab-sizing" hidden={activeTab !== 'sizing'}>
            <div style={{ maxWidth: '720px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Size & Fit</h2>

              <Accordion label="How It Fits" icon={<Info size={15} />} defaultOpen>
                <p>Fits true to size. Order your usual size for a standard fit. For a more relaxed, slightly roomier feel, consider going half a size up.</p>
              </Accordion>
              <Accordion label="Materials" icon={<Package size={15} />} defaultOpen>
                <p>Upper: Recycled mesh and synthetic overlays · Midsole: Nike Air cushioning · Outsole: Rubber with Waffle pattern for durable traction.</p>
              </Accordion>
              <Accordion label="Care Instructions" icon={<Leaf size={15} />}>
                <p>Wipe clean with a damp cloth. Do not machine wash. Air dry away from direct sunlight. Avoid harsh chemicals or bleach.</p>
              </Accordion>
              <Accordion label="Delivery & Returns" icon={<Truck size={15} />} badge="Free">
                <p>Standard delivery: 3–5 business days · Express: 1–2 business days · Free returns within 7 days of delivery.</p>
              </Accordion>
              <Accordion label="Country of Origin" icon={<Globe size={15} />}>
                <p>Manufactured in Vietnam. Designed in Beaverton, Oregon, USA.</p>
              </Accordion>
            </div>
          </div>
        </div>

        {/* How Others Are Wearing It */}
        <HowOthersWear />

        {/* Accordions (VaMe-style) */}
        <div style={{ marginBottom: '48px', maxWidth: '800px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Frequently Asked Questions</h3>
          <Accordion label="What payment methods are accepted?" icon={<CreditCard size={15} />} defaultOpen>
            We accept Cash on Delivery (COD), Visa, Mastercard, MoMo, and ZaloPay. All transactions are secured with SSL encryption.
          </Accordion>
          <Accordion label="How do I track my order?" icon={<Truck size={15} />}>
            Once your order ships, you'll receive an email with a tracking number. You can also track it in My Account → My Orders.
          </Accordion>
          <Accordion label="Can I return or exchange this item?" icon={<RotateCcw size={15} />} badge="7 days free">
            Yes! We offer free returns within 7 days and free size/colour exchanges within 30 days. Visit our Returns page for instructions.
          </Accordion>
          <Accordion label="Is this product covered by warranty?" icon={<ShieldCheck size={15} />}>
            All products are covered by CommerceHub's standard 30-day quality guarantee. Manufacturing defects are eligible for full refund or replacement.
          </Accordion>
        </div>

        {/* Related products */}
        <RelatedProductsCarousel products={RELATED_PRODUCTS} />
      </div>

      {/* Global page styles */}
      <style>{`
        @keyframes gallery-fade {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        @media (max-width: 1100px) {
          .pd-hero-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .pd-desc-grid { grid-template-columns: 1fr !important; }
          .pd-reviews-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .pd-hero-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </MainLayout>
  );
}

// Small Globe icon component used in accordion
function Globe({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export default ProductDetailPage;
