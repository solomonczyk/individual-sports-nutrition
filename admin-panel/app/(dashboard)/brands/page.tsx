'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import { Table } from '@/components/Table';
import { Button } from '@/components/Button';
import { brandsApi, Brand } from '@/lib/api';

export default function BrandsPage() {
  const { data: brands, isLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: () => brandsApi.getAll().then(res => res.data),
  });

  const columns = [
    {
      key: 'name',
      label: 'Brand Name',
      render: (brand: Brand) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{brand.name}</span>
          {brand.verified && (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
        </div>
      ),
    },
    {
      key: 'products_count',
      label: 'Products',
    },
    {
      key: 'verified',
      label: 'Verified',
      render: (brand: Brand) => (
        brand.verified ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-gray-400" />
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage product brands
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Add Brand
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : (
        <Table
          data={brands || []}
          columns={columns}
          onRowClick={(brand) => console.log('View brand:', brand.id)}
        />
      )}
    </div>
  );
}
