import MainLayout from '../layouts/MainLayout';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, TrendingUp, Package } from 'lucide-react';
import HeroCarousel from '../components/HeroCarousel';
import { HOME_SLIDES } from '../data/homeSlides';

function HomePage() {
  return (
    <MainLayout>
      {/* Hero Banner Carousel */}
      <HeroCarousel slides={HOME_SLIDES} />

      {/* Features Section */}
      <section style={{
        padding: 'var(--spacing-3xl) var(--spacing-md)',
        backgroundColor: 'var(--color-background)',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-xl)',
          }}>
            <div style={{
              textAlign: 'center',
              padding: 'var(--spacing-lg)',
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: 'var(--color-accent-cool)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--spacing-md)',
                opacity: 0.9,
              }}>
                <Package size={32} color="white" />
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: 'var(--spacing-sm)',
              }}>
                Fast Delivery
              </h3>
              <p style={{
                color: 'var(--color-text-secondary)',
                fontSize: '14px',
              }}>
                Free shipping on orders over $50. Get your products delivered in 2-3 business days.
              </p>
            </div>

            <div style={{
              textAlign: 'center',
              padding: 'var(--spacing-lg)',
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: 'var(--color-accent-warm)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--spacing-md)',
                opacity: 0.9,
              }}>
                <Star size={32} color="white" />
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: 'var(--spacing-sm)',
              }}>
                Quality Products
              </h3>
              <p style={{
                color: 'var(--color-text-secondary)',
                fontSize: '14px',
              }}>
                Curated selection of high-quality products from trusted brands and sellers.
              </p>
            </div>

            <div style={{
              textAlign: 'center',
              padding: 'var(--spacing-lg)',
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#4FD1C5',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--spacing-md)',
                opacity: 0.9,
              }}>
                <TrendingUp size={32} color="white" />
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: 'var(--spacing-sm)',
              }}>
                Best Prices
              </h3>
              <p style={{
                color: 'var(--color-text-secondary)',
                fontSize: '14px',
              }}>
                Competitive pricing with regular deals, discounts, and special promotions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section style={{
        padding: 'var(--spacing-3xl) var(--spacing-md)',
        backgroundColor: 'white',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-xl)',
          }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 600,
            }}>
              Featured Products
            </h2>
            <Link to="/products" style={{
              color: 'var(--color-accent-cool)',
              textDecoration: 'none',
              fontWeight: 600,
            }}>
              View All →
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'var(--spacing-lg)',
          }}>
            {[1, 2, 3, 4].map((item) => (
              <div key={item} style={{
                backgroundColor: 'white',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
              }}>
                <div style={{
                  width: '100%',
                  height: '280px',
                  backgroundColor: '#E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <ShoppingBag size={48} color="#94A3B8" />
                </div>
                <div style={{
                  padding: 'var(--spacing-md)',
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    marginBottom: 'var(--spacing-xs)',
                  }}>
                    Product Name {item}
                  </h3>
                  <p style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: '14px',
                    marginBottom: 'var(--spacing-sm)',
                  }}>
                    Brief product description goes here...
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    marginBottom: 'var(--spacing-md)',
                  }}>
                    <div style={{
                      display: 'flex',
                      color: '#F59E0B',
                    }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={14} fill="#F59E0B" />
                      ))}
                    </div>
                    <span style={{
                      fontSize: '13px',
                      color: 'var(--color-text-secondary)',
                    }}>
                      (128)
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <span style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: 'var(--color-text-primary)',
                      }}>
                        $99.99
                      </span>
                      <span style={{
                        fontSize: '14px',
                        color: 'var(--color-text-secondary)',
                        textDecoration: 'line-through',
                        marginLeft: 'var(--spacing-xs)',
                      }}>
                        $129.99
                      </span>
                    </div>
                    <button style={{
                      backgroundColor: 'var(--color-accent-warm)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}>
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: 'var(--spacing-3xl) var(--spacing-md)',
        backgroundColor: '#22D3EE',
        color: 'white',
        textAlign: 'center',
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
        }}>
          <h2 style={{
            fontSize: '36px',
            fontWeight: 700,
            marginBottom: 'var(--spacing-md)',
          }}>
            Sign Up for Exclusive Deals
          </h2>
          <p style={{
            fontSize: '18px',
            marginBottom: 'var(--spacing-xl)',
            opacity: 0.95,
          }}>
            Get 10% off your first order and be the first to know about new products and special offers.
          </p>
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-md)',
            maxWidth: '500px',
            margin: '0 auto',
          }}>
            <input
              type="email"
              placeholder="Enter your email"
              style={{
                flex: 1,
                padding: '14px var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                fontSize: '16px',
              }}
            />
            <button style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              padding: '14px 32px',
              borderRadius: 'var(--radius-md)',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

export default HomePage;
