import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Trend, Gauge, Rate } from 'k6/metrics';

/**
 * K6 Performance Testing Script
 * 
 * Tests API performance under realistic load
 * Simulates user behavior patterns
 * Measures response times and error rates
 */

// Performance metrics
const loginCounter = new Counter('login_requests');
const mealListCounter = new Counter('meal_list_requests');
const recommendationCounter = new Counter('recommendation_requests');

const loginTrend = new Trend('login_response_time');
const mealListTrend = new Trend('meal_list_response_time');
const recommendationTrend = new Trend('recommendation_response_time');

const loginErrorRate = new Rate('login_error_rate');
const apiErrorRate = new Rate('api_error_rate');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const DURATION = __ENV.DURATION || '1m';
const VUS = __ENV.VUS || 10; // Virtual Users
const RAMP_UP = __ENV.RAMP_UP || '30s';

export const options = {
  stages: [
    { duration: RAMP_UP, target: VUS },           // Ramp up
    { duration: DURATION, target: VUS },          // Stay at VUS
    { duration: '30s', target: 0 },               // Ramp down
  ],
  thresholds: {
    // 95% of requests should be < 500ms
    'login_response_time': ['p(95)<500'],
    'meal_list_response_time': ['p(95)<1000'],
    'recommendation_response_time': ['p(95)<2000'],
    
    // Error rate should be < 1%
    'login_error_rate': ['rate<0.01'],
    'api_error_rate': ['rate<0.01'],
    
    // HTTP status check - 99% should pass
    'http_req_duration': ['p(99)<3000'],
    'http_req_failed': ['rate<0.01'],
  },
};

// Test data
const testUsers = [
  { email: 'user1@test.com', password: 'TestPassword123!' },
  { email: 'user2@test.com', password: 'TestPassword123!' },
  { email: 'user3@test.com', password: 'TestPassword123!' },
];

let authToken = '';

export default function () {
  // 1. Login Test
  group('Authentication', function () {
    const user = testUsers[Math.floor(Math.random() * testUsers.length)];
    
    const loginPayload = JSON.stringify({
      email: user.email,
      password: user.password,
    });
    
    const loginResponse = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    loginCounter.add(1);
    loginTrend.add(loginResponse.timings.duration);
    
    const loginSuccess = check(loginResponse, {
      'login status is 200': (r) => r.status === 200,
      'login returns token': (r) => r.json('token') !== undefined,
      'login time < 500ms': (r) => r.timings.duration < 500,
    });
    
    loginErrorRate.add(!loginSuccess);
    
    if (loginSuccess) {
      authToken = loginResponse.json('token');
    }
  });

  sleep(1);

  // 2. Get User Profile
  group('User Profile', function () {
    const profileResponse = http.get(`${BASE_URL}/api/users/profile`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    check(profileResponse, {
      'profile status is 200': (r) => r.status === 200,
      'profile has user data': (r) => r.json('id') !== undefined,
    });
    
    apiErrorRate.add(profileResponse.status !== 200);
  });

  sleep(1);

  // 3. Get Meal Recommendations
  group('Meal Recommendations', function () {
    const mealsResponse = http.get(`${BASE_URL}/api/meals?limit=10`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    mealListCounter.add(1);
    mealListTrend.add(mealsResponse.timings.duration);
    
    const mealsSuccess = check(mealsResponse, {
      'meals status is 200': (r) => r.status === 200,
      'meals returns array': (r) => Array.isArray(r.json()),
      'meals time < 1000ms': (r) => r.timings.duration < 1000,
    });
    
    apiErrorRate.add(!mealsSuccess);
  });

  sleep(1);

  // 4. Get Recommendations
  group('AI Recommendations', function () {
    const recsResponse = http.get(`${BASE_URL}/api/recommendations`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    recommendationCounter.add(1);
    recommendationTrend.add(recsResponse.timings.duration);
    
    const recsSuccess = check(recsResponse, {
      'recommendations status is 200': (r) => r.status === 200,
      'recommendations returns array': (r) => Array.isArray(r.json()),
      'recommendations time < 2000ms': (r) => r.timings.duration < 2000,
    });
    
    apiErrorRate.add(!recsSuccess);
  });

  sleep(1);

  // 5. Search Products
  group('Product Search', function () {
    const searchResponse = http.get(`${BASE_URL}/api/products?search=apple`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    check(searchResponse, {
      'search status is 200': (r) => r.status === 200,
      'search returns results': (r) => Array.isArray(r.json()),
    });
    
    apiErrorRate.add(searchResponse.status !== 200);
  });

  sleep(1);

  // 6. Add Meal to Plan
  group('Meal Planning', function () {
    const mealPayload = JSON.stringify({
      mealId: 'meal-123',
      date: new Date().toISOString().split('T')[0],
      portion: 100,
    });
    
    const addMealResponse = http.post(`${BASE_URL}/api/meal-plan/meals`, mealPayload, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    check(addMealResponse, {
      'add meal status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'add meal returns meal data': (r) => r.json('id') !== undefined,
    });
    
    apiErrorRate.add(addMealResponse.status < 200 || addMealResponse.status >= 300);
  });

  sleep(1);

  // 7. Get Daily Nutrition Summary
  group('Nutrition Summary', function () {
    const summaryResponse = http.get(
      `${BASE_URL}/api/nutrition/summary?date=${new Date().toISOString().split('T')[0]}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    check(summaryResponse, {
      'summary status is 200': (r) => r.status === 200,
      'summary has nutrition data': (r) => r.json('calories') !== undefined,
    });
    
    apiErrorRate.add(summaryResponse.status !== 200);
  });

  sleep(2);
}

/**
 * Spike Test - Test system under sudden load increase
 * 
 * Uncomment to use instead of default
 */
/*
export const spikeOptions = {
  stages: [
    { duration: '10s', target: 10 },   // Ramp up slowly
    { duration: '1m', target: 10 },    // Stay at 10
    { duration: '10s', target: 100 },  // Spike to 100
    { duration: '1m', target: 100 },   // Stay at 100
    { duration: '10s', target: 10 },   // Back to 10
    { duration: '1m', target: 0 },     // Ramp down
  ],
};
*/

/**
 * Stress Test - Test system limits
 * 
 * Uncomment to use instead of default
 */
/*
export const stressOptions = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100
    { duration: '5m', target: 100 },   // Stay at 100
    { duration: '2m', target: 200 },   // Ramp up to 200
    { duration: '5m', target: 200 },   // Stay at 200
    { duration: '2m', target: 300 },   // Ramp up to 300
    { duration: '5m', target: 300 },   // Stay at 300
    { duration: '10m', target: 0 },    // Ramp down
  ],
};
*/
