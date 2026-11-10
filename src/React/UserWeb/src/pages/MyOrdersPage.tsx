import { useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, SlidersHorizontal, ChevronRight, MessageCircle, Store,
  Wallet, Truck, PackageCheck, Sparkles, X, CheckCircle2, Clock,
  ShoppingBag, Receipt, Coins, ArrowUpRight, Filter, Star,
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useTranslation } from '../i18n/context';
import type { en } from '../i18n/en';

type Translator = (key: keyof typeof en) => string;

type OrderStatus = 'to_pay' | 'to_ship' | 'to_receive' | 'completed' | 'cancelled';

interface OrderItem {
  id: string;
  name: string;
  variant: string;
  image: string;
  qty: number;
  price: number;
}

interface OrderTimelineStep {
  key: 'placed' | 'paid' | 'shipped' | 'delivered';
  label: string;
  done: boolean;
  active: boolean;
}

interface Order {
  id: string;
  shop: { name: string; isMall: boolean; avatar: string };
  status: OrderStatus;
  placedAt: string; // ISO
  eta?: string; // ISO
  trackingCode?: string;
  items: OrderItem[];
  shipping: number;
  coinsEarned: number;
  timeline: OrderTimelineStep[];
}

const formatVND = (n: number) => `₫${n.toLocaleString('vi-VN')}`;

const ORDERS: Order[] = [
  {
    id: 'CH-20261012-7841',
    shop: {
      name: 'Nike Official',
      isMall: true,
      avatar: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&q=70',
    },
    status: 'to_pay',
    placedAt: '2026-10-12T08:24:00Z',
    eta: '2026-10-15',
    items: [
      {
        id: 'i1',
        name: 'Nike Air Max 90',
        variant: 'White / UK 9',
        image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=200&q=80',
        qty: 1,
        price: 3529000,
      },
      {
        id: 'i2',
        name: 'Nike Pegasus 41',
        variant: 'Black / UK 8.5',
        image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=200&q=80',
        qty: 1,
        price: 3529000,
      },
    ],
    shipping: 0,
    coinsEarned: 70,
    timeline: [
      { key: 'placed', label: 'Placed', done: true, active: false },
      { key: 'paid', label: 'Paid', done: false, active: true },
      { key: 'shipped', label: 'Shipped', done: false, active: false },
      { key: 'delivered', label: 'Delivered', done: false, active: false },
    ],
  },
  {
    id: 'CH-20261011-3320',
    shop: {
      name: 'Puma Sport Store',
      isMall: false,
      avatar: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=120&q=70',
    },
    status: 'to_ship',
    placedAt: '2026-10-11T14:02:00Z',
    eta: '2026-10-15',
    items: [
      {
        id: 'i3',
        name: 'Puma Suede Classic XXI',
        variant: 'Navy / UK 8',
        image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=200&q=80',
        qty: 2,
        price: 1890000,
      },
    ],
    shipping: 30000,
    coinsEarned: 38,
    timeline: [
      { key: 'placed', label: 'Placed', done: true, active: false },
      { key: 'paid', label: 'Paid', done: true, active: false },
      { key: 'shipped', label: 'Shipped', done: false, active: true },
      { key: 'delivered', label: 'Delivered', done: false, active: false },
    ],
  },
  {
    id: 'CH-20261009-5512',
    shop: {
      name: 'Adidas Official',
      isMall: true,
      avatar: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=120&q=70',
    },
    status: 'to_receive',
    placedAt: '2026-10-09T19:45:00Z',
    eta: '2026-10-13',
    trackingCode: 'SPXVN-87234612',
    items: [
      {
        id: 'i4',
        name: 'Adidas Ultraboost 23',
        variant: 'Core Black / UK 9',
        image: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=200&q=80',
        qty: 1,
        price: 5200000,
      },
    ],
    shipping: 0,
    coinsEarned: 104,
    timeline: [
      { key: 'placed', label: 'Placed', done: true, active: false },
      { key: 'paid', label: 'Paid', done: true, active: false },
      { key: 'shipped', label: 'Shipped', done: true, active: true },
      { key: 'delivered', label: 'Delivered', done: false, active: false },
    ],
  },
  {
    id: 'CH-20261002-9981',
    shop: {
      name: 'Converse Vietnam',
      isMall: false,
      avatar: 'https://images.unsplash.com/photo-1605408499391-6368c628ef42?w=120&q=70',
    },
    status: 'completed',
    placedAt: '2026-10-02T10:11:00Z',
    eta: '2026-10-06',
    items: [
      {
        id: 'i5',
        name: 'Converse Chuck Taylor All Star',
        variant: 'Optical White / UK 8',
        image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=200&q=80',
        qty: 1,
        price: 1290000,
      },
      {
        id: 'i6',
        name: 'Converse Chuck Taylor All Star',
        variant: 'Black / UK 7',
        image: 'https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=200&q=80',
        qty: 1,
        price: 1290000,
      },
    ],
    shipping: 0,
    coinsEarned: 25,
    timeline: [
      { key: 'placed', label: 'Placed', done: true, active: false },
      { key: 'paid', label: 'Paid', done: true, active: false },
      { key: 'shipped', label: 'Shipped', done: true, active: false },
      { key: 'delivered', label: 'Delivered', done: true, active: true },
    ],
  },
  {
    id: 'CH-20260928-1402',
    shop: {
      name: 'New Balance VN',
      isMall: false,
      avatar: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=120&q=70',
    },
    status: 'cancelled',
    placedAt: '2026-09-28T07:30:00Z',
    items: [
      {
        id: 'i7',
        name: 'New Balance 574 Core',
        variant: 'Grey / UK 9',
        image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=200&q=80',
        qty: 1,
        price: 2390000,
      },
    ],
    shipping: 0,
    coinsEarned: 0,
    timeline: [
      { key: 'placed', label: 'Placed', done: true, active: false },
      { key: 'paid', label: 'Paid', done: false, active: false },
      { key: 'shipped', label: 'Shipped', done: false, active: false },
      { key: 'delivered', label: 'Delivered', done: false, active: false },
    ],
  },
];

// ── Visual metadata for each status ────────────────────────────────
const STATUS_META: Record<OrderStatus, {
  label: string;
  pill: { bg: string; fg: string; border: string };
  accent: string; // accent color used for stats / icon
  statIcon: typeof Wallet;
  statGradient: string;
}> = {
  to_pay: {
    label: 'To Pay',
    pill: { bg: 'rgba(249,115,22,0.10)', fg: '#EA580C', border: 'rgba(249,115,22,0.30)' },
    accent: '#F97316',
    statIcon: Wallet,
    statGradient: 'linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%)',
  },
  to_ship: {
    label: 'To Ship',
    pill: { bg: 'rgba(56,189,248,0.10)', fg: '#0369A1', border: 'rgba(56,189,248,0.30)' },
    accent: '#0EA5E9',
    statIcon: Truck,
    statGradient: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
  },
  to_receive: {
    label: 'To Receive',
    pill: { bg: 'rgba(16,185,129,0.10)', fg: '#047857', border: 'rgba(16,185,129,0.30)' },
    accent: '#10B981',
    statIcon: PackageCheck,
    statGradient: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
  },
  completed: {
    label: 'Completed',
    pill: { bg: 'rgba(139,92,246,0.10)', fg: '#6D28D9', border: 'rgba(139,92,246,0.30)' },
    accent: '#8B5CF6',
    statIcon: CheckCircle2,
    statGradient: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
  },
  cancelled: {
    label: 'Cancelled',
    pill: { bg: 'rgba(100,116,139,0.10)', fg: '#475569', border: 'rgba(100,116,139,0.30)' },
    accent: '#64748B',
    statIcon: X,
    statGradient: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
  },
};

const TAB_ORDER: Array<{ key: 'all' | OrderStatus; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'to_pay', label: 'To Pay' },
  { key: 'to_ship', label: 'To Ship' },
  { key: 'to_receive', label: 'To Receive' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

function MyOrdersPage() {
  const { t } = useTranslation();
  const tt = t as Translator;
  const [tab, setTab] = useState<'all' | OrderStatus>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'high' | 'low'>('newest');

  // ── Derived data ──────────────────────────────────────────────────
  const counts = useMemo(() => {
    const c: Record<OrderStatus, number> = {
      to_pay: 0, to_ship: 0, to_receive: 0, completed: 0, cancelled: 0,
    };
    for (const o of ORDERS) c[o.status]++;
    return c;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = ORDERS.filter(o => {
      const inTab = tab === 'all' || o.status === tab;
      const inQuery = !q
        || o.id.toLowerCase().includes(q)
        || o.shop.name.toLowerCase().includes(q)
        || o.items.some(i => i.name.toLowerCase().includes(q));
      return inTab && inQuery;
    });
    list = [...list].sort((a, b) => {
      const av = a.items.reduce((s, i) => s + i.price * i.qty, 0) + a.shipping;
      const bv = b.items.reduce((s, i) => s + i.price * i.qty, 0) + b.shipping;
      switch (sort) {
        case 'oldest': return a.placedAt.localeCompare(b.placedAt);
        case 'high': return bv - av;
        case 'low': return av - bv;
        case 'newest':
        default: return b.placedAt.localeCompare(a.placedAt);
      }
    });
    return list;
  }, [tab, query, sort]);

  const totalCoins = ORDERS.reduce((s, o) => s + o.coinsEarned, 0);

  return (
    <MainLayout>
      <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100%' }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: 'var(--spacing-xl) var(--spacing-md) var(--spacing-3xl)',
        }}>
          {/* ── Page header ────────────────────────────────────────── */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-xl)',
          }}>
            <div>
              <p style={{
                color: 'var(--color-text-secondary)',
                fontSize: '13px',
                marginBottom: '4px',
                letterSpacing: '0.4px',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}>
                {tt('accountHello')} Alex
              </p>
              <h1 style={{
                fontSize: '32px',
                fontWeight: 700,
                margin: 0,
                letterSpacing: '-0.4px',
              }}>
                {tt('myOrders')}
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                border: '1px solid #FCD34D',
                borderRadius: 'var(--radius-full)',
                color: '#92400E',
                fontSize: '13px',
                fontWeight: 600,
              }}>
                <Coins size={16} />
                {totalCoins.toLocaleString()} {tt('ordersCoins')}
              </div>
              <Link
                to="/my-account"
                style={{
                  padding: '10px 16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--color-text-primary)',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {tt('ordersProfile')}
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          {/* ── Stats grid (gradient cards) ─────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-xl)',
          }}>
            {(['to_pay', 'to_ship', 'to_receive', 'completed'] as OrderStatus[]).map(s => {
              const meta = STATUS_META[s];
              const Icon = meta.statIcon;
              const isActive = tab === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTab(s)}
                  style={{
                    background: meta.statGradient,
                    border: isActive
                      ? `2px solid ${meta.accent}`
                      : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-lg)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    boxShadow: isActive ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isActive
                      ? 'var(--shadow-md)'
                      : 'var(--shadow-sm)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 'var(--spacing-md)',
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: meta.accent,
                      boxShadow: 'var(--shadow-sm)',
                    }}>
                      <Icon size={20} />
                    </div>
                    <ChevronRight size={18} style={{ color: meta.accent, opacity: 0.6 }} />
                  </div>
                  <div style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    color: meta.accent,
                    lineHeight: 1.1,
                  }}>
                    {counts[s]}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: 'var(--color-text-secondary)',
                    marginTop: '4px',
                    fontWeight: 500,
                  }}>
                    {meta.label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Search + sort bar ──────────────────────────────────── */}
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-sm)',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: 'var(--spacing-lg)',
          }}>
            <div style={{
              flex: 1,
              minWidth: '240px',
              position: 'relative',
            }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-secondary)',
                }}
              />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={tt('ordersSearchPlaceholder')}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <SortMenu sort={sort} setSort={setSort} t={tt} />
            <button
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '12px 16px',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 500,
              }}
            >
              <Filter size={16} />
              {tt('ordersFilters')}
            </button>
          </div>

          {/* ── Tab navigation (segmented) ─────────────────────────── */}
          <div style={{
            display: 'flex',
            gap: '4px',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: 'var(--spacing-xl)',
            overflowX: 'auto',
          }}>
            {TAB_ORDER.map(({ key, label }) => {
              const isActive = tab === key;
              const count = key === 'all' ? ORDERS.length : counts[key as OrderStatus];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  style={{
                    position: 'relative',
                    padding: '12px 20px',
                    background: 'none',
                    border: 'none',
                    color: isActive
                      ? 'var(--color-text-primary)'
                      : 'var(--color-text-secondary)',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                  <span style={{
                    backgroundColor: isActive
                      ? 'var(--color-accent-warm)'
                      : 'var(--color-border)',
                    color: isActive ? '#fff' : 'var(--color-text-secondary)',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 8px',
                    borderRadius: 'var(--radius-full)',
                    minWidth: '22px',
                    textAlign: 'center',
                  }}>
                    {count}
                  </span>
                  {isActive && (
                    <span style={{
                      position: 'absolute',
                      left: '12px',
                      right: '12px',
                      bottom: '-1px',
                      height: '2px',
                      background: 'var(--color-accent-warm)',
                      borderRadius: '2px 2px 0 0',
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Order cards ────────────────────────────────────────── */}
          {filtered.length === 0 ? (
            <EmptyOrders t={tt} />
          ) : (
            <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
              {filtered.map(o => (
                <OrderCard key={o.id} order={o} t={tt} />
              ))}
            </div>
          )}

          {/* ── Footer summary + load more ─────────────────────────── */}
          {filtered.length > 0 && (
            <div style={{
              textAlign: 'center',
              marginTop: 'var(--spacing-2xl)',
              color: 'var(--color-text-secondary)',
              fontSize: '13px',
            }}>
              {tt('ordersShowing')
                .replace('{count}', String(filtered.length))
                .replace('{total}', String(ORDERS.length))}
              <button
                type="button"
                style={{
                  marginLeft: 'var(--spacing-md)',
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 18px',
                  cursor: 'pointer',
                  color: 'var(--color-text-primary)',
                  fontSize: '13px',
                  fontWeight: 500,
                  fontFamily: 'inherit',
                }}
              >
                {tt('ordersLoadMore')}
              </button>
            </div>
          )}
        </div>

        <style>{`
          @media (max-width: 900px) {
            .orders-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .orders-card-grid { grid-template-columns: 1fr !important; }
          }
          @media (max-width: 540px) {
            .orders-stats-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </MainLayout>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Subcomponents
// ──────────────────────────────────────────────────────────────────────

function OrderCard({ order, t }: { order: Order; t: Translator }) {
  const meta = STATUS_META[order.status];
  const itemsTotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
  const grandTotal = itemsTotal + order.shipping;
  const Pill = (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      borderRadius: 'var(--radius-full)',
      background: meta.pill.bg,
      color: meta.pill.fg,
      border: `1px solid ${meta.pill.border}`,
      fontSize: '12px',
      fontWeight: 700,
      letterSpacing: '0.3px',
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: meta.pill.fg,
        boxShadow: `0 0 0 3px ${meta.pill.bg}`,
      }} />
      {meta.label}
    </span>
  );

  return (
    <article style={{
      background: 'var(--color-background)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      transition: 'box-shadow 0.15s, transform 0.15s',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      {/* Card header: shop + status + timeline */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-md)',
        padding: 'var(--spacing-md) var(--spacing-lg)',
        background: 'linear-gradient(90deg, rgba(15,23,42,0.02) 0%, transparent 100%)',
        borderBottom: '1px dashed var(--color-border)',
        flexWrap: 'wrap',
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-border)',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          <img
            src={order.shop.avatar}
            alt={order.shop.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>{order.shop.name}</span>
          {order.shop.isMall && (
            <span style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
            }}>
              Mall
            </span>
          )}
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
            · {formatDate(order.placedAt)}
          </span>
          {Pill}
        </div>
        <div style={{ flex: 1 }} />
        <OrderTimeline steps={order.timeline} accent={meta.accent} />
      </div>

      {/* Items */}
      <div style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}>
        {order.items.map((item, idx) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              padding: 'var(--spacing-sm) 0',
              borderTop: idx === 0 ? 'none' : '1px solid var(--color-border)',
            }}
          >
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
              flexShrink: 0,
              backgroundColor: 'var(--color-border)',
            }}>
              <img
                src={item.image}
                alt={item.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {item.name}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                marginTop: '4px',
              }}>
                {item.variant} · Qty {item.qty}
              </div>
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap',
            }}>
              {formatVND(item.price * item.qty)}
            </div>
          </div>
        ))}
      </div>

      {/* Total + action footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-md)',
        padding: 'var(--spacing-md) var(--spacing-lg)',
        background: 'linear-gradient(0deg, rgba(15,23,42,0.02) 0%, transparent 100%)',
        borderTop: '1px solid var(--color-border)',
        flexWrap: 'wrap',
      }}>
        <Link
          to={`/my-orders/${order.id}`}
          style={{
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          #{order.id}
        </Link>
        {order.trackingCode && (
          <span style={{
            fontSize: '11px',
            background: 'var(--color-border)',
            color: 'var(--color-text-secondary)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'ui-monospace, monospace',
          }}>
            {order.trackingCode}
          </span>
        )}
        {order.eta && order.status !== 'completed' && order.status !== 'cancelled' && (
          <span style={{
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <Clock size={12} />
            ETA {formatDate(order.eta)}
          </span>
        )}

        <div style={{ flex: 1 }} />

        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '11px',
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            fontWeight: 600,
          }}>
            {t('ordersGrandTotal')}
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--color-accent-warm)',
            lineHeight: 1.2,
          }}>
            {formatVND(grandTotal)}
          </div>
        </div>
      </div>

      {/* Action row */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: 'var(--spacing-md) var(--spacing-lg)',
        borderTop: '1px solid var(--color-border)',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
      }}>
        <GhostButton icon={MessageCircle}>{t('ordersChatShop')}</GhostButton>
        <GhostButton icon={Store}>{t('cartViewShop')}</GhostButton>
        {order.status === 'to_pay' && (
          <>
            <GhostButton>{t('ordersCancel')}</GhostButton>
            <PrimaryButton icon={Wallet}>{t('ordersPayNow')}</PrimaryButton>
          </>
        )}
        {order.status === 'to_ship' && (
          <>
            <GhostButton>{t('ordersEditAddress')}</GhostButton>
            <GhostButton icon={Receipt}>{t('ordersReminder')}</GhostButton>
          </>
        )}
        {order.status === 'to_receive' && (
          <>
            <GhostButton icon={Truck}>{t('ordersTrack')}</GhostButton>
            <PrimaryButton icon={CheckCircle2}>{t('ordersConfirm')}</PrimaryButton>
          </>
        )}
        {order.status === 'completed' && (
          <>
            <GhostButton icon={Sparkles}>{t('ordersBuyAgain')}</GhostButton>
            <PrimaryButton icon={Star}>{t('ordersRate')}</PrimaryButton>
          </>
        )}
        {order.status === 'cancelled' && (
          <GhostButton icon={Sparkles}>{t('ordersBuyAgain')}</GhostButton>
        )}
      </div>

      {/* Rating nudge for completed orders */}
      {order.status === 'completed' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-md)',
          padding: '12px var(--spacing-lg)',
          background: 'linear-gradient(90deg, #FEF3C7 0%, #FFFBEB 100%)',
          borderTop: '1px solid #FDE68A',
          fontSize: '12px',
          color: '#92400E',
        }}>
          <Coins size={16} />
          <span>{t('ordersRateNudge')}</span>
        </div>
      )}
    </article>
  );
}

function OrderTimeline({
  steps,
  accent,
}: {
  steps: OrderTimelineStep[];
  accent: string;
}) {
  // Hide the timeline for cancelled orders
  if (steps.every(s => !s.done) && steps[0].label === 'Placed') {
    return null;
  }
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0',
      minWidth: '260px',
    }}>
      {steps.map((s, idx) => {
        const isLast = idx === steps.length - 1;
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: s.done
                  ? accent
                  : s.active
                    ? '#fff'
                    : 'var(--color-border)',
                border: s.active
                  ? `3px solid ${accent}`
                  : s.done
                    ? `2px solid ${accent}`
                    : '2px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                position: 'relative',
              }}>
                {s.done && <CheckCircle2 size={12} />}
                {s.active && (
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: accent,
                    animation: 'pulse 1.6s ease-in-out infinite',
                  }} />
                )}
              </div>
              <div style={{
                fontSize: '10px',
                color: s.done
                  ? 'var(--color-text-primary)'
                  : s.active
                    ? accent
                    : 'var(--color-text-secondary)',
                fontWeight: s.active || s.done ? 600 : 500,
                whiteSpace: 'nowrap',
              }}>
                {s.label}
              </div>
            </div>
            {!isLast && (
              <div style={{
                flex: 1,
                height: '2px',
                background: s.done ? accent : 'var(--color-border)',
                marginBottom: '16px',
                marginLeft: '4px',
                marginRight: '4px',
                borderRadius: '1px',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function GhostButton({
  children,
  icon: Icon,
  onClick,
  style,
}: {
  children: React.ReactNode;
  icon?: typeof MessageCircle;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        background: 'var(--color-background)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-text-primary)',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
        ...style,
      }}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  icon: Icon,
  onClick,
}: {
  children: React.ReactNode;
  icon?: typeof MessageCircle;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 18px',
        background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        color: '#fff',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: '0 2px 8px rgba(249,115,22,0.30)',
      }}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

function SortMenu({
  sort, setSort, t,
}: {
  sort: 'newest' | 'oldest' | 'high' | 'low';
  setSort: (s: 'newest' | 'oldest' | 'high' | 'low') => void;
  t: Translator;
}) {
  const [open, setOpen] = useState(false);
  const options: Array<{ key: typeof sort; label: string }> = [
    { key: 'newest', label: t('ordersSortNewest') },
    { key: 'oldest', label: t('ordersSortOldest') },
    { key: 'high', label: t('ordersSortHigh') },
    { key: 'low', label: t('ordersSortLow') },
  ];
  const current = options.find(o => o.key === sort)!;
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '12px 16px',
          background: 'var(--color-background)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontWeight: 500,
          whiteSpace: 'nowrap',
        }}
      >
        <SlidersHorizontal size={16} />
        {current.label}
      </button>
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 50 }}
          />
          <div style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            background: 'var(--color-background)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            minWidth: '180px',
            zIndex: 60,
            overflow: 'hidden',
          }}>
            {options.map(o => (
              <button
                key={o.key}
                type="button"
                onClick={() => { setSort(o.key); setOpen(false); }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: o.key === sort ? 'var(--color-border)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--color-text-primary)',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (o.key !== sort) e.currentTarget.style.backgroundColor = 'var(--color-border)'; }}
                onMouseLeave={e => { if (o.key !== sort) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyOrders({ t }: { t: Translator }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: 'var(--spacing-3xl) var(--spacing-md)',
      background: 'var(--color-background)',
      border: '1px dashed var(--color-border)',
      borderRadius: 'var(--radius-lg)',
    }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '88px',
        height: '88px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
        marginBottom: 'var(--spacing-md)',
      }}>
        <ShoppingBag size={40} color="#D97706" />
      </div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
        {t('ordersNoOrders')}
      </h3>
      <p style={{
        fontSize: '14px',
        color: 'var(--color-text-secondary)',
        maxWidth: '380px',
        margin: '0 auto var(--spacing-lg)',
      }}>
        {t('ordersNoOrdersDesc')}
      </p>
      <Link
        to="/products"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '12px 24px',
          background: 'var(--color-accent-warm)',
          color: '#fff',
          borderRadius: 'var(--radius-md)',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 600,
        }}
      >
        {t('ordersStartShopping')}
        <ArrowUpRight size={16} />
      </Link>
    </div>
  );
}

export default MyOrdersPage;
