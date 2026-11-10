import { useState } from 'react';
import {
  Heart,
  Star,
  Minus,
  Plus,
  Check,
  ShoppingBag,
  MessageCircle,
  Truck,
  RotateCcw,
} from 'lucide-react';
import type { ProductDetail } from '../data/productDetail';
import { getDiscountPercentage } from '../utils/helpers';
import { useTranslation } from '../i18n/context';

interface ProductInfoProps {
  product: ProductDetail;
  selectedColourId: string;
  onColourChange: (id: string) => void;
}

function ProductInfo({ product, selectedColourId, onColourChange }: ProductInfoProps) {
  const { t } = useTranslation();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [favourited, setFavourited] = useState(false);

  const selectedColour =
    product.colours.find(c => c.id === selectedColourId) ?? product.colours[0];

  const discount =
    product.oldPrice != null ? getDiscountPercentage(product.oldPrice, product.price) : 0;

  const dec = () => setQuantity(q => Math.max(1, q - 1));
  const inc = () => setQuantity(q => Math.min(99, q + 1));

  const onAddToCart = () => {
    if (!selectedSize) return;
    // In a real app this would dispatch to a cart store.
    // eslint-disable-next-line no-alert
    alert(`Added ${quantity} × ${product.name} (${selectedSize}, ${selectedColour.name}) to cart`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Brand + title block */}
      <div>
        <p style={{
          color: 'var(--color-text-secondary)',
          fontSize: '15px',
          fontWeight: 500,
          margin: '0 0 4px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {product.brand}
        </p>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 6px',
          lineHeight: 1.15,
        }}>
          {product.name}
        </h1>
        <p style={{
          fontSize: '15px',
          color: 'var(--color-text-secondary)',
          margin: 0,
        }}>
          {product.category}
        </p>
      </div>

      {/* Rating row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '13px',
        color: 'var(--color-text-secondary)',
      }}>
        <div style={{ display: 'flex', color: '#F59E0B' }} aria-hidden="true">
          {[1, 2, 3, 4, 5].map(i => (
            <Star
              key={i}
              size={15}
              fill={i <= Math.round(product.rating) ? 'currentColor' : 'none'}
              stroke="currentColor"
            />
          ))}
        </div>
        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {product.rating.toFixed(1)}
        </span>
        <span style={{ color: 'var(--color-text-secondary)' }}>
          ({product.reviewCount.toLocaleString('en-US')} {t('reviews')})
        </span>
        <span style={{ color: 'var(--color-border)' }}>|</span>
        <span>
          {t('productSku')}: <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{product.sku}</span>
        </span>
      </div>

      {/* Price */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{
          fontSize: '26px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
        }}>
          {product.price.toLocaleString('en-US')}₫
        </span>
        {product.oldPrice != null && (
          <>
            <span style={{
              fontSize: '16px',
              color: 'var(--color-text-secondary)',
              textDecoration: 'line-through',
            }}>
              {product.oldPrice.toLocaleString('en-US')}₫
            </span>
            {discount > 0 && (
              <span style={{
                backgroundColor: 'var(--color-error)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                letterSpacing: '0.02em',
              }}>
                -{discount}%
              </span>
            )}
          </>
        )}
      </div>

      {/* Divider */}
      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

      {/* Colour selector */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}>
          <p style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            margin: 0,
          }}>
            {t('productColour')}: <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{selectedColour.name}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {product.colours.map(c => {
            const isActive = c.id === selectedColourId;
            return (
              <button
                key={c.id}
                onClick={() => onColourChange(c.id)}
                aria-label={`Select colour: ${c.name}`}
                aria-pressed={isActive}
                title={c.name}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: c.hex,
                  border: isActive ? '2px solid var(--color-text-primary)' : '1px solid var(--color-border)',
                  outline: isActive ? '2px solid #fff' : 'none',
                  boxShadow: isActive ? '0 0 0 1px var(--color-text-primary)' : 'none',
                  cursor: 'pointer',
                  padding: 0,
                  position: 'relative',
                  transition: 'transform 150ms',
                }}
              >
                {isActive && (
                  <Check
                    size={18}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: c.hex === '#f5f5f5' || c.hex === '#ffffff' ? '#111' : '#fff',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Size selector */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}>
          <p style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            margin: 0,
          }}>
            {t('selectSize')}
            {!selectedSize && <span style={{ color: 'var(--color-error)', marginLeft: '6px' }}>*</span>}
          </p>
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            {t('productSizeGuide')}
          </button>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
          gap: '8px',
        }}>
          {product.sizes.map(s => {
            const isActive = s.label === selectedSize;
            return (
              <button
                key={s.label}
                onClick={() => s.available && setSelectedSize(s.label)}
                disabled={!s.available}
                aria-pressed={isActive}
                title={
                  !s.available
                    ? `${s.label} (out of stock)`
                    : s.lowStock
                    ? `${s.label} (low stock)`
                    : s.label
                }
                style={{
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  border: isActive
                    ? '2px solid var(--color-text-primary)'
                    : '1px solid var(--color-border)',
                  backgroundColor: isActive ? 'var(--color-text-primary)' : 'var(--color-background)',
                  color: isActive
                    ? 'var(--color-background)'
                    : s.available
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-secondary)',
                  fontSize: '14px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: s.available ? 'pointer' : 'not-allowed',
                  position: 'relative',
                  opacity: s.available ? 1 : 0.5,
                  transition: 'all 150ms',
                }}
              >
                {s.label}
                {!s.available && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '50%',
                      left: '8%',
                      right: '8%',
                      height: '1px',
                      backgroundColor: 'currentColor',
                      transform: 'rotate(-18deg)',
                    }} />
                  </span>
                )}
                {s.lowStock && s.available && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      bottom: '3px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-accent-warm)',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
        {selectedSize && (
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '8px 0 0' }}>
            {t('productSelectedSize')}: <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{selectedSize}</span>
          </p>
        )}
      </div>

      {/* Quantity + add to bag + heart (Nike layout) */}
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'stretch',
        flexWrap: 'wrap',
      }}>
        {/* Quantity stepper */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
        }}>
          <button
            onClick={dec}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            style={{
              width: '44px',
              height: '52px',
              border: 'none',
              background: 'transparent',
              cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: quantity <= 1 ? 0.4 : 1,
            }}
          >
            <Minus size={16} />
          </button>
          <span style={{
            minWidth: '36px',
            textAlign: 'center',
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
          }}>
            {quantity}
          </span>
          <button
            onClick={inc}
            disabled={quantity >= 99}
            aria-label="Increase quantity"
            style={{
              width: '44px',
              height: '52px',
              border: 'none',
              background: 'transparent',
              cursor: quantity >= 99 ? 'not-allowed' : 'pointer',
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: quantity >= 99 ? 0.4 : 1,
            }}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Add to Bag — primary CTA */}
        <button
          onClick={onAddToCart}
          disabled={!selectedSize}
          style={{
            flex: 1,
            minWidth: '200px',
            height: '52px',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            backgroundColor: selectedSize ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            color: 'var(--color-background)',
            fontSize: '15px',
            fontWeight: 700,
            letterSpacing: '0.02em',
            cursor: selectedSize ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'transform 150ms, opacity 150ms',
            opacity: selectedSize ? 1 : 0.7,
          }}
          onMouseEnter={e => {
            if (selectedSize) e.currentTarget.style.opacity = '0.85';
          }}
          onMouseLeave={e => {
            if (selectedSize) e.currentTarget.style.opacity = '1';
          }}
        >
          <ShoppingBag size={18} />
          {t('addToCart')}
        </button>

        {/* Favourite heart */}
        <button
          onClick={() => setFavourited(f => !f)}
          aria-label={favourited ? t('productRemoveFromWishlist') : t('wishlist')}
          aria-pressed={favourited}
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            border: '1px solid var(--color-border)',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: favourited ? 'var(--color-error)' : 'var(--color-text-primary)',
            transition: 'border-color 150ms, color 150ms',
          }}
        >
          <Heart size={20} fill={favourited ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Secondary actions (Puma style) */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
      }}>
        <button
          type="button"
          style={{
            flex: 1,
            minWidth: '160px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text-primary)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'background-color 150ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-border)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <Heart size={16} />
          {t('productAddToWishlist')}
        </button>

        <button
          type="button"
          style={{
            flex: 1,
            minWidth: '160px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text-primary)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'background-color 150ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-border)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <MessageCircle size={16} />
          {t('productContactNow')}
        </button>
      </div>

      {/* Quick shipping & returns (compact) */}
      <div style={{
        display: 'flex',
        gap: '16px',
        padding: '12px 14px',
        backgroundColor: 'var(--color-border)',
        borderRadius: 'var(--radius-md)',
        fontSize: '13px',
        color: 'var(--color-text-secondary)',
        flexWrap: 'wrap',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Truck size={14} /> {t('productFreeShipping')}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <RotateCcw size={14} /> {t('productFreeReturns')}
        </span>
      </div>
    </div>
  );
}

export default ProductInfo;
