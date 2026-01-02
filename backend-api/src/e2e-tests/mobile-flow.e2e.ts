import { test, expect } from '@playwright/test';

/**
 * E2E API Tests: Mobile App Simulation Flow
 * 
 * Simulates a typical mobile user session:
 * 1. App Start / Auth Check
 * 2. Fetch User Profile
 * 3. Fetch Dashboard Data (Meal Plan)
 */

const BASE_URL = '/api/v1';

test.describe('Mobile App Simulation Flow', () => {
    let token = '';
    const uniqueId = Date.now();
    const userEmail = `mobile_test_${uniqueId}@example.com`;

    test('Full User Journey', async ({ request }) => {
        // 1. REGISTER
        const registerRes = await request.post(`${BASE_URL}/auth/register`, {
            data: {
                email: userEmail,
                password: 'MobilePass123!',
                name: 'Mobile User'
            }
        });
        expect(registerRes.ok()).toBeTruthy();
        const authData = await registerRes.json();
        token = authData.data.token;
        expect(token).toBeTruthy();

        // 2. SETUP PROFILE (Onboarding)
        const profileRes = await request.post(`${BASE_URL}/health-profile`, {
            headers: { Authorization: `Bearer ${token}` },
            data: {
                age: 28,
                weight: 80,
                height: 182,
                gender: 'male',
                activityLevel: 'moderate',
                goal: 'gain_muscle'
            }
        });
        expect(profileRes.ok()).toBeTruthy();

        // 3. DASHBOARD LOAD (Fetch Profile + Daily Plan)

        // Fetch Profile
        const getProfile = await request.get(`${BASE_URL}/health-profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        expect(getProfile.ok()).toBeTruthy();
        const profileData = await getProfile.json();
        expect(profileData.data.activityLevel).toBe('moderate');

        // Fetch Daily Plan (trigger generation if missing)
        const today = new Date().toISOString().split('T')[0];
        const getPlan = await request.get(`${BASE_URL}/meal-plan/daily/${today}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // If 404, app usually requests generation
        if (getPlan.status() === 404) {
            const generate = await request.post(`${BASE_URL}/meal-plan/generate`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { date: today }
            });
            expect(generate.ok()).toBeTruthy();
        } else {
            expect(getPlan.ok()).toBeTruthy();
        }
    });
});
