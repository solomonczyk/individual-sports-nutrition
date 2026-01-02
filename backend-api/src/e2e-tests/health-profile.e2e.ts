import { test, expect } from '@playwright/test';

/**
 * E2E API Tests: Health Profile Flow
 * 
 * Target: Backend API (http://localhost:3000)
 */

const BASE_URL = '/api/v1';

test.describe('Health Profile API Flow', () => {
  let token = '';

  test.beforeAll(async ({ request }) => {
    // Register a user to get token
    const uniqueId = Date.now();
    const registerRes = await request.post(`${BASE_URL}/auth/register`, {
      data: {
        email: `profile_test_${uniqueId}@example.com`,
        password: 'TestPassword123!',
        name: 'Profile Tester'
      }
    });
    expect(registerRes.ok()).toBeTruthy();
    const body = await registerRes.json();
    token = body.data.token;
  });

  test('should create health profile successfully', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/health-profile`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        age: 30,
        weight: 75,
        height: 180,
        gender: 'male',
        activityLevel: 'moderate',
        goal: 'maintain',
        dietaryPreferences: ['vegetarian'],
        allergens: ['nuts']
      }
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.data).toHaveProperty('id');
    expect(body.data.age).toBe(30);
  });

  test('should retrieve health profile', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/health-profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(Number(body.data.weight)).toBe(75);
    // Add more assertions based on your response structure
  });

  test('should update health profile', async ({ request }) => {
    const response = await request.put(`${BASE_URL}/health-profile`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        weight: 72 // Updated weight
      }
    });

    expect(response.ok()).toBeTruthy();

    // Verify update
    const getRes = await request.get(`${BASE_URL}/health-profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const body = await getRes.json();
    expect(Number(body.data.weight)).toBe(72);
  });

  test('should validate input data', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/health-profile`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        age: 12, // Too young maybe?
        weight: -5 // Invalid
      }
    });

    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(400);
  });
});
