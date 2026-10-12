export interface CategoryFilter {
  id: string;
  name: string;
  count?: number;
  isActive?: boolean;
}

export interface ColourSwatch {
  name: string;
  hex: string;
}

export interface FilterGroup {
  id: string;
  name: string;
  count: number;
  options: { label: string; count?: number; checked?: boolean }[];
}

export const PRODUCT_CATEGORIES: CategoryFilter[] = [
  { id: 'shoes', name: 'Shoes', count: 82, isActive: true },
  { id: 'tops', name: 'Tops & T-Shirts', count: 47 },
  { id: 'shorts', name: 'Shorts', count: 23 },
  { id: 'hoodies', name: 'Hoodies & Sweatshirts', count: 31 },
  { id: 'trousers', name: 'Trousers & Tights', count: 19 },
  { id: 'jackets', name: 'Jackets', count: 26 },
  { id: 'compression', name: 'Compression and Base Layer', count: 12 },
  { id: 'accessories', name: 'Accessories & Equipment', count: 19 },
];

export const PRODUCT_COLOURS: ColourSwatch[] = [
  { name: 'Brown', hex: '#6b4423' },
  { name: 'Black', hex: '#111111' },
  { name: 'White', hex: '#f5f5f5' },
  { name: 'Grey', hex: '#9ca3af' },
  { name: 'Blue', hex: '#1d4ed8' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Beige', hex: '#d6c5a8' },
];

export const FILTER_GROUPS: FilterGroup[] = [
  {
    id: 'gender',
    name: 'Gender',
    count: 1,
    options: [
      { label: 'Men', count: 198, checked: true },
      { label: 'Women' },
      { label: 'Unisex' },
      { label: 'Kids' },
    ],
  },
  {
    id: 'price',
    name: 'Shop By Price',
    count: 0,
    options: [
      { label: 'Under 1.000.000₫' },
      { label: '1.000.000₫ - 2.500.000₫' },
      { label: '2.500.000₫ - 5.000.000₫' },
      { label: 'Over 5.000.000₫' },
    ],
  },
  {
    id: 'sale',
    name: 'Sale & Offers',
    count: 0,
    options: [
      { label: 'On Sale' },
      { label: 'Member Exclusive' },
    ],
  },
  {
    id: 'colour',
    name: 'Colour',
    count: 1,
    options: [
      { label: 'Brown' },
      { label: 'Black' },
      { label: 'White' },
      { label: 'Grey' },
    ],
  },
  {
    id: 'brand',
    name: 'Brand',
    count: 0,
    options: [
      { label: 'Nike' },
      { label: 'Jordan' },
      { label: 'Converse' },
    ],
  },
];

export interface ListProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  slug: string;
}

export const SAMPLE_PRODUCTS: ListProduct[] = [
  { id: 'p1', name: 'Nike 24.7', category: "Men's shoes", price: 4109000, slug: 'nike-247-mono', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80' },
  { id: 'p2', name: 'Nike 24.7', category: "Men's shoes", price: 5889000, slug: 'nike-247-knit', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80' },
  { id: 'p3', name: 'Nike Air Max', category: "Men's shoes", price: 1279000, slug: 'nike-air-max-90', image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&q=80' },
  { id: 'p4', name: 'Nike Pegasus 41', category: "Men's shoes", price: 3529000, slug: 'nike-pegasus-41', image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80' },
  { id: 'p5', name: 'Nike Vomero 18', category: "Men's shoes", price: 4109000, slug: 'nike-vomero-18', image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600&q=80' },
  { id: 'p6', name: 'Nike Streakfly Plus', category: "Men's shoes", price: 4699000, slug: 'nike-streakfly-plus', image: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600&q=80' },
  { id: 'p7', name: 'Nike Pegasus Plus', category: "Men's shoes", price: 4509000, slug: 'nike-pegasus-plus', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80' },
  { id: 'p8', name: 'Nike Pegasus Trail 5', category: "Men's shoes", price: 3829000, slug: 'nike-pegasus-trail-5', image: 'https://images.unsplash.com/photo-1605408499391-6368c628ef42?w=600&q=80' },
  { id: 'p9', name: 'Nike Zoom Fly 6', category: "Men's shoes", price: 4999000, slug: 'nike-zoom-fly-6', image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&q=80' },
  { id: 'p10', name: 'Nike Invincible 4', category: "Men's shoes", price: 4699000, slug: 'nike-invincible-4', image: 'https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=600&q=80' },
  { id: 'p11', name: 'Nike InfinityRN 5', category: "Men's shoes", price: 4509000, slug: 'nike-infinityrn-5', image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80' },
  { id: 'p12', name: 'Nike React Phantom', category: "Men's shoes", price: 3529000, slug: 'nike-react-phantom', image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80' },
];

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'price-low', label: 'Price: Low to High' },
];
