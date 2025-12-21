# E2E Testing Guide - Sport & Food App

## Overview

This guide covers End-to-End (E2E) testing using **Playwright** for the Sport & Food application.

**Status:** 40+ E2E tests across 5 critical user flows
**Coverage:** Registration, Login, Health Profile, Meal Planning, Shopping
**Framework:** Playwright 1.40+
**Browsers:** Chromium, Firefox, WebKit
**Execution Time:** ~2-3 minutes (parallel)

---

## What Are E2E Tests?

E2E tests simulate real user interactions with the complete application:
- ✅ User workflows from start to finish
- ✅ Cross-page navigation
- ✅ API integration
- ✅ Form submissions
- ✅ Error handling
- ✅ Session management

Unlike unit tests, E2E tests:
- Test the whole system together
- Use a real (or simulated) browser
- Validate user experience
- Catch integration issues

---

## Test Structure

```
backend-api/src/e2e-tests/
├── auth.e2e.ts                # Authentication (Registration, Login, Logout)
├── health-profile.e2e.ts       # Health setup flow
├── meal-planning.e2e.ts        # Meal recommendations & planning
├── shopping.e2e.ts             # Products & shopping list
└── general.e2e.ts              # API integration, navigation, performance
```

### Test Files Breakdown

#### 1. **auth.e2e.ts** (18 tests)
```
✅ Registration Flow (7 tests)
  - Display registration page
  - Email format validation
  - Password strength validation
  - Duplicate email prevention
  - Successful registration
  - Required field validation
  - Login link navigation

✅ Login Flow (5 tests)
  - Display login page
  - Credential validation
  - Successful login
  - Session persistence
  - Forgot password link

✅ Logout Flow (2 tests)
  - Logout redirect to login
  - Session token clearing
```

#### 2. **health-profile.e2e.ts** (13 tests)
```
✅ Health Profile Setup (13 tests)
  - Display health profile page
  - Age validation (18-120)
  - Height validation (cm)
  - Weight validation (kg)
  - Gender and activity level selection
  - Fitness goal selection
  - Dietary restrictions handling
  - Allergen management (add/remove)
  - Nutritional goals calculation
  - Save health profile
  - Pre-fill existing data
```

#### 3. **meal-planning.e2e.ts** (14 tests)
```
✅ Meal Planning (14 tests)
  - Display meal recommendations
  - Search meals by name
  - Filter by calorie range
  - Filter by macro nutrients
  - Filter by dietary restrictions
  - Add meal to plan
  - View daily nutrition summary
  - Track nutrition progress
  - Remove meal from plan
  - Generate AI meal plan
  - Weekly meal plan view
  - Export meal plan (PDF/CSV)
```

#### 4. **shopping.e2e.ts** (18 tests)
```
✅ Shopping & Products (18 tests)
  - Display product list
  - Search by product name
  - Search by barcode
  - Filter by category
  - Show product nutrition details
  - Add product to shopping list
  - Adjust product quantity
  - Remove from shopping list
  - Show stores & prices
  - Compare prices across stores
  - Calculate shopping list total
  - Optimize shopping list
  - Checkout from list
  - Filter by allergens
```

#### 5. **general.e2e.ts** (15+ tests)
```
✅ API Integration (5 tests)
  - Handle API timeout gracefully
  - Retry failed API requests
  - Handle 404 errors
  - Handle 500 errors with retry

✅ Navigation (4 tests)
  - Navigate between main pages
  - Handle browser back button
  - Maintain scroll position
  - Show breadcrumb navigation

✅ Session Management (3 tests)
  - Handle session expiry
  - Manual logout from all pages
  - Redirect unauthenticated users

✅ Performance & Load Times (3 tests)
  - Load pages within acceptable time (<5s)
  - No unnecessary API calls
  - Cache API responses

✅ Error Messages & Feedback (3 tests)
  - Show clear validation errors
  - Show success messages
  - Dismiss notification messages
```

---

## Installation & Setup

### 1. Install Dependencies

```bash
cd backend-api

# Install Playwright
npm install --save-dev @playwright/test

# Install other dependencies if needed
npm install --save-dev @playwright/test dotenv
```

### 2. Install Browsers

```bash
# Install browser binaries
npx playwright install

# Or install specific browsers
npx playwright install chromium firefox webkit
```

### 3. Verify Installation

```bash
npx playwright --version
# Should output: Version X.X.X
```

---

## Running E2E Tests

### Run All Tests
```bash
npm run test:e2e

# Or with npm
npx playwright test
```

### Run Specific Test File
```bash
npx playwright test src/e2e-tests/auth.e2e.ts
```

### Run Specific Test
```bash
npx playwright test -g "should successfully register new user"
```

### Run in Headed Mode (See Browser)
```bash
npx playwright test --headed
```

### Run in Debug Mode (Step Through)
```bash
npx playwright test --debug
```

### Run on Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run Tests in Parallel (Faster)
```bash
# Default: parallel with 4 workers
npx playwright test

# Custom worker count
npx playwright test --workers=8
```

### Run Sequential (Slower, Better for Debugging)
```bash
npx playwright test --workers=1
```

---

## Test Reports

### HTML Report
```bash
# After running tests
npx playwright show-report

# Opens in browser at: playwright-report/index.html
```

### JSON Report
```bash
# Generate JSON report
npx playwright test --reporter=json

# View in: test-results/results.json
```

### JUnit Report (CI/CD)
```bash
# Generate JUnit XML
npx playwright test --reporter=junit

# Used by CI systems like GitHub Actions
```

---

## Configuration

### playwright.config.ts

Key settings:
```typescript
{
  // Test timeout per test: 30 seconds
  timeout: 30000,

  // Global timeout: 5 minutes
  globalTimeout: 5 * 60 * 1000,

  // Base URL (test endpoints)
  baseURL: 'http://localhost:3000',

  // Screenshot on failure
  screenshot: 'only-on-failure',

  // Video on failure
  video: 'retain-on-failure',

  // Trace for debugging
  trace: 'on-first-failure',

  // Browsers to test
  projects: [
    'chromium',
    'firefox',
    'webkit',
    'Mobile Chrome',
    'Mobile Safari',
  ],
}
```

### Environment Variables

Create `.env.test`:
```bash
BASE_URL=http://localhost:3000
API_URL=http://localhost:3000/api
TEST_EMAIL=test@example.com
TEST_PASSWORD=ValidPassword123!
```

Load in tests:
```typescript
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
```

---

## Common Testing Patterns

### Pattern 1: Authentication
```typescript
test.beforeEach(async ({ page }) => {
  // Login before each test
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'ValidPassword123!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
});
```

### Pattern 2: Form Submission & Validation
```typescript
test('should validate form input', async ({ page }) => {
  await page.goto('/health-profile');
  
  // Fill form
  await page.fill('input[name="age"]', '15');
  await page.click('button[type="submit"]');
  
  // Check error
  const error = page.locator('text=/age.*18/i');
  await expect(error).toBeVisible({ timeout: 5000 });
});
```

### Pattern 3: Waiting for Elements
```typescript
// Wait for element to be visible
await expect(page.locator('[data-testid="meal-list"]')).toBeVisible({
  timeout: 10000
});

// Wait for navigation
await page.waitForNavigation();

// Wait for network to be idle
await page.waitForLoadState('networkidle');
```

### Pattern 4: API Call Interception
```typescript
page.on('response', response => {
  if (response.url().includes('/api/meals')) {
    console.log('Status:', response.status());
    console.log('URL:', response.url());
  }
});
```

### Pattern 5: Screenshots & Debugging
```typescript
test('should take screenshot on failure', async ({ page }) => {
  // Playwright automatically takes screenshot on failure
  
  // Or manually
  await page.screenshot({ path: 'debug.png' });
});
```

---

## Best Practices

### ✅ DO

1. **Use data-testid attributes**
   ```html
   <button data-testid="submit-button">Submit</button>
   ```
   ```typescript
   await page.click('[data-testid="submit-button"]');
   ```

2. **Wait for elements properly**
   ```typescript
   // Good
   await expect(element).toBeVisible({ timeout: 5000 });
   
   // Avoid
   await page.waitForTimeout(2000); // Hard-coded delay
   ```

3. **Use descriptive test names**
   ```typescript
   // Good
   test('should validate age must be between 18 and 120', ...)
   
   // Bad
   test('age validation', ...)
   ```

4. **Test user scenarios, not implementation**
   ```typescript
   // Good - user perspective
   test('should show health profile after login', ...)
   
   // Bad - implementation detail
   test('should call setUserHealthProfile action', ...)
   ```

5. **Organize tests with describe blocks**
   ```typescript
   test.describe('User Registration', () => {
     test('should validate email', ...)
     test('should validate password', ...)
   })
   ```

### ❌ DON'T

1. **Hard-code delays**
   ```typescript
   // Bad
   await page.waitForTimeout(3000);
   
   // Good
   await page.waitForLoadState('networkidle');
   ```

2. **Test implementation details**
   ```typescript
   // Bad
   expect(store.getState().user.id).toBe(123);
   
   // Good
   await expect(page.locator('text="John Doe"')).toBeVisible();
   ```

3. **Ignore errors**
   ```typescript
   // Bad
   try { await element.click() } catch (e) {}
   
   // Good
   if (await element.isVisible()) {
     await element.click();
   }
   ```

4. **Share state between tests**
   ```typescript
   // Bad - global state
   let user;
   test('register', () => { user = register(); })
   test('login', () => { login(user); })
   
   // Good - independent tests
   test('register', () => { ... })
   test('login', () => { ... })
   ```

---

## Troubleshooting

### Tests Timeout
```bash
# Increase timeout
npx playwright test --timeout=60000

# Check if backend is running
curl http://localhost:3000/health
```

### Element Not Found
```typescript
// Debug: show page content
await page.pause(); // Opens debugger

// Or log page content
console.log(await page.content());

// Or screenshot
await page.screenshot({ path: 'debug.png' });
```

### Navigation Timeout
```typescript
// Add longer timeout for navigation
await page.goto('/url', { waitUntil: 'networkidle', timeout: 30000 });

// Or wait for specific element
await expect(page.locator('[data-testid="content"]')).toBeVisible();
```

### Flaky Tests (Intermittent Failures)
```typescript
// Wait for network to be idle
await page.waitForLoadState('networkidle');

// Or wait for specific element
await expect(element).toBeVisible({ timeout: 10000 });

// Not this (hard delay)
await page.waitForTimeout(1000);
```

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/e2e.yml`:
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npx playwright install
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### GitLab CI

Create `.gitlab-ci.yml`:
```yaml
e2e-tests:
  image: mcr.microsoft.com/playwright:v1.40.0-focal
  script:
    - npm install
    - npx playwright test
  artifacts:
    paths:
      - playwright-report/
    when: always
```

---

## Performance Testing with E2E

Measure load times:
```typescript
test('should load meal page in <3 seconds', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/meals');
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(3000);
});
```

Monitor API calls:
```typescript
let apiCallCount = 0;
page.on('response', response => {
  if (response.url().includes('/api/')) {
    apiCallCount++;
  }
});

await page.goto('/meals');
expect(apiCallCount).toBeLessThan(10);
```

---

## Extending Tests

### Add New Test File

1. Create file in `src/e2e-tests/feature.e2e.ts`
2. Use existing patterns
3. Run: `npx playwright test src/e2e-tests/feature.e2e.ts`

### Add Test to Existing File

```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup
  });

  test('should test specific behavior', async ({ page }) => {
    // Test steps
    // Assertions
  });
});
```

### Add Helper Functions

Create `src/e2e-tests/helpers.ts`:
```typescript
export async function login(page, email, password) {
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
}

export async function setupHealthProfile(page) {
  await page.goto('/health-profile');
  await page.fill('input[name="age"]', '30');
  await page.fill('input[name="height"]', '175');
  await page.fill('input[name="weight"]', '75');
  await page.click('button[type="submit"]');
}
```

---

## Maintenance

### Update Selectors
When UI changes, update selectors:
```bash
# Find all selector references
grep -r "data-testid=" src/

# Or use Playwright Inspector
npx playwright test --debug
```

### Remove Flaky Tests
If a test is unreliable:
1. Identify the cause (timing, API, network)
2. Add proper waits
3. Consider refactoring UI for testability
4. Last resort: skip with `test.skip`

### Add Retry Logic
For flaky tests (last resort):
```typescript
test.describe('Flaky Feature', () => {
  test.describe.configure({ retries: 2 });
  
  test('might fail intermittently', async ({ page }) => {
    // ...
  });
});
```

---

## Success Metrics

✅ **Goal:** 40+ E2E tests covering critical flows

**Current Status:**
- Registration Flow: 7 tests
- Login Flow: 5 tests
- Logout Flow: 2 tests
- Health Profile: 13 tests
- Meal Planning: 14 tests
- Shopping: 18 tests
- General (API, Navigation, Performance): 15+ tests

**Total: 74+ E2E tests**

---

## Quick Reference

```bash
# Installation
npm install --save-dev @playwright/test
npx playwright install

# Run tests
npx playwright test                    # All tests
npx playwright test --headed           # See browser
npx playwright test --debug            # Debug mode
npx playwright test --project=firefox  # Specific browser

# View reports
npx playwright show-report

# Update snapshots (if using visual testing)
npx playwright test --update-snapshots
```

---

**Last Updated:** Week 3, Day 1
**Next Steps:** Create performance tests, production deployment guide
