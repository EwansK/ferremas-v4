'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Product, Category, CreateProductData, UpdateProductData, CreateCategoryData } from '@/types';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CubeIcon,
  TagIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Import our new components
import ProductForm from '@/components/manager/ProductForm';
import CategoryForm from '@/components/manager/CategoryForm';
import DeleteConfirmation from '@/components/manager/DeleteConfirmation';
import StockUpdateForm from '@/components/manager/StockUpdateForm';

export default function ManagerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  
  // Modal states
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [stockFormOpen, setStockFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Selected items for edit/delete
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ type: 'product' | 'category'; item: Product | Category; name: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'manager' && user?.role !== 'admin')) {
      router.push('/auth/login');
      return;
    }
    
    fetchData();
  }, [isAuthenticated, user, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [inventoryResponse, categoriesResponse] = await Promise.all([
        apiClient.getInventory({ limit: 50 }),
        apiClient.getManagerCategories()
      ]);
      
      setProducts(inventoryResponse.products);
      setCategories(categoriesResponse.categories);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Product CRUD operations
  const handleCreateProduct = async (productData: CreateProductData | UpdateProductData) => {
    await apiClient.createProduct(productData as CreateProductData);
    await fetchData(); // Refresh data
  };

  const handleUpdateProduct = async (productData: CreateProductData | UpdateProductData) => {
    if (selectedProduct) {
      await apiClient.updateProduct(selectedProduct.id, productData);
      await fetchData(); // Refresh data
    }
  };

  const handleDeleteProduct = async () => {
    if (deleteItem && deleteItem.type === 'product') {
      await apiClient.deleteProduct((deleteItem.item as Product).id);
      await fetchData(); // Refresh data
    }
  };

  const handleUpdateStock = async (productId: string, quantity: number) => {
    await apiClient.updateStock(productId, quantity);
    await fetchData(); // Refresh data
  };

  // Category CRUD operations
  const handleCreateCategory = async (categoryData: CreateCategoryData) => {
    await apiClient.createCategory(categoryData);
    await fetchData(); // Refresh data
  };

  const handleUpdateCategory = async (categoryData: CreateCategoryData) => {
    if (selectedCategory) {
      await apiClient.updateCategory(selectedCategory.id, categoryData);
      await fetchData(); // Refresh data
    }
  };

  const handleDeleteCategory = async () => {
    if (deleteItem && deleteItem.type === 'category') {
      await apiClient.deleteCategory((deleteItem.item as Category).id);
      await fetchData(); // Refresh data
    }
  };

  // Modal handlers
  const openProductForm = (product?: Product) => {
    setSelectedProduct(product || null);
    setProductFormOpen(true);
  };

  const openCategoryForm = (category?: Category) => {
    setSelectedCategory(category || null);
    setCategoryFormOpen(true);
  };

  const openStockForm = (product: Product) => {
    setSelectedProduct(product);
    setStockFormOpen(true);
  };

  const openDeleteConfirm = (type: 'product' | 'category', item: Product | Category) => {
    setDeleteItem({ type, item, name: item.name });
    setDeleteConfirmOpen(true);
  };

  const closeAllModals = () => {
    setProductFormOpen(false);
    setCategoryFormOpen(false);
    setStockFormOpen(false);
    setDeleteConfirmOpen(false);
    setSelectedProduct(null);
    setSelectedCategory(null);
    setDeleteItem(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (!isAuthenticated || (user?.role !== 'manager' && user?.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Acceso restringido</h3>
          <p className="mt-1 text-sm text-gray-500">
            Necesitas permisos de manager o admin para acceder a esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Panel de Gestión
          </h1>
          <p className="mt-2 text-gray-600">
            Administra productos, categorías e inventario
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CubeIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Productos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {products.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TagIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Categorías
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {categories.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Stock Total
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {products.reduce((sum, product) => sum + product.quantity, 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Productos
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'categories'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Categorías
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'products' && (
              <div>
                {/* Products Header */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-medium text-gray-900">
                    Inventario de Productos
                  </h2>
                  <button 
                    onClick={() => openProductForm()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nuevo Producto
                  </button>
                </div>

                {/* Products Table */}
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Cargando productos...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Producto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Categoría
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Precio
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stock
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product) => (
                          <tr key={product.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {product.description}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {product.category.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatPrice(product.price_clp)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {product.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                product.in_stock
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {product.in_stock ? 'Disponible' : 'Agotado'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button 
                                  onClick={() => openStockForm(product)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Actualizar stock"
                                >
                                  <CubeIcon className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => openProductForm(product)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Editar producto"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => openDeleteConfirm('product', product)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Eliminar producto"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'categories' && (
              <div>
                {/* Categories Header */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-medium text-gray-900">
                    Gestión de Categorías
                  </h2>
                  <button 
                    onClick={() => openCategoryForm()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nueva Categoría
                  </button>
                </div>

                {/* Categories Grid */}
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Cargando categorías...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                      <div key={category.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {category.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {category.product_count || 0} productos
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => openCategoryForm(category)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Editar categoría"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => openDeleteConfirm('category', category)}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar categoría"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProductForm
        isOpen={productFormOpen}
        onClose={closeAllModals}
        onSubmit={selectedProduct ? handleUpdateProduct : handleCreateProduct}
        product={selectedProduct}
        categories={categories}
        isLoading={loading}
      />

      <CategoryForm
        isOpen={categoryFormOpen}
        onClose={closeAllModals}
        onSubmit={selectedCategory ? handleUpdateCategory : handleCreateCategory}
        category={selectedCategory}
        isLoading={loading}
      />

      <StockUpdateForm
        isOpen={stockFormOpen}
        onClose={closeAllModals}
        onSubmit={handleUpdateStock}
        product={selectedProduct}
        isLoading={loading}
      />

      <DeleteConfirmation
        isOpen={deleteConfirmOpen}
        onClose={closeAllModals}
        onConfirm={deleteItem?.type === 'product' ? handleDeleteProduct : handleDeleteCategory}
        title={deleteItem?.type === 'product' ? 'Eliminar Producto' : 'Eliminar Categoría'}
        message={deleteItem?.type === 'product' 
          ? '¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.'
          : '¿Estás seguro de que quieres eliminar esta categoría? Esta acción no se puede deshacer y puede afectar productos asociados.'
        }
        itemName={deleteItem?.name}
        isLoading={loading}
      />
    </div>
  );
}