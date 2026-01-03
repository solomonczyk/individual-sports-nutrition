'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus } from 'lucide-react';
import { Table } from '@/components/Table';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { productsApi, Product } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search],
    queryFn: () => productsApi.getAll({ page, limit: 20, search }).then(res => res.data),
  });

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (product: Product) => (
        <div>
          <div className="font-medium">{product.name}</div>
          <div className="text-xs text-gray-500">{product.brand}</div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
    },
    {
      key: 'price',
      label: 'Price Range',
      render: (product: Product) => (
        <span>
          {formatCurrency(product.price_min)} - {formatCurrency(product.price_max)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (product: Product) => (
        <Badge variant={
          product.status === 'active' ? 'success' :
          product.status === 'pending' ? 'warning' : 'default'
        }>
          {product.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your product catalog
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : (
        <Table
          data={data?.products || []}
          columns={columns}
          onRowClick={(product) => console.log('View product:', product.id)}
        />
      )}

      {data && data.total > 20 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="secondary"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            disabled={page * 20 >= data.total}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
