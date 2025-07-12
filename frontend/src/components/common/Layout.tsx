'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import CartCounter from '@/components/cart/CartCounter';
import { 
  HomeIcon, 
  ShoppingBagIcon, 
  UserIcon, 
  CogIcon,
  ArrowRightOnRectangleIcon,
  BuildingStorefrontIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <BuildingStorefrontIcon className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Ferremas</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                href="/" 
                className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <HomeIcon className="h-5 w-5" />
                <span>Inicio</span>
              </Link>
              
              <Link 
                href="/products" 
                className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <ShoppingBagIcon className="h-5 w-5" />
                <span>Productos</span>
              </Link>

              {isAuthenticated && (user?.role === 'manager' || user?.role === 'admin') && (
                <Link 
                  href="/manager" 
                  className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <CogIcon className="h-5 w-5" />
                  <span>Gestión</span>
                </Link>
              )}

              {isAuthenticated && user?.role === 'admin' && (
                <Link 
                  href="/admin" 
                  className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <ShieldCheckIcon className="h-5 w-5" />
                  <span>Admin</span>
                </Link>
              )}
            </nav>

            {/* Cart and User Menu */}
            <div className="flex items-center space-x-4">
              {/* Cart Counter */}
              <CartCounter />
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {user?.name} {user?.lastname}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user?.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    <span>Salir</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link 
                    href="/auth/login"
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link 
                    href="/auth/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BuildingStorefrontIcon className="h-6 w-6" />
                <span className="text-lg font-bold">Ferremas</span>
              </div>
              <p className="text-gray-300">
                Tu ferretería de confianza. Herramientas y materiales de calidad para todos tus proyectos.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Productos</h3>
              <ul className="space-y-2 text-gray-300">
                <li>Herramientas Manuales</li>
                <li>Herramientas Eléctricas</li>
                <li>Materiales de Construcción</li>
                <li>Jardín y Exterior</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contacto</h3>
              <div className="text-gray-300 space-y-2">
                <p>📍 Santiago, Chile</p>
                <p>📞 +56 9 1234 5678</p>
                <p>✉️ contacto@ferremas.cl</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2025 Ferremas. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}