export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'seller' | 'admin';
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
  basePrice: number;
  salePrice?: number;
  categoryId: string;
  categoryName: string;
  manufacturer?: string;
  rating: number;
  reviewCount: number;
  images: ProductMedia[];
  videos: ProductMedia[];
  variants: ProductVariant[];
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductMedia {
  id: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  order: number;
  type: 'image' | 'video';
}

export interface ProductVariant {
  id: string;
  sku: string;
  attributes: VariantAttribute[];
  priceAdjustment: number;
  stock: number;
  isAvailable: boolean;
}

export interface VariantAttribute {
  name: string;
  value: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  description?: string;
  level: number;
  children?: Category[];
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  variantId?: string;
  variantAttributes?: VariantAttribute[];
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  couponCode?: string;
}

export interface ShippingAddress {
  id?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  estimatedDays: string;
  price: number;
}

export interface PaymentMethod {
  type: 'card' | 'paypal' | 'bank_transfer';
  cardNumber?: string;
  cardholderName?: string;
  expirationDate?: string;
  cvv?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: ShippingAddress;
  billingAddress: ShippingAddress;
  shippingMethod: ShippingMethod;
  paymentMethod: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  variantAttributes?: VariantAttribute[];
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  content: string;
  helpfulCount: number;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
