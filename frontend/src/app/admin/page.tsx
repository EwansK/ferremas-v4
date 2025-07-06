'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
// import { apiClient } from '@/lib/api'; // TODO: Uncomment when connecting to real API
import { 
  UsersIcon,
  ChartBarIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  users: {
    total: number;
    customers: number;
    managers: number;
    admins: number;
    active: number;
    inactive: number;
  };
  activity: {
    totalActions: number;
    todayActions: number;
    mostActiveUser: string;
    recentActivity: Array<{
      id: string;
      user: string;
      action: string;
      timestamp: string;
    }>;
  };
  system: {
    uptime: number;
    status: string;
    lastBackup: string;
  };
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/auth/login');
      return;
    }
    
    fetchDashboardData();
  }, [isAuthenticated, user, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for now - replace with actual API calls
      const mockStats: DashboardStats = {
        users: {
          total: 156,
          customers: 142,
          managers: 12,
          admins: 2,
          active: 148,
          inactive: 8
        },
        activity: {
          totalActions: 2847,
          todayActions: 47,
          mostActiveUser: 'Juan Pérez',
          recentActivity: [
            { id: '1', user: 'María González', action: 'Producto creado', timestamp: '2025-06-24T10:30:00Z' },
            { id: '2', user: 'Carlos Rodríguez', action: 'Usuario actualizado', timestamp: '2025-06-24T09:15:00Z' },
            { id: '3', user: 'Ana Silva', action: 'Categoría eliminada', timestamp: '2025-06-24T08:45:00Z' },
            { id: '4', user: 'Pedro López', action: 'Stock actualizado', timestamp: '2025-06-24T08:20:00Z' },
          ]
        },
        system: {
          uptime: 99.9,
          status: 'healthy',
          lastBackup: '2025-06-24T06:00:00Z'
        }
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
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
            <p className="mt-4 text-gray-500">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Error</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
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
          <h1 className="text-3xl font-bold text-gray-900">
            Panel de Administración
          </h1>
          <p className="mt-2 text-gray-600">
            Gestiona usuarios, empleados y monitorea la actividad del sistema
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => router.push('/admin/users')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <UsersIcon className="h-4 w-4 mr-2" />
              Gestionar Usuarios
            </button>
            <button
              onClick={() => router.push('/admin/analytics')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Ver Analytics
            </button>
            <button
              onClick={() => router.push('/admin/activity-logs')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              Logs de Actividad
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Usuarios
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.users.total}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Usuarios Activos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.users.active}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Activity */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Actividad Hoy
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.activity.todayActions}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Estado Sistema
                    </dt>
                    <dd className="text-lg font-medium text-green-600">
                      Operativo
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Statistics */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Distribución de Usuarios
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Clientes</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats?.users.customers}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Managers</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats?.users.managers}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Administradores</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats?.users.admins}
                  </span>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Activos</span>
                    <span className="text-sm font-medium text-green-600">
                      {stats?.users.active}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">Inactivos</span>
                    <span className="text-sm font-medium text-red-600">
                      {stats?.users.inactive}
                    </span>
                  </div>
                </div>
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
                {stats?.activity.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user}</span>{' '}
                        {activity.action.toLowerCase()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/admin/activity-logs')}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Ver todos los logs
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Información del Sistema
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <dt className="text-sm font-medium text-gray-500">Uptime</dt>
                  <dd className="text-2xl font-bold text-green-600">
                    {stats?.system.uptime}%
                  </dd>
                </div>
                <div className="text-center">
                  <dt className="text-sm font-medium text-gray-500">Estado</dt>
                  <dd className="text-2xl font-bold text-green-600 capitalize">
                    {stats?.system.status}
                  </dd>
                </div>
                <div className="text-center">
                  <dt className="text-sm font-medium text-gray-500">Último Backup</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatTime(stats?.system.lastBackup || '')}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}