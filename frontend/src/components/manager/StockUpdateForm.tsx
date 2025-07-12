'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/types';
import { XMarkIcon, CubeIcon } from '@heroicons/react/24/outline';

interface StockUpdateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productId: string, quantity: number) => Promise<void>;
  product: Product | null;
  isLoading?: boolean;
}

export default function StockUpdateForm({
  isOpen,
  onClose,
  onSubmit,
  product,
  isLoading = false
}: StockUpdateFormProps) {
  const [quantity, setQuantity] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Initialize form data when product changes
  useEffect(() => {
    console.log('StockUpdateForm - useEffect triggered:', {
      productId: product?.id,
      productQuantity: product?.quantity,
      isOpen,
      currentFormQuantity: quantity
    });
    
    if (product) {
      setQuantity(product.quantity.toString());
    } else {
      setQuantity('');
    }
    setErrors({});
  }, [product?.quantity, product?.id, isOpen]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!quantity || parseInt(quantity) < 0) {
      newErrors.quantity = 'La cantidad debe ser mayor o igual a 0';
    }

    if (parseInt(quantity) > 999999) {
      newErrors.quantity = 'La cantidad no puede ser mayor a 999,999';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product || !validateForm()) {
      return;
    }

    const newQuantity = parseInt(quantity);
    console.log('StockUpdateForm - Submitting:', {
      productId: product.id,
      currentQuantityInProduct: product.quantity,
      quantityInForm: quantity,
      parsedQuantity: newQuantity,
      difference: newQuantity - product.quantity
    });

    try {
      setSubmitLoading(true);
      await onSubmit(product.id, newQuantity);
      onClose();
    } catch (error) {
      console.error('Error updating stock:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el stock';
      setErrors({ submit: errorMessage });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuantity(value);
    
    // Clear error when user starts typing
    if (errors.quantity) {
      setErrors(prev => ({ ...prev, quantity: '' }));
    }
  };

  const handleQuickUpdate = (operation: 'add' | 'subtract', amount: number) => {
    const currentQuantity = parseInt(quantity) || 0;
    let newQuantity: number;

    if (operation === 'add') {
      newQuantity = currentQuantity + amount;
    } else {
      newQuantity = Math.max(0, currentQuantity - amount);
    }

    console.log('StockUpdateForm - Quick update:', {
      operation,
      amount,
      currentQuantityInForm: currentQuantity,
      newQuantity,
      productQuantity: product?.quantity
    });

    setQuantity(newQuantity.toString());
    
    // Clear errors
    if (errors.quantity) {
      setErrors(prev => ({ ...prev, quantity: '' }));
    }
  };

  if (!isOpen || !product) return null;

  const currentQuantity = product.quantity;
  const newQuantity = parseInt(quantity) || 0;
  const difference = newQuantity - currentQuantity;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <CubeIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Actualizar Stock
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Product Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-900">{product.name}</p>
              <p className="text-sm text-gray-500">Stock actual: {currentQuantity} unidades</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Quick Actions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Acciones rápidas
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickUpdate('subtract', 1)}
                    disabled={currentQuantity <= 0}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickUpdate('add', 1)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickUpdate('subtract', 10)}
                    disabled={currentQuantity < 10}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickUpdate('add', 10)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    +10
                  </button>
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                  Nueva cantidad *
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={quantity}
                  onChange={handleInputChange}
                  min="0"
                  max="999999"
                  step="1"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.quantity ? 'border-red-300 ring-red-500' : ''
                  }`}
                  placeholder="0"
                />
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                )}
              </div>

              {/* Change Summary */}
              {difference !== 0 && (
                <div className={`p-3 rounded-md ${
                  difference > 0 ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <p className={`text-sm font-medium ${
                    difference > 0 ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {difference > 0 ? `+${difference}` : difference} unidades
                  </p>
                  <p className={`text-sm ${
                    difference > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {difference > 0 ? 'Aumentar stock' : 'Reducir stock'}
                  </p>
                </div>
              )}

              {/* Submit Error */}
              {errors.submit && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {errors.submit}
                </div>
              )}

              {/* Footer */}
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 -mx-4 -mb-4 mt-6">
                <button
                  type="submit"
                  disabled={submitLoading || isLoading || difference === 0}
                  className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto"
                >
                  {submitLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Actualizando...
                    </>
                  ) : (
                    'Actualizar Stock'
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitLoading}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed sm:mt-0 sm:w-auto"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}