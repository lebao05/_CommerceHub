import { apiService } from './api.service';
import { ApiResponse, PaginatedResponse, Order, ShippingMethod, ShippingAddress } from '../types';

export const orderService = {
  // Get user's orders
  getOrders: async (page = 1, pageSize = 10) => {
    return apiService.get<PaginatedResponse<Order>>('/orders', {
      params: { page, pageSize },
    });
  },

  // Get order by ID
  getOrderById: async (orderId: string) => {
    return apiService.get<ApiResponse<Order>>(`/orders/${orderId}`);
  },

  // Create order
  createOrder: async (orderData: {
    shippingAddressId: string;
    billingAddressId: string;
    shippingMethodId: string;
    paymentMethod: string;
    notes?: string;
  }) => {
    return apiService.post<ApiResponse<Order>>('/orders', orderData);
  },

  // Cancel order
  cancelOrder: async (orderId: string, reason?: string) => {
    return apiService.post<ApiResponse<Order>>(`/orders/${orderId}/cancel`, { reason });
  },

  // Track order
  trackOrder: async (orderId: string) => {
    return apiService.get<ApiResponse<{
      order: Order;
      trackingHistory: Array<{
        status: string;
        timestamp: string;
        location: string;
        description: string;
      }>;
    }>>(`/orders/${orderId}/track`);
  },

  // Get available shipping methods
  getShippingMethods: async (addressId?: string) => {
    return apiService.get<ApiResponse<ShippingMethod[]>>('/orders/shipping-methods', {
      params: { addressId },
    });
  },

  // Calculate order totals
  calculateTotals: async (data: {
    shippingMethodId: string;
    shippingAddressId: string;
    couponCode?: string;
  }) => {
    return apiService.post<ApiResponse<{
      subtotal: number;
      discount: number;
      tax: number;
      shipping: number;
      total: number;
    }>>('/orders/calculate', data);
  },
};
