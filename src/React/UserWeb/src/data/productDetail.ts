import type { ListProduct } from './productList';

/* ---------- Types ---------- */

export interface ProductImage {
  id: string;
  /** Full-size product image */
  url: string;
  /** Smaller version used in the thumbnail strip */
  thumb: string;
  /** Optional short caption (e.g. "Top", "Side", "Detail") */
  caption?: string;
}

export interface ProductColour {
  id: string;
  name: string;
  /** CSS color value used for the swatch */
  hex: string;
  /** Image set shown when this colour is active */
  images: ProductImage[];
}

export interface ProductSize {
  /** Display label, e.g. "UK 7" or "M" */
  label: string;
  /** Whether the size is currently available */
  available: boolean;
  /** Optional "low stock" flag for messaging */
  lowStock?: boolean;
}

export interface ProductReview {
  id: string;
  author: string;
  rating: number; // 1-5
  date: string; // ISO
  title: string;
  body: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductFeature {
  icon: 'check' | 'truck' | 'shield' | 'refresh' | 'star';
  title: string;
  subtitle: string;
}

export interface ProductDetail {
  id: string;
  slug: string;
  brand: string;
  name: string;
  category: string;
  sku: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviewCount: number;
  shortDescription: string;
  longDescription: string;
  features: string[];
  colours: ProductColour[];
  sizes: ProductSize[];
  specs: ProductSpec[];
  reviews: ProductReview[];
}

/* ---------- Sample product ---------- */

const IMG = (id: string) => `https://images.unsplash.com/${id}?w=900&q=80`;
const THUMB = (id: string) => `https://images.unsplash.com/${id}?w=160&q=70`;

export const SAMPLE_PRODUCT: ProductDetail = {
  id: 'nike-air-max-90',
  slug: 'nike-air-max-90',
  brand: 'Nike',
  name: 'Nike Air Max 90',
  category: "Men's Shoes",
  sku: 'DM7866-100',
  price: 3529000,
  oldPrice: 4299000,
  rating: 4.7,
  reviewCount: 1284,
  shortDescription:
    'Lace up and feel the legacy. The Air Max 90 stays true to its OG running roots with its iconic Waffle sole, stitched overlays and classic TPU accents.',
  longDescription:
    'Nothing as fly, nothing as comfortable, nothing as proven. The Nike Air Max 90 stays true to its OG running roots with the iconic Waffle outsole, stitched overlays and classic TPU accents. The Max Air unit in the heel adds unmistakable cushioning that lasts, while the padded low-cut collar looks sleek and feels great. This edition uses recycled materials in its construction, marking another step toward a more sustainable future.',
  features: [
    'Iconic Waffle outsole for durable traction',
    'Visible Max Air unit in the heel for cushioning',
    'Foam midsole for lightweight comfort',
    'Padded, low-cut collar for a sleek look',
    'Made with at least 20% recycled material by weight',
  ],
  colours: [
    {
      id: 'white',
      name: 'White',
      hex: '#f5f5f5',
      images: [
        { id: 'img-w-1', url: IMG('photo-1600185365483-26d7a4cc7519'), thumb: THUMB('photo-1600185365483-26d7a4cc7519'), caption: 'Side' },
        { id: 'img-w-2', url: IMG('photo-1542291026-7eec264c27ff'), thumb: THUMB('photo-1542291026-7eec264c27ff'), caption: 'Top' },
        { id: 'img-w-3', url: IMG('photo-1606107557195-0e29a4b5b4aa'), thumb: THUMB('photo-1606107557195-0e29a4b5b4aa'), caption: 'Detail' },
        { id: 'img-w-4', url: IMG('photo-1595950653106-6c9ebd614d3a'), thumb: THUMB('photo-1595950653106-6c9ebd614d3a'), caption: 'Sole' },
      ],
    },
    {
      id: 'black',
      name: 'Black',
      hex: '#111111',
      images: [
        { id: 'img-k-1', url: IMG('photo-1551107696-a4b0c5a0d9a2'), thumb: THUMB('photo-1551107696-a4b0c5a0d9a2'), caption: 'Side' },
        { id: 'img-k-2', url: IMG('photo-1539185441755-769473a23570'), thumb: THUMB('photo-1539185441755-769473a23570'), caption: 'Top' },
        { id: 'img-k-3', url: IMG('photo-1543508282-6319a3e2621f'), thumb: THUMB('photo-1543508282-6319a3e2621f'), caption: 'Detail' },
        { id: 'img-k-4', url: IMG('photo-1460353581641-37baddab0fa2'), thumb: THUMB('photo-1460353581641-37baddab0fa2'), caption: 'Sole' },
      ],
    },
    {
      id: 'red',
      name: 'University Red',
      hex: '#c8102e',
      images: [
        { id: 'img-r-1', url: IMG('photo-1605408499391-6368c628ef42'), thumb: THUMB('photo-1605408499391-6368c628ef42'), caption: 'Side' },
        { id: 'img-r-2', url: IMG('photo-1608231387042-66d1773070a5'), thumb: THUMB('photo-1608231387042-66d1773070a5'), caption: 'Top' },
        { id: 'img-r-3', url: IMG('photo-1600269452121-4f2416e55c28'), thumb: THUMB('photo-1600269452121-4f2416e55c28'), caption: 'Detail' },
        { id: 'img-r-4', url: IMG('photo-1491553895911-0055eca6402d'), thumb: THUMB('photo-1491553895911-0055eca6402d'), caption: 'Sole' },
      ],
    },
  ],
  sizes: [
    { label: 'UK 6', available: true },
    { label: 'UK 6.5', available: true },
    { label: 'UK 7', available: true, lowStock: true },
    { label: 'UK 7.5', available: true },
    { label: 'UK 8', available: true },
    { label: 'UK 8.5', available: true },
    { label: 'UK 9', available: true },
    { label: 'UK 9.5', available: false },
    { label: 'UK 10', available: true },
    { label: 'UK 10.5', available: true, lowStock: true },
    { label: 'UK 11', available: true },
    { label: 'UK 12', available: false },
  ],
  specs: [
    { label: 'Colour Shown', value: 'White/Black' },
    { label: 'Style', value: 'DM7866-100' },
    { label: 'Country/Region of Origin', value: 'Vietnam' },
  ],
  reviews: [
    {
      id: 'r1',
      author: 'Minh T.',
      rating: 5,
      date: '2026-09-14',
      title: 'Comfortable and stylish',
      body: 'Fits true to size and feels great for all-day wear. The Air Max cushioning is exactly what I expected — soft but responsive.',
    },
    {
      id: 'r2',
      author: 'Sarah K.',
      rating: 4,
      date: '2026-08-02',
      title: 'Classic look',
      body: 'Iconic silhouette. Took a couple of days to break in but now they are my go-to. The white is bright and clean.',
    },
    {
      id: 'r3',
      author: 'Đức L.',
      rating: 5,
      date: '2026-07-21',
      title: 'Great quality',
      body: 'Stitching and materials feel premium. Definitely worth the price, especially on sale.',
    },
  ],
};

/* ---------- Related products (reuses ListProduct shape) ---------- */

export const RELATED_PRODUCTS: ListProduct[] = [
  { id: 'rp1', name: 'Nike 24.7', category: "Men's shoes", price: 4109000, slug: 'nike-247-mono', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80' },
  { id: 'rp2', name: 'Nike 24.7', category: "Men's shoes", price: 5889000, slug: 'nike-247-knit', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80' },
  { id: 'rp3', name: 'Nike Pegasus 41', category: "Men's shoes", price: 3529000, slug: 'nike-pegasus-41', image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80' },
  { id: 'rp4', name: 'Nike Vomero 18', category: "Men's shoes", price: 4109000, slug: 'nike-vomero-18', image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600&q=80' },
  { id: 'rp5', name: 'Nike Streakfly Plus', category: "Men's shoes", price: 4699000, slug: 'nike-streakfly-plus', image: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600&q=80' },
  { id: 'rp6', name: 'Nike Pegasus Plus', category: "Men's shoes", price: 4509000, slug: 'nike-pegasus-plus', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80' },
  { id: 'rp7', name: 'Nike Pegasus Trail 5', category: "Men's shoes", price: 3829000, slug: 'nike-pegasus-trail-5', image: 'https://images.unsplash.com/photo-1605408499391-6368c628ef42?w=600&q=80' },
  { id: 'rp8', name: 'Nike Zoom Fly 6', category: "Men's shoes", price: 4999000, slug: 'nike-zoom-fly-6', image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&q=80' },
  { id: 'rp9', name: 'Nike Invincible 4', category: "Men's shoes", price: 4699000, slug: 'nike-invincible-4', image: 'https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=600&q=80' },
  { id: 'rp10', name: 'Nike InfinityRN 5', category: "Men's shoes", price: 4509000, slug: 'nike-infinityrn-5', image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80' },
];

/* ---------- Trust badge data ---------- */

export const TRUST_BADGES: ProductFeature[] = [
  {
    icon: 'shield',
    title: '100% Authentic',
    subtitle: 'Genuine Nike product. Verified by CommerceHub.',
  },
  {
    icon: 'refresh',
    title: '7-Day Free Returns',
    subtitle: 'Change of mind? Return within 7 days, no questions asked.',
  },
  {
    icon: 'truck',
    title: 'Free Exchange',
    subtitle: 'Free size or colour exchange within 30 days.',
  },
  {
    icon: 'star',
    title: 'Member Rewards',
    subtitle: 'Earn 2x points on every purchase with CommerceHub+.',
  },
];
