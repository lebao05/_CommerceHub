import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Clock } from 'lucide-react';
import { FEATURED_NEWS, SECONDARY_NEWS, type NewsArticle } from '../data/news';

function CategoryChip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: 'var(--color-accent-warm)',
        color: '#ffffff',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  );
}

function MetaLine({ article, color }: { article: NewsArticle; color: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '13px',
        color,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
        <CalendarDays size={14} />
        {article.displayDate}
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
        <Clock size={14} />
        {article.readTime} phút đọc
      </span>
    </span>
  );
}

function FeaturedCard({ article }: { article: NewsArticle }) {
  return (
    <Link
      to={article.href}
      style={{
        flex: '2 1 420px',
        position: 'relative',
        minHeight: '360px',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        display: 'block',
        textDecoration: 'none',
        backgroundColor: 'var(--color-primary)',
      }}
    >
      <img
        src={article.image}
        alt={article.title}
        loading="lazy"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          transition: 'transform 400ms ease',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.85) 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 'var(--spacing-sm)',
          padding: 'var(--spacing-lg)',
          color: '#ffffff',
        }}
      >
        <CategoryChip label={article.category} />
        <h3
          style={{
            margin: 0,
            fontSize: 'clamp(20px, 2.2vw, 28px)',
            fontWeight: 700,
            lineHeight: 1.25,
            color: '#ffffff',
          }}
        >
          {article.title}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            lineHeight: 1.5,
            color: 'rgba(255,255,255,0.85)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {article.excerpt}
        </p>
        <MetaLine article={article} color="rgba(255,255,255,0.75)" />
      </div>
    </Link>
  );
}

function CompactCard({ article }: { article: NewsArticle }) {
  return (
    <Link
      to={article.href}
      style={{
        display: 'flex',
        gap: 'var(--spacing-md)',
        alignItems: 'stretch',
        padding: 'var(--spacing-md)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--color-background)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        e.currentTarget.style.borderColor = 'var(--color-accent-cool)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--color-border)';
      }}
    >
      <img
        src={article.image}
        alt={article.title}
        loading="lazy"
        style={{
          width: '104px',
          height: '104px',
          flexShrink: 0,
          borderRadius: 'var(--radius-md)',
          objectFit: 'cover',
          backgroundColor: 'var(--color-border)',
        }}
      />
      <span style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--color-accent-warm)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {article.category}
        </span>
        <span
          style={{
            fontSize: '15px',
            fontWeight: 600,
            lineHeight: 1.35,
            color: 'var(--color-text-primary)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {article.title}
        </span>
        <MetaLine article={article} color="var(--color-text-secondary)" />
      </span>
    </Link>
  );
}

function NewsSection() {
  return (
    <section
      aria-label="Tin tức"
      style={{
        padding: 'var(--spacing-3xl) var(--spacing-md)',
        backgroundColor: 'white',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-xl)',
            gap: 'var(--spacing-md)',
          }}
        >
          <h2 style={{ fontSize: '32px', fontWeight: 600, margin: 0 }}>Tin tức</h2>
          <Link
            to="/news"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-accent-cool)',
              textDecoration: 'none',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Xem tất cả tin tức
            <ArrowRight size={18} />
          </Link>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--spacing-lg)',
            alignItems: 'stretch',
          }}
        >
          {FEATURED_NEWS && <FeaturedCard article={FEATURED_NEWS} />}
          <div
            style={{
              flex: '1 1 300px',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-md)',
              minWidth: 0,
            }}
          >
            {SECONDARY_NEWS.slice(0, 2).map(article => (
              <CompactCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default NewsSection;
