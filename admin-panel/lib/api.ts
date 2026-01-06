import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface DashboardStats {
  users: {
    total: number;
    active: number;
    new: number;
  };
  products: {
    total: number;
    pending: number;
  };
  stores: {
    total: number;
    active: number;
  };
  aggregation: {
    lastRun: string;
    status: 'success' | 'error' | 'running';
    productsUpdated: number;
  };
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  type: string;
  price_min: number;
  price_max: number;
  status: 'active' | 'pending' | 'inactive';
  created_at: string;
}

export interface Store {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'inactive';
  last_sync: string;
  products_count: number;
}

export interface Brand {
  id: string;
  name: string;
  verified: boolean;
  products_count: number;
}

// API functions
export const dashboardApi = {
  getStats: () => api.get<{ success: boolean; data: DashboardStats }>('/admin/dashboard/stats').then(res => res.data.data),
};

export const productsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get<{ products: Product[]; total: number }>('/admin/products', { params }),
  getById: (id: string) => api.get<Product>(`/admin/products/${id}`),
  create: (data: Partial<Product>) => api.post<Product>('/admin/products', data),
  update: (id: string, data: Partial<Product>) => api.put<Product>(`/admin/products/${id}`, data),
  delete: (id: string) => api.delete(`/admin/products/${id}`),
};

export const storesApi = {
  getAll: () => api.get<Store[]>('/admin/stores'),
  getById: (id: string) => api.get<Store>(`/admin/stores/${id}`),
  update: (id: string, data: Partial<Store>) => api.put<Store>(`/admin/stores/${id}`, data),
  syncNow: (id: string) => api.post(`/admin/stores/${id}/sync`),
};

export const brandsApi = {
  getAll: () => api.get<Brand[]>('/admin/brands'),
  create: (data: Partial<Brand>) => api.post<Brand>('/admin/brands', data),
  update: (id: string, data: Partial<Brand>) => api.put<Brand>(`/admin/brands/${id}`, data),
  delete: (id: string) => api.delete(`/admin/brands/${id}`),
};
