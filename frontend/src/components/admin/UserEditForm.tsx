'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, UserIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  lastname: string;
  email: string;
  role: 'customer' | 'manager' | 'admin';
  active: boolean;
}

interface UserEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: { name: string; lastname: string; email: string; role: string }) => Promise<void>;
  user: User | null;
  isLoading?: boolean;
}

export default function UserEditForm({
  isOpen,
  onClose,
  onSubmit,
  user,
  isLoading = false
}: UserEditFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    lastname: '',
    email: '',
    role: 'customer'
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        role: user.role
      });
    } else {
      setFormData({
        name: '',
        lastname: '',
        email: '',
        role: 'customer'
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.lastname.trim()) {
      newErrors.lastname = 'El apellido es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.role) {
      newErrors.role = 'El rol es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !validateForm()) {
      return;
    }

    try {
      setSubmitLoading(true);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el usuario';
      setErrors({ submit: errorMessage });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <UserIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Editar Usuario
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

            {/* User Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-900">{user.name} {user.lastname}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user.active ? 'Activo' : 'Inactivo'}
              </span>
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
                  placeholder="Nombre del usuario"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Lastname */}
              <div>
                <label htmlFor="lastname" className="block text-sm font-medium text-gray-700">
                  Apellido *
                </label>
                <input
                  type="text"
                  id="lastname"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.lastname ? 'border-red-300 ring-red-500' : ''
                  }`}
                  placeholder="Apellido del usuario"
                />
                {errors.lastname && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastname}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.email ? 'border-red-300 ring-red-500' : ''
                  }`}
                  placeholder="email@ejemplo.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Rol *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.role ? 'border-red-300 ring-red-500' : ''
                  }`}
                >
                  <option value="customer">Cliente</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrador</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                )}
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {errors.submit}
                </div>
              )}

              {/* Footer */}
              <div className="flex flex-col sm:flex-row-reverse gap-3 sm:gap-2 pt-4">
                <button
                  type="submit"
                  disabled={submitLoading || isLoading}
                  className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                >
                  {submitLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Actualizando...
                    </>
                  ) : (
                    'Actualizar Usuario'
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitLoading}
                  className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
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