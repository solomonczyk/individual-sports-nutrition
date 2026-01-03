'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, Package, Store, Activity } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';
import { dashboardApi } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats().then(res => res.data),
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

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
          value={stats?.users.total || 0}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Active Users"
          value={stats?.users.active || 0}
          icon={Users}
        />
        <StatCard
          title="Total Products"
          value={stats?.products.total || 0}
          icon={Package}
        />
        <StatCard
          title="Active Stores"
          value={stats?.stores.active || 0}
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
                stats?.aggregation.status === 'success' ? 'success' :
                stats?.aggregation.status === 'error' ? 'error' : 'warning'
              }>
                {stats?.aggregation.status || 'unknown'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Run</span>
              <span className="text-sm font-medium text-gray-900">
                {stats?.aggregation.lastRun ? formatRelativeTime(stats.aggregation.lastRun) : 'Never'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Products Updated</span>
              <span className="text-sm font-medium text-gray-900">
                {stats?.aggregation.productsUpdated || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">Pending Actions</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending Products</span>
              <Badge variant="warning">{stats?.products.pending || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">New Users (7d)</span>
              <Badge variant="info">{stats?.users.new || 0}</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
