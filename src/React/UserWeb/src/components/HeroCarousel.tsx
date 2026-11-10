import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import type { HeroSlide } from '../data/homeSlides';

interface HeroCarouselProps {
  slides: HeroSlide[];
  /** Auto-rotate interval in ms (default 5000) */
  autoPlayInterval?: number;
}

function HeroCarousel({ slides, autoPlayInterval = 5000 }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  const goTo = useCallback(
    (idx: number) => {
      setCurrent((idx + slides.length) % slides.length);
    },
    [slides.length]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-advance
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    timerRef.current = window.setTimeout(() => {
      setCurrent(prevIdx => (prevIdx + 1) % slides.length);
    }, autoPlayInterval);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [current, isPaused, slides.length, autoPlayInterval]);

  // Preload all images so the crossfade never shows a blank slide
  useEffect(() => {
    slides.forEach(s => {
      const img = new Image();
      img.src = s.image;
    });
  }, [slides]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goTo(current - 1);
      if (e.key === 'ArrowRight') goTo(current + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, goTo]);

  if (slides.length === 0) return null;

  const activeSlide = slides[current];
  const textAlign = activeSlide.align ?? 'center';

  return (
    <section
      aria-label="Featured promotions"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 7',
        minHeight: '420px',
        maxHeight: '720px',
        overflow: 'hidden',
        backgroundColor: '#000',
      }}
    >
      {slides.map((slide, idx) => {
        const isActive = idx === current;
        const slideAlign =
          slide.align === 'left'
            ? 'flex-start'
            : slide.align === 'right'
            ? 'flex-end'
            : 'center';
        const slideVertical =
          slide.vertical === 'top'
            ? 'flex-start'
            : slide.vertical === 'center'
            ? 'center'
            : 'flex-end';
        return (
          <div
            key={slide.id}
            aria-hidden={!isActive}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: isActive ? 1 : 0,
              transition: 'opacity 800ms ease-in-out',
              pointerEvents: isActive ? 'auto' : 'none',
            }}
          >
            <img
              src={slide.image}
              alt={slide.title}
              loading={idx === 0 ? 'eager' : 'lazy'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  slide.overlay ??
                  'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 100%)',
                display: 'flex',
                alignItems: slideVertical,
                justifyContent: slideAlign,
                padding: '60px 80px',
                color: slide.textColor ?? '#ffffff',
              }}
            >
              <div
                style={{
                  textAlign: textAlign as 'left' | 'center' | 'right',
                  maxWidth: '640px',
                }}
              >
                {slide.eyebrow && (
                  <p
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      margin: '0 0 12px',
                    }}
                  >
                    {slide.eyebrow}
                  </p>
                )}
                <h2
                  style={{
                    fontSize: 'clamp(28px, 4.5vw, 60px)',
                    fontWeight: 800,
                    lineHeight: 1,
                    margin: '0 0 16px',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {slide.title}
                </h2>
                {slide.subtitle && (
                  <p
                    style={{
                      fontSize: 'clamp(14px, 1.4vw, 18px)',
                      margin: '0 0 28px',
                      opacity: 0.95,
                      lineHeight: 1.4,
                    }}
                  >
                    {slide.subtitle}
                  </p>
                )}
                <Link
                  to={slide.ctaHref}
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#ffffff',
                    color: '#111111',
                    padding: '14px 36px',
                    borderRadius: '9999px',
                    fontSize: '15px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'transform 150ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {slide.ctaLabel}
                </Link>
              </div>
            </div>
          </div>
        );
      })}

      {/* Controls — bottom right */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 2,
        }}
      >
        <button
          onClick={() => setIsPaused(p => !p)}
          aria-label={isPaused ? 'Play' : 'Pause'}
          style={controlButtonStyle}
        >
          {isPaused ? <Play size={16} fill="#111" /> : <Pause size={16} fill="#111" />}
        </button>
        <button onClick={prev} aria-label="Previous slide" style={controlButtonStyle}>
          <ChevronLeft size={18} />
        </button>
        <button onClick={next} aria-label="Next slide" style={controlButtonStyle}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Dots — bottom center */}
      <div
        style={{
          position: 'absolute',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 2,
        }}
        role="tablist"
        aria-label="Slide navigation"
      >
        {slides.map((_, idx) => {
          const isActive = idx === current;
          return (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              role="tab"
              aria-selected={isActive}
              aria-label={`Go to slide ${idx + 1}`}
              style={{
                width: isActive ? '32px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: isActive ? '#111111' : 'rgba(255,255,255,0.65)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'width 300ms ease, background-color 200ms',
              }}
            />
          );
        })}
      </div>
    </section>
  );
}

const controlButtonStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255,255,255,0.9)',
  color: '#111',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  transition: 'background-color 200ms',
};

export default HeroCarousel;
