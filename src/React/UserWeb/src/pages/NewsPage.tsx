import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ChevronDown, Clock } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { NEWS_ARTICLES } from '../data/news';

function NewsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <MainLayout>
      <section
        style={{
          padding: 'var(--spacing-3xl) var(--spacing-md)',
          backgroundColor: 'var(--color-background)',
          minHeight: '60vh',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            <ArrowLeft size={16} />
            Về trang chủ
          </Link>

          <h1 style={{ fontSize: '36px', fontWeight: 700, margin: '0 0 var(--spacing-sm)' }}>
            Tin tức
          </h1>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '16px',
              margin: '0 0 var(--spacing-xl)',
            }}
          >
            Cập nhật sản phẩm mới, hướng dẫn chọn giày và các chương trình khuyến mãi tại CommerceHub.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {NEWS_ARTICLES.map(article => {
              const isExpanded = expandedId === article.id;

              return (
                <article
                  key={article.id}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 'var(--spacing-lg)',
                      padding: 'var(--spacing-md)',
                    }}
                  >
                    <img
                      src={article.image}
                      alt={article.title}
                      loading="lazy"
                      style={{
                        width: '240px',
                        height: '160px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-border)',
                        flexShrink: 0,
                      }}
                    />

                    <div style={{ flex: '1 1 320px', minWidth: 0 }}>
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
                      <h2
                        style={{
                          fontSize: '20px',
                          fontWeight: 600,
                          margin: '6px 0 var(--spacing-sm)',
                          lineHeight: 1.35,
                        }}
                      >
                        {article.title}
                      </h2>
                      <p
                        style={{
                          color: 'var(--color-text-secondary)',
                          fontSize: '14px',
                          lineHeight: 1.6,
                          margin: '0 0 var(--spacing-sm)',
                        }}
                      >
                        {article.excerpt}
                      </p>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: '13px',
                          color: 'var(--color-text-secondary)',
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
                    </div>
                  </div>

                  {isExpanded && (
                    <div
                      style={{
                        padding: '0 var(--spacing-md) var(--spacing-md)',
                        borderTop: '1px solid var(--color-border)',
                        paddingTop: 'var(--spacing-md)',
                      }}
                    >
                      {article.body.map((paragraph, index) => (
                        <p
                          key={index}
                          style={{
                            color: 'var(--color-text-secondary)',
                            fontSize: '15px',
                            lineHeight: 1.7,
                            margin: '0 0 var(--spacing-md)',
                          }}
                        >
                          {paragraph}
                        </p>
                      ))}
                      <Link
                        to={article.href}
                        style={{
                          display: 'inline-block',
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          textDecoration: 'none',
                          padding: '10px 22px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '14px',
                          fontWeight: 600,
                        }}
                      >
                        Mua ngay
                      </Link>
                    </div>
                  )}

                  <div
                    style={{
                      borderTop: '1px solid var(--color-border)',
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      display: 'flex',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : article.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-accent-cool)',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '6px 0',
                      }}
                    >
                      {isExpanded ? 'Thu gọn' : 'Đọc tiếp'}
                      <ChevronDown
                        size={16}
                        style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'none',
                          transition: 'transform 200ms ease',
                        }}
                      />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

export default NewsPage;
