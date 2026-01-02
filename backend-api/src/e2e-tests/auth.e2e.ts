import { test, expect } from '@playwright/test';

/**
 * E2E API Tests: User Registration & Authentication Flow
 * 
 * Target: Backend API (http://localhost:3000)
 * 
 * Flows:
 * 1. Register new user
 * 2. Login with credentials
 * 3. Verify JWT token reception
 * 4. Error handling (duplicates, invalid data)
 */

const BASE_URL = '/api/v1';

test.describe('Auth API Flow', () => {
    test.describe.configure({ mode: 'serial' });
    const uniqueId = Date.now();
    const testUser = {
        email: `e2e_test_${uniqueId}@example.com`,
        password: 'TestPassword123!',
        name: 'E2E Test User',
        // Optional fields depending on your schema, keeping minimal for registration
    };

    test('should register a new user successfully', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/auth/register`, {
            data: {
                email: testUser.email,
                password: testUser.password,
                name: testUser.name
            }
        });

        // Debugging 
        if (!response.ok()) {
            console.log(await response.json());
        }

        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(201); // Assuming 201 Created

        const body = await response.json();
        expect(body.data).toHaveProperty('token');
        expect(body.data.user).toHaveProperty('email', testUser.email);
    });

    test('should login with created user', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/auth/login`, {
            data: {
                email: testUser.email,
                password: testUser.password
            }
        });

        // Debugging 
        if (!response.ok()) {
            console.log('Login failed:', await response.json());
        }

        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.data).toHaveProperty('token');
        expect(typeof body.data.token).toBe('string');
    });

    test('should fail to register with duplicate email', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/auth/register`, {
            data: {
                email: testUser.email,
                password: testUser.password,
                name: 'Duplicate User'
            }
        });

        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(409); // Assuming 409 Conflict
    });

    test('should fail login with wrong password', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/auth/login`, {
            data: {
                email: testUser.email,
                password: 'WrongPassword'
            }
        });

        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(401); // Assuming 401 Unauthorized
    });
});
