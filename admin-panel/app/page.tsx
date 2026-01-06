'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, Package, Store } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';
import { dashboardApi } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Provide default values if stats is undefined
  const safeStats = stats || {
    users: { total: 0, active: 0, new: 0 },
    products: { total: 0, pending: 0 },
    stores: { total: 0, active: 0 },
    aggregation: { lastRun: '', status: 'unknown' as const, productsUpdated: 0 }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your sports nutrition platform
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={safeStats.users.total}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Active Users"
          value={safeStats.users.active}
          icon={Users}
        />
        <StatCard
          title="Total Products"
          value={safeStats.products.total}
          icon={Package}
        />
        <StatCard
          title="Active Stores"
          value={safeStats.stores.active}
          icon={Store}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">Aggregation Status</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <Badge variant={
                safeStats.aggregation.status === 'success' ? 'success' :
                safeStats.aggregation.status === 'error' ? 'error' : 'warning'
              }>
                {safeStats.aggregation.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Run</span>
              <span className="text-sm font-medium text-gray-900">
                {safeStats.aggregation.lastRun ? formatRelativeTime(safeStats.aggregation.lastRun) : 'Never'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Products Updated</span>
              <span className="text-sm font-medium text-gray-900">
                {safeStats.aggregation.productsUpdated}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">Pending Actions</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending Products</span>
              <Badge variant="warning">{safeStats.products.pending}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">New Users (7d)</span>
              <Badge variant="info">{safeStats.users.new}</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
