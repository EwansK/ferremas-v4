'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils';
import { 
  CurrencyDollarIcon, 
  CubeIcon,
  CheckCircleIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline';

interface Product {
  id: string;
  name: string;
  description: string;
  price_clp: number;
  quantity: number;
  in_stock: boolean;
  category?: {
    id: string;
    name: string;
  };
  created_at: string;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCart();
  const isInStock = product.in_stock && product.quantity > 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!isInStock) return;
    
    try {
      setIsAdding(true);
      await addToCart(product.id, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };


  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer overflow-hidden">
        {/* Product Image */}
        <div className="relative h-48 bg-gray-100">
          <div className="flex items-center justify-center h-full">
            <CubeIcon className="h-16 w-16 text-gray-300" />
          </div>
          
          {/* Stock Status Badge */}
          <div className="absolute top-2 right-2">
            {isInStock ? (
              <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                <CheckCircleIcon className="h-3 w-3" />
                <span>Disponible</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                <XCircleIcon className="h-3 w-3" />
                <span>Agotado</span>
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Product Name */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {product.name}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Price and Stock */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
              <span className="text-xl font-bold text-green-600">
                {formatPrice(product.price_clp)}
              </span>
            </div>
            
            <div className="text-sm text-gray-500">
              Stock: <span className="font-medium">{product.quantity}</span>
            </div>
          </div>

          {/* Action Button */}
          <button 
            className={`w-full mt-4 py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center ${
              isInStock && !isAdding
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!isInStock || isAdding}
            onClick={handleAddToCart}
          >
            {isAdding ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Agregando...
              </>
            ) : isInStock ? (
              'Agregar al Carrito'
            ) : (
              'Sin Stock'
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}