# Testing Guide

Comprehensive testing guide for the Individual Sports Nutrition platform.

## Table of Contents

1. [Overview](#overview)
2. [Mobile App Testing](#mobile-app-testing)
3. [Backend API Testing](#backend-api-testing)
4. [Admin Panel Testing](#admin-panel-testing)
5. [Running Tests](#running-tests)
6. [Coverage Reports](#coverage-reports)
7. [Best Practices](#best-practices)

---

## Overview

The project uses a comprehensive testing strategy:

- **Unit Tests** - Test individual components and functions
- **Integration Tests** - Test API endpoints and service interactions
- **E2E Tests** - Test complete user flows (basic setup provided)

### Testing Stack

**Mobile App:**
- Jest - Test runner
- React Native Testing Library - Component testing
- @testing-library/jest-native - Additional matchers

**Backend API:**
- Jest - Test runner
- Supertest - HTTP assertions (optional)
- ts-jest - TypeScript support

**Admin Panel:**
- Jest - Test runner
- React Testing Library - Component testing

---

## Mobile App Testing

### Setup

```bash
cd mobile-app
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest-expo
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- ProgressBar.test.tsx
```

### Test Structure

```
mobile-app/
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── __tests__/
│   │       │   ├── ProgressBar.test.tsx
│   │       │   ├── Button.test.tsx
│   │       │   ├── Badge.test.tsx
│   │       │   ├── Card.test.tsx
│   │       │   └── Modal.test.tsx
│   │       └── ProgressBar.tsx
│   └── test-utils/
│       └── index.tsx
├── e2e/
│   └── onboarding.e2e.test.ts
├── jest.config.js
└── jest.setup.js
```

### Writing Component Tests

```typescript
import { render, fireEvent } from '@/src/test-utils';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('handles press events', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button onPress={onPress}>Press</Button>);
    
    fireEvent.press(getByText('Press'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### Test Coverage Goals

- **Components:** 80%+ coverage
- **Utilities:** 90%+ coverage
- **Stores:** 80%+ coverage

---

## Backend API Testing

### Setup

```bash
cd backend-api
npm install --save-dev jest ts-jest @types/jest
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test suite
npm test -- product-matcher.test.ts
```

### Test Structure

```
backend-api/
├── src/
│   ├── services/
│   │   ├── __tests__/
│   │   │   └── product-matcher.test.ts
│   │   └── aggregation/
│   │       └── product-matcher.ts
│   ├── controllers/
│   │   ├── __tests__/
│   │   │   └── serbian-cuisine-controller.test.ts
│   │   └── serbian-cuisine-controller.ts
│   └── test-utils/
│       └── index.ts
├── jest.config.js
└── jest.setup.js
```

### Writing Service Tests

```typescript
import { ProductMatcher } from '../aggregation/product-matcher';

describe('ProductMatcher', () => {
  let matcher: ProductMatcher;

  beforeEach(() => {
    matcher = new ProductMatcher();
  });

  it('should match products by SKU', () => {
    const external = { sku: 'ABC-123', name: 'Product' };
    const internal = { sku: 'ABC-123', name: 'Product' };
    
    const match = matcher.matchBySKU(external, [internal]);
    expect(match).toEqual(internal);
  });
});
```

### Writing Controller Tests

```typescript
import { Request, Response } from 'express';
import { SerbianCuisineController } from '../serbian-cuisine-controller';

describe('SerbianCuisineController', () => {
  let controller: SerbianCuisineController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    controller = new SerbianCuisineController();
    mockReq = { query: {}, params: {}, body: {} };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  it('should return all dishes', async () => {
    await controller.getAllDishes(mockReq as Request, mockRes as Response);
    expect(mockRes.json).toHaveBeenCalled();
  });
});
```

### Test Coverage Goals

- **Services:** 80%+ coverage
- **Controllers:** 70%+ coverage
- **Utilities:** 90%+ coverage

---

## Admin Panel Testing

### Setup

```bash
cd admin-panel
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

### Test Structure

```
admin-panel/
├── components/
│   ├── __tests__/
│   │   ├── StatCard.test.tsx
│   │   ├── Table.test.tsx
│   │   └── Button.test.tsx
│   └── StatCard.tsx
└── app/
    └── __tests__/
        └── page.test.tsx
```

---

## Running Tests

### All Projects

```bash
# From root directory
npm run test:all

# Or individually
cd mobile-app && npm test
cd backend-api && npm test
cd admin-panel && npm test
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd mobile-app && npm install
          cd ../backend-api && npm install
          cd ../admin-panel && npm install
      
      - name: Run tests
        run: |
          cd mobile-app && npm test -- --coverage
          cd ../backend-api && npm test -- --coverage
          cd ../admin-panel && npm test -- --coverage
```

---

## Coverage Reports

### Viewing Coverage

```bash
# Generate coverage report
npm test -- --coverage

# Open HTML report
open coverage/lcov-report/index.html
```

### Coverage Thresholds

**Mobile App:**
```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```

**Backend API:**
```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```

---

## Best Practices

### 1. Test Naming

```typescript
// Good
describe('ProductMatcher', () => {
  describe('matchBySKU', () => {
    it('should match products with same SKU', () => {});
    it('should return null when no SKU match', () => {});
  });
});

// Bad
describe('Test', () => {
  it('works', () => {});
});
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should update user preferences', async () => {
  // Arrange
  const userId = 'test-user';
  const preferences = { prefers_local_cuisine: true };
  
  // Act
  const result = await service.updatePreferences(userId, preferences);
  
  // Assert
  expect(result.prefers_local_cuisine).toBe(true);
});
```

### 3. Mock External Dependencies

```typescript
jest.mock('../services/api', () => ({
  fetchData: jest.fn().mockResolvedValue({ data: 'test' }),
}));
```

### 4. Test Edge Cases

```typescript
describe('ProgressBar', () => {
  it('handles 0% progress', () => {});
  it('handles 100% progress', () => {});
  it('clamps negative values', () => {});
  it('clamps values over 100%', () => {});
});
```

### 5. Use Test Utilities

```typescript
// Use custom render with providers
import { render } from '@/src/test-utils';

// Use mock data generators
import { mockUser, mockProduct } from '@/src/test-utils';
```

### 6. Clean Up After Tests

```typescript
afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});
```

---

## Troubleshooting

### Common Issues

**Issue:** Tests timeout
```typescript
// Solution: Increase timeout
jest.setTimeout(10000);
```

**Issue:** Async tests not completing
```typescript
// Solution: Use async/await or return promise
it('should fetch data', async () => {
  await fetchData();
  expect(data).toBeDefined();
});
```

**Issue:** Mock not working
```typescript
// Solution: Ensure mock is before import
jest.mock('./module');
import { function } from './module';
```

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Last Updated:** January 3, 2026
