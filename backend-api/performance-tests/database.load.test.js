import http from 'k6/http';
import { check, group } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

/**
 * K6 Performance Test - Database Operations
 * 
 * Tests performance of database-heavy operations
 * Measures query performance and connection pooling
 */

const dbQueryTrend = new Trend('db_query_time');
const batchInsertTrend = new Trend('batch_insert_time');
const filterTrend = new Trend('filter_time');
const dbErrorRate = new Rate('db_error_rate');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const VUS = __ENV.VUS || 20;

export const options = {
  stages: [
    { duration: '20s', target: VUS },
    { duration: '1m', target: VUS },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    'db_query_time': ['p(95)<500'],
    'batch_insert_time': ['p(95)<2000'],
    'filter_time': ['p(95)<1000'],
    'db_error_rate': ['rate<0.01'],
  },
};

let authToken = '';

export default function () {
  // Setup auth
  if (!authToken) {
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email: 'user@test.com',
      password: 'TestPassword123!',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (loginRes.status === 200) {
      authToken = loginRes.json('token');
    }
  }

  // 1. Complex Query - Products with Filters
  group('Database Queries', function () {
    const startTime = Date.now();
    
    const queryRes = http.get(
      `${BASE_URL}/api/products?category=vegetables&minCalories=50&maxCalories=200&allergens=peanut`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    
    dbQueryTrend.add(Date.now() - startTime);
    
    check(queryRes, {
      'complex query status 200': (r) => r.status === 200,
      'query returns results': (r) => r.json().length > 0,
      'query time < 500ms': (r) => (Date.now() - startTime) < 500,
    });
    
    dbErrorRate.add(queryRes.status !== 200);
  });

  // 2. Batch Insert - Add Multiple Meals to Plan
  group('Batch Operations', function () {
    const meals = [
      { mealId: `meal-${Date.now()}-1`, date: new Date().toISOString().split('T')[0], portion: 100 },
      { mealId: `meal-${Date.now()}-2`, date: new Date().toISOString().split('T')[0], portion: 150 },
      { mealId: `meal-${Date.now()}-3`, date: new Date().toISOString().split('T')[0], portion: 120 },
      { mealId: `meal-${Date.now()}-4`, date: new Date().toISOString().split('T')[0], portion: 110 },
      { mealId: `meal-${Date.now()}-5`, date: new Date().toISOString().split('T')[0], portion: 130 },
    ];
    
    const startTime = Date.now();
    
    const batchRes = http.post(
      `${BASE_URL}/api/meal-plan/batch`,
      JSON.stringify({ meals }),
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    batchInsertTrend.add(Date.now() - startTime);
    
    check(batchRes, {
      'batch insert status 200/201': (r) => r.status === 200 || r.status === 201,
      'batch insert returns count': (r) => r.json('count') === 5,
      'batch insert time < 2000ms': (r) => (Date.now() - startTime) < 2000,
    });
    
    dbErrorRate.add(batchRes.status < 200 || batchRes.status >= 300);
  });

  // 3. Filter Performance - Pagination
  group('Filter Performance', function () {
    const startTime = Date.now();
    
    // Test pagination efficiency
    const filterRes = http.get(
      `${BASE_URL}/api/products?page=1&limit=50&sort=calories&order=desc`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    
    filterTrend.add(Date.now() - startTime);
    
    check(filterRes, {
      'filter status 200': (r) => r.status === 200,
      'filter returns paginated results': (r) => r.json().length <= 50,
      'filter time < 1000ms': (r) => (Date.now() - startTime) < 1000,
    });
    
    dbErrorRate.add(filterRes.status !== 200);
  });

  // 4. Aggregation Query - Nutrition Summary
  group('Aggregation Queries', function () {
    const startTime = Date.now();
    
    const aggRes = http.get(
      `${BASE_URL}/api/nutrition/summary?date=${new Date().toISOString().split('T')[0]}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    
    dbQueryTrend.add(Date.now() - startTime);
    
    check(aggRes, {
      'aggregation status 200': (r) => r.status === 200,
      'aggregation has totals': (r) => r.json('totalCalories') !== undefined,
    });
    
    dbErrorRate.add(aggRes.status !== 200);
  });

  // 5. Large Dataset - Search
  group('Large Dataset Operations', function () {
    const startTime = Date.now();
    
    // Search across large product database
    const searchRes = http.get(
      `${BASE_URL}/api/products?search=chicken&limit=100`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    
    dbQueryTrend.add(Date.now() - startTime);
    
    check(searchRes, {
      'large search status 200': (r) => r.status === 200,
      'large search returns results': (r) => r.json().length > 0,
    });
    
    dbErrorRate.add(searchRes.status !== 200);
  });
}
