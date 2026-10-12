import { useState, useEffect } from 'react';
import { cartService } from '../services/cart.service';
import { Cart } from '../types';

export const useCart = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      const response = await cartService.getCart();
      if (response.success && response.data) {
        setCart(response.data);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load cart');
      console.error('Cart fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const addToCart = async (productId: string, variantId?: string, quantity = 1) => {
    try {
      const response = await cartService.addToCart(productId, variantId, quantity);
      if (response.success && response.data) {
        setCart(response.data);
      }
      return response;
    } catch (err) {
      console.error('Add to cart error:', err);
      throw err;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      const response = await cartService.updateCartItem(itemId, quantity);
      if (response.success && response.data) {
        setCart(response.data);
      }
      return response;
    } catch (err) {
      console.error('Update quantity error:', err);
      throw err;
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const response = await cartService.removeFromCart(itemId);
      if (response.success && response.data) {
        setCart(response.data);
      }
      return response;
    } catch (err) {
      console.error('Remove item error:', err);
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      await cartService.clearCart();
      setCart(null);
    } catch (err) {
      console.error('Clear cart error:', err);
      throw err;
    }
  };

  const applyCoupon = async (couponCode: string) => {
    try {
      const response = await cartService.applyCoupon(couponCode);
      if (response.success && response.data) {
        setCart(response.data);
      }
      return response;
    } catch (err) {
      console.error('Apply coupon error:', err);
      throw err;
    }
  };

  const removeCoupon = async () => {
    try {
      const response = await cartService.removeCoupon();
      if (response.success && response.data) {
        setCart(response.data);
      }
      return response;
    } catch (err) {
      console.error('Remove coupon error:', err);
      throw err;
    }
  };

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return {
    cart,
    isLoading,
    error,
    itemCount,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    refreshCart: fetchCart,
  };
};
