import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react-native';
export { customRender as render };

// Mock data generators
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
};

export const mockHealthProfile = {
  id: 'test-profile-id',
  user_id: 'test-user-id',
  gender: 'male',
  age: 25,
  height: 180,
  weight: 80,
  activity_level: 'moderate',
  goal: 'muscle_gain',
  health_conditions: [],
  medications: [],
};

export const mockProduct = {
  id: 'test-product-id',
  name: 'Test Protein',
  brand: 'Test Brand',
  type: 'protein',
  price_min: 2000,
  price_max: 3000,
  status: 'active',
  created_at: new Date().toISOString(),
};

export const mockDish = {
  id: 'test-dish-id',
  name: 'Test Dish',
  name_sr: 'Тест јело',
  name_en: 'Test Dish',
  description_sr: 'Опис',
  description_en: 'Description',
  category: 'main',
  calories_per_100g: 250,
  protein_per_100g: 20,
  carbs_per_100g: 30,
  fat_per_100g: 10,
  typical_serving_size: 200,
  is_popular: true,
};

// Mock API responses
export const mockApiSuccess = <T,>(data: T) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {},
});

export const mockApiError = (message: string, status: number = 500) => ({
  response: {
    data: { error: message },
    status,
    statusText: 'Error',
    headers: {},
    config: {},
  },
});
