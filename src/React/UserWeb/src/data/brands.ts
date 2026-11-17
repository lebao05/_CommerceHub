export interface Brand {
  id: string;
  name: string;
  slug: string;
  /** Short 1-2 letter mark shown inside the logo tile */
  monogram: string;
  /** Brand accent colour used for the monogram chip and hover state */
  color: string;
  productCount: number;
}

/**
 * Brands featured on the home page. In a production build these would come
 * from the catalog API (brand/manufacturer endpoint); the shapes mirror what
 * `Product.manufacturer` already exposes.
 */
export const FEATURED_BRANDS: Brand[] = [
  { id: 'nike', name: 'Nike', slug: 'nike', monogram: 'NK', color: '#111111', productCount: 5 },
  { id: 'jordan', name: 'Jordan', slug: 'jordan', monogram: 'JR', color: '#D62828', productCount: 2 },
  { id: 'converse', name: 'Converse', slug: 'converse', monogram: 'CV', color: '#1D3557', productCount: 2 },
  { id: 'adidas', name: 'Adidas', slug: 'adidas', monogram: 'AD', color: '#0B5FA5', productCount: 1 },
  { id: 'puma', name: 'Puma', slug: 'puma', monogram: 'PU', color: '#E94F37', productCount: 1 },
  { id: 'new-balance', name: 'New Balance', slug: 'new-balance', monogram: 'NB', color: '#C8102E', productCount: 1 },
];
