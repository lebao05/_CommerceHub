import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import { formatVNDLong } from '../data/cartData';

interface CartSummaryBarProps {
  totalItems: number;
  totalAmount: number;
  allChecked: boolean;
  isIndeterminate: boolean;
  onSelectAll: (checked: boolean) => void;
  onDeleteSelected: () => void;
  onRemoveInactive: () => void;
  onMoveToLikes: () => void;
}

const SHOPEE_ORANGE = '#ee4d2d';
const SHOPEE_ORANGE_DARK = '#d73211';

function CartSummaryBar({
  totalItems,
  totalAmount,
  allChecked,
  isIndeterminate,
  onSelectAll,
  onDeleteSelected,
  onRemoveInactive,
  onMoveToLikes,
}: CartSummaryBarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (totalItems === 0) return;
    navigate('/checkout');
  };

  const itemLabel = totalItems === 1 ? t('cartItem') : t('cartItems');

  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        backgroundColor: '#fff',
        borderTop: '1px solid var(--color-border)',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap',
      }}
    >
      {/* Select all */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="checkbox"
          checked={allChecked}
          ref={el => {
            if (el) el.indeterminate = isIndeterminate && !allChecked;
          }}
          onChange={e => onSelectAll(e.target.checked)}
          aria-label="Select all items"
          style={{
            width: '20px',
            height: '20px',
            accentColor: SHOPEE_ORANGE,
            cursor: 'pointer',
          }}
        />
        <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
          {t('cartSelectAll')}
        </span>
      </div>

      {/* Bulk actions */}
      <button
        onClick={onDeleteSelected}
        disabled={totalItems === 0}
        style={bulkButtonStyle(totalItems === 0)}
      >
        {t('cartDelete')}
      </button>
      <button
        onClick={onRemoveInactive}
        style={bulkButtonStyle(false)}
      >
        {t('cartRemoveInactive')}
      </button>
      <button
        onClick={onMoveToLikes}
        disabled={totalItems === 0}
        style={{
          ...bulkButtonStyle(totalItems === 0),
          color: totalItems === 0 ? 'var(--color-text-secondary)' : SHOPEE_ORANGE,
        }}
      >
        {t('cartMoveToLikes')}
      </button>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Total */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          color: 'var(--color-text-primary)',
        }}
      >
        <span>{t('cartTotal')} ({totalItems} {itemLabel}):</span>
        <span
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: SHOPEE_ORANGE,
          }}
        >
          {formatVNDLong(totalAmount)}
        </span>
      </div>

      {/* Checkout button */}
      <button
        onClick={handleCheckout}
        disabled={totalItems === 0}
        style={{
          minWidth: '160px',
          height: '44px',
          padding: '0 28px',
          borderRadius: '3px',
          border: 'none',
          backgroundColor: totalItems === 0 ? '#c0c0c0' : SHOPEE_ORANGE,
          color: '#fff',
          fontSize: '15px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          cursor: totalItems === 0 ? 'not-allowed' : 'pointer',
          transition: 'background-color 150ms',
        }}
        onMouseEnter={e => {
          if (totalItems > 0) e.currentTarget.style.backgroundColor = SHOPEE_ORANGE_DARK;
        }}
        onMouseLeave={e => {
          if (totalItems > 0) e.currentTarget.style.backgroundColor = SHOPEE_ORANGE;
        }}
      >
        {t('cartCheckout')}
      </button>
    </div>
  );
}

function bulkButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    background: 'none',
    border: 'none',
    padding: '4px 8px',
    fontSize: '13px',
    color: disabled ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    textDecoration: 'underline',
    fontFamily: 'inherit',
  };
}

export default CartSummaryBar;
