'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    quantity: number;
    in_stock: boolean;
  };
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart, loading } = useCart();
  const { user } = useAuth();

  const handleAddToCart = async () => {
    try {
      setIsAdding(true);
      await addToCart(product.id, quantity);
      
      // Show success message
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('cart-updated', {
          detail: { 
            action: 'added',
            product: product.name,
            quantity 
          }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error al agregar al carrito. Por favor, intenta de nuevo.');
    } finally {
      setIsAdding(false);
    }
  };

  if (!product.in_stock || product.quantity === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-700 text-center">
          Este producto está agotado actualmente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
          Cantidad:
        </label>
        <select
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {[...Array(Math.min(product.quantity, 10))].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleAddToCart}
        disabled={isAdding || loading}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {(isAdding || loading) ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Agregando...
          </>
        ) : (
          user ? 'Agregar al Carrito' : 'Agregar al Carrito (Invitado)'
        )}
      </button>
    </div>
  );
}