import { Request, Response } from 'express';

export const mockRequest = (overrides?: Partial<Request>): Partial<Request> => ({
  query: {},
  params: {},
  body: {},
  headers: {},
  ...overrides,
});

export const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
  };
  return res;
};

export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
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
};

export const mockProduct = {
  id: 'test-product-id',
  name: 'Test Protein',
  brand: 'Test Brand',
  type: 'protein',
  price_min: 2000,
  price_max: 3000,
  status: 'active',
};

export const mockDish = {
  id: 'test-dish-id',
  name: 'Test Dish',
  name_sr: 'Тест јело',
  name_en: 'Test Dish',
  category: 'main',
  calories_per_100g: 250,
  protein_per_100g: 20,
  carbs_per_100g: 30,
  fat_per_100g: 10,
  is_popular: true,
};
