import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  X,
  MessageCircle,
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { formatVND } from '../utils/helpers';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_COLOURS,
  FILTER_GROUPS,
  SAMPLE_PRODUCTS,
  SORT_OPTIONS,
} from '../data/productList';

function ProductListPage() {
  const [openFilter, setOpenFilter] = useState<string | null>('gender');
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(true);
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedColours, setSelectedColours] = useState<string[]>(['Brown']);

  const totalCount = 259;
  const currentSort = SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? 'Featured';

  const sortedProducts = useMemo(() => {
    const list = [...SAMPLE_PRODUCTS];
    if (sortBy === 'price-high') list.sort((a, b) => b.price - a.price);
    if (sortBy === 'price-low') list.sort((a, b) => a.price - b.price);
    return list;
  }, [sortBy]);

  const toggleFilter = (id: string) => {
    setOpenFilter(prev => (prev === id ? null : id));
  };

  const toggleColour = (name: string) => {
    setSelectedColours(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  return (
    <MainLayout>
      {/* Promo bar */}
      <div style={{
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #e5e5e5',
        textAlign: 'center',
        padding: '10px 16px',
        fontSize: '13px',
        color: '#111',
      }}>
        Free Standard Delivery &amp; 30-Day Free Returns.{' '}
        <a href="#" style={{ color: '#111', textDecoration: 'underline', fontWeight: 600 }}>
          Join Now
        </a>{' '}
        <a href="#" style={{ color: '#111', textDecoration: 'underline', fontWeight: 600 }}>
          View Details
        </a>
      </div>

      {/* Page header bar */}
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '20px 24px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#111',
          margin: 0,
        }}>
          Men&apos;s Brown ({totalCount})
        </h1>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
        }}>
          <button
            onClick={() => setShowFilters(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: '#111',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <SlidersHorizontal size={16} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setSortOpen(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                color: '#111',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Sort By: <span style={{ fontWeight: 700 }}>{currentSort}</span>
              <ChevronDown size={16} />
            </button>

            {sortOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: '#fff',
                  border: '1px solid #e5e5e5',
                  borderRadius: '4px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  minWidth: '220px',
                  zIndex: 20,
                }}
              >
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setSortOpen(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 16px',
                      background: sortBy === opt.value ? '#f5f5f5' : 'transparent',
                      border: 'none',
                      fontSize: '14px',
                      color: '#111',
                      cursor: 'pointer',
                      fontWeight: sortBy === opt.value ? 600 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body: sidebar + grid */}
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0 24px 48px',
        display: 'grid',
        gridTemplateColumns: showFilters ? '240px 1fr' : '1fr',
        gap: '32px',
        alignItems: 'start',
      }}>
        {/* Filter sidebar */}
        {showFilters && (
          <aside style={{ position: 'sticky', top: '120px' }}>
            {/* Category list */}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {PRODUCT_CATEGORIES.map(cat => (
                <li key={cat.id} style={{ marginBottom: '6px' }}>
                  <a
                    href="#"
                    style={{
                      display: 'block',
                      color: cat.isActive ? '#111' : '#111',
                      textDecoration: 'none',
                      fontSize: '15px',
                      fontWeight: cat.isActive ? 700 : 400,
                      padding: '6px 0',
                    }}
                  >
                    {cat.name}
                  </a>
                </li>
              ))}
            </ul>

            <div style={{ height: '1px', background: '#e5e5e5', margin: '16px 0' }} />

            {/* Filter accordions */}
            {FILTER_GROUPS.map(group => {
              const isOpen = openFilter === group.id;
              return (
                <div key={group.id} style={{ borderBottom: '1px solid #e5e5e5' }}>
                  <button
                    onClick={() => toggleFilter(group.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'none',
                      border: 'none',
                      padding: '14px 0',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#111',
                      cursor: 'pointer',
                    }}
                  >
                    <span>
                      {group.name} {group.count > 0 && `(${group.count})`}
                    </span>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {isOpen && (
                    <div style={{ padding: '4px 0 16px' }}>
                      {group.id === 'colour' ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {PRODUCT_COLOURS.map(colour => {
                            const selected = selectedColours.includes(colour.name);
                            return (
                              <button
                                key={colour.name}
                                onClick={() => toggleColour(colour.name)}
                                title={colour.name}
                                aria-label={colour.name}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  backgroundColor: colour.hex,
                                  border: selected ? '2px solid #111' : '1px solid #ccc',
                                  outline: selected ? '2px solid #fff' : 'none',
                                  boxShadow: selected ? '0 0 0 1px #111' : 'none',
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {group.options.map(opt => (
                            <li
                              key={opt.label}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '6px 0',
                                fontSize: '14px',
                                color: '#111',
                              }}
                            >
                              <input
                                type="checkbox"
                                defaultChecked={opt.checked ?? false}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                              <span>
                                {opt.label}
                                {opt.count !== undefined && (
                                  <span style={{ color: '#707072', marginLeft: '4px' }}>({opt.count})</span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </aside>
        )}

        {/* Product grid */}
        <section>
          {/* Selected filter chips */}
          {selectedColours.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}>
              {selectedColours.map(c => (
                <button
                  key={c}
                  onClick={() => toggleColour(c)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    border: '1px solid #ccc',
                    borderRadius: '9999px',
                    background: '#fff',
                    color: '#111',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  {c}
                  <X size={14} />
                </button>
              ))}
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}>
            {sortedProducts.map(product => (
              <Link
                key={product.id}
                to={`/products/${product.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  aspectRatio: '1 / 1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                }}>
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>
                <div style={{ padding: '0 4px' }}>
                  <h3 style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#111',
                    margin: '0 0 4px',
                  }}>
                    {product.name}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#707072',
                    margin: '0 0 4px',
                  }}>
                    {product.category}
                  </p>
                  <p style={{
                    fontSize: '15px',
                    color: '#111',
                    fontWeight: 500,
                    margin: 0,
                  }}>
                    {formatVND(product.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Chat widget */}
      <button
        aria-label="Chat with us"
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#111',
          color: '#fff',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          zIndex: 40,
        }}
      >
        <MessageCircle size={24} />
      </button>
    </MainLayout>
  );
}

export default ProductListPage;
