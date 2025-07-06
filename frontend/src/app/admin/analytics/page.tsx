'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
// import { apiClient } from '@/lib/api'; // TODO: Uncomment when connecting to real API
import { 
  ChartBarIcon,
  ClockIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface ActivityLog {
  id: string;
  user: string;
  action: string;
  details: string;
  ip_address: string;
  timestamp: string;
}

interface AnalyticsData {
  totalActions: number;
  todayActions: number;
  weeklyGrowth: number;
  topActions: Array<{
    action: string;
    count: number;
    percentage: number;
  }>;
  activityByHour: Array<{
    hour: number;
    count: number;
  }>;
  recentLogs: ActivityLog[];
  mostActiveUsers: Array<{
    user: string;
    actions: number;
  }>;
}

export default function AdminAnalytics() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null); // TODO: Add error handling when connecting to real API
  const [timeRange, setTimeRange] = useState('7d');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  // const [logFilters, setLogFilters] = useState({
  //   action: '',
  //   user: '',
  //   startDate: '',
  //   endDate: ''
  // }); // TODO: Add filtering when connecting to real API

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/auth/login');
      return;
    }
    
    fetchAnalytics();
    fetchActivityLogs();
  }, [isAuthenticated, user, router, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // setError(null); // TODO: Uncomment when adding error handling
      
      // Mock data for now - replace with actual API calls
      const mockAnalytics: AnalyticsData = {
        totalActions: 2847,
        todayActions: 47,
        weeklyGrowth: 12.5,
        topActions: [
          { action: 'product_view', count: 892, percentage: 31.3 },
          { action: 'user_login', count: 567, percentage: 19.9 },
          { action: 'product_update', count: 234, percentage: 8.2 },
          { action: 'user_register', count: 189, percentage: 6.6 },
          { action: 'category_create', count: 156, percentage: 5.5 }
        ],
        activityByHour: [
          { hour: 0, count: 12 }, { hour: 1, count: 8 }, { hour: 2, count: 5 },
          { hour: 3, count: 3 }, { hour: 4, count: 4 }, { hour: 5, count: 7 },
          { hour: 6, count: 15 }, { hour: 7, count: 28 }, { hour: 8, count: 45 },
          { hour: 9, count: 52 }, { hour: 10, count: 67 }, { hour: 11, count: 71 },
          { hour: 12, count: 58 }, { hour: 13, count: 48 }, { hour: 14, count: 55 },
          { hour: 15, count: 62 }, { hour: 16, count: 49 }, { hour: 17, count: 38 },
          { hour: 18, count: 32 }, { hour: 19, count: 27 }, { hour: 20, count: 22 },
          { hour: 21, count: 18 }, { hour: 22, count: 14 }, { hour: 23, count: 9 }
        ],
        recentLogs: [
          {
            id: '1',
            user: 'María González',
            action: 'product_create',
            details: 'Creó producto: Martillo de acero',
            ip_address: '192.168.1.100',
            timestamp: '2025-06-24T10:30:00Z'
          },
          {
            id: '2',
            user: 'Carlos Rodríguez',
            action: 'user_update',
            details: 'Actualizó perfil de usuario',
            ip_address: '192.168.1.101',
            timestamp: '2025-06-24T09:15:00Z'
          }
        ],
        mostActiveUsers: [
          { user: 'Juan Pérez', actions: 156 },
          { user: 'María González', actions: 134 },
          { user: 'Carlos Rodríguez', actions: 98 },
          { user: 'Ana Silva', actions: 87 }
        ]
      };
      
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // setError('Error al cargar los datos de analytics'); // TODO: Uncomment when adding error handling
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      setLogsLoading(true);
      
      // Mock data for activity logs
      const mockLogs: ActivityLog[] = [
        {
          id: '1',
          user: 'María González',
          action: 'product_create',
          details: 'Creó producto: Martillo de acero inoxidable 16oz',
          ip_address: '192.168.1.100',
          timestamp: '2025-06-24T10:30:00Z'
        },
        {
          id: '2',
          user: 'Carlos Rodríguez',
          action: 'user_update',
          details: 'Actualizó información de perfil personal',
          ip_address: '192.168.1.101',
          timestamp: '2025-06-24T09:15:00Z'
        },
        {
          id: '3',
          user: 'Ana Silva',
          action: 'category_delete',
          details: 'Eliminó categoría: Herramientas temporales',
          ip_address: '192.168.1.102',
          timestamp: '2025-06-24T08:45:00Z'
        },
        {
          id: '4',
          user: 'Pedro López',
          action: 'stock_update',
          details: 'Actualizó stock de Taladro inalámbrico 18V a 25 unidades',
          ip_address: '192.168.1.103',
          timestamp: '2025-06-24T08:20:00Z'
        },
        {
          id: '5',
          user: 'Juan Pérez',
          action: 'user_login',
          details: 'Inicio de sesión exitoso desde navegador Chrome',
          ip_address: '192.168.1.104',
          timestamp: '2025-06-24T07:50:00Z'
        }
      ];

      setActivityLogs(mockLogs);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const exportData = async (format: 'json' | 'csv') => {
    try {
      // Mock export functionality
      const data = {
        exported_at: new Date().toISOString(),
        time_range: timeRange,
        analytics: analytics,
        activity_logs: activityLogs
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ferremas_analytics_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`Exported data as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
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

  const getMaxActivityHour = () => {
    if (!analytics?.activityByHour) return 0;
    return Math.max(...analytics.activityByHour.map(h => h.count));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Cargando analytics...</p>
          </div>
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
                Analytics y Reportes
              </h1>
              <p className="mt-2 text-gray-600">
                Análisis detallado de la actividad del sistema y comportamiento de usuarios
              </p>
            </div>
            <div className="flex space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="block w-32 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="1d">Últimas 24h</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
              </select>
              <div className="flex space-x-2">
                <button
                  onClick={() => exportData('json')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  JSON
                </button>
                <button
                  onClick={() => exportData('csv')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Acciones
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analytics?.totalActions?.toLocaleString()}
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
                  <ClockIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Actividad Hoy
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analytics?.todayActions}
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
                  {analytics?.weeklyGrowth && analytics.weeklyGrowth >= 0 ? (
                    <ArrowTrendingUpIcon className="h-6 w-6 text-green-400" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-6 w-6 text-red-400" />
                  )}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Crecimiento Semanal
                    </dt>
                    <dd className={`text-lg font-medium ${
                      analytics?.weeklyGrowth && analytics.weeklyGrowth >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {analytics?.weeklyGrowth && analytics.weeklyGrowth > 0 ? '+' : ''}{analytics?.weeklyGrowth}%
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
                  <UsersIcon className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Usuario Más Activo
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {analytics?.mostActiveUsers[0]?.user}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Acciones Más Frecuentes
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analytics?.topActions.map((action, index) => (
                  <div key={action.action} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-green-500' :
                          index === 2 ? 'bg-yellow-500' :
                          index === 3 ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {getActionLabel(action.action)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {action.count.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({action.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity by Hour */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Actividad por Hora
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                {analytics?.activityByHour.map((hourData) => (
                  <div key={hourData.hour} className="flex items-center space-x-3">
                    <div className="w-8 text-xs text-gray-500 text-right">
                      {hourData.hour.toString().padStart(2, '0')}:00
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${(hourData.count / getMaxActivityHour()) * 100}%`
                        }}
                      ></div>
                    </div>
                    <div className="w-8 text-xs text-gray-700 text-right">
                      {hourData.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Most Active Users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Usuarios Más Activos
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analytics?.mostActiveUsers.map((userData, index) => (
                  <div key={userData.user} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {userData.user}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {userData.actions} acciones
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Actividad Reciente
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analytics?.recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-blue-400 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{log.user}</span>{' '}
                        {getActionLabel(log.action).toLowerCase()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(log.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Logs Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Logs de Actividad Detallados
              </h3>
              <button
                onClick={() => router.push('/admin/activity-logs')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                Ver todos
              </button>
            </div>
          </div>
          
          {logsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Cargando logs...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activityLogs.slice(0, 5).map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {log.user}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {log.details}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ip_address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(log.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}