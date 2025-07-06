'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
// import { apiClient } from '@/lib/api'; // TODO: Uncomment when connecting to real API
import { 
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface ActivityLog {
  id: string;
  user: string;
  user_id: string;
  action: string;
  details: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

interface LogFilters {
  search: string;
  action: string;
  user: string;
  startDate: string;
  endDate: string;
  ipAddress: string;
}

export default function ActivityLogs() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LogFilters>({
    search: '',
    action: '',
    user: '',
    startDate: '',
    endDate: '',
    ipAddress: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/auth/login');
      return;
    }
    
    fetchLogs();
  }, [isAuthenticated, user, router, currentPage, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for now - replace with actual API call
      const mockLogs: ActivityLog[] = [
        {
          id: '1',
          user: 'María González',
          user_id: 'user-001',
          action: 'product_create',
          details: 'Creó producto: Martillo de acero inoxidable 16oz con mango ergonómico',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: '2025-06-24T10:30:00Z'
        },
        {
          id: '2',
          user: 'Carlos Rodríguez',
          user_id: 'user-002',
          action: 'user_update',
          details: 'Actualizó información de perfil personal - cambió email y teléfono',
          ip_address: '192.168.1.101',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          timestamp: '2025-06-24T09:15:00Z'
        },
        {
          id: '3',
          user: 'Ana Silva',
          user_id: 'user-003',
          action: 'category_delete',
          details: 'Eliminó categoría: Herramientas temporales (contenía 3 productos)',
          ip_address: '192.168.1.102',
          user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          timestamp: '2025-06-24T08:45:00Z'
        },
        {
          id: '4',
          user: 'Pedro López',
          user_id: 'user-004',
          action: 'stock_update',
          details: 'Actualizó stock de Taladro inalámbrico 18V de 15 a 25 unidades',
          ip_address: '192.168.1.103',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: '2025-06-24T08:20:00Z'
        },
        {
          id: '5',
          user: 'Juan Pérez',
          user_id: 'user-005',
          action: 'user_login',
          details: 'Inicio de sesión exitoso desde navegador Chrome versión 119.0',
          ip_address: '192.168.1.104',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: '2025-06-24T07:50:00Z'
        },
        {
          id: '6',
          user: 'Sofía Morales',
          user_id: 'user-006',
          action: 'product_update',
          details: 'Actualizó precio de Sierra circular 7 1/4" de $75,990 a $79,990',
          ip_address: '192.168.1.105',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          timestamp: '2025-06-24T07:30:00Z'
        },
        {
          id: '7',
          user: 'Ricardo Flores',
          user_id: 'user-007',
          action: 'user_register',
          details: 'Nuevo usuario registrado con email ricardo.flores@email.com',
          ip_address: '192.168.1.106',
          user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
          timestamp: '2025-06-24T06:45:00Z'
        },
        {
          id: '8',
          user: 'Valentina Castro',
          user_id: 'user-008',
          action: 'category_create',
          details: 'Creó nueva categoría: Herramientas de Jardín con subcategorías',
          ip_address: '192.168.1.107',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: '2025-06-24T06:15:00Z'
        }
      ];

      // Apply filters
      let filteredLogs = mockLogs;
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.user.toLowerCase().includes(searchTerm) ||
          log.details.toLowerCase().includes(searchTerm) ||
          log.action.toLowerCase().includes(searchTerm)
        );
      }
      
      if (filters.action) {
        filteredLogs = filteredLogs.filter(log => log.action === filters.action);
      }
      
      if (filters.user) {
        filteredLogs = filteredLogs.filter(log => 
          log.user.toLowerCase().includes(filters.user.toLowerCase())
        );
      }
      
      if (filters.ipAddress) {
        filteredLogs = filteredLogs.filter(log => 
          log.ip_address.includes(filters.ipAddress)
        );
      }

      setLogs(filteredLogs);
      setTotalLogs(filteredLogs.length);
      setTotalPages(Math.ceil(filteredLogs.length / 20));
      
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('Error al cargar los logs de actividad');
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async (format: 'json' | 'csv') => {
    try {
      const data = {
        exported_at: new Date().toISOString(),
        filters: filters,
        total_logs: totalLogs,
        logs: logs
      };
      
      let content = '';
      let mimeType = '';
      let filename = '';
      
      if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        filename = `activity_logs_${new Date().toISOString().split('T')[0]}.json`;
      } else {
        // CSV format
        const headers = ['Fecha', 'Usuario', 'Acción', 'Detalles', 'IP', 'User Agent'];
        const csvRows = [headers.join(',')];
        
        logs.forEach(log => {
          const row = [
            new Date(log.timestamp).toLocaleString('es-CL'),
            `"${log.user}"`,
            getActionLabel(log.action),
            `"${log.details.replace(/"/g, '""')}"`,
            log.ip_address,
            `"${log.user_agent.substring(0, 50)}..."`
          ];
          csvRows.push(row.join(','));
        });
        
        content = csvRows.join('\n');
        mimeType = 'text/csv';
        filename = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
      }
      
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting logs:', error);
      setError('Error al exportar los logs');
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      action: '',
      user: '',
      startDate: '',
      endDate: '',
      ipAddress: ''
    });
    setCurrentPage(1);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'product_view': 'Vista de producto',
      'user_login': 'Inicio de sesión',
      'product_update': 'Actualización de producto',
      'user_register': 'Registro de usuario',
      'category_create': 'Creación de categoría',
      'product_create': 'Creación de producto',
      'user_update': 'Actualización de usuario',
      'category_delete': 'Eliminación de categoría',
      'stock_update': 'Actualización de stock'
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'product_create': 'bg-green-100 text-green-800',
      'product_update': 'bg-blue-100 text-blue-800',
      'product_delete': 'bg-red-100 text-red-800',
      'user_login': 'bg-purple-100 text-purple-800',
      'user_register': 'bg-green-100 text-green-800',
      'user_update': 'bg-blue-100 text-blue-800',
      'category_create': 'bg-yellow-100 text-yellow-800',
      'category_update': 'bg-blue-100 text-blue-800',
      'category_delete': 'bg-red-100 text-red-800',
      'stock_update': 'bg-orange-100 text-orange-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Acceso restringido</h3>
          <p className="mt-1 text-sm text-gray-500">
            Necesitas permisos de administrador para acceder a esta página.
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Logs de Actividad
              </h1>
              <p className="mt-2 text-gray-600">
                Registro detallado de todas las acciones realizadas en el sistema
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => exportLogs('json')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Exportar JSON
              </button>
              <button
                onClick={() => exportLogs('csv')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Buscar en logs..."
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                    showFilters 
                      ? 'border-blue-300 text-blue-700 bg-blue-50'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  Filtros
                </button>
                {(filters.search || filters.action || filters.user || filters.ipAddress) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Acción
                    </label>
                    <select
                      value={filters.action}
                      onChange={(e) => setFilters({...filters, action: e.target.value})}
                      className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Todas las acciones</option>
                      <option value="user_login">Inicio de sesión</option>
                      <option value="user_register">Registro de usuario</option>
                      <option value="user_update">Actualización de usuario</option>
                      <option value="product_create">Creación de producto</option>
                      <option value="product_update">Actualización de producto</option>
                      <option value="product_delete">Eliminación de producto</option>
                      <option value="category_create">Creación de categoría</option>
                      <option value="category_update">Actualización de categoría</option>
                      <option value="category_delete">Eliminación de categoría</option>
                      <option value="stock_update">Actualización de stock</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usuario
                    </label>
                    <input
                      type="text"
                      value={filters.user}
                      onChange={(e) => setFilters({...filters, user: e.target.value})}
                      className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nombre de usuario..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección IP
                    </label>
                    <input
                      type="text"
                      value={filters.ipAddress}
                      onChange={(e) => setFilters({...filters, ipAddress: e.target.value})}
                      className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="192.168.1.100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha inicio
                    </label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                      className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha fin
                    </label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                      className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Logs Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Registros de Actividad ({totalLogs.toLocaleString()})
              </h3>
              <div className="text-sm text-gray-500">
                Página {currentPage} de {totalPages}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Cargando logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <EyeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay logs</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron registros con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Detalles
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.slice((currentPage - 1) * 20, currentPage * 20).map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTime(log.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {log.user}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {log.user_id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                          <div className="truncate" title={log.details}>
                            {log.details}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {log.ip_address}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-xs" title={log.user_agent}>
                            {log.user_agent.substring(0, 30)}...
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando{' '}
                      <span className="font-medium">{((currentPage - 1) * 20) + 1}</span>
                      {' '}a{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * 20, totalLogs)}
                      </span>
                      {' '}de{' '}
                      <span className="font-medium">{totalLogs}</span>
                      {' '}registros
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeftIcon className="h-5 w-5" />
                      </button>
                      
                      {[...Array(Math.min(5, totalPages))].map((_, index) => {
                        const page = index + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}