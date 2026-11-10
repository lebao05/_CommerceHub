import { Link } from 'react-router-dom';
import { ChevronDown, Minus, Plus } from 'lucide-react';
import type { CartItem } from '../data/cartData';
import { formatVNDLong } from '../data/cartData';
import { useTranslation } from '../i18n/context';

interface CartItemRowProps {
  item: CartItem;
  checked: boolean;
  onCheckChange: (id: string, checked: boolean) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onFindSimilar: (id: string) => void;
}

const SHOPEE_ORANGE = '#ee4d2d';
const DISCOUNT_YELLOW = '#f69113';
const DISCOUNT_YELLOW_BG = '#fef5e3';
const FREE_SHIPPING_GREEN = '#00bfa5';

function CartItemRow({
  item,
  checked,
  onCheckChange,
  onQuantityChange,
  onRemove,
  onFindSimilar,
}: CartItemRowProps) {
  const { t } = useTranslation();
  const total = item.unitPrice * item.quantity;

  const dec = () => onQuantityChange(item.id, Math.max(1, item.quantity - 1));
  const inc = () => onQuantityChange(item.id, Math.min(99, item.quantity + 1));

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 130px 140px 130px 60px',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 20px',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: checked ? '#fff7f5' : 'transparent',
        transition: 'background-color 150ms',
        opacity: item.inactive ? 0.5 : 1,
      }}
      className="cart-item-row"
    >
      {/* Checkbox */}
      <div>
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onCheckChange(item.id, e.target.checked)}
          aria-label={`Select ${item.productName}`}
          style={{
            width: '18px',
            height: '18px',
            accentColor: SHOPEE_ORANGE,
            cursor: 'pointer',
          }}
        />
      </div>

      {/* Product info */}
      <div style={{ display: 'flex', gap: '12px', minWidth: 0 }}>
        <Link
          to={`/products/${item.productSlug}`}
          style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#f5f5f5',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            flexShrink: 0,
            border: '1px solid var(--color-border)',
            textDecoration: 'none',
          }}
        >
          <img
            src={item.productImage}
            alt={item.productName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </Link>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badge row */}
          {item.badges.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: '6px',
                marginBottom: '4px',
                flexWrap: 'wrap',
              }}
            >
              {item.badges.map((b, i) => (
                <span
                  key={i}
                  title={b.title}
                  style={{
                    display: 'inline-block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: DISCOUNT_YELLOW,
                    backgroundColor: DISCOUNT_YELLOW_BG,
                    border: `1px solid ${DISCOUNT_YELLOW}`,
                    padding: '1px 6px',
                    borderRadius: '3px',
                    lineHeight: 1.4,
                  }}
                >
                  {b.text}
                </span>
              ))}
              {item.freeShipping && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: FREE_SHIPPING_GREEN,
                    border: `1px solid ${FREE_SHIPPING_GREEN}`,
                    padding: '1px 6px',
                    borderRadius: '3px',
                    lineHeight: 1.4,
                  }}
                >
                  🚚 Freeship
                </span>
              )}
            </div>
          )}

          {/* Product name */}
          <Link
            to={`/products/${item.productSlug}`}
            style={{
              fontSize: '14px',
              color: 'var(--color-text-primary)',
              textDecoration: 'none',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.4,
              marginBottom: '6px',
            }}
          >
            {item.productName}
          </Link>

          {/* Flash sale text */}
          {item.flashSaleEndsAt && (
            <p
              style={{
                fontSize: '12px',
                color: SHOPEE_ORANGE,
                fontWeight: 500,
                margin: '0 0 6px',
              }}
            >
              {t('cartFlashSale')}{' '}
              <span style={{ fontWeight: 700 }}>{item.flashSaleEndsAt}</span>
            </p>
          )}

          {/* Variation selector */}
          {item.variations.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {item.variations.map((v, i) => (
                <button
                  key={i}
                  type="button"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '3px',
                    fontSize: '12px',
                    color: 'var(--color-text-primary)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    minWidth: 0,
                    maxWidth: '100%',
                  }}
                  title={`${v.label}: ${v.value}`}
                >
                  <span
                    style={{
                      color: 'var(--color-text-secondary)',
                      fontWeight: 500,
                      flexShrink: 0,
                    }}
                  >
                    {v.label}:
                  </span>
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: 500,
                    }}
                  >
                    {v.value}
                  </span>
                  <ChevronDown size={12} color="var(--color-text-secondary)" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Unit price */}
      <div
        style={{
          fontSize: '14px',
          color: 'var(--color-text-primary)',
          textAlign: 'center',
        }}
      >
        {item.originalPrice != null && (
          <div
            style={{
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              textDecoration: 'line-through',
              marginBottom: '2px',
            }}
          >
            {formatVNDLong(item.originalPrice)}
          </div>
        )}
        <span style={{ fontWeight: 500 }}>{formatVNDLong(item.unitPrice)}</span>
      </div>

      {/* Quantity stepper */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            border: '1px solid var(--color-border)',
            borderRadius: '3px',
            overflow: 'hidden',
            backgroundColor: '#fff',
          }}
        >
          <button
            onClick={dec}
            disabled={item.quantity <= 1}
            aria-label="Decrease quantity"
            style={stepperButtonStyle(item.quantity <= 1)}
          >
            <Minus size={12} />
          </button>
          <input
            type="text"
            value={item.quantity}
            onChange={e => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v)) onQuantityChange(item.id, Math.min(99, Math.max(1, v)));
            }}
            aria-label="Quantity"
            style={{
              width: '40px',
              height: '30px',
              textAlign: 'center',
              border: 'none',
              borderLeft: '1px solid var(--color-border)',
              borderRight: '1px solid var(--color-border)',
              fontSize: '14px',
              color: 'var(--color-text-primary)',
              backgroundColor: '#fff',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={inc}
            disabled={item.quantity >= 99}
            aria-label="Increase quantity"
            style={stepperButtonStyle(item.quantity >= 99)}
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Total */}
      <div
        style={{
          fontSize: '14px',
          color: SHOPEE_ORANGE,
          fontWeight: 700,
          textAlign: 'center',
        }}
      >
        {formatVNDLong(total)}
      </div>

      {/* Actions (Delete + Find similar) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
        }}
      >
        <button
          onClick={() => onRemove(item.id)}
          style={actionButtonStyle}
        >
          {t('cartDelete')}
        </button>
        <button
          onClick={() => onFindSimilar(item.id)}
          style={{
            ...actionButtonStyle,
            color: 'var(--color-text-secondary)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
            {t('cartFindSimilar')} <ChevronDown size={10} />
          </span>
        </button>
      </div>
    </div>
  );
}

function stepperButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    width: '28px',
    height: '30px',
    border: 'none',
    background: 'transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: disabled ? '#c0c0c0' : 'var(--color-text-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}

const actionButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  fontSize: '12px',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  textDecoration: 'underline',
  fontFamily: 'inherit',
};

export default CartItemRow;
