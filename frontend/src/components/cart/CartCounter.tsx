'use client';

import React from 'react';
import { useCart } from '@/contexts/CartContext';

export default function CartCounter() {
  const { cart, loading, toggleCart } = useCart();

  return (
    <button
      onClick={toggleCart}
      className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors"
      aria-label="Abrir carrito"
    >
      {/* Cart Icon */}
      <svg 
        className="w-6 h-6" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 11H6L5 9z" 
        />
      </svg>

      {/* Cart Count Badge */}
      {cart.summary.total_items > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {cart.summary.total_items > 99 ? '99+' : cart.summary.total_items}
        </span>
      )}

      {/* Loading indicator */}
      {loading && (
        <span className="absolute -top-1 -right-1 bg-blue-500 rounded-full h-3 w-3 animate-pulse" />
      )}
    </button>
  );
}