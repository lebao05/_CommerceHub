import { apiService } from './api.service';
import { ApiResponse, PaginatedResponse, Review } from '../types';

export const reviewService = {
  // Get product reviews
  getProductReviews: async (productId: string, page = 1, pageSize = 10) => {
    return apiService.get<PaginatedResponse<Review>>(`/reviews/product/${productId}`, {
      params: { page, pageSize },
    });
  },

  // Create review
  createReview: async (data: {
    productId: string;
    orderId?: string;
    rating: number;
    title: string;
    content: string;
  }) => {
    return apiService.post<ApiResponse<Review>>('/reviews', data);
  },

  // Update review
  updateReview: async (reviewId: string, data: {
    rating: number;
    title: string;
    content: string;
  }) => {
    return apiService.put<ApiResponse<Review>>(`/reviews/${reviewId}`, data);
  },

  // Delete review
  deleteReview: async (reviewId: string) => {
    return apiService.delete<ApiResponse<void>>(`/reviews/${reviewId}`);
  },

  // Mark review as helpful
  markHelpful: async (reviewId: string) => {
    return apiService.post<ApiResponse<void>>(`/reviews/${reviewId}/helpful`);
  },

  // Get user's reviews
  getMyReviews: async (page = 1, pageSize = 10) => {
    return apiService.get<PaginatedResponse<Review>>('/reviews/my-reviews', {
      params: { page, pageSize },
    });
  },
};
