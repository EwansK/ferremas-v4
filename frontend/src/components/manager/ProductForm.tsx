'use client';

import React, { useState, useEffect } from 'react';
import { Product, Category, CreateProductData, UpdateProductData } from '@/types';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductData | UpdateProductData) => Promise<void>;
  product?: Product | null;
  categories: Category[];
  isLoading?: boolean;
}

export default function ProductForm({
  isOpen,
  onClose,
  onSubmit,
  product,
  categories,
  isLoading = false
}: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_clp: '',
    quantity: '',
    category_id: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price_clp: product.price_clp.toString(),
        quantity: product.quantity.toString(),
        category_id: product.category.id
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price_clp: '',
        quantity: '',
        category_id: ''
      });
    }
    setErrors({});
  }, [product, isOpen]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    const price = parseFloat(formData.price_clp);
    if (!formData.price_clp.trim() || isNaN(price) || price <= 0) {
      newErrors.price_clp = 'El precio debe ser mayor a 0';
    }

    const quantity = parseInt(formData.quantity);
    if (!formData.quantity.trim() || isNaN(quantity) || quantity < 0) {
      newErrors.quantity = 'La cantidad debe ser mayor o igual a 0';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'La categoría es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitLoading(true);
      
      const price = parseFloat(formData.price_clp);
      const quantity = parseInt(formData.quantity);
      
      // Additional safety check
      if (isNaN(price) || price <= 0) {
        setErrors({ price_clp: 'El precio debe ser un número válido mayor a 0' });
        return;
      }
      
      if (isNaN(quantity) || quantity < 0) {
        setErrors({ quantity: 'La cantidad debe ser un número válido mayor o igual a 0' });
        return;
      }

      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price_clp: price,
        quantity: quantity,
        category_id: formData.category_id
      };

      await onSubmit(submitData);

      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el producto';
      setErrors({ submit: errorMessage });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for numeric fields
    if (name === 'price_clp' || name === 'quantity') {
      // Only allow positive numbers for price_clp, non-negative for quantity
      const numValue = parseFloat(value);
      if (value !== '' && (isNaN(numValue) || (name === 'price_clp' && numValue < 0) || (name === 'quantity' && numValue < 0))) {
        return; // Don't update if invalid
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {product ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nombre *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.name ? 'border-red-300 ring-red-500' : ''
                  }`}
                  placeholder="Nombre del producto"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Descripción del producto"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                  Categoría *
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.category_id ? 'border-red-300 ring-red-500' : ''
                  }`}
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
                )}
              </div>

              {/* Price and Quantity Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Price */}
                <div>
                  <label htmlFor="price_clp" className="block text-sm font-medium text-gray-700">
                    Precio (CLP) *
                  </label>
                  <input
                    type="number"
                    id="price_clp"
                    name="price_clp"
                    value={formData.price_clp}
                    onChange={handleInputChange}
                    min="0"
                    step="1"
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                      errors.price_clp ? 'border-red-300 ring-red-500' : ''
                    }`}
                    placeholder="0"
                  />
                  {errors.price_clp && (
                    <p className="mt-1 text-sm text-red-600">{errors.price_clp}</p>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="0"
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
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {errors.submit}
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="submit"
              disabled={submitLoading || isLoading}
              className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto"
            >
              {submitLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                product ? 'Actualizar' : 'Crear'
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
        </div>
      </div>
    </div>
  );
}