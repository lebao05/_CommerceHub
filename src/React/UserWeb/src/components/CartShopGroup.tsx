import { ChevronRight, MessageCircle, Store } from 'lucide-react';
import type { CartShop, CartItem } from '../data/cartData';
import CartItemRow from './CartItemRow';
import { useTranslation } from '../i18n/context';

interface CartShopGroupProps {
  shop: CartShop;
  selectedIds: Set<string>;
  onItemCheck: (id: string, checked: boolean) => void;
  onItemQuantityChange: (id: string, quantity: number) => void;
  onItemRemove: (id: string) => void;
  onItemFindSimilar: (id: string) => void;
  onShopCheck: (shopId: string, checked: boolean) => void;
  onApplyShopVoucher: (shopId: string) => void;
}

const SHOPEE_ORANGE = '#ee4d2d';

function CartShopGroup({
  shop,
  selectedIds,
  onItemCheck,
  onItemQuantityChange,
  onItemRemove,
  onItemFindSimilar,
  onShopCheck,
  onApplyShopVoucher,
}: CartShopGroupProps) {
  const { t } = useTranslation();

  const allChecked = shop.items.every(i => selectedIds.has(i.id));
  const noneChecked = shop.items.every(i => !selectedIds.has(i.id));
  const isIndeterminate = !allChecked && !noneChecked;

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        marginBottom: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Shop header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 20px',
          backgroundColor: '#fafafa',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <input
          type="checkbox"
          checked={allChecked}
          ref={el => {
            if (el) el.indeterminate = isIndeterminate;
          }}
          onChange={e => onShopCheck(shop.id, e.target.checked)}
          aria-label={`Select all items from ${shop.name}`}
          style={{
            width: '18px',
            height: '18px',
            accentColor: SHOPEE_ORANGE,
            cursor: 'pointer',
          }}
        />

        <Store size={18} color="var(--color-text-primary)" />

        <span
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}
        >
          {shop.name}
        </span>

        {shop.favouriteLabel && (
          <span
            style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: 700,
              color: SHOPEE_ORANGE,
              border: `1px solid ${SHOPEE_ORANGE}`,
              padding: '1px 6px',
              borderRadius: '3px',
              lineHeight: 1.4,
            }}
          >
            {shop.favouriteLabel}
          </span>
        )}

        <button
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
          aria-label="Chat with shop"
        >
          <MessageCircle size={14} /> {t('cartChat')}
        </button>

        <button
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            marginLeft: 'auto',
          }}
          aria-label="Visit shop"
        >
          {t('cartViewShop')} <ChevronRight size={14} />
        </button>
      </div>

      {/* Item rows */}
      {shop.items.map((item: CartItem) => (
        <CartItemRow
          key={item.id}
          item={item}
          checked={selectedIds.has(item.id)}
          onCheckChange={onItemCheck}
          onQuantityChange={onItemQuantityChange}
          onRemove={onItemRemove}
          onFindSimilar={onItemFindSimilar}
        />
      ))}

      {/* Footer: Add shop voucher */}
      <div
        style={{
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          backgroundColor: '#fff',
        }}
      >
        <button
          onClick={() => onApplyShopVoucher(shop.id)}
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: '13px',
            color: SHOPEE_ORANGE,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 500,
          }}
        >
          {t('cartAddShopVoucher')}
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default CartShopGroup;
