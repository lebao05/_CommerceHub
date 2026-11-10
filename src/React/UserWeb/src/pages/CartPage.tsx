import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Tag, Coins, ChevronRight } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import CartShopGroup from '../components/CartShopGroup';
import CartSummaryBar from '../components/CartSummaryBar';
import { SAMPLE_CART, type CartShop } from '../data/cartData';
import { useTranslation } from '../i18n/context';

const SHOPEE_ORANGE = '#ee4d2d';

function CartPage() {
  const { t } = useTranslation();
  const [shops, setShops] = useState<CartShop[]>(SAMPLE_CART);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(SAMPLE_CART.flatMap(s => s.items.map(i => i.id)))
  );
  const [voucherCode, setVoucherCode] = useState('');

  // ------- Selection helpers -------
  const allItemIds = useMemo(
    () => shops.flatMap(s => s.items.map(i => i.id)),
    [shops]
  );
  const totalItems = selectedIds.size;
  const totalAmount = useMemo(() => {
    return shops
      .flatMap(s => s.items)
      .filter(i => selectedIds.has(i.id))
      .reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  }, [shops, selectedIds]);

  const allChecked = allItemIds.length > 0 && allItemIds.every(id => selectedIds.has(id));
  const isIndeterminate = !allChecked && allItemIds.some(id => selectedIds.has(id));

  const toggleItem = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleShop = (shopId: string, checked: boolean) => {
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      shop.items.forEach(i => {
        if (checked) next.add(i.id);
        else next.delete(i.id);
      });
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(allItemIds) : new Set());
  };

  // ------- Quantity / remove -------
  const updateQuantity = (id: string, quantity: number) => {
    setShops(prev =>
      prev.map(s => ({
        ...s,
        items: s.items.map(i => (i.id === id ? { ...i, quantity } : i)),
      }))
    );
  };

  const removeItem = (id: string) => {
    setShops(prev =>
      prev.map(s => {
        const filtered = s.items.filter(item => item.id !== id);
        return { ...s, items: filtered };
      })
    );
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const removeInactive = () => {
    setShops(prev => prev.map(s => ({ ...s, items: s.items.filter(i => !i.inactive) })));
  };

  const moveToLikes = () => {
    // In a real app, call the wishlist API. For now just clear the selected items.
    selectedIds.forEach(id => removeItem(id));
  };

  const findSimilar = (id: string) => {
    // eslint-disable-next-line no-alert
    alert('Finding similar items for product ' + id);
  };

  const applyVoucher = () => {
    if (!voucherCode.trim()) return;
    // eslint-disable-next-line no-alert
    alert('Voucher code applied: ' + voucherCode);
  };

  const applyShopVoucher = (shopId: string) => {
    // eslint-disable-next-line no-alert
    alert('Open shop voucher sheet for ' + shopId);
  };

  const isEmpty = shops.every(s => s.items.length === 0);

  return (
    <MainLayout>
      <div
        style={{
          backgroundColor: '#f5f5f5',
          minHeight: '70vh',
          padding: '20px 0 120px',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 16px',
          }}
        >
          {/* Title bar */}
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              {t('yourCart')}{' '}
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--color-text-secondary)',
                  marginLeft: '6px',
                }}
              >
                ({shops.flatMap(s => s.items).length} {t('cartItems')})
              </span>
            </h1>

            <div
              style={{
                display: 'flex',
                gap: '16px',
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
              }}
            >
              <span style={{ color: SHOPEE_ORANGE, fontWeight: 600 }}>1. {t('yourCart')}</span>
              <span>2. {t('checkoutTitle')}</span>
              <span>3. {t('orderHistory')}</span>
            </div>
          </div>

          {isEmpty ? (
            <EmptyCart />
          ) : (
            <>
              {/* Shop groups */}
              {shops.map(shop => (
                <CartShopGroup
                  key={shop.id}
                  shop={shop}
                  selectedIds={selectedIds}
                  onItemCheck={toggleItem}
                  onItemQuantityChange={updateQuantity}
                  onItemRemove={removeItem}
                  onItemFindSimilar={findSimilar}
                  onShopCheck={toggleShop}
                  onApplyShopVoucher={applyShopVoucher}
                />
              ))}

              {/* Platform voucher + coins */}
              <VoucherSection
                voucherCode={voucherCode}
                onVoucherCodeChange={setVoucherCode}
                onApplyVoucher={applyVoucher}
              />

              {/* Recommend row (sample products) */}
              <RecommendStrip />
            </>
          )}
        </div>

        {/* Sticky checkout bar */}
        {!isEmpty && (
          <div style={{ position: 'sticky', bottom: 0, zIndex: 30 }}>
            <div
              style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '0 16px',
              }}
            >
              <CartSummaryBar
                totalItems={totalItems}
                totalAmount={totalAmount}
                allChecked={allChecked}
                isIndeterminate={isIndeterminate}
                onSelectAll={toggleAll}
                onDeleteSelected={() => selectedIds.forEach(id => removeItem(id))}
                onRemoveInactive={removeInactive}
                onMoveToLikes={moveToLikes}
              />
            </div>
          </div>
        )}
      </div>

      {/* Responsive grid collapse for the cart row */}
      <style>{`
        @media (max-width: 900px) {
          .cart-item-row {
            grid-template-columns: 32px 1fr !important;
            gap: 8px !important;
            padding: 12px !important;
          }
          .cart-item-row > :nth-child(3),
          .cart-item-row > :nth-child(4),
          .cart-item-row > :nth-child(5),
          .cart-item-row > :nth-child(6) {
            grid-column: 2;
            text-align: left !important;
            justify-content: flex-start !important;
            align-items: center !important;
            padding: 4px 0;
          }
          .cart-item-row > :nth-child(3),
          .cart-item-row > :nth-child(4),
          .cart-item-row > :nth-child(5) {
            display: flex !important;
            justify-content: space-between !important;
          }
        }
      `}</style>
    </MainLayout>
  );
}

/* ---------- Empty cart ---------- */
function EmptyCart() {
  const { t } = useTranslation();
  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: 'var(--radius-md)',
        padding: '80px 20px',
        textAlign: 'center',
      }}
    >
      <ShoppingBag
        size={64}
        color="#c0c0c0"
        style={{ marginBottom: '16px' }}
      />
      <p
        style={{
          fontSize: '16px',
          color: 'var(--color-text-primary)',
          margin: '0 0 8px',
          fontWeight: 500,
        }}
      >
        {t('cartEmpty')}
      </p>
      <p
        style={{
          fontSize: '14px',
          color: 'var(--color-text-secondary)',
          margin: '0 0 20px',
        }}
      >
        {t('cartEmptyDesc')}
      </p>
      <Link
        to="/products"
        style={{
          display: 'inline-block',
          padding: '10px 32px',
          backgroundColor: SHOPEE_ORANGE,
          color: '#fff',
          borderRadius: '3px',
          fontSize: '14px',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        {t('continueShopping')}
      </Link>
    </div>
  );
}

/* ---------- Voucher section (Platform voucher + Shopee coins) ---------- */
function VoucherSection({
  voucherCode,
  onVoucherCodeChange,
  onApplyVoucher,
}: {
  voucherCode: string;
  onVoucherCodeChange: (v: string) => void;
  onApplyVoucher: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        marginBottom: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Platform voucher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <Tag size={18} color={SHOPEE_ORANGE} />
        <span
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            minWidth: '140px',
          }}
        >
          {t('cartPlatformVoucher')}:
        </span>
        <input
          type="text"
          value={voucherCode}
          onChange={e => onVoucherCodeChange(e.target.value)}
          placeholder={t('cartEnterVoucher')}
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '8px 12px',
            border: '1px solid var(--color-border)',
            borderRadius: '3px',
            fontSize: '14px',
            color: 'var(--color-text-primary)',
            backgroundColor: '#fff',
            outline: 'none',
          }}
        />
        <button
          onClick={onApplyVoucher}
          type="button"
          style={{
            padding: '8px 20px',
            backgroundColor: SHOPEE_ORANGE,
            color: '#fff',
            border: 'none',
            borderRadius: '3px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {t('cartApplyVoucher')}
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
            color: SHOPEE_ORANGE,
            cursor: 'pointer',
            fontFamily: 'inherit',
            textDecoration: 'underline',
          }}
        >
          {t('cartChooseVoucher')} <ChevronRight size={12} />
        </button>
      </div>

      {/* Shopee coins */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 0',
          borderTop: '1px dashed var(--color-border)',
        }}
      >
        <Coins size={18} color="#f69113" />
        <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
          {t('cartShopeeCoins')}
        </span>
        <span
          style={{
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
          }}
        >
          — {t('cartCoinsAvailable')}
        </span>
      </div>
    </div>
  );
}

/* ---------- Recommend strip (You may also like) ---------- */
function RecommendStrip() {
  const { t } = useTranslation();
  const items = [
    { id: 'r1', name: 'Air Force 1 \'07', price: 2350000, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80' },
    { id: 'r2', name: 'Adidas Stan Smith', price: 1800000, img: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=200&q=80' },
    { id: 'r3', name: 'Vans Old Skool', price: 1450000, img: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=200&q=80' },
    { id: 'r4', name: 'New Balance 550', price: 2100000, img: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=200&q=80' },
  ];

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        marginTop: '4px',
      }}
    >
      <h2
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 14px',
        }}
      >
        {t('cartYouMayAlsoLike')}
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '12px',
        }}
      >
        {items.map(it => (
          <Link
            key={it.id}
            to="/products"
            style={{
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div
              style={{
                width: '100%',
                aspectRatio: '1 / 1',
                backgroundColor: '#f5f5f5',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                marginBottom: '8px',
              }}
            >
              <img
                src={it.img}
                alt={it.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            <p
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                margin: '0 0 4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {it.name}
            </p>
            <p
              style={{
                fontSize: '13px',
                color: SHOPEE_ORANGE,
                fontWeight: 700,
                margin: 0,
              }}
            >
              {it.price.toLocaleString('vi-VN')}₫
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default CartPage;
