import {
  Shield,
  RefreshCw,
  Truck,
  Star,
  Zap,
  CreditCard,
  CheckCircle,
} from 'lucide-react';
import type { ProductFeature } from '../data/productDetail';
import { useTranslation } from '../i18n/context';

const ICON_MAP: Record<ProductFeature['icon'], React.FC<{ size?: number; style?: React.CSSProperties }>> = {
  shield: ({ size = 20, style }) => <Shield size={size} style={style} />,
  refresh: ({ size = 20, style }) => <RefreshCw size={size} style={style} />,
  truck: ({ size = 20, style }) => <Truck size={size} style={style} />,
  star: ({ size = 20, style }) => <Star size={size} style={style} />,
  check: ({ size = 20, style }) => <CheckCircle size={size} style={style} />,
};

interface TrustBadgesProps {
  badges: ProductFeature[];
}

export function TrustBadges({ badges }: TrustBadgesProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {badges.map((badge, i) => {
        const Icon = ICON_MAP[badge.icon];
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 14px',
              backgroundColor: 'var(--color-background)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={20} />
            </div>
            <div>
              <p style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 2px',
              }}>
                {badge.title}
              </p>
              <p style={{
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
                margin: 0,
                lineHeight: 1.4,
              }}>
                {badge.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PromoBanner() {
  const { t } = useTranslation();

  return (
    <div
      style={{
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        color: '#fff',
        position: 'relative',
      }}
    >
      {/* Lightning accent */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '100px',
        height: '100px',
        backgroundColor: 'var(--color-accent-warm)',
        borderRadius: '50%',
        opacity: 0.15,
      }} />

      <div style={{ padding: '20px 20px 24px', position: 'relative' }}>
        {/* Badge pill */}
        <span style={{
          display: 'inline-block',
          backgroundColor: 'var(--color-accent-warm)',
          color: '#fff',
          fontSize: '10px',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          padding: '4px 10px',
          borderRadius: '9999px',
          marginBottom: '10px',
        }}>
          {t('promoBlackFriday')}
        </span>

        <h3 style={{
          fontSize: '22px',
          fontWeight: 800,
          margin: '0 0 8px',
          lineHeight: 1.1,
          textTransform: 'uppercase',
        }}>
          {t('promoUpTo')} 40% {t('promoOff')}
        </h3>
        <p style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.75)',
          margin: '0 0 16px',
          lineHeight: 1.4,
        }}>
          {t('promoDesc')}
        </p>

        <button
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            backgroundColor: 'var(--color-accent-warm)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {t('promoShopNow')}
        </button>
      </div>
    </div>
  );
}

function ShippingInfo() {
  const { t } = useTranslation();

  const items = [
    { icon: <Truck size={15} />, label: t('shippingStandard') },
    { icon: <Zap size={15} />, label: t('shippingExpress') },
    { icon: <CreditCard size={15} />, label: t('shippingPayment') },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
          }}
        >
          <span style={{ color: 'var(--color-success)', flexShrink: 0 }}>{item.icon}</span>
          {item.label}
        </div>
      ))}
    </div>
  );
}

interface TrustSidebarProps {
  badges: ProductFeature[];
}

export default function TrustSidebar({ badges }: TrustSidebarProps) {
  return (
    <aside
      aria-label="Product sidebar"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'sticky',
        top: '80px',
      }}
    >
      <TrustBadges badges={badges} />
      <PromoBanner />
      <ShippingInfo />
    </aside>
  );
}
