# Backend API Testing Guide

## Overview

This document covers the test setup, execution, and best practices for `backend-api`.

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Install Test Dependencies

Test dependencies are already configured in `package.json`:

```bash
npm install
```

Key testing libraries:
- **vitest** — Fast unit test framework (already installed)
- **supertest** — HTTP assertion library for testing Express (added)
- **@vitest/coverage-v8** — Code coverage reporting (added)

## Running Tests

### Run all tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Generate coverage report

```bash
npm run test:coverage
```

Coverage report will be generated in `coverage/` directory. Open `coverage/index.html` in browser to view detailed report.

## Test Structure

```
src/
├── __tests__/
│   ├── setup.ts                          # Global test setup
│   ├── integration/
│   │   ├── recommendations.integration.test.ts  # Recommendation endpoint tests
│   │   ├── health.integration.test.ts           # Health check tests
│   │   └── ...
│   ├── unit/
│   │   ├── services/
│   │   │   ├── recommendation.service.test.ts
│   │   │   └── ...
│   │   └── controllers/
│   │       └── ...
│   └── fixtures/
│       └── data.ts                       # Test data fixtures
```

## Test Files

### Integration Tests

Located in `src/__tests__/integration/`, these test entire endpoint flows.

**Example: `recommendations.integration.test.ts`**

```typescript
describe('Recommendations API', () => {
  describe('GET /api/v1/recommendations', () => {
    it('should return 400 if X-User-ID header is missing', async () => {
      const response = await request(app)
        .get('/api/v1/recommendations')
        .expect(400)
      
      expect(response.body.success).toBe(false)
    })
  })
})
```

### Unit Tests

Located in `src/__tests__/unit/`, these test individual functions/services.

### Setup File

`src/__tests__/setup.ts` runs before all tests and:
- Sets up environment variables
- Initializes mocks
- Configures global test behavior

## Writing Tests

### Basic Integration Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

const createApp = () => {
  const app = express()
  // ... configure app
  return app
}

describe('Endpoint Name', () => {
  let app: Express.Application
  
  beforeEach(() => {
    app = createApp()
  })
  
  it('should return correct status code', async () => {
    const response = await request(app)
      .get('/api/v1/endpoint')
      .set('x-user-id', 'user-123')
      .expect(200)
    
    expect(response.body).toHaveProperty('data')
  })
})
```

### Testing Headers

```typescript
it('should require X-User-ID header', async () => {
  const response = await request(app)
    .get('/api/v1/endpoint')
    .expect(400)
})

it('should work with X-User-ID header', async () => {
  const response = await request(app)
    .get('/api/v1/endpoint')
    .set('x-user-id', 'user-123')
    .expect(200)
})
```

### Testing Query Parameters

```typescript
it('should accept query parameters', async () => {
  const response = await request(app)
    .get('/api/v1/endpoint')
    .set('x-user-id', 'user-123')
    .query({ goal: 'mass', limit: 10 })
    .expect(200)
})
```

### Testing Request Body

```typescript
it('should accept POST request with JSON body', async () => {
  const response = await request(app)
    .post('/api/v1/endpoint')
    .set('x-user-id', 'user-123')
    .send({
      name: 'John',
      age: 28,
    })
    .expect(200)
  
  expect(response.body).toHaveProperty('id')
})
```

## Assertions

Common vitest assertions:

```typescript
// Existence
expect(value).toBeDefined()
expect(value).toBeNull()

// Equality
expect(value).toBe(5)
expect(obj).toEqual({ name: 'John' })

// Type checks
expect(value).toBeString()
expect(value).toBeNumber()
expect(value).toBeArray()

// String operations
expect(str).toContain('substring')
expect(str).toMatch(/regex/)

// Array/Object operations
expect(array).toHaveLength(3)
expect(obj).toHaveProperty('key')
expect(array).toContain(item)

// Comparisons
expect(value).toBeGreaterThan(5)
expect(value).toBeLessThanOrEqual(10)
```

## Test Coverage Goals

| Module | Target | Current Status |
|--------|--------|----------------|
| Controllers | 80% | 🔨 In Progress |
| Services | 80% | 🔨 In Progress |
| Middleware | 60% | 🔨 In Progress |
| Routes | 40% | 🔨 In Progress |
| **Overall** | **60%** | 🔨 In Progress |

## Mocking

### Mock Environment Variables

Configured in `src/__tests__/setup.ts`:

```typescript
beforeAll(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  process.env.JWT_SECRET = 'test-secret'
})
```

### Mock Database (Example)

```typescript
import { vi } from 'vitest'

// Mock database module
vi.mock('../services/database', () => ({
  query: vi.fn().mockResolvedValue({ rows: [] }),
}))

// Use in tests
import { query } from '../services/database'

it('should call database', async () => {
  expect(query).toHaveBeenCalled()
})
```

### Mock External HTTP Calls

```typescript
import { vi } from 'vitest'

vi.mock('node-fetch', () => ({
  default: vi.fn().mockResolvedValue({
    json: async () => ({ data: [] }),
  }),
}))
```

## Debugging Tests

### Run single test file

```bash
npm test -- src/__tests__/integration/recommendations.integration.test.ts
```

### Run tests matching pattern

```bash
npm test -- --grep "should return"
```

### Enable debug output

```bash
DEBUG=* npm test
```

### Use console.log in tests (will show with `--reporter=verbose`)

```bash
npm test -- --reporter=verbose
```

## CI/CD Integration

Tests should pass before merge:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage

- name: Check coverage threshold
  run: npm test -- --coverage --coverage.lines 60
```

## Best Practices

1. **Descriptive test names** — Use `it('should do X when Y happens')`
2. **One assertion per test** — Or logically related assertions
3. **Setup and teardown** — Use `beforeEach`/`afterEach`
4. **Mock external dependencies** — Don't hit real DB/API
5. **Test edge cases** — Not just happy path
6. **Use fixtures** — Reusable test data
7. **Keep tests fast** — < 100ms per test ideally
8. **Avoid test interdependence** — Each test should be independent

## Troubleshooting

### Tests fail with "Cannot find module"

Ensure `vitest.config.ts` is correct and all imports use proper paths.

### Database connection errors in tests

Use mocked database or test database. Check `DATABASE_URL` in `src/__tests__/setup.ts`.

### Timeout errors

Increase timeout for async operations:

```typescript
it('should fetch data', async () => {
  // test code
}, { timeout: 5000 })
```

### Coverage not generated

Ensure `@vitest/coverage-v8` is installed:

```bash
npm install --save-dev @vitest/coverage-v8
```

---

## Next Steps

1. ✅ Setup vitest, supertest, coverage (DONE)
2. ✅ Create integration tests for recommendations endpoints (DONE)
3. ✅ Create health check tests (DONE)
4. **TODO:** Add unit tests for services
5. **TODO:** Add tests for auth middleware
6. **TODO:** Add tests for error handling
7. **TODO:** Reach 60%+ coverage goal

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
