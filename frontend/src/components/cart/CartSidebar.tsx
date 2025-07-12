'use client';

import React from 'react';
import { useCart, type CartItem } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils';

export default function CartSidebar() {
  const { 
    cart, 
    loading, 
    error, 
    isOpen, 
    closeCart, 
    updateQuantity, 
    removeFromCart,
    clearCart 
  } = useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={closeCart}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            Carrito ({cart.summary.total_items} artículos)
          </h2>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="p-4 text-red-600 bg-red-50 m-4 rounded">
              {error}
            </div>
          )}

          {!loading && cart.items.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 11H6L5 9z" />
              </svg>
              <p className="text-lg font-medium mb-2">Tu carrito está vacío</p>
              <p className="text-sm">Agrega algunos productos para comenzar</p>
            </div>
          )}

          {!loading && cart.items.length > 0 && (
            <div className="p-4 space-y-4">
              {cart.items.map((item) => (
                <CartItem
                  key={item.product_id}
                  item={item}
                  onUpdateQuantity={(quantity) => updateQuantity(item.product_id, quantity)}
                  onRemove={() => removeFromCart(item.product_id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-xl font-bold text-blue-600">
                {formatPrice(cart.summary.total_amount)}
              </span>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium"
                onClick={() => {
                  // Navigate to checkout
                  closeCart();
                  window.location.href = '/checkout';
                }}
              >
                Ir al Checkout
              </button>
              
              <button
                onClick={clearCart}
                className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
              >
                Vaciar Carrito
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Cart Item Component
interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const handleQuantityChange = (delta: number) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity > 0 && newQuantity <= item.stock_quantity) {
      onUpdateQuantity(newQuantity);
    }
  };

  return (
    <div className="flex gap-3 p-3 border rounded-lg">
      {/* Product Image */}
      <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0">
        {item.image_link ? (
          <img
            src={item.image_link}
            alt={item.product_name}
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{item.product_name}</h4>
        <p className="text-xs text-gray-500 truncate">{item.category_name}</p>
        <p className="text-sm font-medium text-blue-600">
          {formatPrice(item.price_clp)}
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={item.quantity <= 1}
            className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            -
          </button>
          
          <span className="text-sm font-medium w-8 text-center">
            {item.quantity}
          </span>
          
          <button
            onClick={() => handleQuantityChange(1)}
            disabled={item.quantity >= item.stock_quantity}
            className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
          
          <span className="text-xs text-gray-500 ml-2">
            Stock: {item.stock_quantity}
          </span>
        </div>

        {/* Subtotal */}
        <p className="text-sm font-medium mt-1">
          Subtotal: {formatPrice(item.subtotal)}
        </p>
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}