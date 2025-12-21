# Tests and Build Status

## Overview

This document summarizes the test coverage, build status, and recommendations for the project.

---

## Test Coverage by Module

### `ai-service`

**Status:** ✅ Tests implemented

**Test Files:**
- `ai-service/test_scoring.py` — Existing manual test script for ProductScorer
- `ai-service/tests/test_recommendation_service.py` — Integration tests (NEW)
  - Mock backend responses
  - Retry/fallback behavior
  - ML scoring enhancement
  - Dosage suggestion logic
- `ai-service/tests/test_ml_modules.py` — Unit tests for ML (NEW)
  - ProductScorer nutritional needs calculation
  - Meal distribution and macro allocation
  - Meal filtering and prioritization
  - Confidence scoring

**Commands:**
```bash
# Run all tests
cd ai-service
pytest tests/ test_scoring.py -v

# With coverage report
pytest tests/ --cov=app --cov-report=html

# Run specific test
pytest tests/test_recommendation_service.py::test_get_ai_recommendations_success -v
```

**Coverage Target:** 80%+

---

### `backend-api`

**Status:** ⚠️ No tests found

**Recommendation:**
- Add vitest/jest test suite for controllers and services
- Priority: recommendation-controller, nutrition-controller, auth middleware
- Use supertest for endpoint testing

**Suggested Structure:**
```
backend-api/
  tests/
    unit/
      services/
        recommendation.service.test.ts
        nutrition.service.test.ts
      controllers/
        recommendation.controller.test.ts
    integration/
      api/
        recommendations.integration.test.ts
```

**Commands to setup:**
```bash
cd backend-api
npm test
npm run test:coverage
```

---

### `mobile-app`

**Status:** ⚠️ No tests found

**Recommendation:**
- Add Jest tests for service layer and hooks
- Priority: API service mocking, auth flow, health-profile logic

**Suggested Structure:**
```
mobile-app/
  src/
    __tests__/
      services/
        health-profile-service.test.ts
        recommendations-service.test.ts
      hooks/
        useHealthProfile.test.ts
```

**Commands to setup:**
```bash
cd mobile-app
npm test
npm test -- --coverage
```

---

## Build & Linting Status

### `ai-service`

**Linting & Type Checking:**
```bash
# Format code
black app/ tests/

# Check linting
ruff check app/ tests/

# Type checking
mypy app/
```

**Build:**
```bash
# Verify imports
python -m py_compile app/main.py app/services/recommendation_service.py

# Run manual test
python test_scoring.py
```

---

### `backend-api`

**Build Status:**
```bash
# Type check
npm run build

# ESLint
npm run lint

# Type checking (additional)
npm run type-check
```

---

### `mobile-app`

**Build Status:**
```bash
# Type check
npm run type-check

# ESLint
npm run lint
```

---

## CI/CD Recommendations

### GitHub Actions Workflow Example

Create `.github/workflows/test.yml`:

```yaml
name: Test & Build

on: [push, pull_request]

jobs:
  ai-service:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -r ai-service/requirements-dev.txt
      - run: cd ai-service && pytest --cov=app
      - run: cd ai-service && black --check app/
      - run: cd ai-service && ruff check app/
      - run: cd ai-service && mypy app/

  backend-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend-api && npm install
      - run: cd backend-api && npm run build
      - run: cd backend-api && npm run lint
      - run: cd backend-api && npm test

  mobile-app:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd mobile-app && npm install
      - run: cd mobile-app && npm run type-check
      - run: cd mobile-app && npm run lint
```

---

## Quick Test Run (Local)

### Prerequisites
- Python 3.11+ (for ai-service)
- Node.js 18+ (for backend-api, mobile-app)
- pip, npm

### ai-service Tests

```bash
cd ai-service

# Install dev dependencies
pip install -r requirements-dev.txt

# Run tests
pytest tests/ -v --tb=short

# Run with coverage
pytest tests/ --cov=app --cov-report=term-missing

# Run specific test
pytest tests/test_ml_modules.py::TestProductScorer::test_calculate_score_high_protein_for_mass -v
```

### backend-api Build

```bash
cd backend-api

# Install dependencies
npm install

# Type check & build
npm run build

# Lint
npm run lint

# TODO: Add tests
npm test
```

### mobile-app Build

```bash
cd mobile-app

# Install dependencies
npm install

# Type check
npm run type-check

# Lint
npm run lint
```

---

## Test Execution Matrix

| Module | Unit Tests | Integration | Lint | Type Check | Build | Status |
|--------|:----------:|:-----------:|:----:|:----------:|:-----:|:------:|
| ai-service | ✅ | ✅ | ✅ (via script) | ✅ (via script) | ✅ | Ready |
| backend-api | ❌ | ❌ | ❌ | ✅ | ✅ | Partial |
| mobile-app | ❌ | ❌ | ❌ | ✅ | ✅ | Partial |

---

## Priority Actions

### Week 1
- [ ] Run `ai-service` tests locally and verify passing
- [ ] Add basic test scaffolding for `backend-api` (recommendation controller)
- [ ] Set up GitHub Actions CI pipeline (at least for ai-service)

### Week 2
- [ ] Implement 10+ controller tests for backend-api
- [ ] Implement service tests for mobile-app
- [ ] Increase test coverage to 60%+ for ai-service

### Week 3
- [ ] 80%+ test coverage for critical paths
- [ ] Full CI/CD pipeline operational
- [ ] Daily test runs on main branch

---

## Known Issues & Workarounds

1. **ML Config Loading:** If `app/ml_config.json` is missing, code falls back to embedded defaults. Log messages indicate status.
2. **Async Tests:** Use `@pytest.mark.asyncio` decorator for async test functions.
3. **Mock Backend:** All tests for RecommendationService use mocks; no real database required.

---

## Next Steps

1. Run existing tests: `cd ai-service && pytest -v`
2. Implement backend-api tests (high priority)
3. Set up CI/CD pipeline
4. Establish minimum 80% coverage policy
