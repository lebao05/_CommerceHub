/* ---------- Types ---------- */

export interface CartVariation {
  label: string;
  value: string;
}

export interface CartBadge {
  /** Short text shown in a yellow pill (e.g. "10-10", "100%") */
  text: string;
  /** Optional helper text shown in the tooltip / aria-label */
  title?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  unitPrice: number;
  /** Original price (shown with strikethrough if discounted) */
  originalPrice?: number;
  quantity: number;
  variations: CartVariation[];
  /** Small yellow tag pills shown above the product title */
  badges: CartBadge[];
  /** "Flash Sale ends at..." orange text shown under the product name */
  flashSaleEndsAt?: string;
  /** True if this is part of a "Free shipping" bundle */
  freeShipping?: boolean;
  /** True if the quantity is 0 (out of stock / inactive row) */
  inactive?: boolean;
}

export interface CartShop {
  id: string;
  /** Shop display name */
  name: string;
  /** Optional favourite-shop badge text */
  favouriteLabel?: string;
  items: CartItem[];
}

/* ---------- Sample data ---------- */

export const SAMPLE_CART: CartShop[] = [
  {
    id: 'shop-newstyle',
    name: 'NewStyle',
    favouriteLabel: 'Yêu thích+',
    items: [
      {
        id: 'ci-1',
        productId: 'p-101',
        productName: 'Áo thun nam nữ form rộng tay lỡ NewStyle vải cotton dày dặn, áo phông unisex',
        productSlug: 'ao-thun-newstyle',
        productImage:
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&q=80',
        unitPrice: 89000,
        originalPrice: 159000,
        quantity: 2,
        variations: [
          { label: 'Phân loại', value: 'Đen, 2XL' },
        ],
        badges: [
          { text: '10-10', title: '10 đánh giá tốt trong 10 ngày' },
        ],
        freeShipping: true,
      },
      {
        id: 'ci-2',
        productId: 'p-102',
        productName: 'Áo polo nam nữ NewStyle vải cá sấu cotton cao cấp, áo thun có cổ unisex',
        productSlug: 'ao-polo-newstyle',
        productImage:
          'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=300&q=80',
        unitPrice: 129000,
        originalPrice: 249000,
        quantity: 1,
        variations: [
          { label: 'Phân loại', value: 'Trắng, L' },
        ],
        badges: [
          { text: '10-10', title: '10 đánh giá tốt trong 10 ngày' },
        ],
        flashSaleEndsAt: '02 : 14 : 33',
        freeShipping: true,
      },
    ],
  },
  {
    id: 'shop-leining',
    name: 'LEI NING SPORT VN',
    favouriteLabel: 'Yêu thích+',
    items: [
      {
        id: 'ci-3',
        productId: 'p-201',
        productName: 'Giày thể thao nam nữ LEI NING RUNNING 95 đế êm, form chuẩn, hỗ trợ chạy bộ',
        productSlug: 'giay-leining-95',
        productImage:
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80',
        unitPrice: 899000,
        originalPrice: 1490000,
        quantity: 1,
        variations: [
          { label: 'Phân loại', value: 'Trắng / UK 8' },
        ],
        badges: [
          { text: '100%', title: '100% đánh giá tốt' },
        ],
        flashSaleEndsAt: '05 : 41 : 12',
        freeShipping: true,
      },
      {
        id: 'ci-4',
        productId: 'p-202',
        productName: 'Áo khoác gió LEI NING chống nước, vải dù cao cấp, thấm hút mồ hôi',
        productSlug: 'ao-khoac-leining',
        productImage:
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&q=80',
        unitPrice: 459000,
        originalPrice: 990000,
        quantity: 1,
        variations: [
          { label: 'Phân loại', value: 'Đen, M' },
        ],
        badges: [
          { text: '10-10', title: '10 đánh giá tốt trong 10 ngày' },
        ],
        freeShipping: true,
      },
    ],
  },
];

/** Format a number in Vietnamese "1.234.567đ" style */
export const formatVNDLong = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
};
