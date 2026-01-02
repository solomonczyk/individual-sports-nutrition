import { test, expect } from '@playwright/test';

/**
 * E2E API Tests: Meal Plan Flow
 * 
 * Target: Backend API (http://localhost:3000)
 */

const BASE_URL = '/api/v1';

test.describe('Meal Plan API Flow', () => {
    let token = '';

    test.beforeAll(async ({ request }) => {
        // Register a user
        const uniqueId = Date.now();
        const registerRes = await request.post(`${BASE_URL}/auth/register`, {
            data: {
                email: `meal_test_${uniqueId}@example.com`,
                password: 'TestPassword123!',
                name: 'Meal Tester'
            }
        });
        const body = await registerRes.json();
        token = body.data.token;

        // Create health profile first (usually required for meal plans)
        await request.post(`${BASE_URL}/health-profile`, {
            headers: { Authorization: `Bearer ${token}` },
            data: {
                age: 25,
                weight: 70,
                height: 175,
                gender: 'female',
                activityLevel: 'active',
                goal: 'lose_weight'
            }
        });
    });

    test('should generate a daily meal plan', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/meal-plan/generate`, {
            headers: { Authorization: `Bearer ${token}` },
            data: {
                date: new Date().toISOString().split('T')[0] // today YYYY-MM-DD
            }
        });

        const body = await response.json();
        expect(body.data).toHaveProperty('meals');
        expect(Array.isArray(body.data.meals)).toBeTruthy();
        // Assuming 3 main meals + snacks logic
        expect(body.data.meals.length).toBeGreaterThan(0);
    });

    test('should retrieve daily meal plan', async ({ request }) => {
        // Assuming /daily gets today's plan by default or we pass date
        const response = await request.get(`${BASE_URL}/meal-plan/daily`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body).toHaveProperty('meals');
    });

    test('should generate a weekly meal plan', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/meal-plan/weekly`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        // Assuming it returns an array of daily plans or object with days
        expect(body).toBeTruthy(); // Structure depends on implementation
    });
});
