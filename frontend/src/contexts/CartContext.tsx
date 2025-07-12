'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { cartAPI } from '@/lib/api';

// Types
export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product_name: string;
  price_clp: number;
  subtotal: number;
  stock_quantity: number;
  category_name: string;
  image_link?: string;
  description?: string;
}

export interface CartSummary {
  total_items: number;
  total_amount: number;
  currency: string;
}

export interface Cart {
  user_id?: string;
  items: CartItem[];
  summary: CartSummary;
}

interface CartState {
  cart: Cart;
  loading: boolean;
  error: string | null;
  isOpen: boolean;
}

// Actions
type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CART'; payload: Cart }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'UPDATE_ITEM_COUNT'; payload: { product_id: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' };

// Initial state
const initialState: CartState = {
  cart: {
    items: [],
    summary: {
      total_items: 0,
      total_amount: 0,
      currency: 'CLP'
    }
  },
  loading: false,
  error: null,
  isOpen: false
};

// Reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_CART':
      return { ...state, cart: action.payload, loading: false, error: null };
    
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };
    
    case 'OPEN_CART':
      return { ...state, isOpen: true };
    
    case 'CLOSE_CART':
      return { ...state, isOpen: false };
    
    case 'UPDATE_ITEM_COUNT':
      return {
        ...state,
        cart: {
          ...state.cart,
          items: state.cart.items.map(item =>
            item.product_id === action.payload.product_id
              ? { ...item, quantity: action.payload.quantity }
              : item
          )
        }
      };
    
    case 'REMOVE_ITEM':
      const newItems = state.cart.items.filter(item => item.product_id !== action.payload);
      const newTotal = newItems.reduce((sum, item) => sum + item.subtotal, 0);
      const newCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        ...state,
        cart: {
          ...state.cart,
          items: newItems,
          summary: {
            ...state.cart.summary,
            total_items: newCount,
            total_amount: newTotal
          }
        }
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        cart: {
          ...state.cart,
          items: [],
          summary: {
            total_items: 0,
            total_amount: 0,
            currency: 'CLP'
          }
        }
      };
    
    default:
      return state;
  }
}

// Context
interface CartContextType {
  // State
  cart: Cart;
  loading: boolean;
  error: string | null;
  isOpen: boolean;
  
  // Actions
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  validateCart: () => Promise<unknown>;
  
  // UI Actions
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  
  // Guest cart
  addToGuestCart: (productId: string, quantity: number) => void;
  getGuestCart: () => CartItem[];
  mergeGuestCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user } = useAuth();

  // Load cart when user logs in
  useEffect(() => {
    if (user) {
      refreshCart();
      // Merge guest cart if exists
      const guestItems = getGuestCart();
      if (guestItems.length > 0) {
        mergeGuestCart();
      }
    }
  }, [user]);

  // Cart API functions
  const refreshCart = async () => {
    if (!user) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await cartAPI.getCart();
      
      if (response.success) {
        dispatch({ type: 'SET_CART', payload: response.data as Cart });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.message || 'Failed to load cart' });
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load cart' });
    }
  };

  const addToCart = async (productId: string, quantity: number) => {
    if (!user) {
      // Add to guest cart
      addToGuestCart(productId, quantity);
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await cartAPI.addItem(productId, quantity);
      
      if (response.success) {
        await refreshCart();
        dispatch({ type: 'OPEN_CART' });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.message || 'Failed to add item' });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add item to cart' });
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await cartAPI.updateQuantity(productId, quantity);
      
      if (response.success) {
        dispatch({ type: 'UPDATE_ITEM_COUNT', payload: { product_id: productId, quantity } });
        await refreshCart();
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.message || 'Failed to update quantity' });
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update quantity' });
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await cartAPI.removeItem(productId);
      
      if (response.success) {
        dispatch({ type: 'REMOVE_ITEM', payload: productId });
        await refreshCart();
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.message || 'Failed to remove item' });
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove item' });
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await cartAPI.clearCart();
      
      if (response.success) {
        dispatch({ type: 'CLEAR_CART' });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.message || 'Failed to clear cart' });
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear cart' });
    }
  };

  const validateCart = async () => {
    if (!user) return null;

    try {
      const response = await cartAPI.validateCart();
      return response.data;
    } catch (error) {
      console.error('Error validating cart:', error);
      return null;
    }
  };

  // Guest cart functions (localStorage)
  const addToGuestCart = (productId: string, quantity: number) => {
    try {
      const guestCart = getGuestCart();
      const existingItem = guestCart.find(item => item.product_id === productId);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        guestCart.push({ product_id: productId, quantity } as CartItem);
      }
      
      localStorage.setItem('guestCart', JSON.stringify(guestCart));
      dispatch({ type: 'OPEN_CART' });
    } catch (error) {
      console.error('Error adding to guest cart:', error);
    }
  };

  const getGuestCart = (): CartItem[] => {
    try {
      const stored = localStorage.getItem('guestCart');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting guest cart:', error);
      return [];
    }
  };

  const mergeGuestCart = async () => {
    if (!user) return;

    try {
      const guestItems = getGuestCart();
      if (guestItems.length === 0) return;

      const response = await cartAPI.mergeGuestCart(guestItems);
      
      if (response.success) {
        localStorage.removeItem('guestCart');
        await refreshCart();
      }
    } catch (error) {
      console.error('Error merging guest cart:', error);
    }
  };

  // UI actions
  const toggleCart = () => dispatch({ type: 'TOGGLE_CART' });
  const openCart = () => dispatch({ type: 'OPEN_CART' });
  const closeCart = () => dispatch({ type: 'CLOSE_CART' });

  const value: CartContextType = {
    // State
    cart: state.cart,
    loading: state.loading,
    error: state.error,
    isOpen: state.isOpen,
    
    // Actions
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
    validateCart,
    
    // UI Actions
    toggleCart,
    openCart,
    closeCart,
    
    // Guest cart
    addToGuestCart,
    getGuestCart,
    mergeGuestCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// Hook
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}