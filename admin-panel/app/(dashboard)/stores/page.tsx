'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { Table } from '@/components/Table';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { storesApi, Store } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

export default function StoresPage() {
  const queryClient = useQueryClient();

  const { data: stores, isLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storesApi.getAll().then(res => res.data),
  });

  const syncMutation = useMutation({
    mutationFn: (storeId: string) => storesApi.syncNow(storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });

  const columns = [
    {
      key: 'name',
      label: 'Store Name',
      render: (store: Store) => (
        <div>
          <div className="font-medium">{store.name}</div>
          <div className="text-xs text-gray-500">{store.url}</div>
        </div>
      ),
    },
    {
      key: 'products_count',
      label: 'Products',
    },
    {
      key: 'last_sync',
      label: 'Last Sync',
      render: (store: Store) => (
        <span className="text-sm text-gray-600">
          {store.last_sync ? formatRelativeTime(store.last_sync) : 'Never'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (store: Store) => (
        <Badge variant={store.status === 'active' ? 'success' : 'default'}>
          {store.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (store: Store) => (
        <Button
          size="sm"
          variant="secondary"
          loading={syncMutation.isPending}
          onClick={(e) => {
            e.stopPropagation();
            syncMutation.mutate(store.id);
          }}
        >
          <RefreshCw className="h-4 w-4" />
          Sync Now
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stores</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage partner stores and integrations
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : (
        <Table data={stores || []} columns={columns} />
      )}
    </div>
  );
}
