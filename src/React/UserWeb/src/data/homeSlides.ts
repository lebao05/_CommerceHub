export interface HeroSlide {
  id: string;
  image: string;
  /** Optional small label above the title (e.g. "JUST IN") */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref: string;
  /** Horizontal alignment of the text block */
  align?: 'left' | 'center' | 'right';
  /** Vertical alignment of the text block */
  vertical?: 'top' | 'center' | 'bottom';
  /** Text color for the overlay */
  textColor?: string;
  /** Optional dark gradient overlay (defaults to bottom-fade) */
  overlay?: string;
}

export const HOME_SLIDES: HeroSlide[] = [
  {
    id: 'caitlin-1',
    image: 'https://images.unsplash.com/photo-1546514714-bfc9c43a3f8a?w=1920&q=80',
    title: "Caitlin 1 'Midnight Fever'",
    subtitle: "It's no slip, all go in the Caitlin 1.",
    ctaLabel: 'Shop Now',
    ctaHref: '/products',
    align: 'center',
    vertical: 'bottom',
    textColor: '#ffffff',
  },
  {
    id: 'air-max-pulse',
    image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1920&q=80',
    eyebrow: 'Just In',
    title: 'Air Max Pulse',
    subtitle: 'Bring the noise. A new Air Max tuned to the rhythm of the city.',
    ctaLabel: 'Shop Air Max',
    ctaHref: '/products',
    align: 'left',
    vertical: 'center',
    textColor: '#ffffff',
  },
  {
    id: 'run-club',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&q=80',
    title: 'Run the City',
    subtitle: 'Pegasus 41 — soft, springy, and built for the long haul.',
    ctaLabel: 'Shop Running',
    ctaHref: '/products',
    align: 'right',
    vertical: 'bottom',
    textColor: '#ffffff',
  },
  {
    id: 'end-of-season',
    image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1920&q=80',
    eyebrow: 'Members Only',
    title: 'End of Season Sale',
    subtitle: 'Up to 40% off select styles. Free shipping on every order.',
    ctaLabel: 'Shop Sale',
    ctaHref: '/products',
    align: 'center',
    vertical: 'center',
    textColor: '#ffffff',
  },
];
